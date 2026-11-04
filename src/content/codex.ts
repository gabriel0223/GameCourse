import { genreEntryId } from '../domain/genres';
import type { WardrobeGenre } from '../domain/genres';
import { CONSOLE_ENTRIES } from './consoles';
import { TIMELINE_ENTRIES } from './timeline';

export type CodexCategory = 'genres' | 'industry' | 'playing' | 'history' | 'consoles';

export interface TimelinePoint {
  kind: 'generation' | 'event';
  generation: number;
  year: number;
  label: string;
}

export interface ConsoleInfo {
  generation: number;
  year: number;
  maker: string;
  // Blank when no reliable number exists.
  sales: string;
  handheld?: boolean;
}

export interface CodexImage {
  src: string;
  alt: string;
  caption?: string;
  // Set when the file lives in cloud storage, where src is a temporary link.
  path?: string;
}

export interface CodexGame {
  name: string;
  year?: number;
}

export interface CodexSection {
  heading?: string;
  text?: string;
  list?: string[];
  steps?: string[];
  table?: { headers: string[]; rows: string[][] };
  figure?: 'face-buttons';
  image?: CodexImage;
  // Shows every console entry in this generation.
  consoles?: number;
  // Shown as game cards. A game with a year links to its IGDB page when it's found.
  games?: CodexGame[];
}

export interface CodexEntry {
  id: string;
  category: CodexCategory;
  title: string;
  summary: string;
  genre?: WardrobeGenre;
  examples?: string[];
  sections: CodexSection[];
  related?: string[];
  heroImage?: CodexImage;
  custom?: boolean;
  timeline?: TimelinePoint;
  console?: ConsoleInfo;
}

export interface GlossaryTerm {
  term: string;
  definition: string;
}

const genre = (
  name: WardrobeGenre,
  summary: string,
  sections: CodexSection[],
  examples: string[],
  related?: string[],
): CodexEntry => ({
  id: genreEntryId(name),
  category: 'genres',
  title: name,
  genre: name,
  summary,
  sections,
  examples,
  related,
});

const GUIDES: CodexEntry[] = [
  genre(
    'RPG',
    'Grow a character or party through a long story.',
    [
      {
        text: 'RPG stands for role-playing game. You take on a role, make your character stronger over time, and follow a story that often lasts dozens of hours.',
      },
      {
        heading: 'What you usually do',
        list: [
          'Earn XP and level up.',
          'Choose skills, weapons, and armor.',
          'Complete a main story and optional side quests.',
          'Talk to characters and explore towns.',
        ],
      },
      {
        heading: 'Two common types',
        list: [
          'Turn-based RPGs let you plan each move, so they are a gentle place to start.',
          'Action RPGs happen in real time, so your reactions matter as much as your build.',
        ],
      },
    ],
    ['Final Fantasy VII Remake Intergrade', 'The Witcher 3: Wild Hunt', 'Hades', 'Disco Elysium'],
    ['playing-saving'],
  ),
  genre(
    'Platformer',
    'Run and jump through levels built around movement.',
    [
      {
        text: 'Platformers are about moving through a space. You run, jump, and time your moves to cross gaps and avoid hazards. They are great for building controller confidence.',
      },
      {
        heading: 'What you usually do',
        list: [
          'Jump between platforms.',
          'Avoid enemies and traps.',
          'Learn a level by trying it again.',
          'Find hidden paths and collectibles.',
        ],
      },
      {
        heading: 'A related style',
        text: 'A metroidvania is a large connected map. New abilities open paths that were blocked earlier.',
      },
    ],
    ['Celeste', 'Hollow Knight', 'Portal 2', 'Cuphead'],
    ['playing-sticks'],
  ),
  genre(
    'Action',
    'Fast fights that reward timing and quick decisions.',
    [
      {
        text: 'Action games focus on real-time challenge. You fight enemies directly and learn when to attack, dodge, or block.',
      },
      {
        heading: 'What you usually do',
        list: [
          'Chain attacks together into combos.',
          'Watch enemies for signs of their next attack.',
          'Dodge or block at the right moment.',
          'Beat tough bosses.',
        ],
      },
      {
        heading: 'Common styles',
        list: [
          "Hack and slash and beat 'em up games send waves of enemies at you.",
          'Fighting games match two characters in short rounds.',
        ],
      },
    ],
    ['Hades', 'Devil May Cry 5', 'Street Fighter 6', 'Sifu'],
    ['playing-triggers'],
  ),
  genre(
    'Adventure',
    'Explore a world and uncover its story.',
    [
      {
        text: 'Adventure games put exploration and story first. You are often solving a mystery, talking to characters, or finding out what happened in a place.',
      },
      {
        heading: 'What you usually do',
        list: [
          'Explore places at your own pace.',
          'Talk to characters and make choices.',
          'Find clues and solve small puzzles.',
          'Follow the story to its end.',
        ],
      },
      {
        heading: 'Why it suits beginners',
        text: 'Many adventure games ask for curiosity more than fast reactions, so they are a comfortable way to enjoy a story.',
      },
    ],
    ['Outer Wilds', 'A Short Hike', 'Life is Strange', 'Firewatch'],
    ['playing-world'],
  ),
  genre(
    'Shooter',
    'Aim and fire, usually from inside the action.',
    [
      {
        text: 'Shooters are built around aiming and using ranged weapons. First-person shooters show the world through your character’s eyes. Third-person shooters show your character on screen.',
      },
      {
        heading: 'What you usually do',
        list: [
          'Aim with the right stick or mouse.',
          'Move and stay out of danger.',
          'Manage ammo, health, and cover.',
          'Play a story alone or join matches online.',
        ],
      },
      {
        heading: 'Getting started',
        text: 'Aiming and moving at once takes practice. Start with a single-player game on an easier setting, and look for an aim assist option.',
      },
    ],
    ['Doom Eternal', 'Titanfall 2', 'Halo Infinite', 'Overwatch 2'],
    ['playing-sticks', 'playing-triggers'],
  ),
  genre(
    'Strategy',
    'Plan ahead and make decisions that pay off later.',
    [
      {
        text: 'Strategy games reward thinking more than reflexes. You manage units or resources and try to stay a step ahead of your opponent.',
      },
      {
        heading: 'What you usually do',
        list: [
          'Build a base, city, or deck.',
          'Manage limited resources.',
          'Plan your moves around your opponent.',
          'Learn systems that connect to each other.',
        ],
      },
      {
        heading: 'Two common types',
        list: [
          'Turn-based strategy gives you as long as you need for each move.',
          'Real-time strategy keeps moving, so decisions need to be quicker.',
        ],
      },
    ],
    ["Sid Meier's Civilization VI", 'Slay the Spire', 'Into the Breach', 'XCOM 2'],
  ),
  genre(
    'Horror',
    'Tension, fear, and survival against the odds.',
    [
      {
        text: 'Horror games use sound, darkness, and vulnerability to make you feel uneasy. You often have limited resources, and running away can be the smart choice.',
      },
      {
        heading: 'What you usually do',
        list: [
          'Explore dark, dangerous places.',
          'Save your ammo and healing items.',
          'Hide from or escape threats.',
          'Piece together what happened.',
        ],
      },
      {
        heading: 'Good to know',
        text: 'Horror ranges from quiet dread to sudden jump scares. Playing with a friend, or with the lights on, is completely valid.',
      },
    ],
    ['Resident Evil 4', 'Silent Hill 2', 'Alien: Isolation', 'Phasmophobia'],
  ),
  genre(
    'Cozy',
    'Relaxed games with low pressure and gentle goals.',
    [
      {
        text: 'Cozy games are about comfort. You might run a farm, decorate a home, or care for characters, usually at your own pace. Cozy is more of a mood than a strict genre.',
      },
      {
        heading: 'What you usually do',
        list: [
          'Build, grow, or decorate something.',
          'Follow simple daily routines.',
          'Get to know a small group of characters.',
          'Set your own goals.',
        ],
      },
      {
        heading: 'In this app',
        text: 'Simulation games count as Cozy by default. If one feels different to you, change its main genre on its game page.',
      },
    ],
    ['Stardew Valley', 'A Short Hike', 'Unpacking', 'Spiritfarer'],
  ),
  genre(
    'Racing and Sports',
    'Compete in events based on real or imagined sports.',
    [
      {
        text: 'These games are about competition and skill. Racing games focus on speed and control. Sports games turn soccer, basketball, and other sports into playable matches.',
      },
      {
        heading: 'What you usually do',
        list: [
          'Learn how a car, team, or player handles.',
          'Compete against the computer or other people.',
          'Improve your times and results.',
          'Unlock new cars, teams, or events.',
        ],
      },
      {
        heading: 'Two kinds of racing',
        list: [
          'Arcade racers are forgiving and focus on fun.',
          'Racing simulators try to feel like real driving.',
        ],
      },
    ],
    ['Forza Horizon 5', 'Rocket League', 'EA Sports FC 25', 'Gran Turismo 7'],
    ['playing-triggers'],
  ),
  genre(
    'Puzzle',
    'Use logic and observation to solve problems.',
    [
      {
        text: 'Puzzle games give you a set of rules and ask you to find the solution. The satisfaction comes from the moment everything clicks.',
      },
      {
        heading: 'What you usually do',
        list: [
          'Learn a simple rule.',
          'Combine it with rules you already know.',
          'Experiment until you see the solution.',
          'Take on harder variations.',
        ],
      },
      {
        heading: 'Why it suits beginners',
        text: 'Many puzzle games have no time pressure, so you can think for as long as you like.',
      },
    ],
    ['Portal 2', 'Unpacking', 'The Witness', 'Baba Is You'],
  ),

  {
    id: 'industry-developer',
    category: 'industry',
    title: 'Developer',
    summary: 'The team that actually makes a game.',
    sections: [
      {
        text: 'A developer, or studio, designs and builds a game. That includes programmers, artists, designers, writers, composers, and testers.',
      },
      {
        heading: 'Good to know',
        list: [
          'A developer can be one person or thousands of people.',
          'Stardew Valley was made by one person, known as ConcernedApe.',
          'The Witcher 3 was made by a large studio, CD Projekt Red.',
        ],
      },
    ],
    related: ['industry-publisher', 'industry-indie'],
  },
  {
    id: 'industry-publisher',
    category: 'industry',
    title: 'Publisher',
    summary: 'The company that helps bring a game to players.',
    sections: [
      {
        text: 'A publisher handles the business side of a game. It may pay for development, run marketing, and manage distribution and sales.',
      },
      {
        heading: 'Developer or publisher?',
        text: 'The developer makes the game, and the publisher helps release it. Doom Eternal was developed by id Software and published by Bethesda Softworks. Some companies do both, like Capcom with Resident Evil 4.',
      },
      {
        heading: 'Why it matters',
        text: 'If you love a game, its developer is usually the better name to follow, because that team made the work you enjoyed.',
      },
    ],
    related: ['industry-developer', 'industry-indie'],
  },
  {
    id: 'industry-platform',
    category: 'industry',
    title: 'Platform',
    summary: 'The system or store where you play a game.',
    sections: [
      {
        text: 'A platform is the hardware you play on, like PC, PlayStation 5, Xbox Series X|S, or Nintendo Switch. Not every game is available on every platform.',
      },
      {
        heading: 'Stores on PC',
        text: 'PC games are usually bought from a store app. Steam is the biggest, and others include the Epic Games Store and GOG. Games you buy on Steam stay in your Steam library.',
      },
      {
        heading: 'Exclusives',
        text: 'An exclusive is a game available only on certain platforms, sometimes only for a limited time.',
      },
    ],
  },
  {
    id: 'industry-indie',
    category: 'industry',
    title: 'Indie and AAA',
    summary: 'Two ends of the game-making scale.',
    sections: [
      {
        text: 'These words describe how a game was made and funded. They say nothing about its quality.',
      },
      {
        list: [
          'AAA, said "triple-A", means a big-budget game from a large studio and publisher.',
          'Indie is short for independent. It usually means a smaller team, often without a large publisher.',
        ],
      },
      {
        heading: 'Why try both',
        text: 'AAA games often have huge worlds and high production values. Indie games are often shorter, cheaper, and more experimental, which makes them great for discovering what you like.',
      },
    ],
  },
  {
    id: 'industry-releases',
    category: 'industry',
    title: 'Remake, remaster, and port',
    summary: 'Three ways an older game comes back.',
    sections: [
      {
        table: {
          headers: ['Word', 'What it means', 'Example'],
          rows: [
            ['Remaster', 'An existing game improved for newer systems', 'Sharper graphics and smoother play'],
            ['Remake', 'A game rebuilt from the ground up', 'Resident Evil 4 from 2023'],
            ['Port', 'A game adapted to run on another platform', 'A console game released on PC'],
          ],
        },
      },
    ],
    related: ['industry-platform'],
  },
  {
    id: 'industry-dlc',
    category: 'industry',
    title: 'DLC and updates',
    summary: 'How games change after release.',
    sections: [
      {
        list: [
          'DLC means downloadable content: extra content you add to a game, sometimes for a price.',
          'An expansion is a large piece of DLC, often with a new area or story.',
          'A patch is an update that fixes problems or changes the balance.',
          'Early access lets you play and buy a game before it is finished.',
        ],
      },
      {
        heading: 'Do you need DLC?',
        text: 'Usually not at first. Play the main game, then decide whether you want more.',
      },
    ],
  },

  {
    id: 'playing-dualsense',
    category: 'playing',
    title: 'Using a DualSense on PC',
    summary: 'Connect your controller with a cable or Bluetooth.',
    sections: [
      {
        heading: 'Easiest: use a USB cable',
        steps: [
          'Plug a USB-C data cable into the top of the controller.',
          'Plug the other end into your PC.',
          'Wait a few seconds for Windows to find it.',
        ],
      },
      {
        text: 'If nothing happens, try another cable. Some cables can only charge.',
      },
      {
        heading: 'Wireless: use Bluetooth',
        steps: [
          'Open Windows Settings, then Bluetooth & devices.',
          'Turn Bluetooth on and choose Add device.',
          'Hold the Create and PS buttons for about 3 seconds until the light flashes.',
          'Choose Bluetooth, then select Wireless Controller.',
        ],
      },
      {
        heading: 'Cable or Bluetooth?',
        text: 'Both work for normal play. Adaptive triggers and detailed haptics usually need a cable.',
      },
      {
        heading: 'If a game ignores the controller',
        list: [
          'Open the game from Steam, which supports the DualSense.',
          'Check the game’s Controller settings.',
          'Reconnect the controller and restart the game.',
        ],
      },
    ],
    related: ['playing-buttons'],
  },
  {
    id: 'playing-buttons',
    category: 'playing',
    title: 'Button names and Xbox prompts',
    summary: 'Match PlayStation buttons to the letters on screen.',
    sections: [
      {
        text: 'Many PC games show Xbox buttons even when a DualSense is connected. The buttons are in the same places, so go by position, not by symbol.',
      },
      { figure: 'face-buttons' },
      {
        table: {
          headers: ['DualSense', 'Xbox', 'Often used for'],
          rows: [
            ['Cross', 'A', 'Confirm or jump'],
            ['Circle', 'B', 'Back or dodge'],
            ['Square', 'X', 'Attack or reload'],
            ['Triangle', 'Y', 'Special action'],
            ['L1 and R1', 'LB and RB', 'Quick actions'],
            ['L2 and R2', 'LT and RT', 'Aim, shoot, or accelerate'],
            ['L3 and R3', 'LS and RS', 'Press the sticks in'],
          ],
        },
      },
      {
        text: 'Some games let you switch to PlayStation button icons in their settings. Look under Controls or Display.',
      },
    ],
    related: ['playing-dualsense', 'playing-triggers'],
  },
  {
    id: 'playing-sticks',
    category: 'playing',
    title: 'Moving with two sticks',
    summary: 'Most 3D games use one stick to move and one to look.',
    sections: [
      {
        text: 'In most 3D games, the left stick moves your character and the right stick moves the camera. Using both at once feels strange at first, and almost everyone needs practice.',
      },
      {
        heading: 'Tips',
        list: [
          'Keep your thumbs resting on the sticks.',
          'Use small movements, because cameras can turn quickly.',
          'Lower the camera sensitivity if it feels too fast.',
          'Try walking in a circle around an object while looking at it.',
        ],
      },
      {
        heading: 'Camera feels backwards?',
        text: 'Look for Invert Y in the settings. It swaps up and down, and many people prefer it.',
      },
    ],
    related: ['playing-buttons'],
  },
  {
    id: 'playing-triggers',
    category: 'playing',
    title: 'Triggers and bumpers',
    summary: 'The four shoulder buttons on top of the controller.',
    sections: [
      {
        text: 'The top row, L1 and R1, are bumpers. They are quick to press, so games use them for fast actions. The lower row, L2 and R2, are triggers. They can sense how far you press them.',
      },
      {
        heading: 'Common uses',
        list: [
          'L2 to aim and R2 to shoot in shooters.',
          'R2 to accelerate and L2 to brake in racing games.',
          'L1 or R1 to block, switch items, or use skills.',
        ],
      },
      {
        heading: 'How to hold them',
        text: 'Rest your index fingers on the bumpers and your middle fingers on the triggers. That way you can reach all four without moving your hands.',
      },
    ],
    related: ['playing-buttons'],
  },
  {
    id: 'playing-world',
    category: 'playing',
    title: 'Reading the game world',
    summary: 'The visual signals games use to guide you.',
    sections: [
      {
        text: 'Designers leave signals in the world so they can guide you without words. Experienced players notice them automatically, and you will too.',
      },
      {
        heading: 'Signals to look for',
        list: [
          'Bright paint or a contrasting color often marks a ledge you can climb.',
          'A light in the distance usually points toward where to go next.',
          'Glowing or sparkling objects can often be picked up or used.',
          'Red barrels often explode.',
          'A cracked wall may break open.',
          'A big empty arena usually means a fight is coming.',
        ],
      },
      {
        heading: 'If you feel lost',
        text: 'Open the map, check your current objective, and look for a light or path that stands out.',
      },
    ],
  },
  {
    id: 'playing-saving',
    category: 'playing',
    title: 'Saving and difficulty',
    summary: 'Protect your progress and choose a comfortable challenge.',
    sections: [
      {
        heading: 'How saving works',
        list: [
          'Autosave means the game saves for you, often with a small icon on screen.',
          'A checkpoint is a place you return to after failing.',
          'A manual save is one you make yourself from a menu or save point.',
        ],
      },
      {
        text: 'Before you quit, make sure the game has saved, especially if it was made before autosave was common.',
      },
      {
        heading: 'Choosing a difficulty',
        text: 'Pick the setting that lets you enjoy the game. Easy mode is a real way to play, and you can often change it later.',
      },
      {
        heading: 'Stuck?',
        text: 'Failing is a normal part of learning a game. Try a different approach, lower the difficulty, or look up a tip. None of those is cheating.',
      },
    ],
  },
];

export const CODEX_ENTRIES: CodexEntry[] = [...GUIDES, ...TIMELINE_ENTRIES, ...CONSOLE_ENTRIES];

export const GLOSSARY: GlossaryTerm[] = [
  { term: 'Aggro', definition: 'When an enemy notices you and starts attacking.' },
  { term: 'Backlog', definition: 'The list of games you want to play but have not started or finished.' },
  { term: 'Boss', definition: 'A strong enemy, usually at the end of a level or story section.' },
  { term: 'Buff', definition: 'A change that makes something stronger.' },
  { term: 'Build', definition: 'The mix of skills and gear you choose for a character.' },
  { term: 'Checkpoint', definition: 'A point you return to after failing.' },
  { term: 'Co-op', definition: 'Playing on the same side as another person.' },
  { term: 'Combo', definition: 'A chain of attacks or moves performed in a row.' },
  { term: 'Cooldown', definition: 'The wait before you can use an ability again.' },
  { term: 'Cutscene', definition: 'A story scene you watch instead of play.' },
  { term: 'Farming', definition: 'Repeating an activity to collect items or XP.' },
  { term: 'Grinding', definition: 'Doing repetitive tasks to become stronger.' },
  { term: 'Hitbox', definition: 'The invisible area that decides whether an attack lands.' },
  { term: 'HP', definition: 'Hit points, which measure health.' },
  { term: 'HUD', definition: 'The health bars, maps, and other information shown on screen.' },
  { term: 'Level', definition: 'Either a stage in a game or a measure of character growth.' },
  { term: 'Loot', definition: 'Items you collect from enemies, chests, or the world.' },
  { term: 'Main quest', definition: 'The tasks that move the main story forward.' },
  { term: 'Metroidvania', definition: 'A game with one connected map that opens up as you gain abilities.' },
  { term: 'Mod', definition: 'A fan-made change to a game.' },
  { term: 'MP', definition: 'Magic points, often spent on spells and skills.' },
  { term: 'Nerf', definition: 'A change that makes something weaker.' },
  { term: 'NPC', definition: 'A non-player character, controlled by the game.' },
  { term: 'Open world', definition: 'A large area you can explore with few restrictions.' },
  { term: 'Party', definition: 'The group of characters you play with.' },
  { term: 'Permadeath', definition: 'When a character is gone for good after dying.' },
  { term: 'PvE', definition: 'Player versus environment, meaning you fight the game.' },
  { term: 'PvP', definition: 'Player versus player, meaning you compete with other people.' },
  { term: 'QTE', definition: 'A quick time event, where you press a shown button in time.' },
  { term: 'Respawn', definition: 'To come back after dying.' },
  { term: 'Roguelike', definition: 'A game where each attempt is different and failure sends you back to the start.' },
  { term: 'Side quest', definition: 'An optional task outside the main story.' },
  { term: 'Skill tree', definition: 'A chart of abilities you unlock as you progress.' },
  { term: 'Soulslike', definition: 'A difficult action game inspired by Dark Souls.' },
  { term: 'Speedrun', definition: 'Finishing a game as fast as possible.' },
  { term: 'Stats', definition: 'Numbers that describe a character, like strength or speed.' },
  { term: 'Tutorial', definition: 'The part of a game that teaches you how to play.' },
  { term: 'XP', definition: 'Experience points, which you earn to level up.' },
];

export const findEntry = (id: string) => CODEX_ENTRIES.find((entry) => entry.id === id);
