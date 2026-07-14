import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Admin } from '../types'

interface AuthState {
  admin: Admin | null
  token: string | null
  isAuthenticated: boolean
  login: (token: string, admin: Admin) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      admin: null,
      token: null,
      isAuthenticated: false,
      login: (token, admin) => set({ token, admin, isAuthenticated: true }),
      logout: () => {
        set({ token: null, admin: null, isAuthenticated: false })
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)
