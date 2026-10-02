import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { app, clipboard, nativeTheme } from 'electron'
import { IPC, type ManagerRoute, type PasteResult } from '@shared/api'
import { createTranslator, resolveLang, type Translate } from '@shared/i18n'
import type { Settings, SettingsPatch } from '@shared/model'
import { loadPlatformInput, type PlatformInput, type TargetHandle } from './platform'
import { restoreClipboard, snapshotClipboard } from './services/clipboard'
import { HotkeyService } from './services/hotkey'
import { UpdateService } from './services/updater'
import { createTray, prettyAccelerator } from './services/tray'
import { LibraryStore, sampleLibrary } from './store/library-store'
import { SettingsStore } from './store/settings-store'
import { ManagerWindow } from './windows/manager'
import { PaletteWindow, caretToAnchor } from './windows/palette'

const delay = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

/** The app was called "Linkster" before 0.1 — carry its data over once, without touching the old copy. */
function migrateFromLegacyName(dir: string): void {
  if (process.env['LINKY_USER_DATA']) return // isolated dev copy: start clean
  const legacy = join(app.getPath('appData'), 'Linkster')
  if (existsSync(join(dir, 'library.json')) || !existsSync(join(legacy, 'library.json'))) return
  mkdirSync(dir, { recursive: true })
  for (const file of ['library.json', 'settings.json']) {
    if (existsSync(join(legacy, file))) copyFileSync(join(legacy, file), join(dir, file))
  }
}

export class LinkyApp {
  readonly library: LibraryStore
  readonly settings: SettingsStore
  readonly hotkey: HotkeyService
  readonly manager = new ManagerWindow()
  readonly updater = new UpdateService(
    () => this.t,
    () => this.openManager('library')
  )
  palette!: PaletteWindow
  private platform!: PlatformInput
  private target: TargetHandle | null = null
  private refreshTray: () => void = () => {}
  hotkeyOk = true

  constructor() {
    const dir = app.getPath('userData')
    migrateFromLegacyName(dir)
    this.settings = new SettingsStore(join(dir, 'settings.json'))
    // First-run samples come in the user's language.
    this.library = new LibraryStore(join(dir, 'library.json'), () => sampleLibrary(this.t))
    this.hotkey = new HotkeyService(() => this.togglePalette())
  }

  async start(launchedHidden: boolean): Promise<void> {
    // macOS: a menu-bar app — the Dock icon only shows while the Linky window is open.
    if (process.platform === 'darwin') app.dock?.hide()
    this.platform = await loadPlatformInput()
    this.palette = new PaletteWindow()
    const s = this.settings.get()
    nativeTheme.themeSource = s.theme
    this.hotkeyOk = this.hotkey.register(s.hotkey)

    this.refreshTray = createTray(
      {
        openPalette: () => this.togglePalette(),
        openManager: () => this.openManager('library'),
        openSettings: () => this.openManager('settings'),
        installUpdate: () => void this.updater.install(),
        quit: () => app.quit()
      },
      () => ({ hotkey: prettyAccelerator(this.settings.get().hotkey), t: this.t, update: this.updater.get() })
    ).refresh

    this.library.on('changed', (lib) => this.broadcast(IPC.libraryChanged, lib))
    this.settings.on('changed', (next, patch) => this.applySettings(next, patch))
    this.updater.on('changed', (state) => {
      this.manager.send(IPC.updateChanged, state)
      this.refreshTray()
    })
    this.updater.start()

    if (!s.onboardingDone) this.openManager('onboarding')
    else if (!launchedHidden) this.openManager('library')
  }

  get t(): Translate {
    return createTranslator(resolveLang(this.settings.get().language, app.getLocale()))
  }

  togglePalette(): void {
    if (this.palette.visible) {
      this.palette.hide()
      return
    }
    this.target = this.platform.captureTarget()
    const caret = this.platform.caretRect(this.target)
    this.palette.show(caretToAnchor(caret), this.settings.get().palettePosition)
  }

  /** Puts the snippet on the clipboard, returns focus to the original app and presses Ctrl+V there. */
  async paste(id: string): Promise<PasteResult> {
    const snippet = this.library.getSnippet(id)
    if (!snippet) return 'error'
    const s = this.settings.get()
    const previous = s.restoreClipboard ? await snapshotClipboard() : null

    await clipboard.writeText(snippet.content)
    this.palette.hide()
    this.library.recordUse(id)

    const target = this.target
    this.target = null
    if (s.pasteMode === 'copy' || !this.platform.canPaste || !target) return 'copied'
    if (this.platform.hasPermission && !this.platform.hasPermission()) {
      // macOS without Accessibility: the snippet is on the clipboard; ask once for the permission.
      this.platform.requestPermission?.()
      return 'copied'
    }

    await this.platform.waitModifiersReleased()
    if (!this.platform.focus(target)) return 'copied'
    await delay(this.platform.focusDelayMs)
    this.platform.sendPaste()

    if (s.restoreClipboard) {
      // Give slow apps time to read the clipboard before putting the old contents back.
      setTimeout(async () => {
        // Don't clobber something the user copied in the meantime.
        if ((await clipboard.readText()) === snippet.content) await restoreClipboard(previous)
      }, 600)
    }
    return 'pasted'
  }

  /** macOS Accessibility permission; always true where it isn't needed. */
  hasPastePermission(): boolean {
    return this.platform.hasPermission?.() ?? true
  }

  requestPastePermission(): void {
    this.platform.requestPermission?.()
  }

  openManager(route: ManagerRoute): void {
    this.manager.open(route)
  }

  updateSettings(patch: SettingsPatch): Settings {
    if (patch.hotkey && patch.hotkey !== this.settings.get().hotkey) {
      const check = this.hotkey.check(patch.hotkey)
      if (!check.ok) throw new Error(`hotkey-${check.reason ?? 'taken'}`)
    }
    return this.settings.update(patch)
  }

  flush(): void {
    this.library.flush()
    this.settings.flush()
  }

  private applySettings(next: Settings, patch: SettingsPatch): void {
    if (patch.hotkey) this.hotkeyOk = this.hotkey.register(next.hotkey)
    if (patch.hotkey || patch.language) this.refreshTray()
    if (patch.theme) nativeTheme.themeSource = next.theme
    if (patch.launchAtLogin !== undefined && app.isPackaged) {
      app.setLoginItemSettings({ openAtLogin: next.launchAtLogin, args: ['--hidden'] })
    }
    this.broadcast(IPC.settingsChanged, next)
  }

  private broadcast(channel: string, payload: unknown): void {
    if (!this.palette.win.isDestroyed()) this.palette.win.webContents.send(channel, payload)
    this.manager.send(channel, payload)
  }
}
