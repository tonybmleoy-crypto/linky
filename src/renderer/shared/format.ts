import type { Lang, Translate } from '@shared/i18n'
import { isMac } from './platform'

const MAC_KEYS: Record<string, string> = { Control: '⌃', Alt: '⌥', Option: '⌥', Shift: '⇧', Super: '⌘', Meta: '⌘', Command: '⌘', Cmd: '⌘' }

/** "Control+Alt+V" → ["Ctrl", "Alt", "V"] on Windows, ["⌃", "⌥", "V"] on macOS. */
export function prettyHotkey(acc: string): string[] {
  const parts = acc.replace(/CommandOrControl|CmdOrCtrl/g, isMac ? 'Command' : 'Control').split('+')
  if (isMac) return parts.map((p) => MAC_KEYS[p] ?? p)
  return parts.map((p) => (p === 'Control' ? 'Ctrl' : p === 'Super' || p === 'Meta' ? 'Win' : p))
}

export function relativeTime(ts: number | null, t: Translate, lang: Lang, now = Date.now()): string {
  if (ts == null) return t('time.never')
  const s = Math.round((now - ts) / 1000)
  if (s < 60) return t('time.now')
  const m = Math.round(s / 60)
  if (m < 60) return t('time.minutes', { n: m })
  const h = Math.round(m / 60)
  if (h < 24) return t('time.hours', { n: h })
  const d = Math.round(h / 24)
  if (d === 1) return t('time.yesterday')
  if (d < 7) return t('time.days', { n: d })
  return shortDate(ts, lang)
}

/** "2h", "3 д" — for the compact stat in the inspector. */
export function elapsedShort(ts: number, t: Translate, now = Date.now()): string {
  const m = Math.max(1, Math.round((now - ts) / 60_000))
  if (m < 60) return t('time.short.minutes', { n: m })
  const h = Math.round(m / 60)
  if (h < 24) return t('time.short.hours', { n: h })
  return t('time.short.days', { n: Math.round(h / 24) })
}

export function shortDate(ts: number, lang: Lang): string {
  return new Date(ts).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', { month: 'short', day: 'numeric' })
}

/** Builds an Electron accelerator from a keydown event, or null if it's not a usable combo yet. */
export function acceleratorFromEvent(e: KeyboardEvent): string | null {
  const mods: string[] = []
  if (e.ctrlKey) mods.push('Control')
  if (e.altKey) mods.push('Alt')
  if (e.shiftKey) mods.push('Shift')
  if (e.metaKey) mods.push('Super')
  const key = keyName(e.code)
  if (!key || mods.length === 0) return null
  // Shift alone isn't enough — it would hijack normal typing.
  if (mods.length === 1 && mods[0] === 'Shift') return null
  return [...mods, key].join('+')
}

function keyName(code: string): string | null {
  if (/^Key[A-Z]$/.test(code)) return code.slice(3)
  if (/^Digit\d$/.test(code)) return code.slice(5)
  if (/^F\d{1,2}$/.test(code)) return code
  const map: Record<string, string> = {
    Space: 'Space',
    Backquote: '`',
    Minus: '-',
    Equal: '=',
    BracketLeft: '[',
    BracketRight: ']',
    Backslash: '\\',
    Semicolon: ';',
    Quote: "'",
    Comma: ',',
    Period: '.',
    Slash: '/',
    Insert: 'Insert',
    Home: 'Home',
    End: 'End',
    PageUp: 'PageUp',
    PageDown: 'PageDown'
  }
  return map[code] ?? null
}
