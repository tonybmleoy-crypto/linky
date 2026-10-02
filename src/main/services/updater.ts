import { EventEmitter } from 'node:events'
import { Notification, app, shell } from 'electron'
import electronUpdater from 'electron-updater'
import type { UpdateState } from '@shared/api'
import type { Translate } from '@shared/i18n'

const { autoUpdater } = electronUpdater

const RELEASES = 'https://github.com/tonybmleoy-crypto/linky/releases/latest'
const CHECK_EVERY_MS = 6 * 60 * 60 * 1000

/**
 * Finds new releases on GitHub and offers them to the user; nothing installs without a click.
 * Windows downloads and installs in place. macOS can't self-update an app that isn't signed
 * with an Apple Developer ID, so there the button opens the download page instead.
 */
export class UpdateService extends EventEmitter<{ changed: [UpdateState] }> {
  private state: UpdateState = { status: 'idle', current: app.getVersion() }
  private notified: string | null = null
  private readonly canInstall = process.platform === 'win32'

  constructor(
    private readonly t: () => Translate,
    private readonly openWindow: () => void
  ) {
    super()
  }

  get(): UpdateState {
    return this.state
  }

  start(): void {
    // Dev builds have no update feed. LINKY_FAKE_UPDATE=0.9.0 shows the offer for UI work.
    if (!app.isPackaged) {
      const fake = process.env['LINKY_FAKE_UPDATE']
      if (fake) this.set({ status: 'available', version: fake })
      return
    }
    autoUpdater.autoDownload = false
    autoUpdater.autoInstallOnAppQuit = false
    autoUpdater.on('update-available', (info) => {
      this.set({ status: 'available', version: info.version })
      this.notify(info.version)
    })
    autoUpdater.on('update-not-available', () => this.set({ status: 'latest' }))
    autoUpdater.on('download-progress', (p) => this.set({ status: 'downloading', progress: Math.round(p.percent) }))
    autoUpdater.on('update-downloaded', () => this.set({ status: 'ready' }))
    autoUpdater.on('error', (err) => {
      // A failed check (offline, rate limit) shouldn't nag; a failed download should be visible.
      if (this.state.status === 'downloading') this.set({ status: 'error', error: String(err?.message ?? err) })
      else if (this.state.status === 'checking') this.set({ status: 'idle' })
    })
    void this.check()
    setInterval(() => void this.check(), CHECK_EVERY_MS).unref()
  }

  async check(): Promise<UpdateState> {
    if (!app.isPackaged) {
      this.set({ status: 'latest' })
      return this.state
    }
    if (['downloading', 'ready'].includes(this.state.status)) return this.state
    this.set({ status: 'checking' })
    try {
      await autoUpdater.checkForUpdates()
    } catch {
      this.set({ status: 'idle' })
    }
    return this.state
  }

  /** The user agreed to update. */
  async install(): Promise<void> {
    if (this.state.status === 'ready') {
      autoUpdater.quitAndInstall(true, true)
      return
    }
    if (this.state.status !== 'available' && this.state.status !== 'error') return
    if (!this.canInstall) {
      await shell.openExternal(RELEASES)
      return
    }
    this.set({ status: 'downloading', progress: 0 })
    await autoUpdater.downloadUpdate().catch((err) => this.set({ status: 'error', error: String(err?.message ?? err) }))
  }

  private notify(version: string): void {
    if (this.notified === version || !Notification.isSupported()) return
    this.notified = version
    const t = this.t()
    const n = new Notification({ title: t('update.notifyTitle', { version }), body: t('update.notifyBody') })
    n.on('click', this.openWindow)
    n.show()
  }

  private set(patch: Partial<UpdateState>): void {
    this.state = { ...this.state, ...patch, current: app.getVersion(), canInstall: this.canInstall }
    this.emit('changed', this.state)
  }
}
