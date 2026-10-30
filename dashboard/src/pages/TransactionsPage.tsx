import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  RefreshCw,
  Eye,
  FileText,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  AlertTriangle
} from 'lucide-react'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/useToast'
import { cn, formatRupiah } from '@/lib/utils'
import { Transaction } from '@/types'

// Reusable Stats Card Component
interface TransactionStatsCardProps {
  label: string
  value: string
  suffix?: string
  subtitle: string
  accentColorClass?: string
  accented?: boolean
}

function TransactionStatsCard({
  label,
  value,
  suffix,
  subtitle,
  accentColorClass = "border-l-sway-border",
  accented = false
}: TransactionStatsCardProps) {
  return (
    <div className={cn(
      "bg-sway-card border border-sway-border-dim border-l-4 rounded-[6px] p-5 relative overflow-hidden select-none",
      accentColorClass
    )}>
      {/* Visual background element simulating payment receipts */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-[0.03] text-sway-text pointer-events-none">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
      </div>

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

export function TransactionsPage() {
  const queryClient = useQueryClient()
  const { success, error } = useToast()

  // Search & Filter States
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // Detailed Modal View State
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)

  // Fetch transactions with pagination & status filters
  const { data, isLoading, isError: transactionsError, refetch } = useQuery({
    queryKey: ['transactions', page, limit, statusFilter],
    queryFn: async () => {
      const params: Record<string, any> = { page, limit }
      if (statusFilter !== 'ALL') {
        params.status = statusFilter
      }
      const response = await api.get('/api/transactions', { params })
      return response.data?.data as {
        transactions: Transaction[]
        pagination: {
          page: number
          limit: number
          total: number
          totalPages: number
        }
      }
    },
  })

  // Manual Midtrans Status Check Mutation
  const checkStatusMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      return api.get(`/api/transactions/${sessionId}`)
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      const status = res.data?.data?.status || 'UNKNOWN'
      success(
        'Status Diperbarui',
        `Status transaksi terbaru dari Midtrans adalah: ${status}`
      )
      refetch().then((refetched) => {
        if (selectedTx) {
          const updatedTx = refetched.data?.transactions.find(
            (tx) => tx.id === selectedTx.id
          )
          if (updatedTx) {
            setSelectedTx(updatedTx)
          }
        }
      })
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Gagal mengecek status transaksi'
      error('Kesalahan', msg)
    },
  })

  // Global listeners for Topbar search inputs and refresh triggers
  useEffect(() => {
    const handleSearch = (e: Event) => {
      const customEvent = e as CustomEvent<string>
      setSearchQuery(customEvent.detail || '')
      setPage(1)
    }

    const handleRefresh = () => {
      refetch()
      success('Transaksi Diperbarui', 'Data riwayat transaksi berhasil disinkronkan dengan gateway.')
    }

    window.addEventListener('transactions-search', handleSearch)
    window.addEventListener('transactions-refresh', handleRefresh)

    return () => {
      window.removeEventListener('transactions-search', handleSearch)
      window.removeEventListener('transactions-refresh', handleRefresh)
    }
  }, [refetch, success])

  const serverTransactions = data?.transactions || []

  // Filter local array with topbar searches
  const filteredTransactions = useMemo(() => {
    return serverTransactions.filter(tx => {
      const matchesSearch = !searchQuery ||
        tx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tx.externalId && tx.externalId.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (tx.session?.package?.name && tx.session.package.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (tx.session?.voucher?.code && tx.session.voucher.code.toLowerCase().includes(searchQuery.toLowerCase()))

      return matchesSearch
    })
  }, [serverTransactions, searchQuery])

  // Dynamic Pagination items count
  const totalPages = data?.pagination?.totalPages || 1

  const paginatedTransactions = useMemo(() => {
    return filteredTransactions
  }, [filteredTransactions])

  // Adjust page index if query bounds exceed
  useEffect(() => {
    if (page > totalPages) {
      setPage(1)
    }
  }, [filteredTransactions, page, totalPages])

  // Compute metrics from server data only
  const stats = useMemo(() => {
    const totalRevenue = serverTransactions
      .filter(tx => tx.status === 'PAID')
      .reduce((sum, tx) => sum + tx.amount, 0)

    const paidCount = serverTransactions.filter(tx => tx.status === 'PAID').length
    const pendingCount = serverTransactions.filter(tx => tx.status === 'PENDING').length

    return {
      totalRevenue,
      paidCount,
      pendingCount
    }
  }, [serverTransactions])

  // Render bespoke status badge capsule
  const getStatusBadge = (status: Transaction['status']) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-[4px] font-bold inline-flex items-center gap-1.5 leading-none select-none">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-sway-success" />
            PAID
          </span>
        )
      case 'PENDING':
        return (
          <span className="bg-amber-50 border border-amber-200 text-amber-700 text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-[4px] font-bold inline-flex items-center gap-1.5 leading-none select-none">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-sway-gold" />
            PENDING
          </span>
        )
      case 'FAILED':
        return (
          <span className="bg-red-50 border border-red-200 text-red-700 text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-[4px] font-bold inline-flex items-center gap-1.5 leading-none select-none">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-sway-error" />
            FAILED
          </span>
        )
      case 'EXPIRED':
        return (
          <span className="bg-sway-surface border border-sway-border text-sway-muted text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-[4px] font-bold inline-flex items-center gap-1.5 leading-none select-none">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-sway-dim" />
            EXPIRED
          </span>
        )
      default:
        return (
          <span className="bg-sway-card-hi border border-sway-border text-sway-ghost text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-[4px] font-bold inline-flex items-center gap-1.5 leading-none select-none">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-sway-ghost" />
            UNKNOWN
          </span>
        )
    }
  }

  // Indonesian short date formatter
  const formatIndoDate = (dateString?: string | null): string => {
    if (!dateString) return '—'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return '—'
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()} | ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }

  if (transactionsError) {
    return (
      <div className="rounded border border-sway-error/30 bg-sway-card p-6 text-center">
        <p className="font-bebas text-2xl text-sway-error">DATA TIDAK DAPAT DIMUAT</p>
        <p className="mt-2 text-sm text-sway-dim">Gagal mengambil data transaksi dari server.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 select-none animate-in fade-in-50 duration-300">
      {/* ROW 1: 3 Premium Financial Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TransactionStatsCard
          label="TOTAL PENDAPATAN (LUNAS)"
          value={formatRupiah(stats.totalRevenue)}
          subtitle="Akumulasi dari transaksi sukses (PAID)"
          accentColorClass="border-l-sway-accent"
          accented={true}
        />

        <TransactionStatsCard
          label="TRANSAKSI PAID"
          value={stats.paidCount.toString()}
          suffix="SESI"
          subtitle="Sesi photobooth berhasil lunas"
          accentColorClass="border-l-sway-success"
        />

        <TransactionStatsCard
          label="MENUNGGU PEMBAYARAN"
          value={stats.pendingCount.toString()}
          suffix="BILL"
          subtitle="Sesi dalam status antrean QRIS"
          accentColorClass={stats.pendingCount > 0 ? "border-l-sway-gold" : "border-l-sway-border"}
          accented={stats.pendingCount > 0}
        />
      </div>

      {/* ROW 2: Transaction Ledger Card */}
      <div className="bg-sway-card border border-sway-border-dim rounded-[6px] overflow-hidden">
        {/* CARD HEADER */}
        <div className="p-5 px-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="font-bebas text-[22px] text-sway-text tracking-wide uppercase leading-none">
            RIWAYAT TRANSAKSI
          </h2>

          <div className="flex flex-row items-center gap-3 w-full sm:w-auto">
            {/* Status Filter Dropdown */}
            <div className="flex flex-col gap-1 w-[160px]">
              <label className="font-grotesk text-[9px] uppercase tracking-widest text-sway-ghost font-bold leading-none mb-1">
                STATUS BAYAR
              </label>
              <div className="relative h-9 w-full">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value)
                    setPage(1)
                  }}
                  className="w-full h-full bg-sway-surface border border-sway-border rounded pl-3 pr-8 font-grotesk text-[11px] text-sway-text uppercase tracking-wider outline-none cursor-pointer appearance-none transition-colors focus:border-sway-accent"
                >
                  <option value="ALL">SEMUA STATUS</option>
                  <option value="PAID">PAID (LUNAS)</option>
                  <option value="PENDING">PENDING (ANTREAN)</option>
                  <option value="FAILED">FAILED (GAGAL)</option>
                  <option value="EXPIRED">EXPIRED (WARGA)</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sway-dim pointer-events-none" />
              </div>
            </div>

            {/* Limit Rows Dropdown */}
            <div className="flex flex-col gap-1 w-[110px]">
              <label className="font-grotesk text-[9px] uppercase tracking-widest text-sway-ghost font-bold leading-none mb-1">
                TAMPILKAN
              </label>
              <div className="relative h-9 w-full">
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

        {/* PREMIUM TRANSACTION LEDGER TABLE */}
        <div className="w-full overflow-x-auto">
          <div className="min-w-[900px]">
            {/* HEADERS */}
            <div className="flex items-center px-6 py-3 border-b border-sway-border-dim bg-transparent">
              <div className="w-[18%] font-grotesk text-[10px] uppercase tracking-[0.14em] font-bold text-sway-dim">ID TRANSAKSI</div>
              <div className="w-[25%] font-grotesk text-[10px] uppercase tracking-[0.14em] font-bold text-sway-dim">PAKET SESI</div>
              <div className="w-[12%] font-grotesk text-[10px] uppercase tracking-[0.14em] font-bold text-sway-dim">VOUCHER</div>
              <div className="w-[15%] font-grotesk text-[10px] uppercase tracking-[0.14em] font-bold text-sway-dim">TOTAL BAYAR</div>
              <div className="w-[15%] font-grotesk text-[10px] uppercase tracking-[0.14em] font-bold text-sway-dim">STATUS BAYAR</div>
              <div className="w-[15%] font-grotesk text-[10px] uppercase tracking-[0.14em] font-bold text-sway-dim">WAKTU</div>
              <div className="w-[10%] font-grotesk text-[10px] uppercase tracking-[0.14em] font-bold text-sway-dim text-right">AKSI</div>
            </div>

            {/* BODY ROWS */}
            {isLoading ? (
              <div className="h-64 flex flex-col justify-center items-center gap-3">
                <RefreshCw className="w-8 h-8 text-sway-accent animate-spin" />
                <span className="font-grotesk text-[13px] text-sway-dim">Memuat data ledger transaksi...</span>
              </div>
            ) : paginatedTransactions.length === 0 ? (
              <div className="h-64 flex flex-col justify-center items-center gap-2 border-b border-sway-border-dim/40">
                <AlertTriangle className="w-6 h-6 text-sway-dim opacity-50" />
                <span className="font-grotesk text-[13px] text-sway-text font-bold">Tidak ada transaksi ditemukan</span>
                <span className="font-grotesk text-[11px] text-sway-ghost">Silakan ubah filter pencarian atau antrean Anda</span>
              </div>
            ) : (
              paginatedTransactions.map((tx, idx) => {
                const isOdd = idx % 2 !== 0
                const session = tx.session
                const pkg = session?.package

                return (
                  <div
                    key={tx.id}
                    className={cn(
                      "flex items-center px-6 py-4 border-b border-sway-border-dim/40 hover:bg-sway-card-hi/20 transition-all duration-150 min-h-[64px]",
                      isOdd && "bg-sway-card-hi/5"
                    )}
                  >
                    {/* ID TRANSAKSI */}
                    <div className="w-[18%] pr-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[12px] font-bold text-sway-text uppercase select-all bg-sway-surface px-1.5 py-0.5 rounded border border-sway-border-dim">
                          #{tx.id.slice(-10)}
                        </span>
                      </div>
                      {tx.externalId && (
                        <div className="font-mono text-[9px] text-sway-ghost truncate mt-1" title={tx.externalId}>
                          M: {tx.externalId}
                        </div>
                      )}
                    </div>

                    {/* PAKET SESI */}
                    <div className="w-[25%] pr-3">
                      <div className="font-bebas text-[18px] text-sway-accent tracking-wide leading-none uppercase">
                        {pkg?.name || 'PAKET KUSTOM'}
                      </div>
                      <div className="font-grotesk text-[11px] text-sway-muted mt-1 select-none leading-none">
                        {pkg?.photoCount || 0} FOTO • {pkg?.duration || 0}S • SLOT TEMPLATE
                      </div>
                    </div>

                    {/* VOUCHER */}
                    <div className="w-[12%] pr-3">
                      {session?.voucher ? (
                        <span className="font-mono font-bold text-[11px] text-sway-gold bg-sway-gold/10 border border-sway-gold/20 px-2 py-0.5 rounded uppercase leading-none inline-block">
                          {session.voucher.code}
                        </span>
                      ) : (
                        <span className="font-grotesk text-[11px] text-sway-ghost font-bold">—</span>
                      )}
                    </div>

                    {/* TOTAL BAYAR */}
                    <div className="w-[15%] pr-3">
                      <span className="font-grotesk text-[13px] text-sway-text font-bold">
                        {formatRupiah(tx.amount)}
                      </span>
                    </div>

                    {/* STATUS BAYAR */}
                    <div className="w-[15%] pr-3 flex items-center">
                      {getStatusBadge(tx.status)}
                    </div>

                    {/* WAKTU TRANSAKSI */}
                    <div className="w-[15%] pr-3 font-grotesk text-[12px] text-sway-dim font-medium leading-none">
                      {formatIndoDate(tx.createdAt)}
                    </div>

                    {/* ACTIONS */}
                    <div className="w-[10%] flex items-center justify-end gap-2">
                      {/* View details */}
                      <button
                        onClick={() => setSelectedTx(tx)}
                        className="w-8 h-8 rounded-full bg-transparent flex items-center justify-center text-sway-dim hover:text-sway-text hover:bg-sway-card-hi transition-all duration-150 cursor-pointer"
                        title="Lihat Rincian Invoice"
                      >
                        <Eye size={15} />
                      </button>

                      {/* Manual Refresh Midtrans status on Pending */}
                      {tx.status === 'PENDING' && tx.session?.id && (
                        <button
                          onClick={() => checkStatusMutation.mutate(tx.session.id)}
                          disabled={checkStatusMutation.isPending}
                          className="w-8 h-8 rounded-full bg-transparent flex items-center justify-center text-sway-dim hover:text-sway-accent hover:bg-sway-card-hi transition-all duration-150 cursor-pointer disabled:opacity-40"
                          title="Cek Status Gateway"
                        >
                          <RefreshCw size={14} className={cn(checkStatusMutation.isPending && "animate-spin")} />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* PAGINATION PANEL */}
        <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-3.5 border-t border-sway-border-dim gap-4 bg-transparent select-none">
          {/* Left items count details */}
          <div className="font-grotesk text-[11px] uppercase tracking-[0.1em] text-sway-ghost font-bold">
            MENAMPILKAN {paginatedTransactions.length} DARI {filteredTransactions.length} TRANSAKSI
          </div>

          {/* Right Chevron and page numbers */}
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

      {/* Transaction Details Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sway-bg/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-[550px] bg-sway-card border border-sway-border rounded-[6px] text-sway-text shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* HEADER */}
            <div className="flex items-center justify-between p-5 border-b border-sway-border-dim">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-sway-accent/10 flex items-center justify-center text-sway-accent select-none">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="font-bebas text-[22px] tracking-wide text-sway-text leading-none mt-0.5">
                    RINCIAN TRANSAKSI
                  </h3>
                  <p className="font-mono text-[9px] text-sway-dim tracking-wider mt-1 uppercase select-all">
                    ID: {selectedTx.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="p-1.5 text-sway-dim hover:text-sway-text rounded-full hover:bg-sway-card-hi transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* BILLING SUMMARY BOX */}
            <div className="p-6 bg-sway-surface/60 border border-sway-border-dim rounded-[4px] flex justify-between items-center select-none mx-6 mt-6">
              <div className="flex flex-col">
                <span className="font-grotesk text-[9px] uppercase tracking-widest text-sway-dim font-bold leading-none">
                  TOTAL DIBAYAR
                </span>
                <span className="font-bebas text-[36px] text-sway-accent tracking-wide mt-1.5 leading-none">
                  {formatRupiah(selectedTx.amount)}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="font-grotesk text-[9px] uppercase tracking-widest text-sway-dim font-bold leading-none mb-1.5">
                  STATUS BAYAR
                </span>
                {getStatusBadge(selectedTx.status)}
              </div>
            </div>

            {/* INVOICE DETAILS GRID */}
            <div className="p-6 space-y-4 max-h-[380px] overflow-y-auto">
              <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-[12px] font-grotesk border-b border-sway-border-dim/40 pb-4">
                <div>
                  <span className="text-sway-ghost font-bold block uppercase text-[9px] tracking-wider leading-none mb-1">ID Transaksi</span>
                  <span className="font-mono text-sway-text uppercase select-all">{selectedTx.id}</span>
                </div>
                <div>
                  <span className="text-sway-ghost font-bold block uppercase text-[9px] tracking-wider leading-none mb-1">Midtrans Order ID</span>
                  <span className="font-mono text-sway-text select-all">{selectedTx.externalId || '—'}</span>
                </div>
                <div>
                  <span className="text-sway-ghost font-bold block uppercase text-[9px] tracking-wider leading-none mb-1">Dibuat Pada</span>
                  <span className="text-sway-muted font-medium">{formatIndoDate(selectedTx.createdAt)}</span>
                </div>
                <div>
                  <span className="text-sway-ghost font-bold block uppercase text-[9px] tracking-wider leading-none mb-1">Lunas Pada</span>
                  <span className="text-sway-muted font-medium">
                    {selectedTx.paidAt ? formatIndoDate(selectedTx.paidAt) : '—'}
                  </span>
                </div>
              </div>

              {/* Session detailed information */}
              {selectedTx.session ? (
                <div className="space-y-3 border-b border-sway-border-dim/40 pb-4">
                  <h4 className="font-bebas text-[16px] text-sway-accent tracking-wider uppercase leading-none">
                    SESI PHOTOBOOTH
                  </h4>
                  <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-[12px] font-grotesk">
                    <div>
                      <span className="text-sway-ghost font-bold block uppercase text-[9px] tracking-wider leading-none mb-1">Paket Digunakan</span>
                      <span className="font-bold text-sway-text">{selectedTx.session.package?.name || 'Paket Kustom'}</span>
                    </div>
                    <div>
                      <span className="text-sway-ghost font-bold block uppercase text-[9px] tracking-wider leading-none mb-1">Template Desain</span>
                      <span className="font-medium text-sway-text">{selectedTx.session.template?.name || '—'}</span>
                    </div>
                    <div>
                      <span className="text-sway-ghost font-bold block uppercase text-[9px] tracking-wider leading-none mb-1">Harga Asli Sesi</span>
                      <span className="font-medium text-sway-text">{formatRupiah(selectedTx.session.totalPrice || 0)}</span>
                    </div>
                    <div>
                      <span className="text-sway-ghost font-bold block uppercase text-[9px] tracking-wider leading-none mb-1">Voucher Diskon</span>
                      <span className="font-mono text-sway-gold bg-sway-gold/5 border border-sway-gold/10 px-1.5 py-0.5 rounded text-[11px] leading-none inline-block">
                        {selectedTx.session.voucher
                          ? `${selectedTx.session.voucher.code} (${
                              selectedTx.session.voucher.type === 'PERCENTAGE'
                                ? `${selectedTx.session.voucher.value}%`
                                : formatRupiah(selectedTx.session.voucher.value)
                            })`
                          : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-sway-ghost font-bold block uppercase text-[9px] tracking-wider leading-none mb-1">Status Sesi</span>
                      <span className="px-2 py-0.5 rounded bg-sway-surface border border-sway-border-dim text-sway-dim text-[10px] tracking-wider inline-block uppercase mt-0.5 font-bold leading-none select-none">
                        {selectedTx.session.status}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-[12px] text-sway-dim italic">Rincian data sesi photobooth tidak dapat diakses.</p>
              )}

              {/* PAYMENT Lifespan Timeline Visual */}
              <div className="space-y-3 pt-2">
                <h4 className="font-grotesk text-[9px] uppercase tracking-widest text-sway-dim font-bold border-b border-sway-border-dim/40 pb-1.5 leading-none">
                  LINI MASA PEMBAYARAN
                </h4>
                <div className="relative pl-6 space-y-4 py-2 select-none">
                  {/* Vertical connector */}
                  <div className="absolute left-[7px] top-2 bottom-2 w-[1px] bg-sway-border-dim" />

                  {/* Step 1: Created */}
                  <div className="relative">
                    <span className="absolute -left-[23px] top-0.5 w-3.5 h-3.5 rounded-full border border-sway-border bg-sway-card flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-sway-accent" />
                    </span>
                    <div className="font-grotesk text-[12px] font-bold text-sway-text leading-none">
                      Sesi Dibuat & Tagihan Diterbitkan
                    </div>
                    <div className="font-grotesk text-[10px] text-sway-dim mt-1.5">
                      {formatIndoDate(selectedTx.createdAt)}
                    </div>
                  </div>

                  {/* Step 2: Gateway verification */}
                  <div className="relative">
                    <span className={cn(
                      "absolute -left-[23px] top-0.5 w-3.5 h-3.5 rounded-full border bg-sway-card flex items-center justify-center",
                      selectedTx.status === 'PAID' ? "border-sway-success" : "border-sway-gold"
                    )}>
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        selectedTx.status === 'PAID' ? "bg-sway-success" : "bg-sway-gold"
                      )} />
                    </span>
                    <div className="font-grotesk text-[12px] font-bold text-sway-text leading-none">
                      Menunggu Transaksi QRIS (Midtrans)
                    </div>
                    <div className="font-grotesk text-[10px] text-sway-dim mt-1.5">
                      Order ID: {selectedTx.externalId || '—'}
                    </div>
                  </div>

                  {/* Step 3: Finished */}
                  <div className="relative">
                    <span className={cn(
                      "absolute -left-[23px] top-0.5 w-3.5 h-3.5 rounded-full border bg-sway-card flex items-center justify-center",
                      selectedTx.status === 'PAID' ? "border-sway-success" :
                      (selectedTx.status === 'FAILED' || selectedTx.status === 'EXPIRED') ? "border-sway-error" : "border-sway-border-dim"
                    )}>
                      {selectedTx.status === 'PAID' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-sway-success" />
                      )}
                      {(selectedTx.status === 'FAILED' || selectedTx.status === 'EXPIRED') && (
                        <span className="w-1.5 h-1.5 rounded-full bg-sway-error" />
                      )}
                    </span>
                    <div className={cn(
                      "font-grotesk text-[12px] font-bold leading-none",
                      selectedTx.status === 'PAID' ? "text-emerald-600" :
                      (selectedTx.status === 'FAILED' || selectedTx.status === 'EXPIRED') ? "text-red-600" : "text-sway-ghost"
                    )}>
                      {selectedTx.status === 'PAID' ? "Pembayaran Diterima (Lunas)" :
                       (selectedTx.status === 'FAILED' || selectedTx.status === 'EXPIRED') ? `Transaksi Gagal (${selectedTx.status})` :
                       "Menunggu Pelunasan Sesi"}
                    </div>
                    {selectedTx.paidAt && (
                      <div className="font-grotesk text-[10px] text-sway-dim mt-1.5">
                        {formatIndoDate(selectedTx.paidAt)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* BUTTON ACTIONS FOOTER */}
            <div className="p-5 bg-sway-surface/40 border-t border-sway-border-dim flex justify-between items-center gap-3">
              {selectedTx.status === 'PENDING' && selectedTx.session?.id && (
                <button
                  onClick={() => checkStatusMutation.mutate(selectedTx.session.id)}
                  disabled={checkStatusMutation.isPending}
                  className="bg-transparent border border-sway-accent hover:bg-sway-accent/15 text-sway-accent font-grotesk text-[11px] uppercase tracking-wider font-bold h-9 px-4 rounded flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-40"
                >
                  <RefreshCw size={13} className={cn(checkStatusMutation.isPending && "animate-spin")} />
                  Cek Status Gateway
                </button>
              )}
              <button
                onClick={() => setSelectedTx(null)}
                className="bg-sway-accent text-white font-grotesk text-[11px] uppercase tracking-wider font-bold h-9 px-4.5 rounded cursor-pointer transition-all hover:brightness-110 ml-auto"
              >
                TUTUP INVOICE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default TransactionsPage
