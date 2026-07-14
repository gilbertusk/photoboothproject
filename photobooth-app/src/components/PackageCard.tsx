import { cn } from '@/lib/utils'
import { FramePreview } from '@/components/canvas/FramePreview'

interface PackageCardProps {
  name: string
  price: number
  photoCount: number
  features: string[]
  isSelected: boolean
  isFeatured?: boolean
  onClick?: () => void
}

// Empty layout forces FramePreview to fall back to preset vertical geometry
const EMPTY_LAYOUT = { width: 0, height: 0, slots: [] }

// Derive a theme keyword from the package name so each tier looks distinct
function pickTheme(packageName: string): string {
  const nl = packageName.toLowerCase()
  if (nl.includes('gold') || nl.includes('premium') || nl.includes('vip'))  return 'gold'
  if (nl.includes('basic') || nl.includes('lite') || nl.includes('mini'))   return 'slate'
  if (nl.includes('fun') || nl.includes('party') || nl.includes('pink'))    return 'pastel'
  if (nl.includes('film') || nl.includes('cinema') || nl.includes('noir'))  return 'film'
  if (nl.includes('vintage') || nl.includes('retro'))                       return 'vintage'
  if (nl.includes('neon') || nl.includes('glow'))                           return 'neon'
  if (nl.includes('mint') || nl.includes('green'))                          return 'mint'
  if (nl.includes('ocean') || nl.includes('blue') || nl.includes('navy'))   return 'ocean'
  if (nl.includes('rose') || nl.includes('blush'))                          return 'rose'
  if (nl.includes('sunset') || nl.includes('warm') || nl.includes('orange')) return 'sunset'
  if (nl.includes('cyber') || nl.includes('electric'))                      return 'cyber'
  if (nl.includes('lavender') || nl.includes('violet'))                     return 'lavender'
  if (nl.includes('modern') || nl.includes('minimal'))                      return 'modern'
  if (nl.includes('cherry') || nl.includes('crimson'))                      return 'cherry'
  if (nl.includes('mono') || nl.includes('bw'))                             return 'mono'
  return 'classic'
}

// Build a frame name that combines theme + slot geometry (all vertical)
function stripName(packageName: string, photoCount: number): string {
  const theme = pickTheme(packageName)
  if (photoCount <= 2) return `${theme} duo portrait`
  if (photoCount === 3) return `${theme} strip`
  if (photoCount === 4) return `${theme} strip 4`
  if (photoCount === 6) return `${theme} strip 6`
  return `${theme} strip`
}

export function PackageCard({
  name,
  price,
  photoCount,
  features,
  isSelected,
  isFeatured = false,
  onClick,
}: PackageCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-xl',
        'border transition-all duration-200 cursor-pointer',
        'relative overflow-hidden select-none',
        isSelected
          ? 'bg-sway-surface border-sway-accent shadow-[0_0_20px_rgba(255,86,56,0.18)]'
          : 'bg-sway-card border-sway-border-dim hover:border-sway-border'
      )}
    >
      {/* HOT badge */}
      {isFeatured && (
        <span className="absolute top-2 right-2 z-10 bg-sway-accent text-sway-bg font-grotesk text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm">
          HOT
        </span>
      )}

      <div className="flex items-stretch gap-0">
        {/* LEFT: vertical frame preview */}
        <div
          className={cn(
            'flex items-center justify-center shrink-0 transition-colors duration-200',
            'rounded-l-xl',
            isSelected ? 'bg-[#1a0d0b]' : 'bg-sway-bg/60'
          )}
          style={{ width: 72, padding: '12px 8px' }}
        >
          <FramePreview
            layout={EMPTY_LAYOUT}
            slots={photoCount}
            name={stripName(name, photoCount)}
            previewWidth={52}
            inactive={!isSelected}
            variant="card"
          />
        </div>

        {/* Divider */}
        <div className={cn(
          'w-px self-stretch my-3 shrink-0 transition-colors duration-200',
          isSelected ? 'bg-sway-accent/30' : 'bg-sway-border-dim'
        )} />

        {/* RIGHT: name + price + features */}
        <div className="flex-grow flex flex-col justify-center gap-2 px-4 py-4">
          {/* Selected indicator + name */}
          <div className="flex items-center gap-2">
            {isSelected && (
              <div className="w-[16px] h-[16px] rounded-full bg-sway-accent flex items-center justify-center shrink-0">
                <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5l2 2 4-4" stroke="#200f0c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
            <div className={cn(
              'font-grotesk text-[11px] uppercase tracking-wider font-bold',
              isSelected ? 'text-sway-accent' : 'text-sway-dim'
            )}>
              {name}
            </div>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-1.5">
            <span className="font-bebas text-[32px] text-sway-text leading-none">
              Rp {price.toLocaleString('id-ID')}
            </span>
            <span className="font-grotesk text-[11px] text-sway-ghost">/ sesi</span>
          </div>

          {/* Feature tags */}
          <div className="flex flex-wrap gap-1.5">
            {features.map(feat => (
              <span
                key={feat}
                className={cn(
                  'font-grotesk text-[10px] uppercase px-2 py-0.5 rounded-sm border font-bold',
                  feat.startsWith('+') || feat.toUpperCase().includes('GIF') || feat.toUpperCase().includes('EMAIL')
                    ? 'border-sway-accent/30 text-sway-accent bg-transparent'
                    : 'border-sway-border-dim text-sway-dim bg-sway-card-hi'
                )}
              >
                {feat}
              </span>
            ))}
          </div>
        </div>
      </div>
    </button>
  )
}
