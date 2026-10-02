import koffi from 'koffi'
import type { CaretRect, PlatformInput, TargetHandle } from './index'

const VK_SHIFT = 0x10
const VK_CONTROL = 0x11
const VK_MENU = 0x12
const VK_LWIN = 0x5b
const VK_RWIN = 0x5c
const VK_V = 0x56
const KEYEVENTF_KEYUP = 0x0002

export function createWin32Input(): PlatformInput {
  const user32 = koffi.load('user32.dll')

  const POINT = koffi.struct('LS_POINT', { x: 'int32', y: 'int32' })
  const RECT = koffi.struct('LS_RECT', { left: 'int32', top: 'int32', right: 'int32', bottom: 'int32' })
  const GUITHREADINFO = koffi.struct('LS_GUITHREADINFO', {
    cbSize: 'uint32',
    flags: 'uint32',
    hwndActive: 'void *',
    hwndFocus: 'void *',
    hwndCapture: 'void *',
    hwndMenuOwner: 'void *',
    hwndMoveSize: 'void *',
    hwndCaret: 'void *',
    rcCaret: RECT
  })

  const GetForegroundWindow = user32.func('void * __stdcall GetForegroundWindow()')
  const SetForegroundWindow = user32.func('bool __stdcall SetForegroundWindow(void *hWnd)')
  const IsWindow = user32.func('bool __stdcall IsWindow(void *hWnd)')
  const GetAsyncKeyState = user32.func('int16 __stdcall GetAsyncKeyState(int vKey)')
  const keybd_event = user32.func('void __stdcall keybd_event(uint8 bVk, uint8 bScan, uint32 dwFlags, uintptr dwExtraInfo)')
  const GetWindowThreadProcessId = user32.func('uint32 __stdcall GetWindowThreadProcessId(void *hWnd, void *lpdwProcessId)')
  const GetGUIThreadInfo = user32.func(`bool __stdcall GetGUIThreadInfo(uint32 idThread, _Inout_ LS_GUITHREADINFO *pgui)`)
  const ClientToScreen = user32.func('bool __stdcall ClientToScreen(void *hWnd, _Inout_ LS_POINT *lpPoint)')
  void POINT

  const key = (vk: number, up: boolean): void => keybd_event(vk, 0, up ? KEYEVENTF_KEYUP : 0, 0)
  const isDown = (vk: number): boolean => (GetAsyncKeyState(vk) & 0x8000) !== 0

  return {
    canPaste: true,

    captureTarget: () => GetForegroundWindow() ?? null,

    caretRect(target: TargetHandle | null): CaretRect | null {
      if (!target) return null
      const thread = GetWindowThreadProcessId(target, null)
      const info = {
        cbSize: koffi.sizeof(GUITHREADINFO),
        flags: 0,
        hwndActive: null,
        hwndFocus: null,
        hwndCapture: null,
        hwndMenuOwner: null,
        hwndMoveSize: null,
        hwndCaret: null,
        rcCaret: { left: 0, top: 0, right: 0, bottom: 0 }
      }
      if (!GetGUIThreadInfo(thread, info) || !info.hwndCaret) return null
      const pt = { x: info.rcCaret.left, y: info.rcCaret.top }
      if (!ClientToScreen(info.hwndCaret, pt)) return null
      // Browsers and Electron apps don't expose a real caret; they report an empty rect at 0,0.
      const height = info.rcCaret.bottom - info.rcCaret.top
      if (height <= 0 || (pt.x === 0 && pt.y === 0)) return null
      return { x: pt.x, y: pt.y, height }
    },

    focus(target: TargetHandle): boolean {
      if (!target || !IsWindow(target)) return false
      return SetForegroundWindow(target)
    },

    async waitModifiersReleased(timeoutMs = 1500): Promise<void> {
      const deadline = Date.now() + timeoutMs
      while (Date.now() < deadline) {
        if (![VK_SHIFT, VK_CONTROL, VK_MENU, VK_LWIN, VK_RWIN].some(isDown)) return
        await new Promise((r) => setTimeout(r, 15))
      }
    },

    sendPaste(): void {
      key(VK_CONTROL, false)
      key(VK_V, false)
      key(VK_V, true)
      key(VK_CONTROL, true)
    }
  }
}
