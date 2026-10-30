import { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef, useMemo } from 'react'
import { Stage, Layer, Group, Image as KonvaImage, Rect, Text } from 'react-konva'
import { TemplateLayout } from '@/types'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { resolveTheme, resolveGeometry } from './FramePreview'

interface StripComposerProps {
  layout?: TemplateLayout
  photos: string[]
  slots: number
  width?: number
  templateName?: string
  onReadyChange?: (ready: boolean) => void
}

export interface StripComposerRef {
  exportImage: () => string | null
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

export const StripComposer = forwardRef<StripComposerRef, StripComposerProps>(
  ({ layout, photos, slots, width, templateName, onReadyChange }, ref) => {
    const stageRef = useRef<any>(null)
    const [backgroundImg, setBackgroundImg] = useState<HTMLImageElement | null>(null)
    const [photoImages, setPhotoImages] = useState<(HTMLImageElement | null)[]>([])
    const [overlayImages, setOverlayImages] = useState<(HTMLImageElement | null)[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const name = templateName || 'classic'

    // Same geometry + theme as the frame shown on TemplateScreen
    const geom = useMemo(() => resolveGeometry(layout, slots, name), [layout, slots, name])
    const { theme } = useMemo(() => resolveTheme(name, slots), [name, slots])

    const background = layout?.background
    const overlays = layout?.overlays

    const displayWidth = width || 360
    const scale = displayWidth / geom.cW
    const displayHeight = geom.cH * scale

    useEffect(() => {
      let cancelled = false
      setIsLoading(true)

      const loadAll = async () => {
        try {
          const [bgImg, pImgs, oImgs] = await Promise.all([
            background ? loadImage(background).catch(() => null) : Promise.resolve(null),
            Promise.all(photos.map((src) => loadImage(src).catch(() => null))),
            Promise.all((overlays || []).map((o) => loadImage(o.url).catch(() => null))),
            // Text is rendered on canvas, so fonts must be ready before drawing
            document.fonts?.ready ?? Promise.resolve(),
          ])
          if (cancelled) return
          setBackgroundImg(bgImg)
          setPhotoImages(pImgs)
          setOverlayImages(oImgs)
        } catch (e) {
          console.error('Failed to load images for strip:', e)
        } finally {
          if (!cancelled) setIsLoading(false)
        }
      }
      loadAll()

      return () => {
        cancelled = true
      }
    }, [background, overlays, photos])

    useEffect(() => {
      onReadyChange?.(!isLoading)
    }, [isLoading, onReadyChange])

    const exportImage = useCallback((): string | null => {
      if (!stageRef.current || isLoading) return null
      // Export at 2x the canvas' native resolution regardless of display size
      return stageRef.current.toDataURL({
        pixelRatio: (geom.cW / displayWidth) * 2,
        mimeType: 'image/jpeg',
        quality: 0.95,
      })
    }, [isLoading, geom.cW, displayWidth])

    useImperativeHandle(ref, () => ({ exportImage }), [exportImage])

    if (isLoading) {
      return (
        <div
          className="flex items-center justify-center rounded-2xl bg-sway-surface"
          style={{ width: displayWidth, height: displayHeight }}
        >
          <LoadingSpinner label="Memuat template..." />
        </div>
      )
    }

    const { cW, cH, footerH } = geom
    const footerBaseY = cH - footerH

    return (
      <div
        className="rounded-2xl overflow-hidden shadow-2xl border border-sway-border/30"
        style={{ width: displayWidth, height: displayHeight }}
      >
        <Stage
          ref={stageRef}
          width={displayWidth}
          height={displayHeight}
          scaleX={scale}
          scaleY={scale}
        >
          {/* Layer 1: Background */}
          <Layer>
            {backgroundImg ? (
              <KonvaImage image={backgroundImg} x={0} y={0} width={cW} height={cH} />
            ) : (
              <>
                <Rect x={0} y={0} width={cW} height={cH} fill={theme.canvasBg} />
                {theme.accentTopH > 0 && theme.accentTop !== 'none' && (
                  <Rect x={0} y={0} width={cW} height={theme.accentTopH} fill={theme.accentTop} />
                )}
              </>
            )}
          </Layer>

          {/* Layer 2: Photos in slots */}
          <Layer>
            {geom.slots.map((slot, i) => {
              const img = photoImages[i]

              if (!img) {
                return (
                  <Rect
                    key={i}
                    x={slot.x}
                    y={slot.y}
                    width={slot.width}
                    height={slot.height}
                    fill={theme.slotFill}
                    stroke={theme.slotBorder}
                    strokeWidth={2}
                  />
                )
              }

              // Center-crop the photo into the slot
              const imgAspect = img.width / img.height
              const slotAspect = slot.width / slot.height
              let cropX = 0
              let cropY = 0
              let cropW = img.width
              let cropH = img.height

              if (imgAspect > slotAspect) {
                cropW = img.height * slotAspect
                cropX = (img.width - cropW) / 2
              } else {
                cropH = img.width / slotAspect
                cropY = (img.height - cropH) / 2
              }

              return (
                <Group key={i}>
                  <KonvaImage
                    image={img}
                    x={slot.x}
                    y={slot.y}
                    width={slot.width}
                    height={slot.height}
                    crop={{ x: cropX, y: cropY, width: cropW, height: cropH }}
                    rotation={slot.rotation || 0}
                  />
                  <Rect
                    x={slot.x}
                    y={slot.y}
                    width={slot.width}
                    height={slot.height}
                    stroke={theme.slotBorder}
                    strokeWidth={3}
                  />
                </Group>
              )
            })}
          </Layer>

          {/* Layer 3: Overlays */}
          <Layer>
            {overlays?.map((overlay, i) => {
              const img = overlayImages[i]
              if (!img) return null
              return (
                <KonvaImage
                  key={`overlay-${i}`}
                  image={img}
                  x={overlay.x}
                  y={overlay.y}
                  width={overlay.width}
                  height={overlay.height}
                />
              )
            })}
          </Layer>

          {/* Layer 4: Branded footer (same thresholds as FramePreview) */}
          <Layer>
            {!backgroundImg && footerH > 50 && (
              <>
                <Rect
                  x={30}
                  y={footerBaseY + 12}
                  width={cW - 60}
                  height={1.5}
                  fill={theme.footerLine}
                />
                <Text
                  text="BERTPIXX"
                  x={0}
                  y={footerBaseY + (footerH > 150 ? 40 : 26)}
                  width={cW}
                  align="center"
                  fontSize={footerH > 150 ? 20 : 15}
                  fontFamily="'Space Grotesk', Arial, sans-serif"
                  fontStyle="bold"
                  fill={theme.brandColor}
                  letterSpacing={2.5}
                />
                {footerH > 120 && (
                  <>
                    <Text
                      text="MEMORIES CAPTURED ✦"
                      x={0}
                      y={footerBaseY + 78}
                      width={cW}
                      align="center"
                      fontSize={10}
                      fontFamily="'Space Grotesk', Arial, sans-serif"
                      fontStyle="bold"
                      fill={theme.subColor}
                      letterSpacing={2}
                    />
                    <Text
                      text={new Date()
                        .toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                        .toUpperCase()}
                      x={0}
                      y={footerBaseY + 100}
                      width={cW}
                      align="center"
                      fontSize={9}
                      fontFamily="'Space Grotesk', Arial, sans-serif"
                      fontStyle="bold"
                      fill={theme.subColor}
                      letterSpacing={1}
                    />
                  </>
                )}
              </>
            )}
          </Layer>
        </Stage>
      </div>
    )
  }
)

StripComposer.displayName = 'StripComposer'
