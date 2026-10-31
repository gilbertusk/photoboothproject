import { useEffect } from 'react'
import { Check } from 'lucide-react'

interface PaymentSuccessOverlayProps {
  onComplete: () => void
}

export function PaymentSuccessOverlay({ onComplete }: PaymentSuccessOverlayProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete()
    }, 1500) // 1.5 seconds

    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <div className="fixed inset-0 bg-sway-bg/98 z-50 flex flex-col items-center justify-center select-none animate-fadeIn">
      <div className="flex flex-col items-center gap-4 text-center max-w-sm px-6">
        {/* Square Check Icon */}
        <div className="w-20 h-20 border-2 border-sway-accent rounded-xl flex items-center justify-center text-sway-accent shadow-[0_0_30px_rgba(255,107,90,0.18)] animate-scaleIn">
          <Check className="w-10 h-10 stroke-[3]" />
        </div>

        {/* PAID Text */}
        <h1 className="text-[80px] font-bebas text-sway-accent leading-none tracking-wider mt-2">
          PAID
        </h1>

        {/* SESI DIMULAI Label */}
        <span className="label-lg text-sway-accent tracking-[0.2em] font-extrabold">
          SESI DIMULAI
        </span>

        {/* Divider Line */}
        <div className="w-[120px] h-[1px] bg-sway-border-dim my-2" />

        {/* Subtext */}
        <p className="body-md text-sway-ghost">
          Memilih frame foto...
        </p>
      </div>
    </div>
  )
}
