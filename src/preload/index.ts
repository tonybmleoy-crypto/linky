import { contextBridge, ipcRenderer } from 'electron'
import { IPC, type LinkyApi } from '@shared/api'

// The LinkyApi interface is the typed contract; main validates every call.
const invoke = (channel: string, ...args: unknown[]): Promise<never> => ipcRenderer.invoke(channel, ...args) as Promise<never>

const listen =
  <T>(channel: string) =>
  (cb: (payload: T) => void): (() => void) => {
    const handler = (_e: Electron.IpcRendererEvent, payload: T): void => cb(payload)
    ipcRenderer.on(channel, handler)
    return () => ipcRenderer.removeListener(channel, handler)
  }

const api: LinkyApi = {
  platform: process.platform,
  getLibrary: () => invoke(IPC.getLibrary),
  getSettings: () => invoke(IPC.getSettings),
  createSnippet: (input) => invoke(IPC.createSnippet, input),
  updateSnippet: (id, patch) => invoke(IPC.updateSnippet, id, patch),
  deleteSnippet: (id) => invoke(IPC.deleteSnippet, id),
  snippetFromClipboard: () => invoke(IPC.snippetFromClipboard),
  pasteSnippet: (id) => invoke(IPC.pasteSnippet, id),
  createFolder: (input) => invoke(IPC.createFolder, input),
  updateFolder: (id, patch) => invoke(IPC.updateFolder, id, patch),
  deleteFolder: (id) => invoke(IPC.deleteFolder, id),
  updateSettings: (patch) => invoke(IPC.updateSettings, patch),
  checkHotkey: (acc) => invoke(IPC.checkHotkey, acc),
  suspendHotkey: (on) => invoke(IPC.suspendHotkey, on),
  hidePalette: () => invoke(IPC.hidePalette),
  openManager: (route) => invoke(IPC.openManager, route),
  openExternal: (url) => invoke(IPC.openExternal, url),
  windowControl: (action) => invoke(IPC.windowControl, action),
  resizeWindow: (edge) => invoke(IPC.resizeWindow, edge),
  onWindowState: listen(IPC.windowState),
  onLibraryChanged: listen(IPC.libraryChanged),
  onSettingsChanged: listen(IPC.settingsChanged),
  onPaletteShown: listen(IPC.paletteShown),
  onNavigate: listen(IPC.navigate)
}

contextBridge.exposeInMainWorld('linky', api)
