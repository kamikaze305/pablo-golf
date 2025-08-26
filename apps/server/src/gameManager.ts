import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { PabloGameEngine, RoomSettings, Player, GameState, GameAction } from '@pablo/engine';

interface Room {
  id: string;
  settings: RoomSettings;
  engine: PabloGameEngine;
  players: Map<string, Player>;
  sockets: Map<string, Socket>;
  createdAt: Date;
  lastActivity: Date;
}

export class GameManager {
  private rooms: Map<string, Room> = new Map();
  private playerToRoom: Map<string, string> = new Map();
  private maxRooms: number;
  private maxPlayersPerRoom: number;
  private maxConnections: number;

  constructor() {
    this.maxRooms = parseInt(process.env.MAX_ROOMS || '50');
    this.maxPlayersPerRoom = parseInt(process.env.MAX_PLAYERS_PER_ROOM || '5');
    this.maxConnections = parseInt(process.env.MAX_CONNECTIONS || '300');
  }

  createRoom(settings: RoomSettings, hostPlayer: Player): string {
    if (this.rooms.size >= this.maxRooms) {
      throw new Error('Maximum number of rooms reached');
    }

    const roomId = uuidv4();
    const roomSettings: RoomSettings = {
      ...settings,
      roomKey: settings.roomKey || this.generateRoomKey()
    };

    const engine = new PabloGameEngine(roomId, roomSettings, [hostPlayer]);
    const players = new Map<string, Player>();
    const sockets = new Map<string, Socket>();

    players.set(hostPlayer.id, hostPlayer);

    const room: Room = {
      id: roomId,
      settings: roomSettings,
      engine,
      players,
      sockets,
      createdAt: new Date(),
      lastActivity: new Date()
    };

    this.rooms.set(roomId, room);
    this.playerToRoom.set(hostPlayer.id, roomId);

    console.log(`Room created: ${roomId} by ${hostPlayer.name}`);
    return roomId;
  }

  joinRoom(roomKey: string, player: Player, password?: string): string {
    const room = this.findRoomByKey(roomKey);
    if (!room) {
      throw new Error('Room not found');
    }

    if (room.settings.joinPassword && room.settings.joinPassword !== password) {
      throw new Error('Invalid password');
    }

    if (room.players.size >= room.settings.maxPlayers) {
      throw new Error('Room is full');
    }

    if (room.engine.getState().gamePhase !== 'waiting') {
      throw new Error('Game already in progress');
    }

    // Ensure joining player is NOT marked as host
    const joiningPlayer = { ...player, isHost: false };
    room.players.set(joiningPlayer.id, joiningPlayer);
    this.playerToRoom.set(joiningPlayer.id, room.id);
    
    // Add player to the game engine's state
    room.engine.addPlayer(joiningPlayer);
    
    room.lastActivity = new Date();

    // Player join logging moved to socketHandlers.ts
    return room.id;
  }

  leaveRoom(playerId: string): void {
    const roomId = this.playerToRoom.get(playerId);
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    if (!room) return;

    const leavingPlayer = room.players.get(playerId);
    const wasHost = leavingPlayer?.isHost;

    // Mark player as disconnected but keep them in the room
    if (leavingPlayer) {
      leavingPlayer.isConnected = false;
      room.players.set(playerId, leavingPlayer);
    }

    room.sockets.delete(playerId);
    this.playerToRoom.delete(playerId);
    
    // Don't remove player from game engine - keep their cards visible
    // room.engine.removePlayer(playerId);

    // If no players left, delete the room
    if (room.players.size === 0) {
      this.rooms.delete(roomId);
      console.log(`Room ${roomId} deleted (no players left)`);
    } else {
      // If host left, randomly assign new host from remaining connected players
      if (wasHost) {
        const connectedPlayers = Array.from(room.players.values()).filter(p => p.isConnected);
        if (connectedPlayers.length > 0) {
          // Randomly select a new host
          const randomIndex = Math.floor(Math.random() * connectedPlayers.length);
          const newHost = connectedPlayers[randomIndex];
          newHost.isHost = true;
          room.players.set(newHost.id, newHost);
          console.log(`New host assigned: ${newHost.name} (${newHost.id})`);
        }
      }
      room.lastActivity = new Date();
    }

    console.log(`Player ${playerId} left room ${roomId} (marked as disconnected)`);
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  getRoomForPlayer(playerId: string): Room | undefined {
    const roomId = this.playerToRoom.get(playerId);
    return roomId ? this.rooms.get(roomId) : undefined;
  }

  getGameState(roomId: string, playerId?: string): GameState | undefined {
    const room = this.rooms.get(roomId);
    if (!room) return undefined;

    if (playerId) {
      return room.engine.getStateForPlayer(playerId);
    }
    return room.engine.getState();
  }

  executeGameAction(roomId: string, action: GameAction): GameState | undefined {
    const room = this.rooms.get(roomId);
    if (!room) return undefined;

    try {
      const newState = room.engine.executeAction(action);
      room.lastActivity = new Date();
      return newState;
    } catch (error) {
      console.error('Game action error:', error);
      throw error;
    }
  }

  addSocketToRoom(roomId: string, playerId: string, socket: Socket): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.sockets.set(playerId, socket);
    }
  }

  removeSocketFromRoom(roomId: string, playerId: string): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.sockets.delete(playerId);
    }
  }

  broadcastToRoom(roomId: string, event: string, data: any, excludePlayerId?: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.sockets.forEach((socket, playerId) => {
      if (playerId !== excludePlayerId) {
        socket.emit(event, data);
      }
    });
  }

  getRoomStats(): { totalRooms: number; totalPlayers: number; activeRooms: number } {
    let totalPlayers = 0;
    let activeRooms = 0;

    this.rooms.forEach(room => {
      totalPlayers += room.players.size;
      if (room.players.size > 0) {
        activeRooms++;
      }
    });

    return {
      totalRooms: this.rooms.size,
      totalPlayers,
      activeRooms
    };
  }

  cleanupInactiveRooms(maxAgeHours: number = 24): void {
    const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
    const roomsToDelete: string[] = [];

    this.rooms.forEach((room, roomId) => {
      if (room.lastActivity < cutoff && room.players.size === 0) {
        roomsToDelete.push(roomId);
      }
    });

    roomsToDelete.forEach(roomId => {
      this.rooms.delete(roomId);
      console.log(`Cleaned up inactive room: ${roomId}`);
    });
  }

  private findRoomByKey(roomKey: string): Room | undefined {
    for (const room of this.rooms.values()) {
      if (room.settings.roomKey === roomKey) {
        return room;
      }
    }
    return undefined;
  }

  private generateRoomKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // QA methods
  getQARoomData(roomId: string): any {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    return {
      id: room.id,
      settings: room.settings,
      state: room.engine.getState(),
      players: Array.from(room.players.values()),
      createdAt: room.createdAt,
      lastActivity: room.lastActivity
    };
  }

  getAllRoomsForQA(): any[] {
    return Array.from(this.rooms.values()).map(room => ({
      id: room.id,
      key: room.settings.roomKey,
      playerCount: room.players.size,
      gamePhase: room.engine.getState().gamePhase,
      createdAt: room.createdAt,
      lastActivity: room.lastActivity
    }));
  }
}
