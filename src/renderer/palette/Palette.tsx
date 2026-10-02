import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PaletteShownEvent } from '@shared/api'
import type { Snippet } from '@shared/model'
import { searchSnippets } from '@shared/ranking'
import { useApp } from '../shared/store'
import { prettyHotkey } from '../shared/format'
import { useT } from '../shared/i18n'
import { modPressed } from '../shared/platform'
import { cx } from '../shared/ui'
import { PalettePanel } from './PalettePanel'

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
    } else if (modPressed(e) && e.code === 'KeyN') {
      e.preventDefault()
      void saveFromClipboard()
    } else if (/^[1-9]$/.test(e.key) && !query && !e.ctrlKey && !e.metaKey && !e.altKey) {
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
      <PalettePanel
        key={showKey}
        style={{ ['--from-y' as string]: anchor === 'bottom' ? '6px' : '-6px', animation: 'palette-in 140ms cubic-bezier(.2,.8,.2,1)' }}
        query={query}
        onQueryChange={setQuery}
        folders={folders}
        folderId={folderId}
        onFolder={setFolderId}
        results={results}
        selected={selected}
        onHover={setSelected}
        onPick={(s) => void paste(s)}
        hotkey={hotkey}
        toast={toast}
        empty={empty}
        onSaveClipboard={() => void saveFromClipboard()}
        onOpenManager={() => void window.linky.openManager('library')}
        inputRef={inputRef}
        listRef={listRef}
      />
    </div>
  )
}
