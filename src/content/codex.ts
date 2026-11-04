import { genreEntryId } from '../domain/genres';
import type { WardrobeGenre } from '../domain/genres';
import { strings } from '../strings';
import { CONSOLE_ENTRIES } from './consoles';
import { ENTRY_GAMES } from './entryGames';
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
  gamesToTry: CodexGame[],
  related?: string[],
): CodexEntry => ({
  id: genreEntryId(name),
  category: 'genres',
  title: name,
  genre: name,
  summary,
  sections: [...sections, { heading: strings.codex.examples, games: gamesToTry }],
  related,
});

const prose = (...paragraphs: string[]): CodexSection[] => paragraphs.map((text) => ({ text }));
const try_ = (name: string, year: number): CodexGame => ({ name, year });

const GUIDES: CodexEntry[] = [
  genre(
    'RPG',
    'Grow a character or party through a long story.',
    prose(
      `RPG stands for role-playing game. You take on the role of a character, or lead a small group called a party, and follow a story that often lasts dozens of hours. The genre grew out of tabletop games like Dungeons & Dragons, where numbers describe what each character can do, and those numbers are still at its heart.`,
      `The core loop is growth. Fighting and finishing quests earns XP, and enough XP raises your level, which makes you stronger. You choose skills, weapons, and armor, and the mix you settle on is called a build. Between fights you talk to characters, explore towns, and pick up side quests, which are optional tasks outside the main story.`,
      `RPGs come in two broad types. Turn-based RPGs let you plan each move, so they are a gentle place to start. Action RPGs happen in real time, so your reactions matter as much as your build. A long RPG can look like a huge commitment, but you rarely need to see everything. Follow the main quest, save often, and only take on the side quests that interest you.`,
    ),
    [try_('Final Fantasy VII Remake Intergrade', 2021), try_('The Witcher 3: Wild Hunt', 2015), try_('Hades', 2020), try_('Disco Elysium', 2019)],
    ['playing-saving'],
  ),
  genre(
    'Platformer',
    'Run and jump through levels built around movement.',
    prose(
      `Platformers are about moving through a space. You run, jump, and time your moves to cross gaps and avoid hazards. The genre took off in the early 1980s with arcade games like Donkey Kong, and Super Mario Bros. turned it into one of the most popular kinds of game ever made.`,
      `Most levels teach by letting you fail. You try a jump, miss it, respawn a moment later, and try again with a better sense of the timing. That quick loop is why platformers are so good for building controller confidence. Your hands learn how far a character jumps and how quickly it stops, and hidden paths and collectibles reward anyone who wants an extra challenge.`,
      `A popular related style is the metroidvania, named after Metroid and Castlevania. Instead of separate levels, it has one large connected map, and new abilities open paths that were blocked earlier. Hollow Knight is a famous example. Difficulty varies a lot across the genre, and even a tough game like Celeste has an Assist Mode that lets you adjust the challenge.`,
    ),
    [try_('Celeste', 2018), try_('Hollow Knight', 2017), try_('Portal 2', 2011), try_('Cuphead', 2017)],
    ['playing-sticks'],
  ),
  genre(
    'Action',
    'Fast fights that reward timing and quick decisions.',
    prose(
      `Action games focus on real-time challenge. You fight enemies directly, and success depends on your timing and reactions more than on long-term planning. A good fight works like a conversation: the enemy shows what it is about to do, and you decide whether to attack, dodge, or block.`,
      `Learning to read those signs is the heart of the genre. A raised weapon or a flash of light usually warns of an attack, and reacting at the right moment opens a chance to strike back. Chaining attacks together in a row is called a combo. Many games build up to a boss, a strong enemy that tests everything you have learned so far.`,
      `The genre has several styles. Hack and slash games and beat ’em ups send waves of enemies at you, as in Devil May Cry 5. Fighting games such as Street Fighter 6 match two characters in short rounds. Soulslikes, inspired by Dark Souls, are known for demanding fights. If a game feels too fast, try an easier difficulty first, because it gives you more time to learn the patterns.`,
    ),
    [try_('Hades', 2020), try_('Devil May Cry 5', 2019), try_('Street Fighter 6', 2023), try_('Sifu', 2022)],
    ['playing-triggers'],
  ),
  genre(
    'Adventure',
    'Explore a world and uncover its story.',
    prose(
      `Adventure games put exploration and story first. You are often solving a mystery, talking to characters, or finding out what happened in a place. The name comes from Adventure, a text game from the 1970s in which players typed commands to explore a cave.`,
      `Instead of combat, progress usually comes from curiosity. You look around, find clues, make choices in conversations, and solve small puzzles to open the way forward. In Life is Strange, your decisions shape the story. In Outer Wilds, nobody tells you where to go, and you work out a mystery by exploring a tiny solar system.`,
      `Many adventure games ask for curiosity more than fast reactions, so they are a comfortable way to enjoy a story. Short ones like A Short Hike are also easy to finish, and finishing a game feels great early on. You will also see the word action-adventure, which mixes exploration with combat, as The Legend of Zelda does.`,
    ),
    [try_('Outer Wilds', 2019), try_('A Short Hike', 2019), try_('Life is Strange', 2015), try_('Firewatch', 2016)],
    ['playing-world'],
  ),
  genre(
    'Shooter',
    'Aim and fire, usually from inside the action.',
    prose(
      `Shooters are built around aiming and using ranged weapons. First-person shooters show the world through your character’s eyes. Third-person shooters show your character on screen, which makes it easier to see what is around you. Doom brought the first-person shooter into the mainstream in 1993, and the genre has been one of the biggest in games ever since.`,
      `The main skill is doing two things at once. With a controller, the left stick moves you and the right stick aims, while L2 usually aims more carefully and R2 fires. At the same time you watch your ammo and health, which are shown on the HUD, the information laid over the screen. Staying in cover and moving often will keep you alive longer than perfect aim.`,
      `Shooters can be solo stories or online matches. Titanfall 2 has a campaign you play alone, while Overwatch 2 is built around teams competing against other people, which is known as PvP. Aiming and moving at once takes practice, so start with a single-player game on an easier setting, and look for an aim assist option.`,
    ),
    [try_('Doom Eternal', 2020), try_('Titanfall 2', 2016), try_('Halo Infinite', 2021), try_('Overwatch 2', 2022)],
    ['playing-sticks', 'playing-triggers'],
  ),
  genre(
    'Strategy',
    'Plan ahead and make decisions that pay off later.',
    prose(
      `Strategy games reward thinking more than reflexes. You manage units or resources and try to stay a step ahead of your opponent, whether that is another person or the computer. Chess is a good comparison: what matters is your plan, not how fast your hands are.`,
      `Most strategy games are built from systems that connect to each other. You might build a city, gather resources, or assemble a deck of cards, and each choice limits what you can do later. In Slay the Spire, every card you add changes how your whole deck plays. Losing is often useful here, because it shows you which decision went wrong.`,
      `There are two common types. Turn-based strategy gives you as long as you need for each move, as in Civilization VI and XCOM 2. Real-time strategy keeps moving, so decisions need to be quicker. Turn-based games are the better place to start, since you can stop and think at any moment. Just be ready for long sessions, because a single game of Civilization can last many hours.`,
    ),
    [try_("Sid Meier's Civilization VI", 2016), try_('Slay the Spire', 2019), try_('Into the Breach', 2018), try_('XCOM 2', 2016)],
  ),
  genre(
    'Horror',
    'Tension, fear, and survival against the odds.',
    prose(
      `Horror games use sound, darkness, and vulnerability to make you feel uneasy. You are usually weaker than whatever you are facing, and running away can be the smart choice. Games are especially good at horror because you are the one who has to open the next door.`,
      `Many belong to a style called survival horror, which Resident Evil made famous in 1996. Ammo and healing items are limited, so every fight is a decision. You explore dark places, hide from threats, and piece together what happened from notes and clues. Alien: Isolation takes this further, because the creature hunting you cannot be killed, so you spend much of the game hiding.`,
      `Horror ranges from quiet dread to sudden jump scares, and it affects everyone differently. You can make it easier on yourself by taking breaks and stopping when it stops being fun. Phasmophobia can be played in co-op, and being scared with a friend is a very different experience. Playing with the lights on is completely valid.`,
    ),
    [try_('Resident Evil 4', 2023), try_('Silent Hill 2', 2024), try_('Alien: Isolation', 2014), try_('Phasmophobia', 2020)],
  ),
  genre(
    'Cozy',
    'Relaxed games with low pressure and gentle goals.',
    prose(
      `Cozy games are about comfort. You might run a farm, decorate a home, or care for characters, usually at your own pace. There is rarely a way to lose, and nothing terrible happens if you take a day off. Cozy is more of a mood than a strict genre, so it can include farming games, life simulators, and gentle puzzle games.`,
      `Daily routines are a big part of the appeal. In Stardew Valley you plant crops, visit your neighbors, and slowly restore an old farm, one in-game day at a time. In Unpacking you take belongings out of boxes and put them away, and the objects quietly tell the story of someone’s life. Small goals like these are easy to pick up after a long day.`,
      `Cozy games also let you set your own goals. Some days you might focus on one task, and other days you might just wander around. That makes them a great place to practice moving, using menus, and reading the screen without any pressure. In this app, simulation games count as Cozy.`,
    ),
    [try_('Stardew Valley', 2016), try_('A Short Hike', 2019), try_('Unpacking', 2021), try_('Spiritfarer', 2020)],
  ),
  genre(
    'Racing and Sports',
    'Compete in events based on real or imagined sports.',
    prose(
      `These games are about competition and skill. Racing games focus on speed and control, and sports games turn soccer, basketball, and other sports into playable matches. Both give you a clear goal: finish first, or score more than the other side. Much of the fun comes from seeing yourself improve.`,
      `Racing comes in two main kinds. Arcade racers, like Forza Horizon 5, are forgiving and focus on fun. Racing simulators try to feel like real driving, and Gran Turismo 7 leans in that direction. With a controller, R2 accelerates and L2 brakes. Because triggers sense how far you press them, you can ease on and off gently instead of always going full speed.`,
      `Sports games usually follow real leagues and teams. EA Sports FC 25 is built around soccer clubs and players, while Rocket League mixes soccer with rocket-powered cars. You can play against the computer or other people, and good results often unlock new cars, teams, or events. Start on an easier setting, and learn how a car or player handles before you worry about winning.`,
    ),
    [try_('Forza Horizon 5', 2021), try_('Rocket League', 2015), try_('EA Sports FC 25', 2024), try_('Gran Turismo 7', 2022)],
    ['playing-triggers'],
  ),
  genre(
    'Puzzle',
    'Use logic and observation to solve problems.',
    prose(
      `Puzzle games give you a set of rules and ask you to find the solution. The satisfaction comes from the moment everything clicks. Tetris is the most famous example, turning falling blocks into a game almost anyone can understand in seconds.`,
      `Good puzzle games teach by building up. You learn a simple rule, combine it with rules you already know, and then meet a harder variation that makes you see the old idea differently. The Witness teaches its line puzzles without any words, while Baba Is You lets you rewrite the rules themselves, which appear as words inside each level.`,
      `Many puzzle games have no time pressure, so you can think for as long as you like, which makes them a great fit for beginners. If you get stuck, walk away for a while, because solutions often appear when you come back. Looking up a hint is fine too. Just try to read one small step rather than the full answer.`,
    ),
    [try_('Portal 2', 2011), try_('Unpacking', 2021), try_('The Witness', 2016), try_('Baba Is You', 2019)],
  ),

  {
    id: 'industry-developer',
    category: 'industry',
    title: 'Developer',
    summary: 'The team that actually makes a game.',
    sections: prose(
      `A developer, or studio, designs and builds a game. When people talk about who made a game, this is usually who they mean. The word can describe a whole company or one person working on it.`,
      `Making a game takes many kinds of work. Programmers write the code, artists create the characters and worlds, and designers decide the rules and levels. Writers create the story, composers make the music, and testers hunt for bugs before release. Early in the industry, developers often got no public credit at all, which is part of why four Atari programmers left to start Activision in 1979.`,
      `A developer can be one person or thousands of people. Stardew Valley was made by one person, Eric Barone, known as ConcernedApe. The Witcher 3 was made by a large studio, CD Projekt Red. Both are huge successes, which shows how differently games can be built.`,
    ),
    related: ['industry-publisher', 'industry-indie'],
  },
  {
    id: 'industry-publisher',
    category: 'industry',
    title: 'Publisher',
    summary: 'The company that helps bring a game to players.',
    sections: prose(
      `A publisher handles the business side of a game. It may pay for development, run marketing, and manage distribution and sales. In return, it usually takes a share of the money a game earns, and it often has a say in when the game comes out.`,
      `The developer makes the game, and the publisher helps release it. Doom Eternal was developed by id Software and published by Bethesda Softworks. Some companies do both, like Capcom with Resident Evil 4. Large publishers also own studios of their own, so the line between the two jobs can be blurry.`,
      `If you love a game, its developer is usually the better name to follow, because that team made the work you enjoyed. You can see both names on every game’s page in this app, and over time you will start to recognize the studios whose games suit you.`,
    ),
    related: ['industry-developer', 'industry-indie'],
  },
  {
    id: 'industry-platform',
    category: 'industry',
    title: 'Platform',
    summary: 'The system or store where you play a game.',
    sections: prose(
      `A platform is the hardware you play on, like PC, PlayStation 5, Xbox Series X|S, or Nintendo Switch. Not every game is available on every platform, so it is always worth checking before you buy.`,
      `PC games are usually bought from a store app. Steam is the biggest, and others include the Epic Games Store and GOG. Games you buy on Steam stay in your Steam library, so you can delete one to save space and install it again later. Store sales are also very common, which makes wishlists useful.`,
      `An exclusive is a game available only on certain platforms, sometimes only for a limited time. Companies use exclusives to give people a reason to buy their hardware. Some console exclusives reach PC a few years later, which is good news if you play on PC.`,
    ),
  },
  {
    id: 'industry-indie',
    category: 'industry',
    title: 'Indie and AAA',
    summary: 'Two ends of the game-making scale.',
    sections: prose(
      `These words describe how a game was made and funded. They say nothing about its quality. AAA, said “triple-A”, means a big-budget game from a large studio and publisher. Indie is short for independent, and it usually means a smaller team, often without a large publisher.`,
      `AAA games often have huge worlds and high production values, with hundreds of people working for years. Because they cost so much, publishers tend to stick to familiar ideas. Indie games are often shorter, cheaper, and more experimental, because a small team can take risks that a big company might avoid.`,
      `Both have produced classics. The Witcher 3 is a AAA game, while Stardew Valley and Hades are indie hits. Indie games are especially good for discovering what you like, because you can often try several for the price of one big release. The line between the two can be blurry, so treat the words as a rough guide.`,
    ),
  },
  {
    id: 'industry-releases',
    category: 'industry',
    title: 'Remake, remaster, and port',
    summary: 'Three ways an older game comes back.',
    sections: [
      ...prose(
        `Older games often return in new forms, and the words for them are easy to mix up. A remaster is an existing game improved for newer systems, usually with sharper graphics and smoother play. Underneath, it is still the same game.`,
        `A remake goes much further. It is rebuilt from the ground up, often with new graphics and controls and sometimes with changes to the story. Resident Evil 4 from 2023 is a remake of the 2005 original. A port is different again: it is a game adapted to run on another platform, like a console game released on PC.`,
      ),
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
      {
        text: `These words matter when you are choosing what to play. Old controls and cameras can feel stiff today, so a remake is often the friendliest way to meet a classic. Playing the original is still worthwhile if you are curious about how it felt at the time.`,
      },
    ],
    related: ['industry-platform'],
  },
  {
    id: 'industry-dlc',
    category: 'industry',
    title: 'DLC and updates',
    summary: 'How games change after release.',
    sections: prose(
      `Games often keep changing after release. DLC means downloadable content: extra content you add to a game, sometimes for a price. It can be as small as a new outfit or as large as an expansion, which often adds a new area or story.`,
      `A patch is an update that fixes problems or changes the balance. Most games receive patches automatically, especially soon after launch. A change that makes something stronger is called a buff, and one that makes it weaker is called a nerf. Early access is different: it lets you play and buy a game before it is finished, while the developers keep building it. Hades was made this way.`,
      `Do you need DLC? Usually not at first. Play the main game, then decide whether you want more. Some games later release a complete edition with all their DLC included, so there is rarely any rush to buy extras on day one.`,
    ),
  },

  {
    id: 'playing-dualsense',
    category: 'playing',
    title: 'Using a DualSense on PC',
    summary: 'Connect your controller with a cable or Bluetooth.',
    sections: [
      ...prose(
        `A DualSense works well on PC, and you can connect it in two ways. The easiest is a USB cable. Plug a USB-C data cable into the top of the controller, plug the other end into your PC, and wait a few seconds for Windows to find it. If nothing happens, try another cable, because some cables can only charge.`,
        `The wireless option is Bluetooth, which takes a minute to set up the first time. Both work for normal play, but adaptive triggers and detailed haptics usually need a cable. If you want to feel everything the controller can do, stay wired.`,
      ),
      {
        heading: 'Connecting with Bluetooth',
        steps: [
          'Open Windows Settings, then Bluetooth & devices.',
          'Turn Bluetooth on and choose Add device.',
          'Hold the Create and PS buttons for about 3 seconds until the light flashes.',
          'Choose Bluetooth, then select Wireless Controller.',
        ],
      },
      {
        text: `If a game ignores the controller, open it from Steam, which supports the DualSense, and check the game’s Controller settings. If that doesn’t help, reconnect the controller and restart the game.`,
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
      ...prose(
        `Many PC games show Xbox buttons even when a DualSense is connected. The buttons are in the same places, so go by position, not by symbol. When a game says to press A, press Cross, the bottom button. B is Circle on the right, X is Square on the left, and Y is Triangle on top.`,
        `Each button also has a usual job. Cross tends to confirm or jump, Circle goes back or dodges, and Square and Triangle handle attacks and special actions. Those jobs aren’t fixed, though. Older PlayStation games in Japan often used Circle to confirm and Cross to cancel, so if a menu ever feels backwards, that may be why.`,
      ),
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
        text: `Some games let you switch to PlayStation button icons in their settings. Look under Controls or Display. Many also show them automatically once the game detects a DualSense, especially when it is connected before you start the game.`,
      },
    ],
    related: ['playing-dualsense', 'playing-triggers'],
  },
  {
    id: 'playing-sticks',
    category: 'playing',
    title: 'Moving with two sticks',
    summary: 'Most 3D games use one stick to move and one to look.',
    sections: prose(
      `In most 3D games, the left stick moves your character and the right stick moves the camera. Using both at once feels strange at first, and almost everyone needs practice. Your thumbs are learning to do two separate jobs, so give them time.`,
      `Keep your thumbs resting on the sticks, and use small movements, because cameras can turn quickly. A great exercise is walking in a circle around an object while looking at it. It trains both thumbs at once, and the movement soon starts to feel natural.`,
      `If the camera feels too fast, lower the camera sensitivity in the settings. If it feels backwards, look for Invert Y, which swaps up and down. Many people prefer it, and there is no wrong choice. The sticks can also be pressed in as buttons called L3 and R3. Games often use them for actions like sprinting or crouching.`,
    ),
    related: ['playing-buttons'],
  },
  {
    id: 'playing-triggers',
    category: 'playing',
    title: 'Triggers and bumpers',
    summary: 'The four shoulder buttons on top of the controller.',
    sections: prose(
      `The top row, L1 and R1, are bumpers. They are quick to press, so games use them for fast actions like blocking, switching items, or using skills. The lower row, L2 and R2, are triggers. They can sense how far you press them, so a light squeeze and a full press can do different things.`,
      `That is why triggers handle actions that feel analog. In shooters, L2 usually aims and R2 shoots. In racing games, R2 accelerates and L2 brakes. On a DualSense, the adaptive triggers can also push back against your fingers in supported games, so pulling a bowstring can actually feel tense.`,
      `Rest your index fingers on the bumpers and your middle fingers on the triggers. That way you can reach all four without moving your hands. If you are used to holding a controller with only your index fingers, this takes a little getting used to, but it makes fast games much easier.`,
    ),
    related: ['playing-buttons'],
  },
  {
    id: 'playing-world',
    category: 'playing',
    title: 'Reading the game world',
    summary: 'The visual signals games use to guide you.',
    sections: prose(
      `Designers leave signals in the world so they can guide you without words. Experienced players notice them automatically, and you will too. The first screen of Super Mario Bros. famously teaches jumping and enemies without any instructions, and modern games use the same idea everywhere.`,
      `Color and light do most of the work. Bright paint or a contrasting color often marks a ledge you can climb. A light in the distance usually points toward where to go next. Glowing or sparkling objects can often be picked up or used.`,
      `Shapes and spaces also send messages. Red barrels often explode, and a cracked wall may break open. A big empty arena usually means a fight is coming, so look for items before you step inside. If you feel lost, open the map, check your current objective, and look for a light or path that stands out.`,
    ),
  },
  {
    id: 'playing-saving',
    category: 'playing',
    title: 'Saving and difficulty',
    summary: 'Protect your progress and choose a comfortable challenge.',
    sections: prose(
      `Games save your progress in a few different ways. Autosave means the game saves for you, often with a small icon on screen. A checkpoint is a place you return to after failing. A manual save is one you make yourself from a menu or save point. Before you quit, make sure the game has saved, especially if it was made before autosave was common.`,
      `Difficulty is a choice, not a test. Pick the setting that lets you enjoy the game. Easy mode is a real way to play, and you can often change it later. Developers include these options because they want more people to finish their games.`,
      `Failing is a normal part of learning a game. If you are stuck, try a different approach, lower the difficulty, or look up a tip. None of those is cheating. Even experienced players get stuck, and the only rule is that you should be having a good time.`,
    ),
  },
];

const withGames = (entry: CodexEntry): CodexEntry => {
  const games = ENTRY_GAMES[entry.id];
  return games ? { ...entry, sections: [...entry.sections, { heading: strings.codex.entryGames, games }] } : entry;
};

export const CODEX_ENTRIES: CodexEntry[] = [...GUIDES, ...TIMELINE_ENTRIES, ...CONSOLE_ENTRIES].map(withGames);

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
