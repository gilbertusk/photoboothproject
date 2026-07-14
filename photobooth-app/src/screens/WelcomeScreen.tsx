import { useNavigate } from 'react-router-dom'
import { useSettings } from '@/hooks/useSettings'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Button } from '@/components/shared/Button'

export function WelcomeScreen() {
  const navigate = useNavigate()
  const { isLoaded } = useSettings()

  if (!isLoaded) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-sway-bg text-sway-text select-none overflow-hidden">
        <LoadingSpinner label="Menghubungkan ke server..." />
      </div>
    )
  }

  return (
    <div className="h-screen w-full flex flex-col lg:flex-row bg-sway-bg text-sway-text select-none overflow-hidden">
      {/* LEFT SIDE: Branding + Pills (40% on large, full width on mobile) */}
      <div className="w-full lg:w-[40%] flex flex-col justify-center px-6 lg:px-12 py-12 lg:py-8 bg-sway-bg animate-fadeIn text-left z-10 border-b lg:border-b-0 lg:border-r border-sway-border-dim">
        <span className="font-grotesk text-[12px] uppercase text-sway-accent tracking-[0.2em] mb-4 block font-extrabold">
          PHOTOBOOTH
        </span>

        <h1 className="font-bebas text-[48px] lg:text-[72px] text-sway-text leading-none select-none text-left mb-6 font-bold tracking-tight">
          ABADIKAN MOMEN
        </h1>

        <p className="font-grotesk text-[14px] text-sway-dim mt-2 max-w-sm mb-8 lg:mb-12 leading-relaxed">
          Foto strip instan, bayar QRIS, cetak langsung
        </p>

        {/* INFO PILLS */}
        <div className="flex flex-row lg:flex-col gap-3 max-w-md lg:max-w-[240px] flex-wrap">
          <div className="bg-sway-surface border border-sway-border-dim rounded px-4 py-2.5 font-grotesk text-[11px] uppercase tracking-wider text-sway-dim font-bold text-center flex-1 lg:flex-initial">
            QRIS PAYMENT
          </div>
          <div className="bg-sway-surface border border-sway-border-dim rounded px-4 py-2.5 font-grotesk text-[11px] uppercase tracking-wider text-sway-dim font-bold text-center flex-1 lg:flex-initial">
            INSTANT PRINT
          </div>
          <div className="bg-sway-surface border border-sway-border-dim rounded px-4 py-2.5 font-grotesk text-[11px] uppercase tracking-wider text-sway-dim font-bold text-center flex-1 lg:flex-initial">
            DIGITAL COPY
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Strip Illustration + CTA (60% on large, full width on mobile) */}
      <div className="w-full lg:w-[60%] flex flex-col items-center justify-center p-8 lg:p-12 bg-sway-bg relative overflow-hidden z-10">
        {/* STRIP ILLUSTRATION */}
        <div className="relative w-[280px] lg:w-[320px] h-[220px] lg:h-[280px] flex items-center justify-center mb-10 lg:mb-16 scale-90 lg:scale-110">
          {/* Left Frame */}
          <div className="absolute w-[120px] lg:w-[140px] h-[180px] lg:h-[210px] border border-sway-border rounded opacity-30 bg-sway-card/50 transform -rotate-[12deg] -translate-x-[50px] lg:-translate-x-[60px] pointer-events-none flex flex-col justify-between p-2 shadow-xl">
            <div className="flex-1 border-b border-sway-border-dim mb-1" />
            <div className="flex-1 border-b border-sway-border-dim mb-1" />
            <div className="flex-1" />
          </div>

          {/* Right Frame */}
          <div className="absolute w-[120px] lg:w-[140px] h-[180px] lg:h-[210px] border border-sway-border rounded opacity-30 bg-sway-card/50 transform rotate-[12deg] translate-x-[50px] lg:translate-x-[60px] pointer-events-none flex flex-col justify-between p-2 shadow-xl">
            <div className="flex-1 border-b border-sway-border-dim mb-1" />
            <div className="flex-1 border-b border-sway-border-dim mb-1" />
            <div className="flex-1" />
          </div>

          {/* Center Frame */}
          <div className="absolute w-[120px] lg:w-[140px] h-[180px] lg:h-[210px] border border-sway-accent rounded bg-sway-card z-20 pointer-events-none flex flex-col justify-between p-2 lg:p-2.5 shadow-2xl">
            <div className="flex-1 border-b border-sway-border-dim mb-2" />
            <div className="flex-1 border-b border-sway-border-dim mb-2" />
            <div className="flex-1" />
          </div>
        </div>

        {/* "MULAI SESI" button */}
        <Button
          variant="accent"
          size="lg"
          onClick={() => navigate('/packages')}
          className="w-full max-w-[280px]"
        >
          MULAI SESI
        </Button>
      </div>
    </div>
  )
}
