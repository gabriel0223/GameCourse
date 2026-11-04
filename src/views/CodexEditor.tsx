import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent, SyntheticEvent } from 'react';
import { DndContext, DragOverlay, PointerSensor, closestCenter, pointerWithin, useSensor, useSensors } from '@dnd-kit/core';
import type { CollisionDetection } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { originalArt } from '../content/art';
import { CODEX_ENTRIES } from '../content/codex';
import type { CodexCategory, CodexImage } from '../content/codex';
import { emptyBlock, findProblem, fromDraft, newConsoleDraft, newDraft, newEventDraft, toDraft } from '../content/drafts';
import type { Block, BlockKind, Draft } from '../content/drafts';
import { TIMELINE_GROUPS } from '../content/timeline';
import { canEditCodex, codexStore, isDemo } from '../data';
import { copiedPageImage, pastedImage, prepareImage } from '../imageUpload';
import { useCodex } from '../state/CodexContext';
import { useLibrary } from '../state/LibraryContext';
import { strings } from '../strings';
import { hrefs } from '../useHashRoute';
import { Article } from './CodexView';

const t = strings.editor;
type AddableKind = Exclude<BlockKind, 'figure' | 'consoles'>;
const ADDABLE: AddableKind[] = ['text', 'list', 'steps', 'image', 'table'];

interface ImageFieldProps {
  id: string;
  image?: CodexImage;
  fallback?: string;
  withCaption?: boolean;
  onChange(image: CodexImage | undefined): void;
}

async function storeImage(file: File) {
  return codexStore.saveImage(await prepareImage(file), file.name || 'pasted-image.png');
}

function focusDescription(container: Element | null | undefined) {
  requestAnimationFrame(() => {
    const input = container?.querySelector<HTMLInputElement>('.field input');
    input?.scrollIntoView({ block: 'center' });
    input?.focus();
  });
}

// The box under the pointer wins. Typing in a box's text fields doesn't select it.
function pasteTarget(): Element | null {
  const active = document.activeElement;
  const typing = active?.matches('input:not([type=file]), textarea');
  return document.querySelector('.image-field:hover') ?? (typing ? null : (active?.closest('.image-field') ?? null));
}

function ImageField({ id, image, fallback, withCaption, onChange }: ImageFieldProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const box = useRef<HTMLDivElement>(null);

  async function addFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError(t.imageTypeError);
      return false;
    }
    setBusy(true);
    setError('');
    try {
      const stored = await storeImage(file);
      onChange({ alt: image?.alt ?? '', caption: image?.caption, ...stored });
      return true;
    } catch {
      setError(t.imageError);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) await addFile(file);
  }

  useEffect(() => {
    async function paste(event: ClipboardEvent) {
      if (!box.current || pasteTarget() !== box.current) return;
      const file = pastedImage(event.clipboardData);
      if (file) {
        event.preventDefault();
        if (await addFile(file)) focusDescription(box.current);
      } else if (copiedPageImage(event.clipboardData)) {
        setError(t.pasteWebError);
      }
    }
    // Runs before the editor's own listener, which handles pastes outside every box.
    document.addEventListener('paste', paste, true);
    return () => document.removeEventListener('paste', paste, true);
  });

  const shown = image?.src ?? fallback;
  return (
    <div className="image-field" ref={box} tabIndex={0} role="group" aria-label={t.pasteArea}>
      {shown && (
        <img className={image ? 'image-preview' : 'image-preview image-preview-pixel'} src={shown} alt={image?.alt ?? ''} />
      )}
      <div className="image-actions">
        <label className="upload-button">
          {busy ? t.uploading : image ? t.replace : t.upload}
          <input id={id} type="file" accept="image/*" disabled={busy} onChange={upload} />
        </label>
        {image && (
          <button className="button button-quiet" type="button" onClick={() => onChange(undefined)}>
            {fallback ? t.useOriginal : t.removeImage}
          </button>
        )}
      </div>
      <p className="empty-small">{t.pasteHint}</p>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      {image && (
        <label className="field">
          {t.imageDescription}
          <small>{t.imageDescriptionHint}</small>
          <input value={image.alt} onChange={(event) => onChange({ ...image, alt: event.target.value })} />
        </label>
      )}
      {image && withCaption && (
        <label className="field">
          {t.caption}
          <input value={image.caption ?? ''} onChange={(event) => onChange({ ...image, caption: event.target.value })} />
        </label>
      )}
    </div>
  );
}

interface BlockEditorProps {
  block: Block;
  index: number;
  count: number;
  selected: boolean;
  onChange(block: Block): void;
  onMove(direction: -1 | 1): void;
  onRemove(): void;
  onAdd(kind: AddableKind): void;
}

function BlockEditor({ block, index, count, selected, onChange, onMove, onRemove, onAdd }: BlockEditorProps) {
  const { attributes, listeners, setActivatorNodeRef, setNodeRef, isDragging, activeIndex, overIndex } = useSortable({
    id: block.key,
  });
  const label = t.blockKinds[block.kind];
  const hint = block.kind === 'list' || block.kind === 'steps' || block.kind === 'table' ? t.hints[block.kind] : null;
  const isTarget = overIndex === index && activeIndex !== index && activeIndex >= 0;
  const classes = ['block'];
  if (selected) classes.push('block-selected');
  if (isDragging) classes.push('block-dragging');
  if (isTarget) classes.push(activeIndex > index ? 'block-drop-before' : 'block-drop-after');

  function moveWithKeys(event: KeyboardEvent<HTMLButtonElement>) {
    const direction = event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0;
    if (!direction) return;
    event.preventDefault();
    if (index + direction < 0 || index + direction >= count) return;
    onMove(direction);
    requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-block-key="${block.key}"] .drag-handle`)?.focus());
  }

  return (
    <section ref={setNodeRef} className={classes.join(' ')} data-block-key={block.key} aria-label={t.blockLabel(index + 1, label)}>
      <div className="block-top">
        <div className="block-title">
          <button
            ref={setActivatorNodeRef}
            className="drag-handle"
            type="button"
            title={t.dragHelp}
            {...attributes}
            {...listeners}
            aria-label={t.dragLabel(index + 1)}
            onKeyDown={moveWithKeys}
          >
            <svg viewBox="0 0 10 16" fill="currentColor" aria-hidden="true">
              {[2, 8, 14].map((y) => [2, 8].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.5" />))}
            </svg>
          </button>
          <span className="block-kind">{label}</span>
        </div>
        <div className="block-actions">
          <button className="button button-quiet" type="button" onClick={onRemove}>
            {t.remove}
          </button>
        </div>
      </div>
      <label className="field">
        {t.heading}
        <input value={block.heading} onChange={(event) => onChange({ ...block, heading: event.target.value })} />
      </label>
      {block.kind === 'figure' && <p className="empty-small">{t.figureNote}</p>}
      {block.kind === 'consoles' && <p className="empty-small">{t.consolesNote}</p>}
      {block.kind === 'image' && (
        <ImageField
          id={`upload-${block.key}`}
          image={block.image}
          withCaption
          onChange={(image) => onChange({ ...block, image })}
        />
      )}
      {block.kind !== 'figure' && block.kind !== 'consoles' && block.kind !== 'image' && (
        <label className="field">
          {label}
          {hint && <small>{hint}</small>}
          <textarea value={block.body} onChange={(event) => onChange({ ...block, body: event.target.value })} />
        </label>
      )}
      {selected && (
        <div className="add-below">
          <span>{t.addBelow}</span>
          {ADDABLE.map((kind) => (
            <button
              className="button button-quiet"
              key={kind}
              type="button"
              aria-label={t.addBelowLabel(t.blockKinds[kind])}
              onClick={() => onAdd(kind)}
            >
              {t.blockKinds[kind]}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

// Blocks can be tall, so the pointer decides the spot, with the nearest block for the gaps between them.
const findDropTarget: CollisionDetection = (args) => {
  const under = pointerWithin(args);
  return under.length ? under : closestCenter(args);
};

interface BlockListProps {
  blocks: Block[];
  selected: string | null;
  onChange(index: number, block: Block): void;
  onReorder(from: number, to: number): void;
  onRemove(index: number): void;
  onAdd(kind: AddableKind, after: string): void;
}

function BlockList({ blocks, selected, onChange, onReorder, onRemove, onAdd }: BlockListProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const [dragging, setDragging] = useState<string | null>(null);
  const keys = blocks.map((block) => block.key);
  const held = blocks.find((block) => block.key === dragging);
  const preview = held?.heading || held?.body || held?.image?.alt || '';

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={findDropTarget}
      accessibility={{ screenReaderInstructions: { draggable: t.dragHelp } }}
      onDragStart={({ active }) => setDragging(String(active.id))}
      onDragCancel={() => setDragging(null)}
      onDragEnd={({ active, over }) => {
        setDragging(null);
        if (over && active.id !== over.id) onReorder(keys.indexOf(String(active.id)), keys.indexOf(String(over.id)));
      }}
    >
      <SortableContext items={keys} strategy={verticalListSortingStrategy}>
        {blocks.map((block, index) => (
          <BlockEditor
            key={block.key}
            block={block}
            index={index}
            count={blocks.length}
            selected={block.key === selected}
            onChange={(next) => onChange(index, next)}
            onMove={(direction) => onReorder(index, index + direction)}
            onRemove={() => onRemove(index)}
            onAdd={(kind) => onAdd(kind, block.key)}
          />
        ))}
      </SortableContext>
      <DragOverlay dropAnimation={null}>
        {held && (
          <div className="block-overlay">
            <strong>{t.blockKinds[held.kind]}</strong>
            {preview && <span>{preview}</span>}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

export function CodexEditor({ id }: { id: string }) {
  const { notify } = useLibrary();
  const { drafts, find, isEdited, ready, restore, save } = useCodex();
  const [draftId] = useState(() => (id.startsWith('new') ? `custom-${crypto.randomUUID()}` : id));
  const storedDraft = drafts.get(id);
  const [draft, setDraft] = useState<Draft | null>(storedDraft ?? null);
  const [restored] = useState(Boolean(storedDraft));
  const [dirty, setDirty] = useState(Boolean(storedDraft));
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [showProblem, setShowProblem] = useState(false);
  const [confirming, setConfirming] = useState<'cancel' | 'restore' | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const selectedKey = useRef<string | null>(null);
  selectedKey.current = selected;
  const leaving = useRef(false);

  useEffect(() => {
    if (draft || !ready) return;
    if (id.startsWith('new')) {
      if (id === 'new-event') setDraft(newEventDraft(draftId));
      else if (id === 'new-console') setDraft(newConsoleDraft(draftId));
      else setDraft(newDraft(draftId));
      return;
    }
    const entry = find(id);
    if (entry) setDraft(toDraft(entry));
  }, [draft, draftId, find, id, ready]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  useEffect(() => {
    if (dirty && draft && !leaving.current) drafts.set(id, draft);
  }, [dirty, draft, drafts, id]);

  // An image pasted outside every image box becomes a new block, after the one being edited.
  useEffect(() => {
    if (!canEditCodex || mode !== 'edit') return;
    async function paste(event: ClipboardEvent) {
      const file = pastedImage(event.clipboardData);
      if (!file || event.defaultPrevented) return;
      event.preventDefault();
      const after = selectedKey.current;
      try {
        const stored = await storeImage(file);
        const block: Block = { ...emptyBlock('image'), image: { alt: '', ...stored } };
        setDraft((value) => {
          if (!value) return value;
          const index = value.blocks.findIndex((item) => item.key === after);
          const position = index < 0 ? value.blocks.length : index + 1;
          return { ...value, blocks: [...value.blocks.slice(0, position), block, ...value.blocks.slice(position)] };
        });
        setDirty(true);
        setSaveFailed(false);
        setSelected(block.key);
        requestAnimationFrame(() => focusDescription(document.querySelector(`[data-block-key="${block.key}"]`)));
      } catch {
        notify(t.imageError, 'plain');
      }
    }
    document.addEventListener('paste', paste);
    return () => document.removeEventListener('paste', paste);
  }, [mode, notify]);

  if (!canEditCodex) {
    return (
      <main className="page">
        <p className="notice">{strings.codex.notFound}</p>
      </main>
    );
  }
  if (!draft) return <main className="editor" aria-busy="true" />;

  const builtIn = CODEX_ENTRIES.some((entry) => entry.id === draft.id);
  const problem = findProblem(draft);
  const problemText = {
    title: t.titleRequired,
    year: t.yearError,
    image: t.missingImage,
    description: t.missingDescription,
  };
  const backHref =
    id === 'new'
      ? hrefs.codex
      : id === 'new-event'
        ? hrefs.timeline
        : id === 'new-console'
          ? hrefs.consoles
          : hrefs.codexEntry(id);
  const fallback = originalArt(draft.id);
  const current = draft;

  function update(change: Partial<Draft>) {
    setDraft({ ...current, ...change });
    setDirty(true);
    setSaveFailed(false);
    setConfirming(null);
  }

  function updateBlock(index: number, block: Block) {
    update({ blocks: current.blocks.map((item, position) => (position === index ? block : item)) });
  }

  function reorderBlock(from: number, to: number) {
    update({ blocks: arrayMove(current.blocks, from, to) });
  }

  function addBlock(kind: AddableKind, after?: string) {
    const block = emptyBlock(kind);
    const index = current.blocks.findIndex((item) => item.key === after);
    const position = index < 0 ? current.blocks.length : index + 1;
    update({ blocks: [...current.blocks.slice(0, position), block, ...current.blocks.slice(position)] });
    setSelected(block.key);
    requestAnimationFrame(() => {
      const added = document.querySelector(`[data-block-key="${block.key}"]`);
      added?.querySelector<HTMLElement>('textarea, .image-field')?.focus();
    });
  }

  // Selection follows finished clicks, because its button row moves the page. Tab reaches it on key release.
  function trackSelection(event: SyntheticEvent<HTMLElement>) {
    const block = (event.target as Element).closest<HTMLElement>('[data-block-key]');
    setSelected(block?.dataset.blockKey ?? null);
  }

  function leave(href: string) {
    leaving.current = true;
    setDirty(false);
    drafts.delete(id);
    window.location.hash = href;
  }

  async function submit() {
    if (problem) {
      setShowProblem(true);
      setMode('edit');
      return;
    }
    setSaving(true);
    try {
      await save(fromDraft(current));
      notify(t.saved, 'plain');
      leave(hrefs.codexEntry(current.id));
    } catch {
      setSaveFailed(true);
      setSaving(false);
    }
  }

  async function restoreOriginal() {
    await restore(current.id);
    notify(current.custom ? t.deleted : t.restored, 'plain');
    leave(current.custom ? (current.console ? hrefs.consoles : hrefs.codex) : hrefs.codexEntry(current.id));
  }

  return (
    <main className="editor">
      <header className="editor-header">
        <h1>{id.startsWith('new') ? t.titleNew : t.titleEdit(find(id)?.title ?? t.untitled)}</h1>
        <div className="segmented">
          <button type="button" aria-pressed={mode === 'edit'} onClick={() => setMode('edit')}>
            {t.edit}
          </button>
          <button type="button" aria-pressed={mode === 'preview'} onClick={() => setMode('preview')}>
            {t.preview}
          </button>
        </div>
      </header>
      {isDemo && <p className="editor-notice">{t.previewNotice}</p>}
      {restored && <p className="editor-notice">{t.draftRestored}</p>}

      {mode === 'preview' ? (
        <Article entry={{ ...fromDraft(current), title: current.title.trim() || t.untitled }} preview />
      ) : (
        <div className="editor-fields" onClickCapture={trackSelection} onKeyUpCapture={trackSelection}>
          <label className="field">
            {t.title}
            <input
              value={current.title}
              aria-invalid={showProblem && problem === 'title'}
              onChange={(event) => update({ title: event.target.value })}
            />
          </label>
          <label className="field">
            {t.summary}
            <input value={current.summary} onChange={(event) => update({ summary: event.target.value })} />
          </label>
          {current.custom && current.timeline?.kind === 'event' && (
            <>
              <label className="field">
                {t.year}
                <input
                  type="number"
                  inputMode="numeric"
                  value={Number.isNaN(current.timeline.year) ? '' : current.timeline.year}
                  aria-invalid={showProblem && problem === 'year'}
                  onChange={(event) => {
                    const year = event.target.valueAsNumber;
                    if (current.timeline) update({ timeline: { ...current.timeline, year, label: String(year) } });
                  }}
                />
              </label>
              <label className="field">
                {t.generation}
                <select
                  value={current.timeline.generation}
                  onChange={(event) => {
                    if (current.timeline) {
                      update({ timeline: { ...current.timeline, generation: Number(event.target.value) } });
                    }
                  }}
                >
                  {TIMELINE_GROUPS.map((group) => (
                    <option key={group.generation} value={group.generation}>
                      {group.title}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}
          {current.console && (
            <>
              <label className="field">
                {t.maker}
                <input
                  value={current.console.maker}
                  onChange={(event) => {
                    if (current.console) update({ console: { ...current.console, maker: event.target.value } });
                  }}
                />
              </label>
              <label className="field">
                {t.released}
                <input
                  type="number"
                  inputMode="numeric"
                  value={Number.isNaN(current.console.year) ? '' : current.console.year}
                  aria-invalid={showProblem && problem === 'year'}
                  onChange={(event) => {
                    if (current.console) update({ console: { ...current.console, year: event.target.valueAsNumber } });
                  }}
                />
              </label>
              <label className="field">
                {t.consoleGeneration}
                <select
                  value={current.console.generation}
                  onChange={(event) => {
                    if (current.console) {
                      update({ console: { ...current.console, generation: Number(event.target.value) } });
                    }
                  }}
                >
                  {TIMELINE_GROUPS.filter((group) => group.generation > 0).map((group) => (
                    <option key={group.generation} value={group.generation}>
                      {group.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                {t.sales}
                <small>{t.salesHint}</small>
                <input
                  value={current.console.sales}
                  onChange={(event) => {
                    if (current.console) update({ console: { ...current.console, sales: event.target.value } });
                  }}
                />
              </label>
              <label className="check-field">
                <input
                  type="checkbox"
                  checked={Boolean(current.console.handheld)}
                  onChange={(event) => {
                    if (!current.console) return;
                    const { handheld: _handheld, ...rest } = current.console;
                    update({ console: event.target.checked ? { ...rest, handheld: true } : rest });
                  }}
                />
                {t.handheld}
              </label>
            </>
          )}
          {current.custom && !current.timeline && !current.console && (
            <label className="field">
              {t.category}
              <select
                value={current.category}
                onChange={(event) => update({ category: event.target.value as CodexCategory })}
              >
                <option value="playing">{strings.codex.categories.playing}</option>
                <option value="industry">{strings.codex.categories.industry}</option>
              </select>
            </label>
          )}

          <h2 className="editor-group-title">{t.mainImage}</h2>
          <p className="empty-small">{t.mainImageHint}</p>
          <ImageField
            id="hero-upload"
            image={current.heroImage}
            fallback={fallback}
            onChange={(heroImage) => update({ heroImage })}
          />

          <h2 className="editor-group-title">{t.content}</h2>
          <BlockList
            blocks={current.blocks}
            selected={selected}
            onChange={updateBlock}
            onReorder={reorderBlock}
            onRemove={(index) => update({ blocks: current.blocks.filter((_, position) => position !== index) })}
            onAdd={addBlock}
          />
          <div className="add-blocks">
            {ADDABLE.map((kind) => (
              <button className="button" key={kind} type="button" onClick={() => addBlock(kind)}>
                {t.add(t.blockKinds[kind])}
              </button>
            ))}
          </div>

          <label className="field">
            {t.examples}
            <small>{t.examplesHint}</small>
            <textarea value={current.examples} onChange={(event) => update({ examples: event.target.value })} />
          </label>
        </div>
      )}
      <div className="editor-page-end" />

      <div className="editor-bar">
        {showProblem && problem && (
          <p className="field-error" role="alert">
            {problemText[problem]}
          </p>
        )}
        {saveFailed && (
          <p className="field-error" role="alert">
            {t.saveError}
          </p>
        )}
        {!(showProblem && problem) && !saveFailed && !id.startsWith('new') && (builtIn ? isEdited(id) : current.custom) && (
          <>
            {confirming === 'restore' ? (
              <>
                <button className="button button-danger" type="button" onClick={restoreOriginal}>
                  {current.custom ? t.confirmDelete : t.confirmRestore}
                </button>
                <button className="button button-quiet spacer" type="button" onClick={() => setConfirming(null)}>
                  {t.keepEditing}
                </button>
              </>
            ) : (
              <button className="button button-quiet spacer" type="button" onClick={() => setConfirming('restore')}>
                {current.custom ? t.deleteGuide : t.restore}
              </button>
            )}
          </>
        )}
        {confirming === 'cancel' ? (
          <>
            <button className="button button-danger" type="button" onClick={() => leave(backHref)}>
              {t.discard}
            </button>
            <button className="button button-quiet" type="button" onClick={() => setConfirming(null)}>
              {t.keepEditing}
            </button>
          </>
        ) : (
          <button
            className="button button-quiet"
            type="button"
            onClick={() => (dirty ? setConfirming('cancel') : leave(backHref))}
          >
            {t.cancel}
          </button>
        )}
        <button className="button button-primary" type="button" disabled={saving} onClick={submit}>
          {t.save}
        </button>
      </div>
    </main>
  );
}
