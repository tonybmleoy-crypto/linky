/* Platform conventions for shortcuts and window chrome. */

export const isMac = window.linky.platform === 'darwin'

/** The "primary" modifier: ⌘ on macOS, Ctrl elsewhere. */
export const MOD = isMac ? '⌘' : 'Ctrl'

export function modPressed(e: { ctrlKey: boolean; metaKey: boolean }): boolean {
  return isMac ? e.metaKey : e.ctrlKey
}
