import { app, globalShortcut } from 'electron'
import { LinkyApp } from './app'
import { registerIpc } from './ipc'

let ctl: LinkyApp | null = null

// Dev only: run a second, isolated copy (own data folder and instance lock), e.g. for smoke tests.
const devUserData = process.env['LINKY_USER_DATA']
if (devUserData && !app.isPackaged) app.setPath('userData', devUserData)

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => ctl?.openManager('library'))

  app.whenReady().then(async () => {
    app.setAppUserModelId('com.linky.app')
    ctl = new LinkyApp()
    registerIpc(ctl)
    await ctl.start(process.argv.includes('--hidden'))
    const smokeDir = process.env['LINKY_SMOKE']
    if (smokeDir && !app.isPackaged) {
      const { runSmoke } = await import('./smoke')
      await runSmoke(ctl, smokeDir)
    }
  })

  // Lives in the tray: closing the manager window must not quit the app.
  app.on('window-all-closed', () => {})
  app.on('before-quit', () => ctl?.flush())
  app.on('will-quit', () => globalShortcut.unregisterAll())
}
