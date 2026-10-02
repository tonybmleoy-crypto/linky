/* Platform conventions for shortcuts and window chrome. */

declare global {
  // Lets pages outside Electron (the landing-page demo) pick which platform's conventions to show.
  var __LINKY_PLATFORM__: string | undefined
}

const platform = globalThis.__LINKY_PLATFORM__ ?? (typeof window !== 'undefined' ? window.linky?.platform : undefined) ?? 'win32'

export const isMac = platform === 'darwin'

/** The "primary" modifier: ⌘ on macOS, Ctrl elsewhere. */
export const MOD = isMac ? '⌘' : 'Ctrl'

export function modPressed(e: { ctrlKey: boolean; metaKey: boolean }): boolean {
  return isMac ? e.metaKey : e.ctrlKey
}
