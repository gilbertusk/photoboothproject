import { useEffect } from 'react'
import { useSettingStore } from '@/stores/settingStore'

export function useSettings() {
  const { settings, isLoaded, fetchSettings, getSetting } = useSettingStore()

  useEffect(() => {
    if (!isLoaded) {
      fetchSettings()
    }
  }, [isLoaded, fetchSettings])

  return {
    settings,
    isLoaded,
    getBusinessName: () => getSetting('businessName', 'Photobooth'),
    getLogoUrl: () => getSetting('logoUrl', ''),
    getWelcomeMessage: () => getSetting('welcomeMessage', 'Selamat Datang!'),
    getThankYouMessage: () => getSetting('thankYouMessage', 'Terima Kasih! 📸'),
    getCountdownSeconds: () => parseInt(getSetting('countdownSeconds', '3'), 10),
    getSetting,
  }
}
