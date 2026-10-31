import { useNavigate } from 'react-router-dom'
import { useSettings } from '@/hooks/useSettings'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { KioskInfo, getKioskToken, kioskBranchName } from '@/lib/kiosk'
import { cn } from '@/lib/utils'
import { ArrowRight } from 'lucide-react'

const STEPS = [
  { n: '01', label: 'Pilih paket' },
  { n: '02', label: 'Foto 4 pose' },
  { n: '03', label: 'Cetak & unduh' },
]

const FRAME_TONES = [
  ['from-[#f6d5cf] to-[#eaa59a]', 'from-[#ecebe8] to-[#cfccc6]', 'from-[#f3e2c4] to-[#ddb878]', 'from-[#f6d5cf] to-[#e5483a]/60'],
  ['from-[#ecebe8] to-[#cfccc6]', 'from-[#f6d5cf] to-[#e5483a]/60', 'from-[#ecebe8] to-[#b9b5ae]', 'from-[#f3e2c4] to-[#ddb878]'],
]

function Strip({ tones, className }: { tones: string[]; className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'w-[150px] xl:w-[170px] bg-white p-2.5 pb-3 rounded-[3px] shadow-[0_24px_50px_-18px_rgba(24,24,27,0.35)] ring-1 ring-zinc-900/5',
        className
      )}
    >
      <div className="flex flex-col gap-2">
        {tones.map((t, i) => (
          <div key={i} className={cn('aspect-[4/3] rounded-[2px] bg-gradient-to-br', t)} />
        ))}
      </div>
      <div className="mt-3 text-center font-bebas text-[18px] leading-none tracking-[0.12em] text-sway-text">
        BERTPIXX
      </div>
    </div>
  )
}

export function WelcomeScreen() {
  const navigate = useNavigate()
  const { isLoaded } = useSettings()
  const hasToken = Boolean(getKioskToken())
  // Invalid or disabled tokens are redirected to /setup by the API interceptor.
  const { data: kiosk } = useQuery({
    queryKey: ['kiosk-me'],
    enabled: hasToken,
    staleTime: 5 * 60_000,
    queryFn: async () => (await api.get('/api/kiosks/me')).data.data as KioskInfo,
  })

  if (!isLoaded) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-sway-bg text-sway-text select-none overflow-hidden">
        <LoadingSpinner label="Menghubungkan ke server..." />
      </div>
    )
  }

  const kioskLabel = kiosk
    ? [kiosk.name, kioskBranchName(kiosk)].filter(Boolean).join(' · ')
    : hasToken ? '' : 'Kiosk belum terhubung'

  return (
    <div className="relative h-screen w-full flex flex-col bg-sway-bg text-sway-text select-none overflow-hidden">
      {/* Header */}
      <header className="relative z-10 flex h-16 shrink-0 items-center justify-between px-8 lg:px-12">
        <span className="font-bebas text-[26px] leading-none tracking-[0.08em]">BERTPIXX</span>
        <span className="flex items-center gap-2 font-grotesk text-[11px] font-medium text-sway-dim">
          {kiosk && <span className="h-1.5 w-1.5 rounded-full bg-sway-success" />}
          {kioskLabel}
        </span>
      </header>

      {/* Stage */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-8 min-h-0">
        <div className="grid w-full max-w-[1180px] items-center gap-10 lg:grid-cols-[1fr_auto_1fr]">
          <div className="hidden lg:flex justify-end">
            <Strip tones={FRAME_TONES[0]} className="-rotate-[8deg] animate-slideUp" />
          </div>

          <div className="flex flex-col items-center text-center animate-fadeIn">
            <span className="font-grotesk text-[11px] font-bold uppercase tracking-[0.3em] text-sway-accent">
              Photobooth
            </span>
            <h1 className="mt-4 font-bebas text-[72px] sm:text-[96px] xl:text-[120px] leading-[0.88] tracking-[0.01em]">
              Abadikan<br />momen
            </h1>
            <p className="mt-5 max-w-[340px] font-grotesk text-[15px] leading-relaxed text-sway-dim">
              Foto strip instan, bayar QRIS, cetak langsung di tempat.
            </p>

            <button
              type="button"
              onClick={() => navigate('/packages')}
              className="group mt-9 flex h-16 w-[300px] items-center justify-between rounded-full bg-sway-accent pl-8 pr-2 font-grotesk text-[15px] font-bold uppercase tracking-[0.18em] text-white shadow-[0_14px_30px_-12px_rgba(229,72,58,0.7)] transition-transform duration-150 active:scale-[0.97] cursor-pointer"
            >
              Mulai sesi
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 transition-transform duration-200 group-hover:translate-x-0.5">
                <ArrowRight className="h-5 w-5" />
              </span>
            </button>
          </div>

          <div className="hidden lg:flex justify-start">
            <Strip tones={FRAME_TONES[1]} className="rotate-[8deg] animate-slideUp" />
          </div>
        </div>
      </main>

      {/* Steps */}
      <footer className="relative z-10 shrink-0 px-8 pb-8 lg:pb-10">
        <ol className="mx-auto grid max-w-[560px] grid-cols-3 divide-x divide-sway-border border-t border-sway-border pt-5">
          {STEPS.map((s) => (
            <li key={s.n} className="flex flex-col items-center gap-1 px-3 text-center">
              <span className="font-bebas text-[22px] leading-none text-sway-accent">{s.n}</span>
              <span className="font-grotesk text-[12px] font-medium text-sway-muted">{s.label}</span>
            </li>
          ))}
        </ol>
      </footer>
    </div>
  )
}
