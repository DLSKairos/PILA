import { useEffect } from 'react'
import { useAppStore } from '@/stores/app.store'
import { useOfflineStore } from '@/stores/offline.store'

export const useOffline = () => {
  const setOnline = useAppStore(s => s.setOnline)
  const syncPendingActions = useOfflineStore(s => s.syncPendingActions)

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true)
      syncPendingActions()
    }
    const handleOffline = () => setOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [setOnline, syncPendingActions])
}
