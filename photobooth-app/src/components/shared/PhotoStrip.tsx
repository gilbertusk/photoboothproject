import { cn } from '@/lib/utils'
import { STRIP_TONES } from './stripTones'

interface PhotoStripProps {
  tones?: string[]
  className?: string
}

export function PhotoStrip({ tones = STRIP_TONES[0], className }: PhotoStripProps) {
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
