import { createContext, useContext, useMemo } from 'react'
import { createTranslator, resolveLang, type Lang, type Translate } from '@shared/i18n'
import { useApp } from './store'

/** Forces a language for a subtree — used by the landing-page demo, which has no app settings. */
export const LangContext = createContext<Lang | null>(null)

export function useLang(): Lang {
  const forced = useContext(LangContext)
  const fromSettings = useApp((s) => resolveLang(s.settings?.language ?? 'system', navigator.language))
  return forced ?? fromSettings
}

export function useT(): Translate {
  const lang = useLang()
  return useMemo(() => createTranslator(lang), [lang])
}
