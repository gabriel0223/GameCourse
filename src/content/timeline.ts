import type { CodexEntry, CodexSection } from './codex';

export interface TimelineGroup {
  generation: number;
  title: string;
  years: string;
  color: string;
}

export const TIMELINE_GROUPS: TimelineGroup[] = [
  { generation: 0, title: 'Before consoles', years: '1958–1971', color: '#A9AFCC' },
  { generation: 1, title: 'Generation 1', years: '1972–1983', color: '#7C9BFF' },
  { generation: 2, title: 'Generation 2', years: '1976–1992', color: '#62C7F2' },
  { generation: 3, title: 'Generation 3', years: '1983–2003', color: '#5FD0B6' },
  { generation: 4, title: 'Generation 4', years: '1987–2004', color: '#AFC968' },
  { generation: 5, title: 'Generation 5', years: '1993–2006', color: '#F2E27D' },
  { generation: 6, title: 'Generation 6', years: '1998–2013', color: '#FFC857' },
  { generation: 7, title: 'Generation 7', years: '2005–2017', color: '#FF9463' },
  { generation: 8, title: 'Generation 8', years: '2012–present', color: '#F0708A' },
  { generation: 9, title: 'Generation 9', years: '2020–present', color: '#C9A6FF' },
];

interface GenerationInput {
  n: number;
  summary: string;
  history: string[];
  innovations: string[];
  games: string[];
  note?: string;
}

const generation = ({ n, summary, history, innovations, games, note }: GenerationInput): CodexEntry => {
  const group = TIMELINE_GROUPS[n];
  const sections: CodexSection[] = [
    ...history.map((text) => ({ text })),
    { heading: 'Innovations', list: innovations },
    { heading: 'Consoles', consoles: n },
  ];
  if (note) sections.push({ text: note });
  sections.push({ heading: 'Games that defined it', list: games });
  return {
    id: `gen-${n}`,
    category: 'history',
    title: group.title,
    summary,
    timeline: { kind: 'generation', generation: n, year: Number(group.years.slice(0, 4)), label: group.years },
    sections,
  };
};

const event = (
  id: string,
  gen: number,
  year: number,
  title: string,
  summary: string,
  paragraphs: string[],
): CodexEntry => ({
  id: `event-${id}`,
  category: 'history',
  title,
  summary,
  timeline: { kind: 'event', generation: gen, year, label: String(year) },
  sections: paragraphs.map((text) => ({ text })),
});

export const TIMELINE_ENTRIES: CodexEntry[] = [
  generation({
    n: 1,
    summary: 'The first home consoles and a flood of Pong machines.',
    history: [
      `Video games moved from research labs into living rooms with the Magnavox Odyssey in 1972. It had no sound, no color, and no score display, so families kept score on paper and used plastic overlays to turn the screen into a game board. It looks primitive today, but the basic idea of plugging a game machine into a television has not changed since.`,
      `Atari’s arcade game Pong then showed how popular electronic games could be. When Home Pong arrived through Sears in 1975, it brought a real hit into the house, with automatic scoring and sound that the Odyssey had lacked. Coleco, Nintendo, and many others followed with their own ball-and-paddle systems.`,
      `Cheap chips made these consoles easy to build, and that became the problem. Stores filled with nearly identical machines, each locked to a few built-in games. Prices fell, buyers lost interest, and the market suffered a smaller crash in 1977. The industry needed consoles that could offer something new after the first week, which led directly to the next generation.`,
    ],
    innovations: [
      'Consoles that connected to a home television.',
      'Built-in games, usually based on a ball and paddles.',
      'On-screen score tracking and internal sound on Pong systems.',
      'Integrated circuits, which made consoles cheaper to build.',
    ],
    games: ['Pong', 'Tennis on the Magnavox Odyssey', 'Home Pong variations'],
  }),
  generation({
    n: 2,
    summary: 'Cartridges turned a console into a game library.',
    history: [
      `Before this generation, a console usually played only the games built into it. Cartridges changed that. The Fairchild Channel F introduced them in 1976, and suddenly a console was a platform that could keep getting new games for years. Companies could sell the hardware at a modest price and earn their money on software, a model the industry still uses.`,
      `The Atari 2600 became the system of the era, especially after its 1980 version of Space Invaders gave people a reason to buy one. Mattel’s Intellivision and Coleco’s ColecoVision competed with better graphics, and Activision proved that companies other than the console maker could publish games. Arcades were booming at the same time, so the biggest arcade hits became the most wanted games at home.`,
      `That success grew too quickly. Anyone could publish for the Atari 2600, and stores filled with rushed games. By 1983, too many consoles and too many weak titles helped cause a major crash in North America. Handheld electronics kept growing, though, and Nintendo’s Game & Watch introduced the cross-shaped directional pad that would soon appear on nearly every controller.`,
    ],
    innovations: [
      'ROM cartridges, first used on the Fairchild Channel F.',
      'Third-party developers, starting with Activision.',
      'Home versions of popular arcade games.',
      'Handheld electronic games, including Game & Watch.',
    ],
    games: ['Space Invaders', 'Pac-Man', 'Pitfall!', 'Adventure'],
  }),
  generation({
    n: 3,
    summary: 'Nintendo rebuilt the industry in the 8-bit era.',
    history: [
      `After the North American crash, Japan became the center of console gaming. Nintendo released the Famicom there in 1983, and it became a hit despite an early recall. When Nintendo brought it to the US as the Nintendo Entertainment System in 1985, it avoided the words video game and sold the system with a small toy robot, because American retailers still feared a repeat of the crash.`,
      `The strategy worked, and the games did the rest. Super Mario Bros., The Legend of Zelda, Metroid, Dragon Quest, and Final Fantasy established series and genres that are still central to gaming. Nintendo also kept strict control of its platform. A lockout chip meant publishers needed its approval, and a Seal of Quality was meant to reassure parents and stores that the flood of bad games was over.`,
      `Sega’s Master System was technically competitive and did well in Europe and Brazil, but it could not match Nintendo’s library in the US and Japan. Atari’s return with the 7800 made little impact. By the end of the generation, Nintendo had nearly become another word for video games, especially in North America.`,
    ],
    innovations: [
      '8-bit processors with better sprites and scrolling backgrounds.',
      'Directional pads on home controllers.',
      'Battery saves, which let long adventures continue later.',
      'A lockout chip that gave Nintendo control over which games were released.',
    ],
    games: ['Super Mario Bros.', 'The Legend of Zelda', 'Metroid', 'Final Fantasy', 'Mega Man 2'],
  }),
  generation({
    n: 4,
    summary: 'The 16-bit era and the Nintendo versus Sega rivalry.',
    history: [
      `Better processors brought richer color, sound, and animation, but the era is best remembered for its rivalry. NEC’s PC Engine arrived first in Japan, while Sega’s Genesis took on Nintendo in North America with an aggressive marketing campaign. Its slogan, Genesis does what Nintendon’t, made Sega the cool alternative, and Sonic the Hedgehog gave it a star.`,
      `Nintendo answered with the Super NES in 1990. It used clever graphics effects, including a mode that could scale and rotate backgrounds, and the system built an extraordinary library of RPGs and platformers. Genesis held a strong position in North America for several years, while Super NES finished as the global leader. Fans argued about the two systems on playgrounds everywhere.`,
      `Games also became more controversial as they became more realistic. Mortal Kombat and other titles led to US Senate hearings and, in 1994, the ESRB rating system. Meanwhile, Game Boy turned handheld gaming into a major business, and experiments with CD-ROM add-ons pointed toward a bigger shift. The cartridge’s days were numbered.`,
    ],
    innovations: [
      '16-bit graphics and audio.',
      'CD-ROM add-ons, which hinted at the future of game storage.',
      'Coprocessors in cartridges, such as the Super FX chip behind Star Fox.',
      'A large handheld market led by Game Boy.',
    ],
    games: ['Super Mario World', 'Sonic the Hedgehog', 'Street Fighter II', 'Chrono Trigger', 'Tetris on Game Boy'],
  }),
  generation({
    n: 5,
    summary: 'Games moved into 3D, and Sony entered the race.',
    history: [
      `This generation changed how games looked and how they were played. Developers moved from flat sprites to 3D polygons, and that forced them to solve problems nobody had faced before. How should a camera follow a character? How should movement feel? Early answers were often clumsy, but within a few years games like Super Mario 64 and Tomb Raider had set new standards.`,
      `Sony’s arrival was the biggest surprise. PlayStation launched in Japan in 1994 and quickly gained support from developers who liked its CDs, which held far more data and were much cheaper to produce than cartridges. Final Fantasy VII, previously expected on a Nintendo system, became one of its defining games. Sony also marketed PlayStation to older players, helping games shed their image as toys.`,
      `Sega’s Saturn suffered from complicated hardware and a surprise early US launch that upset retailers. Nintendo 64 stayed with cartridges, which meant fast loading but much less storage. It produced some of the era’s best games, but it could not stop the shift. PlayStation became the first console to sell more than 100 million units, and the industry’s center of power had moved again.`,
    ],
    innovations: [
      '3D polygon graphics.',
      'Optical discs replacing cartridges on most systems.',
      'Memory cards for saving progress.',
      'Analog sticks and vibration on controllers.',
    ],
    games: ['Super Mario 64', 'The Legend of Zelda: Ocarina of Time', 'Final Fantasy VII', 'Metal Gear Solid', 'Resident Evil'],
  }),
  generation({
    n: 6,
    summary: 'PlayStation 2 became the best-selling console, and Xbox arrived.',
    history: [
      `Sega’s Dreamcast launched first in 1998, with a built-in modem and an adventurous library that included Crazy Taxi, Jet Set Radio, and Shenmue. It was ahead of its time, but excitement around PlayStation 2 and Sega’s weakened finances were too much to overcome. In 2001, Sega stopped making consoles altogether.`,
      `PlayStation 2 became the dominant system of the era and the best-selling console ever, at about 160 million units. Its DVD playback made it an appealing purchase in itself, and it could also play original PlayStation games, so owners did not have to abandon their collections. Its library grew to thousands of games across nearly every genre, led by Grand Theft Auto III and its enormous open world.`,
      `Microsoft entered the market with Xbox, built on PC technology and led by Halo. Its real long-term success was Xbox Live, which gave console players a unified online service with friends lists and voice chat. Nintendo’s GameCube sold less but gave players Metroid Prime and Super Smash Bros. Melee. By the end of the generation, the three-way race between Sony, Microsoft, and Nintendo was established.`,
    ],
    innovations: [
      'DVD-based games and movie playback.',
      'Online console play.',
      'Backward compatibility on PlayStation 2.',
      'Much larger open-world games.',
    ],
    games: ['Halo: Combat Evolved', 'Grand Theft Auto III', 'Metroid Prime', 'Shadow of the Colossus', 'Resident Evil 4'],
  }),
  generation({
    n: 7,
    summary: 'HD graphics, online stores, and motion controls.',
    history: [
      `Xbox 360 launched first in 2005 and benefited from a year’s head start over PlayStation 3. Both pushed high-definition graphics, and online features became central to the experience. Players could now download games, install updates, buy extra content, and earn achievements, an idea Xbox 360 helped make standard. Sony’s expensive launch hurt early on, but PlayStation 3 recovered, helped by its Blu-ray drive.`,
      `Nintendo went in a different direction. Rather than compete on power, it released Wii, a modest console built around motion controls. Wii Sports was so easy to understand that grandparents and children could play together, and Wii became the generation’s sales leader. Microsoft and Sony later responded with Kinect and PlayStation Move, though neither changed gaming in the same way.`,
      `The rest of the game world was changing too. Development budgets soared, and many mid-sized studios struggled. At the same time, digital stores opened the door for small teams, and games like Braid and Limbo helped start an indie boom. Apple’s App Store then turned smartphones into a huge game platform, reaching billions of people who might never have bought a console.`,
    ],
    innovations: [
      'High-definition output over HDMI.',
      'Motion controls, including Wii Remote, Kinect, and PlayStation Move.',
      'Digital stores, downloadable games, and achievements.',
      'Blu-ray storage on PlayStation 3.',
    ],
    games: ['Wii Sports', 'The Elder Scrolls V: Skyrim', 'BioShock', 'Portal 2', 'The Last of Us'],
  }),
  generation({
    n: 8,
    summary: 'Digital games, live services, and the hybrid Switch.',
    history: [
      `PlayStation 4 and Xbox One arrived in 2013 with a focus on connected play, sharing, and digital libraries. Sony learned from the expensive PlayStation 3 and built a developer-friendly system, while Microsoft stumbled with an unpopular early plan around online checks and game ownership. Those policies were reversed, but PlayStation 4 kept a commanding lead throughout the generation.`,
      `Games increasingly became services that changed over time. Fortnite, Destiny, and Grand Theft Auto Online kept players returning with seasons, events, and in-game purchases. Streaming on Twitch and YouTube turned watching games into a major pastime, and cross-play slowly broke down the walls between platforms. Virtual reality also finally reached consumers, even if it stayed a smaller market.`,
      `Nintendo’s generation began badly with Wii U, which confused buyers and sold only about 13.6 million units. Switch completely changed its fortunes in 2017. A console you could play on a TV and carry as a handheld turned out to be exactly what many players wanted, and it became one of the best-selling systems of all time. It also became a welcoming home for indie games.`,
    ],
    innovations: [
      'Hybrid console design on Nintendo Switch.',
      '4K output on upgraded console models.',
      'Consumer VR headsets.',
      'Built-in screenshot, video, and sharing tools.',
    ],
    games: ['The Legend of Zelda: Breath of the Wild', 'The Witcher 3: Wild Hunt', 'Fortnite', 'God of War', 'Hades'],
  }),
  generation({
    n: 9,
    summary: 'Fast storage, ray tracing, and rising hardware costs.',
    history: [
      `PlayStation 5 and Xbox Series X|S launched in November 2020, in the middle of a pandemic. Chip shortages and scalpers made them difficult to buy for much of the following two years. Their biggest change was less visible than earlier leaps. Solid-state drives cut loading times dramatically, while ray tracing made lighting and reflections more realistic.`,
      `Because older consoles were so popular, many major games continued to launch on PlayStation 4 and Xbox One, which blurred the start of the generation. Subscription services like Xbox Game Pass grew, and Microsoft began releasing some of its games on rival systems. Its purchase of Activision Blizzard in 2023 was among the largest deals in the history of entertainment.`,
      `Handheld play became one of the era’s most interesting stories. Steam Deck showed that PC games could work well on a portable device, and similar machines from other companies followed. Nintendo released Switch 2 in 2025. By 2026, memory shortages and tariffs had pushed console prices upward, an unusual reversal this far into a generation, and raised real questions about what the next one will cost.`,
    ],
    innovations: [
      'Fast custom SSD storage.',
      'Real-time ray tracing.',
      'Haptics and adaptive triggers on the DualSense.',
      'Handheld gaming PCs and wider cloud gaming.',
    ],
    note: 'Generations are a convention, not an official standard. Nintendo Switch 2 is listed here because of when it launched, but sources do not yet agree on its generation.',
    games: ['Elden Ring', 'Baldur’s Gate 3', 'The Legend of Zelda: Tears of the Kingdom', 'Astro Bot'],
  }),

  event(
    'tennis-for-two',
    0,
    1958,
    "Tennis for Two",
    "An early interactive game built for a public open day.",
    [
      `Every year, Brookhaven National Laboratory in New York opened its doors to the public. Physicist William Higinbotham thought the usual static displays were dull, so for the 1958 visitors’ day he decided to build something people could actually touch. Working with technician Robert Dvorak, he connected an analog computer to a small oscilloscope and created a side-view tennis game.`,
      `Two players held boxes with a knob and a button. The knob set the angle of a shot, and the button hit a ball that arced over a net and bounced realistically. Visitors lined up to try it, often ignoring the serious science around it. An improved version returned in 1959, then the machine was taken apart so its parts could be reused.`,
      `Tennis for Two was not the first game on an electronic screen. A. S. Douglas had made OXO, a tic-tac-toe program, at Cambridge in 1952. What makes Higinbotham’s game special is its purpose. It was designed for fun, for two people, using controllers, and for a general audience. He never patented it, and for years few people knew it had existed.`,
    ],
  ),
  event(
    'spacewar',
    0,
    1962,
    "Spacewar!",
    "Students at MIT created a two-player space battle.",
    [
      `In 1961, MIT received a PDP-1, a computer small enough to sit in a room and fast enough to respond to people in real time. A group of young programmers, including Steve Russell, Martin Graetz, and Wayne Wiitanen, wanted to show what it could do. Their answer was Spacewar!, finished in 1962.`,
      `Two players controlled spaceships armed with torpedoes, trying to destroy each other near a star whose gravity pulled both ships in. The group kept improving it together. Peter Samson added an accurate star map, Dan Edwards programmed the gravity, and Graetz added a desperate hyperspace jump. Because the computer’s switches were tiring to use, Alan Kotok and Bob Saunders built custom control boxes, which were early gamepads.`,
      `The code was shared freely, and copies spread to universities and research centers. DEC even used it to test new PDP-1 machines. A whole generation of programmers grew up playing it, including Nolan Bushnell, who later founded Atari. In 1972, Stanford hosted the Intergalactic Spacewar Olympics, often called the first video game tournament. The prize was a year’s subscription to Rolling Stone.`,
    ],
  ),
  event(
    'brown-box',
    0,
    1967,
    "The Brown Box",
    "Ralph Baer’s team built a prototype for playing games on TV.",
    [
      `Ralph Baer was an engineer at the defense contractor Sanders Associates when he had a simple thought. Millions of homes had televisions, so why could people only watch them? In 1966, he began sketching a device that would let people play games on an ordinary TV, then persuaded his employer to fund the unusual idea.`,
      `Working with Bill Harrison and Bill Rusch, Baer built a series of prototypes. They could run chase games, ball games, and even a target game with a toy light gun. The final version, finished in 1968, was covered in wood-grain tape to make it look more like home furniture, and that gave it the nickname the Brown Box.`,
      `Television makers were interested but slow to commit. Magnavox finally signed a license, and the Brown Box became the Odyssey in 1972. Baer kept inventing for decades and later helped create the electronic memory game Simon. He received the US National Medal of Technology, and the Brown Box is now held by the Smithsonian. That’s why he’s often called the father of the video game console.`,
    ],
  ),
  event(
    'computer-space',
    0,
    1971,
    "Computer Space",
    "The first commercially sold coin-operated video game.",
    [
      `Nolan Bushnell had played Spacewar! as a student at the University of Utah and worked at an amusement park, so he could imagine what few others did: a computer game earning coins in public. Computers were still far too expensive for that, so he and his partner, Ted Dabney, built dedicated hardware instead.`,
      `Their game, Computer Space, was released through Nutting Associates in late 1971. The player steered a rocket and fought two flying saucers on a black-and-white screen. Its curvy fiberglass cabinet looked like something from a science fiction movie, and it remains one of the most striking arcade designs ever made. A similar project, Galaxy Game, appeared at Stanford a little earlier, but only as a single installation.`,
      `Computer Space sold reasonably well but never became a mass hit. Its rocket controls and long instructions confused people in bars, who just wanted something simple. Bushnell learned from that failure. In 1972, he and Dabney founded Atari, and their next game was so easy that it barely needed instructions at all.`,
    ],
  ),
  event(
    'odyssey',
    1,
    1972,
    "Magnavox Odyssey",
    "The first home video game console reached stores.",
    [
      `When the Magnavox Odyssey went on sale in September 1972, there was nothing else like it in stores. Based on Ralph Baer’s Brown Box, it cost about 100 US dollars and came with two controllers, a set of game cards, dice, play money, and plastic overlays that families taped to their TV screens.`,
      `The machine itself could only display a few white squares and a line. It had no sound or color, and it didn’t track scores. The overlays and board game pieces did much of the imaginative work. A hockey overlay turned the dots into a rink, while a haunted house game asked players to imagine moving through its rooms. Sales suffered further because many people wrongly believed it only worked on Magnavox TVs.`,
      `The Odyssey sold around 350,000 units, a modest success, but its influence went far beyond that. Nolan Bushnell attended a demonstration in 1972 and saw its table tennis game before Atari released Pong. Magnavox later sued, and Atari settled and became a licensee. That case helped make the Odyssey’s patents valuable, and they brought in money from the industry for years.`,
    ],
  ),
  event(
    'pong',
    1,
    1972,
    "Pong",
    "Atari’s simple tennis game became the first arcade hit.",
    [
      `Pong began as a practice project. Nolan Bushnell asked new Atari engineer Allan Alcorn to build a simple tennis game, partly to give him experience. Alcorn made it better than expected, adding sound effects and splitting the paddles so the ball bounced at different angles depending on where it hit.`,
      `The prototype was installed at Andy Capp’s Tavern in Sunnyvale, California. According to a famous story, it soon stopped working, and Alcorn found the problem when he opened the machine: its coin box was overflowing. The instructions were almost a joke in their simplicity. Avoid missing ball for high score. Anyone could understand that, even with a drink in one hand.`,
      `Atari built the cabinets itself and sold them as quickly as it could. Competitors copied the idea almost immediately, and the arcade industry took off. In 1975, Atari partnered with Sears to sell Home Pong for the holidays, and it became a hit there too. Pong wasn’t the first video game, but it was the one that proved games could be a large business and a part of everyday culture.`,
    ],
  ),
  event(
    'atari-2600',
    2,
    1977,
    "Atari 2600",
    "The console that made cartridges a household idea.",
    [
      `Atari knew that dedicated Pong machines would not last. Its answer was a programmable console that could play new games from cartridges. Developing it took more money than the company had, so Nolan Bushnell sold Atari to Warner Communications in 1976. The Video Computer System, later renamed the Atari 2600, launched in September 1977 with a wood-paneled case and a simple joystick.`,
      `Sales were slow at first, and internal tensions led to Bushnell’s departure in 1978. Everything changed in 1980 when Atari licensed Space Invaders, giving people an arcade hit they could play at home. Suddenly the console was everywhere. Its programmers learned to squeeze remarkable results from very limited hardware, including Adventure, which pioneered the action-adventure game.`,
      `Adventure is also remembered for its creator, Warren Robinett. Atari did not credit its programmers, so he hid a secret room containing his name, and players discovered it after release. It became one of the most famous early Easter eggs. The Atari 2600 sold about 30 million units and stayed on sale until 1992, far outliving the company’s period of dominance.`,
    ],
  ),
  event(
    'space-invaders',
    2,
    1978,
    "Space Invaders",
    "An arcade phenomenon from Japan.",
    [
      `Tomohiro Nishikado designed Space Invaders at Taito and even built the custom hardware needed to run it. Players moved a cannon along the bottom of the screen and fired at rows of descending aliens. Each wave moved closer, and a heartbeat-like sound quickened as the danger grew. There was no way to simply win. The goal was to last as long as possible.`,
      `One of its best features came from a technical limit. The hardware could move the aliens faster as there were fewer left to draw, so the game accelerated as players succeeded. Nishikado kept that effect, and the rising tension became central to the experience. The game also kept a high score on screen, giving players a reason to return and beat it.`,
      `Space Invaders became a sensation in Japan, and entire arcades were devoted to it. A popular story claims it caused a shortage of 100-yen coins, though that claim is often disputed. It went on to spread worldwide, and its 1980 Atari 2600 version became a major console seller. Many designers, including Shigeru Miyamoto, have named it as an inspiration for entering the field.`,
    ],
  ),
  event(
    'activision',
    2,
    1979,
    "Activision is founded",
    "Four Atari programmers started the first third-party developer.",
    [
      `By the late 1970s, a handful of programmers were creating most of Atari’s biggest games, yet they received no public credit and no share of the profits. When David Crane, Larry Kaplan, Alan Miller, and Bob Whitehead looked at how much their games had earned, they were stunned. They asked for better treatment, were turned down, and left to start their own company in 1979.`,
      `Activision was built on an idea that seems obvious now: treat game developers as creators. Its boxes named designers, and its games had a noticeably high standard. It proved that a company could release games for a console it did not make. Atari sued, but the case settled in 1982 with an agreement that let Activision keep publishing in exchange for royalties.`,
      `Activision’s greatest early hit was Pitfall!, designed by David Crane, which helped define the side-scrolling adventure. Its success also attracted less careful imitators. Companies with no game experience, even the food maker Quaker Oats, rushed into the market. That flood of poor games helped trigger the 1983 crash, and Nintendo later made sure it controlled who could publish on its console.`,
    ],
  ),
  event(
    'pac-man',
    2,
    1980,
    "Pac-Man",
    "A maze game that became a pop culture icon.",
    [
      `By 1980, arcades were full of games about shooting aliens. Namco designer Toru Iwatani wanted something different that would also appeal to women and couples, who often avoided arcades. He built his game around eating, an everyday activity anyone could relate to. Part of the character’s shape is said to have come from a pizza with a slice removed.`,
      `The game launched in Japan as Puck Man, a name changed for the US partly because of how easily it could be vandalized. Its four ghosts each had a personality. Blinky chased the player directly, Pinky tried to get ahead, Inky behaved unpredictably, and Clyde wandered off when he got too close. Those simple rules made the ghosts feel alive, and power pellets let the hunted become the hunter for a moment.`,
      `Pac-Man became an enormous hit and one of the first true video game characters. There were toys, lunchboxes, a cartoon series, and even a hit song, Pac-Man Fever. The Atari 2600 version was widely criticized, despite selling millions of copies, and its disappointment contributed to doubts about the industry. Pac-Man himself remains one of the most recognized characters in gaming.`,
    ],
  ),
  event(
    'crash',
    2,
    1983,
    "The video game crash",
    "The North American console market collapsed.",
    [
      `In the early 1980s, video games looked unstoppable in North America, but the boom was fragile. There were many competing consoles, anyone could publish games for them, and stores had no reliable way to tell a good game from a bad one. Home computers were also falling in price, and they could play games while doing much more.`,
      `By 1983, shelves were crowded with cheap, rushed titles, and unsold stock was being heavily discounted. Atari’s own decisions made things worse. Its Pac-Man port disappointed buyers, and E.T. the Extra-Terrestrial was programmed in about five weeks by Howard Scott Warshaw to reach stores by Christmas. It became a symbol of the collapse. Atari lost hundreds of millions of dollars, and many other companies closed.`,
      `Retailers came to see video games as a passing fad and were reluctant to stock them. The crash mainly hit North America, though, and Japan’s market kept growing. That opened the door for Nintendo, which approached the US carefully and controlled which games appeared on its system. A long-rumored landfill of Atari cartridges in Alamogordo, New Mexico, was confirmed when a team dug it up in 2014.`,
    ],
  ),
  event(
    'famicom',
    3,
    1983,
    "Famicom launches",
    "Nintendo’s first cartridge console arrived in Japan.",
    [
      `Nintendo began in 1889 as a maker of playing cards, and by the early 1980s it was doing well with toys, Game & Watch handhelds, and Donkey Kong in arcades. President Hiroshi Yamauchi wanted a cheap home console that could beat its rivals, and engineer Masayuki Uemura led the project. The result was the Family Computer, or Famicom.`,
      `It launched in Japan on July 15, 1983, at 14,800 yen, with Donkey Kong, Donkey Kong Jr., and Popeye. Its red and white design looked like a toy, but its hardware could run faithful versions of arcade games. Its controller also used the directional pad Gunpei Yokoi had developed for Game & Watch, a design that soon became an industry standard.`,
      `The launch was not perfect. A faulty chip caused crashes, and Nintendo recalled early units at considerable cost. Once that was fixed, the console took off, helped by a growing library of games. Its success made Nintendo the dominant name in Japan and gave it a strong position to enter the shattered US market two years later.`,
    ],
  ),
  event(
    'tetris',
    3,
    1984,
    "Tetris",
    "A simple puzzle game from Moscow conquered the world.",
    [
      `Alexey Pajitnov was a computer engineer at the Soviet Academy of Sciences in Moscow when he created Tetris in 1984 on an Electronika 60 computer. Inspired by pentomino puzzles, he used pieces made of four squares and named the game after the Greek word tetra and his favorite sport, tennis.`,
      `Tetris was addictive from the start. Falling shapes must be turned and fitted into complete rows, which disappear before the stack reaches the top. Colleagues kept playing it at work, and Vadim Gerasimov helped port it to IBM computers. Copies spread across Moscow and then beyond the Soviet Union, where it attracted Western companies eager to sell it.`,
      `Then came one of the strangest business battles in gaming. Several companies believed they had the rights, while the Soviet agency Elorg controlled them. Henk Rogers traveled to Moscow and secured the handheld rights for Nintendo, which led to the famous Game Boy version. Pajitnov received no royalties at first, because the Soviet state owned his work. Only in 1996, with The Tetris Company, did he begin earning from his creation.`,
    ],
  ),
  event(
    'nes-mario',
    3,
    1985,
    "NES and Super Mario Bros.",
    "Nintendo revived the American console market.",
    [
      `After the crash, American stores wanted nothing to do with video games. Nintendo redesigned the Famicom to look more like a VCR, called it an entertainment system, and included R.O.B., a small toy robot, to make it seem like something new. It launched in a limited New York test on October 18, 1985, with Nintendo’s staff working hard to convince retailers to take a chance.`,
      `The best argument was Super Mario Bros., released in Japan that September. Shigeru Miyamoto and Takashi Tezuka designed a world that taught itself. The first screen of World 1-1 shows you how enemies, jumps, and mushrooms work without using any instructions. Koji Kondo’s music became instantly recognizable, and Mario’s weight and momentum felt better than anything before it.`,
      `NES became a national craze. Super Mario Bros. sold over 40 million copies, and Nintendo controlled the market with a Seal of Quality and strict licensing rules. Those policies helped rebuild trust but later drew legal and public criticism. Either way, the American console market had come back from the dead, and Mario had become gaming’s biggest star.`,
    ],
  ),
  event(
    'zelda',
    3,
    1986,
    "The Legend of Zelda",
    "A game built around exploration and discovery.",
    [
      `Shigeru Miyamoto has often said that The Legend of Zelda was inspired by his childhood in the Japanese countryside, where he explored forests and caves near his home. Working with Takashi Tezuka, he wanted a game that gave players that same feeling. It launched in Japan in February 1986 for the Famicom Disk System, and reached the US in 1987 in a striking gold cartridge.`,
      `Most games at the time moved in one direction toward a clear goal. Zelda dropped players into an open world with almost no guidance. In the very first screen, a cave contains a sword, and it’s up to you to go inside. Secrets were hidden behind walls and bushes, and players traded tips with friends at school. The name came from Zelda Fitzgerald, the American novelist and wife of F. Scott Fitzgerald.`,
      `Its adventure was too large for a single sitting, so it used saved data, and the US cartridge carried a battery to keep progress safe. Finishing the game unlocked a harder second quest. The series became one of the most respected in gaming, and Breath of the Wild returned to the original’s freedom in 2017.`,
    ],
  ),
  event(
    'final-fantasy',
    3,
    1987,
    "Final Fantasy",
    "Square’s RPG began one of gaming’s biggest series.",
    [
      `In 1986, Dragon Quest made role-playing games a huge success in Japan. Square, a smaller developer in financial trouble, gave Hironobu Sakaguchi the chance to make its own. A popular story says the name came from it being his last project before leaving games, although Sakaguchi has also given other explanations for it.`,
      `Final Fantasy launched in December 1987. It brought together artist Yoshitaka Amano, composer Nobuo Uematsu, and programmer Nasir Gebelli, whose work helped its side-view battles and airship stand out. Players guided four heroes known as the Warriors of Light, with classes such as fighter and mage. It reached North America in 1990.`,
      `The game saved Square and started a series with a clever rule: each main entry has a new world and cast. Later games pushed storytelling, music, and graphics forward. In 1997, Final Fantasy VII moved to PlayStation, and its cinematic scale helped popularize Japanese RPGs worldwide. Square later merged with Dragon Quest’s publisher, Enix, in 2003, joining two old rivals.`,
    ],
  ),
  event(
    'game-boy',
    4,
    1989,
    "Game Boy",
    "Nintendo made portable gaming a mass-market habit.",
    [
      `Gunpei Yokoi had already created Game & Watch, and he believed mature, inexpensive technology could be used in fresh ways. Game Boy reflected that thinking. It launched in Japan in April 1989 with a green-tinted screen that had no backlight, and it ran for around 30 hours on four AA batteries. It was also tough and relatively affordable.`,
      `On paper, its rivals looked better. Atari Lynx and Sega Game Gear had color screens, but they were larger, cost more, and consumed batteries quickly. Game Boy was easier to live with. Nintendo’s decision to bundle Tetris in the West was critical too, thanks to Henk Rogers, who convinced the company it would attract people beyond young boys.`,
      `The Game Boy sold over 100 million units when counted with Game Boy Color, and it became a home for Pokémon, Link’s Awakening, and Super Mario Land. Its durability became legendary. One unit damaged in a bombing during the Gulf War still worked and was displayed in Nintendo’s New York store. Its success is a lasting example of great games mattering more than raw power.`,
    ],
  ),
  event(
    'sonic',
    4,
    1991,
    "Sonic the Hedgehog",
    "Sega found its mascot and its answer to Mario.",
    [
      `Sega needed a character who could compete with Mario. An internal contest led to a blue hedgehog designed by Naoto Ohshima, and programmer Yuji Naka built technology that let him race through loops and slopes at great speed. Level designer Hirokazu Yasuhara created layered courses with multiple routes. The game launched for Genesis in June 1991.`,
      `Sonic felt different from Mario. Where Mario was precise, Sonic was about momentum and attitude. Its bright graphics and speedy scrolling were also a perfect demonstration of what Genesis could do. Sega of America, led by Tom Kalinske, replaced Altered Beast with Sonic as the console’s pack-in game, which was a bold decision that paid off.`,
      `That choice, combined with aggressive advertising, helped Genesis become a real threat to Nintendo in North America. Sega was the cool option, and Sonic was its face. The rivalry defined the early 1990s. Sequels introduced Tails and spin dashing, and Sonic stayed a major character long after Sega left the console business, appearing in games, cartoons, and hit movies.`,
    ],
  ),
  event(
    'doom',
    4,
    1993,
    "Doom",
    "id Software brought the first-person shooter into the mainstream.",
    [
      `id Software had already had success with Wolfenstein 3D in 1992. For its next game, John Carmack created a faster engine with varied heights, changing light, and bigger levels, while John Romero, Sandy Petersen, and others built a dark mix of science fiction and hell. Doom was released on December 10, 1993.`,
      `Its distribution was almost as important as its design. The first episode was shareware, so players could copy it freely and buy the rest. The upload to a University of Wisconsin server famously caused network trouble as people rushed to get it. Offices and campuses soon filled with players connected over local networks, and Doom helped popularize the term deathmatch.`,
      `id also separated game data from its engine, which made it easy for fans to create levels and mods. That helped build the modding culture that later produced games like Counter-Strike. Doom’s violence added to public concern, and it became a target of critics. Today its code has been made to run on almost anything, from calculators to ATMs, which has become a popular internet joke.`,
    ],
  ),
  event(
    'esrb',
    4,
    1994,
    "The ESRB is created",
    "The US industry introduced age ratings for games.",
    [
      `By the early 1990s, games were starting to show realistic violence. Mortal Kombat used digitized actors and bloody finishing moves, while Night Trap used video footage of actors in danger, despite having little actual violence. Parents worried, and in December 1993, US senators Joe Lieberman and Herb Kohl held hearings on the issue.`,
      `The hearings created a tense moment, with Nintendo and Sega criticizing each other in public. Nintendo had removed the blood from its version of Mortal Kombat, while Sega’s Genesis version offered a code that restored it, and Sega’s version sold far better. Facing the threat of government regulation, the industry created the Entertainment Software Rating Board in 1994.`,
      `The ESRB gave games age ratings and content descriptions, such as Everyone, Teen, and Mature, which remain familiar today. Other regions built similar systems, including CERO in Japan and PEGI in Europe. The legal debate continued for years, and in 2011 the US Supreme Court ruled in Brown v. Entertainment Merchants Association that video games are protected speech.`,
    ],
  ),
  event(
    'playstation',
    5,
    1994,
    "PlayStation launches",
    "Sony entered the console business and quickly reshaped it.",
    [
      `PlayStation began with a broken partnership. Sony engineer Ken Kutaragi had worked with Nintendo on a CD-based add-on for Super NES. At the 1991 Consumer Electronics Show, Sony announced the project, and the next day Nintendo revealed it had partnered with Philips instead. Sony decided to build its own console rather than give up.`,
      `PlayStation launched in Japan on December 3, 1994. Its 3D hardware impressed developers, and its CDs were far cheaper to produce than cartridges. At E3 in 1995, Sega announced that its Saturn was available in the US at 399 dollars. Sony’s Steve Race then walked on stage, said only 299, and walked off to huge applause. It’s still one of the most famous moments in the history of the show.`,
      `Sony also won over developers and older players. Square moved Final Fantasy VII to PlayStation, while games like Tomb Raider, Metal Gear Solid, and Gran Turismo made it the home of ambitious projects. PlayStation became the first console to sell more than 100 million units, and it set up Sony as a leading force for decades.`,
    ],
  ),
  event(
    'pokemon',
    5,
    1996,
    "Pokémon",
    "Monster collecting became a global phenomenon.",
    [
      `As a child, Satoshi Tajiri loved collecting insects in the countryside outside Tokyo. As those areas were built over, he wanted to give children a way to experience something similar. Seeing two Game Boys connected by a cable, he imagined creatures traveling between them. His small studio, Game Freak, spent about six years on the project, nearly running out of money along the way.`,
      `Pokémon Red and Green launched in Japan on February 27, 1996, late in Game Boy’s life. Sales began modestly, then grew through word of mouth. Each version had exclusive creatures, so catching all 151 required trading with a friend. A programmer, Shigeki Morimoto, quietly added a hidden 151st Pokémon, Mew, and rumors about how to catch it spread rapidly.`,
      `The games were followed by an anime in 1997, a trading card game, and a worldwide release in 1998. Pikachu became a global icon, and the craze even led schools to ban cards. Pokémon is now often ranked as the highest-grossing media franchise in the world, an extraordinary outcome for a game about a boy, a bicycle, and a love of insects.`,
    ],
  ),
  event(
    'mario-64',
    5,
    1996,
    "Super Mario 64",
    "A blueprint for moving through 3D worlds.",
    [
      `Moving a game into 3D was not just a graphical upgrade. Developers had to decide how a character should move, how players should judge distance, and what the camera should do. Shigeru Miyamoto’s team built Super Mario 64 alongside the Nintendo 64 controller, and its analog stick let players move Mario gently or quickly depending on how far they pushed.`,
      `The game launched with the console in Japan on June 23, 1996. Its castle served as a hub, and paintings led into open levels filled with 120 stars to collect. There was often no single correct path. Mario could run, triple jump, long jump, and swim, and simply moving around the castle grounds felt enjoyable. Even the camera had a character, a cloud-riding Lakitu who appeared to be filming the action.`,
      `Super Mario 64 showed that 3D games needed their own design language, and its ideas spread quickly. Many of its solutions, from analog movement to camera controls, are now standard. Some of its camera behavior hasn’t aged perfectly, but few games have been so influential. It remains a favorite among speedrunners, who are still finding new tricks decades later.`,
    ],
  ),
  event(
    'playstation-2',
    6,
    2000,
    "PlayStation 2",
    "The best-selling home console of all time.",
    [
      `PlayStation 2 launched in Japan on March 4, 2000, with enormous expectations. Sony’s marketing suggested a machine so powerful that it could change entertainment, and its Emotion Engine processor became a talking point. Demand was so high that supplies ran short, and the North American launch that October was also limited.`,
      `One of its biggest advantages was its DVD drive. Standalone players were still expensive, so for many households PlayStation 2 was also their first DVD player. It could play most original PlayStation games too, so people did not lose their old collections. The first-year lineup was uneven, but Grand Theft Auto III, Metal Gear Solid 2, and Final Fantasy X soon gave it unmatched momentum.`,
      `Its library grew to thousands of games, from Shadow of the Colossus to Guitar Hero and Kingdom Hearts. It had a remarkably long life, with production continuing in Japan until around the end of 2012. With about 160 million units sold, it remains the top-selling console by most counts, though Nintendo Switch came close. Few gaming machines have reached so many homes.`,
    ],
  ),
  event(
    'sega-exits',
    6,
    2001,
    "Sega leaves hardware",
    "A console pioneer became a software publisher.",
    [
      `Sega’s hopes rested on Dreamcast, released in Japan in November 1998 and North America on September 9, 1999. It had a built-in modem, excellent arcade conversions, and creative games such as Crazy Taxi, Soulcalibur, Jet Set Radio, and Shenmue. Its US launch was a success. Unfortunately, Sega’s reputation had been damaged by earlier hardware such as the Saturn, and many buyers were wary.`,
      `As PlayStation 2 approached, its promise of DVD playback and huge power drew attention away from Dreamcast. Sega was already losing money, and sales slowed despite strong reviews. On January 31, 2001, it announced that it would stop making consoles and focus on games. Before his death that year, Sega chairman Isao Okawa helped the company survive by giving it his personal shares, worth hundreds of millions of dollars.`,
      `The result would have shocked anyone in the 1990s. By the end of that year, Sonic Adventure 2: Battle had arrived on Nintendo GameCube, putting Sega’s mascot on its old rival’s console. Sega carried on as a publisher, and Dreamcast’s ideas, especially its online play, proved ahead of their time. Fans still remember it as a console that deserved better.`,
    ],
  ),
  event(
    'xbox-halo',
    6,
    2001,
    "Xbox and Halo",
    "Microsoft entered the console race with a killer game.",
    [
      `Microsoft feared PlayStation 2 might become the computer in everyone’s living room, so a small team including Seamus Blackley, Kevin Bachus, Ted Hase, and Otto Berkes proposed a console built on PC technology. Its working name, DirectX Box, became Xbox. It launched in North America on November 15, 2001, and its first controller was so large that it became a joke, nicknamed the Duke.`,
      `Microsoft needed an unmissable game. It bought Bungie, whose science fiction shooter Halo had first been shown publicly at a Mac event with Steve Jobs. Halo: Combat Evolved became a launch title, and it proved that a first-person shooter could feel great on a controller. Its movement, shields, and mix of weapons became a template for console shooters, and Master Chief became Xbox’s mascot.`,
      `Xbox Live followed in November 2002. It required broadband, which was a bold choice, but gave players a shared friends list, voice chat, and a single account. Halo 2 turned it into a phenomenon in 2004 with online matchmaking. Xbox sold about 24 million units, and it was a costly start, but it established Microsoft as a permanent player in the console business.`,
    ],
  ),
  event(
    'steam',
    6,
    2003,
    "Steam launches",
    "Valve began changing how people buy PC games.",
    [
      `Keeping PC games updated in the early 2000s was a pain. Valve found that every patch for Counter-Strike risked dropping players from servers and splitting up its community. It created Steam, which launched on September 12, 2003, to deliver updates automatically and fight cheating. Few players were excited to have to install it.`,
      `The real test came in November 2004 with Half-Life 2, which required Steam to run, even for buyers of a physical copy. Launch day was rocky, and many players were angry. Over time, though, the convenience won people over. Valve began offering games from other publishers in 2005, and Steam’s sales became famous for steep discounts.`,
      `Steam grew into the leading PC game store, with friends lists, achievements, reviews, and workshops for fan-made content. Programs like Greenlight and Steam Direct made it easier for small teams to publish, which helped indie games flourish but also created a crowded storefront. Its standard 30 percent fee has often been debated, but Steam’s dominance showed that players would embrace digital libraries.`,
    ],
  ),
  event(
    'wow',
    6,
    2004,
    "World of Warcraft",
    "An online world with millions of players.",
    [
      `Massively multiplayer online games already existed, with Ultima Online and EverQuest leading the way, but they often demanded a lot of time and patience. Blizzard, known for Warcraft, StarCraft, and Diablo, thought the genre could be friendlier. World of Warcraft launched on November 23, 2004, after years of development.`,
      `It made online worlds easy to understand. Quests always pointed you toward something to do, travel was simpler, and solo players could progress comfortably. Groups could then take on dungeons and huge raids, while guilds became real social communities. Many players formed lifelong friendships there, and some couples even met in the game. Its peak passed 12 million subscribers around 2010.`,
      `It also became a cultural landmark. A bug in 2005 caused a virtual plague, the Corrupted Blood incident, that spread through cities and was later studied by real epidemiologists. South Park built an award-winning episode around the game. Many later games copied its quests and interface, and its continued success, including the Classic servers launched in 2019, shows how long a world can last.`,
    ],
  ),
  event(
    'wii',
    7,
    2006,
    "Wii",
    "Motion controls brought new players to games.",
    [
      `When Satoru Iwata and Shigeru Miyamoto looked at the market in the mid-2000s, they saw an arms race that Nintendo was unlikely to win. Sony and Microsoft were chasing power, while games were becoming harder for newcomers to understand. Iwata’s response was to focus on people who didn’t play games at all. The project, code-named Revolution, launched as Wii in November 2006.`,
      `Its controller looked like a TV remote and detected movement. To play tennis, you swung your arm. To bowl, you made a bowling motion. Wii Sports came included with the console in most regions, and it became a phenomenon, with parents, grandparents, and retirement homes all joining in. Wii Fit later brought balance boards and exercise routines into living rooms.`,
      `Wii sold about 101.6 million units, beating far more powerful rivals. Its success had limits, though. Many third-party games were poor, its motion controls could be imprecise, and it lacked HD graphics. Early on, some players even broke televisions after letting go of the controller, which led to stronger wrist straps. Its influence is still clear in how many people now see games as something for them.`,
    ],
  ),
  event(
    'app-store',
    7,
    2008,
    "The App Store",
    "Smartphones became a giant game platform.",
    [
      `The iPhone launched in 2007, but developers could not sell native apps for it at first. That changed when Apple opened the App Store on July 10, 2008, with about 500 apps. Developers could now reach customers around the world, and Apple took a 30 percent share. A single programmer in a bedroom could suddenly sell directly to millions of people.`,
      `Touch screens encouraged simple, inventive designs. Angry Birds, released in 2009, became a worldwide hit by turning a slingshot into a satisfying finger gesture. Prices quickly fell to a dollar or two, then to nothing. The free-to-play model let people download games at no cost and spend money inside them, which Candy Crush Saga and Clash of Clans used to enormous effect.`,
      `Mobile games are now the largest part of the industry by revenue. They reached people who never considered themselves gamers, and they also brought concerns about manipulative spending. Apple’s control of the store became a major issue in 2020, when Epic Games sued after Fortnite was removed for bypassing Apple’s payment system. That fight changed how people think about app store rules.`,
    ],
  ),
  event(
    'minecraft',
    7,
    2009,
    "Minecraft",
    "A world of blocks became a creative phenomenon.",
    [
      `Markus Persson, known online as Notch, began Minecraft as a side project, inspired in part by a game called Infiniminer. He released an early version in May 2009 and kept updating it in public, selling it cheaply while it was still in development. Players paid to join the process, and their videos and word of mouth did the marketing.`,
      `Minecraft has an unusual lack of direction. You arrive in a huge generated world and can mine resources, build shelter, survive monsters, or simply create. A 1.0 release arrived in November 2011 at the first MineCon event. Players built castles, cities, and even working computers inside it, and YouTube creators helped turn it into a favorite with children.`,
      `Microsoft bought its studio, Mojang, for 2.5 billion dollars in 2014. The game has since sold more than 300 million copies, making it one of the best-selling games ever, and Education Edition brought it into classrooms. Its 2025 movie became a box office hit. It’s a remarkable story of how a small independent project grew into something closer to a creative platform.`,
    ],
  ),
  event(
    'twitch',
    7,
    2011,
    "Twitch launches",
    "Watching games became a form of entertainment.",
    [
      `Justin.tv was a live video site founded around Justin Kan broadcasting his life. Its gaming section kept growing, so the company, with Emmett Shear playing a key role, spun it off as Twitch in June 2011. The timing was right. Faster internet and better streaming tools meant anyone could share their game live, and viewers could talk back through chat.`,
      `Twitch was different from television because audiences and hosts could interact. Channel chats developed their own humor, and viewers could support streamers with subscriptions and donations. Esports tournaments for games like League of Legends drew massive audiences. In 2014, Twitch Plays Pokémon let thousands of viewers control a single game through chat, an event as chaotic as it sounds.`,
      `Amazon bought Twitch for about 970 million dollars in 2014. Streaming became a real career for some, and Tyler Blevins, known as Ninja, reached mainstream fame in 2018 when rapper Drake joined him to play Fortnite. It also changed how games are marketed, because a popular streamer could turn a small game into a hit overnight, as happened with Among Us.`,
    ],
  ),
  event(
    'vr',
    8,
    2016,
    "Consumer VR arrives",
    "Virtual reality headsets reached homes.",
    [
      `Virtual reality had failed before. Nintendo’s Virtual Boy in 1995 is the best-known example. The modern attempt began with Palmer Luckey, a young hardware enthusiast whose Oculus Rift prototype raised about 2.4 million dollars on Kickstarter in 2012. With support from John Carmack, excitement grew, and Facebook bought Oculus for about 2 billion dollars in 2014.`,
      `Consumer headsets finally arrived in 2016. Oculus Rift launched in March, HTC Vive in April, and PlayStation VR in October. For the first time, many people could put on a headset and feel present inside a game. Tracking your head and hands made simple actions, such as picking something up, feel strangely magical. The hardware was still expensive, though, and some players experienced motion sickness.`,
      `VR did not replace consoles as some predicted. Instead, it found a smaller audience with games built around its strengths. Beat Saber became a hit in 2018, and Half-Life: Alyx in 2020 showed what a big-budget VR game could look like. Standalone headsets like Meta Quest removed the need for a PC, making VR much easier to try.`,
    ],
  ),
  event(
    'pokemon-go',
    8,
    2016,
    "Pokémon Go",
    "Augmented reality sent millions of people outside.",
    [
      `Pokémon Go has an unusual origin. In 2014, Google and The Pokémon Company ran an April Fools’ joke that placed Pokémon on Google Maps. John Hanke, whose Niantic team had built the location-based game Ingress, saw real potential in the idea. Ingress’s map of real-world landmarks provided the foundation for PokéStops and gyms.`,
      `The game launched on July 6, 2016, and it immediately overwhelmed Niantic’s servers. Players walked around their neighborhoods, using their phones to catch creatures appearing in the real world. Crowds gathered in parks, strangers chased rare Pokémon together, and businesses tried to attract players. It passed 500 million downloads within about two months.`,
      `Pokémon Go also raised new questions. There were concerns about safety, trespassing, and privacy, and some locations had to ask players to stay away. Nintendo’s stock rose sharply even though it was not the game’s main developer. The initial craze cooled, but the game remained popular for years through events like Pokémon Go Fest, showing how a game could reshape shared public spaces.`,
    ],
  ),
  event(
    'switch',
    8,
    2017,
    "Nintendo Switch",
    "One console for the TV and on the go.",
    [
      `Nintendo was in a difficult place in the mid-2010s. Wii U had sold poorly, its name confused many buyers, and President Satoru Iwata died in 2015. The company’s next system, code-named NX, needed to be a clear idea. The answer was a tablet-like console that could slide into a dock to play on a TV, then be carried anywhere.`,
      `Switch launched on March 3, 2017, with Joy-Con controllers that detached from either side. Two people could share a game anywhere just by splitting them. The Legend of Zelda: Breath of the Wild launched alongside it and was hailed as one of the best games ever made. Super Mario Odyssey followed that October, and demand was far beyond what Nintendo expected.`,
      `Combining its handheld and home console businesses let Nintendo focus all of its games on one system. Switch also became a great home for indie games, and Animal Crossing: New Horizons became a comfort for many during the 2020 pandemic. With about 156 million units sold, it’s among the best-selling consoles ever and a remarkable comeback from Wii U.`,
    ],
  ),
  event(
    'fortnite',
    8,
    2017,
    "Fortnite Battle Royale",
    "A free game became a social space.",
    [
      `Epic Games was working on Fortnite: Save the World, a paid co-op game, when the battle royale genre exploded with PlayerUnknown’s Battlegrounds. In about two months, Epic built a free mode in which 100 players parachute onto an island and fight until one remains. It launched in September 2017, and its fast building mechanics quickly set it apart.`,
      `Being free and available on so many platforms changed everything. Friends could join from PC, console, or phone, and it became a place to hang out as much as a game. Instead of charging to play, Epic sold cosmetic items and a seasonal Battle Pass, a model that many later games copied. Seasons changed the map and told a growing story through in-game events.`,
      `Fortnite became a cultural event. A 2019 Marshmello concert and a 2020 Travis Scott show drew millions of simultaneous players. Its popularity helped push Sony to allow more cross-play in 2018, and Epic’s 2020 lawsuit against Apple became a major fight over app stores. Fortnite showed that a game could be a stage, a social network, and a storefront all at once.`,
    ],
  ),
  event(
    'ps5-xbox',
    9,
    2020,
    "PlayStation 5 and Xbox Series X|S",
    "A new generation launched during a global pandemic.",
    [
      `Microsoft launched Xbox Series X and the cheaper Series S on November 10, 2020, and Sony followed with PlayStation 5 on November 12 in its first regions. The launches took place in the middle of the COVID-19 pandemic, so events were online and many people were spending more time at home than ever.`,
      `Demand was huge, but supply wasn’t. Global chip shortages limited production, and scalpers used bots to buy consoles and resell them at higher prices. Many people spent over a year trying to buy one. Sony launched with Demon’s Souls, Spider-Man: Miles Morales, and Astro’s Playroom, which was a charming showcase for the DualSense’s haptics and adaptive triggers.`,
      `The biggest upgrade was fast SSD storage, which dramatically cut load times and changed how developers could design worlds. Ray tracing brought better lighting, but because older consoles remained so popular, many games kept launching across generations. Microsoft focused on Xbox Game Pass as much as hardware, while PlayStation 5 opened a large sales lead.`,
    ],
  ),
  event(
    'steam-deck',
    9,
    2022,
    "Steam Deck",
    "A handheld made PC gaming portable.",
    [
      `Handheld gaming PCs had existed before from smaller makers like GPD, but they were niche and often expensive. Valve already had experience with hardware from the Steam Controller, Steam Machines, and Index VR headset, not all of it successful. Steam Deck was its most focused attempt yet, launching on February 25, 2022, at a starting price of 399 dollars.`,
      `Its secret weapon was software. Steam Deck runs SteamOS, a Linux-based system, and Proton lets many Windows games run without changes from their developers. Valve added a Deck Verified program, so players could quickly see how well each game worked. It also offered a console-like experience, where you could put it to sleep and return to your game moments later.`,
      `Steam Deck showed there was a real market for portable PCs. ASUS, Lenovo, and others followed with Windows handhelds, and Valve released an OLED model in 2023. It also put new attention on Linux gaming and pushed developers to care about smaller screens. For many players, it made their huge Steam backlog feel fresh again.`,
    ],
  ),
  event(
    'activision-microsoft',
    9,
    2023,
    "Microsoft buys Activision Blizzard",
    "One of the largest deals in gaming history.",
    [
      `Microsoft announced in January 2022 that it planned to buy Activision Blizzard for about 69 billion US dollars, an enormous sum even for the technology industry. The deal included Call of Duty, World of Warcraft, Diablo, Overwatch, and Candy Crush through King. Sony, the main competitor, argued it could keep Call of Duty away from PlayStation.`,
      `Regulators around the world examined the deal. The US Federal Trade Commission tried to stop it, and the UK’s Competition and Markets Authority initially blocked it over concerns about cloud gaming. Microsoft signed long-term agreements to keep Call of Duty on other platforms, and it restructured the deal by selling cloud streaming rights to Ubisoft. The purchase closed on October 13, 2023.`,
      `The result made Microsoft one of the largest game publishers in the world, and Call of Duty began launching on Game Pass in 2024. Major layoffs followed across its gaming teams. The deal became a symbol of consolidation in the industry, with fans and developers alike debating what it means when a few huge companies own so many famous studios and series.`,
    ],
  ),
  event(
    'switch-2',
    9,
    2025,
    "Nintendo Switch 2",
    "Nintendo followed its hybrid hit with a successor.",
    [
      `Following a massive success has often been hard for Nintendo. Wii was followed by the troubled Wii U, so many people watched closely to see how it would follow Switch. Its answer was to keep what worked. Switch 2 launched on June 5, 2025, with the same hybrid design, a larger 7.9-inch screen, and much more power.`,
      `The new Joy-Con controllers attach with magnets and can also work like a mouse. A dedicated button added GameChat, which lets friends talk and share screens. Mario Kart World launched with the console, and Switch 2 could also play many original Switch games, so existing collections carried over. Its price, 449.99 dollars in the US, was the highest ever for a Nintendo console at launch.`,
      `Early demand was exceptional. Nintendo reported more than 3.5 million sales in the first four days, a record for the company. Some decisions drew criticism, including higher game prices and game-key cards that require a download. Still, Switch 2 confirmed that Nintendo sees the hybrid console as its long-term future. Sources have not yet agreed on which generation it belongs to.`,
    ],
  ),
  event(
    'prices-2026',
    9,
    2026,
    "Console prices rise",
    "Hardware got more expensive years after launch.",
    [
      `For most of gaming history, consoles became cheaper as they aged. Parts got less expensive, manufacturing improved, and companies cut prices to reach new buyers. That pattern broke during the ninth generation. Consoles got more expensive years after launch, an unusual change that surprised many players.`,
      `By 2026, a memory shortage, tariffs, and wider world events had pushed prices up. In the US, the PlayStation 5 Digital Edition rose from 399.99 to 599.99 dollars, and PS5 Pro went from 699.99 to 899.99 dollars. Microsoft and Nintendo raised prices too. For a beginner buying a first console, that makes older games and handheld PCs more attractive.`,
      `It also raises questions about what comes next. In June 2026, Sony said it did not intend to sell hardware at significant losses, and it had not set a price or launch date for PlayStation 6, though reports suggested it could slip to 2028 or 2029. Xbox leader Asha Sharma said the industry could not simply raise prices through the crisis. Valve’s new Steam Machine then launched on June 29 at 1,049 dollars, far above most console prices. This story is still developing, so treat this entry as a snapshot of 2026.`,
    ],
  ),
];
