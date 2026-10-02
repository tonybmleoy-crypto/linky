/* Components from the Figma library (Components page). Names match the Figma component names. */
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link as LinkIcon, TextAlignStart, type LucideIcon } from 'lucide-react'
import type { FolderColor, Snippet } from '@shared/model'

export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

// ---- Kbd ----
export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cx('t-kbd inline-flex min-w-[22px] items-center justify-center rounded-full bg-glass-tint px-2 py-0.5 text-fg-2', className)}>
      {children}
    </span>
  )
}

export function Keycap({ children, pressed }: { children: ReactNode; pressed?: boolean }) {
  return (
    <span
      className={cx(
        'inline-flex min-w-[68px] items-center justify-center rounded-xl px-5 py-3.5 text-[22px] font-semibold tracking-tight transition-all duration-150',
        pressed
          ? 'translate-y-[3px] bg-ink text-on-ink'
          : 'border border-line bg-surface text-fg shadow-[0_4px_0_rgb(0_0_0/0.08),0_10px_20px_-4px_rgb(0_0_0/0.06)]'
      )}
    >
      {children}
    </span>
  )
}

// ---- Button ----
type ButtonVariant = 'primary' | 'secondary' | 'glass' | 'ghost' | 'danger'
const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-ink text-on-ink hover:opacity-90',
  secondary: 'bg-surface text-fg border border-line hover:bg-hover',
  glass: 'bg-glass-strong text-fg border border-glass-stroke backdrop-blur-md',
  ghost: 'text-fg-2 hover:bg-glass-tint hover:text-fg',
  danger: 'text-fg-2 hover:bg-glass-tint hover:text-danger'
}

export function Button({
  variant = 'primary',
  size = 'm',
  icon: Icon,
  trailingIcon: Trailing,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: 'm' | 's'
  icon?: LucideIcon
  trailingIcon?: LucideIcon
}) {
  return (
    <button
      {...rest}
      className={cx(
        'inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap transition-[background,opacity,color] disabled:pointer-events-none disabled:opacity-40',
        size === 'm' ? 't-body-m px-5 py-3' : 't-body-s px-3.5 py-2',
        buttonVariants[variant],
        className
      )}
    >
      {Icon && <Icon size={16} strokeWidth={1.75} className={variant === 'danger' ? 'text-danger' : undefined} />}
      {children}
      {Trailing && <Trailing size={16} strokeWidth={1.75} />}
    </button>
  )
}

// ---- Icon button ----
export function IconButton({
  icon: Icon,
  variant = 'outline',
  size = 'm',
  label,
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: LucideIcon
  variant?: 'solid' | 'outline' | 'glass' | 'ghost'
  size?: 's' | 'm' | 'l'
  label: string
}) {
  const px = { s: 28, m: 36, l: 44 }[size]
  return (
    <button
      {...rest}
      aria-label={label}
      title={label}
      style={{ width: px, height: px }}
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-full transition-colors',
        variant === 'solid' && 'bg-ink text-on-ink',
        variant === 'outline' && 'border border-line text-fg hover:bg-hover',
        variant === 'glass' && 'border border-glass-stroke bg-glass-strong text-fg',
        variant === 'ghost' && 'text-fg-2 hover:bg-glass-tint hover:text-fg',
        className
      )}
    >
      <Icon size={size === 's' ? 14 : size === 'm' ? 16 : 18} strokeWidth={1.75} />
    </button>
  )
}

// ---- Chip ----
export function Chip({ selected, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }) {
  return (
    <button
      {...rest}
      className={cx(
        't-caption shrink-0 rounded-full px-3.5 py-1.5 font-medium transition-colors',
        selected ? 'bg-ink text-on-ink' : 'border border-line bg-glass-strong text-fg hover:bg-hover'
      )}
    >
      {children}
    </button>
  )
}

// ---- Segmented control ----
export function Segmented<T extends string>({
  options,
  value,
  onChange
}: {
  options: Array<{ value: T; label: string }>
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="inline-flex shrink-0 gap-0.5 rounded-full bg-selected p-[3px]">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            't-body-s rounded-full px-3.5 py-1.5 font-medium transition-all',
            o.value === value ? 'bg-raised text-fg shadow-low' : 'text-fg-2 hover:text-fg'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

// ---- Switch ----
export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cx('relative h-6 w-10 shrink-0 rounded-full transition-colors', checked ? 'bg-ink' : 'bg-track')}
    >
      <span
        className={cx(
          'absolute top-0.5 left-0.5 size-5 rounded-full shadow-low transition-transform duration-200',
          // On dark, the "on" track is light, so the knob flips to dark.
          checked ? 'translate-x-4 bg-on-ink' : 'bg-white'
        )}
      />
    </button>
  )
}

// ---- Folder pill / dot ----
export const folderDot: Record<FolderColor, string> = {
  peach: 'var(--dot-peach)',
  rose: 'var(--dot-rose)',
  lilac: 'var(--dot-lilac)',
  mint: 'var(--dot-mint)',
  sky: 'var(--dot-sky)'
}
export const folderTile: Record<FolderColor, string> = {
  peach: 'bg-peach',
  rose: 'bg-rose',
  lilac: 'bg-lilac',
  mint: 'bg-mint',
  sky: 'bg-sky'
}

export function FolderPill({ name, color, outline }: { name: string; color: FolderColor; outline?: boolean }) {
  return (
    <span className={cx('inline-flex min-w-0 items-center gap-1.5 text-fg-2', outline ? 't-caption rounded-full border border-line px-2.5 py-1 font-medium' : 't-body-s')}>
      <span className="size-[7px] shrink-0 rounded-full" style={{ background: folderDot[color] }} />
      <span className="truncate">{name}</span>
    </span>
  )
}

// ---- Snippet tile ----
export function SnippetTile({ kind, color, size = 'm' }: { kind: Snippet['kind']; color: FolderColor | null; size?: 's' | 'm' | 'l' }) {
  const Icon = kind === 'link' ? LinkIcon : TextAlignStart
  const px = { s: 28, m: 40, l: 56 }[size]
  return (
    <span
      style={{ width: px, height: px }}
      className={cx('inline-flex shrink-0 items-center justify-center rounded-full text-fg', color ? folderTile[color] : 'bg-selected')}
    >
      <Icon size={{ s: 14, m: 16, l: 22 }[size]} strokeWidth={1.75} />
    </span>
  )
}

// ---- Number badge ----
export function NumberBadge({ n }: { n: number }) {
  return (
    <span className="t-caption inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-line bg-glass-strong font-medium text-fg-2">
      {n}
    </span>
  )
}

// ---- Logo ----
export function Logo() {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="inline-flex size-7 items-center justify-center rounded-full bg-ink text-on-ink">
        <LinkIcon size={15} strokeWidth={2} />
      </span>
      <span className="t-heading-m">linky</span>
    </span>
  )
}

// ---- Field ----
export function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="t-caption mb-1.5 block font-medium text-fg-2">{children}</span>
}

export const inputClass =
  't-body-m w-full rounded-lg border border-line bg-surface px-3.5 py-3 text-fg placeholder:text-fg-3 outline-none transition-shadow focus:border-line-strong focus:shadow-ring'

// ---- Toast ----
export function Toast({ children, icon: Icon }: { children: ReactNode; icon: LucideIcon }) {
  return (
    <div className="t-body-s inline-flex items-center gap-2.5 rounded-full bg-ink py-2 pr-[18px] pl-2 font-medium text-on-ink shadow-popover">
      <span className="inline-flex size-7 items-center justify-center rounded-full bg-success text-white">
        <Icon size={14} strokeWidth={2.25} />
      </span>
      {children}
    </div>
  )
}
