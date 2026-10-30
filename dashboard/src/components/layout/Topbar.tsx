import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Bell, Maximize, Plus, HelpCircle, Search, Image as ImageIcon, User, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export function Topbar() {
  const location = useLocation()
  const [dateTimeStr, setDateTimeStr] = useState('')

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date()
      const datePart = format(now, 'dd MMM yyyy', { locale: id }).toUpperCase()
      const timePart = format(now, 'HH:mm')
      setDateTimeStr(`HARI INI, ${datePart} | ${timePart}`)
    }
    
    updateDateTime()
    const interval = setInterval(updateDateTime, 1000) // Update every second for dynamic clock feel
    return () => clearInterval(interval)
  }, [])

  // Derive page title from route
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'DASHBOARD'
      case '/templates':
        return 'TEMPLATES'
      case '/pricing':
        return 'PAKET HARGA'
      case '/vouchers':
        return 'VOUCHER'
      case '/transactions':
        return 'TRANSAKSI'
      case '/settings':
        return 'PENGATURAN'
      case '/branches':
        return 'CABANG & KIOSK'
      case '/inventory':
        return 'STOK KIOSK'
      case '/admins':
        return 'ADMIN & AKSES'
      case '/customers':
        return 'PELANGGAN'
      case '/notifications':
        return 'NOTIFIKASI'
      default:
        return 'ADMIN'
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`)
      })
    } else {
      document.exitFullscreen()
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-sway-border-dim bg-sway-surface px-8 shrink-0">
      {/* LEFT: Page Title */}
      <div>
        <h1 className="font-bebas text-[28px] text-sway-text tracking-wide uppercase leading-none mt-1">
          {getPageTitle()}
        </h1>
      </div>

      {/* RIGHT: Stats and utility icons */}
      <div className="flex items-center">
        {location.pathname === '/templates' ? (
          <div className="flex items-center gap-3">
            {/* Notification Icon */}
            <button
              className="p-1.5 text-sway-dim hover:text-sway-accent transition-colors cursor-pointer rounded hover:bg-sway-card-hi/30"
              aria-label="Notifications"
            >
              <Bell size={20} />
            </button>

            {/* Help Icon */}
            <button
              className="p-1.5 text-sway-dim hover:text-sway-accent transition-colors cursor-pointer rounded hover:bg-sway-card-hi/30"
              aria-label="Help"
            >
              <HelpCircle size={20} />
            </button>

            {/* Add Template Button */}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-add-template-modal'))}
              className="bg-sway-accent text-white font-bebas text-[16px] tracking-wide h-11 px-5 rounded flex items-center gap-2 cursor-pointer hover:brightness-110 active:scale-[0.98] transition-all font-medium border-none shadow-sm shadow-sway-accent/20 select-none ml-2"
            >
              <Plus size={16} />
              TAMBAH TEMPLATE
            </button>
          </div>
        ) : location.pathname === '/pricing' ? (
          <div className="flex items-center gap-3">
            {/* Search input */}
            <div className="relative w-[200px] h-10 shrink-0">
              <input
                type="text"
                onChange={(e) => window.dispatchEvent(new CustomEvent('pricing-search', { detail: e.target.value }))}
                placeholder="Cari Paket..."
                className="w-full h-full bg-sway-surface border border-sway-border rounded pl-9 pr-4 font-grotesk text-[13px] text-sway-text placeholder-sway-ghost outline-none focus:border-sway-accent transition-colors"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sway-ghost pointer-events-none" />
            </div>

            {/* Add Pricing Button */}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-add-pricing-modal'))}
              className="bg-sway-accent text-white font-grotesk text-[12px] uppercase tracking-widest font-bold h-10 px-4.5 rounded flex items-center gap-1.5 cursor-pointer hover:brightness-110 active:scale-[0.98] transition-all border-none select-none ml-1"
            >
              <Plus size={14} className="mr-0.5" />
              TAMBAH PAKET
            </button>

            {/* Separator */}
            <div className="w-[1px] h-6 bg-sway-border-dim mx-1 shrink-0" />

            {/* Bell Icon */}
            <button
              className="w-9 h-9 flex items-center justify-center text-sway-dim hover:text-sway-text transition-colors cursor-pointer rounded hover:bg-sway-card-hi/30"
              aria-label="Notifications"
            >
              <Bell size={20} />
            </button>

            {/* Image Icon */}
            <button
              className="w-9 h-9 flex items-center justify-center text-sway-dim hover:text-sway-text transition-colors cursor-pointer rounded hover:bg-sway-card-hi/30"
              aria-label="Media"
            >
              <ImageIcon size={20} />
            </button>

            {/* User Icon */}
            <button
              className="w-9 h-9 flex items-center justify-center text-sway-dim hover:text-sway-text transition-colors cursor-pointer rounded hover:bg-sway-card-hi/30"
              aria-label="Profile"
            >
              <User size={20} />
            </button>
          </div>
        ) : location.pathname === '/vouchers' ? (
          <div className="flex items-center gap-3">
            {/* Search input */}
            <div className="relative w-[260px] h-10 shrink-0">
              <input
                type="text"
                onChange={(e) => window.dispatchEvent(new CustomEvent('vouchers-search', { detail: e.target.value }))}
                placeholder="Cari kode voucher..."
                className="w-full h-full bg-sway-surface border border-sway-border rounded pl-9 pr-4 font-grotesk text-[13px] text-sway-text placeholder-sway-ghost outline-none focus:border-sway-accent transition-colors"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sway-ghost pointer-events-none" />
            </div>

            {/* Add Voucher Button */}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-add-voucher-modal'))}
              className="bg-sway-accent text-white font-grotesk text-[12px] uppercase tracking-widest font-bold h-10 px-4.5 rounded flex items-center gap-1.5 cursor-pointer hover:brightness-110 active:scale-[0.98] transition-all border-none select-none ml-1"
            >
              <Plus size={14} className="mr-0.5" />
              BUAT VOUCHER
            </button>

            {/* Separator */}
            <div className="w-[1px] h-6 bg-sway-border-dim mx-1 shrink-0" />

            {/* Bell Icon */}
            <button
              className="w-9 h-9 flex items-center justify-center text-sway-dim hover:text-sway-text transition-colors cursor-pointer rounded hover:bg-sway-card-hi/30"
              aria-label="Notifications"
            >
              <Bell size={20} />
            </button>

            {/* Image Icon */}
            <button
              className="w-9 h-9 flex items-center justify-center text-sway-dim hover:text-sway-text transition-colors cursor-pointer rounded hover:bg-sway-card-hi/30"
              aria-label="Media"
            >
              <ImageIcon size={20} />
            </button>

            {/* User Icon */}
            <button
              className="w-9 h-9 flex items-center justify-center text-sway-dim hover:text-sway-text transition-colors cursor-pointer rounded hover:bg-sway-card-hi/30"
              aria-label="Profile"
            >
              <User size={20} />
            </button>
          </div>
        ) : location.pathname === '/transactions' ? (
          <div className="flex items-center gap-3">
            {/* Search input */}
            <div className="relative w-[220px] h-10 shrink-0">
              <input
                type="text"
                onChange={(e) => window.dispatchEvent(new CustomEvent('transactions-search', { detail: e.target.value }))}
                placeholder="Cari Transaksi ID..."
                className="w-full h-full bg-sway-surface border border-sway-border rounded pl-9 pr-4 font-grotesk text-[13px] text-sway-text placeholder-sway-ghost outline-none focus:border-sway-accent transition-colors"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sway-ghost pointer-events-none" />
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('transactions-refresh'))}
              className="bg-sway-accent text-white font-grotesk text-[12px] uppercase tracking-widest font-bold h-10 px-4.5 rounded flex items-center gap-1.5 cursor-pointer hover:brightness-110 active:scale-[0.98] transition-all border-none select-none ml-1"
            >
              <RefreshCw size={14} className="mr-0.5" />
              SEGARKAN
            </button>

            {/* Separator */}
            <div className="w-[1px] h-6 bg-sway-border-dim mx-1 shrink-0" />

            {/* Bell Icon */}
            <button
              className="w-9 h-9 flex items-center justify-center text-sway-dim hover:text-sway-text transition-colors cursor-pointer rounded hover:bg-sway-card-hi/30"
              aria-label="Notifications"
            >
              <Bell size={20} />
            </button>

            {/* Image Icon */}
            <button
              className="w-9 h-9 flex items-center justify-center text-sway-dim hover:text-sway-text transition-colors cursor-pointer rounded hover:bg-sway-card-hi/30"
              aria-label="Media"
            >
              <ImageIcon size={20} />
            </button>

            {/* User Icon */}
            <button
              className="w-9 h-9 flex items-center justify-center text-sway-dim hover:text-sway-text transition-colors cursor-pointer rounded hover:bg-sway-card-hi/30"
              aria-label="Profile"
            >
              <User size={20} />
            </button>
          </div>
        ) : location.pathname === '/settings' ? (
          <div className="flex items-center gap-3">
            {/* Bell Icon */}
            <button
              className="w-9 h-9 flex items-center justify-center text-sway-muted hover:text-sway-text transition-colors cursor-pointer rounded hover:bg-sway-card-hi/30"
              aria-label="Notifications"
            >
              <Bell size={20} />
            </button>

            {/* Screen Icon */}
            <button
              onClick={toggleFullscreen}
              className="w-9 h-9 flex items-center justify-center text-sway-muted hover:text-sway-text transition-colors cursor-pointer rounded hover:bg-sway-card-hi/30"
              aria-label="Toggle Fullscreen"
            >
              <Maximize size={20} />
            </button>

            {/* User Icon */}
            <button
              className="w-9 h-9 flex items-center justify-center text-sway-muted hover:text-sway-text transition-colors cursor-pointer rounded hover:bg-sway-card-hi/30"
              aria-label="Profile"
            >
              <User size={20} />
            </button>

            {/* Save All Changes Button */}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('trigger-save-settings'))}
              className="bg-sway-accent hover:brightness-110 active:scale-[0.98] text-white font-grotesk text-[12px] uppercase tracking-widest font-bold h-10 px-6 rounded flex items-center justify-center cursor-pointer transition-all border-none select-none ml-2"
            >
              SIMPAN SEMUA PERUBAHAN
            </button>
          </div>
        ) : (
          <div className="flex items-center">
            {/* Tanggal */}
            <div className="border border-sway-border-dim px-3.5 py-1.5 rounded font-grotesk text-[12px] text-sway-dim bg-transparent">
              {dateTimeStr}
            </div>

            {/* Notification Icon */}
            <button
              className="ml-3 p-1.5 text-sway-dim hover:text-sway-accent transition-colors cursor-pointer rounded hover:bg-sway-card-hi/30"
              aria-label="Notifications"
            >
              <Bell size={20} />
            </button>

            {/* Fullscreen Icon */}
            <button
              onClick={toggleFullscreen}
              className="ml-2 p-1.5 text-sway-dim hover:text-sway-accent transition-colors cursor-pointer rounded hover:bg-sway-card-hi/30"
              aria-label="Toggle Fullscreen"
            >
              <Maximize size={20} />
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

export default Topbar
