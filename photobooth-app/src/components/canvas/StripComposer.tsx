import { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react'
import { Stage, Layer, Group, Image as KonvaImage, Rect, Text } from 'react-konva'
import { TemplateLayout, TemplateSlot } from '@/types'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { resolveTheme } from './FramePreview'

interface StripComposerProps {
  layout: any
  photos: string[]
  width?: number
  templateName?: string
}

export interface StripComposerRef {
  exportImage: () => string | null
}

// ─── Rich geometry presets (mirrors FramePreview.tsx GEOMETRIES) ─────────────
const PRESET_LAYOUTS: Record<string, TemplateLayout> = {
  // 2 slots
  duo: {
    width: 400, height: 900,
    slots: [
      { x: 30, y: 50,  width: 340, height: 255 },
      { x: 30, y: 335, width: 340, height: 255 },
    ],
    overlays: [],
  },
  duo_side: {
    width: 800, height: 500,
    slots: [
      { x: 20,  y: 40, width: 365, height: 360 },
      { x: 415, y: 40, width: 365, height: 360 },
    ],
    overlays: [],
  },
  // 3 slots
  strip: {
    width: 400, height: 1200,
    slots: [
      { x: 30, y: 50,  width: 340, height: 255 },
      { x: 30, y: 340, width: 340, height: 255 },
      { x: 30, y: 630, width: 340, height: 255 },
    ],
    overlays: [],
  },
  strip_wide: {
    width: 700, height: 550,
    slots: [
      { x: 20,  y: 40, width: 215, height: 380 },
      { x: 245, y: 40, width: 215, height: 380 },
      { x: 470, y: 40, width: 215, height: 380 },
    ],
    overlays: [],
  },
  // 4 slots
  collage: {
    width: 400, height: 1500,
    slots: [
      { x: 30, y: 50,  width: 340, height: 255 },
      { x: 30, y: 340, width: 340, height: 255 },
      { x: 30, y: 630, width: 340, height: 255 },
      { x: 30, y: 920, width: 340, height: 255 },
    ],
    overlays: [],
  },
  grid_2x2: {
    width: 800, height: 860,
    slots: [
      { x: 20,  y: 20,  width: 375, height: 370 },
      { x: 405, y: 20,  width: 375, height: 370 },
      { x: 20,  y: 400, width: 375, height: 370 },
      { x: 405, y: 400, width: 375, height: 370 },
    ],
    overlays: [],
  },
  // 6 slots
  grid_2x3: {
    width: 800, height: 1100,
    slots: [
      { x: 20,  y: 20,  width: 375, height: 320 },
      { x: 405, y: 20,  width: 375, height: 320 },
      { x: 20,  y: 355, width: 375, height: 320 },
      { x: 405, y: 355, width: 375, height: 320 },
      { x: 20,  y: 690, width: 375, height: 320 },
      { x: 405, y: 690, width: 375, height: 320 },
    ],
    overlays: [],
  },
  strip_6: {
    width: 400, height: 1900,
    slots: [
      { x: 30, y: 50,   width: 340, height: 255 },
      { x: 30, y: 340,  width: 340, height: 255 },
      { x: 30, y: 630,  width: 340, height: 255 },
      { x: 30, y: 920,  width: 340, height: 255 },
      { x: 30, y: 1210, width: 340, height: 255 },
      { x: 30, y: 1500, width: 340, height: 255 },
    ],
    overlays: [],
  },
};

function resolveLayout(layout: any, slotsCount: number): TemplateLayout {
  // If backend sent a full layout with real coordinates, use it directly
  if (layout && layout.width && layout.height && Array.isArray(layout.slots) && layout.slots.length > 0) {
    return layout as TemplateLayout;
  }

  // Resolve from type hint
  const type = layout?.type as string | undefined;
  if (type && PRESET_LAYOUTS[type]) return PRESET_LAYOUTS[type];

  // Infer from slot count
  if (slotsCount === 2) return PRESET_LAYOUTS.duo;
  if (slotsCount === 3) return PRESET_LAYOUTS.strip;
  if (slotsCount === 4) return PRESET_LAYOUTS.collage;
  if (slotsCount === 6) return PRESET_LAYOUTS.strip_6;

  // Final fallback: build vertical strip dynamically
  const width = 400;
  const slotHeight = 255;
  const padding = 30;
  const gap = 30;
  const slots: TemplateSlot[] = [];
  for (let i = 0; i < slotsCount; i++) {
    slots.push({
      x: padding,
      y: padding + i * (slotHeight + gap),
      width: width - padding * 2,
      height: slotHeight,
    });
  }
  const height = padding * 2 + slotsCount * slotHeight + (slotsCount - 1) * gap + 180;
  return { width, height, slots, overlays: [] };
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
  ({ layout, photos, width, templateName }, ref) => {
    const stageRef = useRef<any>(null)
    const [backgroundImg, setBackgroundImg] = useState<HTMLImageElement | null>(null)
    const [photoImages, setPhotoImages] = useState<(HTMLImageElement | null)[]>([])
    const [overlayImages, setOverlayImages] = useState<HTMLImageElement[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Resolve unpopulated or basic layout definitions
    const resolvedLayout = resolveLayout(layout, photos.length || 3)

    // Resolve visual theme based on template name
    const { theme } = resolveTheme(templateName || 'classic', photos.length || 3)

    // Calculate scale to fit display width
    const displayWidth = width || 360
    const scale = displayWidth / resolvedLayout.width
    const displayHeight = resolvedLayout.height * scale

    // Load all images
    useEffect(() => {
      const loadAll = async () => {
        setIsLoading(true)
        try {
          // Background
          let bgImg: HTMLImageElement | null = null
          if (resolvedLayout.background) {
            bgImg = await loadImage(resolvedLayout.background)
          }
          setBackgroundImg(bgImg)

          // Photos
          const pImgs = await Promise.all(
            photos.map(async (src) => {
              try {
                return await loadImage(src)
              } catch {
                return null
              }
            })
          )
          setPhotoImages(pImgs)

          // Overlays
          if (resolvedLayout.overlays?.length) {
            const oImgs = await Promise.all(
              resolvedLayout.overlays.map((o) => loadImage(o.url).catch(() => null))
            )
            setOverlayImages(oImgs.filter(Boolean) as HTMLImageElement[])
          }
        } catch (e) {
          console.error('Failed to load images for strip:', e)
        } finally {
          setIsLoading(false)
        }
      }
      loadAll()
    }, [resolvedLayout, photos])

    const exportImage = useCallback((): string | null => {
      if (!stageRef.current) return null
      const stage = stageRef.current
      
      // Save current scale
      const oldScaleX = stage.scaleX()
      const oldScaleY = stage.scaleY()
      
      // Reset scale to 1 for full-resolution export
      stage.scaleX(1)
      stage.scaleY(1)
      stage.draw()
      
      // Export at full resolution
      const dataUrl = stage.toDataURL({ pixelRatio: 2 })
      
      // Restore scale for display
      stage.scaleX(oldScaleX)
      stage.scaleY(oldScaleY)
      stage.draw()
      
      return dataUrl
    }, [])

    useImperativeHandle(ref, () => ({ exportImage }), [exportImage])

    if (isLoading) {
      return (
        <div
          className="flex items-center justify-center rounded-2xl bg-pb-surface"
          style={{ width: displayWidth, height: displayHeight }}
        >
          <LoadingSpinner label="Memuat template..." />
        </div>
      )
    }

    const footerBaseY = resolvedLayout.height - 180;

    return (
      <div
        className="rounded-2xl overflow-hidden shadow-2xl border border-pb-border/30"
        style={{ width: displayWidth, height: displayHeight }}
      >
        <Stage
          ref={stageRef}
          width={resolvedLayout.width}
          height={resolvedLayout.height}
          style={{
            width: displayWidth,
            height: displayHeight,
          }}
          scaleX={scale}
          scaleY={scale}
        >
          {/* Layer 1: Background */}
          <Layer>
            {backgroundImg ? (
              <KonvaImage
                image={backgroundImg}
                x={0}
                y={0}
                width={resolvedLayout.width}
                height={resolvedLayout.height}
              />
            ) : (
              <>
                <Rect
                  x={0}
                  y={0}
                  width={resolvedLayout.width}
                  height={resolvedLayout.height}
                  fill={theme.canvasBg}
                />
                {theme.accentTopH > 0 && theme.accentTop !== 'none' && (
                  <Rect
                    x={0}
                    y={0}
                    width={resolvedLayout.width}
                    height={theme.accentTopH}
                    fill={theme.accentTop}
                  />
                )}
              </>
            )}
          </Layer>

          {/* Layer 2: Photos in slots with crisp borders */}
          <Layer>
            {resolvedLayout.slots.map((slot, i) => {
              const img = photoImages[i]
              if (!img) return null

              // Center-crop the photo into the slot
              const imgAspect = img.width / img.height
              const slotAspect = slot.width / slot.height

              let cropX = 0,
                cropY = 0,
                cropW = img.width,
                cropH = img.height

              if (imgAspect > slotAspect) {
                // Image is wider — crop sides
                cropW = img.height * slotAspect
                cropX = (img.width - cropW) / 2
              } else {
                // Image is taller — crop top/bottom
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
                  {/* Premium frame border around each photo */}
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
            {resolvedLayout.overlays?.map((overlay, i) => {
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

          {/* Layer 4: Programmatic Branded Footer */}
          <Layer>
            {!resolvedLayout.background && (
              <>
                {/* Thin divider line above branding */}
                <Rect
                  x={50}
                  y={footerBaseY + 15}
                  width={resolvedLayout.width - 100}
                  height={1}
                  fill={theme.footerLine}
                />
                
                {/* Brand Logo Text */}
                <Text
                  text="S W A Y   C O L L E C T I V E"
                  x={0}
                  y={footerBaseY + 35}
                  width={resolvedLayout.width}
                  align="center"
                  fontSize={20}
                  fontFamily="'Space Grotesk', sans-serif"
                  fontStyle="bold"
                  fill={theme.brandColor}
                  letterSpacing={2}
                />

                {/* Subtitle */}
                <Text
                  text="M E M O R I E S   C A P T U R E D   📸"
                  x={0}
                  y={footerBaseY + 75}
                  width={resolvedLayout.width}
                  align="center"
                  fontSize={10}
                  fontFamily="'Space Grotesk', sans-serif"
                  fontStyle="bold"
                  fill={theme.subColor}
                  letterSpacing={1.5}
                />

                {/* Date */}
                <Text
                  text={new Date().toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  }).toUpperCase()}
                  x={0}
                  y={footerBaseY + 105}
                  width={resolvedLayout.width}
                  align="center"
                  fontSize={9}
                  fontFamily="'Space Grotesk', sans-serif"
                  fontStyle="bold"
                  fill={theme.subColor}
                  letterSpacing={1}
                />
              </>
            )}
          </Layer>
        </Stage>
      </div>
    )
  }
)

StripComposer.displayName = 'StripComposer'
