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
                <div className="absolute inset-0 rounded-full bg-pb-primary/40 animate-pulse-ring" />
              )}
              <div
                className={cn(
                  'h-3.5 w-3.5 rounded-full transition-all duration-300',
                  isActive && 'bg-pb-primary scale-125 shadow-lg shadow-pb-primary/40',
                  isPast && 'bg-pb-primary/70',
                  isFuture && 'bg-pb-surface-2 border border-pb-border'
                )}
              />
            </div>
            {/* Label */}
            <span
              className={cn(
                'text-[11px] font-medium transition-colors duration-300 whitespace-nowrap',
                isActive && 'text-pb-primary-light',
                isPast && 'text-pb-text-muted',
                isFuture && 'text-pb-text-muted/50'
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
