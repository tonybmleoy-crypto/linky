/*
 * demo.html — the product demo on its own.
 *   ?lang=ru            pick the language (default en)
 *   ?capture            frame-by-frame mode for scripts/render-demo.cjs (window.__demo)
 */
import './platform-env'
import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import './site.css'
import type { Lang } from '@shared/i18n'
import { DemoScene } from './demo/DemoScene'
import { DemoPlayer } from './demo/DemoPlayer'
import { T } from './demo/script'

const params = new URLSearchParams(location.search)
const lang: Lang = params.get('lang') === 'ru' ? 'ru' : 'en'

declare global {
  interface Window {
    __demo?: { duration: number; setTime(t: number): Promise<void> }
  }
}

function Capture() {
  const [t, setT] = useState(0)
  window.__demo = {
    duration: T.duration,
    setTime: (next) =>
      new Promise((resolve) => {
        flushSync(() => setT(next))
        // Two frames: one to apply styles, one to paint.
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      })
  }
  return <DemoScene t={t} lang={lang} />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>{params.has('capture') ? <Capture /> : <DemoPlayer lang={lang} className="w-full" />}</StrictMode>
)
