import { useAuthStore } from '../stores/authStore'

export function useAuth() {
  const { admin, token, isAuthenticated, login, logout } = useAuthStore()

  return {
    admin,
    token,
    isAuthenticated,
    login,
    logout,
  }
}
export default useAuth
