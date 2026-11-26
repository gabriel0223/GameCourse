import type { QuestRecord, QuestReview } from './quests';
import type { WardrobeGenre } from './genres';
import { NEW_PRACTICE, loadPractice } from './practice';
import type { PracticeRecord } from './practice';
import type { QuizRecords } from './quiz';

export type Slot = 'accessory' | 'top' | 'bottom';

export interface Piece {
  id: string;
  slot: Slot;
  genre: WardrobeGenre;
  name: string;
  blurb: string;
  shopLevel: number;
  price: number;
}

export const SLOTS: Slot[] = ['accessory', 'top', 'bottom'];

// Each genre's six pieces reach the Shop one at a time, and later pieces cost more.
// Genre XP is 100 an hour plus 500 per finished game, so the last tier (6,750 XP)
// takes about 67 hours of play alone, or 50 to 60 hours with a few games finished.
// Gold from paths, quests, and achievements comes in faster than that, so prices are
// set for the whole wardrobe to stay a long-term goal (42,000 gold for all 60 pieces).
export const SHOP_TIERS = [
  { level: 1, price: 150 },
  { level: 4, price: 300 },
  { level: 7, price: 500 },
  { level: 10, price: 750 },
  { level: 13, price: 1000 },
  { level: 16, price: 1500 },
];

// Genres take turns on which slot comes first, so every tier is a mix of outfit types.
const TIER_ORDERS: Slot[][] = [
  ['bottom', 'top', 'accessory'],
  ['top', 'accessory', 'bottom'],
  ['accessory', 'bottom', 'top'],
];

type Art = [name: string, blurb: string];
type Outfit = { key: string; genre: WardrobeGenre; top: Art; bottom: Art; accessory: Art };

// The first outfit fills the first three tiers. Keys are also the sprite file names.
const SETS: Outfit[] = [
  {
    key: 'rpg',
    genre: 'RPG',
    accessory: ['Mage hat', 'It was bent when she found it.'],
    top: ['Apprentice robe', 'Smells faintly of old spellbooks.'],
    bottom: ['Long skirt', 'Long enough to trip over, but she never does.'],
  },
  {
    key: 'platform',
    genre: 'Platformer',
    accessory: ['Teal cap', 'Keeps the sun out during long runs.'],
    top: ['Striped tee', 'Built for double jumps.'],
    bottom: ['Denim shorts', 'Nothing slows a good run.'],
  },
  {
    key: 'action',
    genre: 'Action',
    accessory: ['Red headband', 'Tie it on when the boss music starts.'],
    top: ['Training gi', 'Worn in by a thousand combos.'],
    bottom: ['Dojo pants', 'Made for high kicks and quick dodges.'],
  },
  {
    key: 'adventure',
    genre: 'Adventure',
    accessory: ['Explorer hat', 'It has seen more maps than you have.'],
    top: ['Field jacket', 'The strap holds a journal full of clues.'],
    bottom: ['Hiking shorts', 'Ready for the long way around.'],
  },
  {
    key: 'shooter',
    genre: 'Shooter',
    accessory: ['Visor', 'Sees everything, including your bad aim.'],
    top: ['Tactical vest', 'More pockets than anyone needs.'],
    bottom: ['Cargo pants', 'Every pocket has a purpose.'],
  },
  {
    key: 'strategy',
    genre: 'Strategy',
    accessory: ['Small crown', 'Heavy is the head that plans ahead.'],
    top: ['Commander coat', 'Gold buttons, one turn at a time.'],
    bottom: ['Uniform skirt', 'Neat enough for any war room.'],
  },
  {
    key: 'horror',
    genre: 'Horror',
    accessory: ['Round glasses', 'For reading notes in dark rooms.'],
    top: ['Old blazer', 'Found in a house you should have left.'],
    bottom: ['Plaid skirt', 'Part of a school uniform nobody remembers.'],
  },
  {
    key: 'cozy',
    genre: 'Cozy',
    accessory: ['Straw hat', 'Good for long days on the farm.'],
    top: ['Soft blouse', 'Best worn near a warm cup of tea.'],
    bottom: ['Garden skirt', 'A few grass stains add character.'],
  },
  {
    key: 'racing',
    genre: 'Racing and Sports',
    accessory: ['Race goggles', 'Keeps your eyes on the next corner.'],
    top: ['Racing jacket', 'Bright enough to spot from the stands.'],
    bottom: ['Track pants', 'The red stripe adds at least 5 km/h.'],
  },
  {
    key: 'puzzle',
    genre: 'Puzzle',
    accessory: ['Thinking bow', 'Every solution starts with a neat bow.'],
    top: ['Pattern sweater', 'The pattern repeats if you look closely.'],
    bottom: ['Corduroy skirt', 'Soft, sensible, and good for long thinks.'],
  },
];

// The second outfit, one per genre in the same order, fills the last three tiers.
const SECOND_SETS: Outfit[] = [
  {
    key: 'knight',
    genre: 'RPG',
    accessory: ['Hero’s circlet', 'Worn by everyone the prophecy was about.'],
    top: ['Silver armor', 'Polished before every boss, just in case.'],
    bottom: ['Chainmail skirt', 'Jingles a little on every step.'],
  },
  {
    key: 'cat',
    genre: 'Platformer',
    accessory: ['Cat ears', 'Grants +1 climb. Possibly.'],
    top: ['Power-up hoodie', 'The star means it’s working.'],
    bottom: ['Star leggings', 'For the last jump before the flagpole.'],
  },
  {
    key: 'ninja',
    genre: 'Action',
    accessory: ['Ninja scarf', 'Trails behind her at full speed.'],
    top: ['Shinobi top', 'Dark enough to dodge in.'],
    bottom: ['Hakama', 'Wide enough for a perfect parry stance.'],
  },
  {
    key: 'pirate',
    genre: 'Adventure',
    accessory: ['Pirate bandana', 'X marks the spot, and the forehead.'],
    top: ['Captain’s coat', 'Long tails for windy decks.'],
    bottom: ['Striped trousers', 'Every sailor’s favorite pattern.'],
  },
  {
    key: 'space',
    genre: 'Shooter',
    accessory: ['Comms headset', 'Callouts, crystal clear.'],
    top: ['Space armor', 'Shields recharge between fights.'],
    bottom: ['Armored leggings', 'Rated for zero gravity.'],
  },
  {
    key: 'royal',
    genre: 'Strategy',
    accessory: ['Officer cap', 'Every plan looks better under it.'],
    top: ['Royal cape', 'For the turn the war is won.'],
    bottom: ['Chessboard skirt', 'Sixty-four squares, all under control.'],
  },
  {
    key: 'gothic',
    genre: 'Horror',
    accessory: ['Lace headdress', 'Pretty enough to haunt a mansion.'],
    top: ['Gothic blouse', 'Black lace for very long nights.'],
    bottom: ['Frilled skirt', 'Still spotless after the basement.'],
  },
  {
    key: 'knit',
    genre: 'Cozy',
    accessory: ['Pompom beanie', 'Knitted during a rainy in-game week.'],
    top: ['Chunky cardigan', 'One more day, then bed. Probably.'],
    bottom: ['Flannel pajamas', 'The official uniform of long sessions.'],
  },
  {
    key: 'sport',
    genre: 'Racing and Sports',
    accessory: ['Gold medal', 'First place, and she has the replay.'],
    top: ['Team jersey', 'Number one on the roster.'],
    bottom: ['Tennis skirt', 'Pleated for a fast serve.'],
  },
  {
    key: 'magician',
    genre: 'Puzzle',
    accessory: ['Top hat', 'Something clever is hiding inside.'],
    top: ['Riddle waistcoat', 'A gentle puzzler’s favorite vest.'],
    bottom: ['Tile skirt', 'Slide the colors until they line up.'],
  },
];

const pieceId = (slot: Slot, key: string) => `${slot === 'accessory' ? 'acc' : slot}-${key}`;

export const PIECES: Piece[] = [...SETS, ...SECOND_SETS].flatMap((set, index) =>
  SLOTS.map((slot) => {
    const outfit = Math.floor(index / SETS.length);
    // The second outfit shifts its slot order by one, so each genre's six tiers don't repeat a pattern.
    const order = TIER_ORDERS[((index % SETS.length) + outfit) % TIER_ORDERS.length];
    const tier = SHOP_TIERS[outfit * SLOTS.length + order.indexOf(slot)];
    return {
      id: pieceId(slot, set.key),
      slot,
      genre: set.genre,
      name: set[slot][0],
      blurb: set[slot][1],
      shopLevel: tier.level,
      price: tier.price,
    };
  }),
);

export const findPiece = (id: string | null) => PIECES.find((piece) => piece.id === id);

export const SKIN_TONES = [
  { id: 'light', name: 'Light', color: '#F9DCC4' },
  { id: 'fair', name: 'Fair', color: '#F7D0B5' },
  { id: 'tan', name: 'Tan', color: '#E3B084' },
  { id: 'brown', name: 'Brown', color: '#B57B50' },
  { id: 'deep', name: 'Deep', color: '#7C4E33' },
];

export const HAIR_COLORS = [
  { id: 'plum', name: 'Plum', color: '#5A3B78' },
  { id: 'black', name: 'Black', color: '#2F2C3A' },
  { id: 'dark-brown', name: 'Dark brown', color: '#4B2D1C' },
  { id: 'brown', name: 'Brown', color: '#7A4A2B' },
  { id: 'blonde', name: 'Blonde', color: '#E8C15A' },
  { id: 'pink', name: 'Pink', color: '#EE85A8' },
  { id: 'blue', name: 'Blue', color: '#3E8FD8' },
];

export const HAIRSTYLES = [
  { id: 'bob', name: 'Bob' },
  { id: 'long', name: 'Long' },
  { id: 'ponytail', name: 'Ponytail' },
  { id: 'bun', name: 'Bun' },
  { id: 'short', name: 'Short' },
  { id: 'pixie', name: 'Pixie' },
  { id: 'hime', name: 'Hime cut' },
  { id: 'wavy', name: 'Wavy' },
  { id: 'curly', name: 'Curly' },
  { id: 'pigtails', name: 'Pigtails' },
  { id: 'braid', name: 'Braid' },
  { id: 'buzz', name: 'Buzz cut' },
  { id: 'side-part', name: 'Side part' },
  { id: 'spiky', name: 'Spiky' },
  { id: 'messy', name: 'Messy' },
];

// Beards use the hair color. 'none' draws nothing.
export const BEARDS = [
  { id: 'none', name: 'None' },
  { id: 'stubble', name: 'Stubble' },
  { id: 'short', name: 'Short beard' },
  { id: 'full', name: 'Full beard' },
];

export interface CharacterProfile {
  characterName: string;
  skin: string;
  hairStyle: string;
  hairColor: string;
  beard: string;
  equipped: Record<Slot, string | null>;
  // Each bought piece and the gold paid, so changing a price later can't alter past purchases.
  owned: Record<string, number>;
  customized: boolean;
  changedHair: boolean;
  readEntries: string[];
  quizzes: QuizRecords;
  practice: PracticeRecord;
  // Quests she turned in, by quest id.
  quests: Record<string, QuestRecord>;
  // Replies this account wrote to other players' quests, by reviewKey().
  questReviews: Record<string, QuestReview>;
}

export const NAME_LIMIT = 24;

export const cleanName = (name: string) => name.trim().replace(/\s+/g, ' ').slice(0, NAME_LIMIT);

export const DEFAULT_PROFILE: CharacterProfile = {
  characterName: '',
  skin: 'fair',
  hairStyle: 'ponytail',
  hairColor: 'plum',
  beard: 'none',
  equipped: { accessory: null, top: null, bottom: null },
  owned: {},
  customized: false,
  changedHair: false,
  readEntries: [],
  quizzes: {},
  practice: NEW_PRACTICE,
  quests: {},
  questReviews: {},
};

// Saves from older versions miss newer fields, so they are filled in with defaults.
export function restoreProfile(saved: Partial<CharacterProfile> | null | undefined): CharacterProfile {
  if (!saved) return DEFAULT_PROFILE;
  return { ...DEFAULT_PROFILE, ...saved, practice: loadPractice(saved.practice) };
}

// Sprite layers from back to front. The beard goes over the top's collar and under the hair.
export function characterLayers(profile: CharacterProfile, worn: Record<Slot, Piece | null>): string[] {
  const beard = BEARDS.some((item) => item.id === profile.beard && item.id !== 'none')
    ? `beard-${profile.beard}-${profile.hairColor}`
    : null;
  return [
    `base-${profile.skin}`,
    worn.bottom?.id,
    worn.top?.id,
    beard,
    `hair-${profile.hairStyle}-${profile.hairColor}`,
    worn.accessory?.id,
  ].filter((layer): layer is string => Boolean(layer));
}

// Only pieces she owns can be worn, so a stale save can't show something unbought.
export function wornPieces(profile: CharacterProfile): Record<Slot, Piece | null> {
  const worn = (slot: Slot) => {
    const piece = findPiece(profile.equipped[slot]);
    return piece && piece.id in profile.owned ? piece : null;
  };
  return { accessory: worn('accessory'), top: worn('top'), bottom: worn('bottom') };
}
