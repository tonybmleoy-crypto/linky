import type { CSSProperties, RefObject } from 'react'
import { Check, ClipboardPaste, CornerDownLeft, Plus, Search } from 'lucide-react'
import { displayContent, displayTitle, type Folder, type Snippet } from '@shared/model'
import { useT } from '../shared/i18n'
import { MOD } from '../shared/platform'
import { Chip, IconButton, Kbd, NumberBadge, SnippetTile, Toast, cx } from '../shared/ui'

export interface PalettePanelProps {
  query: string
  onQueryChange?: (q: string) => void
  folders: Folder[]
  folderId: string | null
  onFolder?: (id: string | null) => void
  results: Snippet[]
  selected: number
  onHover?: (i: number) => void
  onPick?: (s: Snippet) => void
  /** Shortcut hint shown in the search field, e.g. "Ctrl Alt V". */
  hotkey: string
  toast?: string | null
  empty: boolean
  onSaveClipboard?: () => void
  onOpenManager?: () => void
  inputRef?: RefObject<HTMLInputElement | null>
  listRef?: RefObject<HTMLDivElement | null>
  /** Shows a blinking caret in the search field (the demo has no real focus). */
  fakeCaret?: boolean
  className?: string
  style?: CSSProperties
}

/**
 * The quick menu itself, without any Electron wiring — rendered by the real palette window
 * and by the scripted product demo on the landing page.
 */
export function PalettePanel(p: PalettePanelProps) {
  const t = useT()
  const folderById = new Map(p.folders.map((f) => [f.id, f]))
  return (
    <div
      style={p.style}
      className={cx('relative flex max-h-full w-[600px] flex-col gap-1.5 rounded-[32px] border border-glass-stroke p-2.5 shadow-glass', p.className)}
    >
      <div className="absolute inset-0 -z-10 rounded-[32px] bg-[var(--palette-fill)] backdrop-blur-2xl" />

      {/* Search */}
      <label className="flex items-center gap-3 px-4 pt-3 pb-2">
        <Search size={20} strokeWidth={1.75} className="shrink-0 text-fg-2" />
        <span className="relative flex min-w-0 flex-1 items-center">
          <input
            ref={p.inputRef}
            autoFocus={!p.fakeCaret}
            readOnly={!p.onQueryChange}
            tabIndex={p.onQueryChange ? undefined : -1}
            value={p.query}
            onChange={(e) => p.onQueryChange?.(e.target.value)}
            placeholder={t('pal.search')}
            spellCheck={false}
            className="t-search min-w-0 flex-1 bg-transparent text-fg outline-none placeholder:text-fg-3"
          />
          {p.fakeCaret && <FakeCaret after={p.query} />}
        </span>
        {p.hotkey && <Kbd>{p.hotkey}</Kbd>}
      </label>

      {/* Folder chips */}
      {p.folders.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto px-2.5 pb-1.5 [scrollbar-width:none]">
          <Chip selected={p.folderId === null} onClick={() => p.onFolder?.(null)} tabIndex={-1}>
            {t('pal.all')}
          </Chip>
          {p.folders.map((f) => (
            <Chip key={f.id} selected={p.folderId === f.id} onClick={() => p.onFolder?.(f.id)} tabIndex={-1}>
              {f.name}
            </Chip>
          ))}
        </div>
      )}

      {/* Results */}
      <div ref={p.listRef} className="-mx-0.5 flex min-h-0 flex-col gap-0.5 overflow-y-auto px-0.5">
        {p.results.map((s, i) => (
          <Row
            key={s.id}
            index={i}
            snippet={s}
            folder={s.folderId ? folderById.get(s.folderId) : undefined}
            selected={i === p.selected}
            onHover={() => p.onHover?.(i)}
            onPick={() => p.onPick?.(s)}
          />
        ))}
        {p.results.length === 0 && (
          <EmptyState empty={p.empty} query={p.query} onSave={p.onSaveClipboard} onOpen={p.onOpenManager} />
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-3.5 pt-2.5 pb-1.5">
        <button
          onClick={p.onSaveClipboard}
          tabIndex={-1}
          className="t-caption flex items-center gap-2 rounded-full font-medium text-fg-2 hover:text-fg"
        >
          <Plus size={14} strokeWidth={1.75} /> {t('pal.saveClipboard')}
          <span className="text-fg-3">{MOD} N</span>
        </button>
        <span className="t-caption text-fg-3">{t('pal.hints')}</span>
      </div>

      {p.toast && (
        <div className="pointer-events-none absolute inset-x-0 -bottom-5 flex justify-center">
          <Toast icon={Check}>{p.toast}</Toast>
        </div>
      )}
    </div>
  )
}

/** Positions a caret right after the typed text using an invisible copy of it. */
function FakeCaret({ after }: { after: string }) {
  return (
    <span aria-hidden className="t-search pointer-events-none absolute inset-y-0 left-0 flex items-center whitespace-pre text-transparent">
      {after}
      <span className="ml-px inline-block h-[22px] w-[1.5px] animate-pulse bg-fg" />
    </span>
  )
}

function Row({
  index,
  snippet,
  folder,
  selected,
  onHover,
  onPick
}: {
  index: number
  snippet: Snippet
  folder?: Folder
  selected: boolean
  onHover: () => void
  onPick: () => void
}) {
  const t = useT()
  return (
    <div
      data-index={index}
      onMouseMove={selected ? undefined : onHover}
      onClick={onPick}
      className={cx('flex items-center gap-3.5 rounded-[22px] p-2 transition-colors duration-100', selected ? 'bg-raised pr-2 shadow-low' : 'pr-4')}
    >
      <SnippetTile kind={snippet.kind} color={folder?.color ?? null} />
      <div className="min-w-0 flex-1">
        <div className="t-body-m truncate font-medium text-fg">{displayTitle(snippet)}</div>
        <div className="t-caption truncate text-fg-3">
          {snippet.title ? displayContent(snippet) : (folder?.name ?? t(snippet.kind === 'link' ? 'kind.link' : 'kind.text'))}
        </div>
      </div>
      {selected ? (
        <div className="flex items-center gap-2.5">
          <span className="t-caption font-medium text-fg-2">{t('pal.paste')}</span>
          <IconButton icon={CornerDownLeft} variant="solid" label={t('pal.paste')} tabIndex={-1} />
        </div>
      ) : (
        index < 9 && <NumberBadge n={index + 1} />
      )}
    </div>
  )
}

function EmptyState({ empty, query, onSave, onOpen }: { empty: boolean; query: string; onSave?: () => void; onOpen?: () => void }) {
  const t = useT()
  if (!empty) {
    return <div className="t-body-m px-4 py-8 text-center text-fg-2">{t('pal.noMatch', { q: query })}</div>
  }
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-8 text-center">
      <div className="t-heading-s text-fg">{t('pal.emptyTitle')}</div>
      <div className="t-body-s max-w-[340px] text-fg-2">{t('pal.emptyBody')}</div>
      <div className="mt-1 flex gap-2">
        <button onClick={onSave} className="t-body-s inline-flex items-center gap-2 rounded-full bg-ink px-3.5 py-2 font-medium text-on-ink">
          <ClipboardPaste size={15} strokeWidth={1.75} /> {t('pal.saveClipboard')}
        </button>
        <button onClick={onOpen} className="t-body-s rounded-full border border-line bg-surface px-3.5 py-2 font-medium text-fg">
          {t('pal.open')}
        </button>
      </div>
    </div>
  )
}
