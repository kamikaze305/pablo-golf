import { describe, it, expect } from 'vitest';
import { GameManager } from '../gameManager';


describe('Server Components', () => {
  it('should create GameManager instance', () => {
    const gameManager = new GameManager();
    expect(gameManager).toBeInstanceOf(GameManager);
  });



  it('should have correct initial stats', () => {
    const gameManager = new GameManager();
    const stats = gameManager.getRoomStats();
    expect(stats).toEqual({
      totalRooms: 0,
      totalPlayers: 0,
      activeRooms: 0
    });
  });
});

