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

// Use environment variable or fallback to localhost for development
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4001';

// Session persistence keys
const SESSION_KEYS = {
  ROOM_ID: 'pablo_room_id',
  PLAYER_ID: 'pablo_player_id',
  PLAYER_NAME: 'pablo_player_name',
  ROOM_KEY: 'pablo_room_key',
  SESSION_TOKEN: 'pablo_session_token',
  SESSION_EXPIRY: 'pablo_session_expiry'
};


// Helper functions for session persistence
const saveSession = (roomId: string, playerId: string, playerName: string, roomKey: string, sessionToken: string, sessionExpiry: number) => {
  localStorage.setItem(SESSION_KEYS.ROOM_ID, roomId);
  localStorage.setItem(SESSION_KEYS.PLAYER_ID, playerId);
  localStorage.setItem(SESSION_KEYS.PLAYER_NAME, playerName);
  localStorage.setItem(SESSION_KEYS.ROOM_KEY, roomKey);
  localStorage.setItem(SESSION_KEYS.SESSION_TOKEN, sessionToken);
  localStorage.setItem(SESSION_KEYS.SESSION_EXPIRY, sessionExpiry.toString());
};

const loadSession = () => {
  const roomId = localStorage.getItem(SESSION_KEYS.ROOM_ID);
  const playerId = localStorage.getItem(SESSION_KEYS.PLAYER_ID);
  const playerName = localStorage.getItem(SESSION_KEYS.PLAYER_NAME);
  const roomKey = localStorage.getItem(SESSION_KEYS.ROOM_KEY);
  const sessionToken = localStorage.getItem(SESSION_KEYS.SESSION_TOKEN);
  const sessionExpiry = localStorage.getItem(SESSION_KEYS.SESSION_EXPIRY);
  
  if (roomId && playerId && playerName && roomKey && sessionToken && sessionExpiry) {
    const expiry = parseInt(sessionExpiry);
    // Check if session is still valid
    if (Date.now() < expiry) {
      return { roomId, playerId, playerName, roomKey, sessionToken, sessionExpiry: expiry };
    }
  }
  return null;
};

const clearSession = () => {
  localStorage.removeItem(SESSION_KEYS.ROOM_ID);
  localStorage.removeItem(SESSION_KEYS.PLAYER_ID);
  localStorage.removeItem(SESSION_KEYS.PLAYER_NAME);
  localStorage.removeItem(SESSION_KEYS.ROOM_KEY);
  localStorage.removeItem(SESSION_KEYS.SESSION_TOKEN);
  localStorage.removeItem(SESSION_KEYS.SESSION_EXPIRY);
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
      });

      socket.on('disconnect', () => {
        set({ isConnected: false });
      });

      socket.on('error', (data: { message: string }) => {
        set({ error: data.message });
        console.error('Socket error:', data.message);
      });

      socket.on('state:patch', (gameState: GameState) => {
        set({ gameState });

        const { playerId } = get();
        if (playerId) {
          const currentPlayer = gameState.players.find((p: Player) => p.id === playerId);
          set({ currentPlayer: currentPlayer || null });
        }
      });

      socket.on('round:started', (gameState: GameState) => {
        set({ gameState });
      });

      socket.on('turn:you', (_data: { playerId: string }) => {
        // Could add a notification here
      });

      socket.on('turn:result', (data: { action: GameAction; state: GameState }) => {
        set({ gameState: data.state });
      });

      socket.on('round:scored', (data: { state: GameState; result: any }) => {
        set({ gameState: data.state });
      });

      socket.on('game:reset', (data: { state: GameState }) => {
        set({ gameState: data.state });
      });

      socket.on('pablo:called', (_data: { callerId: string }) => {
        // Could add a notification here
      });

      socket.on('chat:message', (_message: any) => {
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
        return false;
      }

      // Don't attempt to reconnect if we're already in a room
      const currentState = get();
      if (currentState.roomId || currentState.gameState) {
        return true;
      }
      
      try {
        // First connect to socket
        const { connect } = get();
        connect();
        
        // Wait a bit for connection
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Try to reconnect to the room using the reconnect method
        const { socket } = get();
        if (!socket) {
          throw new Error('Socket not available for reconnection');
        }

        return new Promise<boolean>((resolve) => {
          socket.emit('room:reconnect', { 
            roomKey: savedSession.roomKey, 
            playerId: savedSession.playerId, 
            playerName: savedSession.playerName 
          }, (response: any) => {
            if (response.error) {
              clearSession();
              resolve(false);
            } else {
              set({
                roomId: response.roomId, 
                playerId: savedSession.playerId,
                isLoading: false
              });
              resolve(true);
            }
          });
        });
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

      set({ isLoading: true, error: null });

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          set({ error: 'Room creation timed out', isLoading: false });
          reject(new Error('Room creation timeout'));
        }, 10000);

        socket.emit('room:create', { settings, player }, (response: any) => {
          clearTimeout(timeout);
          if (response.error) {
            set({ error: response.error, isLoading: false });
            reject(new Error(response.error));
          } else {
            // Save session data
            saveSession(response.roomId, player.id, player.name, response.roomKey, response.sessionToken, response.sessionExpiry);
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

      set({ isLoading: true, error: null });

      return new Promise((resolve, reject) => {
        socket.emit('room:join', { roomKey, player, password }, (response: any) => {
          if (response.error) {
            set({ error: response.error, isLoading: false });
            reject(new Error(response.error));
          } else {
            // Save session data
            saveSession(response.roomId, player.id, player.name, roomKey, response.sessionToken, response.sessionExpiry);
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
      
      // Always clear session data and local state, regardless of socket status
      clearSession();
      set({ 
        roomId: null, 
        playerId: null,
        gameState: null,
        currentPlayer: null 
      });
      
      // If socket exists, emit leave event
      if (socket) {
        socket.emit('room:leave');
      }
    },

    executeAction: (action: GameAction) => {
      const { socket } = get();
      if (!socket) return;

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
        // New trick card actions
        case 'activateTrick':
          socket.emit('turn:activateTrick', { cardRank: action.cardRank });
          break;
        case 'executeSwap':
          socket.emit('turn:executeSwap', { swapAction: action.swapAction });
          break;
        case 'executeSpy':
          socket.emit('turn:executeSpy', { spyAction: action.spyAction });
          break;
        case 'skipTrick':
          socket.emit('turn:skipTrick');
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
