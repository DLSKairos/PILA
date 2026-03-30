import { formatDistance, format } from 'date-fns'
import { es, enUS } from 'date-fns/locale'

export const formatDuration = (seconds: number): string => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export const formatMacros = (p: number, c: number, f: number): string =>
  `${p}P · ${c}C · ${f}G`

export const formatWeight = (kg: number): string => `${kg} kg`

export const formatStreak = (days: number, lang: 'es' | 'en'): string =>
  lang === 'es' ? `${days} días` : `${days} days`

export const formatDate = (date: string | Date, lang: 'es' | 'en' = 'es'): string =>
  format(new Date(date), 'dd/MM/yyyy', { locale: lang === 'es' ? es : enUS })

export const formatRelativeTime = (date: string | Date, lang: 'es' | 'en' = 'es'): string =>
  formatDistance(new Date(date), new Date(), {
    addSuffix: true,
    locale: lang === 'es' ? es : enUS,
  })

export const formatTime = (date: string | Date): string =>
  format(new Date(date), 'HH:mm')

export const formatCalories = (kcal: number): string => `${kcal} kcal`
