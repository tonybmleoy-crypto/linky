import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ArrowRight, Check, Clipboard, Clock, CornerDownLeft, Folder, Pin, Plus, Search, ShieldCheck, type LucideIcon } from 'lucide-react'
import type { Lang } from '@shared/i18n'
import { LangContext } from '@renderer/shared/i18n'
import { Kbd, Keycap, Logo, SnippetTile, Toast, cx } from '@renderer/shared/ui'
import { PalettePanel } from '@renderer/palette/PalettePanel'
import { sortForPalette } from '@shared/ranking'
import { COPY, demoLibrary } from '../demo/script'
import { LINKS, SITE_COPY, type SiteCopy } from './copy'

const isMacVisitor = typeof navigator !== 'undefined' && /Mac/i.test(navigator.userAgent)

function initialLang(): Lang {
  const fromUrl = new URLSearchParams(location.search).get('lang')
  if (fromUrl === 'ru' || fromUrl === 'en') return fromUrl
  return navigator.language.toLowerCase().startsWith('ru') ? 'ru' : 'en'
}

export function Landing() {
  const [lang, setLang] = useState<Lang>(initialLang)
  const c = SITE_COPY[lang]

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
      <div className="min-h-screen overflow-x-clip bg-canvas text-fg">
        <Nav c={c} />
        <main>
          <Hero c={c} lang={lang} />
          <Demo c={c} lang={lang} />
          <How c={c} />
          <Features c={c} />
          <Showcase c={c} lang={lang} />
          <Faq c={c} />
          <Cta c={c} />
        </main>
        <Footer c={c} onSwitchLang={switchLang} />
      </div>
    </LangContext.Provider>
  )
}

// ---------------------------------------------------------------- building blocks

function DownloadButtons({ c, onGradient }: { c: SiteCopy; onGradient?: boolean }) {
  const win = (
    <a key="win" href={LINKS.windows} className={btn(isMacVisitor ? 'secondary' : 'primary', onGradient)}>
      {c.hero.windows}
      {!isMacVisitor && <ArrowRight size={16} strokeWidth={1.75} />}
    </a>
  )
  const mac = (
    <a key="mac" href={LINKS.macArm} className={btn(isMacVisitor ? 'primary' : 'secondary', onGradient)}>
      {c.hero.mac}
      {isMacVisitor && <ArrowRight size={16} strokeWidth={1.75} />}
    </a>
  )
  return <div className="flex flex-wrap items-center gap-3">{isMacVisitor ? [mac, win] : [win, mac]}</div>
}

/** `onGradient`: the CTA card is a light island in both themes, so its buttons use fixed colors. */
function btn(kind: 'primary' | 'secondary', onGradient?: boolean): string {
  return cx(
    't-body-m inline-flex items-center gap-2 rounded-full px-5 py-3 font-medium whitespace-nowrap transition-[opacity,background]',
    onGradient
      ? kind === 'primary'
        ? 'bg-[#18181B] text-white hover:opacity-90'
        : 'border border-white/90 bg-white/60 text-[#18181B] backdrop-blur-md hover:bg-white/80'
      : kind === 'primary'
        ? 'bg-ink text-on-ink hover:opacity-90'
        : 'border border-line bg-surface text-fg hover:bg-hover'
  )
}

function SectionHead({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 text-center">
      <p className="t-body-m text-fg-3">{eyebrow}</p>
      <h2 className="t-display-l text-balance max-md:text-[34px] max-md:leading-[40px]">{title}</h2>
      {sub && <p className="t-body-l text-balance text-fg-2">{sub}</p>}
    </div>
  )
}

function Orbs({ className }: { className?: string }) {
  const orb = (style: React.CSSProperties): ReactNode => <span className="absolute rounded-full blur-[120px]" style={style} />
  return (
    <div aria-hidden className={cx('pointer-events-none absolute', className)} style={{ opacity: 'var(--orb-opacity)' }}>
      {orb({ width: 560, height: 560, left: 0, top: 40, background: '#FFB547', opacity: 0.95 })}
      {orb({ width: 400, height: 400, left: 220, top: 280, background: '#FF7A1A', opacity: 0.7 })}
      {orb({ width: 380, height: 380, left: -120, top: 360, background: '#9EC5FF', opacity: 0.85 })}
      {orb({ width: 300, height: 300, left: 360, top: -40, background: '#DED3FF', opacity: 0.9 })}
    </div>
  )
}

// ---------------------------------------------------------------- sections

function Nav({ c }: { c: SiteCopy }) {
  return (
    <header className="sticky top-0 z-30 border-b border-transparent bg-canvas/80 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-[1328px] items-center justify-between px-6 py-5 md:px-14">
        <a href="#" aria-label="Linky">
          <Logo />
        </a>
        <div className="t-body-m hidden items-center gap-9 text-fg-2 md:flex">
          <a href="#how" className="hover:text-fg">{c.nav.how}</a>
          <a href="#features" className="hover:text-fg">{c.nav.features}</a>
          <a href="#faq" className="hover:text-fg">{c.nav.faq}</a>
          <a href={LINKS.repo} className="hover:text-fg">{c.nav.github}</a>
        </div>
        <a href="#download" className="t-body-s rounded-full bg-ink px-4 py-2 font-medium text-on-ink hover:opacity-90">
          {c.nav.download}
        </a>
      </nav>
    </header>
  )
}

function Hero({ c, lang }: { c: SiteCopy; lang: Lang }) {
  const lib = useMemo(() => demoLibrary(COPY[lang]), [lang])
  return (
    <section id="download" className="relative mx-auto grid max-w-[1328px] items-center gap-12 px-6 pt-10 pb-24 md:px-14 lg:grid-cols-[1fr_600px] lg:pt-20">
      <div className="relative z-10 flex flex-col gap-7">
        <span className="t-caption inline-flex w-fit items-center gap-2 rounded-full border border-line bg-glass-strong py-1.5 pr-3.5 pl-1.5 font-medium text-fg-2">
          <span className="rounded-full bg-ink px-2 py-0.5 text-on-ink">New</span>
          {c.hero.badge}
        </span>
        <h1 className="text-[56px] leading-[58px] font-light tracking-[-0.03em] sm:text-[72px] sm:leading-[74px] xl:text-[88px] xl:leading-[90px]">
          {c.hero.title.map((line, i) => (
            <span key={i} className="block">
              {line}
            </span>
          ))}
        </h1>
        <p className="max-w-[480px] text-[19px] leading-[29px] text-fg-2">{c.hero.sub}</p>
        <DownloadButtons c={c} />
        <p className="t-caption text-fg-3">{c.hero.meta}</p>
      </div>

      {/* Static product shot built from the real quick-menu component */}
      <div className="app-ui relative hidden h-[560px] lg:block">
        <Orbs className="-top-10 -left-10 h-[640px] w-[680px]" />
        <PalettePanel
          className="relative mt-10"
          query=""
          folders={lib.folders}
          folderId={null}
          results={sortForPalette(lib.snippets, 2_000_000)}
          selected={0}
          hotkey="Ctrl Alt V"
          empty={false}
          fakeCaret
        />
        <div className="relative mt-8 ml-14">
          <Toast icon={Check}>{COPY[lang].toast1}</Toast>
        </div>
      </div>
    </section>
  )
}

function Demo({ c, lang }: { c: SiteCopy; lang: Lang }) {
  return (
    <section className="mx-auto flex max-w-[1328px] flex-col items-center gap-7 px-4 pb-24 md:px-14">
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="t-body-m text-fg-3">{c.demo.eyebrow}</p>
        <h2 className="t-heading-l text-balance">{c.demo.title}</h2>
      </div>
      <div className="w-full max-w-[1200px] overflow-hidden rounded-[32px] border border-line bg-surface shadow-window max-md:rounded-2xl">
        <DemoVideo lang={lang} />
      </div>
    </section>
  )
}

/**
 * The demo, pre-rendered from the live scene (scripts/render-demo.cjs) — a video decodes on the GPU,
 * which keeps scrolling smooth on any laptop or phone.
 */
function DemoVideo({ lang }: { lang: Lang }) {
  const reduceMotion = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
  return (
    <video
      key={lang}
      // On phones, crop to the middle square — that's where the chat, the menu and the keys are.
      className="block aspect-[16/10] w-full max-md:aspect-square max-md:object-cover"
      width={1600}
      height={1000}
      autoPlay={!reduceMotion}
      muted
      loop
      playsInline
      preload="metadata"
      poster={`media/demo-${lang}-poster.jpg`}
      aria-label={lang === 'ru' ? 'Демонстрация Linky' : 'Linky demo'}
    >
      <source src={`media/demo-${lang}.webm`} type="video/webm" />
      <source src={`media/demo-${lang}.mp4`} type="video/mp4" />
    </video>
  )
}

function How({ c }: { c: SiteCopy }) {
  const visuals: ReactNode[] = [
    <div key="1" className="flex flex-col items-center gap-2.5">
      <span className="t-body-s flex items-center gap-2.5 rounded-full bg-surface py-2 pr-4 pl-2 shadow-low">
        <SnippetTile kind="link" color="peach" size="s" />
        behance.net/tony-design
      </span>
      <Kbd>{c.how.saveHint}</Kbd>
    </div>,
    <div key="2" className="flex items-center gap-2">
      <Keycap pressed>Ctrl</Keycap>
      <Keycap pressed>Alt</Keycap>
      <Keycap>V</Keycap>
    </div>,
    <div key="3" className="flex w-[300px] items-center gap-3 rounded-[22px] bg-raised p-2 shadow-low">
      <SnippetTile kind="link" color="peach" />
      <div className="min-w-0 flex-1">
        <div className="t-body-m font-medium">Portfolio</div>
        <div className="t-caption truncate text-fg-3">behance.net/tony-design</div>
      </div>
      <span className="inline-flex size-9 items-center justify-center rounded-full bg-ink text-on-ink">
        <CornerDownLeft size={15} strokeWidth={1.75} />
      </span>
    </div>
  ]
  return (
    <section id="how" className="mx-auto flex max-w-[1328px] scroll-mt-24 flex-col gap-14 px-6 py-24 md:px-14">
      <SectionHead eyebrow={c.how.eyebrow} title={c.how.title} />
      <div className="grid gap-5 md:grid-cols-3">
        {c.how.steps.map((s, i) => (
          <article key={s.title} className="flex flex-col gap-4 rounded-[28px] bg-surface p-7 shadow-low">
            <div className="app-ui flex h-[180px] items-center justify-center rounded-[20px] bg-sunken">{visuals[i]}</div>
            <span className="t-caption inline-flex size-7 items-center justify-center rounded-full bg-ink font-medium text-on-ink">{i + 1}</span>
            <h3 className="t-heading-m">{s.title}</h3>
            <p className="t-body-m text-fg-2">{s.body}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

const FEATURE_ICONS: Array<[LucideIcon, string]> = [
  [Search, 'bg-sky'],
  [Folder, 'bg-peach'],
  [Pin, 'bg-mint'],
  [Clipboard, 'bg-lilac'],
  [Clock, 'bg-rose'],
  [ShieldCheck, 'bg-sky']
]

function Features({ c }: { c: SiteCopy }) {
  return (
    <section id="features" className="mx-auto flex max-w-[1328px] scroll-mt-24 flex-col gap-14 px-6 pt-10 pb-28 md:px-14">
      <SectionHead eyebrow={c.features.eyebrow} title={c.features.title} sub={c.features.sub} />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {c.features.items.map((f, i) => {
          const [Icon, bg] = FEATURE_ICONS[i]
          return (
            <article key={f.title} className="flex flex-col gap-3.5 rounded-[28px] bg-surface p-7 shadow-low">
              <span className={cx('inline-flex size-11 items-center justify-center rounded-full text-fg', bg)}>
                <Icon size={18} strokeWidth={1.75} />
              </span>
              <h3 className="t-heading-m">{f.title}</h3>
              <p className="t-body-m text-fg-2">{f.body}</p>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function Showcase({ c, lang }: { c: SiteCopy; lang: Lang }) {
  // Always dark: the band contrasts with the page in both themes.
  return (
    <section className="px-3 md:px-6">
      <div className="relative mx-auto flex max-w-[1392px] flex-col items-center gap-14 overflow-hidden rounded-[48px] bg-[#0E0E10] px-6 pt-24 text-[#EDEDF0] dark:bg-[#17171A] dark:ring-1 dark:ring-white/[0.06] max-md:rounded-[28px] md:px-14">
        <span aria-hidden className="absolute top-[45%] left-1/2 h-[520px] w-[760px] -translate-x-1/2 rounded-full bg-[#FF7A1A] opacity-30 blur-[160px]" />
        <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-3 text-center">
          <p className="t-body-m text-[#7E7E87]">{c.showcase.eyebrow}</p>
          <h2 className="t-display-l text-balance max-md:text-[34px] max-md:leading-[40px]">{c.showcase.title}</h2>
          <p className="t-body-l text-balance text-[#A3A3AB]">{c.showcase.sub}</p>
        </div>
        <img
          src={`media/app-${lang}-dark.webp`}
          alt={c.showcase.alt}
          width={1500}
          height={977}
          loading="lazy"
          className="relative -mb-24 w-full max-w-[1100px] rounded-t-[22px] shadow-[0_40px_120px_-20px_rgb(0_0_0/0.8)] ring-1 ring-white/10"
        />
      </div>
    </section>
  )
}

function Faq({ c }: { c: SiteCopy }) {
  return (
    <section id="faq" className="mx-auto flex max-w-[1328px] scroll-mt-24 flex-col gap-12 px-6 pt-48 pb-24 md:px-14">
      <SectionHead eyebrow={c.faq.eyebrow} title={c.faq.title} />
      <div className="mx-auto flex w-full max-w-[820px] flex-col gap-2.5">
        {c.faq.items.map((item, i) => (
          <details key={item.q} open={i === 0} className="group rounded-3xl bg-surface px-7 py-5 open:shadow-low">
            <summary className="t-heading-s flex cursor-pointer list-none items-center justify-between gap-4 [&::-webkit-details-marker]:hidden">
              {item.q}
              <Plus size={18} strokeWidth={1.75} className="shrink-0 text-fg-2 transition-transform group-open:rotate-45" />
            </summary>
            <p className="t-body-m mt-3 text-fg-2">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

function Cta({ c }: { c: SiteCopy }) {
  return (
    <section className="mx-auto max-w-[1328px] px-4 pt-6 pb-28 md:px-14">
      <div className="flex justify-center rounded-[40px] bg-[linear-gradient(90deg,#FFB547,#FF7A1A_55%,#9EC5FF)] px-4 py-16 md:py-20">
        {/* Light in both themes: dark glass over this gradient turns muddy. */}
        <div className="flex max-w-[720px] flex-col items-center gap-5 rounded-[36px] border border-white/90 bg-white/60 px-8 py-12 text-center text-[#18181B] shadow-[inset_0_1.5px_0_rgb(255_255_255/0.9),0_18px_40px_-12px_rgb(0_0_0/0.22)] backdrop-blur-[28px] md:px-16 md:py-14">
          <h2 className="t-display-l text-balance max-md:text-[34px] max-md:leading-[40px]">{c.cta.title}</h2>
          <p className="t-body-l text-balance text-[#18181B]/75">{c.cta.sub}</p>
          <DownloadButtons c={c} onGradient />
        </div>
      </div>
    </section>
  )
}

function Footer({ c, onSwitchLang }: { c: SiteCopy; onSwitchLang: () => void }) {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-[1328px] flex-wrap items-center justify-between gap-6 px-6 pt-7 pb-10 md:px-14">
        <div className="flex items-center gap-4">
          <Logo />
          <span className="t-caption text-fg-3">© 2026 · {c.footer.made}</span>
        </div>
        <div className="t-body-s flex items-center gap-7 text-fg-2">
          <a href={LINKS.repo} className="hover:text-fg">{c.footer.github}</a>
          <a href={LINKS.releases} className="hover:text-fg">{c.footer.releases}</a>
          <button onClick={onSwitchLang} className="hover:text-fg">
            {c.footer.other}
          </button>
        </div>
      </div>
    </footer>
  )
}
