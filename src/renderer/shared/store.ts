import { create } from 'zustand'
import type { Library, Settings } from '@shared/model'

interface AppState {
  library: Library | null
  settings: Settings | null
  init(): Promise<void>
}

/** Mirror of the main-process state. Main is the source of truth; we only listen. */
export const useApp = create<AppState>((set, get) => ({
  library: null,
  settings: null,
  async init() {
    if (get().library) return
    window.linky.onLibraryChanged((library) => set({ library }))
    window.linky.onSettingsChanged((settings) => set({ settings }))
    const [library, settings] = await Promise.all([window.linky.getLibrary(), window.linky.getSettings()])
    set({ library, settings })
  }
}))
