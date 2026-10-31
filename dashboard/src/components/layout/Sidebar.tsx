import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Layers,
  Banknote,
  Ticket,
  Receipt,
  Settings,
  HelpCircle,
  LogOut,
  User,
  Store,
  Users,
  Package
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

export function Sidebar() {
  const location = useLocation()
  const { admin, logout } = useAuth()
  const isOwner = (admin?.role ?? 'OWNER') === 'OWNER'

  const menuItems = [
    { name: 'DASHBOARD', path: '/', icon: LayoutDashboard },
    { name: 'TEMPLATES', path: '/templates', icon: Layers, ownerOnly: true },
    { name: 'PAKET HARGA', path: '/pricing', icon: Banknote, ownerOnly: true },
    { name: 'VOUCHER', path: '/vouchers', icon: Ticket, ownerOnly: true },
    { name: 'PELANGGAN', path: '/customers', icon: User, ownerOnly: true },
    { name: 'NOTIFIKASI', path: '/notifications', icon: Receipt, ownerOnly: true },
    { name: 'TRANSAKSI', path: '/transactions', icon: Receipt },
    { name: 'CABANG & KIOSK', path: '/branches', icon: Store },
    { name: 'STOK', path: '/inventory', icon: Package },
    { name: 'ADMIN', path: '/admins', icon: Users, ownerOnly: true },
    { name: 'PENGATURAN', path: '/settings', icon: Settings, ownerOnly: true },
  ].filter((item) => isOwner || !item.ownerOnly)

  return (
    <aside className="fixed top-0 bottom-0 left-0 z-50 flex w-[220px] flex-col border-r border-sway-border bg-sway-card text-sway-text h-screen select-none">
      {/* TOP BRANDING SECTION */}
      <div className="flex flex-col pt-10 pb-6 px-6 shrink-0 select-none">
        <span className="font-bebas text-[34px] text-sway-text tracking-wider leading-[0.9]">
          BERTPIXX
        </span>
        <span className="font-grotesk text-[8px] uppercase tracking-[0.25em] text-sway-ghost mt-2.5 font-bold leading-none">
          ADMIN_SYSTEM_V.1
        </span>
      </div>

      {/* NAV MENU */}
      <nav className="flex-1 py-2 space-y-[2px] overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "group h-11 flex items-center gap-3 px-6 cursor-pointer transition-all duration-200 select-none",
                isActive
                  ? "bg-sway-accent text-white"
                  : "bg-transparent text-sway-muted hover:bg-sway-surface hover:text-sway-text"
              )}
            >
              <item.icon
                size={18}
                className={cn(
                  "transition-colors duration-200 shrink-0",
                  isActive ? "text-white" : "text-sway-muted group-hover:text-sway-text"
                )}
              />
              <span className="font-grotesk text-[12px] font-bold uppercase tracking-wider">
                {item.name}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* BOTTOM SECTION */}
      <div className="px-6 pb-6 pt-2 shrink-0 flex flex-col gap-1.5 select-none bg-transparent">
        {/* Launch Booth Button */}
        <button
          className="w-full h-11 bg-sway-accent hover:bg-sway-accent/90 active:scale-[0.98] text-white font-bebas text-[18px] tracking-[0.05em] rounded-[4px] flex items-center justify-center transition-all duration-200 uppercase border-none shadow-sm cursor-pointer select-none"
        >
          LAUNCH BOOTH
        </button>

        {/* Divider */}
        <div className="h-[1px] bg-sway-border my-2" />

        {/* Support Link */}
        <a
          href="#support"
          className="group h-10 flex items-center gap-3 px-2 text-sway-muted hover:text-sway-text hover:bg-sway-surface transition-all duration-200 rounded font-grotesk text-[12px] font-bold uppercase select-none cursor-pointer"
        >
          <HelpCircle size={18} className="text-sway-muted group-hover:text-sway-text shrink-0" />
          SUPPORT
        </a>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="group w-full h-10 flex items-center gap-3 px-2 text-sway-muted hover:text-sway-error hover:bg-sway-error/10 transition-all duration-200 rounded font-grotesk text-[12px] font-bold uppercase select-none cursor-pointer border-none bg-transparent text-left"
        >
          <LogOut size={18} className="text-sway-muted group-hover:text-sway-error shrink-0" />
          LOGOUT
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
