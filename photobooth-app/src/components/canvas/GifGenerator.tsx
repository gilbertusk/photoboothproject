import { useEffect, useState } from 'react'
import gifshot from 'gifshot'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

interface GifGeneratorProps {
  photos: string[]
  onComplete: (gifUrl: string) => void
  onError?: (error: string) => void
}

export function GifGenerator({ photos, onComplete, onError }: GifGeneratorProps) {
  const [progress, setProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!photos || photos.length === 0) {
      setErrorMsg('Tidak ada foto untuk di-generate menjadi GIF.')
      return
    }

    setProgress(10)
    
    // Configure gifshot
    // We want the GIF to look nice. The photos are 16:9 aspect ratio. Let's make it 640x360.
    gifshot.createGIF(
      {
        images: photos,
        gifWidth: 640,
        gifHeight: 360,
        interval: 0.5, // 500ms delay between frames
        numFrames: photos.length,
        frameDuration: 5, // 500ms frame duration
        sampleInterval: 1, // Highest color quality palette generation (no pixel skipping)
        numWorkers: 4, // Utilize 4 web workers for parallel compression
      },
      (obj: any) => {
        if (obj.error) {
          console.error('GIF generation error:', obj.errorMsg)
          setErrorMsg('Gagal membuat GIF: ' + obj.errorMsg)
          if (onError) onError(obj.errorMsg)
        } else {
          setProgress(100)
          onComplete(obj.image)
        }
      }
    )

    // Simulate progress animation since gifshot doesn't provide fine-grained progress hooks
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(timer)
          return 90
        }
        return prev + 10
      })
    }, 150)

    return () => clearInterval(timer)
  }, [photos, onComplete, onError])

  if (errorMsg) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-sway-surface rounded-2xl border border-sway-error/20 text-center">
        <p className="text-sway-error font-medium mb-2">{errorMsg}</p>
        <p className="text-sway-muted text-sm">Anda dapat melanjutkan tanpa GIF.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-sway-surface rounded-2xl border border-sway-border/30 w-full max-w-md mx-auto shadow-xl">
      <LoadingSpinner label="Sedang merangkai GIF animasi..." />
      
      <div className="w-full bg-sway-border-dim h-2 rounded-full overflow-hidden mt-6 mb-2">
        <div 
          className="bg-sway-accent h-full transition-all duration-300 ease-out shadow-[0_0_8px_#ff6b5a]"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-sway-muted">{progress}% Selesai</p>
    </div>
  )
}
