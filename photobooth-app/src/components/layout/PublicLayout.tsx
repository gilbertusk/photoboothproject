import { Outlet } from 'react-router-dom'

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-sway-bg text-sway-text selection:bg-sway-accent selection:text-white">
      <Outlet />
    </div>
  )
}
