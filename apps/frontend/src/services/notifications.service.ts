import api from './api'
import { urlBase64ToUint8Array, getDeviceType, getOS } from '@/utils/pwa.util'

export const notificationsService = {
  subscribe: async (vapidPublicKey: string) => {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    })
    const json = subscription.toJSON()
    return api.post('/client/notifications/subscribe', {
      endpoint: json.endpoint,
      p256dh: json.keys?.p256dh,
      auth: json.keys?.auth,
      deviceType: getDeviceType(),
      platform: getOS(),
      userAgent: navigator.userAgent,
    })
  },
  unsubscribe: () => api.delete('/client/notifications/subscribe'),
  getAll: () => api.get('/client/notifications'),
}
