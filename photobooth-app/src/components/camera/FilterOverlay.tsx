import { FilterType, FILTER_LABELS } from '@/types'
import { cn } from '@/lib/utils'

interface FilterOverlayProps {
  currentFilter: FilterType
  onFilterChange: (filter: FilterType) => void
}

const filters: FilterType[] = ['normal', 'bw', 'warm', 'cool', 'vintage']

const filterPreviewStyle: Record<FilterType, string> = {
  normal: '',
  bw: 'grayscale(100%)',
  warm: 'sepia(40%) saturate(150%)',
  cool: 'hue-rotate(180deg) saturate(80%)',
  vintage: 'sepia(60%) contrast(90%)',
}

export function FilterOverlay({ currentFilter, onFilterChange }: FilterOverlayProps) {
  return (
    <div className="flex items-center gap-4 overflow-x-auto py-2 px-1 no-scrollbar justify-center w-full select-none">
      {filters.map((filter) => {
        const isActive = filter === currentFilter
        return (
          <button
            key={filter}
            onClick={() => onFilterChange(filter)}
            className={cn(
              'flex flex-col items-center gap-1.5 transition-all duration-200 shrink-0 cursor-pointer',
              isActive && 'scale-105'
            )}
          >
            {/* Preview card (sharp corner) */}
            <div
              className={cn(
                'w-14 h-14 rounded-[4px] overflow-hidden transition-all duration-200 border',
                isActive
                  ? 'border-2 border-sway-accent shadow-lg shadow-sway-accent/20'
                  : 'border-sway-border hover:border-sway-dim'
              )}
            >
              {/* Premium gradient preview with the corresponding filter */}
              <div
                className="w-full h-full bg-gradient-to-br from-[#ffbdb3] via-[#ffeadf] to-[#fff7f2]"
                style={{ filter: filterPreviewStyle[filter] }}
              />
            </div>
            {/* Label */}
            <span
              className={cn(
                'label-md transition-colors',
                isActive ? 'text-sway-accent font-bold' : 'text-sway-dim'
              )}
            >
              {FILTER_LABELS[filter]}
            </span>
          </button>
        )
      })}
    </div>
  )
}
