import type { WardrobeGenre } from './genres';
import { NEW_PRACTICE } from './practice';
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

// Each genre's three pieces reach the Shop one at a time, and later pieces cost more.
// Starting values, to be tuned once there is real play data.
export const SHOP_TIERS = [
  { level: 1, price: 60 },
  { level: 3, price: 120 },
  { level: 5, price: 200 },
];

// Genres take turns on which slot comes first, so every tier is a mix of outfit types.
const TIER_ORDERS: Slot[][] = [
  ['bottom', 'top', 'accessory'],
  ['top', 'accessory', 'bottom'],
  ['accessory', 'bottom', 'top'],
];

type Art = [name: string, blurb: string];
const SETS: Array<{ key: string; genre: WardrobeGenre; top: Art; bottom: Art; accessory: Art }> = [
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

export const PIECES: Piece[] = SETS.flatMap((set, index) =>
  SLOTS.map((slot) => {
    const tier = SHOP_TIERS[TIER_ORDERS[index % TIER_ORDERS.length].indexOf(slot)];
    return {
      id: `${slot === 'accessory' ? 'acc' : slot}-${set.key}`,
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
];

export interface CharacterProfile {
  characterName: string;
  skin: string;
  hairStyle: string;
  hairColor: string;
  equipped: Record<Slot, string | null>;
  // Each bought piece and the gold paid, so changing a price later can't alter past purchases.
  owned: Record<string, number>;
  customized: boolean;
  changedHair: boolean;
  readEntries: string[];
  quizzes: QuizRecords;
  practice: PracticeRecord;
}

export const NAME_LIMIT = 24;

export const cleanName = (name: string) => name.trim().replace(/\s+/g, ' ').slice(0, NAME_LIMIT);

export const DEFAULT_PROFILE: CharacterProfile = {
  characterName: '',
  skin: 'fair',
  hairStyle: 'ponytail',
  hairColor: 'plum',
  equipped: { accessory: null, top: null, bottom: null },
  owned: {},
  customized: false,
  changedHair: false,
  readEntries: [],
  quizzes: {},
  practice: NEW_PRACTICE,
};
