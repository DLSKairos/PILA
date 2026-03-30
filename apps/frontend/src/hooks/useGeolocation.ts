import { geolocationService } from '@/services/geolocation.service'

export const useGeolocation = () => {
  const checkGymProximity = (): Promise<{ nearGym: boolean; gym?: unknown }> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ nearGym: false })
        return
      }
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { data } = await geolocationService.checkProximity(
              position.coords.latitude,
              position.coords.longitude
            )
            resolve((data as { data?: { nearGym: boolean; gym?: unknown } }).data ?? { nearGym: false })
          } catch {
            resolve({ nearGym: false })
          }
        },
        () => resolve({ nearGym: false }),
        { timeout: 10000, maximumAge: 60000 }
      )
    })
  }

  return { checkGymProximity }
}
