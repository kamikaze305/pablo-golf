import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { io, Socket } from 'socket.io-client';
import { GameState, Player, GameAction, RoomSettings } from '@pablo/engine';

interface GameStore {
  // Connection state
  socket: Socket | null;
  isConnected: boolean;
  roomId: string | null;
  playerId: string | null;
  
  // Game state
  gameState: GameState | null;
  currentPlayer: Player | null;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  showCreateRoomModal: boolean;
  showJoinRoomModal: boolean;
  
  // Actions
  connect: () => void;
  disconnect: () => void;
  autoReconnect: () => Promise<boolean>;
  createRoom: (settings: RoomSettings, player: Player) => Promise<void>;
  joinRoom: (roomKey: string, player: Player, password?: string) => Promise<void>;
  leaveRoom: () => void;
  executeAction: (action: GameAction) => void;
  sendChatMessage: (text: string) => void;
  
  // UI actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  showCreateRoom: () => void;
  hideCreateRoom: () => void;
  showJoinRoom: () => void;
  hideJoinRoom: () => void;
}

// Use production config in production, fallback to localhost for development
const SOCKET_URL = import.meta.env.PROD 
  ? 'https://your-server-name-production.up.railway.app' // Replace with your actual Railway server URL
  : (import.meta.env.VITE_SOCKET_URL || 'http://localhost:4001');

// Session persistence keys
const SESSION_KEYS = {
  ROOM_ID: 'pablo_room_id',
  PLAYER_ID: 'pablo_player_id',
  PLAYER_NAME: 'pablo_player_name',
  ROOM_KEY: 'pablo_room_key'
};

// Helper functions for session persistence
const saveSession = (roomId: string, playerId: string, playerName: string, roomKey: string) => {
  localStorage.setItem(SESSION_KEYS.ROOM_ID, roomId);
  localStorage.setItem(SESSION_KEYS.PLAYER_ID, playerId);
  localStorage.setItem(SESSION_KEYS.PLAYER_NAME, playerName);
  localStorage.setItem(SESSION_KEYS.ROOM_KEY, roomKey);
};

const loadSession = () => {
  const roomId = localStorage.getItem(SESSION_KEYS.ROOM_ID);
  const playerId = localStorage.getItem(SESSION_KEYS.PLAYER_ID);
  const playerName = localStorage.getItem(SESSION_KEYS.PLAYER_NAME);
  const roomKey = localStorage.getItem(SESSION_KEYS.ROOM_KEY);
  
  if (roomId && playerId && playerName && roomKey) {
    return { roomId, playerId, playerName, roomKey };
  }
  return null;
};

const clearSession = () => {
  localStorage.removeItem(SESSION_KEYS.ROOM_ID);
  localStorage.removeItem(SESSION_KEYS.PLAYER_ID);
  localStorage.removeItem(SESSION_KEYS.PLAYER_NAME);
  localStorage.removeItem(SESSION_KEYS.ROOM_KEY);
};

export const useGameStore = create<GameStore>()(
  subscribeWithSelector((set, get) => {
    // Try to restore session on store creation
    const savedSession = loadSession();
    
    return {
      // Initial state
      socket: null,
      isConnected: false,
      roomId: savedSession?.roomId || null,
      playerId: savedSession?.playerId || null,
      gameState: null,
      currentPlayer: null,
      isLoading: false,
      error: null,
      showCreateRoomModal: false,
      showJoinRoomModal: false,

    // Connection actions
    connect: () => {
      const socket = io(SOCKET_URL, {
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      socket.on('connect', () => {
        set({ isConnected: true, error: null });
        console.log('Connected to server');
      });

      socket.on('disconnect', () => {
        set({ isConnected: false });
        console.log('Disconnected from server');
      });

      socket.on('error', (data: { message: string }) => {
        set({ error: data.message });
        console.error('Socket error:', data.message);
      });

      socket.on('state:patch', (gameState: GameState) => {
        console.log('GameStore: Received state:patch event');
        console.log('GameStore: Current playerId in store:', get().playerId);
        console.log('GameStore: Players in received state:', gameState.players.map((p: Player) => ({ id: p.id, name: p.name, isHost: p.isHost })));
        
        set({ gameState });
        
        // Update current player if we have a playerId
        const { playerId } = get();
        if (playerId) {
          const currentPlayer = gameState.players.find((p: Player) => p.id === playerId);
          console.log('GameStore: Found currentPlayer:', currentPlayer);
          set({ currentPlayer: currentPlayer || null });
        } else {
          console.log('GameStore: No playerId in store, cannot set currentPlayer');
        }
      });

      socket.on('round:started', (gameState: GameState) => {
        set({ gameState });
        console.log('Round started');
      });

      socket.on('turn:you', (_data: { playerId: string }) => {
        console.log('Your turn!');
        // Could add a notification here
      });

      socket.on('turn:result', (data: { action: GameAction; state: GameState }) => {
        set({ gameState: data.state });
        console.log('Turn result:', data.action);
      });

      socket.on('round:scored', (data: { state: GameState; result: any }) => {
        set({ gameState: data.state });
        console.log('Round scored:', data.result);
      });

      socket.on('game:reset', (data: { state: GameState }) => {
        set({ gameState: data.state });
        console.log('Game reset successfully:', data.state);
      });

      socket.on('pablo:called', (data: { callerId: string }) => {
        console.log('Pablo called by:', data.callerId);
        // Could add a notification here
      });

      socket.on('chat:message', (message: any) => {
        console.log('Chat message:', message);
        // Could add chat state management here
      });

      set({ socket });
    },

    disconnect: () => {
      const { socket } = get();
      if (socket) {
        socket.disconnect();
        set({ 
          socket: null, 
          isConnected: false, 
          roomId: null, 
          playerId: null,
          gameState: null,
          currentPlayer: null 
        });
      }
    },

    autoReconnect: async () => {
      const savedSession = loadSession();
      if (!savedSession) {
        console.log('GameStore: No saved session found');
        return false;
      }

      // Don't attempt to reconnect if we're already in a room
      const currentState = get();
      if (currentState.roomId || currentState.gameState) {
        console.log('GameStore: Already in a room, skipping auto-reconnect');
        return true; // Consider this a successful "reconnect" since we're already connected
      }

      console.log('GameStore: Attempting to auto-reconnect with saved session:', savedSession);
      
      try {
        // First connect to socket
        const { connect } = get();
        connect();
        
        // Wait a bit for connection
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Create player object from saved session
        const player: Player = {
          id: savedSession.playerId,
          name: savedSession.playerName,
          isHost: false, // Will be updated by server
          isConnected: true,
          totalScore: 0,
          roundScore: 0,
          cards: []
        };
        
        // Try to rejoin the room
        await get().joinRoom(savedSession.roomKey, player);
        console.log('GameStore: Auto-reconnect successful');
        return true;
      } catch (error) {
        console.error('GameStore: Auto-reconnect failed:', error);
        // Clear invalid session
        clearSession();
        return false;
      }
    },

    createRoom: async (settings: RoomSettings, player: Player) => {
      const { socket } = get();
      if (!socket) throw new Error('Not connected');

      console.log('GameStore: Starting room creation with player:', { id: player.id, name: player.name, isHost: player.isHost });
      set({ isLoading: true, error: null });

      return new Promise((resolve, reject) => {
        console.log('GameStore: Emitting room:create event...');
        
        // Add timeout to prevent hanging
        const timeout = setTimeout(() => {
          console.error('GameStore: Room creation timeout');
          set({ error: 'Room creation timed out', isLoading: false });
          reject(new Error('Room creation timeout'));
        }, 10000); // 10 second timeout
        
        socket.emit('room:create', { settings, player }, (response: any) => {
          clearTimeout(timeout);
          console.log('GameStore: Received response:', response);
          if (response.error) {
            set({ error: response.error, isLoading: false });
            reject(new Error(response.error));
          } else {
            console.log('GameStore: Room created successfully, setting playerId to:', player.id);
            // Save session data
            saveSession(response.roomId, player.id, player.name, response.roomKey);
            set({ 
              roomId: response.roomId, 
              playerId: player.id,
              isLoading: false,
              showCreateRoomModal: false 
            });
            resolve();
          }
        });
      });
    },

    joinRoom: async (roomKey: string, player: Player, password?: string) => {
      const { socket } = get();
      if (!socket) throw new Error('Not connected');

      console.log('GameStore: Joining room with player:', { id: player.id, name: player.name, isHost: player.isHost });
      set({ isLoading: true, error: null });

      return new Promise((resolve, reject) => {
        socket.emit('room:join', { roomKey, player, password }, (response: any) => {
          if (response.error) {
            set({ error: response.error, isLoading: false });
            reject(new Error(response.error));
          } else {
            console.log('GameStore: Room joined successfully, setting playerId to:', player.id);
            // Save session data
            saveSession(response.roomId, player.id, player.name, roomKey);
            set({ 
              roomId: response.roomId, 
              playerId: player.id,
              isLoading: false,
              showJoinRoomModal: false 
            });
            resolve();
          }
        });
      });
    },

    leaveRoom: () => {
      const { socket } = get();
      if (socket) {
        socket.emit('room:leave');
        // Clear session data
        clearSession();
        set({ 
          roomId: null, 
          playerId: null,
          gameState: null,
          currentPlayer: null 
        });
      }
    },

    executeAction: (action: GameAction) => {
      const { socket } = get();
      if (!socket) return;

      console.log('GameStore: executeAction called with:', action);

      switch (action.type) {
        case 'startRound':
          socket.emit('game:startRound');
          break;
        case 'draw':
          socket.emit('turn:draw', { source: action.source });
          break;
        case 'replace':
          socket.emit('turn:replace', { 
            cardIndex: action.cardIndex, 
            card: action.card 
          });
          break;
        case 'discard':
          socket.emit('turn:discard');
          break;
        case 'power':
          socket.emit('turn:playPower', { 
            powerType: action.powerType, 
            payload: action.payload 
          });
          break;
        case 'callPablo':
          socket.emit('turn:callPablo');
          break;
        case 'pabloWindow':
          socket.emit('turn:pabloWindow');
          break;
        case 'endRound':
          socket.emit('game:endRound');
          break;
        case 'peekCard':
          socket.emit('game:peekCard', { cardIndex: action.cardIndex });
          break;
        case 'playerReady':
          socket.emit('game:playerReady');
          break;
        case 'resetGame':
          socket.emit('game:resetGame');
          break;
        default:
          console.warn('GameStore: Unknown action type:', (action as any).type);
      }
    },

    sendChatMessage: (text: string) => {
      const { socket } = get();
      if (socket) {
        socket.emit('chat:post', { text });
      }
    },

    // UI actions
    setLoading: (loading: boolean) => set({ isLoading: loading }),
    setError: (error: string | null) => set({ error }),
    showCreateRoom: () => set({ showCreateRoomModal: true }),
    hideCreateRoom: () => set({ showCreateRoomModal: false }),
    showJoinRoom: () => set({ showJoinRoomModal: true }),
    hideJoinRoom: () => set({ showJoinRoomModal: false }),
  };
  }));
