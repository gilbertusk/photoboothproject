import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSessionStore } from '@/stores/sessionStore'
import { useSettings } from '@/hooks/useSettings'
import { Button } from '@/components/shared/Button'
import { Check } from 'lucide-react'

export function ThankYouScreen() {
  const navigate = useNavigate()
  const { resetSession } = useSessionStore()
  const { getSetting } = useSettings()
  const [secondsLeft, setSecondsLeft] = useState(10)

  const thankYouMessage = getSetting(
    'thank_you_message',
    'Terima kasih telah menggunakan photobooth kami! Semoga hari Anda menyenangkan.'
  )

  // Countdown timer to auto-reset session and return home
  useEffect(() => {
    if (secondsLeft <= 0) {
      resetSession()
      navigate('/kiosk')
      return
    }

    const interval = setInterval(() => {
      setSecondsLeft((s) => s - 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [secondsLeft, navigate, resetSession])

  const handleStartAgain = () => {
    resetSession()
    navigate('/kiosk')
  }

  const progress = secondsLeft / 10

  return (
    <div className="h-screen w-full flex flex-col lg:flex-row bg-sway-bg text-sway-text select-none relative overflow-hidden justify-center items-center">
      
      {/* Huge ultra-transparent "BERTPIXX" background word */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden">
        <span className="text-[120px] sm:text-[180px] lg:text-[240px] font-bebas text-sway-accent opacity-[0.07] tracking-widest leading-none font-bold uppercase select-none">
          BERTPIXX
        </span>
      </div>

      {/* Decorative ambient lights */}
      <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-sway-accent/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-sway-accent/5 blur-[120px] pointer-events-none" />

      {/* LEFT SIDE - Message and Tick Box */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center gap-4 px-6 lg:px-12 py-8 z-10 lg:border-r lg:border-sway-border-dim/20">
        {/* Glowing Tick Box Indicator */}
        <div className="w-16 h-16 border-2 border-sway-accent rounded flex items-center justify-center text-sway-accent shadow-[0_0_30px_rgba(255,107,90,0.2)] animate-scaleIn shrink-0">
          <Check className="w-8 h-8 stroke-[3]" />
        </div>

        <div className="text-center">
          <span className="font-grotesk text-[10px] text-sway-accent font-extrabold tracking-widest block uppercase">SESI SELESAI</span>
          <h1 className="font-bebas text-[36px] lg:text-[44px] text-sway-text leading-tight tracking-wide mt-1 uppercase font-bold">
            SAMPAI JUMPA
          </h1>
        </div>

        {/* Status Separator Line */}
        <div className="w-16 h-[2px] bg-sway-accent/30 rounded-full animate-pulse shrink-0" />

        <p className="font-grotesk text-[12px] lg:text-[14px] text-sway-muted max-w-sm text-center leading-relaxed font-medium">
          {thankYouMessage}
        </p>
      </div>

      {/* RIGHT SIDE - Countdown timer & Manual Restart Button */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center gap-6 lg:gap-8 px-6 lg:px-12 py-8 z-10">
        
        {/* Reset Countdown Block */}
        <div className="flex flex-col items-center gap-3 w-full max-w-xs bg-sway-card border border-sway-border-dim rounded p-5 shadow-lg">
          <span className="font-grotesk text-sway-dim animate-pulse uppercase tracking-widest text-[10px] text-center font-bold">
            KEMBALI KE BERANDA DALAM
          </span>
          <span className="font-bebas text-[36px] text-sway-accent leading-none tracking-wide font-extrabold">
            {secondsLeft} DETIK
          </span>
          {/* Decreasing Progress Bar */}
          <div className="w-full h-1 bg-sway-border-dim rounded-full overflow-hidden mt-1">
            <div 
              className="h-full bg-sway-accent transition-all duration-1000 ease-linear rounded-full" 
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>

        {/* Start Again CTA Button */}
        <Button
          onClick={handleStartAgain}
          variant="accent"
          size="lg"
          className="w-full max-w-xs h-14 font-bold uppercase tracking-widest font-grotesk"
        >
          MULAI SESI BARU →
        </Button>
      </div>
    </div>
  )
}
