import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Check, ClipboardPaste, CornerDownLeft, Plus, Search } from 'lucide-react'
import type { PaletteShownEvent } from '@shared/api'
import { displayContent, displayTitle, type Folder, type Snippet } from '@shared/model'
import { searchSnippets } from '@shared/ranking'
import { useApp } from '../shared/store'
import { prettyHotkey } from '../shared/format'
import { useT } from '../shared/i18n'
import { Chip, IconButton, Kbd, NumberBadge, SnippetTile, Toast, cx } from '../shared/ui'

const MAX_RESULTS = 50

export function Palette() {
  const { library, settings, init } = useApp()
  const t = useT()
  const [query, setQuery] = useState('')
  const [folderId, setFolderId] = useState<string | null>(null)
  const [selected, setSelected] = useState(0)
  const [anchor, setAnchor] = useState<PaletteShownEvent['anchor']>('top')
  const [showKey, setShowKey] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    void init()
    return window.linky.onPaletteShown((e) => {
      setQuery('')
      setFolderId(null)
      setSelected(0)
      setToast(null)
      setAnchor(e.anchor)
      setShowKey((k) => k + 1)
      requestAnimationFrame(() => inputRef.current?.focus())
    })
  }, [init])

  const folders = useMemo(() => [...(library?.folders ?? [])].sort((a, b) => a.order - b.order), [library])
  const folderById = useMemo(() => new Map(folders.map((f) => [f.id, f])), [folders])

  const results = useMemo(() => {
    const all = library?.snippets ?? []
    const scoped = folderId ? all.filter((s) => s.folderId === folderId) : all
    return searchSnippets(scoped, query).slice(0, MAX_RESULTS)
  }, [library, folderId, query])

  useEffect(() => setSelected(0), [query, folderId])

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${selected}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [selected])

  const paste = useCallback(async (s: Snippet | undefined) => {
    if (!s) return
    const result = await window.linky.pasteSnippet(s.id)
    if (result === 'error') setToast(t('pal.pasteError'))
  }, [t])

  const saveFromClipboard = useCallback(async () => {
    const created = await window.linky.snippetFromClipboard()
    setToast(created ? t('pal.saved') : t('pal.clipboardEmpty'))
    setTimeout(() => setToast(null), 1600)
  }, [t])

  const cycleFolder = useCallback(
    (dir: 1 | -1) => {
      const ids: Array<string | null> = [null, ...folders.map((f) => f.id)]
      const i = ids.indexOf(folderId)
      setFolderId(ids[(i + dir + ids.length) % ids.length])
    },
    [folders, folderId]
  )

  const onKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Escape') {
      e.preventDefault()
      if (query) setQuery('')
      else void window.linky.hidePalette()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelected((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelected((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      void paste(results[selected])
    } else if (e.key === 'Tab') {
      e.preventDefault()
      cycleFolder(e.shiftKey ? -1 : 1)
    } else if (e.ctrlKey && e.code === 'KeyN') {
      e.preventDefault()
      void saveFromClipboard()
    } else if (/^[1-9]$/.test(e.key) && !query && !e.ctrlKey && !e.altKey) {
      // Quick keys work while the search box is empty.
      e.preventDefault()
      void paste(results[Number(e.key) - 1])
    }
  }

  const hotkey = settings ? prettyHotkey(settings.hotkey).join(' ') : ''
  const empty = (library?.snippets.length ?? 0) === 0

  return (
    <div
      className={cx('flex h-screen w-screen p-7', anchor === 'bottom' ? 'items-end' : 'items-start')}
      onKeyDown={onKeyDown}
      onMouseDown={(e) => {
        // Clicking the transparent margin closes the palette.
        if (e.target === e.currentTarget) void window.linky.hidePalette()
      }}
    >
      <div
        key={showKey}
        style={{ ['--from-y' as string]: anchor === 'bottom' ? '6px' : '-6px', animation: 'palette-in 140ms cubic-bezier(.2,.8,.2,1)' }}
        className="relative flex max-h-full w-[600px] flex-col gap-1.5 rounded-[32px] border border-glass-stroke p-2.5 shadow-glass"
      >
        <div className="absolute inset-0 -z-10 rounded-[32px] bg-[var(--palette-fill)] backdrop-blur-2xl" />

        {/* Search */}
        <label className="flex items-center gap-3 px-4 pt-3 pb-2">
          <Search size={20} strokeWidth={1.75} className="shrink-0 text-fg-2" />
          <input
            ref={inputRef}
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('pal.search')}
            spellCheck={false}
            className="t-search min-w-0 flex-1 bg-transparent text-fg outline-none placeholder:text-fg-3"
          />
          {hotkey && <Kbd>{hotkey}</Kbd>}
        </label>

        {/* Folder chips */}
        {folders.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto px-2.5 pb-1.5 [scrollbar-width:none]">
            <Chip selected={folderId === null} onClick={() => setFolderId(null)} tabIndex={-1}>
              {t('pal.all')}
            </Chip>
            {folders.map((f) => (
              <Chip key={f.id} selected={folderId === f.id} onClick={() => setFolderId(f.id)} tabIndex={-1}>
                {f.name}
              </Chip>
            ))}
          </div>
        )}

        {/* Results */}
        <div ref={listRef} className="-mx-0.5 flex min-h-0 flex-col gap-0.5 overflow-y-auto px-0.5">
          {results.map((s, i) => (
            <Row
              key={s.id}
              index={i}
              snippet={s}
              folder={s.folderId ? folderById.get(s.folderId) : undefined}
              selected={i === selected}
              onHover={() => setSelected(i)}
              onPick={() => void paste(s)}
            />
          ))}
          {results.length === 0 && (
            <EmptyState
              empty={empty}
              query={query}
              onSave={() => void saveFromClipboard()}
              onOpen={() => void window.linky.openManager('library')}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-3.5 pt-2.5 pb-1.5">
          <button
            onClick={() => void saveFromClipboard()}
            tabIndex={-1}
            className="t-caption flex items-center gap-2 rounded-full font-medium text-fg-2 hover:text-fg"
          >
            <Plus size={14} strokeWidth={1.75} /> {t('pal.saveClipboard')}
            <span className="text-fg-3">Ctrl N</span>
          </button>
          <span className="t-caption text-fg-3">{t('pal.hints')}</span>
        </div>

        {toast && (
          <div className="pointer-events-none absolute inset-x-0 -bottom-5 flex justify-center">
            <Toast icon={Check}>{toast}</Toast>
          </div>
        )}
      </div>
    </div>
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
      className={cx(
        'flex items-center gap-3.5 rounded-[22px] p-2',
        selected ? 'bg-raised pr-2 shadow-low' : 'pr-4'
      )}
    >
      <SnippetTile kind={snippet.kind} color={folder?.color ?? null} />
      <div className="min-w-0 flex-1">
        <div className="t-body-m truncate font-medium text-fg">{displayTitle(snippet)}</div>
        <div className="t-caption truncate text-fg-3">{snippet.title ? displayContent(snippet) : folder?.name ?? t(snippet.kind === 'link' ? 'kind.link' : 'kind.text')}</div>
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

function EmptyState({ empty, query, onSave, onOpen }: { empty: boolean; query: string; onSave: () => void; onOpen: () => void }) {
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
