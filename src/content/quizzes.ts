export interface QuizQuestion {
  prompt: string;
  correct: string;
  wrong: [string, string, string];
  // Shown after answering, so a wrong answer still teaches something.
  explanation: string;
  // The entry that teaches this, and a phrase from it. A test checks that the phrase is there.
  stop: string;
  source: string;
}

export interface QuizDeckQuestion extends QuizQuestion {
  options: string[];
}

export const QUIZZES: Record<string, QuizQuestion[]> = {
  playing: [
    {
      prompt: 'Your DualSense is plugged in, but Windows doesn’t notice it. What should you try first?',
      correct: 'A different USB cable',
      wrong: ['Turning off Bluetooth', 'Updating your graphics card', 'Reinstalling Windows'],
      explanation: 'Some USB cables can only charge, so they never connect the controller to your PC.',
      stop: 'playing-dualsense',
      source: 'some cables can only charge',
    },
    {
      prompt: 'A PC game tells you to press A. Which DualSense button is that?',
      correct: 'Cross, the bottom button',
      wrong: ['Circle, the right button', 'Square, the left button', 'Triangle, the top button'],
      explanation: 'Xbox and DualSense buttons share the same positions, so go by position. A is at the bottom, where Cross is.',
      stop: 'playing-buttons',
      source: 'press Cross, the bottom button',
    },
    {
      prompt: 'In most 3D games, what does the right stick do?',
      correct: 'Moves the camera',
      wrong: ['Moves your character', 'Opens the map', 'Changes your weapon'],
      explanation: 'The left stick moves your character, and the right stick moves the camera.',
      stop: 'playing-sticks',
      source: 'the right stick moves the camera',
    },
    {
      prompt: 'What can L2 and R2 do that L1 and R1 can’t?',
      correct: 'Sense how far you press them',
      wrong: ['Work without a cable', 'Move the camera', 'Save your game'],
      explanation: 'L2 and R2 are triggers. A light squeeze and a full press can do different things.',
      stop: 'playing-triggers',
      source: 'They can sense how far you press them',
    },
    {
      prompt: 'You notice a ledge covered in bright paint. What does that usually tell you?',
      correct: 'You can climb it',
      wrong: ['It will collapse soon', 'An enemy is hiding there', 'The level is about to end'],
      explanation: 'Designers often use bright paint or a contrasting color to mark ledges you can climb.',
      stop: 'playing-world',
      source: 'marks a ledge you can climb',
    },
    {
      prompt: 'What is a checkpoint?',
      correct: 'A place you return to after failing',
      wrong: ['A menu for changing the difficulty', 'An item that refills your health', 'A list of your current objectives'],
      explanation: 'When you fail, a checkpoint saves you from replaying everything before it.',
      stop: 'playing-saving',
      source: 'A checkpoint is a place you return to after failing',
    },
  ],
  genres: [
    {
      prompt: 'In an RPG, what is your build?',
      correct: 'The mix of skills, weapons, and armor you choose',
      wrong: ['The town where your story begins', 'The order you finish quests in', 'The group of people who made the game'],
      explanation: 'You choose your skills, weapons, and armor, and the mix you settle on is called a build.',
      stop: 'genre-rpg',
      source: 'the mix you settle on is called a build',
    },
    {
      prompt: 'What makes a metroidvania different from a typical platformer?',
      correct: 'One connected map that opens up with new abilities',
      wrong: ['A separate camera for each player', 'Levels that are built from cards', 'A timer that never stops running'],
      explanation: 'A metroidvania has one large connected map, and new abilities open paths that were blocked earlier.',
      stop: 'genre-platformer',
      source: 'new abilities open paths that were blocked earlier',
    },
    {
      prompt: 'What is a combo in an action game?',
      correct: 'Attacks chained together in a row',
      wrong: ['A strong enemy at the end of a level', 'Two players sharing one character', 'A special item bought from a shop'],
      explanation: 'A combo is a chain of attacks. The strong enemy at the end of a section is called a boss.',
      stop: 'genre-action',
      source: 'Chaining attacks together in a row is called a combo',
    },
    {
      prompt: 'What usually moves an adventure game forward?',
      correct: 'Curiosity, clues, and small puzzles',
      wrong: ['Winning a series of big battles', 'Racing against a strict timer', 'Earning enough gold for each level'],
      explanation: 'Instead of combat, progress usually comes from exploring, finding clues, and solving small puzzles.',
      stop: 'genre-adventure',
      source: 'progress usually comes from curiosity',
    },
    {
      prompt: 'How is a third-person shooter different from a first-person shooter?',
      correct: 'You can see your character on screen',
      wrong: ['You always play with two other people', 'You can only use melee weapons', 'The game is played in turns'],
      explanation: 'First-person shooters show the world through your character’s eyes. Third-person shooters show your character.',
      stop: 'genre-shooter',
      source: 'Third-person shooters show your character on screen',
    },
    {
      prompt: 'Why is turn-based strategy a good place to start?',
      correct: 'You can stop and think at any moment',
      wrong: ['Matches always end within minutes', 'You never have to manage resources', 'The computer makes your hard decisions'],
      explanation: 'Real-time strategy keeps moving, but turn-based strategy gives you as long as you need for each move.',
      stop: 'genre-strategy',
      source: 'you can stop and think at any moment',
    },
    {
      prompt: 'Why is every fight a decision in survival horror?',
      correct: 'Ammo and healing items are limited',
      wrong: ['Each fight must be won within a minute', 'Enemies only appear once in the game', 'Winning always ends the game'],
      explanation: 'With so few supplies, you often have to choose between fighting, hiding, and running.',
      stop: 'genre-horror',
      source: 'Ammo and healing items are limited, so every fight is a decision',
    },
    {
      prompt: 'Which sentence best describes cozy games?',
      correct: 'They are more of a mood than a strict genre',
      wrong: ['They are always about running a farm', 'They only exist on handheld consoles', 'They are all played with other people'],
      explanation: 'Cozy can include farming games, life simulators, and gentle puzzle games.',
      stop: 'genre-cozy',
      source: 'Cozy is more of a mood than a strict genre',
    },
    {
      prompt: 'What is the main difference between an arcade racer and a racing simulator?',
      correct: 'Arcade racers are forgiving, and simulators aim for real driving',
      wrong: ['Arcade racers can only be played online', 'Simulators never use a controller', 'Simulators don’t have any real cars'],
      explanation: 'Arcade racers focus on fun, while racing simulators try to feel like real driving.',
      stop: 'genre-racing-and-sports',
      source: 'Racing simulators try to feel like real driving',
    },
    {
      prompt: 'How do good puzzle games usually get harder?',
      correct: 'They combine rules you have already learned',
      wrong: ['They give you less and less time', 'They hide the rules from you forever', 'They add stronger enemies to each level'],
      explanation: 'You learn a simple rule, combine it with others, and then meet harder variations.',
      stop: 'genre-puzzle',
      source: 'combine it with rules you already know',
    },
  ],
  industry: [
    {
      prompt: 'Who made Stardew Valley?',
      correct: 'One person, Eric Barone',
      wrong: ['A large studio, CD Projekt Red', 'A team at Bethesda Softworks', 'The publisher Capcom'],
      explanation: 'Stardew Valley was made by one person, known as ConcernedApe. A developer can be any size.',
      stop: 'industry-developer',
      source: 'Stardew Valley was made by one person, Eric Barone',
    },
    {
      prompt: 'Which of these is usually a publisher’s job?',
      correct: 'Running the marketing for a game',
      wrong: ['Writing the game’s code', 'Composing the music', 'Testing for bugs before release'],
      explanation: 'The developer makes the game. The publisher handles the business side, like marketing, sales, and funding.',
      stop: 'industry-publisher',
      source: 'run marketing',
    },
    {
      prompt: 'What is an exclusive?',
      correct: 'A game available only on certain platforms',
      wrong: ['A game with no DLC', 'A game you can only play online', 'A game sold only on discs'],
      explanation: 'Exclusives give people a reason to buy certain hardware, and sometimes they last only for a limited time.',
      stop: 'industry-platform',
      source: 'An exclusive is a game available only on certain platforms',
    },
    {
      prompt: 'What do the words indie and AAA tell you about a game?',
      correct: 'How it was made and funded',
      wrong: ['How good it is', 'How long it takes to finish', 'Which genre it belongs to'],
      explanation: 'They describe the scale of a game’s budget and team. They say nothing about its quality.',
      stop: 'industry-indie',
      source: 'These words describe how a game was made and funded',
    },
    {
      prompt: 'Which word describes a game rebuilt from the ground up?',
      correct: 'Remake',
      wrong: ['Remaster', 'Port', 'Patch'],
      explanation: 'A remaster improves an existing game, a port moves it to another platform, and a remake rebuilds it.',
      stop: 'industry-releases',
      source: 'It is rebuilt from the ground up',
    },
    {
      prompt: 'What is a patch?',
      correct: 'An update that fixes problems or changes the balance',
      wrong: ['A large paid story expansion', 'A complete edition with all the DLC', 'A way to play a game before release'],
      explanation: 'Patches usually arrive automatically. Paid story additions are DLC, and playing early is early access.',
      stop: 'industry-dlc',
      source: 'A patch is an update that fixes problems or changes the balance',
    },
  ],
  'crash-and-comeback': [
    {
      prompt: 'What turned the Atari 2600 from a slow seller into a huge hit in 1980?',
      correct: 'Licensing Space Invaders',
      wrong: ['Adding a wood-paneled case', 'Lowering the price to 99 dollars', 'Releasing E.T. the Extra-Terrestrial'],
      explanation: 'Space Invaders gave people an arcade hit they could play at home, and suddenly the console was everywhere.',
      stop: 'event-atari-2600',
      source: 'Atari licensed Space Invaders',
    },
    {
      prompt: 'Why did four Atari programmers leave to start Activision?',
      correct: 'They got no public credit or share of the profits',
      wrong: ['Atari moved its offices to Japan', 'Atari stopped making games altogether', 'They wanted to build their own console'],
      explanation: 'They made many of Atari’s biggest games, asked for better treatment, and were turned down.',
      stop: 'event-activision',
      source: 'they received no public credit and no share of the profits',
    },
    {
      prompt: 'Which game, programmed in about five weeks, became a symbol of the crash?',
      correct: 'E.T. the Extra-Terrestrial',
      wrong: ['Pitfall!', 'Space Invaders', 'Super Mario Bros.'],
      explanation: 'E.T. was rushed to reach stores by Christmas, and its cartridges were later dug up from a landfill in New Mexico.',
      stop: 'event-crash',
      source: 'E.T. the Extra-Terrestrial was programmed in about five weeks',
    },
    {
      prompt: 'Which part of the Famicom’s controller came from Game & Watch?',
      correct: 'The directional pad',
      wrong: ['The analog stick', 'The touch screen', 'The shoulder buttons'],
      explanation: 'Gunpei Yokoi developed the directional pad for Game & Watch, and it soon became an industry standard.',
      stop: 'event-famicom',
      source: 'the directional pad Gunpei Yokoi had developed for Game & Watch',
    },
    {
      prompt: 'How did Nintendo make the NES seem new to American stores after the crash?',
      correct: 'It looked like a VCR and came with a toy robot',
      wrong: ['It was sold only in toy catalogs', 'It came with a free television', 'It was renamed the Atari Family Computer'],
      explanation: 'Stores wanted nothing to do with video games, so Nintendo called it an entertainment system and included R.O.B.',
      stop: 'event-nes-mario',
      source: 'look more like a VCR',
    },
  ],
  'rise-and-fall-of-sega': [
    {
      prompt: 'What was the coincidence about the SG-1000’s launch?',
      correct: 'It launched on the same day as the Famicom',
      wrong: ['It launched on the same day as Pong', 'It launched during the Olympic Games', 'It launched in the same store as the Atari 2600'],
      explanation: 'Both launched in Japan on July 15, 1983, so the rivalry began on day one.',
      stop: 'console-sg-1000',
      source: 'the very same day as Nintendo’s Famicom',
    },
    {
      prompt: 'Where did the Master System have its greatest success?',
      correct: 'Brazil',
      wrong: ['Japan', 'The United States', 'Australia'],
      explanation: 'Tectoy translated games, created original versions, and kept making new models for decades.',
      stop: 'console-master-system',
      source: 'Brazil is its greatest success story',
    },
    {
      prompt: 'What was the problem with add-ons like the Sega CD and the 32X?',
      correct: 'They confused buyers and split the audience',
      wrong: ['They could only play Sonic games', 'They were never sold in North America', 'They damaged the Genesis when plugged in'],
      explanation: 'This damaged people’s trust in Sega just before the Saturn arrived.',
      stop: 'console-genesis',
      source: 'They confused buyers and split the audience',
    },
    {
      prompt: 'What bold decision did Sega of America make with Sonic?',
      correct: 'It replaced Altered Beast as the pack-in game',
      wrong: ['It sold the character to Nintendo', 'It made Sonic an arcade-only game', 'It delayed the game by two years'],
      explanation: 'Putting Sonic in the box helped the Genesis become a real threat to Nintendo in North America.',
      stop: 'event-sonic',
      source: 'replaced Altered Beast with Sonic',
    },
    {
      prompt: 'What went wrong with the Saturn’s US launch?',
      correct: 'Sega launched it early, with little stock and few games',
      wrong: ['It was banned from US stores', 'It was recalled for overheating', 'It launched without any controllers'],
      explanation: 'At E3 in May 1995, Sega announced it was already on sale, months ahead of schedule.',
      stop: 'console-saturn',
      source: 'months ahead of schedule',
    },
    {
      prompt: 'What did the Dreamcast have built in that made it ahead of its time?',
      correct: 'A modem for online play',
      wrong: ['A DVD player', 'A motion sensor', 'A second screen on the console'],
      explanation: 'Phantasy Star Online let players from different countries team up in a console RPG.',
      stop: 'console-dreamcast',
      source: 'It came with a built-in modem',
    },
    {
      prompt: 'After Sega left hardware, where did Sonic Adventure 2: Battle appear?',
      correct: 'Nintendo GameCube',
      wrong: ['PlayStation 2', 'Xbox', 'Game Boy Advance'],
      explanation: 'Sega’s mascot had landed on the console of its oldest rival, which would have shocked anyone in the 1990s.',
      stop: 'event-sega-exits',
      source: 'Sonic Adventure 2: Battle had arrived on Nintendo GameCube',
    },
  ],
  'games-in-your-pocket': [
    {
      prompt: 'Which lasting idea came from the 1982 Donkey Kong Game & Watch?',
      correct: 'The cross-shaped directional pad',
      wrong: ['The rechargeable battery', 'The analog stick', 'The memory card'],
      explanation: 'That pad became standard on nearly every controller, and you can still see it on a DualSense.',
      stop: 'console-game-and-watch',
      source: 'the cross-shaped directional pad',
    },
    {
      prompt: 'Why did the Game Boy beat rivals with color screens?',
      correct: 'It was cheaper, tougher, and easier on batteries',
      wrong: ['It had the most powerful hardware', 'It was the only handheld with a backlight', 'It was the only handheld sold in Japan'],
      explanation: 'The Atari Lynx and Sega Game Gear were larger, cost more, and consumed batteries quickly.',
      stop: 'event-game-boy',
      source: 'consumed batteries quickly',
    },
    {
      prompt: 'What did Nintendo DS use to reach people who had never bought a game?',
      correct: 'A touch screen with games like Nintendogs and Brain Age',
      wrong: ['Free games included with each console', 'A built-in DVD player for movies', 'A link cable to plug into a TV'],
      explanation: 'Its idea of welcoming new players later led directly to the Wii.',
      stop: 'console-ds',
      source: 'reached people who had never bought a game before',
    },
    {
      prompt: 'What helped PSP most in Japan?',
      correct: 'Friends meeting up to play Monster Hunter',
      wrong: ['A built-in phone', 'A partnership with Nintendo', 'Free movies with every console'],
      explanation: 'Groups of friends played together over a local wireless connection, and it changed the series forever.',
      stop: 'console-psp',
      source: 'largely because of Monster Hunter',
    },
    {
      prompt: 'What does free-to-play mean?',
      correct: 'You download for free and can spend money inside the game',
      wrong: ['You can play free for 30 days', 'You get the game free with a phone', 'You pay once and then all updates are free'],
      explanation: 'Candy Crush Saga and Clash of Clans used this model to enormous effect.',
      stop: 'event-app-store',
      source: 'let people download games at no cost and spend money inside them',
    },
    {
      prompt: 'How could two people share a Switch game anywhere?',
      correct: 'By splitting the two Joy-Con controllers',
      wrong: ['By connecting the console to a phone', 'By passing it back and forth each level', 'By using a second dock'],
      explanation: 'The Joy-Con detach from either side of the console.',
      stop: 'event-switch',
      source: 'Two people could share a game anywhere just by splitting them',
    },
    {
      prompt: 'What lets many Windows games run on the Steam Deck?',
      correct: 'Proton',
      wrong: ['Game Pass', 'Deck Verified', 'Joy-Con'],
      explanation: 'The Steam Deck runs a Linux-based system, and Proton runs many Windows games without developers changing them.',
      stop: 'event-steam-deck',
      source: 'Proton lets many Windows games run',
    },
  ],
};

function shuffled<T>(items: T[], random: () => number): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

// Each attempt has a new order, so she answers from memory and not from where a button was.
export const quizDeck = (questions: QuizQuestion[], random: () => number = Math.random): QuizDeckQuestion[] =>
  shuffled(questions, random).map((question) => ({
    ...question,
    options: shuffled([question.correct, ...question.wrong], random),
  }));
