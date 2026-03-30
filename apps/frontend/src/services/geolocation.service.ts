import api from './api'

export const geolocationService = {
  checkProximity: (latitude: number, longitude: number) =>
    api.post('/client/location/check', { latitude, longitude }),
}
