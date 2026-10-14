import { useEffect, useRef, useState, type RefObject } from 'react'

export const reduceMotion = (): boolean => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Scroll reveal: elements marked `data-reveal` get `data-in` once their top rises above 90% of the
 * viewport. The CSS in site.css decides what "revealed" means for each kind (line, pill, fade, float).
 *
 * A position check on scroll, not an IntersectionObserver: a jump to an anchor (or a fast fling)
 * skips whole sections, and an observer never reports an element that went from below the screen
 * to above it. Everything already passed is revealed too. `key` re-scans after a re-render.
 */
export function useReveal(key: unknown): void {
  useEffect(() => {
    // A heading line starts shifted under its mask, so measure the mask (its parent) instead.
    let pending = [...document.querySelectorAll<HTMLElement>('[data-reveal]:not([data-in])')].map((el) => ({
      el,
      box: el.dataset.reveal === 'line' && el.parentElement ? el.parentElement : el
    }))
    let frame = 0
    const check = (): void => {
      frame = 0
      const line = innerHeight * 0.9
      pending = pending.filter(({ el, box }) => {
        if (box.getBoundingClientRect().top > line) return true
        el.setAttribute('data-in', '')
        return false
      })
      if (!pending.length) removeEventListener('scroll', onScroll)
    }
    const onScroll = (): void => {
      frame ||= requestAnimationFrame(check)
    }
    check()
    addEventListener('scroll', onScroll, { passive: true })
    addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(frame)
      removeEventListener('scroll', onScroll)
      removeEventListener('resize', onScroll)
    }
  }, [key])
}

/** Which of the given section ids sits in the middle of the screen. Drives the nav highlight. */
export function useActiveSection(ids: string[]): string {
  const [active, setActive] = useState(ids[0])
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id)
      },
      { rootMargin: '-45% 0px -50% 0px' }
    )
    for (const id of ids) {
      const el = document.getElementById(id)
      if (el) io.observe(el)
    }
    return () => io.disconnect()
  }, [ids])
  return active
}

/** True while the user scrolls down past the hero: the nav slides away, scrolling up brings it back. */
export function useHideOnScroll(): boolean {
  const [hidden, setHidden] = useState(false)
  useEffect(() => {
    let last = scrollY
    const onScroll = (): void => {
      const y = scrollY
      if (Math.abs(y - last) < 6) return
      setHidden(y > last && y > 400)
      last = y
    }
    addEventListener('scroll', onScroll, { passive: true })
    return () => removeEventListener('scroll', onScroll)
  }, [])
  return hidden
}

/** Index of the block (by ref) that is currently in the middle of the screen. */
export function useInView(refs: Array<RefObject<HTMLElement | null>>): number {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          const i = refs.findIndex((r) => r.current === e.target)
          if (i >= 0) setIndex(i)
        }
      },
      { rootMargin: '-40% 0px -40% 0px' }
    )
    refs.forEach((r) => r.current && io.observe(r.current))
    return () => io.disconnect()
  }, [refs])
  return index
}

/** Mouse drag scrolls a horizontal track; touch and trackpads scroll it natively. */
export function useDragScroll<T extends HTMLElement>(): RefObject<T | null> {
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let startX = 0
    let startLeft = 0
    let dragging = false
    const down = (e: PointerEvent): void => {
      if (e.pointerType !== 'mouse') return
      dragging = true
      startX = e.clientX
      startLeft = el.scrollLeft
      el.dataset.dragging = ''
    }
    const move = (e: PointerEvent): void => {
      if (!dragging) return
      el.scrollLeft = startLeft - (e.clientX - startX)
    }
    const up = (): void => {
      dragging = false
      delete el.dataset.dragging
    }
    el.addEventListener('pointerdown', down)
    addEventListener('pointermove', move)
    addEventListener('pointerup', up)
    return () => {
      el.removeEventListener('pointerdown', down)
      removeEventListener('pointermove', move)
      removeEventListener('pointerup', up)
    }
  }, [])
  return ref
}
