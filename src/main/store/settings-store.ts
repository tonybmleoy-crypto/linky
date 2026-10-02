import { EventEmitter } from 'node:events'
import { DEFAULT_SETTINGS, type Settings, type SettingsPatch } from '@shared/model'
import { SettingsSchema } from '@shared/schema'
import { JsonFile } from './json-file'

export class SettingsStore extends EventEmitter<{ changed: [Settings, SettingsPatch] }> {
  private data: Settings
  private readonly file: JsonFile<Settings>

  constructor(path: string) {
    super()
    // New settings get their defaults instead of invalidating an older file.
    this.file = new JsonFile(path, SettingsSchema, 100, (raw) =>
      raw && typeof raw === 'object' ? { ...DEFAULT_SETTINGS, ...raw } : raw
    )
    this.data = this.file.read() ?? { ...DEFAULT_SETTINGS }
  }

  get(): Settings {
    return this.data
  }

  update(patch: SettingsPatch): Settings {
    this.data = { ...this.data, ...patch }
    this.file.save(this.data)
    this.emit('changed', this.data, patch)
    return this.data
  }

  flush(): void {
    this.file.flush()
  }
}
