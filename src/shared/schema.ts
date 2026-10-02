/* Runtime validation for data on disk and payloads from renderers. Main process only. */
import { z } from 'zod'
import {
  FOLDER_COLORS,
  type FolderInput,
  type FolderPatch,
  type Library,
  type Settings,
  type SettingsPatch,
  type SnippetInput,
  type SnippetPatch
} from './model'

const SnippetSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  content: z.string(),
  kind: z.enum(['link', 'text']),
  folderId: z.string().nullable(),
  pinned: z.boolean(),
  order: z.number(),
  useCount: z.number().int().nonnegative(),
  lastUsedAt: z.number().nullable(),
  createdAt: z.number(),
  updatedAt: z.number()
})

const FolderSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  color: z.enum(FOLDER_COLORS),
  order: z.number()
})

export const LibrarySchema: z.ZodType<Library> = z.object({
  version: z.literal(1),
  snippets: z.array(SnippetSchema),
  folders: z.array(FolderSchema)
})

const SettingsShape = z.object({
  version: z.literal(1),
  hotkey: z.string().min(1),
  theme: z.enum(['system', 'light', 'dark']),
  language: z.enum(['system', 'en', 'ru']),
  launchAtLogin: z.boolean(),
  palettePosition: z.enum(['cursor', 'center']),
  restoreClipboard: z.boolean(),
  pasteMode: z.enum(['paste', 'copy']),
  onboardingDone: z.boolean()
})
export const SettingsSchema: z.ZodType<Settings> = SettingsShape

const Content = z.string().min(1).max(20_000)

export const SnippetInputSchema: z.ZodType<SnippetInput> = z.object({
  title: z.string().max(200).optional(),
  content: Content,
  folderId: z.string().nullable().optional(),
  pinned: z.boolean().optional()
})

export const SnippetPatchSchema: z.ZodType<SnippetPatch> = z
  .object({ title: z.string().max(200), content: Content, folderId: z.string().nullable(), pinned: z.boolean() })
  .partial()

export const FolderInputSchema: z.ZodType<FolderInput> = z.object({
  name: z.string().trim().min(1).max(60),
  color: z.enum(FOLDER_COLORS).optional()
})

export const FolderPatchSchema: z.ZodType<FolderPatch> = z
  .object({ name: z.string().trim().min(1).max(60), color: z.enum(FOLDER_COLORS) })
  .partial()

export const SettingsPatchSchema: z.ZodType<SettingsPatch> = SettingsShape.omit({ version: true }).partial()
