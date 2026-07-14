import { ReactNode } from 'react'

interface BottomBarProps {
  left?: ReactNode
  center?: ReactNode
  right?: ReactNode
}

export function BottomBar({ left, center, right }: BottomBarProps) {
  return (
    <div className="
      w-full flex items-center justify-between
      px-6 lg:px-8
      py-3 lg:py-4
      border-t border-sway-border-dim
      bg-sway-bg
      flex-shrink-0
      min-h-[64px] lg:min-h-[72px]
    ">
      <div className="flex items-center">{left}</div>
      {center && <div className="flex items-center flex-1 justify-center">{center}</div>}
      <div className="flex items-center">{right}</div>
    </div>
  )
}
