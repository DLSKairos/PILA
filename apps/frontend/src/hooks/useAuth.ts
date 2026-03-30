import { useAuthStore } from '@/stores/auth.store'
import { authService } from '@/services/auth.service'
import { useNavigate } from 'react-router-dom'

export const useAuth = () => {
  const store = useAuthStore()
  const navigate = useNavigate()

  const logout = async () => {
    try { await authService.logout() } catch {}
    store.logout()
    navigate('/login')
  }

  return {
    accessToken: store.accessToken,
    role: store.role,
    userId: store.userId,
    email: store.email,
    isAuthenticated: store.isAuthenticated,
    login: store.login,
    logout,
  }
}
