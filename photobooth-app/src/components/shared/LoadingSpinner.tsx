import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  label?: string
}

const sizeMap = {
  sm: 'h-6 w-6 border-2',
  md: 'h-10 w-10 border-3',
  lg: 'h-16 w-16 border-4',
}

export function LoadingSpinner({ size = 'md', className, label }: LoadingSpinnerProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-4', className)}>
      <div className="relative">
        {/* Glow ring */}
        <div
          className={cn(
            'absolute inset-0 rounded-full bg-sway-accent/20 blur-xl animate-pulse-ring',
            size === 'lg' && 'blur-2xl'
          )}
        />
        {/* Spinner */}
        <div
          className={cn(
            'rounded-full border-sway-accent/30 border-t-sway-accent animate-spin',
            sizeMap[size]
          )}
        />
      </div>
      {label && (
        <p className="text-sway-dim text-sm font-medium animate-pulse">{label}</p>
      )}
    </div>
  )
}
