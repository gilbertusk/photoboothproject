const TOKEN_KEY = 'kiosk-token'

export interface KioskInfo {
  id: string
  name: string
  branchId: { _id: string; name: string; code: string } | string
}

export const KIOSK_IDENTITY_ERRORS = ['KIOSK_UNREGISTERED', 'KIOSK_TOKEN_INVALID', 'KIOSK_DISABLED']

export const getKioskToken = (): string | null => localStorage.getItem(TOKEN_KEY)

export const setKioskToken = (token: string): void => localStorage.setItem(TOKEN_KEY, token.trim())

export const clearKioskToken = (): void => localStorage.removeItem(TOKEN_KEY)

export const kioskBranchName = (kiosk: KioskInfo | null): string | null =>
  kiosk && typeof kiosk.branchId === 'object' ? kiosk.branchId.name : null
