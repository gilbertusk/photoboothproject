import { useState, useEffect } from 'react'

interface CaptureFlashProps {
  trigger: number // increment to trigger flash
}

export function CaptureFlash({ trigger }: CaptureFlashProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (trigger > 0) {
      setShow(true)
      const timer = setTimeout(() => setShow(false), 80)
      return () => clearTimeout(timer)
    }
  }, [trigger])

  if (!show) return null

  return (
    <div className="fixed inset-0 z-40 bg-white animate-flash pointer-events-none" />
  )
}
