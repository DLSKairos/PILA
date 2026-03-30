import { useAppStore } from '@/stores/app.store'

export const useLang = () => {
  const { language, resolvedLanguage, setLanguage, setResolvedLanguage } = useAppStore()

  const changeLang = (newLang: 'es' | 'en' | 'system') => {
    localStorage.setItem('pila-lang', newLang)
    setLanguage(newLang)
    const resolved = newLang === 'system'
      ? (navigator.language.startsWith('en') ? 'en' : 'es')
      : newLang
    setResolvedLanguage(resolved)
  }

  return { language, resolvedLanguage, changeLang }
}
