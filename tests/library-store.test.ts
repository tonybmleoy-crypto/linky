import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { LibraryStore, emptyLibrary } from '../src/main/store/library-store'

function tempFile(): string {
  return join(mkdtempSync(join(tmpdir(), 'linky-')), 'library.json')
}

describe('LibraryStore', () => {
  it('creates, updates and persists snippets', () => {
    const path = tempFile()
    const store = new LibraryStore(path, emptyLibrary)
    const s = store.createSnippet({ content: ' https://example.com ' })
    expect(s.kind).toBe('link')
    expect(s.content).toBe('https://example.com')

    store.updateSnippet(s.id, { title: 'Example', content: 'just text now' })
    store.flush()

    const reloaded = new LibraryStore(path, emptyLibrary)
    const again = reloaded.getSnippet(s.id)!
    expect(again.title).toBe('Example')
    expect(again.kind).toBe('text')
  })

  it('records usage', () => {
    const store = new LibraryStore(tempFile(), emptyLibrary)
    const s = store.createSnippet({ content: 'hi' })
    store.recordUse(s.id)
    store.recordUse(s.id)
    expect(store.getSnippet(s.id)!.useCount).toBe(2)
    expect(store.getSnippet(s.id)!.lastUsedAt).not.toBeNull()
  })

  it('keeps snippets when their folder is deleted', () => {
    const store = new LibraryStore(tempFile(), emptyLibrary)
    const f = store.createFolder({ name: 'Work' })
    const s = store.createSnippet({ content: 'hi', folderId: f.id })
    expect(store.getSnippet(s.id)!.folderId).toBe(f.id)
    store.deleteFolder(f.id)
    expect(store.getSnippet(s.id)!.folderId).toBeNull()
    expect(store.get().folders).toHaveLength(0)
  })

  it('ignores unknown folder ids', () => {
    const store = new LibraryStore(tempFile(), emptyLibrary)
    expect(store.createSnippet({ content: 'hi', folderId: 'nope' }).folderId).toBeNull()
  })

  it('moves a corrupt file aside instead of crashing', () => {
    const path = tempFile()
    writeFileSync(path, '{ not json')
    const store = new LibraryStore(path, emptyLibrary)
    expect(store.get().snippets).toEqual([])
    store.flush()
    expect(JSON.parse(readFileSync(path, 'utf8')).version).toBe(1)
    expect(readdirSync(join(path, '..')).some((f) => f.includes('.corrupt-'))).toBe(true)
  })
})
