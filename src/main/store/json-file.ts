import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import type { z } from 'zod'

/**
 * A JSON document on disk, validated with zod.
 * Writes are debounced and atomic (temp file + rename), so a crash mid-write
 * never leaves a half-written file behind.
 */
export class JsonFile<T> {
  private timer: NodeJS.Timeout | null = null
  private pending: T | null = null

  constructor(
    private readonly path: string,
    private readonly schema: z.ZodType<T>,
    private readonly delayMs = 300,
    /** Upgrades older files before validation (e.g. fills in settings added later). */
    private readonly migrate: (raw: unknown) => unknown = (raw) => raw
  ) {}

  /** Reads and validates the file. Returns null when missing; a corrupt file is moved aside. */
  read(): T | null {
    if (!existsSync(this.path)) return null
    try {
      const parsed = this.schema.safeParse(this.migrate(JSON.parse(readFileSync(this.path, 'utf8'))))
      if (parsed.success) return parsed.data
    } catch {
      // fall through to quarantine
    }
    renameSync(this.path, `${this.path}.corrupt-${Date.now()}`)
    return null
  }

  save(data: T): void {
    this.pending = data
    if (this.timer) clearTimeout(this.timer)
    this.timer = setTimeout(() => this.flush(), this.delayMs)
  }

  flush(): void {
    if (this.timer) clearTimeout(this.timer)
    this.timer = null
    if (this.pending == null) return
    writeAtomic(this.path, JSON.stringify(this.pending, null, 2))
    this.pending = null
  }
}

export function writeAtomic(path: string, contents: string): void {
  mkdirSync(dirname(path), { recursive: true })
  const tmp = `${path}.${process.pid}.tmp`
  writeFileSync(tmp, contents, 'utf8')
  renameSync(tmp, path)
}
