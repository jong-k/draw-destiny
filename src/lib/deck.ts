export const WINDOW_SIZE = 5;

export function shuffle<T>(arr: T[], rng: () => number = Math.random): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function step(start: number, direction: 1 | -1, length: number): number {
  return (start + direction + length) % length;
}

export function getWindow<T>(deck: T[], start: number): T[] {
  const result: T[] = [];
  for (let i = 0; i < WINDOW_SIZE; i++) {
    result.push(deck[(start + i) % deck.length]);
  }
  return result;
}

export function activeCardIndex(start: number, length: number): number {
  return (start + Math.floor(WINDOW_SIZE / 2)) % length;
}
