import { useEffect, useRef, useCallback } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useSessionStore } from '@/stores/sessionStore'

const INACTIVITY_TIMEOUT = 60_000 // 60 seconds

export function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const resetSession = useSessionStore((s) => s.resetSession)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)

    // Only set inactivity timer if NOT on welcome screen
    if (location.pathname !== '/kiosk') {
      timerRef.current = setTimeout(() => {
        resetSession()
        navigate('/kiosk', { replace: true })
      }, INACTIVITY_TIMEOUT)
    }
  }, [location.pathname, navigate, resetSession])

  useEffect(() => {
    resetTimer()

    const events = ['touchstart', 'touchmove', 'click', 'keydown']
    events.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }))

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      events.forEach((e) => window.removeEventListener(e, resetTimer))
    }
  }, [resetTimer])

  return (
    <div className="h-screen w-full bg-sway-bg text-sway-text overflow-hidden">
      <Outlet />
    </div>
  )
}
