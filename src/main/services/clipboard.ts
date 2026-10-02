import { ClipboardItem, clipboard } from 'electron'

/** What was on the clipboard before we used it (every MIME type of every item), so it can be put back. */
export type ClipboardSnapshot = Array<Record<string, Blob>>

export async function snapshotClipboard(): Promise<ClipboardSnapshot | null> {
  try {
    const snap: ClipboardSnapshot = []
    for (const item of await clipboard.read()) {
      const entry: Record<string, Blob> = {}
      for (const type of item.types) {
        if (type === 'electron application/bookmark') continue
        try {
          const value = await item.getType(type)
          if (value instanceof Blob) entry[type] = value
        } catch {
          // A format can disappear between listing and reading — skip it.
        }
      }
      if (Object.keys(entry).length) snap.push(entry)
    }
    return snap.length ? snap : null
  } catch {
    return null
  }
}

export async function restoreClipboard(snap: ClipboardSnapshot | null): Promise<void> {
  if (!snap) {
    clipboard.clear()
    return
  }
  await clipboard.write(snap.map((entry) => new ClipboardItem(entry)))
}
