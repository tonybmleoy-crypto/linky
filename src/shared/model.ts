/*
 * Data model shared by main and renderers. Plain types and helpers only —
 * the zod schemas that validate these live in ./schema.ts (main process only),
 * so renderers don't ship a validation library they never use.
 */

export const FOLDER_COLORS = ['peach', 'mint', 'sky', 'lilac', 'rose'] as const
export type FolderColor = (typeof FOLDER_COLORS)[number]

export interface Snippet {
  id: string
  title: string
  content: string
  kind: 'link' | 'text'
  folderId: string | null
  pinned: boolean
  order: number
  useCount: number
  lastUsedAt: number | null
  createdAt: number
  updatedAt: number
}

export interface Folder {
  id: string
  name: string
  color: FolderColor
  order: number
}

export interface Library {
  version: 1
  snippets: Snippet[]
  folders: Folder[]
}

export interface Settings {
  version: 1
  hotkey: string
  theme: 'system' | 'light' | 'dark'
  language: 'system' | 'en' | 'ru'
  launchAtLogin: boolean
  palettePosition: 'cursor' | 'center'
  restoreClipboard: boolean
  pasteMode: 'paste' | 'copy'
  onboardingDone: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  version: 1,
  hotkey: 'Control+Alt+V',
  theme: 'system',
  language: 'system',
  launchAtLogin: false,
  palettePosition: 'cursor',
  restoreClipboard: true,
  pasteMode: 'paste',
  onboardingDone: false
}

// ---- Inputs coming from the renderer (validated in main by ./schema.ts) ----

export interface SnippetInput {
  title?: string
  content: string
  folderId?: string | null
  pinned?: boolean
}

export type SnippetPatch = Partial<Pick<Snippet, 'title' | 'content' | 'folderId' | 'pinned'>>

export interface FolderInput {
  name: string
  color?: FolderColor
}

export type FolderPatch = Partial<Pick<Folder, 'name' | 'color'>>

export type SettingsPatch = Partial<Omit<Settings, 'version'>>

/** A link is anything that looks like a URL or a bare domain with a path. */
export function detectKind(content: string): Snippet['kind'] {
  const s = content.trim()
  if (/\s/.test(s)) return 'text'
  if (/^(https?:\/\/|mailto:|tg:\/\/)/i.test(s)) return 'link'
  return /^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(s) ? 'link' : 'text'
}

/** What the UI shows under the title: URLs without protocol and "www." noise. */
export function displayContent(snippet: Pick<Snippet, 'content' | 'kind'>): string {
  if (snippet.kind !== 'link') return snippet.content.replace(/\s+/g, ' ')
  return snippet.content.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/$/, '')
}

export function displayTitle(snippet: Pick<Snippet, 'title' | 'content' | 'kind'>): string {
  return snippet.title.trim() || displayContent(snippet)
}
