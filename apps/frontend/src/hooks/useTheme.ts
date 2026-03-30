import { useAppStore } from '@/stores/app.store'

export const useTheme = () => {
  const { theme, resolvedTheme, setTheme, setResolvedTheme } = useAppStore()

  const applyTheme = (resolved: 'dark' | 'light') => {
    document.documentElement.classList.remove('dark', 'light')
    document.documentElement.classList.add(resolved)
    setResolvedTheme(resolved)
  }

  const changeTheme = (newTheme: 'dark' | 'light' | 'system') => {
    localStorage.setItem('pila-theme', newTheme)
    setTheme(newTheme)
    const resolved = newTheme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : newTheme
    applyTheme(resolved)
  }

  return { theme, resolvedTheme, changeTheme }
}
