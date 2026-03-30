import { es } from './es'
import { en } from './en'

export type Lang = 'es' | 'en'

const translations: Record<Lang, Record<string, string>> = { es, en }

export function t(key: string, lang: Lang = 'es', params?: Record<string, string | number>): string {
  const dict = translations[lang] ?? translations.es
  let text = dict[key] ?? key
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, String(v))
    })
  }
  return text
}

export { es, en }
