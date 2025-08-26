import { PabloGameEngine } from '@pablo/engine';

interface QASession {
  id: string;
  ip: string;
  createdAt: Date;
  lastActivity: Date;
}

export class QAManager {
  private sessions: Map<string, QASession>;
  private sessionTimeout: number;

  constructor() {
    this.sessions = new Map();
    this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
    
    // Clean up expired sessions every 5 minutes
    setInterval(() => this.cleanupExpiredSessions(), 5 * 60 * 1000);
  }

  authenticate(username: string, password: string, ip: string): string | null {
    const expectedUser = process.env.QA_USER;
    const expectedPass = process.env.QA_PASS;
    
    if (!expectedUser || !expectedPass) {
      console.error('QA credentials not configured');
      return null;
    }
    
    if (username !== expectedUser || password !== expectedPass) {
      console.error(`QA authentication failed for IP: ${ip}`);
      return null;
    }
    
    // Check IP allowlist
    if (!this.isIPAllowed(ip)) {
      console.error(`QA access denied for IP: ${ip}`);
      return null;
    }
    
    // Create session
    const sessionId = this.generateSessionId();
    const session: QASession = {
      id: sessionId,
      ip,
      createdAt: new Date(),
      lastActivity: new Date()
    };
    
    this.sessions.set(sessionId, session);
    console.log(`QA session created for IP: ${ip}`);
    return sessionId;
  }

  validateSession(sessionId: string, ip: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }
    
    // Check IP matches
    if (session.ip !== ip) {
      console.error(`QA session IP mismatch: ${session.ip} vs ${ip}`);
      return false;
    }
    
    // Check if session is expired
    if (Date.now() - session.lastActivity.getTime() > this.sessionTimeout) {
      this.sessions.delete(sessionId);
      return false;
    }
    
    // Update last activity
    session.lastActivity = new Date();
    return true;
  }

  logout(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  // QA Actions
  revealPlayerCards(engine: PabloGameEngine, playerId: string) {
    const state = engine.getState();
    const player = state.players.find(p => p.id === playerId);
    
    if (!player) {
      throw new Error('Player not found');
    }
    
    return {
      playerId,
      cards: player.cards,
      name: player.name
    };
  }

  hidePlayerCards(engine: PabloGameEngine, playerId: string) {
    const state = engine.getState();
    const player = state.players.find(p => p.id === playerId);
    
    if (!player) {
      throw new Error('Player not found');
    }
    
    return {
      playerId,
      cards: player.cards.map(card => 
        card ? { ...card, suit: 'hidden', rank: 'hidden' } : null
      ),
      name: player.name
    };
  }

  injectCard(engine: PabloGameEngine, where: 'stock' | 'discard', card: any) {
    const state = engine.getState();
    
    if (where === 'stock') {
      // Add to top of stock
      const newStock = [card, ...state.stock];
      return { ...state, stock: newStock };
    } else {
      // Add to top of discard
      const newDiscard = [card, ...state.discard];
      return { ...state, discard: newDiscard };
    }
  }

  setSeed(engine: PabloGameEngine, seed: number) {
    const state = engine.getState();
    // This would need to be implemented in the engine
    // For now, return current state
    return state;
  }

  forceTurn(engine: PabloGameEngine, playerId: string) {
    const state = engine.getState();
    const playerIndex = state.players.findIndex(p => p.id === playerId);
    
    if (playerIndex === -1) {
      throw new Error('Player not found');
    }
    
    return { ...state, currentPlayerIndex: playerIndex };
  }

  snapshotRoom(engine: PabloGameEngine) {
    return engine.getState();
  }

  exportRoomState(engine: PabloGameEngine) {
    const state = engine.getState();
    return {
      timestamp: new Date().toISOString(),
      roomId: state.roomId,
      players: state.players.map(p => ({
        id: p.id,
        name: p.name,
        totalScore: p.totalScore,
        roundScore: p.roundScore,
        isConnected: p.isConnected,
        isHost: p.isHost
      })),
      gamePhase: state.gamePhase,
      roundNumber: state.roundNumber,
      currentPlayerIndex: state.currentPlayerIndex,
      stockCount: state.stock.length,
      discardCount: state.discard.length
    };
  }

  getActiveSessions(): QASession[] {
    return Array.from(this.sessions.values());
  }

  private isIPAllowed(ip: string): boolean {
    const allowlist = process.env.QA_IP_ALLOWLIST || '127.0.0.1,::1';
    const allowedIPs = allowlist.split(',').map(ip => ip.trim());
    return allowedIPs.includes(ip);
  }

  private generateSessionId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  private cleanupExpiredSessions(): void {
    const now = Date.now();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastActivity.getTime() > this.sessionTimeout) {
        this.sessions.delete(sessionId);
      }
    }
  }
}
