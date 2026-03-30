import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface OfflineAction {
  id: string
  type: 'COMPLETE_MEAL' | 'COMPLETE_EXERCISE' | 'ADD_WATER'
  payload: unknown
  timestamp: string
}

interface OfflineStore {
  pendingActions: OfflineAction[]
  isSyncing: boolean
  addPendingAction: (action: Omit<OfflineAction, 'id' | 'timestamp'>) => void
  syncPendingActions: () => Promise<void>
  clearSynced: () => void
}

export const useOfflineStore = create<OfflineStore>()(
  persist(
    (set, get) => ({
      pendingActions: [],
      isSyncing: false,

      addPendingAction: (action) =>
        set((s) => ({
          pendingActions: [
            ...s.pendingActions,
            { ...action, id: crypto.randomUUID(), timestamp: new Date().toISOString() },
          ],
        })),

      syncPendingActions: async () => {
        const { pendingActions, isSyncing } = get()
        if (isSyncing || pendingActions.length === 0) return
        set({ isSyncing: true })
        const { trackingService } = await import('@/services/tracking.service')
        const synced: string[] = []
        for (const action of pendingActions) {
          try {
            if (action.type === 'COMPLETE_MEAL') {
              await trackingService.completeMeal((action.payload as { mealItemId: string }).mealItemId)
              synced.push(action.id)
            } else if (action.type === 'ADD_WATER') {
              await trackingService.addWater()
              synced.push(action.id)
            }
          } catch {
            // keep in queue
          }
        }
        set((s) => ({
          pendingActions: s.pendingActions.filter((a) => !synced.includes(a.id)),
          isSyncing: false,
        }))
      },

      clearSynced: () => set({ pendingActions: [] }),
    }),
    { name: 'pila-offline-queue' }
  )
)
