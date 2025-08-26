import { RNG } from './types.js';

export class SeededRNG implements RNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed;
  }

  get seed(): number {
    return this.state;
  }

  next(): number {
    // Linear congruential generator
    this.state = (this.state * 1664525 + 1013904223) >>> 0;
    return this.state / 0x100000000;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

export function createRNG(seed?: number): RNG {
  const actualSeed = seed ?? Math.floor(Math.random() * 0x100000000);
  return new SeededRNG(actualSeed);
}

