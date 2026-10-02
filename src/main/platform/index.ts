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
  /** How long the target app needs to take focus before the keystroke. */
  readonly focusDelayMs: number
  /** macOS: is Linky allowed to send keystrokes (Accessibility permission)? */
  hasPermission?(): boolean
  requestPermission?(): void
}

const unsupported: PlatformInput = {
  canPaste: false,
  focusDelayMs: 0,
  captureTarget: () => null,
  caretRect: () => null,
  focus: () => false,
  waitModifiersReleased: async () => {},
  sendPaste: () => {}
}

export async function loadPlatformInput(): Promise<PlatformInput> {
  try {
    if (process.platform === 'win32') return (await import('./win32')).createWin32Input()
    if (process.platform === 'darwin') return (await import('./darwin')).createDarwinInput()
  } catch (err) {
    console.error('[linky] native input unavailable, falling back to copy-only', err)
  }
  return unsupported
}
