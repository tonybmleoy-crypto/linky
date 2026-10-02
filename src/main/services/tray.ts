import { Menu, Tray, nativeImage } from 'electron'
import type { UpdateState } from '@shared/api'
import type { Translate } from '@shared/i18n'
import { resourcePath } from '../paths'

export interface TrayActions {
  openPalette(): void
  openManager(): void
  openSettings(): void
  installUpdate(): void
  quit(): void
}

export function createTray(
  actions: TrayActions,
  labels: () => { hotkey: string; t: Translate; update: UpdateState }
): { tray: Tray; refresh: () => void } {
  // macOS wants a monochrome "template" image it can tint for light/dark menu bars.
  const image = nativeImage.createFromPath(resourcePath(process.platform === 'darwin' ? 'trayTemplate.png' : 'tray.png'))
  const tray = new Tray(image)
  tray.setToolTip('Linky')
  const rebuild = (): void => {
    const { hotkey, t, update } = labels()
    tray.setToolTip(`Linky · ${hotkey}`)
    const offer = update.version && ['available', 'downloading', 'ready', 'error'].includes(update.status)
    tray.setContextMenu(
      Menu.buildFromTemplate([
        ...(offer
          ? [
              {
                label: update.status === 'ready' ? t('update.ready') : t('tray.update', { version: update.version! }),
                enabled: update.status !== 'downloading',
                click: actions.installUpdate
              },
              { type: 'separator' as const }
            ]
          : []),
        { label: `${t('tray.palette')}\t${hotkey}`, click: actions.openPalette },
        { label: t('tray.open'), click: actions.openManager },
        { label: t('tray.settings'), click: actions.openSettings },
        { type: 'separator' },
        { label: t('tray.quit'), click: actions.quit }
      ])
    )
  }
  rebuild()
  // On macOS a click opens the menu (the platform convention); on Windows it opens the window.
  if (process.platform !== 'darwin') tray.on('click', actions.openManager)
  return { tray, refresh: rebuild }
}

/** "Control+Alt+V" → "Ctrl+Alt+V" for menus and hints. */
export function prettyAccelerator(acc: string): string {
  return acc.replace(/CommandOrControl|CmdOrCtrl|Control/g, 'Ctrl').replace(/Super|Meta/g, 'Win')
}
