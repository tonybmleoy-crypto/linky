import { BrowserWindow, screen, shell, type Rectangle } from 'electron'
import { IPC, type ManagerRoute, type ResizeEdge, type WindowAction } from '@shared/api'
import { preloadPath, resourcePath } from '../paths'
import { loadPage } from './load'

const MIN_WIDTH = 920
const MIN_HEIGHT = 600

/**
 * Library, settings and onboarding. Frameless and transparent so the page can draw
 * rounded corners on Windows 10 too; window controls and edge resizing are custom.
 */
export class ManagerWindow {
  private win: BrowserWindow | null = null
  private resizeTimer: NodeJS.Timeout | null = null

  open(route: ManagerRoute = 'library'): void {
    if (this.win && !this.win.isDestroyed()) {
      this.win.webContents.send(IPC.navigate, route)
      if (this.win.isMinimized()) this.win.restore()
      this.win.show()
      this.win.focus()
      return
    }
    const win = new BrowserWindow({
      width: 1200,
      height: 780,
      minWidth: MIN_WIDTH,
      minHeight: MIN_HEIGHT,
      show: false,
      title: 'Linky',
      icon: resourcePath('icon.png'),
      frame: false,
      transparent: true,
      backgroundColor: '#00000000',
      hasShadow: false,
      webPreferences: {
        preload: preloadPath(),
        sandbox: true,
        contextIsolation: true
      }
    })
    win.once('ready-to-show', () => win.show())
    win.on('closed', () => {
      this.stopResize()
      this.win = null
    })
    const sendState = (): void => win.webContents.send(IPC.windowState, { maximized: win.isMaximized() })
    win.on('maximize', sendState)
    win.on('unmaximize', sendState)
    // Never navigate the app window away; open links in the browser instead.
    win.webContents.setWindowOpenHandler(({ url }) => {
      if (/^https?:/i.test(url)) void shell.openExternal(url)
      return { action: 'deny' }
    })
    win.webContents.on('will-navigate', (e) => e.preventDefault())
    this.win = win
    void loadPage(win, 'manager', `/${route}`)
  }

  control(action: WindowAction): void {
    const win = this.win
    if (!win || win.isDestroyed()) return
    if (action === 'minimize') win.minimize()
    else if (action === 'close') win.close()
    else if (win.isMaximized()) win.unmaximize()
    else win.maximize()
  }

  /** Follows the cursor until the renderer reports the mouse button was released. */
  resize(edge: ResizeEdge | null): void {
    this.stopResize()
    const win = this.win
    if (!edge || !win || win.isDestroyed() || win.isMaximized()) return
    const start = screen.getCursorScreenPoint()
    const from = win.getBounds()
    this.resizeTimer = setInterval(() => {
      if (win.isDestroyed()) return this.stopResize()
      const now = screen.getCursorScreenPoint()
      win.setBounds(resized(from, edge, now.x - start.x, now.y - start.y))
    }, 16)
  }

  send(channel: string, payload: unknown): void {
    if (this.win && !this.win.isDestroyed()) this.win.webContents.send(channel, payload)
  }

  private stopResize(): void {
    if (this.resizeTimer) clearInterval(this.resizeTimer)
    this.resizeTimer = null
  }
}

function resized(b: Rectangle, edge: ResizeEdge, dx: number, dy: number): Rectangle {
  let { x, y, width, height } = b
  if (edge.includes('e')) width = Math.max(MIN_WIDTH, b.width + dx)
  if (edge.includes('s')) height = Math.max(MIN_HEIGHT, b.height + dy)
  if (edge.includes('w')) {
    width = Math.max(MIN_WIDTH, b.width - dx)
    x = b.x + b.width - width
  }
  if (edge.includes('n')) {
    height = Math.max(MIN_HEIGHT, b.height - dy)
    y = b.y + b.height - height
  }
  return { x, y, width, height }
}
