// A starting value, to be tuned once she has taken a few.
const PASS_SHARE = 0.8;

export interface QuizRecord {
  best: number;
  total: number;
  attempts: number;
  // Kept once earned, so a later low score can't undo a finished path.
  passed: boolean;
}

export type QuizRecords = Record<string, QuizRecord>;

export const passMark = (total: number) => Math.ceil(total * PASS_SHARE);

export function applyQuiz(records: QuizRecords, pathId: string, score: number, total: number): QuizRecords {
  const old = records[pathId];
  return {
    ...records,
    [pathId]: {
      best: Math.max(old?.best ?? 0, score),
      total,
      attempts: (old?.attempts ?? 0) + 1,
      passed: Boolean(old?.passed) || score >= passMark(total),
    },
  };
}

export const passedCount = (records: QuizRecords, ids: string[]) =>
  ids.filter((id) => records[id]?.passed).length;

export const hasPerfectQuiz = (records: QuizRecords) =>
  Object.values(records).some((item) => item.best === item.total);
