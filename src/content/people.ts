import type { CodexEntry } from './codex';

const person = (id: string, title: string, summary: string, paragraphs: string[], related?: string[]): CodexEntry => ({
  id: `person-${id}`,
  category: 'people',
  title,
  summary,
  sections: paragraphs.map((text) => ({ text })),
  ...(related ? { related } : {}),
});

export const PEOPLE_ENTRIES: CodexEntry[] = [
  person('baer', 'Ralph Baer', 'The engineer known as the father of the video game console.', [
    `Ralph Baer was born in Germany in 1922. He was Jewish, and he was expelled from school under Nazi rule in 1933. His family emigrated to the United States in 1938. Years later he became an engineer at the defense contractor Sanders Associates, where he had an idea that sounded strange at the time: people should be able to do more with a television than watch it.`,
    `In 1966 he began sketching a device for playing games on an ordinary TV. He built a series of prototypes with Bill Harrison and Bill Rusch, ending with the Brown Box. Magnavox licensed it and released it in 1972 as the Odyssey, the first home video game console.`,
    `Baer kept inventing for the rest of his life, and he also helped create the electronic memory game Simon. In 2004 he received the US National Medal of Technology for his work on the first video game console. He died in 2014 at the age of 92.`,
  ], ['event-brown-box', 'event-odyssey']),
  person('bushnell', 'Nolan Bushnell', 'The founder of Atari, who brought games into public life.', [
    `Nolan Bushnell played Spacewar! as a student at the University of Utah, and he also worked at an amusement park. Putting those two worlds together, he imagined a computer game that could earn coins in public. With his partner Ted Dabney, he built Computer Space, released in 1971. It was too complicated for the bars it was placed in, but he learned from that failure.`,
    `In 1972 they founded Atari, taking the name from the board game Go. Their next game, Pong, was simple enough for anyone to understand, and it became the first arcade hit. Atari grew quickly, but developing a programmable console took more money than it had.`,
    `In 1976 Bushnell sold Atari to Warner Communications for 28 million dollars, and he left the company after disagreements with its new owners. He then took another idea in a different direction, combining pizza, arcade games, and animatronics in Pizza Time Theatre, which became better known as Chuck E. Cheese.`,
  ], ['event-pong', 'event-computer-space']),
  person('yokoi', 'Gunpei Yokoi', 'The Nintendo inventor who found new uses for old technology.', [
    `Gunpei Yokoi joined Nintendo in 1965 to maintain the machines that made its playing cards. His big break came when company president Hiroshi Yamauchi noticed an extending arm he had built for fun. It became the Ultra Hand, a hit toy, and Yokoi moved into product development.`,
    `His ideas shaped Nintendo’s future. He created Game & Watch, the cross-shaped directional pad, and Game Boy. He also guided a young Shigeru Miyamoto on Donkey Kong, and he produced Metroid and Kid Icarus. His philosophy was called lateral thinking with withered technology, which means using cheap, well-understood parts in fresh new ways.`,
    `That idea explains why Game Boy beat more powerful rivals. Yokoi’s last Nintendo product, Virtual Boy, was a commercial failure, and he left the company in 1996 after 31 years. He then worked on Bandai’s WonderSwan handheld, but he died in a car accident in 1997 before it was released.`,
  ], ['console-game-and-watch', 'event-game-boy']),
  person('miyamoto', 'Shigeru Miyamoto', 'The designer behind Mario and Zelda.', [
    `Shigeru Miyamoto was born in 1952 in a small town near Kyoto, and he studied industrial design. He joined Nintendo in 1977, and he was not a programmer. When an arcade game called Radar Scope failed in the US, he was given the chance to design a replacement. The result was Donkey Kong in 1981, and its little carpenter later became Mario.`,
    `With Takashi Tezuka, he went on to make Super Mario Bros. and The Legend of Zelda. Those two games shaped how designers think about movement and exploration. Zelda was inspired by his childhood, when he explored the forests and caves near his home. Super Mario 64 later showed the industry how to move through 3D worlds.`,
    `His ideas often come from everyday life. Pikmin grew out of his interest in gardening. Miyamoto is known for starting with how a game feels to play, then building everything else around that. Decades later, Nintendo’s games still carry that way of thinking.`,
  ], ['event-nes-mario', 'event-zelda', 'event-mario-64']),
  person('williams', 'Roberta Williams', 'The designer who helped put pictures in adventure games.', [
    `In the late 1970s, Roberta Williams played a text adventure on a computer and thought that a game like it could be better with pictures. She designed Mystery House, released in 1980 for the Apple II, while her husband, Ken Williams, handled the programming. It’s credited as the first graphic adventure game.`,
    `The couple’s company, On-Line Systems, became Sierra On-Line, named after the nearby Sierra Nevada. It grew into one of the biggest names in computer games. In 1984 she created King’s Quest, which was released for the IBM PCjr. The computer failed, but the game was brought to many other systems and became a bestseller, starting a long series.`,
    `She took another risk with Phantasmagoria in 1995, a horror game built with filmed actors that came on seven CD-ROMs. It sold more than a million copies. She retired in 1999, and she returned to game development in 2023 with a remake of Colossal Cave.`,
  ], ['genre-adventure']),
  person('meier', 'Sid Meier', 'The designer behind Civilization.', [
    `Sid Meier co-founded MicroProse with Bill Stealey in 1982, and the company began with flight simulators. Those games taught him how much fun could come from complicated systems, but he wanted to make something broader than a simulation.`,
    `In 1987 he released Pirates!, the first game with his name in its title. Stealey believed that putting Meier’s name on the box would convince his fans to try something new, and the idea stuck. Railroad Tycoon followed in 1990, then Civilization in 1991. It asks you to guide a society from ancient times to the space age, one turn at a time.`,
    `Civilization became one of the most loved strategy series in gaming. Meier designed the first game himself, and other designers have led the sequels. He later helped found Firaxis, the studio that has made the series since. Meier’s focus has always been on keeping the fun parts of a topic and leaving the rest out.`,
  ], ['genre-strategy']),
  person('sakaguchi', 'Hironobu Sakaguchi', 'The creator of Final Fantasy.', [
    `Hironobu Sakaguchi joined Square in 1983 as a part-time employee. The company was struggling when he directed and wrote Final Fantasy, released in 1987. Its success saved Square and began one of the biggest series in gaming.`,
    `He stayed at the heart of the company for years, and he also led the team behind Chrono Trigger in 1995, working with Dragon Quest creator Yuji Horii and artist Akira Toriyama. He then directed the film Final Fantasy: The Spirits Within, which came out in 2001 and lost a great deal of money. He stepped down from his senior role that year, and he left Square in 2003.`,
    `Sakaguchi was far from finished. He founded his own studio, Mistwalker, in 2004. It went on to make RPGs such as Blue Dragon and Lost Odyssey for Xbox 360, and Fantasian in 2021. His career is a good reminder that a person’s biggest failure doesn’t have to be the end of the story.`,
  ], ['event-final-fantasy', 'genre-rpg']),
  person('wright', 'Will Wright', 'The designer who turned everyday life into games.', [
    `Will Wright’s first game was Raid on Bungeling Bay, a helicopter game released in 1984. While making it, he built a level editor, and he noticed that he enjoyed building islands more than playing the game itself. That thought became the idea for SimCity, a game about designing a city.`,
    `Publishers didn’t know what to do with a game that had no clear way to win, so Wright formed Maxis with Jeff Braun in 1987. SimCity came out in 1989 and became a hit. Instead of giving players a goal, it gave them a toy and let them decide what to do with it.`,
    `In 1991 the Oakland firestorm destroyed his home, and rebuilding his life gave him an idea for a game about everyday living. Electronic Arts bought Maxis in 1997, and The Sims was released in 2000. It became the best-selling computer game of its time. His later game, Spore, followed life from a single cell to outer space.`,
  ], ['genre-cozy']),
  person('kojima', 'Hideo Kojima', 'The designer who made hiding a game of its own.', [
    `Hideo Kojima was born in 1963 and joined Konami in 1986. His first big project was Metal Gear, released for the MSX2 computer in 1987. The hardware couldn’t show many enemies or bullets at once, so he turned that limit into an idea: instead of fighting, the player would avoid being seen. The game helped lay the foundation for stealth games.`,
    `He became known for telling stories with the ambition of a film director. Snatcher followed in 1988, and Metal Gear Solid in 1998 brought cinematic storytelling and voice acting to PlayStation in a way few players had seen. The series also became famous for tricks that surprised players and spoke to them directly.`,
    `He left Konami in 2015 after Metal Gear Solid V: The Phantom Pain, and that December he re-established Kojima Productions as an independent studio. Its first game, Death Stranding, came out in 2019 and was built around walking across a broken America and reconnecting people.`,
  ], ['event-playstation']),
  person('carmack', 'John Carmack', 'The programmer whose technology changed PC gaming.', [
    `John Carmack is one of the most celebrated programmers in gaming. He was working at a company called Softdisk when he and his colleagues created Commander Keen in 1990. They soon left to start id Software, where his talent for making computers do the seemingly impossible became the team’s biggest advantage.`,
    `His engines moved PC games forward again and again. Wolfenstein 3D in 1992 helped define the first-person shooter, and Doom in 1993 took it into the mainstream. Quake followed in 1996. He also believed in sharing his work, and id released the source code to its older games, including Doom, for others to learn from.`,
    `His curiosity went beyond games. He funded a rocket company, Armadillo Aerospace, and in 2013 he joined Oculus as its chief technology officer, helping bring virtual reality to homes. He left in 2022 to work on artificial intelligence.`,
  ], ['event-doom', 'role-programmer']),
  person('iwata', 'Satoru Iwata', 'The programmer who became Nintendo’s president.', [
    `Satoru Iwata started as a programmer at HAL Laboratory while he was still a student, and he joined full-time in 1982. He worked on Nintendo games such as Balloon Fight, and he became HAL’s president in 1993, helping it survive a financial crisis. He also worked on EarthBound and on several Kirby games.`,
    `He joined Nintendo in 2000 and became its fourth president in 2002. Facing rivals with more powerful hardware, he asked a different question: how could Nintendo reach people who didn’t play games? That thinking led to Nintendo DS, Brain Age, and Wii, along with Wii Sports, which brought whole families together.`,
    `Players loved him for his warmth. He started the Iwata Asks interviews and helped launch Nintendo Direct, speaking straight to fans. He once said: “On my business card, I am a corporate president. In my mind, I am a game developer. But in my heart, I am a gamer.” He died in 2015 at the age of 55.`,
  ], ['event-wii', 'console-ds']),
  person('miyazaki', 'Hidetaka Miyazaki', 'The director behind Dark Souls and Elden Ring.', [
    `Hidetaka Miyazaki came to games late. He was working as an account manager at Oracle when he decided to change careers, and he joined FromSoftware in 2004 at the age of 29. He began as a planner on Armored Core: Last Raven.`,
    `When he heard about a troubled project that the company considered a failure, he offered to help. It became Demon’s Souls in 2009, a demanding game that was very different from what most big games were doing. Dark Souls followed in 2011, and its success gave a name to a whole style of game, the soulslike. Bloodborne and Sekiro: Shadows Die Twice continued that run.`,
    `He became the president of FromSoftware in 2014 while continuing to direct games. Elden Ring, released in 2022, brought his style to a huge open world, with worldbuilding by George R. R. Martin. It sold more than 25 million copies, showing that a tough game could also reach a massive audience.`,
  ], ['genre-action']),
];
