import type { BrowserWindow } from 'electron'
import { rendererUrl } from '../paths'

export function loadPage(win: BrowserWindow, page: 'palette' | 'manager', hash = ''): Promise<void> {
  const target = rendererUrl(page, hash)
  if (target.url) return win.loadURL(target.url)
  return win.loadFile(target.file!, target.hash ? { hash: target.hash } : undefined)
}
