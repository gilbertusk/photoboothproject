import { useState, useEffect } from 'react'

interface CountdownProps {
  from?: number
  onComplete: () => void
}

export function Countdown({ from = 3, onComplete }: CountdownProps) {
  const [count, setCount] = useState<number | 'GO!'>(from)

  useEffect(() => {
    if (count === 'GO!') {
      const timer = setTimeout(() => {
        onComplete()
      }, 500) // Display GO! for 500ms
      return () => clearTimeout(timer)
    }

    if (count <= 0) {
      setCount('GO!')
      return
    }

    const timer = setTimeout(() => {
      setCount((c) => (c as number) - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [count, onComplete])

  const getCountStyles = () => {
    if (count === 'GO!') {
      return 'text-sway-accent drop-shadow-[0_0_80px_rgba(255,107,90,0.6)] animate-pulse'
    }
    if (count === 1) {
      return 'text-sway-gold drop-shadow-[0_0_80px_rgba(232,161,58,0.6)]'
    }
    return 'text-sway-text drop-shadow-[0_0_60px_rgba(255,107,90,0.35)]'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-sway-bg/80 backdrop-blur-[6px] select-none">
      <div
        key={count}
        className="animate-countdownPop flex items-center justify-center"
      >
        <span
          className={`text-[220px] font-bebas leading-none select-none tracking-wider ${getCountStyles()}`}
        >
          {count}
        </span>
      </div>
    </div>
  )
}
