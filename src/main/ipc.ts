import { clipboard, ipcMain, shell } from 'electron'
import { z } from 'zod'
import { IPC } from '@shared/api'
import {
  FolderInputSchema,
  FolderPatchSchema,
  SettingsPatchSchema,
  SnippetInputSchema,
  SnippetPatchSchema
} from '@shared/schema'
import type { LinkyApp } from './app'

const Id = z.string().min(1).max(64)
const Route = z.enum(['library', 'settings', 'onboarding'])
const WindowActionSchema = z.enum(['minimize', 'maximize', 'close'])
const Edge = z.enum(['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']).nullable()

/** Every payload from a renderer is validated here — renderers are treated as untrusted. */
export function registerIpc(ctl: LinkyApp): void {
  const handle = <T extends unknown[]>(channel: string, fn: (...args: T) => unknown): void => {
    ipcMain.handle(channel, (_e, ...args) => fn(...(args as T)))
  }

  handle(IPC.getLibrary, () => ctl.library.get())
  handle(IPC.getSettings, () => ctl.settings.get())

  handle(IPC.createSnippet, (input: unknown) => ctl.library.createSnippet(SnippetInputSchema.parse(input)))
  handle(IPC.updateSnippet, (id: unknown, patch: unknown) =>
    ctl.library.updateSnippet(Id.parse(id), SnippetPatchSchema.parse(patch))
  )
  handle(IPC.deleteSnippet, (id: unknown) => ctl.library.deleteSnippet(Id.parse(id)))
  handle(IPC.snippetFromClipboard, async () => {
    const text = (await clipboard.readText()).trim()
    if (!text || text.length > 20_000) return null
    return ctl.library.createSnippet({ content: text })
  })
  handle(IPC.pasteSnippet, (id: unknown) => ctl.paste(Id.parse(id)))

  handle(IPC.createFolder, (input: unknown) => ctl.library.createFolder(FolderInputSchema.parse(input)))
  handle(IPC.updateFolder, (id: unknown, patch: unknown) =>
    ctl.library.updateFolder(Id.parse(id), FolderPatchSchema.parse(patch))
  )
  handle(IPC.deleteFolder, (id: unknown) => ctl.library.deleteFolder(Id.parse(id)))

  handle(IPC.updateSettings, (patch: unknown) => ctl.updateSettings(SettingsPatchSchema.parse(patch)))
  handle(IPC.checkHotkey, (acc: unknown) => ctl.hotkey.check(z.string().min(1).max(64).parse(acc)))
  handle(IPC.suspendHotkey, (on: unknown) => ctl.hotkey.suspend(z.boolean().parse(on), ctl.settings.get().hotkey))

  handle(IPC.hidePalette, () => ctl.palette.hide())
  handle(IPC.openManager, (route: unknown) => {
    ctl.palette.hide()
    ctl.openManager(Route.optional().parse(route) ?? 'library')
  })
  handle(IPC.windowControl, (action: unknown) => ctl.manager.control(WindowActionSchema.parse(action)))
  handle(IPC.resizeWindow, (edge: unknown) => ctl.manager.resize(Edge.parse(edge)))
  handle(IPC.openExternal, (url: unknown) => {
    const u = new URL(z.string().parse(url))
    if (['http:', 'https:', 'mailto:'].includes(u.protocol)) return shell.openExternal(u.toString())
    return undefined
  })
}
