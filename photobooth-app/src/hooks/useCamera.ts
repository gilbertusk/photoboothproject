import { useCallback, useRef } from 'react'
import Webcam from 'react-webcam'
import { FILTERS, FilterType } from '@/types'

export function useCamera() {
  const webcamRef = useRef<Webcam>(null)

  const captureWithFilter = useCallback(
    (filter: FilterType, isMirror: boolean): string | null => {
      const webcam = webcamRef.current
      if (!webcam || !webcam.video) return null

      const video = webcam.video
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) return null

      // Apply filter
      ctx.filter = FILTERS[filter]

      // Handle mirror
      if (isMirror) {
        ctx.translate(canvas.width, 0)
        ctx.scale(-1, 1)
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      return canvas.toDataURL('image/jpeg', 0.92)
    },
    []
  )

  return {
    webcamRef,
    captureWithFilter,
  }
}
