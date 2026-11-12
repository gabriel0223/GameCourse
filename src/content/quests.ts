import type { Quest } from '../domain/quests';

// Starter quests. Each one asks for a taste of a game, not finishing it, and ends
// with one question so she never faces a blank page. Editors can change or hide
// these and add more on any Codex entry.
export const BUILT_IN_QUESTS: Quest[] = [
  {
    id: 'quest-sonic-speed',
    entryId: 'event-sonic',
    title: 'Gotta go fast',
    task: 'Play any Sonic game for at least 30 minutes. Sonic Mania and Sonic Origins are good places to start on PC.',
    question: 'Did the speed feel exciting or out of control? Describe one moment when you felt in control.',
    gold: 40,
  },
  {
    id: 'quest-kojima-opening',
    entryId: 'person-kojima',
    title: 'A Kojima opening',
    task: 'Play the first hour of a Hideo Kojima game. Metal Gear Solid V: Ground Zeroes is short, and Death Stranding is a slower, stranger choice.',
    question: 'What felt different from other games you have played? Think about the cutscenes, the controls, or the mood.',
    gold: 60,
  },
  {
    id: 'quest-rpg-level-up',
    entryId: 'genre-rpg',
    title: 'Your first level up',
    task: 'Play the first two hours of any RPG, and get at least one level up.',
    question: 'What changed when you leveled up? Did you feel stronger, or did the game only tell you that you were?',
    gold: 80,
  },
  {
    id: 'quest-platformer-jump',
    entryId: 'genre-platformer',
    title: 'Learn a jump',
    task: 'Play the first chapter of Celeste, or 30 minutes of any platformer.',
    question: 'Think of a jump you failed a few times. What did you change to finally make it?',
    gold: 40,
  },
  {
    id: 'quest-sticks-camera',
    entryId: 'playing-sticks',
    title: 'Two sticks, one brain',
    task: 'Play 20 minutes of a 3D game where the left stick moves you and the right stick moves the camera. Love Attack in Practice counts too.',
    question: 'When did the camera fight you, and when did it start to feel natural?',
    gold: 30,
  },
  {
    id: 'quest-cozy-day',
    entryId: 'genre-cozy',
    title: 'A slow day',
    task: 'Play one full in-game day of Stardew Valley or another cozy game.',
    question: 'What did you choose to do with your day, and why?',
    gold: 40,
  },
  {
    id: 'quest-puzzle-portal',
    entryId: 'genre-puzzle',
    title: 'Thinking with portals',
    task: 'Play the first 30 minutes of Portal or Portal 2.',
    question: 'Pick one puzzle. Did you solve it by trying things, or by stopping to think first?',
    gold: 40,
  },
  {
    id: 'quest-horror-nerves',
    entryId: 'genre-horror',
    title: 'Lights off',
    task: 'Play 20 minutes of any horror game. Lights off and headphones on, if you dare.',
    question: 'What made you nervous: something you saw, something you heard, or something you expected?',
    gold: 50,
  },
  {
    id: 'quest-tetris-blocks',
    entryId: 'event-tetris',
    title: 'Falling blocks',
    task: 'Play Tetris for 15 minutes. Tetris Effect, Puyo Puyo Tetris, or any free version works.',
    question: 'What strategy did you fall into? Did it change as the blocks got faster?',
    gold: 30,
  },
];
