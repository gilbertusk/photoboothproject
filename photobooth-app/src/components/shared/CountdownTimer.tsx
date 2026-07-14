import { useState, useEffect, useCallback } from 'react'
import { formatCountdown } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface CountdownTimerProps {
  totalSeconds: number
  onExpired?: () => void
  className?: string
  showBar?: boolean
  size?: 'sm' | 'lg'
}

export function CountdownTimer({
  totalSeconds,
  onExpired,
  className,
  showBar = true,
  size = 'lg',
}: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(totalSeconds)

  const handleExpired = useCallback(() => {
    onExpired?.()
  }, [onExpired])

  useEffect(() => {
    setRemaining(totalSeconds)
  }, [totalSeconds])

  useEffect(() => {
    if (remaining <= 0) {
      handleExpired()
      return
    }

    const timer = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [remaining, handleExpired])

  const progress = remaining / totalSeconds
  const isUrgent = remaining <= 60

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      {/* Time Display */}
      <div
        className={cn(
          'font-mono font-bold tabular-nums transition-colors duration-300',
          size === 'lg' ? 'text-3xl' : 'text-lg',
          isUrgent ? 'text-sway-accent' : 'text-sway-gold'
        )}
      >
        {formatCountdown(remaining)}
      </div>

      {/* Progress Bar */}
      {showBar && (
        <div className="w-full max-w-xs h-1.5 rounded-full bg-sway-border-dim overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-1000 ease-linear',
              isUrgent ? 'bg-sway-accent' : 'bg-sway-gold'
            )}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      )}
    </div>
  )
}
