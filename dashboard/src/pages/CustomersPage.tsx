import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  RefreshCw,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  User,
  Trash2,
  AlertTriangle,
} from 'lucide-react'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/useToast'
import { cn, formatRupiah } from '@/lib/utils'
import { Customer } from '@/types'

// Reusable Stats Card Component
interface CustomerStatsCardProps {
  label: string
  value: string
  suffix?: string
  subtitle: string
  accentColorClass?: string
  accented?: boolean
}

function CustomerStatsCard({
  label,
  value,
  suffix,
  subtitle,
  accentColorClass = "border-l-sway-border",
  accented = false
}: CustomerStatsCardProps) {
  return (
    <div className={cn(
      "bg-sway-card border border-sway-border-dim border-l-4 rounded-[6px] p-5 relative overflow-hidden select-none",
      accentColorClass
    )}>
      <div className="font-grotesk text-[10px] uppercase tracking-[0.12em] font-bold text-sway-dim">
        {label}
      </div>
      <div className="flex items-baseline gap-2 mt-2">
        <span className={cn("font-bebas text-[42px] leading-none text-sway-text", accented && "text-sway-accent")}>
          {value}
        </span>
        {suffix && (
          <span className="font-grotesk text-[13px] font-bold uppercase text-sway-ghost">
            {suffix}
          </span>
        )}
      </div>
      <div className="font-grotesk text-[12px] text-sway-ghost mt-3 flex items-center leading-none">
        {subtitle}
      </div>
    </div>
  )
}

export function CustomersPage() {
  const { success, error } = useToast()

  // Search & Filter States
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [searchQuery, setSearchQuery] = useState('')

  // Detail Modal View State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [historyPage, setHistoryPage] = useState(1)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const history = useQuery({
    queryKey: ['customer-history', selectedCustomer?.id, historyPage],
    enabled: !!selectedCustomer,
    queryFn: async () => (await api.get(`/api/customers/${selectedCustomer!.id}/history`, {
      params: { page: historyPage, limit: 20 },
    })).data.data as { bookings: { id: string; paymentStatus: string; packageId?: { name: string }; eventDate: string; totalAmount?: number; createdAt: string }[]; pagination: { totalPages: number } },
  })
  const customerHistory = history.data?.bookings || []

  // Fetch customers with pagination & search
  const { data, isLoading, isError: customersError, refetch } = useQuery({
    queryKey: ['customers', page, limit, searchQuery],
    queryFn: async () => {
      const params: Record<string, any> = { page, limit }
      if (searchQuery) {
        params.search = searchQuery
      }
      const response = await api.get('/api/customers', { params })
      return response.data?.data as {
        customers: Customer[]
        stats: { totalCustomers: number; totalBookings: number; totalSpent: number; activeCustomers: number }
        pagination: {
          page: number
          limit: number
          total: number
          totalPages: number
        }
      }
    },
  })

  const serverCustomers = data?.customers || []
  const totalPages = data?.pagination?.totalPages || 1

  const stats = data?.stats || { totalCustomers: 0, totalBookings: 0, totalSpent: 0, activeCustomers: 0 }
  const filteredCustomers = serverCustomers
  const paginatedCustomers = serverCustomers
  useEffect(() => {
    if (data && page > totalPages) setPage(totalPages)
  }, [data, page, totalPages])

  const saveCustomer = async () => {
    if (!selectedCustomer || !editName.trim()) return
    setSaving(true)
    try {
      const response = await api.put(`/api/customers/${selectedCustomer.id}`, { name: editName.trim(), phone: editPhone.trim() })
      setSelectedCustomer(response.data.data)
      await refetch()
      success('Tersimpan', 'Kontak pelanggan diperbarui.')
    } catch { error('Gagal Menyimpan', 'Kontak belum diperbarui. Silakan coba lagi.') }
    finally { setSaving(false) }
  }

  const syncCustomers = async () => {
    setSyncing(true)
    try {
      await api.post('/api/customers/sync')
      await refetch()
      success('Sinkronisasi Selesai', 'Data pelanggan diperbarui dari booking.')
    } catch { error('Sinkronisasi Gagal', 'Silakan coba lagi.') }
    finally { setSyncing(false) }
  }

  const handleDeleteCustomer = async (id: string) => {
    if (!window.confirm('Hapus kontak pelanggan? Riwayat booking tetap tersimpan. Sinkronisasi dapat membuat kontak kembali.')) {
      return
    }
    try {
      await api.delete(`/api/customers/${id}`)
      success('Pelanggan Dihapus', 'Data pelanggan berhasil dihapus dari sistem.')
      refetch()
    } catch (err: any) {
      error('Gagal Menghapus', err.response?.data?.message || 'Gagal menghapus pelanggan.')
    }
  }

  const formatIndoDate = (dateString?: string | null): string => {
    if (!dateString) return '—'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return '—'
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
  }

  if (customersError) {
    return (
      <div className="rounded border border-sway-error/30 bg-sway-card p-6 text-center">
        <p className="font-bebas text-2xl text-sway-error">DATA TIDAK DAPAT DIMUAT</p>
        <p className="mt-2 text-sm text-sway-dim">Gagal mengambil data pelanggan dari server.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 select-none animate-in fade-in-50 duration-300">
      {/* ROW 1: Customer Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <CustomerStatsCard
          label="TOTAL PELANGGAN"
          value={stats.totalCustomers.toString()}
          suffix="ORANG"
          subtitle="Pelanggan unik yang telah melakukan pemesanan"
          accentColorClass="border-l-sway-accent"
        />
        <CustomerStatsCard
          label="TOTAL BOOKING"
          value={stats.totalBookings.toString()}
          suffix="TRANSAKSI"
          subtitle="Jumlah semua pemesanan pelanggan"
          accentColorClass="border-l-sway-gold"
        />
        <CustomerStatsCard
          label="TOTAL PENGELUARAN"
          value={formatRupiah(stats.totalSpent)}
          suffix="TOTAL"
          subtitle="Pembayaran lunas dengan nominal tercatat"
          accentColorClass="border-l-sway-success"
          accented={true}
        />
        <CustomerStatsCard
          label="PELANGGAN AKTIF"
          value={stats.activeCustomers.toString()}
          suffix="ORANG"
          subtitle="Pelanggan dengan minimal 1 booking"
          accentColorClass="border-l-sway-success"
        />
      </div>

      {/* ROW 2: Customer Ledger Card */}
      <div className="bg-sway-card border border-sway-border-dim rounded-[6px] overflow-hidden">
        {/* CARD HEADER */}
        <div className="p-5 px-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="font-bebas text-[22px] text-sway-text tracking-wide uppercase leading-none">
              DATA PELANGGAN
            </h2>
            <p className="font-grotesk text-[11px] text-sway-dim mt-1">
              Kelola kontak dan riwayat pelanggan photobooth
            </p>
          </div>
          <div className="flex flex-row items-center gap-3 w-full sm:w-auto">
            <button onClick={syncCustomers} disabled={syncing} className="text-sway-accent text-xs disabled:opacity-50">{syncing ? 'Sinkronisasi...' : 'Sinkronkan booking'}</button>
            {/* Search */}
            <div className="relative w-full sm:w-[280px]">
              <label className="font-grotesk text-[9px] uppercase tracking-widest text-sway-ghost font-bold leading-none mb-1 block">
                CARI PELANGGAN
              </label>
              <div className="flex items-center">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sway-dim" />
                <input
                  type="text"
                  placeholder="Nama, email, atau telepon..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setPage(1)
                  }}
                  className="w-full h-10 pl-10 pr-4 bg-sway-surface border border-sway-border rounded font-grotesk text-[11px] text-sway-text outline-none cursor-pointer appearance-none transition-colors focus:border-sway-accent"
                />
              </div>
            </div>

            {/* Limit Rows Dropdown */}
            <div className="flex flex-col gap-1 w-[110px]">
              <label className="font-grotesk text-[9px] uppercase tracking-widest text-sway-ghost font-bold leading-none mb-1">
                TAMPILKAN
              </label>
              <div className="relative h-10 w-full">
                <select
                  value={limit.toString()}
                  onChange={(e) => {
                    setLimit(parseInt(e.target.value))
                    setPage(1)
                  }}
                  className="w-full h-full bg-sway-surface border border-sway-border rounded pl-3 pr-8 font-grotesk text-[11px] text-sway-text uppercase tracking-wider outline-none cursor-pointer appearance-none transition-colors focus:border-sway-accent"
                >
                  <option value="10">10 BARIS</option>
                  <option value="20">20 BARIS</option>
                  <option value="50">50 BARIS</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sway-dim pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* CUSTOMER TABLE */}
        <div className="w-full overflow-x-auto">
          <div className="min-w-[900px]">
            {/* HEADERS */}
            <div className="flex items-center px-6 py-3 border-b border-sway-border-dim bg-transparent">
              <div className="w-[20%] font-grotesk text-[10px] uppercase tracking-[0.14em] font-bold text-sway-dim">NAMA</div>
              <div className="w-[25%] font-grotesk text-[10px] uppercase tracking-[0.14em] font-bold text-sway-dim">EMAIL</div>
              <div className="w-[15%] font-grotesk text-[10px] uppercase tracking-[0.14em] font-bold text-sway-dim">TELEPON</div>
              <div className="w-[12%] font-grotesk text-[10px] uppercase tracking-[0.14em] font-bold text-sway-dim text-right">TOTAL BOOKING</div>
              <div className="w-[15%] font-grotesk text-[10px] uppercase tracking-[0.14em] font-bold text-sway-dim text-right">TOTAL BELANJA</div>
              <div className="w-[13%] font-grotesk text-[10px] uppercase tracking-[0.14em] font-bold text-sway-dim">TERAKHIR BOOKING</div>
              <div className="w-[10%] font-grotesk text-[10px] uppercase tracking-[0.14em] font-bold text-sway-dim text-right">AKSI</div>
            </div>

            {/* BODY ROWS */}
            {isLoading ? (
              <div className="h-64 flex flex-col justify-center items-center gap-3">
                <RefreshCw className="w-8 h-8 text-sway-accent animate-spin" />
                <span className="font-grotesk text-[13px] text-sway-dim">Memuat data pelanggan...</span>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="h-64 flex flex-col justify-center items-center gap-2 border-b border-sway-border-dim/40">
                <AlertTriangle className="w-6 h-6 text-sway-dim opacity-50" />
                <span className="font-grotesk text-[13px] text-sway-text font-bold">Tidak ada pelanggan ditemukan</span>
                <span className="font-grotesk text-[11px] text-sway-ghost">Coba ubah kata kunci pencarian atau filter Anda</span>
              </div>
            ) : (
              paginatedCustomers.map((customer, idx) => {
                const isOdd = idx % 2 !== 0
                return (
                  <div
                    key={customer.id}
                    className={cn(
                      "flex items-center px-6 py-4 border-b border-sway-border-dim/40 hover:bg-sway-card-hi/20 transition-all duration-150 min-h-[64px]",
                      isOdd && "bg-sway-card-hi/5"
                    )}
                  >
                    {/* NAME */}
                    <div className="w-[20%] pr-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-sway-accent/10 flex items-center justify-center text-sway-accent font-bold text-[11px] uppercase">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bebas text-[13px] text-sway-text leading-none uppercase">
                            {customer.name}
                          </span>
                          <span className="font-grotesk text-[10px] text-sway-dim block mt-0.5">
                            {customer.email}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* EMAIL */}
                    <div className="w-[25%] pr-3">
                      <span className="font-mono text-[12px] text-sway-text uppercase select-all">
                        {customer.email}
                      </span>
                    </div>

                    {/* PHONE */}
                    <div className="w-[15%] pr-3">
                      {customer.phone ? (
                        <span className="font-mono text-[12px] text-sway-text select-all">{customer.phone}</span>
                      ) : (
                        <span className="font-grotesk text-[12px] text-sway-ghost font-bold">—</span>
                      )}
                    </div>

                    {/* TOTAL BOOKING */}
                    <div className="w-[12%] pr-3 text-right">
                      <span className={cn(
                        "font-bebas text-[14px] font-bold",
                        customer.totalBookings > 0 ? "text-sway-accent" : "text-sway-dim"
                      )}>
                        {customer.totalBookings}
                      </span>
                    </div>

                    {/* TOTAL SPENT */}
                    <div className="w-[15%] pr-3 text-right">
                      <span className={cn(
                        "font-grotesk text-[13px] font-bold",
                        customer.totalSpent > 0 ? "text-sway-success" : "text-sway-dim"
                      )}>
                        {customer.totalSpent > 0 ? formatRupiah(customer.totalSpent) : '—'}
                      </span>
                    </div>

                    {/* LAST BOOKING */}
                    <div className="w-[13%] pr-3">
                      <span className="font-grotesk text-[12px] text-sway-dim font-medium leading-none">
                        {customer.lastBookingAt ? formatIndoDate(customer.lastBookingAt) : '—'}
                      </span>
                    </div>

                    {/* ACTIONS */}
                    <div className="w-[10%] flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedCustomer(customer)
                          setHistoryPage(1)
                          setEditName(customer.name)
                          setEditPhone(customer.phone || '')
                        }}
                        className="w-8 h-8 rounded-full bg-transparent flex items-center justify-center text-sway-dim hover:text-sway-text hover:bg-sway-card-hi transition-all duration-150 cursor-pointer"
                        title="Lihat Detail Pelanggan"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteCustomer(customer.id)}
                        className="w-8 h-8 rounded-full bg-transparent flex items-center justify-center text-sway-dim hover:text-sway-error hover:bg-sway-error/10 transition-all duration-150 cursor-pointer"
                        title="Hapus Pelanggan"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* PAGINATION PANEL */}
        <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-3.5 border-t border-sway-border-dim gap-4 bg-transparent select-none">
          <div className="font-grotesk text-[11px] uppercase tracking-[0.1em] text-sway-ghost font-bold">
            MENAMPILKAN {paginatedCustomers.length} DARI {data?.pagination.total || 0} PELANGGAN
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              disabled={page <= 1}
              className="w-8 h-8 flex items-center justify-center text-sway-dim hover:text-sway-text hover:bg-sway-card-hi transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }).map((_, idx) => {
              const p = idx + 1
              const isActive = p === page
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn(
                    "w-8 h-8 rounded text-[13px] font-grotesk font-bold transition-all duration-150 flex items-center justify-center border select-none cursor-pointer",
                    isActive
                      ? "bg-sway-accent text-white border-sway-accent"
                      : "bg-transparent text-sway-dim border-sway-border-dim hover:text-sway-text hover:border-sway-border"
                  )}
                >
                  {p}
                </button>
              )
            })}
            <button
              onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
              disabled={page >= totalPages}
              className="w-8 h-8 flex items-center justify-center text-sway-dim hover:text-sway-text hover:bg-sway-card-hi transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sway-bg/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-[550px] max-h-[90vh] overflow-y-auto bg-sway-card border border-sway-border rounded-[6px] text-sway-text shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col">
            {/* HEADER */}
            <div className="flex items-center justify-between p-5 border-b border-sway-border-dim">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-sway-accent/10 flex items-center justify-center text-sway-accent select-none">
                  <User size={20} />
                </div>
                <div>
                  <h3 className="font-bebas text-[22px] tracking-wide text-sway-text leading-none mt-0.5">
                    DETAIL PELANGGAN
                  </h3>
                  <p className="font-mono text-[9px] text-sway-dim tracking-wider mt-1 uppercase select-all">
                    {selectedCustomer.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1.5 text-sway-dim hover:text-sway-text rounded-full hover:bg-sway-card-hi transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* CUSTOMER INFO */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-[12px] font-grotesk border-b border-sway-border-dim/40 pb-4">
                <div>
                  <span className="text-sway-ghost font-bold block uppercase text-[9px] tracking-wider leading-none mb-1">Nama Lengkap</span>
                  <input aria-label="Nama pelanggan" value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-sway-surface p-2 text-sway-text" />
                </div>
                <div>
                  <span className="text-sway-ghost font-bold block uppercase text-[9px] tracking-wider leading-none mb-1">Email</span>
                  <span className="font-mono text-sway-text select-all">{selectedCustomer.email}</span>
                </div>
                <div>
                  <span className="text-sway-ghost font-bold block uppercase text-[9px] tracking-wider leading-none mb-1">Telepon</span>
                  <span className={cn(
                    "font-mono text-sway-text select-all",
                    !selectedCustomer.phone ? "text-sway-ghost" : ""
                  )}>
                    <input aria-label="Telepon pelanggan" value={editPhone} onChange={e => setEditPhone(e.target.value)} className="w-full bg-sway-surface p-2" />
                  </span>
                </div>
                <div>
                  <span className="text-sway-ghost font-bold block uppercase text-[9px] tracking-wider leading-none mb-1">Total Booking</span>
                  <span className="font-bebas text-sway-accent uppercase">{selectedCustomer.totalBookings}</span>
                </div>
                <div>
                  <span className="text-sway-ghost font-bold block uppercase text-[9px] tracking-wider leading-none mb-1">Total Pengeluaran</span>
                  <span className="font-bebas text-sway-success uppercase">
                    {formatRupiah(selectedCustomer.totalSpent)}
                  </span>
                </div>
                <div>
                  <span className="text-sway-ghost font-bold block uppercase text-[9px] tracking-wider leading-none mb-1">Terakhir Booking</span>
                  <span className="font-medium text-sway-text">
                    {selectedCustomer.lastBookingAt ? formatIndoDate(selectedCustomer.lastBookingAt) : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-sway-ghost font-bold block uppercase text-[9px] tracking-wider leading-none mb-1">Daftar Pada</span>
                  <span className="font-medium text-sway-text">
                    {formatIndoDate(selectedCustomer.createdAt)}
                  </span>
                </div>
              </div>

              {/* HISTORY SECTION */}
              <div className="space-y-3">
                <h4 className="font-bebas text-[16px] text-sway-accent tracking-wider uppercase leading-none">
                  RIWAYAT BOOKING
                </h4>
                {history.isLoading ? <p>Memuat riwayat...</p> : history.isError ? <button onClick={() => history.refetch()}>Gagal memuat riwayat. Coba lagi</button> : customerHistory.length === 0 ? (
                  <div className="py-6 text-center text-sway-dim">
                    Belum ada riwayat booking untuk pelanggan ini.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {customerHistory.map((booking) => (
                      <div key={booking.id} className="border border-sway-border-dim rounded-lg p-3 bg-sway-surface/30">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-bebas text-[14px] text-sway-text uppercase">
                            #{booking.id?.slice(-8)}
                          </span>
                          <span className={cn(
                            "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded",
                            booking.paymentStatus === 'PAID' ? "bg-sway-success/10 text-sway-success" : "bg-sway-gold/10 text-sway-gold"
                          )}>
                            {booking.paymentStatus}
                          </span>
                        </div>
                        <div className="text-[11px] text-sway-dim space-y-1">
                          <div className="flex justify-between">
                            <span className="text-sway-ghost font-bold uppercase text-[9px]">PAKET</span>
                            <span className="text-sway-text">{booking.packageId?.name || 'Paket Kustom'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sway-ghost font-bold uppercase text-[9px]">TGL ACARA</span>
                            <span className="text-sway-text">{booking.eventDate ? formatIndoDate(booking.eventDate) : '—'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sway-ghost font-bold uppercase text-[9px]">TOTAL</span>
                            <span className="font-mono text-sway-text">{booking.totalAmount === undefined ? 'Tidak tercatat' : formatRupiah(booking.totalAmount)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sway-ghost font-bold uppercase text-[9px]">DIBUAT</span>
                            <span className="text-sway-dim">{booking.createdAt ? formatIndoDate(booking.createdAt) : '—'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* BUTTONS FOOTER */}
            <div className="flex justify-between px-6 pb-3 text-xs">
              <button disabled={historyPage <= 1} onClick={() => setHistoryPage(p => p - 1)}>Riwayat sebelumnya</button>
              <span>{historyPage}</span>
              <button disabled={historyPage >= (history.data?.pagination.totalPages || 1)} onClick={() => setHistoryPage(p => p + 1)}>Riwayat berikutnya</button>
            </div>
            <div className="p-5 bg-sway-surface/40 border-t border-sway-border-dim flex justify-between items-center gap-3">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="bg-transparent border border-sway-border-dim hover:bg-sway-card-hi text-sway-dim hover:text-sway-text font-grotesk text-[11px] uppercase tracking-wider font-bold h-9 px-4 rounded cursor-pointer transition-all"
              >
                TUTUP
              </button>
              <button
                onClick={saveCustomer}
                disabled={saving || !editName.trim()}
                className="bg-sway-accent text-white font-grotesk text-[11px] uppercase tracking-wider font-bold h-9 px-4.5 rounded cursor-pointer transition-all hover:brightness-110"
              >
                {saving ? 'MENYIMPAN...' : 'SIMPAN KONTAK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomersPage
