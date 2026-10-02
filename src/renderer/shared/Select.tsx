import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { cx } from './ui'

export interface SelectOption<T extends string> {
  value: T
  label: string
  /** Optional marker before the label, e.g. a folder color dot. */
  leading?: ReactNode
}

/**
 * Dropdown in the app's own style (Figma: popover = surface + Elevation/Popover).
 * Replaces the native <select>, whose OS menu doesn't match the design.
 */
export function Select<T extends string>({
  value,
  options,
  onChange,
  label,
  variant = 'pill',
  align = 'start'
}: {
  value: T
  options: Array<SelectOption<T>>
  onChange: (v: T) => void
  label: string
  /** pill — compact toolbar button; field — full-width form input. */
  variant?: 'pill' | 'field'
  align?: 'start' | 'end'
}) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  const current = options.find((o) => o.value === value) ?? options[0]

  useEffect(() => {
    if (!open) return
    setActive(Math.max(0, options.findIndex((o) => o.value === value)))
    const onDown = (e: MouseEvent): void => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', onDown)
    window.addEventListener('blur', () => setOpen(false), { once: true })
    return () => window.removeEventListener('mousedown', onDown)
  }, [open, options, value])

  const pick = (v: T): void => {
    onChange(v)
    setOpen(false)
  }

  const onKeyDown = (e: React.KeyboardEvent): void => {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault()
        setOpen(true)
      }
      return
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      setOpen(false)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(i + 1, options.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      pick(options[active].value)
    }
  }

  return (
    <div ref={root} className={cx('relative', variant === 'field' && 'w-full')} onKeyDown={onKeyDown}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((o) => !o)}
        className={cx(
          'flex items-center gap-2 text-fg transition-colors',
          variant === 'pill'
            ? 't-body-s rounded-full border border-line bg-surface py-2 pr-3 pl-3.5 font-medium hover:bg-hover'
            : 't-body-m w-full rounded-lg border bg-surface px-3.5 py-3 text-left',
          variant === 'field' && (open ? 'border-line-strong shadow-ring' : 'border-line')
        )}
      >
        {current?.leading}
        <span className="flex-1 truncate">{current?.label}</span>
        <ChevronDown size={15} strokeWidth={1.75} className={cx('shrink-0 text-fg-3 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={label}
          style={{ animation: 'palette-in 120ms cubic-bezier(.2,.8,.2,1)' }}
          className={cx(
            'absolute top-full z-50 mt-1.5 flex max-h-72 min-w-full flex-col gap-0.5 overflow-y-auto rounded-xl border border-line bg-popover p-1.5 shadow-popover',
            align === 'end' ? 'right-0' : 'left-0'
          )}
        >
          {options.map((o, i) => (
            <button
              key={o.value}
              type="button"
              role="option"
              aria-selected={o.value === value}
              onMouseEnter={() => setActive(i)}
              onClick={() => pick(o.value)}
              className={cx(
                't-body-s flex items-center gap-2.5 rounded-lg py-2 pr-2.5 pl-3 text-left whitespace-nowrap text-fg',
                i === active && 'bg-glass-tint'
              )}
            >
              {o.leading}
              <span className="flex-1">{o.label}</span>
              <Check size={14} strokeWidth={2} className={cx('shrink-0', o.value === value ? 'text-fg' : 'invisible')} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
