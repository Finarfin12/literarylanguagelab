export interface SM2Result {
  interval: number;
  repetition: number;
  easeFactor: number;
}

/**
 * SuperMemo 2 (SM-2) Algorithm implementation
 * 
 * @param quality 0-5 (0: complete blackout, 5: perfect response)
 * @param lastInterval previous interval in days
 * @param lastRepetition previous repetition count
 * @param lastEaseFactor previous ease factor (default 2.5)
 * @returns SM2Result
 */
export function calculateSM2(
  quality: number,
  lastInterval: number = 0,
  lastRepetition: number = 0,
  lastEaseFactor: number = 2.5
): SM2Result {
  let interval: number;
  let repetition: number;
  let easeFactor: number;

  if (quality >= 3) {
    if (lastRepetition === 0) {
      interval = 1;
    } else if (lastRepetition === 1) {
      interval = 6;
    } else {
      interval = Math.round(lastInterval * lastEaseFactor);
    }
    repetition = lastRepetition + 1;
  } else {
    repetition = 0;
    interval = 1;
  }

  easeFactor = lastEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) {
    easeFactor = 1.3;
  }

  return { interval, repetition, easeFactor };
}
