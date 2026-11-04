import type { CodexEntry } from './codex';

const role = (id: string, title: string, summary: string, paragraphs: string[], related?: string[]): CodexEntry => ({
  id: `role-${id}`,
  category: 'roles',
  title,
  summary,
  sections: paragraphs.map((text) => ({ text })),
  ...(related ? { related } : {}),
});

export const ROLE_ENTRIES: CodexEntry[] = [
  role('programmer', 'Programmer', 'The people who turn a game into working code.', [
    `Programmers write the code that makes a game run. Everything you do in a game, from jumping to opening a menu, exists because someone turned an idea into instructions a computer can follow. On a big team there are many specialties. Gameplay programmers build how characters move and fight, graphics programmers work on how everything is drawn, and tools programmers make software that helps the rest of the team.`,
    `Most games are built on an engine, the software foundation that handles things like graphics, physics, and sound so a team doesn’t have to start from nothing. Some studios write their own, as John Carmack did for Doom. Many others use ready-made engines. Hollow Knight was made in Unity, and Fortnite runs on Epic’s own Unreal Engine.`,
    `A lot of programming is invisible when it goes well. A game running at 60 frames per second has only about 16 milliseconds to do all of its work for each picture, on many kinds of hardware. When a game feels smooth, programmers have usually spent months making that happen.`,
  ], ['role-qa']),
  role('designer', 'Game designer', 'The people who decide how a game works.', [
    `A game designer decides how a game works. They define the rules, goals, and systems, then ask whether those things are fun. A designer might decide how much damage a sword does, what happens when you lose, or how quickly you earn new abilities. They don’t need to be artists or programmers, but they work closely with both.`,
    `Much of the job is testing ideas. Designers write documents that explain a feature, build rough versions, watch people play, and adjust. A small change to one number can transform how a game feels, and this careful tuning is called balancing. Having ideas is the easy part. Making them work together is the real job.`,
    `Big teams split design into specialties. Systems designers work on things like economies and progression, combat designers focus on fights, and technical designers build gameplay directly with the engine’s tools. In Slay the Spire, every card is a small design decision that affects all the others. Hades was tuned during early access, while real players tried each change.`,
  ], ['role-level-designer']),
  role('level-designer', 'Level designer', 'The people who build the spaces you play through.', [
    `A level designer builds the spaces you play through. A game designer decides what a character can do, and a level designer decides where you will do it. That means shaping the layout of rooms, placing enemies and items, and planning the route through an area.`,
    `Good levels teach without saying a word. The first screen of Super Mario Bros. shows you how enemies, jumps, and mushrooms work. Level designers also use light, color, and landmarks to lead your eye, which is exactly what you learn in Reading the game world. They control pacing too, mixing tense moments with quiet ones so you have time to breathe.`,
    `Most levels start as a rough version made from plain shapes, often called a blockout, so the team can test how a space plays before artists make it beautiful. Dark Souls is famous for looping back on itself, so a door you open can reveal a shortcut to somewhere you left hours ago. In Portal 2, each level is a puzzle in its own right.`,
  ], ['playing-world']),
  role('narrative', 'Writer and narrative designer', 'The people who shape a game’s story.', [
    `Writers create the words in a game, including dialogue, descriptions, and item text. Narrative designers go a step further and decide how a story is told through play. That could be a cutscene, a choice in a conversation, or a note left on a desk. The two jobs often overlap, especially on small teams.`,
    `Games are hard to write for, because the player controls the pacing. Someone may skip a conversation, do things in a different order, or wander off in the middle of a dramatic moment. Stories with branching choices multiply the work, since each decision can need new scenes. Disco Elysium is famous for its huge amount of text and for choices that shape the kind of person you are playing.`,
    `Not every story needs words. Unpacking tells the story of a life through the objects you put away. This is called environmental storytelling, and it trusts you to work things out. Firewatch takes a different approach, building a whole relationship through conversations on a radio.`,
  ], ['role-designer']),
  role('artist', 'Artist', 'The people who decide how a game looks.', [
    `Artists decide how a game looks. Concept artists sketch characters and places before anything is built, and those drawings guide the whole team. 3D modelers turn the ideas into objects the game can use, and texture artists paint their surfaces. UI artists design the menus and the HUD.`,
    `A strong art style matters more than advanced technology. Games don’t need realistic graphics to look wonderful. Hollow Knight uses hand-drawn characters and dark, quiet caverns, while Unpacking uses cozy pixel art. An art director keeps all of this consistent, so that everything feels like it belongs in the same world. A clear style can also help a game age well, long after realistic graphics have been overtaken.`,
    `Artists also work within technical limits, because everything on screen costs performance. Technical artists sit between art and programming, making sure beautiful work can actually run. The Legend of Zelda: Breath of the Wild is a good example, pairing a huge world with a painterly look on modest hardware.`,
  ], ['role-animator']),
  role('animator', 'Animator', 'The people who bring characters to life.', [
    `Animators make things move, and that gives characters weight and personality. The way a character stands, jumps, or falls tells you who they are before they say a word. In games, animation is also information. An enemy raising its weapon before it strikes is a warning that gives you time to react.`,
    `Unlike film, game animation has to respond to you instantly. If a jump takes too long to start, the controls feel slow, so animators must balance looking good with feeling responsive. Many realistic games use motion capture, where actors in special suits perform movements that are recorded and then polished by hand.`,
    `Cuphead is famous for its animation, which was drawn by hand in the style of 1930s cartoons. Fighting games show how much the craft can matter. In Street Fighter 6, the individual frames of an animation decide which attack lands first, so an animator’s work directly shapes how a match plays.`,
  ], ['genre-action']),
  role('audio', 'Sound designer and composer', 'The people behind everything you hear.', [
    `Sound designers create every noise in a game, from footsteps and doors to the click of a menu. Composers write the music. Together they do far more than most players notice. A lot of important information arrives through your ears, like an enemy approaching from behind or a low-health warning.`,
    `Great game music stays with people for life. Koji Kondo’s work on Super Mario Bros. became instantly recognizable, and Nobuo Uematsu’s music helped define Final Fantasy. Unlike a film score, game music often has to react to what you are doing. In many games, the music changes the moment a fight begins. Even Space Invaders did this in its own way, with a heartbeat-like sound that sped up as danger grew.`,
    `Audio can carry a whole game. Alien: Isolation relies on sound to build tension, since hearing the creature move through the walls can be scarier than seeing it. Audio teams also work with voice actors and directors, so that a game’s performances feel as carefully made as its graphics.`,
  ], ['genre-horror']),
  role('producer', 'Producer', 'The people who keep a game on track.', [
    `A producer keeps a game’s development on track. They plan schedules, find out what each team needs, solve problems, and help people make decisions. They usually aren’t the ones making the art or the code, but they make sure all of that work comes together.`,
    `Games have thousands of moving parts. Art waits on code, story waits on design, and everything has to fit a budget. Producers track all of this and help decide what has to be cut, because almost every game loses features along the way. They also try to raise problems early, which helps a studio avoid crunch, the long stretches of overtime that can happen before a deadline. E.T. the Extra-Terrestrial is a famous example of what an impossible schedule can do.`,
    `The title means different things at different companies. Sometimes a producer is mostly a project manager, and sometimes the job comes with real creative power. Shigeru Miyamoto, for example, has been credited as a producer on many Nintendo games. Publishers have producers of their own, who work with outside developers.`,
  ], ['industry-publisher']),
  role('qa', 'QA tester', 'The people who find what’s broken before you do.', [
    `QA stands for quality assurance. Testers play a game over and over to find problems, known as bugs, then report exactly how to make each one happen. A bug can be anything from a misplaced object to a crash that destroys your save file.`,
    `Testing is more methodical than many people expect, and it’s very different from playing for fun. A tester might walk into the same wall for an hour or try every item in every menu. Then they write a clear report, so a programmer can find the cause. Testers also check that a game meets the technical rules set by each console maker.`,
    `No team can find everything, which is one reason patches exist. World of Warcraft’s Corrupted Blood incident is a famous example, when a bug spread a virtual plague through its cities. Good QA work is easy to overlook, because the best sign of it is the problems you never see.`,
  ], ['industry-dlc', 'role-programmer']),
];
