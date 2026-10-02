import { Menu, Tray, nativeImage } from 'electron'
import type { Translate } from '@shared/i18n'
import { resourcePath } from '../paths'

export interface TrayActions {
  openPalette(): void
  openManager(): void
  openSettings(): void
  quit(): void
}

export function createTray(
  actions: TrayActions,
  labels: () => { hotkey: string; t: Translate }
): { tray: Tray; refresh: () => void } {
  const image = nativeImage.createFromPath(resourcePath('tray.png'))
  const tray = new Tray(image)
  tray.setToolTip('Linky')
  const rebuild = (): void => {
    const { hotkey, t } = labels()
    tray.setToolTip(`Linky — ${hotkey}`)
    tray.setContextMenu(
      Menu.buildFromTemplate([
        { label: `${t('tray.palette')}\t${hotkey}`, click: actions.openPalette },
        { label: t('tray.open'), click: actions.openManager },
        { label: t('tray.settings'), click: actions.openSettings },
        { type: 'separator' },
        { label: t('tray.quit'), click: actions.quit }
      ])
    )
  }
  rebuild()
  tray.on('click', actions.openManager)
  return { tray, refresh: rebuild }
}

/** "Control+Alt+V" → "Ctrl+Alt+V" for menus and hints. */
export function prettyAccelerator(acc: string): string {
  return acc.replace(/CommandOrControl|CmdOrCtrl|Control/g, 'Ctrl').replace(/Super|Meta/g, 'Win')
}
