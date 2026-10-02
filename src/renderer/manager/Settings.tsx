import { useEffect, useState, type ReactNode } from 'react'
import type { Settings } from '@shared/model'
import { useApp } from '../shared/store'
import { acceleratorFromEvent, prettyHotkey } from '../shared/format'
import { useT } from '../shared/i18n'
import { MOD, isMac } from '../shared/platform'
import { Button, Segmented, Switch, cx } from '../shared/ui'
import pkg from '../../../package.json'

export function SettingsView() {
  const settings = useApp((s) => s.settings)!
  const t = useT()
  const set = (patch: Partial<Settings>): void => void window.linky.updateSettings(patch)

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto bg-sunken px-14 pt-7 pb-6">
      <div>
        <h1 className="t-heading-l">{t('set.title')}</h1>
        <p className="t-caption mt-1 text-fg-3">{t('set.subtitle')}</p>
      </div>

      <Group title={t('set.general')}>
        <Row label={t('set.hotkey')} hint={t('set.hotkeyHint')}>
          <HotkeyRecorder value={settings.hotkey} />
        </Row>
        <Row label={t('set.login')} hint={t('set.loginHint')}>
          <Switch checked={settings.launchAtLogin} onChange={(v) => set({ launchAtLogin: v })} label={t('set.login')} />
        </Row>
        <Row label={t('set.appearance')} hint={t('set.appearanceHint')}>
          <Segmented
            value={settings.theme}
            onChange={(theme) => set({ theme })}
            options={[
              { value: 'system', label: t('set.system') },
              { value: 'light', label: t('set.light') },
              { value: 'dark', label: t('set.dark') }
            ]}
          />
        </Row>
        <Row label={t('set.language')} hint={t('set.languageHint')}>
          <Segmented
            value={settings.language}
            onChange={(language) => set({ language })}
            options={[
              { value: 'system', label: t('set.system') },
              // Language names stay in their own language so they're always findable.
              { value: 'en', label: 'English' },
              { value: 'ru', label: 'Русский' }
            ]}
          />
        </Row>
      </Group>

      <Group title={t('set.pasting')}>
        {isMac && <PermissionRow />}
        <Row label={t('set.pasteMode')} hint={t('set.pasteModeHint', { mod: MOD })}>
          <Segmented
            value={settings.pasteMode}
            onChange={(pasteMode) => set({ pasteMode })}
            options={[
              { value: 'paste', label: t('set.paste') },
              { value: 'copy', label: t('set.copyOnly') }
            ]}
          />
        </Row>
        <Row label={t('set.restore')} hint={t('set.restoreHint')}>
          <Switch checked={settings.restoreClipboard} onChange={(v) => set({ restoreClipboard: v })} label={t('set.restore')} />
        </Row>
        <Row label={t('set.position')} hint={t('set.positionHint')}>
          <Segmented
            value={settings.palettePosition}
            onChange={(palettePosition) => set({ palettePosition })}
            options={[
              { value: 'cursor', label: t('set.atCursor') },
              { value: 'center', label: t('set.center') }
            ]}
          />
        </Row>
      </Group>

      <div className="flex-1" />
      <p className="t-caption flex flex-wrap gap-2 text-fg-3">
        <span>Linky {pkg.version}</span>·
        <button className="font-medium text-fg hover:underline" onClick={() => void window.linky.openManager('onboarding')}>
          {t('set.tour')}
        </button>
        ·<span>{t('set.privacy')}</span>
      </p>
    </div>
  )
}

/** macOS only: Accessibility permission, needed to press ⌘V in other apps. */
export function PermissionRow() {
  const t = useT()
  const allowed = usePastePermission()
  return (
    <Row label={t('perm.title')} hint={allowed ? t('perm.granted') : t('perm.needed')}>
      {allowed ? (
        <span className="t-body-s font-medium text-success">✓</span>
      ) : (
        <Button size="s" onClick={() => void window.linky.requestPastePermission()}>
          {t('perm.allow')}
        </Button>
      )}
    </Row>
  )
}

/** Re-checks when the window regains focus — i.e. after the user comes back from System Settings. */
export function usePastePermission(): boolean {
  const [allowed, setAllowed] = useState(true)
  useEffect(() => {
    const check = (): void => void window.linky.hasPastePermission().then(setAllowed)
    check()
    window.addEventListener('focus', check)
    return () => window.removeEventListener('focus', check)
  }, [])
  return allowed
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="t-caption font-medium text-fg-3">{title}</h2>
      <div className="rounded-2xl bg-surface">{children}</div>
    </section>
  )
}

function Row({ label, hint, children }: { label: string; hint: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-4 px-5 py-3.5">
      <div className="min-w-0 flex-1">
        <div className="t-body-m font-medium">{label}</div>
        <div className="t-caption text-fg-3">{hint}</div>
      </div>
      {children}
    </div>
  )
}

function HotkeyRecorder({ value }: { value: string }) {
  const t = useT()
  const [recording, setRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!recording) return
    void window.linky.suspendHotkey(true)
    const onKey = async (e: KeyboardEvent): Promise<void> => {
      e.preventDefault()
      if (e.key === 'Escape') {
        setRecording(false)
        return
      }
      const acc = acceleratorFromEvent(e)
      if (!acc) return
      const check = await window.linky.checkHotkey(acc)
      if (!check.ok) {
        setError(`${prettyHotkey(acc).join(' + ')}: ${t(check.reason === 'invalid' ? 'set.hotkeyInvalid' : 'set.hotkeyTaken')}`)
        return
      }
      await window.linky.updateSettings({ hotkey: acc })
      setError(null)
      setRecording(false)
    }
    const listener = (e: KeyboardEvent): void => void onKey(e)
    window.addEventListener('keydown', listener, true)
    return () => {
      window.removeEventListener('keydown', listener, true)
      void window.linky.suspendHotkey(false)
    }
  }, [recording, t])

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={() => {
          setError(null)
          setRecording((r) => !r)
        }}
        className={cx(
          't-body-s rounded-full border px-3.5 py-2 font-medium transition-shadow',
          recording ? 'border-line-strong bg-surface text-fg-2 shadow-ring' : 'border-line bg-surface text-fg hover:bg-hover'
        )}
      >
        {recording ? t('set.recording') : prettyHotkey(value).join(' + ')}
      </button>
      {error && <span className="t-caption text-danger">{error}</span>}
    </div>
  )
}
