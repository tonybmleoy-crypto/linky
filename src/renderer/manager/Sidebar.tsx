import { useRef, useState } from 'react'
import { Clock, Folder as FolderIcon, Layers, Pin, Plus, SlidersHorizontal, X, type LucideIcon } from 'lucide-react'
import type { ManagerRoute } from '@shared/api'
import { FOLDER_COLORS, type Folder } from '@shared/model'
import { useApp } from '../shared/store'
import { prettyHotkey } from '../shared/format'
import { useT } from '../shared/i18n'
import { Button, cx, folderDot } from '../shared/ui'
import { UpdateBanner } from './UpdateBanner'

export type LibraryFilter = { type: 'all' } | { type: 'pinned' } | { type: 'recent' } | { type: 'folder'; id: string }

export function Sidebar({
  route,
  filter,
  onFilter,
  onSettings
}: {
  route: ManagerRoute
  filter: LibraryFilter
  onFilter: (f: LibraryFilter) => void
  onSettings: () => void
}) {
  const { library, settings } = useApp()
  const t = useT()
  const [adding, setAdding] = useState(false)
  const snippets = library!.snippets
  const folders = [...library!.folders].sort((a, b) => a.order - b.order)
  const inLibrary = route === 'library'
  const is = (f: LibraryFilter): boolean =>
    inLibrary && f.type === filter.type && (f.type !== 'folder' || (filter.type === 'folder' && f.id === filter.id))

  return (
    <aside className="flex w-[236px] shrink-0 flex-col gap-0.5 px-1.5 pt-2 pb-1.5">
      <Button
        icon={Plus}
        onClick={() => {
          onFilter(filter.type === 'recent' ? { type: 'all' } : filter)
          window.dispatchEvent(new CustomEvent('linky:new-snippet'))
        }}
        className="mb-3.5 w-full"
      >
        {t('newSnippet')}
      </Button>

      <NavItem icon={Layers} label={t('nav.all')} count={snippets.length} selected={is({ type: 'all' })} onClick={() => onFilter({ type: 'all' })} />
      <NavItem icon={Pin} label={t('nav.pinned')} count={snippets.filter((s) => s.pinned).length} selected={is({ type: 'pinned' })} onClick={() => onFilter({ type: 'pinned' })} />
      <NavItem icon={Clock} label={t('nav.recent')} selected={is({ type: 'recent' })} onClick={() => onFilter({ type: 'recent' })} />

      <div className="mt-4 flex items-center justify-between pr-2.5 pb-1.5 pl-3.5">
        <span className="t-caption font-medium text-fg-3">{t('nav.folders')}</span>
        <button onClick={() => setAdding(true)} className="rounded-full p-1 text-fg-3 hover:bg-glass-tint hover:text-fg" aria-label={t('nav.newFolder')} title={t('nav.newFolder')}>
          <Plus size={14} strokeWidth={1.75} />
        </button>
      </div>

      <div className="flex min-h-0 flex-col gap-0.5 overflow-y-auto">
        {folders.map((f) => (
          <FolderItem
            key={f.id}
            folder={f}
            count={snippets.filter((s) => s.folderId === f.id).length}
            selected={is({ type: 'folder', id: f.id })}
            onClick={() => onFilter({ type: 'folder', id: f.id })}
            onDeleted={() => is({ type: 'folder', id: f.id }) && onFilter({ type: 'all' })}
          />
        ))}
        {adding && <NewFolderInput onDone={() => setAdding(false)} />}
        {folders.length === 0 && !adding && (
          <button onClick={() => setAdding(true)} className="t-body-s rounded-full px-3.5 py-2 text-left text-fg-3 hover:text-fg-2">
            {t('nav.foldersEmpty')}
          </button>
        )}
      </div>

      <div className="flex-1" />

      <UpdateBanner />
      <div
        className="mb-1.5 flex flex-col gap-2.5 rounded-2xl border p-4"
        style={{ background: 'var(--banner-bg)', borderColor: 'var(--banner-border)', color: 'var(--banner-fg)' }}
      >
        <span className="t-heading-s">{t('tip.title')}</span>
        <span className="t-caption opacity-60">{t('tip.body')}</span>
        <span className="flex gap-1">
          {prettyHotkey(settings!.hotkey).map((k) => (
            <span key={k} className="t-kbd rounded-full px-2 py-0.5" style={{ background: 'var(--banner-key)' }}>
              {k}
            </span>
          ))}
        </span>
      </div>
      <NavItem icon={SlidersHorizontal} label={t('nav.settings')} selected={route === 'settings'} onClick={onSettings} />
    </aside>
  )
}

function NavItem({ icon: Icon, label, count, selected, onClick }: { icon: LucideIcon; label: string; count?: number; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cx(
        't-body-m flex w-full items-center gap-2.5 rounded-full px-3.5 py-2.5 text-left font-medium transition-colors',
        selected ? 'bg-raised text-fg shadow-low' : 'text-fg-2 hover:bg-glass-tint hover:text-fg'
      )}
    >
      <Icon size={16} strokeWidth={1.75} />
      <span className="flex-1 truncate">{label}</span>
      {count !== undefined && <span className="t-caption font-medium text-fg-3">{count}</span>}
    </button>
  )
}

function FolderItem({ folder, count, selected, onClick, onDeleted }: { folder: Folder; count: number; selected: boolean; onClick: () => void; onDeleted: () => void }) {
  const [renaming, setRenaming] = useState(false)
  const t = useT()
  const nextColor = FOLDER_COLORS[(FOLDER_COLORS.indexOf(folder.color) + 1) % FOLDER_COLORS.length]

  if (renaming) {
    return (
      <FolderNameInput
        initial={folder.name}
        onSubmit={async (name) => {
          if (name && name !== folder.name) await window.linky.updateFolder(folder.id, { name })
          setRenaming(false)
        }}
      />
    )
  }
  return (
    <div
      onClick={onClick}
      onDoubleClick={() => setRenaming(true)}
      title={t('nav.renameHint')}
      className={cx(
        't-body-m group flex items-center gap-2.5 rounded-full px-3.5 py-2.5 font-medium transition-colors',
        selected ? 'bg-raised text-fg shadow-low' : 'text-fg-2 hover:bg-glass-tint hover:text-fg'
      )}
    >
      <button
        onClick={(e) => {
          e.stopPropagation()
          void window.linky.updateFolder(folder.id, { color: nextColor })
        }}
        title={t('nav.changeColor')}
        style={{ color: folderDot[folder.color] }}
      >
        <FolderIcon size={16} strokeWidth={1.75} />
      </button>
      <span className="flex-1 truncate">{folder.name}</span>
      <span className="t-caption font-medium text-fg-3 group-hover:hidden">{count}</span>
      <button
        onClick={async (e) => {
          e.stopPropagation()
          const msg = count ? t('nav.confirmDeleteFolderWith', { name: folder.name, count }) : t('nav.confirmDeleteFolder', { name: folder.name })
          if (confirm(msg)) {
            await window.linky.deleteFolder(folder.id)
            onDeleted()
          }
        }}
        className="hidden rounded-full text-fg-3 group-hover:block hover:text-danger"
        aria-label={t('nav.deleteFolder', { name: folder.name })}
      >
        <X size={14} strokeWidth={1.75} />
      </button>
    </div>
  )
}

function NewFolderInput({ onDone }: { onDone: () => void }) {
  return (
    <FolderNameInput
      initial=""
      onSubmit={async (name) => {
        if (name) await window.linky.createFolder({ name })
        onDone()
      }}
    />
  )
}

function FolderNameInput({ initial, onSubmit }: { initial: string; onSubmit: (name: string) => void }) {
  const [value, setValue] = useState(initial)
  const t = useT()
  // Enter submits and unmounts the input, which also fires blur — submit only once.
  const done = useRef(false)
  const submit = (name: string): void => {
    if (done.current) return
    done.current = true
    onSubmit(name)
  }
  return (
    <input
      autoFocus
      value={value}
      placeholder={t('nav.folderPlaceholder')}
      maxLength={60}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => submit(value.trim())}
      onKeyDown={(e) => {
        if (e.key === 'Enter') submit(value.trim())
        if (e.key === 'Escape') submit('')
      }}
      className="t-body-m mx-0.5 rounded-full border border-line-strong bg-surface px-3.5 py-2 text-fg shadow-ring outline-none"
    />
  )
}
