const STEPS = ['PAKET', 'BAYAR', 'FRAME', 'FOTO', 'HASIL']

interface ProgressBarProps {
  currentStep: number // 1 to 5
  onBack?: () => void
}

export function ProgressBar({ currentStep, onBack }: ProgressBarProps) {
  return (
    <div className="w-full flex items-center gap-4 px-6 lg:px-8 py-3 border-b border-sway-border-dim bg-sway-bg flex-shrink-0">
      
      {/* Back button */}
      {onBack ? (
        <button
          onClick={onBack}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-sway-dim hover:text-sway-text transition-colors flex-shrink-0 cursor-pointer"
          aria-label="Kembali"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      ) : (
        <div className="w-[44px] flex-shrink-0" />
      )}

      {/* Steps */}
      <div className="flex-1 flex flex-col gap-1.5">
        {/* Bars */}
        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-[3px] rounded-sm transition-colors duration-300 ${
                i + 1 < currentStep  ? 'bg-sway-ghost'
                : i + 1 === currentStep ? 'bg-sway-accent'
                : 'bg-sway-border-dim'
              }`}
            />
          ))}
        </div>
        {/* Labels */}
        <div className="flex">
          {STEPS.map((label, i) => (
            <div key={i} className="flex-1 text-center">
              <span className={`font-grotesk text-[10px] uppercase tracking-widest ${
                i + 1 === currentStep ? 'text-sway-accent' : 'text-sway-ghost'
              }`}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
