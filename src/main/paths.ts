import { join } from 'node:path'
import { app } from 'electron'

export const isDev = !app.isPackaged

/** Static assets (icons) — `resources/` in dev, next to app.asar when packaged. */
export function resourcePath(...parts: string[]): string {
  return app.isPackaged ? join(process.resourcesPath, ...parts) : join(app.getAppPath(), 'resources', ...parts)
}

export function rendererUrl(page: 'palette' | 'manager', hash = ''): { url?: string; file?: string; hash: string } {
  const devServer = process.env['ELECTRON_RENDERER_URL']
  if (isDev && devServer) return { url: `${devServer}/${page}.html${hash ? `#${hash}` : ''}`, hash }
  return { file: join(__dirname, `../renderer/${page}.html`), hash }
}

export const preloadPath = (): string => join(__dirname, '../preload/index.js')
