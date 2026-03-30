import { useEffect } from 'react'
import { useAppStore } from '@/stores/app.store'

export const usePWAInstall = () => {
  const { setDeferredPrompt, triggerInstall } = useAppStore()

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [setDeferredPrompt])

  return { triggerInstall }
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}
