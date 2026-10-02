import koffi from 'koffi'
import { BrowserWindow, app, shell, systemPreferences } from 'electron'
import type { PlatformInput } from './index'

const HID_SYSTEM_STATE = 1 // kCGEventSourceStateHIDSystemState
const HID_EVENT_TAP = 0 // kCGHIDEventTap
const KEY_V = 9 // kVK_ANSI_V
const FLAG_SHIFT = 0x20000
const FLAG_CONTROL = 0x40000
const FLAG_OPTION = 0x80000
const FLAG_COMMAND = 0x100000

/**
 * macOS input via CoreGraphics events. Posting key events requires the
 * Accessibility permission (System Settings → Privacy & Security → Accessibility).
 */
export function createDarwinInput(): PlatformInput {
  const cg = koffi.load('/System/Library/Frameworks/CoreGraphics.framework/CoreGraphics')
  const cf = koffi.load('/System/Library/Frameworks/CoreFoundation.framework/CoreFoundation')

  const CGEventSourceCreate = cg.func('void *CGEventSourceCreate(int32 stateID)')
  const CGEventCreateKeyboardEvent = cg.func('void *CGEventCreateKeyboardEvent(void *source, uint16 virtualKey, bool keyDown)')
  const CGEventSetFlags = cg.func('void CGEventSetFlags(void *event, uint64 flags)')
  const CGEventPost = cg.func('void CGEventPost(uint32 tap, void *event)')
  const CGEventSourceFlagsState = cg.func('uint64 CGEventSourceFlagsState(int32 stateID)')
  const CFRelease = cf.func('void CFRelease(void *cf)')

  const MODIFIERS = BigInt(FLAG_SHIFT | FLAG_CONTROL | FLAG_OPTION | FLAG_COMMAND)
  const modifiersDown = (): boolean => (BigInt(CGEventSourceFlagsState(HID_SYSTEM_STATE)) & MODIFIERS) !== 0n

  const key = (source: unknown, down: boolean): void => {
    const event = CGEventCreateKeyboardEvent(source, KEY_V, down)
    CGEventSetFlags(event, FLAG_COMMAND)
    CGEventPost(HID_EVENT_TAP, event)
    CFRelease(event)
  }

  return {
    canPaste: true,
    focusDelayMs: 120,

    // The quick menu is a non-activating panel, so the previous app usually stays frontmost.
    captureTarget: () => 'frontmost-app',
    // Reading the caret needs the AX API; the menu opens at the mouse pointer instead.
    caretRect: () => null,

    focus(): boolean {
      // If Linky became the active app (e.g. its window was in front), step aside so the
      // previous app gets focus back before we send ⌘V.
      if (BrowserWindow.getFocusedWindow()) app.hide()
      return true
    },

    async waitModifiersReleased(timeoutMs = 1500): Promise<void> {
      const deadline = Date.now() + timeoutMs
      while (Date.now() < deadline && modifiersDown()) await new Promise((r) => setTimeout(r, 15))
    },

    sendPaste(): void {
      const source = CGEventSourceCreate(HID_SYSTEM_STATE)
      key(source, true)
      key(source, false)
      if (source) CFRelease(source)
    },

    hasPermission: () => systemPreferences.isTrustedAccessibilityClient(false),

    requestPermission(): void {
      // Shows the system prompt the first time; afterwards, open the right settings pane.
      if (!systemPreferences.isTrustedAccessibilityClient(true)) {
        void shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility')
      }
    }
  }
}
