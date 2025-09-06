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

// Session timeout constants
const SESSION_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour
const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

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
              console.error('GameStore: Reconnection failed:', response.error);
              clearSession();
              resolve(false);
            } else {
              console.log('GameStore: Reconnection successful, setting roomId to:', response.roomId);
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
      } else {
        console.log('GameStore: No socket available, but cleared local state');
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
