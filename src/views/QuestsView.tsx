import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { FormEvent } from 'react';
import { GoldAmount } from '../components/GoldAmount';
import { Icon } from '../components/Icon';
import type { CodexCategory, CodexEntry } from '../content/codex';
import {
  ANSWER_LIMIT,
  DEFAULT_QUEST_GOLD,
  DEFAULT_QUEST_MINUTES,
  MAX_QUEST_GOLD,
  QUEST_TIMES,
  dailyQuest,
  fitsTime,
  newQuestId,
  questIsValid,
  questsForYou,
} from '../domain/quests';
import type { Quest, QuestRecord, ReviewItem } from '../domain/quests';
import { todayLocal } from '../format';
import { useCodex } from '../state/CodexContext';
import { useLibrary } from '../state/LibraryContext';
import { useQuests } from '../state/QuestsContext';
import { ALL_PATHS, pathRead } from '../content/paths';
import { strings } from '../strings';
import { hrefs } from '../useHashRoute';
import { EntryArt } from './CodexView';

const t = strings.quests;

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });

// Small things kept on this device only: drafts and today's rerolls.
function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal(key: string, value: unknown) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Without storage, the draft lasts for this visit only.
  }
}

const draftKey = (questId: string) => `games-course-quest-draft:${questId}`;
const REROLL_KEY = 'games-course-quest-reroll';

/* The form editors use to add or change a quest. */

export function QuestForm({
  quest,
  entryId,
  onDone,
}: {
  quest?: Quest;
  // Set when the form sits on an entry page, so there's no entry to pick.
  entryId?: string;
  onDone(saved: Quest | null): void;
}) {
  const { entries } = useCodex();
  const { save, remove } = useQuests();
  const { notify } = useLibrary();
  const [draft, setDraft] = useState<Quest>(
    () =>
      quest ?? {
        id: '',
        entryId: entryId ?? '',
        title: '',
        task: '',
        question: '',
        gold: DEFAULT_QUEST_GOLD,
        minutes: DEFAULT_QUEST_MINUTES,
        custom: true,
      },
  );
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const f = t.form;

  const grouped = useMemo(() => {
    const groups = new Map<string, CodexEntry[]>();
    for (const entry of entries) {
      const label = strings.codex.categories[entry.category];
      groups.set(label, [...(groups.get(label) ?? []), entry]);
    }
    return [...groups.entries()].map(([label, items]) => [label, items.sort((a, b) => a.title.localeCompare(b.title))] as const);
  }, [entries]);

  const set = (change: Partial<Quest>) => setDraft((current) => ({ ...current, ...change }));

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!questIsValid(draft) || busy) return;
    setBusy(true);
    const id = draft.id || newQuestId(draft.title, crypto.randomUUID().slice(0, 6));
    const next = { ...draft, id };
    try {
      await save(next);
      notify(f.saved, 'plain');
      onDone(next);
    } catch {
      notify(f.error, 'error');
      setBusy(false);
    }
  }

  async function erase() {
    if (!quest || busy) return;
    setBusy(true);
    try {
      await remove(quest);
      notify(f.removed, 'plain');
      onDone(null);
    } catch {
      notify(f.error, 'error');
      setBusy(false);
    }
  }

  return (
    <form className="quest-form" onSubmit={submit}>
      <h3>{quest ? f.titleEdit : f.titleNew}</h3>
      {!entryId && (
        <label className="field">
          {f.entry}
          <select required value={draft.entryId} onChange={(event) => set({ entryId: event.target.value })}>
            <option value="">{f.entryPick}</option>
            {grouped.map(([label, items]) => (
              <optgroup key={label} label={label}>
                {items.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.title}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
      )}
      <div className="quest-form-row">
        <label className="field">
          {f.name}
          <input required value={draft.title} placeholder={f.namePlaceholder} onChange={(event) => set({ title: event.target.value })} />
        </label>
        <label className="field quest-form-time">
          {f.time}
          <select
            value={draft.minutes ?? ''}
            onChange={(event) => set({ minutes: event.target.value ? Number(event.target.value) : undefined })}
          >
            {draft.minutes === undefined && <option value="">{f.noTime}</option>}
            {QUEST_TIMES.map((minutes) => (
              <option key={minutes} value={minutes}>
                {t.time(minutes)}
              </option>
            ))}
          </select>
        </label>
        <label className="field quest-form-gold">
          {f.gold}
          <input
            type="number"
            min={0}
            max={MAX_QUEST_GOLD}
            step={5}
            value={draft.gold}
            onChange={(event) => set({ gold: Number(event.target.value) })}
          />
        </label>
      </div>
      <label className="field">
        {f.task}
        <textarea required rows={2} value={draft.task} placeholder={f.taskPlaceholder} onChange={(event) => set({ task: event.target.value })} />
      </label>
      <label className="field">
        {f.question}
        <small>{f.questionHint}</small>
        <textarea
          rows={2}
          value={draft.question}
          placeholder={f.questionPlaceholder}
          onChange={(event) => set({ question: event.target.value })}
        />
      </label>
      <div className="quest-form-actions">
        <button className="button button-primary" type="submit" disabled={busy || !questIsValid(draft)}>
          {quest ? f.save : f.create}
        </button>
        <button className="button button-quiet" type="button" onClick={() => onDone(null)}>
          {f.cancel}
        </button>
        {quest &&
          (confirming ? (
            <span className="quest-form-remove">
              <small>{f.removeHint}</small>
              <button className="button button-danger" type="button" disabled={busy} onClick={erase}>
                {f.confirmRemove}
              </button>
            </span>
          ) : (
            <button className="button button-quiet quest-form-remove" type="button" onClick={() => setConfirming(true)}>
              {f.remove}
            </button>
          ))}
      </div>
    </form>
  );
}

/* Small pieces shared by the screens. */

function TimeTag({ minutes }: { minutes?: number }) {
  if (minutes === undefined) return null;
  return (
    <span className="quest-time" title={t.timeTitle}>
      <Icon name="clock" />
      {t.time(minutes)}
    </span>
  );
}

function StatusTag({ questId, always = false }: { questId: string; always?: boolean }) {
  const { status, hasNewReply } = useQuests();
  const current = status(questId);
  if (hasNewReply(questId)) return <span className="quest-tag quest-tag-new">{t.newReply}</span>;
  // Most quests are untouched, so they only get a tag once something has happened.
  if (current === 'open' && !always) return null;
  return <span className={`quest-tag quest-tag-${current}`}>{t.status[current]}</span>;
}

function QuestRow({
  id,
  title,
  gold,
  entryId,
  showEntry = true,
}: {
  id: string;
  title: string;
  gold: number;
  entryId: string;
  showEntry?: boolean;
}) {
  const { find } = useCodex();
  const { find: findQuest } = useQuests();
  const entry = showEntry ? find(entryId) : undefined;
  // A deleted quest has no task left to show, only what she turned in.
  const quest = findQuest(id);
  const task = quest?.task;
  return (
    <a className="quest-row" href={hrefs.quest(id)}>
      <span className="quest-row-icon" aria-hidden="true">
        <Icon name="quest" />
      </span>
      <span className="quest-row-text">
        {entry && <small>{entry.title}</small>}
        <strong>{title}</strong>
        {task && <span className="quest-row-task">{task}</span>}
      </span>
      <span className="quest-row-side">
        <StatusTag questId={id} />
        <TimeTag minutes={quest?.minutes} />
        <GoldAmount amount={gold} />
      </span>
    </a>
  );
}

function ReviewCard({ item }: { item: ReviewItem }) {
  const { replyToQuest } = useLibrary();
  const { find: findQuest } = useQuests();
  const { find } = useCodex();
  const [note, setNote] = useState('');
  const quest = findQuest(item.questId);
  const entry = find(item.record.entryId);
  const r = t.review;
  return (
    <article className="review-card">
      <header>
        <p className="review-meta">{r.from(item.player.name, shortDate(item.record.updatedAt))}</p>
        <h3>
          <a href={hrefs.quest(item.questId)}>{item.record.title}</a>
        </h3>
        {entry && <small>{entry.title}</small>}
      </header>
      {quest?.question && <p className="review-question">{quest.question}</p>}
      <p className="quest-answer">{item.record.answer}</p>
      <label className="field">
        {r.note}
        <textarea rows={2} value={note} placeholder={r.notePlaceholder} onChange={(event) => setNote(event.target.value)} />
      </label>
      <button className="button button-primary" type="button" onClick={() => replyToQuest(item.player.id, item.questId, note)}>
        {note.trim() ? r.send : r.markOnly}
      </button>
    </article>
  );
}

function TodaysQuest() {
  const { quests } = useQuests();
  const { profile } = useLibrary();
  const { find } = useCodex();
  const today = todayLocal();
  const [reroll, setReroll] = useState(() => {
    const saved = readLocal<{ date: string; count: number } | null>(REROLL_KEY, null);
    return saved?.date === today ? saved.count : 0;
  });
  const quest = dailyQuest(quests, profile.quests, profile.readEntries, today, reroll);
  const open = quests.filter((item) => !profile.quests[item.id]).length;
  const entry = quest ? find(quest.entryId) : undefined;

  function another() {
    const count = reroll + 1;
    setReroll(count);
    writeLocal(REROLL_KEY, { date: today, count });
  }

  return (
    <section className="quest-today">
      <p className="quest-kicker">{t.today}</p>
      {quest ? (
        <div className="quest-today-card">
          {entry && <EntryArt entry={entry} />}
          <div className="quest-today-text">
            <div className="quest-today-title">
              <h2>{quest.title}</h2>
              <TimeTag minutes={quest.minutes} />
              <GoldAmount amount={quest.gold} />
            </div>
            {entry && <small>{t.from(entry.title)}</small>}
            <p>{quest.task}</p>
            <div className="quest-today-actions">
              <a className="button button-primary button-link" href={hrefs.quest(quest.id)}>
                {t.open}
              </a>
              {open > 1 && (
                <button className="button" type="button" onClick={another}>
                  {t.another}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <p className="empty-small">{t.allDone}</p>
      )}
    </section>
  );
}

// The same order the Codex uses for its paths.
const CATEGORY_ORDER: CodexCategory[] = ['playing', 'genres', 'history', 'consoles', 'people', 'roles', 'industry'];

type Sort = 'suggested' | 'shortest' | 'longest' | 'gold';
const SORTS: Sort[] = ['suggested', 'shortest', 'longest', 'gold'];
const LAST_STOP = QUEST_TIMES.length - 1;

// A filter button that opens a small menu, like the ones on shopping sites.
function FilterMenu({ label, count, children }: { label: string; count: number; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: Event) => {
      if (event instanceof KeyboardEvent ? event.key === 'Escape' : !box.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  return (
    <div className="filter-menu" ref={box}>
      <button
        type="button"
        className="filter-pill"
        aria-expanded={open}
        data-active={count > 0 || undefined}
        onClick={() => setOpen((current) => !current)}
      >
        {label}
        {count > 0 && <span className="filter-pill-count">{count}</span>}
        <svg viewBox="0 0 12 12" aria-hidden="true">
          <path d="M3 4.5 6 7.5l3-3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>
      {open && <div className="filter-popover">{children}</div>}
    </div>
  );
}

function CheckList<T extends string>({
  options,
  picked,
  label,
  onChange,
}: {
  options: T[];
  picked: T[];
  label(value: T): string;
  onChange(next: T[]): void;
}) {
  return (
    <>
      {options.map((value) => (
        <label key={value} className="filter-check">
          <input
            type="checkbox"
            checked={picked.includes(value)}
            onChange={(event) => onChange(event.target.checked ? [...picked, value] : picked.filter((item) => item !== value))}
          />
          {label(value)}
        </label>
      ))}
      {picked.length > 0 && (
        <button className="filter-clear" type="button" onClick={() => onChange([])}>
          {t.clear}
        </button>
      )}
    </>
  );
}

// One handle, dragged left to right: the longest quest she's up for. The last stop means any length.
function TimeLimit({ stop, onChange }: { stop: number; onChange(next: number): void }) {
  const percent = (index: number) => (index / LAST_STOP) * 100;
  const any = stop === LAST_STOP;
  return (
    <div className="time-limit">
      <label className="time-limit-label" htmlFor="quest-time-limit">
        <Icon name="clock" />
        {any ? t.anyLength : t.upTo(t.stop(QUEST_TIMES[stop]))}
      </label>
      <div className="time-limit-track">
        <span className="time-limit-fill" style={{ width: `${percent(stop)}%` }} />
        {QUEST_TIMES.map((minutes, index) => (
          <span key={minutes} className="time-limit-tick" style={{ left: `${percent(index)}%` }} data-on={index <= stop || undefined} />
        ))}
        <input
          id="quest-time-limit"
          type="range"
          min={0}
          max={LAST_STOP}
          step={1}
          value={stop}
          aria-valuetext={any ? t.anyLength : t.upTo(t.stop(QUEST_TIMES[stop]))}
          onChange={(event) => onChange(Number(event.target.value))}
        />
      </div>
      <div className="time-limit-stops" aria-hidden="true">
        {QUEST_TIMES.map((minutes, index) => (
          <span key={minutes} style={{ left: `${percent(index)}%` }} data-on={index <= stop || undefined}>
            {t.stop(minutes)}
          </span>
        ))}
      </div>
    </div>
  );
}

// Her filters are kept on this device, so they're still set when she comes back.
interface SavedFilters {
  // Null until she flips For you, so it can follow whether there's anything for her yet.
  forYou: boolean | null;
  categories: CodexCategory[];
  stop: number;
  sort: Sort;
}

const FILTERS_KEY = 'games-course-quest-filters';
// The slider starts in the middle, at 1h, so it's clear it can move either way.
const DEFAULT_STOP = QUEST_TIMES.indexOf(60);

function loadFilters(): SavedFilters {
  const saved = readLocal<Partial<SavedFilters>>(FILTERS_KEY, {});
  return {
    forYou: typeof saved.forYou === 'boolean' ? saved.forYou : null,
    categories: Array.isArray(saved.categories) ? saved.categories.filter((item) => CATEGORY_ORDER.includes(item)) : [],
    stop: Number.isInteger(saved.stop) && saved.stop! >= 0 && saved.stop! <= LAST_STOP ? saved.stop! : DEFAULT_STOP,
    sort: SORTS.includes(saved.sort as Sort) ? (saved.sort as Sort) : 'suggested',
  };
}

// Shop-style browsing: filter buttons and a time limit on top, then a count and a sort.
// For you only offers quests she hasn't done yet, since it answers "what could I do next?".
function QuestBrowser({ quests }: { quests: Quest[] }) {
  const { find } = useCodex();
  const { profile } = useLibrary();
  const started = ALL_PATHS.filter(
    (path) => pathRead(path, profile.readEntries) > 0 && !profile.quizzes[path.id]?.passed,
  ).flatMap((path) => path.entryIds);
  const forYouIds = new Set(questsForYou(quests, profile.quests, profile.readEntries, started).map((quest) => quest.id));
  const [filters, setFilters] = useState<SavedFilters>(loadFilters);
  const update = (change: Partial<SavedFilters>) =>
    setFilters((current) => {
      const next = { ...current, ...change };
      writeLocal(FILTERS_KEY, next);
      return next;
    });
  const { categories, stop, sort } = filters;
  const forYou = filters.forYou ?? forYouIds.size > 0;

  const categoryOf = (quest: Quest) => find(quest.entryId)?.category;
  const present = CATEGORY_ORDER.filter((category) => quests.some((quest) => categoryOf(quest) === category));
  const shown = quests
    .filter((quest) => !forYou || forYouIds.has(quest.id))
    .filter((quest) => categories.length === 0 || categories.includes(categoryOf(quest)!))
    .filter((quest) => fitsTime(quest, 0, QUEST_TIMES[stop]));

  const minutes = (quest: Quest) => quest.minutes ?? Number.POSITIVE_INFINITY;
  const open = (quest: Quest) => Number(!profile.quests[quest.id]);
  const order = (quest: Quest) => CATEGORY_ORDER.indexOf(categoryOf(quest) ?? 'industry');
  const sorted = [...shown].sort((a, b) => {
    if (sort === 'shortest') return minutes(a) - minutes(b);
    if (sort === 'longest') return minutes(b) - minutes(a);
    if (sort === 'gold') return b.gold - a.gold;
    return open(b) - open(a) || order(a) - order(b);
  });

  // For you is a view of its own, so Clear only appears for filters she picked.
  const narrowed = categories.length > 0 || stop !== DEFAULT_STOP;

  return (
    <>
      <div className="quest-filter-bar">
        <div className="quest-filter-buttons">
          <button type="button" className="filter-pill" aria-pressed={forYou} onClick={() => update({ forYou: !forYou })}>
            {forYou && <Icon name="check" />}
            {t.filters.forYou}
          </button>
          <FilterMenu label={t.filters.category} count={categories.length}>
            <CheckList
              options={present}
              picked={categories}
              label={(value) => strings.codex.categories[value]}
              onChange={(next) => update({ categories: next })}
            />
          </FilterMenu>
        </div>
        <TimeLimit stop={stop} onChange={(next) => update({ stop: next })} />
      </div>
      <div className="quest-results-bar">
        <p className="count">
          {t.count(sorted.length)}
          {narrowed && (
            <button className="filter-clear" type="button" onClick={() => update({ categories: [], stop: DEFAULT_STOP })}>
              {t.clearAll}
            </button>
          )}
        </p>
        <label className="quest-sort">
          {t.sortBy}
          <select value={sort} onChange={(event) => update({ sort: event.target.value as Sort })}>
            {SORTS.map((value) => (
              <option key={value} value={value}>
                {t.sorts[value]}
              </option>
            ))}
          </select>
        </label>
      </div>
      {sorted.length === 0 ? (
        <p className="empty-small quest-filter-empty">
          {forYou && forYouIds.size === 0 && !narrowed ? t.emptyFilter['for-you'] : t.emptyFilter.other}
        </p>
      ) : (
        <div className="quest-list">
          {sorted.map((quest) => (
            <QuestRow key={quest.id} id={quest.id} title={quest.title} gold={quest.gold} entryId={quest.entryId} />
          ))}
        </div>
      )}
    </>
  );
}

export function QuestsView() {
  const { quests, ready, canEdit, queue, reply, hasNewReply } = useQuests();
  const { profile } = useLibrary();
  const [adding, setAdding] = useState(false);

  if (!ready) return <main className="page" aria-busy="true" />;

  const records = Object.entries(profile.quests).sort(
    ([a, first], [b, second]) =>
      Number(hasNewReply(b)) - Number(hasNewReply(a)) || second.updatedAt.localeCompare(first.updatedAt),
  );
  const waiting = records.filter(([id]) => !reply(id));
  const finished = records.filter(([id]) => reply(id));

  const row = ([id, record]: [string, QuestRecord]) => (
    <QuestRow key={id} id={id} title={record.title} gold={record.gold} entryId={record.entryId} />
  );

  return (
    <main className="page quests-page">
      <header className="page-header">
        <h1>{t.title}</h1>
        {canEdit && !adding && (
          <button className="button" type="button" onClick={() => setAdding(true)}>
            + {t.newQuest}
          </button>
        )}
      </header>
      <p className="timeline-intro">{t.intro}</p>

      {adding && <QuestForm onDone={() => setAdding(false)} />}

      {queue.length > 0 && (
        <section className="quest-block">
          <h2>
            {t.toReview} <span className="quest-count">{queue.length}</span>
          </h2>
          <p className="empty-small">{t.toReviewHint}</p>
          <div className="review-list">
            {queue.map((item) => (
              <ReviewCard key={`${item.player.id}:${item.questId}`} item={item} />
            ))}
          </div>
        </section>
      )}

      <TodaysQuest />

      {waiting.length > 0 && (
        <section className="quest-block">
          <h2>{t.waiting}</h2>
          <div className="quest-list">{waiting.map(row)}</div>
        </section>
      )}

      {finished.length > 0 && (
        <section className="quest-block">
          <h2>{t.finished}</h2>
          <div className="quest-list">{finished.map(row)}</div>
        </section>
      )}

      <section className="quest-block">
        <h2>{t.browse}</h2>
        {quests.length === 0 ? <p className="empty-small">{t.none}</p> : <QuestBrowser quests={quests} />}
      </section>
    </main>
  );
}

/* One quest: what to do, her answer, and the reply. */

function AnswerForm({ quest, record, onDone }: { quest: Quest; record?: QuestRecord; onDone?(): void }) {
  const { turnInQuest } = useLibrary();
  const { find } = useCodex();
  const [answer, setAnswer] = useState(() => record?.answer ?? readLocal<string>(draftKey(quest.id), ''));

  useEffect(() => {
    if (!record) writeLocal(draftKey(quest.id), answer || null);
  }, [answer, quest.id, record]);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!answer.trim()) return;
    turnInQuest(quest, answer, find(quest.entryId)?.category ?? 'custom');
    writeLocal(draftKey(quest.id), null);
    onDone?.();
  }

  return (
    <form className="quest-answer-form" onSubmit={submit}>
      <label className="field">
        {t.answerLabel}
        <small>{t.answerHint}</small>
        <textarea rows={5} maxLength={ANSWER_LIMIT} value={answer} onChange={(event) => setAnswer(event.target.value)} />
      </label>
      <div className="quest-form-actions">
        <button className="button button-primary" type="submit" disabled={!answer.trim()}>
          {record ? t.saveAnswer : t.turnIn(quest.gold)}
        </button>
        {onDone && (
          <button className="button button-quiet" type="button" onClick={onDone}>
            {t.cancel}
          </button>
        )}
      </div>
    </form>
  );
}

export function QuestView({ id }: { id: string }) {
  const { find, ready, canEdit, reply: findReply } = useQuests();
  const { profile, markReplySeen } = useLibrary();
  const { find: findEntry } = useCodex();
  const [editingQuest, setEditingQuest] = useState(false);
  const [editingAnswer, setEditingAnswer] = useState(false);
  const quest = find(id);
  const record = profile.quests[id];
  const reply = findReply(id);

  // Opening the page is how she sees the reply, so it stops counting as new.
  useEffect(() => {
    if (record && reply && !record.replySeenAt) markReplySeen(id);
  }, [id, markReplySeen, record, reply]);

  if (!ready) return <main className="page" aria-busy="true" />;
  // A quest she turned in stays readable even if it was deleted later.
  if (!quest && !record) {
    return (
      <main className="page">
        <a className="back" href={hrefs.quests}>
          {t.back}
        </a>
        <p className="notice">{t.notFound}</p>
      </main>
    );
  }

  const entry = findEntry(quest?.entryId ?? record!.entryId);
  const gold = record?.gold ?? quest!.gold;

  return (
    <main className="page quest-page">
      <a className="back" href={hrefs.quests}>
        {t.back}
      </a>
      <header className="quest-head">
        {entry && <EntryArt entry={entry} />}
        <div>
          {entry && (
            <a className="quest-kicker quest-entry-link" href={hrefs.codexEntry(entry.id)}>
              {t.from(entry.title)}
            </a>
          )}
          <h1>{quest?.title ?? record!.title}</h1>
          <div className="quest-head-tags">
            <StatusTag questId={id} always />
            <TimeTag minutes={quest?.minutes} />
            <GoldAmount amount={gold} />
          </div>
        </div>
      </header>

      {canEdit && quest && (editingQuest ? (
        <QuestForm quest={quest} onDone={() => setEditingQuest(false)} />
      ) : (
        <button className="button button-quiet quest-edit" type="button" onClick={() => setEditingQuest(true)}>
          <Icon name="pencil" />
          {t.form.editQuest}
        </button>
      ))}

      {quest && (
        <section className="quest-brief">
          <h2>{t.task}</h2>
          <p>{quest.task}</p>
          {quest.question && (
            <>
              <h2>{t.question}</h2>
              <p className="quest-question">{quest.question}</p>
            </>
          )}
        </section>
      )}

      {!record && quest && <AnswerForm quest={quest} />}

      {record && (
        <section className="quest-turned-in">
          <div className="quest-block-head">
            <h2>{t.yourAnswer}</h2>
            <small>{t.turnedInOn(shortDate(record.submittedAt))}</small>
          </div>
          {editingAnswer && quest ? (
            <AnswerForm quest={quest} record={record} onDone={() => setEditingAnswer(false)} />
          ) : (
            <>
              <p className="quest-answer">{record.answer}</p>
              {!reply && quest && (
                <button className="button button-quiet" type="button" onClick={() => setEditingAnswer(true)}>
                  {t.edit}
                </button>
              )}
            </>
          )}
          {reply ? (
            <div className="quest-reply">
              <p className="quest-kicker">{t.notesTitle}</p>
              <p>{reply.note || t.noNote}</p>
              <small>{t.notesSignature(reply.from, shortDate(reply.reviewedAt))}</small>
            </div>
          ) : (
            <p className="quest-waiting">{t.waitingNote}</p>
          )}
        </section>
      )}
    </main>
  );
}

/* The quests on a Codex entry page. */

export function EntryQuests({ entry }: { entry: CodexEntry }) {
  const { forEntry, canEdit } = useQuests();
  const [adding, setAdding] = useState(false);
  const quests = forEntry(entry.id);
  if (!quests.length && !canEdit) return null;
  return (
    <section className="entry-quests">
      <h2>{t.onEntry}</h2>
      {quests.length > 0 && <p className="empty-small">{t.entryHint}</p>}
      {quests.length > 0 && (
        <div className="quest-list">
          {quests.map((quest) => (
            <QuestRow key={quest.id} id={quest.id} title={quest.title} gold={quest.gold} entryId={quest.entryId} showEntry={false} />
          ))}
        </div>
      )}
      {canEdit &&
        (adding ? (
          <QuestForm entryId={entry.id} onDone={() => setAdding(false)} />
        ) : (
          <button className="button entry-quests-add" type="button" onClick={() => setAdding(true)}>
            + {t.addHere}
          </button>
        ))}
    </section>
  );
}
