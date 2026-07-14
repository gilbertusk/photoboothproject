import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

interface DashboardLayoutProps {
  children?: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-sway-bg text-sway-text">
      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Main Content Area offset by Sidebar width (220px) */}
      <div className="flex flex-col flex-1 min-h-screen ml-[220px]">
        {/* Topbar */}
        <Topbar />

        {/* Content Wrapper */}
        <main className="flex-1 p-8">
          {children || <Outlet />}
        </main>

        {/* Footer */}
        <footer className="px-8 py-4 flex justify-between text-[10px] uppercase tracking-[0.15em] text-sway-ghost font-grotesk font-semibold border-t border-sway-border-dim/20 bg-sway-bg shrink-0">
          <span>System status: optimal // uptime: 99.98%</span>
          <span>© 2025 Tobooth — Nocturnal Production</span>
        </footer>
      </div>
    </div>
  )
}

export default DashboardLayout
