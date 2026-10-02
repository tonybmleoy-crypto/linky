import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Pin, Search } from 'lucide-react'
import { displayContent, displayTitle, type Folder, type Snippet } from '@shared/model'
import { searchSnippets, sortForPalette } from '@shared/ranking'
import { useApp } from '../shared/store'
import { relativeTime } from '../shared/format'
import { useLang, useT } from '../shared/i18n'
import type { MessageKey } from '@shared/i18n'
import { Button, FolderPill, Kbd, SnippetTile, cx } from '../shared/ui'
import { Inspector } from './Inspector'
import type { LibraryFilter } from './Sidebar'

type Sort = 'used' | 'recent' | 'name'
const SORTS: Record<Sort, MessageKey> = { used: 'sort.used', recent: 'sort.recent', name: 'sort.name' }

export function Library({ filter }: { filter: LibraryFilter }) {
  const library = useApp((s) => s.library)!
  const t = useT()
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<Sort>('used')
  const [selected, setSelected] = useState<string | 'new' | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const folders = library.folders
  const folderById = useMemo(() => new Map(folders.map((f) => [f.id, f])), [folders])

  useEffect(() => {
    const onNew = (): void => setSelected('new')
    window.addEventListener('linky:new-snippet', onNew)
    const onKey = (e: KeyboardEvent): void => {
      if (e.ctrlKey && e.code === 'KeyN') {
        e.preventDefault()
        setSelected('new')
      }
      if (e.ctrlKey && e.code === 'KeyF') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('linky:new-snippet', onNew)
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  const title =
    filter.type === 'folder'
      ? (folderById.get(filter.id)?.name ?? t('col.folder'))
      : t(({ all: 'nav.all', pinned: 'nav.pinned', recent: 'nav.recent' } as const)[filter.type])

  const rows = useMemo(() => {
    let list = library.snippets
    if (filter.type === 'pinned') list = list.filter((s) => s.pinned)
    if (filter.type === 'folder') list = list.filter((s) => s.folderId === filter.id)
    if (filter.type === 'recent') list = list.filter((s) => s.lastUsedAt != null)
    if (query.trim()) return searchSnippets(list, query)
    if (filter.type === 'recent') return [...list].sort((a, b) => (b.lastUsedAt ?? 0) - (a.lastUsedAt ?? 0))
    if (sort === 'name') return [...list].sort((a, b) => displayTitle(a).localeCompare(displayTitle(b)))
    if (sort === 'recent') return [...list].sort((a, b) => b.createdAt - a.createdAt)
    return sortForPalette(list)
  }, [library, filter, query, sort])

  // Quick keys follow the palette's default order.
  const quickKeys = useMemo(() => new Map(sortForPalette(library.snippets).slice(0, 9).map((s, i) => [s.id, i + 1])), [library])

  const current = selected && selected !== 'new' ? library.snippets.find((s) => s.id === selected) : undefined
  useEffect(() => {
    if (selected && selected !== 'new' && !current) setSelected(null)
  }, [selected, current])

  const folderCount = folders.length
  const subtitle =
    t('lib.items', { count: rows.length }) + (filter.type === 'all' ? ` · ${t('lib.folders', { count: folderCount })}` : '')

  return (
    <>
      <section className="flex min-w-0 flex-1 flex-col gap-4 pt-6 pr-5 pl-7">
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="t-heading-l truncate">{title}</h1>
            <p className="t-caption mt-1 text-fg-3">{subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex w-[220px] items-center gap-2 rounded-full bg-sunken py-1.5 pr-1.5 pl-3.5">
              <Search size={15} strokeWidth={1.75} className="text-fg-3" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Escape' && setQuery('')}
                placeholder={t('lib.search')}
                className="t-body-s min-w-0 flex-1 bg-transparent text-fg outline-none placeholder:text-fg-3"
              />
              <Kbd>Ctrl F</Kbd>
            </label>
            {filter.type !== 'recent' && (
              <label className="t-body-s relative inline-flex items-center gap-2 rounded-full border border-line bg-surface py-2 pr-3 pl-3.5 font-medium hover:bg-hover">
                {t(SORTS[sort])}
                <ChevronDown size={15} strokeWidth={1.75} />
                <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="absolute inset-0 opacity-0" aria-label={t('lib.sort')}>
                  {Object.entries(SORTS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {t(v)}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        </div>

        {rows.length > 0 && (
          <div className="t-caption flex gap-3.5 pr-[54px] pl-[66px] font-medium text-fg-3">
            <span className="flex-1">{t('col.name')}</span>
            <span className="w-24">{t('col.folder')}</span>
            <span className="w-12">{t('col.used')}</span>
            <span className="w-28">{t('col.last')}</span>
          </div>
        )}

        <div className="-mx-2 flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-2 pb-4">
          {rows.map((s) => (
            <LibraryRow
              key={s.id}
              snippet={s}
              folder={s.folderId ? folderById.get(s.folderId) : undefined}
              selected={s.id === selected}
              onClick={() => setSelected(s.id)}
            />
          ))}
          {rows.length === 0 && <EmptyList filter={filter} query={query} onNew={() => setSelected('new')} />}
        </div>
      </section>

      {selected && (
        <Inspector
          key={selected}
          snippet={current}
          defaultFolderId={filter.type === 'folder' ? filter.id : null}
          quickKey={current ? quickKeys.get(current.id) : undefined}
          onCreated={(id) => setSelected(id)}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}

function LibraryRow({ snippet, folder, selected, onClick }: { snippet: Snippet; folder?: Folder; selected: boolean; onClick: () => void }) {
  const t = useT()
  const lang = useLang()
  return (
    <div
      onClick={onClick}
      className={cx('flex items-center gap-3.5 rounded-2xl px-3 py-2.5 transition-colors', selected ? 'bg-raised shadow-low' : 'hover:bg-hover')}
    >
      <SnippetTile kind={snippet.kind} color={folder?.color ?? null} />
      <div className="min-w-0 flex-1">
        <div className="t-body-m flex items-center gap-1.5 font-medium text-fg">
          <span className="truncate">{displayTitle(snippet)}</span>
          {snippet.pinned && <Pin size={12} strokeWidth={1.75} className="shrink-0 text-fg-3" />}
        </div>
        <div className="t-caption truncate text-fg-3">{snippet.title ? displayContent(snippet) : t(snippet.kind === 'link' ? 'kind.link' : 'kind.text')}</div>
      </div>
      <span className="w-24 min-w-0">{folder ? <FolderPill name={folder.name} color={folder.color} /> : <span className="t-body-s text-fg-3">—</span>}</span>
      <span className="t-body-s w-12 text-fg-2">{snippet.useCount}</span>
      <span className="t-body-s w-28 truncate text-fg-2">{relativeTime(snippet.lastUsedAt, t, lang)}</span>
      <span className="w-7" />
    </div>
  )
}

function EmptyList({ filter, query, onNew }: { filter: LibraryFilter; query: string; onNew: () => void }) {
  const t = useT()
  const text = query
    ? t('empty.query', { q: query })
    : filter.type === 'recent'
      ? t('empty.recent')
      : filter.type === 'pinned'
        ? t('empty.pinned')
        : t('empty.all')
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 pb-16 text-center">
      <p className="t-body-m max-w-xs text-fg-2">{text}</p>
      {!query && filter.type !== 'recent' && filter.type !== 'pinned' && (
        <Button size="s" onClick={onNew}>
          {t('newSnippet')}
        </Button>
      )}
    </div>
  )
}
