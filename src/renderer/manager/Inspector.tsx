import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, ExternalLink, Trash, X } from 'lucide-react'
import { detectKind, type Snippet } from '@shared/model'
import { useApp } from '../shared/store'
import { elapsedShort, relativeTime, shortDate } from '../shared/format'
import { useLang, useT } from '../shared/i18n'
import { Button, FieldLabel, IconButton, Kbd, SnippetTile, Switch, folderDot, inputClass } from '../shared/ui'

/** Right-hand panel: edits an existing snippet (autosave) or creates a new one. */
export function Inspector({
  snippet,
  defaultFolderId,
  quickKey,
  onCreated,
  onClose
}: {
  snippet?: Snippet
  defaultFolderId: string | null
  quickKey?: number
  onCreated: (id: string) => void
  onClose: () => void
}) {
  const folders = useApp((s) => s.library!.folders)
  const t = useT()
  const lang = useLang()
  const isNew = !snippet
  const [title, setTitle] = useState(snippet?.title ?? '')
  const [content, setContent] = useState(snippet?.content ?? '')
  const [folderId, setFolderId] = useState<string | null>(snippet?.folderId ?? defaultFolderId)
  const [pinned, setPinned] = useState(snippet?.pinned ?? false)
  const [saved, setSaved] = useState(true)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const contentRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isNew) contentRef.current?.focus()
  }, [isNew])

  // Autosave text edits for existing snippets.
  useEffect(() => {
    if (isNew || !snippet) return
    if (title === snippet.title && content === snippet.content) {
      setSaved(true)
      return
    }
    if (!content.trim()) return
    setSaved(false)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      await window.linky.updateSnippet(snippet.id, { title, content })
      setSaved(true)
    }, 450)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [title, content, isNew, snippet])

  const patchNow = async (patch: { folderId?: string | null; pinned?: boolean }): Promise<void> => {
    if (patch.folderId !== undefined) setFolderId(patch.folderId)
    if (patch.pinned !== undefined) setPinned(patch.pinned)
    if (snippet) await window.linky.updateSnippet(snippet.id, patch)
  }

  const create = async (): Promise<void> => {
    if (!content.trim()) return
    const s = await window.linky.createSnippet({ title, content, folderId, pinned })
    onCreated(s.id)
  }

  const remove = async (): Promise<void> => {
    if (!snippet) return
    if (confirm(t('ins.confirmDelete', { name: snippet.title || snippet.content.slice(0, 40) }))) {
      await window.linky.deleteSnippet(snippet.id)
      onClose()
    }
  }

  const kind = detectKind(content || 'x')
  const folder = folders.find((f) => f.id === folderId)
  const link = kind === 'link' ? (/^[a-z]+:/i.test(content.trim()) ? content.trim() : `https://${content.trim()}`) : null

  return (
    <aside
      className="flex w-[340px] shrink-0 flex-col gap-4 overflow-y-auto bg-sunken px-[22px] pt-6 pb-5"
      onKeyDown={(e) => {
        if (isNew && e.ctrlKey && e.key === 'Enter') void create()
        if (e.key === 'Escape') onClose()
      }}
    >
      <div className="flex items-center gap-3.5">
        <SnippetTile kind={kind} color={folder?.color ?? null} size="l" />
        <div className="min-w-0 flex-1">
          <div className="t-heading-m truncate">{isNew ? t('newSnippet') : title || t('ins.untitled')}</div>
          <div className="t-caption text-fg-3">
            {isNew ? t('ins.newHint') : t('ins.edited', { time: relativeTime(snippet!.updatedAt, t, lang).toLowerCase() })}
          </div>
        </div>
        <IconButton icon={X} variant="ghost" size="s" label={t('ins.close')} onClick={onClose} />
      </div>

      <label>
        <FieldLabel>{t('ins.title')}</FieldLabel>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('ins.titlePlaceholder')} maxLength={200} className={inputClass} />
      </label>

      <label>
        <FieldLabel>{t('ins.content')}</FieldLabel>
        <div className="relative">
          <textarea
            ref={contentRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="https://…"
            rows={3}
            maxLength={20000}
            className={`${inputClass} resize-none pr-10`}
          />
          {link && (
            <span className="absolute top-2 right-2">
              <IconButton icon={ExternalLink} variant="ghost" size="s" label={t('ins.openLink')} onClick={() => void window.linky.openExternal(link)} />
            </span>
          )}
        </div>
        {!content.trim() && !isNew && <span className="t-caption mt-1 block text-danger">{t('ins.emptyError')}</span>}
      </label>

      <label>
        <FieldLabel>{t('ins.folder')}</FieldLabel>
        <div className={`${inputClass} relative flex items-center gap-2.5`}>
          <span className="size-2 rounded-full" style={{ background: folder ? folderDot[folder.color] : 'var(--border-subtle)' }} />
          <span className="flex-1">{folder?.name ?? t('ins.noFolder')}</span>
          <ChevronDown size={15} strokeWidth={1.75} className="text-fg-3" />
          <select
            value={folderId ?? ''}
            onChange={(e) => void patchNow({ folderId: e.target.value || null })}
            className="absolute inset-0 opacity-0"
            aria-label={t('ins.folder')}
          >
            <option value="">{t('ins.noFolder')}</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
      </label>

      <div className="rounded-xl bg-surface">
        <div className="flex items-center gap-4 px-4 py-3">
          <div className="flex-1">
            <div className="t-body-m font-medium">{t('ins.pin')}</div>
            <div className="t-caption text-fg-3">{t('ins.pinHint')}</div>
          </div>
          <Switch checked={pinned} onChange={(v) => void patchNow({ pinned: v })} label={t('ins.pin')} />
        </div>
        {!isNew && (
          <div className="flex items-center gap-4 px-4 py-3">
            <div className="flex-1">
              <div className="t-body-m font-medium">{t('ins.quickKey')}</div>
              <div className="t-caption text-fg-3">{quickKey ? t('ins.quickKeyHint', { n: quickKey }) : t('ins.quickKeyNone')}</div>
            </div>
            {quickKey && <Kbd>{quickKey}</Kbd>}
          </div>
        )}
      </div>

      {!isNew && (
        <div className="flex gap-7 pl-1">
          <Stat value={String(snippet!.useCount)} label={t('ins.pastes')} />
          <Stat value={snippet!.lastUsedAt ? elapsedShort(snippet!.lastUsedAt, t) : '—'} label={t('ins.lastUsed')} />
          <Stat value={shortDate(snippet!.createdAt, lang)} label={t('ins.created')} />
        </div>
      )}

      <div className="flex-1" />

      {isNew ? (
        <div className="flex items-center justify-between">
          <span className="t-caption text-fg-3">{t('ins.saveHint')}</span>
          <Button onClick={() => void create()} disabled={!content.trim()}>
            {t('ins.save')}
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <Button variant="danger" size="s" icon={Trash} onClick={() => void remove()}>
            {t('ins.delete')}
          </Button>
          <span className="t-caption flex items-center gap-1.5 font-medium text-success">
            {saved ? (
              <>
                <Check size={14} strokeWidth={2} /> {t('ins.saved')}
              </>
            ) : (
              <span className="text-fg-3">{t('ins.saving')}</span>
            )}
          </span>
        </div>
      )}
    </aside>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="t-stat">{value}</div>
      <div className="t-caption text-fg-3">{label}</div>
    </div>
  )
}
