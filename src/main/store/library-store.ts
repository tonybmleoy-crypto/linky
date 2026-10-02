import { EventEmitter } from 'node:events'
import { nanoid } from 'nanoid'
import {
  FOLDER_COLORS,
  detectKind,
  type Folder,
  type FolderInput,
  type FolderPatch,
  type Library,
  type Snippet,
  type SnippetInput,
  type SnippetPatch
} from '@shared/model'
import type { Translate } from '@shared/i18n'
import { LibrarySchema } from '@shared/schema'
import { JsonFile } from './json-file'

export class LibraryStore extends EventEmitter<{ changed: [Library] }> {
  private data: Library
  private readonly file: JsonFile<Library>

  constructor(path: string, seed: () => Library = emptyLibrary) {
    super()
    this.file = new JsonFile(path, LibrarySchema)
    const existing = this.file.read()
    this.data = existing ?? seed()
    if (!existing) this.file.save(this.data)
  }

  get(): Library {
    return this.data
  }

  getSnippet(id: string): Snippet | undefined {
    return this.data.snippets.find((s) => s.id === id)
  }

  createSnippet(input: SnippetInput): Snippet {
    const now = Date.now()
    const content = input.content.trim()
    const snippet: Snippet = {
      id: nanoid(10),
      title: (input.title ?? '').trim(),
      content,
      kind: detectKind(content),
      folderId: this.validFolder(input.folderId ?? null),
      pinned: input.pinned ?? false,
      order: this.nextOrder(),
      useCount: 0,
      lastUsedAt: null,
      createdAt: now,
      updatedAt: now
    }
    this.commit({ ...this.data, snippets: [...this.data.snippets, snippet] })
    return snippet
  }

  updateSnippet(id: string, patch: SnippetPatch): Snippet {
    const current = this.require(id)
    const next: Snippet = {
      ...current,
      ...patch,
      title: patch.title !== undefined ? patch.title.trim() : current.title,
      folderId: patch.folderId !== undefined ? this.validFolder(patch.folderId) : current.folderId,
      updatedAt: Date.now()
    }
    if (patch.content !== undefined) {
      next.content = patch.content.trim()
      next.kind = detectKind(next.content)
    }
    if (patch.pinned && !current.pinned) next.order = this.nextOrder()
    this.replaceSnippet(next)
    return next
  }

  deleteSnippet(id: string): void {
    this.commit({ ...this.data, snippets: this.data.snippets.filter((s) => s.id !== id) })
  }

  recordUse(id: string): void {
    const s = this.getSnippet(id)
    if (!s) return
    this.replaceSnippet({ ...s, useCount: s.useCount + 1, lastUsedAt: Date.now() })
  }

  createFolder(input: FolderInput): Folder {
    const used = new Set(this.data.folders.map((f) => f.color))
    const folder: Folder = {
      id: nanoid(10),
      name: input.name.trim(),
      color: input.color ?? FOLDER_COLORS.find((c) => !used.has(c)) ?? FOLDER_COLORS[this.data.folders.length % FOLDER_COLORS.length],
      order: this.data.folders.length
    }
    this.commit({ ...this.data, folders: [...this.data.folders, folder] })
    return folder
  }

  updateFolder(id: string, patch: FolderPatch): Folder {
    const current = this.data.folders.find((f) => f.id === id)
    if (!current) throw new Error(`Folder ${id} not found`)
    const next = { ...current, ...patch }
    this.commit({ ...this.data, folders: this.data.folders.map((f) => (f.id === id ? next : f)) })
    return next
  }

  /** Deleting a folder keeps its snippets — they move to "no folder". */
  deleteFolder(id: string): void {
    this.commit({
      ...this.data,
      folders: this.data.folders.filter((f) => f.id !== id),
      snippets: this.data.snippets.map((s) => (s.folderId === id ? { ...s, folderId: null } : s))
    })
  }

  flush(): void {
    this.file.flush()
  }

  private require(id: string): Snippet {
    const s = this.getSnippet(id)
    if (!s) throw new Error(`Snippet ${id} not found`)
    return s
  }

  private validFolder(folderId: string | null): string | null {
    return folderId && this.data.folders.some((f) => f.id === folderId) ? folderId : null
  }

  private nextOrder(): number {
    return this.data.snippets.reduce((max, s) => Math.max(max, s.order), -1) + 1
  }

  private replaceSnippet(next: Snippet): void {
    this.commit({ ...this.data, snippets: this.data.snippets.map((s) => (s.id === next.id ? next : s)) })
  }

  private commit(next: Library): void {
    this.data = next
    this.file.save(next)
    this.emit('changed', next)
  }
}

export function emptyLibrary(): Library {
  return { version: 1, snippets: [], folders: [] }
}

/** First-run content so the palette isn't empty the first time it opens. */
export function sampleLibrary(t: Translate): Library {
  const now = Date.now()
  const work: Folder = { id: nanoid(10), name: t('sample.work'), color: 'peach', order: 0 }
  const replies: Folder = { id: nanoid(10), name: t('sample.replies'), color: 'lilac', order: 1 }
  const make = (title: string, content: string, folderId: string | null, order: number, pinned = false): Snippet => ({
    id: nanoid(10),
    title,
    content,
    kind: detectKind(content),
    folderId,
    pinned,
    order,
    useCount: 0,
    lastUsedAt: null,
    createdAt: now - order,
    updatedAt: now - order
  })
  return {
    version: 1,
    folders: [work, replies],
    snippets: [
      make(t('sample.github'), 'https://github.com/linky-app/linky', work.id, 0, true),
      make(t('sample.reply'), t('sample.replyText'), replies.id, 1),
      make(t('sample.call'), 'https://cal.com/your-name/30min', work.id, 2)
    ]
  }
}
