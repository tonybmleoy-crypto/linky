import { globalShortcut } from 'electron'
import type { HotkeyCheck } from '@shared/api'

/** Owns the single global shortcut that opens the palette. */
export class HotkeyService {
  private current: string | null = null
  private suspended = false

  constructor(private readonly onPress: () => void) {}

  /** Returns false when another app already owns the accelerator. */
  register(accelerator: string): boolean {
    this.unregister()
    try {
      if (!globalShortcut.register(accelerator, this.onPress)) return false
    } catch {
      return false
    }
    this.current = accelerator
    return true
  }

  unregister(): void {
    if (this.current) globalShortcut.unregister(this.current)
    this.current = null
  }

  /** Lets the settings screen capture key combos without triggering the palette. */
  suspend(suspended: boolean, accelerator: string): void {
    if (suspended === this.suspended) return
    this.suspended = suspended
    if (suspended) this.unregister()
    else this.register(accelerator)
  }

  check(accelerator: string): HotkeyCheck {
    if (accelerator === this.current) return { ok: true }
    try {
      if (!globalShortcut.register(accelerator, () => {})) {
        return { ok: false, reason: 'taken' }
      }
      globalShortcut.unregister(accelerator)
      return { ok: true }
    } catch {
      return { ok: false, reason: 'invalid' }
    }
  }
}
