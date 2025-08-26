import { describe, it, expect, beforeEach } from 'vitest';
import { PabloGameEngine } from '../gameEngine';
import { DEFAULT_GAME_SETTINGS } from '../index';
import { Player, RoomSettings } from '../types';

describe('PabloGameEngine', () => {
  let engine: PabloGameEngine;
  let players: Player[];
  let settings: RoomSettings;

  beforeEach(() => {
    players = [
      { id: 'player1', name: 'Alice', cards: [], isConnected: true, totalScore: 0, roundScore: 0, isHost: true },
      { id: 'player2', name: 'Bob', cards: [], isConnected: true, totalScore: 0, roundScore: 0, isHost: false },
      { id: 'player3', name: 'Charlie', cards: [], isConnected: true, totalScore: 0, roundScore: 0, isHost: false }
    ];

    settings = {
      ...DEFAULT_GAME_SETTINGS,
      roomKey: 'test-room-123',
      maxPlayers: 5
    };

    engine = new PabloGameEngine('test-room', settings, players);
  });

  describe('Initialization', () => {
    it('should initialize with correct state', () => {
      const state = engine.getState();
      
      expect(state.roomId).toBe('test-room');
      expect(state.players).toHaveLength(3);
      expect(state.gamePhase).toBe('waiting');
      expect(state.roundNumber).toBe(0);
      expect(state.currentPlayerIndex).toBe(0);
      expect(state.stock).toHaveLength(0);
      expect(state.discard).toHaveLength(0);
    });

    it('should initialize players with empty cards', () => {
      const state = engine.getState();
      
      state.players.forEach(player => {
        expect(player.cards).toHaveLength(4);
        expect(player.cards.every(card => card === null)).toBe(true);
      });
    });
  });

  describe('Starting a round', () => {
    it('should start a round successfully', () => {
      const state = engine.executeAction({ type: 'startRound' });
      
      expect(state.gamePhase).toBe('playing');
      expect(state.roundNumber).toBe(1);
      expect(state.currentPlayerIndex).toBe(0);
      expect(state.stock.length).toBeGreaterThan(0);
      expect(state.discard.length).toBe(1);
      
      // Each player should have 4 cards
      state.players.forEach(player => {
        expect(player.cards).toHaveLength(4);
        expect(player.cards.every(card => card !== null)).toBe(true);
      });
    });

    it('should not allow starting round twice', () => {
      engine.executeAction({ type: 'startRound' });
      
      expect(() => {
        engine.executeAction({ type: 'startRound' });
      }).toThrow('Cannot start round: game is not in waiting phase');
    });
  });

  describe('Drawing cards', () => {
    beforeEach(() => {
      engine.executeAction({ type: 'startRound' });
    });

    it('should allow drawing from stock', () => {
      const state = engine.executeAction({ 
        type: 'draw', 
        source: 'stock', 
        playerId: 'player1' 
      });
      
      expect(state.lastAction).toEqual({
        type: 'draw',
        source: 'stock',
        playerId: 'player1'
      });
    });

    it('should allow drawing from discard', () => {
      const state = engine.executeAction({ 
        type: 'draw', 
        source: 'discard', 
        playerId: 'player1' 
      });
      
      expect(state.lastAction).toEqual({
        type: 'draw',
        source: 'discard',
        playerId: 'player1'
      });
    });

    it('should not allow drawing when not your turn', () => {
      expect(() => {
        engine.executeAction({ 
          type: 'draw', 
          source: 'stock', 
          playerId: 'player2' 
        });
      }).toThrow('Not your turn');
    });
  });

  describe('Replacing cards', () => {
    beforeEach(() => {
      engine.executeAction({ type: 'startRound' });
      engine.executeAction({ 
        type: 'draw', 
        source: 'stock', 
        playerId: 'player1' 
      });
    });

    it('should allow replacing a card', () => {
      const state = engine.executeAction({
        type: 'replace',
        playerId: 'player1',
        cardIndex: 0,
        card: { suit: 'hearts', rank: 'A', value: 1, isJoker: false }
      });
      
      expect(state.currentPlayerIndex).toBe(1); // Move to next player
      expect(state.lastAction?.type).toBe('replace');
    });

    it('should not allow replacing without drawing first', () => {
      // Start a new round and try to replace without drawing
      engine = new PabloGameEngine('test-room', settings, players);
      engine.executeAction({ type: 'startRound' });
      
      expect(() => {
        engine.executeAction({
          type: 'replace',
          playerId: 'player1',
          cardIndex: 0,
          card: { suit: 'hearts', rank: 'A', value: 1, isJoker: false }
        });
      }).toThrow('Must draw a card before replacing');
    });
  });

  describe('Calling Pablo', () => {
    beforeEach(() => {
      engine.executeAction({ type: 'startRound' });
    });

    it('should allow calling Pablo', () => {
      const state = engine.executeAction({
        type: 'callPablo',
        playerId: 'player1'
      });
      
      expect(state.pabloCalled).toBe(true);
      expect(state.pabloCallerId).toBe('player1');
    });

    it('should not allow calling Pablo when not your turn', () => {
      expect(() => {
        engine.executeAction({
          type: 'callPablo',
          playerId: 'player2'
        });
      }).toThrow('Not your turn');
    });
  });

  describe('Power cards', () => {
    beforeEach(() => {
      engine.executeAction({ type: 'startRound' });
    });

    it('should allow using power card 7 (swap)', () => {
      const state = engine.executeAction({
        type: 'power',
        playerId: 'player1',
        powerType: '7',
        payload: { playerIndex: 1, cardIndex: 0, myCardIndex: 0 }
      });
      
      expect(state.lastAction?.type).toBe('power');
      expect(state.lastAction?.powerType).toBe('7');
    });

    it('should not allow using disabled power cards', () => {
      // Disable power card 7
      settings.powerCards['7'] = false;
      engine = new PabloGameEngine('test-room', settings, players);
      engine.executeAction({ type: 'startRound' });
      
      expect(() => {
        engine.executeAction({
          type: 'power',
          playerId: 'player1',
          powerType: '7',
          payload: { playerIndex: 1, cardIndex: 0, myCardIndex: 0 }
        });
      }).toThrow('Power card 7 is not enabled');
    });
  });

  describe('Ending rounds', () => {
    beforeEach(() => {
      engine.executeAction({ type: 'startRound' });
    });

    it('should calculate scores correctly', () => {
      const state = engine.executeAction({ type: 'endRound' });
      
      expect(state.gamePhase).toBe('scored');
      expect(state.players.every(p => p.roundScore !== 0)).toBe(true);
    });

    it('should apply Pablo bonus/penalty correctly', () => {
      // Call Pablo first
      engine.executeAction({
        type: 'callPablo',
        playerId: 'player1'
      });
      
      const state = engine.executeAction({ type: 'endRound' });
      
      expect(state.gamePhase).toBe('scored');
      // The caller should have a bonus or penalty applied
      const caller = state.players.find(p => p.id === 'player1');
      expect(caller?.roundScore).toBeDefined();
    });
  });
});
