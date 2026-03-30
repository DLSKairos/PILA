export const isPWA = (): boolean =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (window.navigator as unknown as { standalone?: boolean }).standalone === true

export const getOS = (): 'ios' | 'android' | 'desktop' => {
  const ua = navigator.userAgent
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios'
  if (/Android/.test(ua)) return 'android'
  return 'desktop'
}

export const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  const ua = navigator.userAgent
  if (/tablet|ipad/i.test(ua)) return 'tablet'
  if (/mobile/i.test(ua)) return 'mobile'
  return 'desktop'
}

export const isIOSSafari = (): boolean => {
  const ua = navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua) && /Safari/.test(ua) && !/Chrome/.test(ua) && !/CriOS/.test(ua)
}

export const isDesktop = (): boolean => getOS() === 'desktop'

export const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)))
}
