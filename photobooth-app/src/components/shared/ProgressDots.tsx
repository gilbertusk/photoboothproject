import { cn } from '@/lib/utils'

interface ProgressDotsProps {
  steps: string[]
  currentStep: number
  className?: string
}

export function ProgressDots({ steps, currentStep, className }: ProgressDotsProps) {
  return (
    <div className={cn('flex items-center justify-center gap-3', className)}>
      {steps.map((label, index) => {
        const isActive = index === currentStep
        const isPast = index < currentStep
        const isFuture = index > currentStep

        return (
          <div key={label} className="flex flex-col items-center gap-1.5">
            {/* Dot */}
            <div className="relative">
              {isActive && (
                <div className="absolute inset-0 rounded-full bg-sway-accent/40 animate-pulse-ring" />
              )}
              <div
                className={cn(
                  'h-3.5 w-3.5 rounded-full transition-all duration-300',
                  isActive && 'bg-sway-accent scale-125 shadow-lg shadow-sway-accent/40',
                  isPast && 'bg-sway-accent/70',
                  isFuture && 'bg-sway-card-hi border border-sway-border'
                )}
              />
            </div>
            {/* Label */}
            <span
              className={cn(
                'text-[11px] font-medium transition-colors duration-300 whitespace-nowrap',
                isActive && 'text-sway-accent',
                isPast && 'text-sway-dim',
                isFuture && 'text-sway-dim/50'
              )}
            >
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
