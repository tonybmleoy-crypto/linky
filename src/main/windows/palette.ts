import { BrowserWindow, screen, type Rectangle } from 'electron'
import { IPC, type PaletteShownEvent } from '@shared/api'
import type { CaretRect } from '../platform'
import { isDev, preloadPath } from '../paths'
import { loadPage } from './load'

/** Panel size from the design (Palette component: 600 wide) plus room for its shadow. */
const PANEL_WIDTH = 600
const SHADOW = 28
const WIN_WIDTH = PANEL_WIDTH + SHADOW * 2
const WIN_HEIGHT = 520
const GAP = 8

export interface PaletteAnchor {
  /** Caret (or cursor) in DIP screen coordinates. */
  point: { x: number; y: number }
  lineHeight: number
}

/**
 * The palette window is created once and kept hidden, so it appears instantly.
 * It is transparent and frameless; the panel and its shadow are drawn by the page.
 */
export class PaletteWindow {
  readonly win: BrowserWindow
  private shownAt = 0

  constructor() {
    this.win = new BrowserWindow({
      width: WIN_WIDTH,
      height: WIN_HEIGHT,
      show: false,
      frame: false,
      transparent: true,
      backgroundColor: '#00000000',
      resizable: false,
      movable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      skipTaskbar: true,
      hasShadow: false,
      alwaysOnTop: true,
      ...(process.platform === 'darwin' ? { type: 'panel' as const } : {}),
      webPreferences: {
        preload: preloadPath(),
        sandbox: true,
        contextIsolation: true,
        spellcheck: false
      }
    })
    this.win.setAlwaysOnTop(true, 'pop-up-menu')
    this.win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
    // Clicking anywhere else dismisses it, like a menu.
    this.win.on('blur', () => {
      if (Date.now() - this.shownAt < 150) return
      if (!this.win.webContents.isDevToolsOpened()) this.hide()
    })
    void loadPage(this.win, 'palette')
    if (isDev && process.env['LINKY_DEVTOOLS']) this.win.webContents.openDevTools({ mode: 'detach' })
  }

  get visible(): boolean {
    return this.win.isVisible()
  }

  show(anchor: PaletteAnchor | null, mode: 'cursor' | 'center'): void {
    const cursor = screen.getCursorScreenPoint()
    const display = screen.getDisplayNearestPoint(anchor?.point ?? cursor)
    const { bounds, anchor: side } =
      mode === 'center' || !anchor ? centered(display.workArea) : nearCaret(anchor, display.workArea)
    this.win.setBounds(bounds)
    const event: PaletteShownEvent = { anchor: side }
    this.win.webContents.send(IPC.paletteShown, event)
    this.shownAt = Date.now()
    this.win.show()
    this.win.focus()
    this.win.webContents.focus()
  }

  hide(): void {
    if (this.win.isVisible()) this.win.hide()
  }
}

function centered(area: Rectangle): { bounds: Rectangle; anchor: 'top' } {
  return {
    anchor: 'top',
    bounds: {
      x: Math.round(area.x + (area.width - WIN_WIDTH) / 2),
      y: Math.round(area.y + area.height * 0.18),
      width: WIN_WIDTH,
      height: WIN_HEIGHT
    }
  }
}

/** Below the caret; flipped above it when it would run off the bottom of the screen. */
function nearCaret(anchor: PaletteAnchor, area: Rectangle): { bounds: Rectangle; anchor: 'top' | 'bottom' } {
  const x = clamp(anchor.point.x - SHADOW - 24, area.x, area.x + area.width - WIN_WIDTH)
  const below = anchor.point.y + anchor.lineHeight + GAP - SHADOW
  if (below + WIN_HEIGHT <= area.y + area.height) {
    return { anchor: 'top', bounds: { x, y: below, width: WIN_WIDTH, height: WIN_HEIGHT } }
  }
  const above = anchor.point.y - GAP + SHADOW - WIN_HEIGHT
  return {
    anchor: 'bottom',
    bounds: { x, y: Math.max(area.y, above), width: WIN_WIDTH, height: WIN_HEIGHT }
  }
}

function clamp(v: number, min: number, max: number): number {
  return Math.round(Math.min(Math.max(v, min), max))
}

export function caretToAnchor(caret: CaretRect | null): PaletteAnchor {
  if (caret && process.platform === 'win32') {
    const top = screen.screenToDipPoint({ x: caret.x, y: caret.y })
    const bottom = screen.screenToDipPoint({ x: caret.x, y: caret.y + caret.height })
    return { point: top, lineHeight: Math.max(12, bottom.y - top.y) }
  }
  return { point: screen.getCursorScreenPoint(), lineHeight: 18 }
}
