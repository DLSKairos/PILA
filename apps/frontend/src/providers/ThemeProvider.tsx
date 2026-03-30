import { useEffect } from 'react'
import { useAppStore } from '@/stores/app.store'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { setTheme, setResolvedTheme } = useAppStore()

  useEffect(() => {
    const saved = localStorage.getItem('pila-theme') as 'dark' | 'light' | 'system' | null
    const preference = saved ?? 'system'
    setTheme(preference)

    const resolve = (): 'dark' | 'light' => {
      if (preference === 'system') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      }
      return preference
    }

    const apply = (resolved: 'dark' | 'light') => {
      document.documentElement.classList.remove('dark', 'light')
      document.documentElement.classList.add(resolved)
      setResolvedTheme(resolved)
    }

    apply(resolve())

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      if (preference === 'system') apply(mq.matches ? 'dark' : 'light')
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [setTheme, setResolvedTheme])

  return <>{children}</>
}
