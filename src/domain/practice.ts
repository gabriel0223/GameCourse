// Practice supports real games rather than replacing them, so its XP stays small.
// Starting values, to be tuned once there is real play data.
export const RUN_XP_CAP = 10;
export const DAILY_PRACTICE_XP = 50;

export interface PracticeRecord {
  runs: number;
  xp: number;
  // Each minigame keeps its own high score.
  bests: Record<string, number>;
  bestStreak: number;
  devices: string[];
  day: string;
  dayXp: number;
}

export const NEW_PRACTICE: PracticeRecord = { runs: 0, xp: 0, bests: {}, bestStreak: 0, devices: [], day: '', dayXp: 0 };

export const bestScore = (record: PracticeRecord, game: string) => record.bests[game] ?? 0;

// Earlier saves kept a single best score, which belonged to the runner.
export function loadPractice(saved?: Partial<PracticeRecord> & { best?: number }): PracticeRecord {
  const { best, ...record } = saved ?? {};
  return { ...NEW_PRACTICE, ...record, bests: record.bests ?? (best ? { runner: best } : {}) };
}

export interface FinishedRun {
  game: string;
  device: string;
  score: number;
  bestStreak: number;
  mistakes: number;
}

export interface RunReward {
  xp: number;
  newBest: boolean;
  limitReached: boolean;
  best: number;
  // Her best before this run, so results can tell which friends she just passed.
  previousBest: number;
}

export function applyRun(record: PracticeRecord, run: FinishedRun, day: string): { practice: PracticeRecord; reward: RunReward } {
  // A run where she hit nothing doesn't count, so leaving it running earns nothing.
  const oldBest = bestScore(record, run.game);
  if (run.score < 1) {
    return { practice: record, reward: { xp: 0, newBest: false, limitReached: false, best: oldBest, previousBest: oldBest } };
  }
  const dayXp = record.day === day ? record.dayXp : 0;
  // Shooting down a drone takes far longer than clearing a prompt.
  const earned = run.game === 'jet' ? run.score * 3 : Math.ceil(run.score / 2);
  const wanted = Math.min(RUN_XP_CAP, earned);
  const xp = Math.min(wanted, DAILY_PRACTICE_XP - dayXp);
  const best = Math.max(oldBest, run.score);
  return {
    practice: {
      runs: record.runs + 1,
      xp: record.xp + xp,
      bests: { ...record.bests, [run.game]: best },
      bestStreak: Math.max(record.bestStreak, run.bestStreak),
      devices: run.game !== 'runner' || record.devices.includes(run.device) ? record.devices : [...record.devices, run.device],
      day,
      dayXp: dayXp + xp,
    },
    reward: { xp, newBest: run.score > oldBest, limitReached: xp < wanted, best, previousBest: oldBest },
  };
}
