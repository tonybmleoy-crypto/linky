import Fuse from 'fuse.js'
import type { Snippet } from './model'

const HOUR = 60 * 60 * 1000

/** Usage weight: frequent and recent snippets float up. Pure so it can be unit-tested. */
export function frecency(s: Pick<Snippet, 'useCount' | 'lastUsedAt'>, now = Date.now()): number {
  const frequency = Math.log2(1 + s.useCount)
  if (s.lastUsedAt == null) return frequency
  const ageHours = Math.max(0, (now - s.lastUsedAt) / HOUR)
  // Halves roughly every 3 days.
  const recency = 2 * Math.pow(0.5, ageHours / 72)
  return frequency + recency
}

/** Order used when the query is empty: pinned (manual order) → by frecency → newest. */
export function sortForPalette(snippets: Snippet[], now = Date.now()): Snippet[] {
  return [...snippets].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    if (a.pinned && b.pinned) return a.order - b.order
    const diff = frecency(b, now) - frecency(a, now)
    if (Math.abs(diff) > 1e-9) return diff
    return b.createdAt - a.createdAt
  })
}

export function searchSnippets(snippets: Snippet[], query: string, now = Date.now()): Snippet[] {
  const q = query.trim()
  if (!q) return sortForPalette(snippets, now)
  const fuse = new Fuse(snippets, {
    keys: [
      { name: 'title', weight: 0.7 },
      { name: 'content', weight: 0.3 }
    ],
    includeScore: true,
    ignoreLocation: true,
    threshold: 0.4
  })
  return fuse
    .search(q)
    .map((r) => ({ s: r.item, score: (1 - (r.score ?? 1)) * 10 + frecency(r.item, now) * 0.5 + (r.item.pinned ? 0.5 : 0) }))
    .sort((a, b) => b.score - a.score)
    .map((r) => r.s)
}
