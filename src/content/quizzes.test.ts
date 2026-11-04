import { describe, expect, it } from 'vitest';
import { passMark } from '../domain/quiz';
import { findEntry } from './codex';
import { ERAS, PATHS } from './paths';
import { QUIZZES, quizDeck } from './quizzes';

const clean = (text: string) => text.toLowerCase().replace(/’/g, "'");

describe('quizzes', () => {
  it('gives every path a quiz that covers each stop', () => {
    for (const path of PATHS) {
      const stops = new Set(QUIZZES[path.id]?.map((question) => question.stop));
      expect([...stops].sort(), path.id).toEqual([...path.entryIds].sort());
    }
  });

  it('gives every era a quiz about its timeline, with one console question at most', () => {
    for (const era of ERAS) {
      const questions = QUIZZES[era.id] ?? [];
      const timeline = era.entryIds.filter((id) => !findEntry(id)?.console);
      for (const stop of timeline) expect(questions.map((item) => item.stop), `${era.id} ${stop}`).toContain(stop);
      expect(questions.every((item) => era.entryIds.includes(item.stop)), era.id).toBe(true);
      expect(questions.filter((item) => findEntry(item.stop)?.console).length, era.id).toBeLessThanOrEqual(1);
    }
  });

  it('only asks what the entry teaches', () => {
    for (const questions of Object.values(QUIZZES)) {
      for (const question of questions) {
        const text = findEntry(question.stop)?.sections.map((section) => section.text ?? '').join(' ') ?? '';
        expect(clean(text), `${question.stop}: ${question.source}`).toContain(clean(question.source));
      }
    }
  });

  it('has four different answers per question', () => {
    for (const questions of Object.values(QUIZZES)) {
      for (const question of questions) {
        expect(new Set([question.correct, ...question.wrong]).size, question.prompt).toBe(4);
      }
    }
  });

  it('keeps the right answer in every shuffled deck', () => {
    const deck = quizDeck(QUIZZES.playing, () => 0.3);
    expect(deck).toHaveLength(QUIZZES.playing.length);
    for (const question of deck) {
      expect(question.options).toHaveLength(4);
      expect(question.options).toContain(question.correct);
    }
  });

  it('asks for at least 80 percent to pass', () => {
    expect(passMark(5)).toBe(4);
    expect(passMark(6)).toBe(5);
    expect(passMark(7)).toBe(6);
    expect(passMark(10)).toBe(8);
  });
});
