import { useMemo } from 'react'
import { createTranslator, resolveLang, type Lang, type Translate } from '@shared/i18n'
import { useApp } from './store'

export function useLang(): Lang {
  return useApp((s) => resolveLang(s.settings?.language ?? 'system', navigator.language))
}

export function useT(): Translate {
  const lang = useLang()
  return useMemo(() => createTranslator(lang), [lang])
}
