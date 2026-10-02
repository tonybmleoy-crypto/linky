import { describe, expect, it } from 'vitest'
import { detectKind, displayContent, type Snippet } from '@shared/model'
import { frecency, searchSnippets, sortForPalette } from '@shared/ranking'

const NOW = 1_800_000_000_000
const HOUR = 3_600_000

function snippet(over: Partial<Snippet>): Snippet {
  return {
    id: over.title ?? Math.random().toString(36),
    title: '',
    content: 'x',
    kind: 'text',
    folderId: null,
    pinned: false,
    order: 0,
    useCount: 0,
    lastUsedAt: null,
    createdAt: NOW - 1000,
    updatedAt: NOW - 1000,
    ...over
  }
}

describe('frecency', () => {
  it('prefers recent use over old use with the same count', () => {
    const recent = frecency({ useCount: 5, lastUsedAt: NOW - HOUR }, NOW)
    const old = frecency({ useCount: 5, lastUsedAt: NOW - 30 * 24 * HOUR }, NOW)
    expect(recent).toBeGreaterThan(old)
  })
})

describe('sortForPalette', () => {
  it('puts pinned first in manual order, then by usage', () => {
    const list = [
      snippet({ title: 'used', useCount: 20, lastUsedAt: NOW - HOUR }),
      snippet({ title: 'pin-b', pinned: true, order: 2 }),
      snippet({ title: 'never' }),
      snippet({ title: 'pin-a', pinned: true, order: 1 })
    ]
    expect(sortForPalette(list, NOW).map((s) => s.title)).toEqual(['pin-a', 'pin-b', 'used', 'never'])
  })
})

describe('searchSnippets', () => {
  const list = [
    snippet({ title: 'Portfolio', content: 'https://behance.net/tony' }),
    snippet({ title: 'GitHub', content: 'https://github.com/tony' }),
    snippet({ title: 'Quick reply', content: 'Thanks! I will get back to you.' })
  ]

  it('matches titles fuzzily', () => {
    expect(searchSnippets(list, 'portf', NOW)[0].title).toBe('Portfolio')
  })

  it('matches content too', () => {
    expect(searchSnippets(list, 'behance', NOW)[0].title).toBe('Portfolio')
  })

  it('returns everything for an empty query', () => {
    expect(searchSnippets(list, '  ', NOW)).toHaveLength(3)
  })
})

describe('detectKind / displayContent', () => {
  it.each([
    ['https://example.com', 'link'],
    ['github.com/tony', 'link'],
    ['mailto:me@example.com', 'link'],
    ['Thanks, talk soon!', 'text'],
    ['hello', 'text']
  ])('%s → %s', (input, kind) => {
    expect(detectKind(input)).toBe(kind)
  })

  it('strips protocol and www for display', () => {
    expect(displayContent({ kind: 'link', content: 'https://www.behance.net/tony/' })).toBe('behance.net/tony')
  })
})
