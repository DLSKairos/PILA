import { create } from 'zustand'
import { isPWA } from '@/utils/pwa.util'

type Theme = 'dark' | 'light' | 'system'
type Language = 'es' | 'en' | 'system'

interface AppStore {
  theme: Theme
  resolvedTheme: 'dark' | 'light'
  language: Language
  resolvedLanguage: 'es' | 'en'
  isOnline: boolean
  isPWAInstalled: boolean
  deferredPrompt: BeforeInstallPromptEvent | null
  setTheme: (theme: Theme) => void
  setResolvedTheme: (theme: 'dark' | 'light') => void
  setLanguage: (lang: Language) => void
  setResolvedLanguage: (lang: 'es' | 'en') => void
  setOnline: (online: boolean) => void
  setDeferredPrompt: (prompt: BeforeInstallPromptEvent | null) => void
  triggerInstall: () => Promise<void>
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export const useAppStore = create<AppStore>((set, get) => ({
  theme: 'system',
  resolvedTheme: 'dark',
  language: 'system',
  resolvedLanguage: 'es',
  isOnline: navigator.onLine,
  isPWAInstalled: isPWA(),
  deferredPrompt: null,

  setTheme: (theme) => set({ theme }),
  setResolvedTheme: (resolvedTheme) => set({ resolvedTheme }),
  setLanguage: (language) => set({ language }),
  setResolvedLanguage: (resolvedLanguage) => set({ resolvedLanguage }),
  setOnline: (isOnline) => set({ isOnline }),

  setDeferredPrompt: (prompt) => set({ deferredPrompt: prompt }),

  triggerInstall: async () => {
    const { deferredPrompt } = get()
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    await deferredPrompt.userChoice
    set({ deferredPrompt: null })
  },
}))
