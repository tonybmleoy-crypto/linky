import { ArrowDown, RotateCw } from 'lucide-react'
import { useT } from '../shared/i18n'
import { OFFER_STATUSES, useUpdate } from '../shared/update'

/** Shown in the sidebar when a newer version is out. Nothing installs until the user clicks. */
export function UpdateBanner() {
  const t = useT()
  const u = useUpdate()
  if (!u || !u.version || !OFFER_STATUSES.includes(u.status)) return null

  const install = (): void => void window.linky.installUpdate()
  const button = (label: string, icon: typeof ArrowDown) => {
    const Icon = icon
    return (
      <button onClick={install} className="t-body-s inline-flex w-fit items-center gap-1.5 rounded-full bg-ink px-3.5 py-2 font-medium text-on-ink hover:opacity-90">
        <Icon size={14} strokeWidth={2} />
        {label}
      </button>
    )
  }

  return (
    <div className="mb-2 flex flex-col gap-2.5 rounded-2xl border border-line bg-raised p-4 shadow-low">
      <div className="flex items-center gap-2">
        <span className="size-2 rounded-full bg-warm" />
        <span className="t-heading-s">{t('update.available', { version: u.version })}</span>
      </div>
      <span className="t-caption text-fg-2">{u.status === 'error' ? t('update.error') : t('update.body')}</span>
      {u.status === 'downloading' ? (
        <div className="flex flex-col gap-1.5">
          <div className="h-1.5 overflow-hidden rounded-full bg-track">
            <div className="h-full rounded-full bg-ink transition-[width]" style={{ width: `${u.progress ?? 0}%` }} />
          </div>
          <span className="t-caption text-fg-3">{t('update.downloading', { n: u.progress ?? 0 })}</span>
        </div>
      ) : u.status === 'ready' ? (
        button(t('update.ready'), RotateCw)
      ) : (
        button(u.canInstall ? t('update.install') : t('update.download'), ArrowDown)
      )}
    </div>
  )
}
