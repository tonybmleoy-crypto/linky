import { useEffect, useRef, useState } from 'react'
import type { Lang } from '@shared/i18n'
import { DemoScene, STAGE } from './DemoScene'
import { T } from './script'

/** A still frame that tells the story on its own (menu open, link selected). */
export const POSTER_TIME = T.enter1 - 200

/**
 * Plays the demo scene in a loop, scaled to its container. Pauses off-screen and
 * shows a still frame for people who prefer reduced motion.
 */
export function DemoPlayer({ lang, className }: { lang: Lang; className?: string }) {
  const box = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [t, setT] = useState(POSTER_TIME)

  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / STAGE.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const el = box.current
    if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    let visible = false
    let origin = performance.now()
    const tick = (now: number): void => {
      setT((now - origin) % T.duration)
      raf = requestAnimationFrame(tick)
    }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !visible) {
        visible = true
        origin = performance.now()
        raf = requestAnimationFrame(tick)
      } else if (!e.isIntersecting && visible) {
        visible = false
        cancelAnimationFrame(raf)
      }
    })
    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div ref={box} className={className} style={{ aspectRatio: `${STAGE.width} / ${STAGE.height}` }}>
      <div style={{ width: STAGE.width, height: STAGE.height, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <DemoScene t={t} lang={lang} />
      </div>
    </div>
  )
}
