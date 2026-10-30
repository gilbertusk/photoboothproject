import { api } from './api'
import { getKioskToken } from './kiosk'

const RETRY_DELAYS_MS = [0, 2000, 5000]

/**
 * Reports one print attempt so the kiosk's stock is deducted. The same attemptId is reused on
 * retry, so the server deducts at most once. Never throws: printing must not depend on the network.
 */
export async function reportPrint(sessionId: string): Promise<void> {
  if (!getKioskToken()) return
  const attemptId = typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('')
  for (const delay of RETRY_DELAYS_MS) {
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay))
    try {
      await api.post('/api/inventory/prints', { sessionId, attemptId })
      return
    } catch (err) {
      const status = (err as { response?: { status?: number } }).response?.status
      // Client errors (unpaid, foreign session) will not succeed on retry.
      if (status && status < 500) return
    }
  }
}
