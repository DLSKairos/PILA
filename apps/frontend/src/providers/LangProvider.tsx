import { createContext, useContext, useEffect } from 'react'
import { useAppStore } from '@/stores/app.store'
import { t as translate, type Lang } from '@/i18n'

interface LangContextValue {
  t: (key: string, params?: Record<string, string | number>) => string
  lang: Lang
}

const LangContext = createContext<LangContextValue>({ t: (k) => k, lang: 'es' })

export function LangProvider({ children }: { children: React.ReactNode }) {
  const { resolvedLanguage, setLanguage, setResolvedLanguage } = useAppStore()

  useEffect(() => {
    const saved = localStorage.getItem('pila-lang') as 'es' | 'en' | 'system' | null
    const preference = saved ?? 'system'
    setLanguage(preference)
    const resolved: Lang = preference === 'system'
      ? (navigator.language.startsWith('en') ? 'en' : 'es')
      : preference
    setResolvedLanguage(resolved)
  }, [setLanguage, setResolvedLanguage])

  const tFn = (key: string, params?: Record<string, string | number>) =>
    translate(key, resolvedLanguage, params)

  return (
    <LangContext.Provider value={{ t: tFn, lang: resolvedLanguage }}>
      {children}
    </LangContext.Provider>
  )
}

export const useLangContext = () => useContext(LangContext)
