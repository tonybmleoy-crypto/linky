import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { BrowserWindow, app, screen } from 'electron'
import type { Settings } from '@shared/model'
import type { LinkyApp } from './app'

const wait = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

/**
 * Dev-only visual smoke test: `LINKY_SMOKE=out/smoke npm run dev`.
 * Opens each surface in each language/theme, saves screenshots, restores settings and quits.
 */
export async function runSmoke(ctl: LinkyApp, dir: string): Promise<void> {
  mkdirSync(dir, { recursive: true })
  const original = ctl.settings.get()
  const shot = async (win: BrowserWindow | undefined, name: string): Promise<void> => {
    await wait(800)
    if (!win || win.isDestroyed()) return console.log(`[smoke] ${name}: window gone`)
    const img = await win.webContents.capturePage()
    writeFileSync(join(dir, `${name}.png`), img.toPNG())
    console.log(`[smoke] ${name}: ok`)
  }
  const managerWin = (): BrowserWindow | undefined =>
    BrowserWindow.getAllWindows().find((w) => w !== ctl.palette.win && !w.isDestroyed())

  await wait(1500)
  const combos: Array<[Settings['language'], Settings['theme']]> = [
    ['ru', 'light'],
    ['ru', 'dark'],
    ['en', 'dark']
  ]
  for (const [language, theme] of combos) {
    ctl.settings.update({ language, theme })
    for (const route of ['onboarding', 'library', 'settings'] as const) {
      ctl.openManager(route)
      await shot(managerWin(), `manager-${route}-${language}-${theme}`)
    }
    // Last, so nothing steals focus and dismisses it.
    const p = screen.getPrimaryDisplay().workArea
    ctl.palette.show({ point: { x: p.x + 200, y: p.y + 120 }, lineHeight: 18 }, 'cursor')
    await shot(ctl.palette.win, `palette-${language}-${theme}`)
    ctl.palette.hide()
  }
  ctl.settings.update({ language: original.language, theme: original.theme })
  ctl.flush()
  app.quit()
}
