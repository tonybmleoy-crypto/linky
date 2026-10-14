import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { ArrowLeft, ArrowRight, Check, Clipboard, Clock, Folder as FolderIcon, Pin, Plus, Search, ShieldCheck, type LucideIcon } from 'lucide-react'
import type { Lang } from '@shared/i18n'
import type { Folder, FolderColor, Snippet } from '@shared/model'
import { sortForPalette } from '@shared/ranking'
import { LangContext } from '@renderer/shared/i18n'
import { Kbd, Keycap, Logo, SnippetTile, Toast, buttonClass, chipClass, cx } from '@renderer/shared/ui'
import { PalettePanel, PaletteRow } from '@renderer/palette/PalettePanel'
import { COPY, demoLibrary } from '../demo/script'
import { LINKS, SITE_COPY, type HeadingLine, type Pill, type SiteCopy, type UseCase } from './copy'
import { reduceMotion, useActiveSection, useDragScroll, useHideOnScroll, useInView, useReveal } from './motion'

/*
 * Landing v2 (Figma: Landing page → "Landing v2 — Desktop", built from the Marketing components).
 * The page is dark; the "How it works" and "Who it's for" sheets are light. Like the Figma frames,
 * sections force a color mode with .theme-dark / .theme-light instead of following the OS theme.
 */

const isMacVisitor = typeof navigator !== 'undefined' && /Mac/i.test(navigator.userAgent)
// Every section, so the highlight clears over blocks without a nav item (the demo, the download CTA).
const SECTIONS = ['top', 'how', 'demo', 'features', 'uses', 'faq', 'download']
const GUTTER = 'px-5 md:px-10'

function initialLang(): Lang {
  const fromUrl = new URLSearchParams(location.search).get('lang')
  if (fromUrl === 'ru' || fromUrl === 'en') return fromUrl
  return navigator.language.toLowerCase().startsWith('ru') ? 'ru' : 'en'
}

export function Landing() {
  const [lang, setLang] = useState<Lang>(initialLang)
  const c = SITE_COPY[lang]
  useReveal(lang)

  useEffect(() => {
    document.documentElement.lang = lang
    document.title = c.metaTitle
    document.querySelector('meta[name="description"]')?.setAttribute('content', c.metaDescription)
  }, [lang, c])

  const switchLang = (): void => {
    const next: Lang = lang === 'en' ? 'ru' : 'en'
    setLang(next)
    const url = new URL(location.href)
    url.searchParams.set('lang', next)
    history.replaceState(null, '', url)
  }

  return (
    <LangContext.Provider value={lang}>
      <div className="theme-dark min-h-screen overflow-x-clip bg-sunken text-fg">
        <Nav c={c} />
        <main>
          <Hero c={c} lang={lang} />
          <How c={c} lang={lang} />
          <Present c={c} lang={lang} />
          <Features c={c} />
          <Uses c={c} />
          <Faq c={c} />
          <Cta c={c} />
        </main>
        <Footer c={c} onSwitchLang={switchLang} />
      </div>
    </LangContext.Provider>
  )
}

// ---------------------------------------------------------------- building blocks

function DownloadButtons({ c }: { c: SiteCopy }) {
  const win = (
    <a key="win" href={LINKS.windows} className={buttonClass(isMacVisitor ? 'glass' : 'primary', 'l', 'press')}>
      {c.hero.windows}
    </a>
  )
  const mac = (
    <a key="mac" href={LINKS.macArm} className={buttonClass(isMacVisitor ? 'primary' : 'glass', 'l', 'press')}>
      {c.hero.mac}
    </a>
  )
  return <div className="flex flex-wrap items-center gap-3">{isMacVisitor ? [mac, win] : [win, mac]}</div>
}

/** Big heading revealed line by line; lines can be dimmed and carry an inline pill. */
function Lines({ lines, className, as: Tag = 'h2' }: { lines: Array<string | HeadingLine>; className: string; as?: 'h1' | 'h2' }) {
  return (
    <Tag className={cx(className, 'flex flex-col', lines.some((l) => typeof l !== 'string' && l.pill) && 'lg:gap-3')}>
      {lines.map((l, i) => {
        const line = typeof l === 'string' ? { text: l } : l
        return (
          <span key={i} className="flex items-center gap-4 overflow-clip pb-[0.06em]">
            <span data-reveal="line" style={{ '--i': i } as CSSProperties} className={cx('block', line.muted && 'text-fg-3', line.pill && 'lg:whitespace-nowrap')}>
              {line.text}
            </span>
            {line.pill && <InlinePill kind={line.pill} delay={i} />}
          </span>
        )
      })}
    </Tag>
  )
}

/** Figma: Marketing/Inline pill. */
function InlinePill({ kind, delay }: { kind: Pill; delay: number }) {
  // The pill sits inside a 72 px heading: reset the inherited type, or the keycaps grow to the line height.
  const base = 'inline-flex h-[84px] shrink-0 items-center gap-2 rounded-full px-6 text-base leading-normal font-normal tracking-normal max-lg:hidden'
  const style = { '--i': delay + 2 } as CSSProperties
  if (kind === 'link')
    return (
      <span aria-hidden data-reveal="pill" style={style} className={cx(base, 'bg-peach')}>
        <SnippetTile kind="link" color="peach" size="l" />
      </span>
    )
  if (kind === 'keys')
    return (
      <span aria-hidden data-reveal="pill" style={style} className={cx(base, 'bg-selected')}>
        {/* Light keycaps on the dark pill, as in Figma: dark-on-dark keys read as holes. */}
        <span className="theme-light flex items-center gap-2">
          <Keycap>Ctrl</Keycap>
          <Keycap>Alt</Keycap>
          <Keycap>V</Keycap>
        </span>
      </span>
    )
  return (
    <span aria-hidden data-reveal="pill" style={style} className={cx(base, 'w-[180px] bg-warm')}>
      <span className="size-full rounded-full bg-[radial-gradient(circle_at_30%_30%,rgb(255_255_255/0.55),transparent_60%)]" />
    </span>
  )
}

/** Soft color glows. Always the light-mode tag colors, like the Figma "Glows" frames. */
/**
 * `area` places the cluster; the outer layer spans the whole section, so the blur is never cut by
 * a box edge. `fadeTop` melts the glows into the section above instead of ending in a straight line.
 */
function Glows({ area, style, fadeTop }: { area: string; style?: CSSProperties; fadeTop?: boolean }) {
  const glow = (cls: string, s: CSSProperties): ReactNode => <span className={cx('glow absolute rounded-full blur-[150px]', cls)} style={s} />
  return (
    <div
      aria-hidden
      className={cx('theme-light pointer-events-none absolute inset-0', fadeTop && '[mask-image:linear-gradient(to_bottom,transparent,black_45%)]')}
    >
      <div className={cx('absolute', area)} style={style}>
        {glow('bg-warm', { width: 620, height: 620, left: '10%', top: '0%', opacity: 0.75 })}
        {glow('bg-lilac', { width: 520, height: 520, left: '40%', top: '40%', opacity: 0.4, animationDelay: '-6s' })}
        {glow('bg-sky', { width: 480, height: 480, left: '-15%', top: '55%', opacity: 0.3, animationDelay: '-12s' })}
        {glow('bg-peach', { width: 420, height: 420, left: '50%', top: '-20%', opacity: 0.6, animationDelay: '-3s' })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- nav

function Nav({ c }: { c: SiteCopy }) {
  const active = useActiveSection(SECTIONS)
  const hidden = useHideOnScroll()
  const items: Array<[string, string]> = [
    ['top', c.nav.home],
    ['how', c.nav.how],
    ['features', c.nav.features],
    ['uses', c.nav.uses],
    ['faq', c.nav.faq]
  ]
  return (
    <header
      className={cx(
        'fixed top-4 left-1/2 z-40 -translate-x-1/2 transition-transform duration-500 ease-[cubic-bezier(.2,.7,.2,1)] md:top-6',
        hidden && '-translate-y-[160%]'
      )}
    >
      {/* Figma: Marketing/Site nav */}
      <nav className="glass-nav flex items-center gap-1 rounded-full border border-glass-stroke bg-glass-strong p-1.5 shadow-glass backdrop-blur-2xl">
        <a href="#top" aria-label="Linky" className="px-3">
          <Logo />
        </a>
        <div className="flex gap-0.5 max-md:hidden">
          {items.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className={cx(
                't-body-s press rounded-full px-3.5 py-2 font-medium whitespace-nowrap',
                active === id ? 'bg-raised text-fg shadow-low' : 'text-fg-2 hover:text-fg'
              )}
            >
              {label}
            </a>
          ))}
        </div>
        <a href="#download" className={buttonClass('primary', 's', 'press ml-1')}>
          {c.nav.download}
        </a>
      </nav>
    </header>
  )
}

// ---------------------------------------------------------------- hero

function Hero({ c, lang }: { c: SiteCopy; lang: Lang }) {
  const lib = useMemo(() => demoLibrary(COPY[lang]), [lang])
  return (
    <section id="top" className="relative flex flex-col justify-end overflow-clip max-xl:pt-28 xl:min-h-[max(100svh,760px)] xl:max-h-[1000px]">
      <Glows area="inset-y-0 right-0 w-[70%] max-xl:w-full" />
      <div aria-hidden className="absolute inset-0 bg-[linear-gradient(35deg,var(--bg-sunken)_25%,transparent_70%)]" />

      {/* Desktop: floats on the right. Below lg it sits above the heading, zoomed to fit the column
          (zoom scales margins too, so the gap above lives on the section). */}
      <div
        data-reveal="float"
        className="relative z-10 mx-auto [zoom:0.55] sm:[zoom:0.8] xl:absolute xl:[zoom:1] xl:top-[150px] xl:right-16"
      >
        <PalettePanel
          query=""
          folders={lib.folders}
          folderId={null}
          results={sortForPalette(lib.snippets, 2_000_000)}
          selected={0}
          hotkey="Ctrl Alt V"
          empty={false}
          fakeCaret
        />
        <div className="mt-6 flex justify-center max-sm:hidden">
          <Toast icon={Check}>{COPY[lang].toast1}</Toast>
        </div>
      </div>

      <div className={cx('relative z-10 flex flex-col gap-7 pt-12 pb-16 xl:max-w-[calc(100%-704px)] xl:pt-32', GUTTER)}>
        <Lines as="h1" lines={c.hero.title} className="t-display-hero max-md:text-[52px] max-md:leading-[54px] xl:max-2xl:text-[80px] xl:max-2xl:leading-[80px]" />
        <p data-reveal="fade" style={{ '--i': 2 } as CSSProperties} className="t-body-xl max-w-[520px] text-fg-2">
          {c.hero.sub}
        </p>
        <div data-reveal="fade" style={{ '--i': 3 } as CSSProperties}>
          <DownloadButtons c={c} />
        </div>
        <p data-reveal="fade" style={{ '--i': 4 } as CSSProperties} className="t-body-m text-fg-3">
          {c.hero.meta}
        </p>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------- how it works

const STEP_TONES: FolderColor[] = ['peach', 'sky', 'lilac']
// Literal class names, so Tailwind generates them.
const TONE_BG: Record<FolderColor, string> = { peach: 'bg-peach', mint: 'bg-mint', sky: 'bg-sky', lilac: 'bg-lilac', rose: 'bg-rose' }

function How({ c, lang }: { c: SiteCopy; lang: Lang }) {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const [touched, setTouched] = useState(false)

  // Like a carousel: without input the cards take turns every 5 seconds.
  useEffect(() => {
    if (paused || touched || reduceMotion() || !matchMedia('(min-width: 1280px)').matches) return
    const t = setInterval(() => setActive((i) => (i + 1) % 3), 5000)
    return () => clearInterval(t)
  }, [paused, touched])

  const media: ReactNode[] = [<SaveMedia key="save" lang={lang} hint={c.how.saveHint} />, <HotkeyMedia key="keys" />, <PastedMedia key="pasted" lang={lang} />]

  return (
    <section id="how" className={cx('theme-light scroll-mt-4 rounded-3xl bg-surface pt-12 pb-10 text-fg', GUTTER)}>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <Lines lines={c.how.title} className="t-display-section max-md:text-[44px] max-md:leading-[46px]" />
        <p data-reveal="fade" className="t-body-xl max-w-[420px] text-fg-2">
          {c.how.sub}
        </p>
      </div>

      {/* Figma: Marketing/Step card (Expanded / Collapsed) */}
      <div data-reveal="fade" className="mt-14 flex gap-4 max-xl:flex-col" onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)}>
        {c.how.steps.map((s, i) => {
          const open = i === active
          return (
            <article
              key={s.title}
              style={{ flexGrow: open ? 1 : 0 }}
              onPointerEnter={() => setActive(i)}
              onClick={() => {
                setActive(i)
                setTouched(true)
              }}
              className={cx(
                'flex min-w-0 cursor-default flex-col gap-6 rounded-2xl p-8 transition-[flex-grow] duration-500 ease-[cubic-bezier(.2,.7,.2,1)] xl:h-[640px] xl:basis-[320px]',
                TONE_BG[STEP_TONES[i]]
              )}
            >
              <div className="flex min-h-[220px] flex-1 items-center justify-center overflow-clip">{media[i]}</div>
              <div className="flex flex-col gap-3.5">
                <span className={cx(chipClass(true), 'w-fit')}>0{i + 1}</span>
                <h3 className={cx('transition-[font-size,line-height] duration-500 max-xl:text-[28px] max-xl:leading-[32px]', open ? 't-heading-xl' : 't-heading-l')}>{s.title}</h3>
                <div className={cx('grid transition-[grid-template-rows,opacity] duration-500', open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 max-xl:grid-rows-[1fr] max-xl:opacity-100')}>
                  <div className="flex min-h-0 flex-wrap items-end justify-between gap-6 overflow-hidden">
                    <p className="t-body-l max-w-[380px] text-fg-2">{s.body}</p>
                    {i === 0 && (
                      <a href="#demo" className={buttonClass('primary', 'l', 'press')}>
                        {c.how.demo}
                        <ArrowRight size={20} strokeWidth={1.75} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

/** A stand-in snippet, shaped like the real ones so the real palette row can render it. */
function fakeSnippet(row: UseCase['row'] | { title: string; content: string; kind: Snippet['kind'] }, folderId: string | null = 'f'): Snippet {
  return { id: row.title, ...row, folderId, pinned: false, order: 0, useCount: 0, lastUsedAt: null, createdAt: 0, updatedAt: 0 }
}
const folderOf = (color: FolderColor): Folder => ({ id: 'f', name: '', color, order: 0 })

/** Figma: Media/Save */
function SaveMedia({ lang, hint }: { lang: Lang; hint: string }) {
  const s = COPY[lang].snippets[0]
  return (
    <div className="flex w-full max-w-[440px] flex-col items-center gap-5">
      <div className="w-full rounded-[22px] shadow-popover">
        <PaletteRow index={0} snippet={fakeSnippet({ title: s.title, content: 'lopatinanton.vercel.app', kind: 'link' })} folder={folderOf('peach')} selected />
      </div>
      <span className="t-body-m flex items-center gap-2 font-medium text-fg-2">
        <Kbd className="bg-surface">Ctrl N</Kbd>
        {hint}
      </span>
    </div>
  )
}

/** Figma: Media/Hotkey */
function HotkeyMedia() {
  return (
    <div className="flex gap-2">
      <Keycap>Ctrl</Keycap>
      <Keycap>Alt</Keycap>
      <Keycap>V</Keycap>
    </div>
  )
}

/** Figma: Media/Pasted */
function PastedMedia({ lang }: { lang: Lang }) {
  return <Toast icon={Check}>{COPY[lang].toast1}</Toast>
}

// ---------------------------------------------------------------- presentation (sticky media)

function Present({ c, lang }: { c: SiteCopy; lang: Lang }) {
  const demoRef = useRef<HTMLDivElement>(null)
  const libRef = useRef<HTMLDivElement>(null)
  const refs = useMemo(() => [demoRef, libRef], [])
  const shown = useInView(refs)

  const video = <DemoVideo lang={lang} label={c.present.demoLabel} />
  const library = <img src={`media/app-${lang}-dark.webp`} alt={c.present.libraryAlt} width={1500} height={977} loading="lazy" className="block size-full object-cover object-left-top" />
  // Side by side only from 1400 px: below that the longest English line plus its pill doesn't fit the column.
  const frame = 'aspect-[16/10] w-full overflow-clip rounded-2xl bg-surface ring-1 ring-line'

  return (
    <section id="demo" className={cx('grid scroll-mt-0 gap-10 py-24 min-[1400px]:grid-cols-[1fr_minmax(0,620px)] lg:py-36', GUTTER)}>
      <div className="flex flex-col">
        <div ref={demoRef} className="flex flex-col justify-center gap-10 min-[1400px]:min-h-[80vh]">
          <Lines lines={c.present.title} className="t-display-section max-md:text-[44px] max-md:leading-[46px]" />
          <p data-reveal="fade" className="t-body-xl max-w-[480px] text-fg-2">
            {c.present.body}
          </p>
          <div data-reveal="fade">
            <a href="#download" className={buttonClass('primary', 'l', 'press w-fit')}>
              {c.present.cta}
              <ArrowRight size={20} strokeWidth={1.75} />
            </a>
          </div>
          <div className={cx(frame, 'min-[1400px]:hidden')}>{video}</div>
        </div>
        <div ref={libRef} className="flex flex-col justify-center gap-10 pt-24 min-[1400px]:min-h-[80vh] min-[1400px]:pt-0">
          <Lines lines={c.present.library.title} className="t-display-section max-md:text-[44px] max-md:leading-[46px]" />
          <p data-reveal="fade" className="t-body-xl max-w-[480px] text-fg-2">
            {c.present.library.body}
          </p>
          <div className={cx(frame, 'min-[1400px]:hidden')}>{library}</div>
        </div>
      </div>

      {/* Sticky media: stays put while the text scrolls and swaps with the block in view. */}
      <div className="max-[1399px]:hidden">
        <div className={cx(frame, 'sticky top-[calc(50vh-194px)] grid')}>
          <div className={cx('col-start-1 row-start-1 transition-opacity duration-700', shown === 0 ? 'opacity-100' : 'opacity-0')}>{video}</div>
          <div className={cx('col-start-1 row-start-1 transition-opacity duration-700', shown === 1 ? 'opacity-100' : 'opacity-0')}>{library}</div>
        </div>
      </div>
    </section>
  )
}

/**
 * The demo, pre-rendered from the live scene (scripts/render-demo.cjs). A video decodes on the GPU,
 * which keeps scrolling smooth on any laptop or phone.
 */
function DemoVideo({ lang, label }: { lang: Lang; label: string }) {
  return (
    <video
      key={lang}
      className="block size-full object-cover"
      width={1600}
      height={1000}
      autoPlay={!reduceMotion()}
      muted
      loop
      playsInline
      preload="metadata"
      poster={`media/demo-${lang}-poster.jpg`}
      aria-label={label}
    >
      <source src={`media/demo-${lang}.webm`} type="video/webm" />
      <source src={`media/demo-${lang}.mp4`} type="video/mp4" />
    </video>
  )
}

// ---------------------------------------------------------------- features carousel

const FEATURE_ICONS: Array<[LucideIcon, FolderColor]> = [
  [Search, 'sky'],
  [FolderIcon, 'mint'],
  [Pin, 'peach'],
  [Clipboard, 'lilac'],
  [Clock, 'rose'],
  [ShieldCheck, 'mint']
]

function Features({ c }: { c: SiteCopy }) {
  const track = useDragScroll<HTMLDivElement>()
  const [edge, setEdge] = useState<{ start: boolean; end: boolean }>({ start: true, end: false })
  const step = (dir: 1 | -1): void => track.current?.scrollBy({ left: dir * 376, behavior: reduceMotion() ? 'auto' : 'smooth' })
  const arrow =
    'press inline-flex size-14 items-center justify-center rounded-full border border-glass-stroke bg-glass-strong text-fg hover:bg-hover disabled:pointer-events-none disabled:opacity-35'

  // The arrows dim at the ends of the track, so it's clear there's nothing more that way.
  useEffect(() => {
    const el = track.current
    if (!el) return
    const update = (): void => setEdge({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth > el.scrollWidth - 8 })
    update()
    el.addEventListener('scroll', update, { passive: true })
    addEventListener('resize', update)
    return () => {
      el.removeEventListener('scroll', update)
      removeEventListener('resize', update)
    }
  }, [track])

  return (
    <section id="features" className="scroll-mt-0 pt-10 pb-24 lg:pb-36">
      <div className={cx('flex items-end justify-between gap-6', GUTTER)}>
        <Lines lines={c.features.title} className="t-display-section max-md:text-[44px] max-md:leading-[46px]" />
        <div className="flex gap-2 max-md:hidden">
          <button className={arrow} disabled={edge.start} onClick={() => step(-1)} aria-label={c.features.prev}>
            <ArrowLeft size={20} strokeWidth={1.75} />
          </button>
          <button className={arrow} disabled={edge.end} onClick={() => step(1)} aria-label={c.features.next}>
            <ArrowRight size={20} strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* Figma: Marketing/Feature card */}
      <div
        ref={track}
        className={cx(
          'theme-light mt-16 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] data-[dragging]:cursor-grabbing data-[dragging]:snap-none data-[dragging]:select-none md:scroll-px-10',
          'cursor-grab scroll-px-5',
          GUTTER
        )}
      >
        {c.features.items.map((f, i) => {
          const [Icon, tone] = FEATURE_ICONS[i]
          return (
            <article
              key={f.title}
              data-reveal="fade"
              style={{ '--i': i } as CSSProperties}
              className="flex w-[min(360px,82vw)] shrink-0 snap-start flex-col gap-5 rounded-lg bg-surface p-7 text-fg"
            >
              <span className={cx('inline-flex size-[52px] items-center justify-center rounded-md', TONE_BG[tone])}>
                <Icon size={24} strokeWidth={1.75} />
              </span>
              <div className="flex flex-col gap-2">
                <h3 className="t-heading-m">{f.title}</h3>
                <p className="t-body-l text-fg-2">{f.body}</p>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

// ---------------------------------------------------------------- who it's for

function Uses({ c }: { c: SiteCopy }) {
  const [big, ...small] = c.uses.items
  return (
    <section id="uses" className={cx('theme-light scroll-mt-4 rounded-3xl bg-canvas pt-12 pb-10 text-fg', GUTTER)}>
      <Lines lines={[c.uses.title]} className="t-display-section max-md:text-[44px] max-md:leading-[46px]" />
      <div className="mt-14 grid gap-4 xl:grid-cols-2">
        <UseCard u={big} size="l" />
        <div className="grid gap-4 sm:grid-cols-2">
          {small.map((u, i) => (
            <UseCard key={u.tag} u={u} size="s" i={i + 1} />
          ))}
        </div>
      </div>
    </section>
  )
}

/** Figma: Marketing/Use case card (L / S) */
function UseCard({ u, size, i = 0 }: { u: UseCase; size: 'l' | 's'; i?: number }) {
  return (
    <div data-reveal="fade" style={{ '--i': i } as CSSProperties} className={cx('flex', size === 'l' && 'h-full')}>
    <article
      className={cx('group flex flex-1 flex-col gap-5 rounded-xl bg-surface p-3 pb-5 transition-transform duration-300 hover:-translate-y-1', size === 'l' ? 'min-h-[480px] xl:h-[646px]' : 'h-[315px]')}
    >
      <div className={cx('relative flex flex-1 items-center justify-center overflow-clip rounded-lg px-4', TONE_BG[u.tone])}>
        <span className={cx(chipClass(false), 'absolute top-4 left-4 bg-surface')}>{u.tag}</span>
        <div className={cx('w-full rounded-[22px] shadow-popover transition-transform duration-500 group-hover:scale-[1.03]', size === 'l' ? 'max-w-[420px]' : 'max-w-[300px]')}>
          {/* Small cards are too narrow for the selected row's "Paste" button, so they show the number key. */}
          <PaletteRow index={i} snippet={fakeSnippet(u.row)} folder={folderOf(u.tone)} selected={size === 'l'} />
        </div>
      </div>
      <div className="flex flex-col gap-2 px-2">
        <h3 className={size === 'l' ? 't-heading-l' : 't-heading-m'}>{u.title}</h3>
        {u.body && <p className="t-body-l text-fg-2">{u.body}</p>}
      </div>
    </article>
    </div>
  )
}

// ---------------------------------------------------------------- faq

function Faq({ c }: { c: SiteCopy }) {
  const [open, setOpen] = useState(0)
  return (
    <section id="faq" className={cx('grid scroll-mt-0 gap-10 py-24 xl:grid-cols-[1fr_minmax(0,820px)] lg:py-36', GUTTER)}>
      <Lines lines={c.faq.title} className="t-display-section max-md:text-[44px] max-md:leading-[46px]" />
      {/* Figma: Marketing/FAQ row */}
      <div className="flex flex-col">
        {c.faq.items.map((item, i) => {
          const isOpen = open === i
          return (
            <div key={item.q} data-reveal="fade" style={{ '--i': i } as CSSProperties} className="border-b border-line py-7">
              <button onClick={() => setOpen(isOpen ? -1 : i)} aria-expanded={isOpen} className="t-heading-l flex w-full items-center justify-between gap-6 text-left transition-opacity active:opacity-60 max-md:text-[22px] max-md:leading-[28px]">
                {item.q}
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-glass-stroke bg-glass-strong">
                  <Plus size={16} strokeWidth={1.75} className={cx('transition-transform duration-300', isOpen && 'rotate-45')} />
                </span>
              </button>
              <div className={cx('grid transition-[grid-template-rows,opacity] duration-500', isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}>
                {/* Padding lives inside the clipped box: on the 0fr row it would still take 16 px. */}
                <div className="min-h-0 overflow-hidden">
                  <p className="t-body-xl max-w-[720px] pt-4 text-fg-2">{item.a}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

// ---------------------------------------------------------------- cta + footer

function Cta({ c }: { c: SiteCopy }) {
  const ref = useRef<HTMLElement>(null)
  // The glows lean toward the cursor.
  const onMove = (e: React.PointerEvent): void => {
    if (reduceMotion() || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    ref.current.style.setProperty('--mx', `${((e.clientX - r.left) / r.width - 0.5) * 80}px`)
    ref.current.style.setProperty('--my', `${((e.clientY - r.top) / r.height - 0.5) * 80}px`)
  }
  return (
    <section ref={ref} id="download" onPointerMove={onMove} className="relative flex min-h-[720px] scroll-mt-0 items-end overflow-clip">
      <Glows
        fadeTop
        area="inset-y-0 right-0 w-[60%] transition-transform duration-700 ease-out max-lg:w-full"
        style={{ transform: 'translate(var(--mx, 0), var(--my, 0))' }}
      />
      <div aria-hidden className="absolute inset-0 bg-[linear-gradient(35deg,var(--bg-sunken)_25%,transparent_70%)]" />
      <div className={cx('relative z-10 flex flex-col gap-7 pb-28', GUTTER)}>
        <Lines lines={c.cta.title} className="t-display-hero max-md:text-[52px] max-md:leading-[54px]" />
        <p data-reveal="fade" className="t-body-xl max-w-[520px] text-fg-2">
          {c.cta.sub}
        </p>
        <div data-reveal="fade">
          <DownloadButtons c={c} />
        </div>
      </div>
    </section>
  )
}

function Footer({ c, onSwitchLang }: { c: SiteCopy; onSwitchLang: () => void }) {
  return (
    <footer className={cx('flex flex-wrap items-center justify-between gap-6 border-t border-line py-7', GUTTER)}>
      <Logo />
      <div className="t-body-m flex flex-wrap items-center gap-6 font-medium text-fg-3">
        <span>© 2026 · {c.footer.made}</span>
        <a href={LINKS.repo} className="hover:text-fg">
          {c.footer.github}
        </a>
        <a href={LINKS.releases} className="hover:text-fg">
          {c.footer.releases}
        </a>
        <button onClick={onSwitchLang} className="hover:text-fg">
          {c.footer.other}
        </button>
      </div>
    </footer>
  )
}
