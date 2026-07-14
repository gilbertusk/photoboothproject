import { create } from 'zustand'
import { api } from '@/lib/api'

interface SettingStore {
  settings: Record<string, string>
  isLoaded: boolean
  fetchSettings: () => Promise<void>
  getSetting: (key: string, defaultValue?: string) => string
}

export const useSettingStore = create<SettingStore>((set, get) => ({
  settings: {},
  isLoaded: false,

  fetchSettings: async () => {
    try {
      const response = await api.get('/api/public/settings')
      if (response.data?.success && response.data?.data) {
        set({ settings: response.data.data, isLoaded: true })
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
      // Use defaults if settings fetch fails
      set({ isLoaded: true })
    }
  },

  getSetting: (key: string, defaultValue = '') => {
    return get().settings[key] || defaultValue
  },
}))
