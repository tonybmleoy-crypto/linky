export interface ScreenPoint {
  x: number
  y: number
}

/** Caret rectangle in physical screen pixels. */
export interface CaretRect extends ScreenPoint {
  height: number
}

export type TargetHandle = unknown

/** OS-level input operations needed to paste into another application. */
export interface PlatformInput {
  /** Remembers the window that should receive the paste. */
  captureTarget(): TargetHandle | null
  /** Caret of the focused control in that window, when the app exposes it. */
  caretRect(target: TargetHandle | null): CaretRect | null
  focus(target: TargetHandle): boolean
  waitModifiersReleased(timeoutMs?: number): Promise<void>
  sendPaste(): void
  /** False when pasting is not supported and the app should only copy. */
  readonly canPaste: boolean
}

const unsupported: PlatformInput = {
  canPaste: false,
  captureTarget: () => null,
  caretRect: () => null,
  focus: () => false,
  waitModifiersReleased: async () => {},
  sendPaste: () => {}
}

export async function loadPlatformInput(): Promise<PlatformInput> {
  if (process.platform === 'win32') {
    try {
      const { createWin32Input } = await import('./win32')
      return createWin32Input()
    } catch (err) {
      console.error('[linky] native input unavailable, falling back to copy-only', err)
    }
  }
  // macOS (CGEvent + Accessibility permission) comes later.
  return unsupported
}
