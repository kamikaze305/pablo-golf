import { Server, Socket } from 'socket.io';
import { GameManager } from './gameManager';
import { QAManager } from './qaManager';
import { Player, GameAction, RoomSettings } from '@pablo/engine';

interface SocketData {
  playerId?: string;
  roomId?: string;
  isQA?: boolean;
}

export function setupSocketHandlers(io: Server, gameManager: GameManager, qaManager: QAManager): void {
  // Helper function to send player-specific game states to all players in a room
  const broadcastGameStateToRoom = (roomId: string, excludePlayerId?: string) => {
    const room = gameManager.getRoom(roomId);
    if (room) {
      console.log(`Server: Broadcasting to room ${roomId}, excluding player ${excludePlayerId}`);
      console.log(`Server: Room has ${room.sockets.size} sockets`);
      room.sockets.forEach((socket, playerId) => {
        if (playerId !== excludePlayerId) {
          const playerGameState = gameManager.getGameState(roomId, playerId);
          console.log(`Server: Sending filtered state to player ${playerId}, state has ${playerGameState?.players.length} players`);
          if (playerGameState) {
            socket.emit('state:patch', playerGameState);
          }
        }
      });
    }
  };

  io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Room creation
    socket.on('room:create', async (data: { settings: RoomSettings; player: Player }, callback: (response: any) => void) => {
      try {
        console.log('Server: Received room:create request:', { settings: data.settings, player: data.player.name });
        
        const { settings, player } = data;
        const roomId = gameManager.createRoom(settings, player);
        
        console.log('Server: Room created with ID:', roomId);
        
        socket.data = { playerId: player.id, roomId };
        socket.join(roomId);
        gameManager.addSocketToRoom(roomId, player.id, socket);

        // Send room created confirmation via callback
        const response = { roomId, roomKey: settings.roomKey };
        console.log('Server: Sending callback response:', response);
        callback(response);

        // Send player-specific game state to the host player
        const playerGameState = gameManager.getGameState(roomId, player.id);
        if (playerGameState) {
          socket.emit('state:patch', playerGameState);
        }

        console.log(`Room created: ${roomId} by ${player.name}`);
      } catch (error) {
        console.error('Room creation error:', error);
        callback({ error: error instanceof Error ? error.message : 'Failed to create room' });
      }
    });

    // Room joining
    socket.on('room:join', async (data: { roomKey: string; player: Player; password?: string }, callback: (response: any) => void) => {
      try {
        const { roomKey, player, password } = data;
        const roomId = gameManager.joinRoom(roomKey, player, password);
        
        socket.data = { playerId: player.id, roomId };
        socket.join(roomId);
        gameManager.addSocketToRoom(roomId, player.id, socket);

        // Send join confirmation via callback
        callback({ roomId });

        // Send player-specific game state to the joining player
        const playerGameState = gameManager.getGameState(roomId, player.id);
        console.log(`Server: Sending filtered state to joining player ${player.id}, state has ${playerGameState?.players.length} players`);
        if (playerGameState) {
          socket.emit('state:patch', playerGameState);
        }

        // Broadcast to other players in the room (excluding the joining player)
        console.log(`Server: Broadcasting updates to other players in room ${roomId}`);
        broadcastGameStateToRoom(roomId, player.id);

        console.log(`Player ${player.name} (ID: ${player.id}) joined room ${roomId}`);
      } catch (error) {
        console.error('Room join error:', error);
        callback({ error: error instanceof Error ? error.message : 'Failed to join room' });
      }
    });

    // Room leaving
    socket.on('room:leave', () => {
      const { playerId, roomId } = socket.data as SocketData;
      if (playerId && roomId) {
        gameManager.leaveRoom(playerId);
        gameManager.removeSocketFromRoom(roomId, playerId);
        socket.leave(roomId);
        
        // Broadcast to remaining players with their filtered game states
        broadcastGameStateToRoom(roomId);

        console.log(`Player ${playerId} left room ${roomId}`);
      }
    });

    // Game actions
    socket.on('game:startRound', () => {
      const { playerId, roomId } = socket.data as SocketData;
      if (!playerId || !roomId) return;

      try {
        const room = gameManager.getRoom(roomId);
        if (!room) return;

        // Check if player is host
        const player = room.players.get(playerId);
        if (!player?.isHost) {
          socket.emit('error', { message: 'Only the host can start the round' });
          return;
        }

        const newState = gameManager.executeGameAction(roomId, { type: 'startRound' });
        if (newState) {
          io.to(roomId).emit('round:started', newState);
          broadcastGameStateToRoom(roomId);
        }
      } catch (error) {
        console.error('Start round error:', error);
        socket.emit('error', { message: error instanceof Error ? error.message : 'Failed to start round' });
      }
    });

    socket.on('turn:draw', (data: { source: 'stock' | 'discard' }) => {
      const { playerId, roomId } = socket.data as SocketData;
      console.log(`Server: Received draw action from player ${playerId} in room ${roomId}, source: ${data.source}`);
      if (!playerId || !roomId) return;

      try {
        const action: GameAction = {
          type: 'draw',
          source: data.source,
          playerId
        };

        console.log(`Server: Executing draw action:`, action);
        const newState = gameManager.executeGameAction(roomId, action);
        console.log(`Server: Draw action result - lastAction:`, newState?.lastAction);
        if (newState) {
          // Send turn result to the player who drew
          socket.emit('turn:result', { action, state: newState });
          
          // Broadcast state update to room
          broadcastGameStateToRoom(roomId);
        }
      } catch (error) {
        console.error('Draw error:', error);
        socket.emit('error', { message: error instanceof Error ? error.message : 'Failed to draw card' });
      }
    });

    socket.on('turn:replace', (data: { cardIndex: number; card: any }) => {
      const { playerId, roomId } = socket.data as SocketData;
      if (!playerId || !roomId) return;

      try {
        const action: GameAction = {
          type: 'replace',
          playerId,
          cardIndex: data.cardIndex,
          card: data.card
        };

        const newState = gameManager.executeGameAction(roomId, action);
        if (newState) {
          // Send turn result to the player who replaced
          socket.emit('turn:result', { action, state: newState });
          
          // Broadcast state update to room
          broadcastGameStateToRoom(roomId);
          
          // Notify next player
          const currentPlayer = newState.players[newState.currentPlayerIndex];
          if (currentPlayer) {
            io.to(roomId).emit('turn:you', { playerId: currentPlayer.id });
          }
        }
      } catch (error) {
        console.error('Replace error:', error);
        socket.emit('error', { message: error instanceof Error ? error.message : 'Failed to replace card' });
      }
    });

    socket.on('turn:discard', () => {
      const { playerId, roomId } = socket.data as SocketData;
      if (!playerId || !roomId) return;

      try {
        console.log(`Server: Received discard action from player ${playerId}`);
        const action: GameAction = {
          type: 'discard',
          playerId
        };

        const newState = gameManager.executeGameAction(roomId, action);
        if (newState) {
          console.log(`Server: Discard action executed. New state:`, {
            currentPlayerIndex: newState.currentPlayerIndex,
            lastAction: newState.lastAction,
            gamePhase: newState.gamePhase
          });
          // Send turn result to the player who discarded
          socket.emit('turn:result', { action, state: newState });
          
          // Broadcast state update to room
          broadcastGameStateToRoom(roomId);
        }
      } catch (error) {
        console.error('Discard error:', error);
        socket.emit('error', { message: error instanceof Error ? error.message : 'Failed to discard card' });
      }
    });



    socket.on('turn:callPablo', () => {
      const { playerId, roomId } = socket.data as SocketData;
      if (!playerId || !roomId) return;

      try {
        const action: GameAction = {
          type: 'callPablo',
          playerId
        };

        const newState = gameManager.executeGameAction(roomId, action);
        if (newState) {
          socket.emit('turn:result', { action, state: newState });
          broadcastGameStateToRoom(roomId);
          io.to(roomId).emit('pablo:called', { callerId: playerId });
        }
      } catch (error) {
        console.error('Call Pablo error:', error);
        socket.emit('error', { message: error instanceof Error ? error.message : 'Failed to call Pablo' });
      }
    });

    socket.on('turn:pabloWindow', () => {
      const { playerId, roomId } = socket.data as SocketData;
      if (!playerId || !roomId) return;

      try {
        console.log(`Server: Received pabloWindow action from player ${playerId}`);
        const action: GameAction = {
          type: 'pabloWindow',
          playerId
        };

        const newState = gameManager.executeGameAction(roomId, action);
        if (newState) {
          console.log(`Server: PabloWindow action executed. New state:`, {
            currentPlayerIndex: newState.currentPlayerIndex,
            lastAction: newState.lastAction,
            gamePhase: newState.gamePhase
          });
          socket.emit('turn:result', { action, state: newState });
          broadcastGameStateToRoom(roomId);
        }
      } catch (error) {
        console.error('PabloWindow error:', error);
        socket.emit('error', { message: error instanceof Error ? error.message : 'Failed to execute PabloWindow action' });
      }
    });

    socket.on('game:endRound', () => {
      const { playerId, roomId } = socket.data as SocketData;
      if (!playerId || !roomId) return;

      try {
        const room = gameManager.getRoom(roomId);
        if (!room) return;

        // Check if player is host
        const player = room.players.get(playerId);
        if (!player?.isHost) {
          socket.emit('error', { message: 'Only the host can end the round' });
          return;
        }

        const newState = gameManager.executeGameAction(roomId, { type: 'endRound' });
        if (newState) {
          const gameResult = room.engine.getGameResult();
          io.to(roomId).emit('round:scored', { state: newState, result: gameResult });
          broadcastGameStateToRoom(roomId);
        }
      } catch (error) {
        console.error('End round error:', error);
        socket.emit('error', { message: error instanceof Error ? error.message : 'Failed to end round' });
      }
    });

    socket.on('game:peekCard', (data: { cardIndex: number }) => {
      const { playerId, roomId } = socket.data as SocketData;
      if (!playerId || !roomId) return;

      try {
        const action: GameAction = {
          type: 'peekCard',
          playerId,
          cardIndex: data.cardIndex
        };
        
        const newState = gameManager.executeGameAction(roomId, action);
        if (newState) {
          broadcastGameStateToRoom(roomId);
        }
      } catch (error) {
        console.error('Peek card error:', error);
        socket.emit('error', { message: error instanceof Error ? error.message : 'Failed to peek card' });
      }
    });

    socket.on('game:playerReady', () => {
      const { playerId, roomId } = socket.data as SocketData;
      if (!playerId || !roomId) return;

      try {
        const action: GameAction = {
          type: 'playerReady',
          playerId
        };
        
        const newState = gameManager.executeGameAction(roomId, action);
        if (newState) {
          console.log(`Server: Player ${playerId} marked as ready. Ready players: ${newState.readyPlayers?.length || 0}/${newState.players.length}`);
          
          // Check if all players are ready
          if (newState.gamePhase === 'playing') {
            console.log('Server: All players ready, transitioning to playing phase');
          }
          
          broadcastGameStateToRoom(roomId);
        }
      } catch (error) {
        console.error('Player ready error:', error);
        socket.emit('error', { message: error instanceof Error ? error.message : 'Failed to mark player as ready' });
      }
    });

    socket.on('game:resetGame', () => {
      const { playerId, roomId } = socket.data as SocketData;
      if (!playerId || !roomId) return;

      try {
        const room = gameManager.getRoom(roomId);
        if (!room) return;

        // Check if player is host
        const player = room.players.get(playerId);
        if (!player?.isHost) {
          socket.emit('error', { message: 'Only the host can reset the game' });
          return;
        }

        console.log(`Server: Received resetGame action from host ${playerId} in room ${roomId}`);
        const newState = gameManager.executeGameAction(roomId, { type: 'resetGame' });
        if (newState) {
          console.log(`Server: Game reset successfully. New state:`, {
            gamePhase: newState.gamePhase,
            roundNumber: newState.roundNumber,
            playersCount: newState.players.length
          });
          io.to(roomId).emit('game:reset', { state: newState });
          broadcastGameStateToRoom(roomId);
        }
      } catch (error) {
        console.error('Reset game error:', error);
        socket.emit('error', { message: error instanceof Error ? error.message : 'Failed to reset game' });
      }
    });

    // Chat
    socket.on('chat:post', (data: { text: string }) => {
      const { playerId, roomId } = socket.data as SocketData;
      if (!playerId || !roomId) return;

      const room = gameManager.getRoom(roomId);
      if (!room) return;

      const player = room.players.get(playerId);
      if (!player) return;

      const message = {
        id: Date.now().toString(),
        playerId,
        playerName: player.name,
        text: data.text,
        timestamp: new Date().toISOString()
      };

      io.to(roomId).emit('chat:message', message);
    });

    // QA Actions (only for authenticated QA sessions)
    socket.on('qa:reveal', (data: { playerId: string }) => {
      const { isQA, roomId } = socket.data as SocketData;
      if (!isQA || !roomId) {
        socket.emit('error', { message: 'QA access required' });
        return;
      }

      try {
        const room = gameManager.getRoom(roomId);
        if (!room) return;

        const result = qaManager.revealPlayerCards(room.engine, data.playerId);
        socket.emit('qa:revealResult', result);
      } catch (error) {
        socket.emit('error', { message: error instanceof Error ? error.message : 'QA reveal failed' });
      }
    });

    socket.on('qa:injectCard', (data: { where: 'stock' | 'discard'; card: any }) => {
      const { isQA, roomId } = socket.data as SocketData;
      if (!isQA || !roomId) {
        socket.emit('error', { message: 'QA access required' });
        return;
      }

      try {
        const room = gameManager.getRoom(roomId);
        if (!room) return;

        const newState = qaManager.injectCard(room.engine, data.where, data.card);
        io.to(roomId).emit('state:patch', newState);
        socket.emit('qa:injectResult', { success: true });
      } catch (error) {
        socket.emit('error', { message: error instanceof Error ? error.message : 'QA inject failed' });
      }
    });

    socket.on('qa:setSeed', (data: { seed: number }) => {
      const { isQA, roomId } = socket.data as SocketData;
      if (!isQA || !roomId) {
        socket.emit('error', { message: 'QA access required' });
        return;
      }

      try {
        const room = gameManager.getRoom(roomId);
        if (!room) return;

        const newState = qaManager.setSeed(room.engine, data.seed);
        io.to(roomId).emit('state:patch', newState);
        socket.emit('qa:setSeedResult', { success: true });
      } catch (error) {
        socket.emit('error', { message: error instanceof Error ? error.message : 'QA set seed failed' });
      }
    });

    socket.on('qa:forceTurn', (data: { playerId: string }) => {
      const { isQA, roomId } = socket.data as SocketData;
      if (!isQA || !roomId) {
        socket.emit('error', { message: 'QA access required' });
        return;
      }

      try {
        const room = gameManager.getRoom(roomId);
        if (!room) return;

        const newState = qaManager.forceTurn(room.engine, data.playerId);
        io.to(roomId).emit('state:patch', newState);
        io.to(roomId).emit('turn:you', { playerId: data.playerId });
        socket.emit('qa:forceTurnResult', { success: true });
      } catch (error) {
        socket.emit('error', { message: error instanceof Error ? error.message : 'QA force turn failed' });
      }
    });

    // Disconnect handling
    socket.on('disconnect', () => {
      const { playerId, roomId } = socket.data as SocketData;
      
      if (playerId && roomId) {
        const room = gameManager.getRoom(roomId);
        if (room) {
          // Mark player as disconnected
          const player = room.players.get(playerId);
          if (player) {
            player.isConnected = false;
            room.players.set(playerId, player);
          }

          gameManager.removeSocketFromRoom(roomId, playerId);
          
          // Broadcast updated state
          const gameState = gameManager.getGameState(roomId);
          if (gameState) {
            io.to(roomId).emit('state:patch', gameState);
          }
        }

        console.log(`Client disconnected: ${socket.id} (${playerId})`);
      } else {
        console.log(`Client disconnected: ${socket.id}`);
      }
    });
  });
}
