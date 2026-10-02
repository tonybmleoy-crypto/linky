import { useMemo, type CSSProperties, type ReactNode } from 'react'
import { ArrowRight, Check, Minus, Square, X } from 'lucide-react'
import type { Lang } from '@shared/i18n'
import { searchSnippets, sortForPalette } from '@shared/ranking'
import { LangContext } from '@renderer/shared/i18n'
import { Keycap, Toast, cx } from '@renderer/shared/ui'
import { PalettePanel } from '@renderer/palette/PalettePanel'
import { CHAR_MS, COPY, QUERY_CHAR_MS, T, demoLibrary } from './script'

export const STAGE = { width: 1600, height: 1000 }

const clamp = (v: number, a = 0, b = 1): number => Math.min(b, Math.max(a, v))
/** 0→1 over `ms` starting at `start`, eased. */
const ease = (t: number, start: number, ms: number): number => {
  const x = clamp((t - start) / ms)
  return 1 - Math.pow(1 - x, 3)
}
const typed = (text: string, t: number, start: number, perChar: number): string =>
  text.slice(0, clamp(Math.floor((t - start) / perChar), 0, text.length))
const between = (t: number, a: number, b: number): boolean => t >= a && t < b

/** The whole product demo at time `t` (ms). Pure: same `t` → same frame. */
export function DemoScene({ t, lang }: { t: number; lang: Lang }) {
  const copy = COPY[lang]
  const lib = useMemo(() => demoLibrary(copy), [copy])
  const link1 = lib.snippets[0].content
  const link2 = lib.snippets[1].content

  // ---- Chat input
  let input = ''
  if (t < T.send1) {
    input = typed(copy.typed1, t, T.type1, CHAR_MS) + (t >= T.paste1 ? link1 : '')
  } else if (t >= T.type2 && t < T.send2) {
    input = typed(copy.typed2, t, T.type2, CHAR_MS) + (t >= T.paste2 ? link2 : '')
  }
  const sent = [t >= T.send1 && copy.typed1 + link1, t >= T.send2 && copy.typed2 + link2].filter(Boolean) as string[]
  const typing = between(t, T.type1, T.type1 + copy.typed1.length * CHAR_MS) || between(t, T.type2, T.type2 + copy.typed2.length * CHAR_MS)
  const caretOn = typing || Math.floor(t / 530) % 2 === 0

  // ---- Quick menu
  const open1 = between(t, T.open1, T.paste1)
  const open2 = between(t, T.open2, T.paste2)
  const query = open1 ? typed(copy.query1, t, T.query1, QUERY_CHAR_MS) : ''
  const results = useMemo(
    () => (query ? searchSnippets(lib.snippets, query, 2_000_000) : sortForPalette(lib.snippets, 2_000_000)),
    [lib, query]
  )
  const selected = open2 && t >= T.select2 ? 1 : 0
  const openedAt = open1 ? T.open1 : T.open2
  const closesAt = open1 ? T.paste1 : T.paste2
  const appear = ease(t, openedAt, 180)
  const vanish = 1 - ease(t, closesAt - 120, 120)
  const paletteOpacity = open1 || open2 ? Math.min(appear, vanish) : 0

  // ---- Key overlay
  const keys: Array<{ label: string; at: number; until: number }> = [
    { label: 'Ctrl', at: T.hotkey1, until: T.open1 + 350 },
    { label: 'Alt', at: T.hotkey1 + 60, until: T.open1 + 350 },
    { label: 'V', at: T.open1 - 120, until: T.open1 + 200 },
    { label: 'Enter', at: T.enter1, until: T.paste1 + 150 },
    { label: 'Ctrl', at: T.hotkey2, until: T.open2 + 350 },
    { label: 'Alt', at: T.hotkey2 + 60, until: T.open2 + 350 },
    { label: 'V', at: T.open2 - 120, until: T.open2 + 200 },
    { label: '2', at: T.key2, until: T.paste2 + 150 }
  ]
  const overlay = groupKeys(keys, t)

  // ---- Toast
  const toast = between(t, T.paste1 + 80, T.paste1 + 1500) ? copy.toast1 : between(t, T.paste2 + 80, T.paste2 + 1500) ? copy.toast2 : null
  const toastStart = toast === copy.toast1 ? T.paste1 + 80 : T.paste2 + 80
  const toastIn = toast ? Math.min(ease(t, toastStart, 200), 1 - ease(t, toastStart + 1250, 170)) : 0

  // ---- Loop: fade the chat back to its first state at the end
  const fadeOut = 1 - ease(t, T.end, T.duration - T.end)

  return (
    <LangContext.Provider value={lang}>
      <div className="relative overflow-hidden bg-canvas" style={{ width: STAGE.width, height: STAGE.height }}>
        <Wallpaper />

        <div style={{ opacity: fadeOut }}>
          <ChatWindow contact={copy.contact} status={copy.status} incoming={copy.incoming} sent={sent} input={input} caret={caretOn} />
        </div>

        {/* Quick menu, anchored above the chat input like the real one when there's no room below */}
        {paletteOpacity > 0 && (
          <div
            className="absolute"
            style={{
              left: 540,
              bottom: 1000 - 620,
              opacity: paletteOpacity,
              transform: `translateY(${(1 - appear) * 8}px) scale(${0.985 + 0.015 * appear})`,
              transformOrigin: 'bottom left'
            }}
          >
            <PalettePanel
              query={query}
              folders={lib.folders}
              folderId={null}
              results={results}
              selected={selected}
              hotkey="Ctrl Alt V"
              empty={false}
              fakeCaret={open1 && Math.floor(t / 530) % 2 === 0}
            />
          </div>
        )}

        {toast && (
          <div className="absolute" style={{ left: 406, top: 560, opacity: toastIn, transform: `translateY(${(1 - toastIn) * 6}px)` }}>
            <Toast icon={Check}>{toast}</Toast>
          </div>
        )}

        {/* What the user is pressing */}
        <div className="absolute right-0 bottom-10 left-0 flex justify-center" style={{ opacity: overlay.opacity }}>
          <div className="flex items-center gap-3 rounded-[28px] border border-glass-stroke bg-glass-strong px-5 py-4 shadow-glass backdrop-blur-xl">
            {overlay.keys.map((k, i) => (
              <span key={i} className="flex items-center gap-3">
                {i > 0 && <span className="t-heading-m text-fg-3">+</span>}
                <Keycap pressed={k.pressed}>{k.label}</Keycap>
              </span>
            ))}
          </div>
        </div>
      </div>
    </LangContext.Provider>
  )
}

/** Shows the current chord (e.g. Ctrl + Alt + V) while it's being pressed. */
function groupKeys(keys: Array<{ label: string; at: number; until: number }>, t: number) {
  const chords = [keys.slice(0, 3), keys.slice(3, 4), keys.slice(4, 7), keys.slice(7, 8)]
  for (const chord of chords) {
    const start = chord[0].at - 250
    const end = Math.max(...chord.map((k) => k.until)) + 250
    if (between(t, start, end)) {
      const opacity = Math.min(ease(t, start, 160), 1 - ease(t, end - 200, 200))
      return { opacity, keys: chord.map((k) => ({ label: k.label, pressed: between(t, k.at, k.until) })) }
    }
  }
  return { opacity: 0, keys: [] }
}

function Wallpaper() {
  const orb = (style: CSSProperties): ReactNode => <span className="absolute rounded-full blur-[130px]" style={style} />
  return (
    <div aria-hidden className="absolute inset-0" style={{ opacity: 'var(--orb-opacity)' }}>
      {orb({ width: 640, height: 640, left: 820, top: 80, background: '#FFB547', opacity: 0.9 })}
      {orb({ width: 460, height: 460, left: 1080, top: 400, background: '#FF7A1A', opacity: 0.65 })}
      {orb({ width: 460, height: 460, left: 560, top: 520, background: '#9EC5FF', opacity: 0.8 })}
      {orb({ width: 360, height: 360, left: 1200, top: 20, background: '#DED3FF', opacity: 0.9 })}
    </div>
  )
}

function ChatWindow({
  contact,
  status,
  incoming,
  sent,
  input,
  caret
}: {
  contact: string
  status: string
  incoming: string[]
  sent: string[]
  input: string
  caret: boolean
}) {
  return (
    <div className="absolute flex flex-col overflow-hidden rounded-[28px] bg-surface shadow-window" style={{ left: 350, top: 70, width: 900, height: 660 }}>
      <div className="flex items-center justify-between px-7 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <span className="size-10 rounded-full" style={{ background: 'linear-gradient(135deg,#FFB547,#FF7A1A)' }} />
          <div>
            <div className="t-body-m font-semibold text-fg">{contact}</div>
            <div className="t-caption text-success">{status}</div>
          </div>
        </div>
        <div className="flex items-center gap-5 text-fg-3">
          <Minus size={16} strokeWidth={1.5} />
          <Square size={13} strokeWidth={1.5} />
          <X size={16} strokeWidth={1.5} />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2.5 px-7 pt-4">
        {incoming.map((m) => (
          <Bubble key={m}>{m}</Bubble>
        ))}
        {sent.map((m) => (
          <Bubble key={m} mine>
            {m}
          </Bubble>
        ))}
      </div>
      <div className="m-7 flex items-center rounded-full bg-canvas py-2.5 pr-2.5 pl-6">
        <span className="t-body-l flex-1 whitespace-pre text-fg">
          {input}
          <span className={cx('ml-px inline-block h-[22px] w-[1.5px] translate-y-[5px] bg-fg', !caret && 'opacity-0')} />
        </span>
        <span className="inline-flex size-11 items-center justify-center rounded-full bg-ink text-on-ink">
          <ArrowRight size={18} strokeWidth={1.75} />
        </span>
      </div>
    </div>
  )
}

function Bubble({ children, mine }: { children: ReactNode; mine?: boolean }) {
  return (
    <div
      className={cx(
        't-body-l max-w-[460px] rounded-[22px] px-[18px] py-3',
        mine ? 'self-end bg-ink text-on-ink' : 'self-start bg-canvas text-fg'
      )}
    >
      {children}
    </div>
  )
}
