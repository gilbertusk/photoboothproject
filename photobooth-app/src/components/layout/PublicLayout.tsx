import { Outlet } from 'react-router-dom'

// html/body are overflow:hidden for the kiosk, so public pages scroll inside this container.
export function PublicLayout() {
  return (
    <div
      id="public-scroll"
      className="h-screen overflow-y-auto scroll-smooth bg-sway-bg text-sway-text selection:bg-sway-accent selection:text-white"
    >
      <Outlet />
    </div>
  )
}
