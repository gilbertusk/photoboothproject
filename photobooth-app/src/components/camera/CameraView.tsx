import Webcam from 'react-webcam'
import { cn } from '@/lib/utils'
import { FILTERS, FilterType } from '@/types'

interface CameraViewProps {
  webcamRef: React.RefObject<Webcam | null>
  filter: FilterType
  isMirror: boolean
  className?: string
}

export function CameraView({ webcamRef, filter, isMirror, className }: CameraViewProps) {
  return (
    <div
      className={cn(
        'relative w-full aspect-[3/4] rounded-[4px] overflow-hidden bg-black',
        'border border-sway-border',
        'shadow-2xl shadow-sway-accent/5',
        className
      )}
    >
      <Webcam
        ref={webcamRef}
        audio={false}
        screenshotFormat="image/jpeg"
        videoConstraints={{
          facingMode: 'user',
          width: { ideal: 1080 },
          height: { ideal: 1440 },
          aspectRatio: 3 / 4,
        }}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          filter: FILTERS[filter],
          transform: isMirror ? 'scaleX(-1)' : 'none',
        }}
      />

      {/* 3x3 Grid Overlay */}
      <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 select-none z-10">
        {/* Row 1 */}
        <div className="border-r border-b border-sway-border/20" />
        <div className="border-r border-b border-sway-border/20" />
        <div className="border-b border-sway-border/20" />
        {/* Row 2 */}
        <div className="border-r border-b border-sway-border/20" />
        <div className="border-r border-b border-sway-border/20" />
        <div className="border-b border-sway-border/20" />
        {/* Row 3 */}
        <div className="border-r border-sway-border/20" />
        <div className="border-r border-sway-border/20" />
        <div />
      </div>

      {/* Frame overlay glow */}
      <div className="absolute inset-0 rounded-[4px] ring-1 ring-inset ring-white/5 pointer-events-none z-20" />
    </div>
  )
}
