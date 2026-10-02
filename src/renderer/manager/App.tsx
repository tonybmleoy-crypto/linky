import { useEffect, useState, type ReactNode } from 'react'
import { Copy, Minus, Square, X } from 'lucide-react'
import type { ManagerRoute, ResizeEdge } from '@shared/api'
import { useApp } from '../shared/store'
import { useT } from '../shared/i18n'
import { isMac } from '../shared/platform'
import { Logo, cx } from '../shared/ui'
import { Library } from './Library'
import { Onboarding } from './Onboarding'
import { SettingsView } from './Settings'
import { Sidebar, type LibraryFilter } from './Sidebar'

function routeFromHash(): ManagerRoute {
  const r = location.hash.replace(/^#\/?/, '')
  return r === 'settings' || r === 'onboarding' ? r : 'library'
}

export function App() {
  const { library, settings, init } = useApp()
  const [route, setRoute] = useState<ManagerRoute>(routeFromHash)
  const [filter, setFilter] = useState<LibraryFilter>({ type: 'all' })

  useEffect(() => {
    void init()
    return window.linky.onNavigate(setRoute)
  }, [init])

  if (!library || !settings) return <WindowFrame>{null}</WindowFrame>

  if (route === 'onboarding') {
    return (
      <WindowFrame>
        <Onboarding onDone={() => setRoute('library')} />
      </WindowFrame>
    )
  }

  return (
    <WindowFrame>
      <div className="flex min-h-0 flex-1 gap-3 px-3 pb-3">
        <Sidebar
          route={route}
          filter={filter}
          onFilter={(f) => {
            setFilter(f)
            setRoute('library')
          }}
          onSettings={() => setRoute('settings')}
        />
        <main className="flex min-w-0 flex-1 overflow-hidden rounded-2xl bg-surface shadow-low">
          {route === 'settings' ? <SettingsView /> : <Library filter={filter} />}
        </main>
      </div>
    </WindowFrame>
  )
}

/**
 * The window itself: rounded corners (the BrowserWindow is transparent), a draggable title bar
 * with our own controls, and invisible edge handles for resizing.
 */
function WindowFrame({ children }: { children: ReactNode }) {
  const t = useT()
  const [maximized, setMaximized] = useState(false)
  useEffect(() => window.linky.onWindowState((s) => setMaximized(s.maximized)), [])

  return (
    <div
      className={cx(
        'relative flex h-full flex-col overflow-hidden bg-canvas',
        // macOS draws its own rounded corners; on Windows the transparent window needs ours.
        !maximized && !isMac && 'rounded-[22px] border border-line'
      )}
    >
      <header
        className={cx('drag relative z-10 flex h-[52px] shrink-0 items-center justify-between pr-2', isMac ? 'pl-[92px]' : 'pl-6')}
        onDoubleClick={isMac ? undefined : () => void window.linky.windowControl('maximize')}
      >
        <Logo />
        <div className={cx('no-drag flex items-center gap-0.5', isMac && 'hidden')}>
          <WindowButton label={t('win.minimize')} onClick={() => void window.linky.windowControl('minimize')}>
            <Minus size={15} strokeWidth={1.5} />
          </WindowButton>
          <WindowButton
            label={maximized ? t('win.restore') : t('win.maximize')}
            onClick={() => void window.linky.windowControl('maximize')}
          >
            {maximized ? <Copy size={13} strokeWidth={1.5} className="-scale-x-100" /> : <Square size={12} strokeWidth={1.5} />}
          </WindowButton>
          <WindowButton label={t('win.close')} danger onClick={() => void window.linky.windowControl('close')}>
            <X size={15} strokeWidth={1.5} />
          </WindowButton>
        </div>
      </header>
      {children}
      {!maximized && !isMac && <ResizeHandles />}
    </div>
  )
}

function WindowButton({ label, danger, onClick, children }: { label: string; danger?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cx(
        'inline-flex size-9 items-center justify-center rounded-full text-fg-2 transition-colors',
        danger ? 'hover:bg-danger hover:text-white' : 'hover:bg-glass-tint hover:text-fg'
      )}
    >
      {children}
    </button>
  )
}

const HANDLES: Array<{ edge: ResizeEdge; className: string }> = [
  { edge: 'n', className: 'top-0 left-4 right-4 h-1.5 cursor-ns-resize' },
  { edge: 's', className: 'bottom-0 left-4 right-4 h-1.5 cursor-ns-resize' },
  { edge: 'w', className: 'left-0 top-4 bottom-4 w-1.5 cursor-ew-resize' },
  { edge: 'e', className: 'right-0 top-4 bottom-4 w-1.5 cursor-ew-resize' },
  { edge: 'nw', className: 'top-0 left-0 size-4 cursor-nwse-resize' },
  { edge: 'se', className: 'bottom-0 right-0 size-4 cursor-nwse-resize' },
  { edge: 'ne', className: 'top-0 right-0 size-4 cursor-nesw-resize' },
  { edge: 'sw', className: 'bottom-0 left-0 size-4 cursor-nesw-resize' }
]

/** Main follows the cursor while the button is held; pointer capture keeps the release event ours. */
function ResizeHandles() {
  return (
    <>
      {HANDLES.map(({ edge, className }) => (
        <div
          key={edge}
          className={cx('no-drag absolute z-20', className)}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            void window.linky.resizeWindow(edge)
          }}
          onPointerUp={() => void window.linky.resizeWindow(null)}
          onLostPointerCapture={() => void window.linky.resizeWindow(null)}
        />
      ))}
    </>
  )
}
