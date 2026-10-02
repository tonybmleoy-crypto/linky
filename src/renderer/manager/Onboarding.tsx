import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import { useApp } from '../shared/store'
import { prettyHotkey } from '../shared/format'
import { useT } from '../shared/i18n'
import { MOD, isMac } from '../shared/platform'
import { usePastePermission } from './Settings'
import { Button, Keycap, SnippetTile, cx } from '../shared/ui'

const STEPS = 3

export function Onboarding({ onDone }: { onDone: () => void }) {
  const t = useT()
  const [step, setStep] = useState(0)
  const finish = async (): Promise<void> => {
    await window.linky.updateSettings({ onboardingDone: true })
    onDone()
  }

  return (
    <div className="relative flex min-h-0 flex-1 items-center justify-center p-6 pt-0">
      <Orbs />
      <div className="glass-panel relative flex h-[560px] max-h-full w-full max-w-[760px] flex-col items-center rounded-[40px] px-14 pt-10 pb-8">
        <div className="flex w-full flex-1 flex-col items-center justify-center text-center">
          {step === 0 && <Welcome />}
          {step === 1 && <TryIt />}
          {step === 2 && <AllSet />}
        </div>
        <div className="flex w-full items-center justify-between">
          <Dots active={step} />
          <div className="flex items-center gap-2">
            {step < STEPS - 1 && (
              <Button variant="ghost" onClick={() => void finish()}>
                {t('onb.skip')}
              </Button>
            )}
            <Button trailingIcon={ArrowRight} onClick={() => (step < STEPS - 1 ? setStep(step + 1) : void finish())}>
              {step === 0 ? t('onb.start') : step < STEPS - 1 ? t('onb.continue') : t('onb.finish')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Welcome() {
  const t = useT()
  return (
    <>
      <p className="t-body-m text-fg-2">{t('onb.welcome')}</p>
      <h1 className="t-display-xl mt-3 mb-4">
        {t('onb.headline1')}
        <br />
        {t('onb.headline2')}
      </h1>
      <p className="t-body-l max-w-[480px] text-fg-2">{t('onb.sub')}</p>
      <div className="mt-8 flex items-center gap-3">
        <FloatingChip rotate={-5} color="peach" kind="link">{t('onb.chip1')}</FloatingChip>
        <FloatingChip rotate={3} color="mint" kind="link">{t('onb.chip2')}</FloatingChip>
        <FloatingChip rotate={-2} color="lilac" kind="text">{t('onb.chip3')}</FloatingChip>
      </div>
    </>
  )
}

function TryIt() {
  const t = useT()
  const { settings, library } = useApp()
  const [value, setValue] = useState(() => t('onb.tryField'))
  const keys = prettyHotkey(settings!.hotkey)
  const [pressed, setPressed] = useState<Set<string>>(new Set())
  const contents = useMemo(() => library!.snippets.map((s) => s.content), [library])
  const success = contents.some((c) => value.includes(c))
  const allowed = usePastePermission()

  // Light up the keycaps while the user holds them.
  useEffect(() => {
    const names = (e: KeyboardEvent): string[] =>
      [e.ctrlKey && (isMac ? '⌃' : 'Ctrl'), e.altKey && (isMac ? '⌥' : 'Alt'), e.shiftKey && (isMac ? '⇧' : 'Shift'), e.metaKey && (isMac ? '⌘' : 'Win'), /^Key[A-Z]$/.test(e.code) && e.code.slice(3)].filter(Boolean) as string[]
    const down = (e: KeyboardEvent): void => setPressed(new Set(names(e)))
    const up = (): void => setPressed(new Set())
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', up)
    }
  }, [])

  return (
    <>
      <p className="t-body-m text-fg-2">{t('onb.step', { n: 2, total: STEPS })}</p>
      <h1 className="t-display-l mt-2 mb-2">{success ? t('onb.tryDone') : t('onb.tryTitle')}</h1>
      <p className="t-body-l text-fg-2">{success ? t('onb.tryDoneBody') : t('onb.tryBody')}</p>
      <div className="my-8 flex items-center gap-3">
        {keys.map((k, i) => (
          <span key={k} className="flex items-center gap-3">
            {i > 0 && <span className="t-heading-m text-fg-3">+</span>}
            <Keycap pressed={pressed.has(k)}>{k}</Keycap>
          </span>
        ))}
      </div>
      <div
        className={cx(
          'flex w-[500px] items-center rounded-full border-[1.5px] bg-raised py-2 pr-2 pl-5 transition-shadow',
          success ? 'border-success' : 'border-line-strong shadow-ring'
        )}
      >
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="t-body-l min-w-0 flex-1 bg-transparent text-fg outline-none"
          onFocus={(e) => e.currentTarget.setSelectionRange(value.length, value.length)}
        />
        <span className={cx('inline-flex size-9 items-center justify-center rounded-full', success ? 'bg-success text-white' : 'bg-ink text-on-ink')}>
          {success ? <Check size={16} strokeWidth={2.25} /> : <ArrowRight size={16} strokeWidth={1.75} />}
        </span>
      </div>
      {isMac && !allowed ? (
        <div className="mt-4 flex max-w-[500px] items-center gap-3 text-left">
          <p className="t-caption flex-1 text-fg-2">{t('perm.needed')}</p>
          <Button size="s" onClick={() => void window.linky.requestPastePermission()}>
            {t('perm.allow')}
          </Button>
        </div>
      ) : (
        <p className="t-caption mt-3.5 text-fg-3">{t('onb.tryHint')}</p>
      )}
    </>
  )
}

function AllSet() {
  const t = useT()
  const hotkey = prettyHotkey(useApp((s) => s.settings!.hotkey)).join(' + ')
  const tips: Array<[string, string]> = [
    ['1 – 9', t('onb.trick1')],
    ['Tab', t('onb.trick2')],
    [`${MOD} N`, t('onb.trick3')]
  ]
  return (
    <>
      <p className="t-body-m text-fg-2">{t('onb.step', { n: 3, total: STEPS })}</p>
      <h1 className="t-display-l mt-2 mb-2">{t('onb.tricks')}</h1>
      <p className="t-body-l mb-8 text-fg-2">{t('onb.tricksBody', { hotkey })}</p>
      <div className="flex w-[520px] flex-col gap-2">
        {tips.map(([k, text]) => (
          <div key={k} className="flex items-center gap-4 rounded-2xl bg-raised px-4 py-3 text-left shadow-low">
            <span className="t-kbd min-w-[64px] rounded-full bg-glass-tint px-2.5 py-1 text-center text-fg">{k}</span>
            <span className="t-body-m text-fg">{text}</span>
          </div>
        ))}
      </div>
    </>
  )
}

function FloatingChip({ children, rotate, color, kind }: { children: ReactNode; rotate: number; color: 'peach' | 'mint' | 'lilac'; kind: 'link' | 'text' }) {
  return (
    <span style={{ transform: `rotate(${rotate}deg)` }} className="t-body-m inline-flex items-center gap-2.5 rounded-full bg-raised py-1.5 pr-4 pl-1.5 font-medium shadow-low">
      <SnippetTile kind={kind} color={color} size="s" />
      {children}
    </span>
  )
}

function Dots({ active }: { active: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: STEPS }, (_, i) => (
        <span key={i} className={cx('h-1.5 rounded-full transition-all', i === active ? 'w-6 bg-ink' : 'w-1.5 bg-fg-3/40')} />
      ))}
    </div>
  )
}

/** The blurred color fields from the design — they're what makes the glass visible. Dimmed on dark. */
function Orbs() {
  const orb = (style: CSSProperties): ReactNode => <span className="absolute rounded-full blur-[110px]" style={style} />
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0" style={{ opacity: 'var(--orb-opacity)' }}>
      {orb({ width: 520, height: 520, left: '28%', top: '-6%', background: '#FFB547', opacity: 0.85 })}
      {orb({ width: 400, height: 400, left: '46%', top: '24%', background: '#FF7A1A', opacity: 0.6 })}
      {orb({ width: 360, height: 360, left: '18%', top: '44%', background: '#9EC5FF', opacity: 0.8 })}
      {orb({ width: 300, height: 300, left: '62%', top: '2%', background: '#DED3FF', opacity: 0.9 })}
    </div>
  )
}
