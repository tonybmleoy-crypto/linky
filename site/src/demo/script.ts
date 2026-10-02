import type { Lang } from '@shared/i18n'
import type { Folder, Snippet } from '@shared/model'

/** Everything that differs between the English and Russian cut of the demo. */
export interface DemoCopy {
  contact: string
  status: string
  incoming: string[]
  typed1: string
  query1: string
  typed2: string
  pasted: string
  toast1: string
  toast2: string
  snippets: Array<Pick<Snippet, 'title' | 'content' | 'kind'> & { folder: string }>
  folders: string[]
}

const en: DemoCopy = {
  contact: 'Anna Petrova',
  status: 'online',
  incoming: ['Hey! Loved your talk yesterday 👋', 'Could you send me your portfolio? And a link to book a call.'],
  typed1: 'Sure! Here’s my portfolio: ',
  query1: 'port',
  typed2: 'And my calendar: ',
  pasted: 'Pasted',
  toast1: 'Pasted “Portfolio”',
  toast2: 'Pasted “Book a call”',
  folders: ['Work', 'Dev', 'Design', 'Replies'],
  snippets: [
    { title: 'Portfolio', content: 'behance.net/tony-design', kind: 'link', folder: 'Work' },
    { title: 'Book a 30-min call', content: 'cal.com/tony/30min', kind: 'link', folder: 'Work' },
    { title: 'GitHub', content: 'github.com/tony', kind: 'link', folder: 'Dev' },
    { title: 'Quick reply', content: 'Thanks! I’ll get back to you within a day.', kind: 'text', folder: 'Replies' },
    { title: 'Figma prototype', content: 'figma.com/proto/linky-v1', kind: 'link', folder: 'Design' }
  ]
}

const ru: DemoCopy = {
  contact: 'Анна Петрова',
  status: 'в сети',
  incoming: ['Привет! Классное выступление вчера 👋', 'Скинешь портфолио? И ссылку, чтобы записаться на созвон.'],
  typed1: 'Конечно! Вот портфолио: ',
  query1: 'порт',
  typed2: 'А вот календарь: ',
  pasted: 'Вставлено',
  toast1: 'Вставлено «Портфолио»',
  toast2: 'Вставлено «Созвон»',
  folders: ['Работа', 'Код', 'Дизайн', 'Ответы'],
  snippets: [
    { title: 'Портфолио', content: 'behance.net/tony-design', kind: 'link', folder: 'Работа' },
    { title: 'Созвон на 30 минут', content: 'cal.com/tony/30min', kind: 'link', folder: 'Работа' },
    { title: 'GitHub', content: 'github.com/tony', kind: 'link', folder: 'Код' },
    { title: 'Быстрый ответ', content: 'Спасибо! Отвечу в течение дня.', kind: 'text', folder: 'Ответы' },
    { title: 'Прототип в Figma', content: 'figma.com/proto/linky-v1', kind: 'link', folder: 'Дизайн' }
  ]
}

export const COPY: Record<Lang, DemoCopy> = { en, ru }

const COLORS: Folder['color'][] = ['peach', 'sky', 'rose', 'lilac']

/** Turns the copy into the same data shapes the app uses, so the real components render it. */
export function demoLibrary(copy: DemoCopy): { folders: Folder[]; snippets: Snippet[] } {
  const folders = copy.folders.map((name, i) => ({ id: `f${i}`, name, color: COLORS[i], order: i }))
  const byName = new Map(folders.map((f) => [f.name, f.id]))
  const snippets = copy.snippets.map((s, i) => ({
    ...s,
    id: `s${i}`,
    folderId: byName.get(s.folder) ?? null,
    pinned: i < 2,
    order: i,
    useCount: 20 - i * 3,
    lastUsedAt: 1_000_000 - i,
    createdAt: i,
    updatedAt: i
  }))
  return { folders, snippets }
}

/*
 * Timeline in milliseconds. The scene is a pure function of time, so it can play live
 * or be rendered frame by frame into a video.
 */
export const T = {
  type1: 600,
  hotkey1: 2300,
  open1: 2550,
  query1: 3050,
  enter1: 3950,
  paste1: 4100,
  send1: 5300,
  type2: 5900,
  hotkey2: 7300,
  open2: 7550,
  select2: 8150,
  key2: 8500,
  paste2: 8650,
  send2: 9800,
  end: 12500,
  duration: 13000
} as const

export const CHAR_MS = 48
export const QUERY_CHAR_MS = 170
