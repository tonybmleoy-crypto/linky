import type {
  Folder,
  FolderInput,
  FolderPatch,
  Library,
  Settings,
  SettingsPatch,
  Snippet,
  SnippetInput,
  SnippetPatch
} from './model'

export type PasteResult = 'pasted' | 'copied' | 'error'

export interface HotkeyCheck {
  ok: boolean
  reason?: 'taken' | 'invalid'
}

export interface UpdateState {
  status: 'idle' | 'checking' | 'latest' | 'available' | 'downloading' | 'ready' | 'error'
  current: string
  version?: string
  progress?: number
  error?: string
  /** Windows installs in place; macOS (unsigned) opens the download page. */
  canInstall?: boolean
}

export type WindowAction = 'minimize' | 'maximize' | 'close'
export type ResizeEdge = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

export interface PaletteShownEvent {
  /** Where the panel is anchored inside its window: below the caret or flipped above it. */
  anchor: 'top' | 'bottom'
}

export type ManagerRoute = 'library' | 'settings' | 'onboarding'

/** The single object exposed to renderers via contextBridge as `window.linky`. */
export interface LinkyApi {
  platform: string

  getLibrary(): Promise<Library>
  getSettings(): Promise<Settings>

  createSnippet(input: SnippetInput): Promise<Snippet>
  updateSnippet(id: string, patch: SnippetPatch): Promise<Snippet>
  deleteSnippet(id: string): Promise<void>
  snippetFromClipboard(): Promise<Snippet | null>
  pasteSnippet(id: string): Promise<PasteResult>

  createFolder(input: FolderInput): Promise<Folder>
  updateFolder(id: string, patch: FolderPatch): Promise<Folder>
  deleteFolder(id: string): Promise<void>

  updateSettings(patch: SettingsPatch): Promise<Settings>
  checkHotkey(accelerator: string): Promise<HotkeyCheck>
  /** Temporarily stop listening for the global hotkey (while recording a new one). */
  suspendHotkey(suspended: boolean): Promise<void>

  hidePalette(): Promise<void>
  openManager(route?: ManagerRoute): Promise<void>
  openExternal(url: string): Promise<void>

  /** macOS: whether Linky may send ⌘V to other apps (Accessibility). True on Windows. */
  hasPastePermission(): Promise<boolean>
  requestPastePermission(): Promise<void>

  getUpdate(): Promise<UpdateState>
  checkForUpdate(): Promise<UpdateState>
  installUpdate(): Promise<void>
  onUpdateChanged(cb: (state: UpdateState) => void): () => void

  windowControl(action: WindowAction): Promise<void>
  /** Starts resizing the manager window from an edge; `null` stops. */
  resizeWindow(edge: ResizeEdge | null): Promise<void>
  onWindowState(cb: (state: { maximized: boolean }) => void): () => void

  onLibraryChanged(cb: (library: Library) => void): () => void
  onSettingsChanged(cb: (settings: Settings) => void): () => void
  onPaletteShown(cb: (e: PaletteShownEvent) => void): () => void
  onNavigate(cb: (route: ManagerRoute) => void): () => void
}

export const IPC = {
  getLibrary: 'library:get',
  getSettings: 'settings:get',
  createSnippet: 'snippet:create',
  updateSnippet: 'snippet:update',
  deleteSnippet: 'snippet:delete',
  snippetFromClipboard: 'snippet:fromClipboard',
  pasteSnippet: 'snippet:paste',
  createFolder: 'folder:create',
  updateFolder: 'folder:update',
  deleteFolder: 'folder:delete',
  updateSettings: 'settings:update',
  checkHotkey: 'hotkey:check',
  suspendHotkey: 'hotkey:suspend',
  hidePalette: 'palette:hide',
  openManager: 'app:openManager',
  openExternal: 'app:openExternal',
  hasPastePermission: 'permission:get',
  requestPastePermission: 'permission:request',
  getUpdate: 'update:get',
  checkForUpdate: 'update:check',
  installUpdate: 'update:install',
  updateChanged: 'update:changed',
  windowControl: 'window:control',
  resizeWindow: 'window:resize',
  windowState: 'window:state',
  libraryChanged: 'library:changed',
  settingsChanged: 'settings:changed',
  paletteShown: 'palette:shown',
  navigate: 'manager:navigate'
} as const
