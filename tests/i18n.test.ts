import { describe, expect, it } from 'vitest'
import { createTranslator, resolveLang } from '@shared/i18n'

describe('i18n', () => {
  it('uses Russian plural forms', () => {
    const t = createTranslator('ru')
    expect(t('lib.items', { count: 1 })).toBe('1 запись')
    expect(t('lib.items', { count: 3 })).toBe('3 записи')
    expect(t('lib.items', { count: 5 })).toBe('5 записей')
    expect(t('lib.items', { count: 11 })).toBe('11 записей')
    expect(t('lib.items', { count: 21 })).toBe('21 запись')
    expect(t('lib.items', { count: 24 })).toBe('24 записи')
  })

  it('uses English plural forms and interpolation', () => {
    const t = createTranslator('en')
    expect(t('lib.items', { count: 1 })).toBe('1 item')
    expect(t('lib.items', { count: 2 })).toBe('2 items')
    expect(t('ins.quickKeyHint', { n: 3 })).toBe('Press 3 while the quick menu is open')
  })

  it('follows the system locale unless overridden', () => {
    expect(resolveLang('system', 'ru-RU')).toBe('ru')
    expect(resolveLang('system', 'de-DE')).toBe('en')
    expect(resolveLang('en', 'ru-RU')).toBe('en')
  })
})
