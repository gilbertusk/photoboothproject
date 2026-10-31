import { FormEvent, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { api } from '@/lib/api'
import { Button } from '@/components/shared/Button'
import {
  KioskInfo,
  clearKioskToken,
  getKioskToken,
  kioskBranchName,
  setKioskToken,
} from '@/lib/kiosk'

const reasons: Record<string, string> = {
  KIOSK_UNREGISTERED: 'Kiosk ini belum terhubung ke cabang.',
  KIOSK_TOKEN_INVALID: 'Token kiosk sudah tidak berlaku. Minta token baru dari owner.',
  KIOSK_DISABLED: 'Kiosk ini dinonaktifkan oleh admin.',
}

export function KioskSetupScreen() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const reason = params.get('reason')
  const [token, setToken] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [verified, setVerified] = useState<KioskInfo | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const hasToken = Boolean(getKioskToken())

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsChecking(true)
    try {
      // Verify before saving so a typo never replaces a working token.
      const res = await api.get('/api/kiosks/me', { headers: { 'x-kiosk-token': token.trim() } })
      setKioskToken(token)
      setVerified(res.data.data as KioskInfo)
      setToken('')
    } catch (err) {
      setError((axios.isAxiosError(err) && err.response?.data?.message) || 'Tidak dapat menghubungi server. Periksa koneksi lalu coba lagi.')
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <main className="h-screen w-full flex items-center justify-center bg-sway-bg text-sway-text p-6">
      <div className="w-full max-w-lg space-y-6">
        <div>
          <p className="font-grotesk text-[12px] uppercase text-sway-accent tracking-[0.2em] font-extrabold">BERTPIXX</p>
          <h1 className="font-bebas text-5xl">PENGATURAN KIOSK</h1>
          <p className="font-grotesk text-sm text-sway-dim mt-2">
            Tempel token dari dashboard admin (Cabang & Kiosk). Token disimpan hanya di perangkat ini.
          </p>
        </div>

        {reason && reasons[reason] && !verified && (
          <p role="alert" className="rounded border border-sway-accent bg-sway-card p-3 text-sm">{reasons[reason]}</p>
        )}

        {verified ? (
          <div role="status" className="rounded border border-sway-border bg-sway-card p-4 space-y-3">
            <p className="font-bold">Terhubung sebagai “{verified.name}”</p>
            <p className="text-sm text-sway-dim">Cabang: {kioskBranchName(verified) ?? '—'}</p>
            <Button variant="accent" onClick={() => navigate('/kiosk', { replace: true })}>Mulai kiosk</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <label htmlFor="kiosk-token" className="block font-grotesk text-xs font-bold uppercase tracking-wider">
              Token kiosk
            </label>
            <input
              id="kiosk-token"
              required
              autoComplete="off"
              spellCheck={false}
              placeholder="bpk_..."
              value={token}
              onChange={(e) => setToken(e.target.value)}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'kiosk-token-error' : undefined}
              className="h-12 w-full rounded border border-sway-border bg-sway-surface px-3 font-mono text-sm"
            />
            {error && <p id="kiosk-token-error" role="alert" className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" variant="accent" disabled={isChecking || !token.trim()}>
                {isChecking ? 'Memeriksa...' : 'Hubungkan'}
              </Button>
              {hasToken && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => { if (window.confirm('Lepaskan kiosk dari cabang di perangkat ini?')) { clearKioskToken(); navigate(0) } }}
                >
                  Lepaskan token
                </Button>
              )}
            </div>
          </form>
        )}
      </div>
    </main>
  )
}
