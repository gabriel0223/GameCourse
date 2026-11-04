import type { CodexCategory, CodexEntry, CodexGame, CodexImage, CodexSection } from './codex';

export type BlockKind = 'text' | 'list' | 'steps' | 'table' | 'image' | 'figure' | 'consoles' | 'games';

export interface Block {
  key: string;
  kind: BlockKind;
  heading: string;
  body: string;
  image?: CodexImage;
}

export interface Draft {
  id: string;
  custom: boolean;
  category: CodexCategory;
  genre?: CodexEntry['genre'];
  related?: string[];
  timeline?: CodexEntry['timeline'];
  console?: CodexEntry['console'];
  title: string;
  summary: string;
  heroImage?: CodexImage;
  blocks: Block[];
}

let nextKey = 1;
export const blockKey = () => `block-${nextKey++}`;

export function emptyBlock(kind: BlockKind): Block {
  return { key: blockKey(), kind, heading: '', body: '' };
}

const lines = (text: string) =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

// Spaces around the bar keep names like Xbox Series X|S in one cell.
const cells = (line: string) => line.split(/\s+\|\s+/).map((cell) => cell.trim());

const gameLine = ({ name, year }: CodexGame) => (year ? `${name} (${year})` : name);

function parseGame(line: string): CodexGame {
  const dated = line.match(/^(.+?)\s*\((\d{4})\)$/);
  return dated ? { name: dated[1], year: Number(dated[2]) } : { name: line };
}

function toBlock(section: CodexSection): Block {
  const base = { key: blockKey(), heading: section.heading ?? '', body: '' };
  if (section.image) return { ...base, kind: 'image', image: section.image };
  if (section.figure) return { ...base, kind: 'figure' };
  if (section.consoles !== undefined) return { ...base, kind: 'consoles', body: String(section.consoles) };
  if (section.games) return { ...base, kind: 'games', body: section.games.map(gameLine).join('\n') };
  if (section.list) return { ...base, kind: 'list', body: section.list.join('\n') };
  if (section.steps) return { ...base, kind: 'steps', body: section.steps.join('\n') };
  if (section.table) {
    const rows = [section.table.headers, ...section.table.rows];
    return { ...base, kind: 'table', body: rows.map((row) => row.join(' | ')).join('\n') };
  }
  return { ...base, kind: 'text', body: section.text ?? '' };
}

function toSection(block: Block): CodexSection | null {
  const heading = block.heading.trim() ? { heading: block.heading.trim() } : {};
  switch (block.kind) {
    case 'text':
      return block.body.trim() ? { ...heading, text: block.body.trim() } : null;
    case 'list':
      return lines(block.body).length ? { ...heading, list: lines(block.body) } : null;
    case 'steps':
      return lines(block.body).length ? { ...heading, steps: lines(block.body) } : null;
    case 'games':
      return lines(block.body).length ? { ...heading, games: lines(block.body).map(parseGame) } : null;
    case 'table': {
      const [headers, ...rows] = lines(block.body).map(cells);
      return headers ? { ...heading, table: { headers, rows } } : null;
    }
    case 'image':
      return block.image ? { ...heading, image: block.image } : null;
    case 'figure':
      return { ...heading, figure: 'face-buttons' };
    case 'consoles':
      return { ...heading, consoles: Number(block.body) };
  }
}

export function toDraft(entry: CodexEntry): Draft {
  return {
    id: entry.id,
    custom: Boolean(entry.custom),
    category: entry.category,
    genre: entry.genre,
    related: entry.related,
    timeline: entry.timeline,
    console: entry.console,
    title: entry.title,
    summary: entry.summary,
    heroImage: entry.heroImage,
    blocks: entry.sections.map(toBlock),
  };
}

export function newDraft(id: string): Draft {
  return {
    id,
    custom: true,
    category: 'playing',
    title: '',
    summary: '',
    blocks: [emptyBlock('text')],
  };
}

export function newEventDraft(id: string): Draft {
  return {
    ...newDraft(id),
    category: 'history',
    timeline: { kind: 'event', generation: 9, year: new Date().getFullYear(), label: String(new Date().getFullYear()) },
  };
}

export function newConsoleDraft(id: string): Draft {
  return {
    ...newDraft(id),
    category: 'consoles',
    console: { generation: 9, year: new Date().getFullYear(), maker: '', sales: '' },
  };
}

export function fromDraft(draft: Draft): CodexEntry {
  const entry: CodexEntry = {
    id: draft.id,
    category: draft.category,
    title: draft.title.trim(),
    summary: draft.summary.trim(),
    sections: draft.blocks.flatMap((block) => toSection(block) ?? []),
  };
  if (draft.genre) entry.genre = draft.genre;
  if (draft.related) entry.related = draft.related;
  if (draft.timeline) entry.timeline = draft.timeline;
  if (draft.console) entry.console = { ...draft.console, maker: draft.console.maker.trim(), sales: draft.console.sales.trim() };
  if (draft.heroImage) entry.heroImage = draft.heroImage;
  if (draft.custom) entry.custom = true;
  return entry;
}

export type DraftProblem = 'title' | 'year' | 'image' | 'description' | null;

export function findProblem(draft: Draft): DraftProblem {
  if (!draft.title.trim()) return 'title';
  const year = draft.timeline?.year ?? draft.console?.year;
  if (year !== undefined && (!Number.isInteger(year) || year < 1900 || year > 2100)) return 'year';
  const images = draft.blocks.filter((block) => block.kind === 'image');
  if (images.some((block) => !block.image)) return 'image';
  const all = [...images.flatMap((block) => block.image ?? []), ...(draft.heroImage ? [draft.heroImage] : [])];
  if (all.some((image) => !image.alt.trim())) return 'description';
  return null;
}
