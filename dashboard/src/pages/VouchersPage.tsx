import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  Trash2, 
  Loader2, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Pencil, 
  X 
} from 'lucide-react'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/useToast'
import { cn, formatRupiah } from '@/lib/utils'
import { Voucher } from '@/types'

// Reusable Progress Bar Component for Kolom Terpakai
interface VoucherUsageBarProps {
  used: number
  quota: number
  colorClass: string
}

function VoucherUsageBar({ used, quota, colorClass }: VoucherUsageBarProps) {
  const pct = quota > 0 ? Math.round((used / quota) * 100) : 0
  return (
    <div className="flex flex-col gap-1 w-full select-none">
      <div className="flex justify-between items-center text-[12px] font-grotesk leading-none">
        <span className="text-sway-muted font-medium">{used}/{quota}</span>
        <span className="text-sway-ghost font-medium">{pct}%</span>
      </div>
      <div className="w-full h-1 bg-sway-card-hi rounded-full overflow-hidden mt-1">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// Stats Card Component
interface VoucherStatsCardProps {
  label: string
  value: string
  suffix?: string
  subtitle: string
  accented?: boolean
  isDotSubtitle?: boolean
}

function VoucherStatsCard({
  label,
  value,
  suffix,
  subtitle,
  accented = false,
  isDotSubtitle = false
}: VoucherStatsCardProps) {
  return (
    <div className="bg-sway-card border border-sway-border-dim rounded-[6px] p-5 relative overflow-hidden select-none">
      {/* Visual background element simulating a voucher ticket */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-[0.03] text-sway-text pointer-events-none">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M2 9V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a3 3 0 0 0 0 6v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-4a3 3 0 0 0 0-6Z" />
          <path d="M12 3v18" strokeDasharray="3 3" />
        </svg>
      </div>

      <div className={cn(
        "font-grotesk text-[10px] uppercase tracking-[0.12em] font-bold",
        accented ? "text-sway-accent" : "text-sway-dim"
      )}>
        {label}
      </div>
      <div className="flex items-baseline gap-2 mt-2">
        <span className={cn("font-bebas text-[48px] leading-none", accented ? "text-sway-accent" : "text-sway-text")}>
          {value}
        </span>
        {suffix && (
          <span className={cn("font-grotesk text-[13px] font-bold uppercase", accented ? "text-sway-accent" : "text-sway-ghost")}>
            {suffix}
          </span>
        )}
      </div>
      <div className="font-grotesk text-[12px] text-sway-ghost mt-3 flex items-center leading-none">
        {isDotSubtitle && (
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-sway-ghost mr-1.5" />
        )}
        {subtitle}
      </div>
    </div>
  )
}

// Schema validation for Voucher Form
const voucherSchema = z.object({
  code: z
    .string()
    .min(1, 'Kode voucher wajib diisi')
    .regex(/^[A-Z0-9]+$/, 'Kode voucher hanya boleh berisi huruf kapital dan angka tanpa spasi')
    .trim(),
  type: z.enum(['PERCENTAGE', 'FIXED']),
  value: z.coerce.number().min(1, 'Nilai diskon minimal bernilai 1'),
  quota: z.coerce.number().min(1, 'Kuota minimal bernilai 1'),
  expiredAt: z.string().optional().or(z.literal('')),
  isActive: z.boolean().default(true),
})

type VoucherFormValues = z.infer<typeof voucherSchema>

export function VouchersPage() {
  const queryClient = useQueryClient()
  const { success, error } = useToast()

  // Filters State
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null)
  const [deletingVoucher, setDeletingVoucher] = useState<Voucher | null>(null)

  // Listen to topbar searches & open modal requests
  useEffect(() => {
    const handleSearch = (e: Event) => {
      const customEvent = e as CustomEvent<string>
      setSearchQuery(customEvent.detail || '')
      setCurrentPage(1) // Reset to page 1 on new search
    }
    const handleOpenModal = () => {
      openCreateForm()
    }

    window.addEventListener('vouchers-search', handleSearch)
    window.addEventListener('open-add-voucher-modal', handleOpenModal)

    return () => {
      window.removeEventListener('vouchers-search', handleSearch)
      window.removeEventListener('open-add-voucher-modal', handleOpenModal)
    }
  }, [])

  // Fetch vouchers
  const { data: serverVouchers = [], isLoading, isError: vouchersError, refetch } = useQuery({
    queryKey: ['vouchers'],
    queryFn: async () => {
      const response = await api.get('/api/vouchers')
      return response.data?.data as Voucher[]
    },
  })

  const vouchers = serverVouchers

  // React Hook Form Configuration
  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<VoucherFormValues>({
    resolver: zodResolver(voucherSchema) as any,
    defaultValues: {
      code: '',
      type: 'PERCENTAGE',
      value: 10,
      quota: 100,
      expiredAt: '',
      isActive: true,
    },
  })

  const watchedType = watch('type')

  // Create Voucher mutation
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post('/api/vouchers', payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] })
      success('Voucher Dibuat', 'Kupon voucher baru berhasil ditambahkan!')
      closeForm()
      refetch()
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Gagal menambahkan voucher'
      error('Kesalahan', msg)
    },
  })

  // Update Voucher mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      return api.put(`/api/vouchers/${id}`, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] })
      success('Voucher Diperbarui', 'Perubahan kupon voucher berhasil disimpan!')
      closeForm()
      refetch()
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Gagal memperbarui voucher'
      error('Kesalahan', msg)
    },
  })

  // Delete Voucher mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/api/vouchers/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] })
      success('Voucher Dihapus', 'Kupon voucher telah berhasil dihapus secara permanen!')
      setDeletingVoucher(null)
      refetch()
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Gagal menghapus voucher'
      error('Kesalahan', msg)
    },
  })

  // Form Operations
  const openCreateForm = () => {
    setEditingVoucher(null)
    reset({
      code: '',
      type: 'PERCENTAGE',
      value: 10,
      quota: 100,
      expiredAt: '',
      isActive: true,
    })
    setIsFormOpen(true)
  }

  const openEditForm = (voucher: Voucher) => {
    setEditingVoucher(voucher)
    reset({
      code: voucher.code,
      type: voucher.type,
      value: voucher.value,
      quota: voucher.quota,
      expiredAt: voucher.expiredAt ? new Date(voucher.expiredAt).toISOString().split('T')[0] : '',
      isActive: voucher.isActive,
    })
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingVoucher(null)
  }

  const onFormSubmit = (values: VoucherFormValues) => {
    const payload = {
      ...values,
      code: values.code.toUpperCase(), // Auto uppercase
      expiredAt: values.expiredAt ? new Date(values.expiredAt).toISOString() : null,
    }

    if (editingVoucher) {
      updateMutation.mutate({ id: editingVoucher.id, payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleDeleteConfirm = () => {
    if (!deletingVoucher) return
    deleteMutation.mutate(deletingVoucher.id)
  }

  // Voucher state determination
  const getVoucherStatus = (voucher: Voucher): 'aktif' | 'habis' | 'expired' | 'nonaktif' => {
    if (!voucher.isActive) return 'nonaktif'
    if (voucher.expiredAt && new Date(voucher.expiredAt) < new Date()) return 'expired'
    if (voucher.used >= voucher.quota) return 'habis'
    return 'aktif'
  }

  // Progress Bar color code
  const getProgressColor = (voucher: Voucher): string => {
    const status = getVoucherStatus(voucher)
    if (status === 'expired' || status === 'nonaktif') return 'bg-sway-ghost' // abu/ghost
    if (status === 'habis') return 'bg-sway-accent' // merah
    
    // Critical state based on quota count first
    if (voucher.quota - voucher.used < 10) return 'bg-sway-gold' // kuning (stok kritis < 10)
    
    const pct = (voucher.used / voucher.quota) * 100
    if (pct >= 80) return 'bg-sway-accent' // merah
    if (pct >= 50) return 'bg-sway-gold' // kuning
    return 'bg-[#3b82f6]' // biru
  }

  // Indonesian Date Formatter
  const formatIndoDate = (dateString?: string | null): string => {
    if (!dateString) return '—'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return '—'
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
  }

  // Compute Metrics Panel from vouchers list
  const metrics = useMemo(() => {
    const total = vouchers.length
    const nonActive = vouchers.filter(v => getVoucherStatus(v) === 'nonaktif').length
    
    // Stock kritis (quota - used < 10 && status !== habis && status !== expired && status !== nonaktif)
    const kritis = vouchers.filter(v => {
      const s = getVoucherStatus(v)
      return s === 'aktif' && (v.quota - v.used < 10)
    }).length

    return {
      total,
      nonActive,
      kritis
    }
  }, [vouchers])

  // Filter Logic (client-side)
  const filteredVouchers = useMemo(() => {
    let result = vouchers

    // Status Filter
    if (statusFilter !== 'all') {
      result = result.filter(v => getVoucherStatus(v) === statusFilter)
    }

    // Type Filter
    if (typeFilter !== 'all') {
      result = result.filter(v => v.type === typeFilter.toUpperCase())
    }

    // Search Query (by code)
    if (searchQuery) {
      result = result.filter(v => v.code.toLowerCase().includes(searchQuery.toLowerCase()))
    }

    return result
  }, [vouchers, statusFilter, typeFilter, searchQuery])

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(filteredVouchers.length / itemsPerPage))
  const paginatedVouchers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredVouchers.slice(start, start + itemsPerPage)
  }, [filteredVouchers, currentPage])

  // Adjust page index if filters exceed count
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1)
    }
  }, [filteredVouchers, currentPage, totalPages])

  const isMutating = createMutation.isPending || updateMutation.isPending

  if (vouchersError) {
    return (
      <div className="rounded border border-sway-error/30 bg-sway-card p-6 text-center">
        <p className="font-bebas text-2xl text-sway-error">DATA TIDAK DAPAT DIMUAT</p>
        <p className="mt-2 text-sm text-sway-dim">Gagal mengambil data voucher dari server.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 select-none">
      {/* ROW 1: Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: TOTAL VOUCHER */}
        <VoucherStatsCard
          label="TOTAL VOUCHER"
          value={metrics.total.toString()}
          suffix="TOTAL"
          subtitle={`● ${metrics.nonActive} nonaktif`}
          isDotSubtitle={true}
        />

        {/* Card 2: PEMAKAIAN HARI INI */}
        <VoucherStatsCard
          label="PEMAKAIAN HARI INI"
          value="—"
          subtitle="data harian belum tersedia"
        />

        {/* Card 3: VOUCHER HAMPIR HABIS */}
        <VoucherStatsCard
          label="VOUCHER HAMPIR HABIS"
          value={metrics.kritis.toString()}
          suffix="STOK KRITIS"
          subtitle="kuota tersisa < 10"
          accented={true}
        />
      </div>

      {/* ROW 2: Voucher Table Card */}
      <div className="bg-sway-card border border-sway-border-dim rounded-[6px] overflow-hidden">
        {/* CARD HEADER */}
        <div className="p-5 px-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="font-bebas text-[22px] text-sway-text tracking-wide uppercase leading-none">
            DAFTAR VOUCHER
          </h2>

          <div className="flex flex-row items-center gap-3 w-full sm:w-auto">
            {/* Status Filter Dropdown */}
            <div className="flex flex-col gap-1 w-[150px]">
              <label className="font-grotesk text-[9px] uppercase tracking-widest text-sway-ghost font-bold leading-none mb-1">
                STATUS
              </label>
              <div className="relative h-9 w-full">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full h-full bg-sway-surface border border-sway-border rounded pl-3 pr-8 font-grotesk text-[11px] text-sway-text uppercase tracking-wider outline-none cursor-pointer appearance-none transition-colors focus:border-sway-accent"
                >
                  <option value="all">SEMUA STATUS</option>
                  <option value="aktif">AKTIF</option>
                  <option value="nonaktif">NONAKTIF</option>
                  <option value="habis">HABIS</option>
                  <option value="expired">EXPIRED</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sway-dim pointer-events-none" />
              </div>
            </div>

            {/* Type Filter Dropdown */}
            <div className="flex flex-col gap-1 w-[140px]">
              <label className="font-grotesk text-[9px] uppercase tracking-widest text-sway-ghost font-bold leading-none mb-1">
                TIPE
              </label>
              <div className="relative h-9 w-full">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full h-full bg-sway-surface border border-sway-border rounded pl-3 pr-8 font-grotesk text-[11px] text-sway-text uppercase tracking-wider outline-none cursor-pointer appearance-none transition-colors focus:border-sway-accent"
                >
                  <option value="all">SEMUA TIPE</option>
                  <option value="percentage">PERCENTAGE</option>
                  <option value="fixed">FIXED</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sway-dim pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* TABLE COMPONENT */}
        <div className="w-full overflow-x-auto">
          <div className="min-w-[800px]">
            {/* TABLE HEADER */}
            <div className="flex items-center px-6 py-3 border-b border-sway-border-dim bg-transparent select-none">
              <div className="w-[14%] font-grotesk text-[10px] uppercase tracking-[0.14em] font-bold text-sway-dim">KODE</div>
              <div className="w-[12%] font-grotesk text-[10px] uppercase tracking-[0.14em] font-bold text-sway-dim">TIPE</div>
              <div className="w-[10%] font-grotesk text-[10px] uppercase tracking-[0.14em] font-bold text-sway-dim">NILAI</div>
              <div className="w-[22%] font-grotesk text-[10px] uppercase tracking-[0.14em] font-bold text-sway-dim">TERPAKAI</div>
              <div className="w-[14%] font-grotesk text-[10px] uppercase tracking-[0.14em] font-bold text-sway-dim">EXPIRED</div>
              <div className="w-[12%] font-grotesk text-[10px] uppercase tracking-[0.14em] font-bold text-sway-dim">STATUS</div>
              <div className="w-[16%] font-grotesk text-[10px] uppercase tracking-[0.14em] font-bold text-sway-dim text-right">AKSI</div>
            </div>

            {/* TABLE BODY */}
            {isLoading ? (
              <div className="h-64 flex flex-col justify-center items-center gap-3">
                <Loader2 className="w-8 h-8 text-sway-accent animate-spin" />
                <span className="font-grotesk text-[13px] text-sway-dim">Memuat data voucher...</span>
              </div>
            ) : paginatedVouchers.length === 0 ? (
              <div className="h-64 flex flex-col justify-center items-center gap-2 border-b border-sway-border-dim/40">
                <span className="font-grotesk text-[13px] text-sway-text font-bold">Tidak ada voucher ditemukan</span>
                <span className="font-grotesk text-[11px] text-sway-ghost">Coba ubah kata kunci pencarian atau filter status Anda</span>
              </div>
            ) : (
              paginatedVouchers.map((voucher, idx) => {
                const status = getVoucherStatus(voucher)
                const usageColor = getProgressColor(voucher)
                const isOdd = idx % 2 !== 0

                return (
                  <div
                    key={voucher.id}
                    className={cn(
                      "flex items-center px-6 py-4 border-b border-sway-border-dim/40 hover:bg-sway-card-hi/20 transition-all duration-150 min-h-[56px]",
                      isOdd && "bg-sway-card-hi/5"
                    )}
                  >
                    {/* KODE */}
                    <div className="w-[14%] font-bebas text-[18px] text-sway-text tracking-wide uppercase truncate pr-3">
                      {voucher.code}
                    </div>

                    {/* TIPE */}
                    <div className={cn(
                      "w-[12%] font-grotesk text-[12px] uppercase tracking-wider font-bold",
                      voucher.type === 'PERCENTAGE' ? 'text-sway-gold' : 'text-sway-dim'
                    )}>
                      {voucher.type}
                    </div>

                    {/* NILAI */}
                    <div className="w-[10%] font-grotesk text-[13px] text-sway-text font-semibold">
                      {voucher.type === 'PERCENTAGE' ? `${voucher.value}%` : formatRupiah(voucher.value)}
                    </div>

                    {/* TERPAKAI */}
                    <div className="w-[22%] pr-6 flex items-center">
                      <VoucherUsageBar
                        used={voucher.used || 0}
                        quota={voucher.quota}
                        colorClass={usageColor}
                      />
                    </div>

                    {/* EXPIRED */}
                    <div className="w-[14%] font-grotesk text-[13px] text-sway-dim font-medium">
                      {formatIndoDate(voucher.expiredAt)}
                    </div>

                    {/* STATUS BADGE */}
                    <div className="w-[12%] flex items-center">
                      <span className={cn(
                        "px-2.5 py-1 rounded-[2px] text-[10px] uppercase tracking-wider font-bold select-none leading-none",
                        status === 'aktif' && "bg-sway-success text-white",
                        status === 'habis' && "bg-sway-gold text-white",
                        status === 'expired' && "bg-sway-error text-sway-text",
                        status === 'nonaktif' && "bg-sway-card-hi text-sway-ghost"
                      )}>
                        {status === 'aktif' ? 'AKTIF' : status === 'habis' ? 'HABIS' : status === 'expired' ? 'EXPIRED' : 'NONAKTIF'}
                      </span>
                    </div>

                    {/* ACTIONS */}
                    <div className="w-[16%] flex items-center justify-end gap-2">
                      {/* Edit Button */}
                      <button
                        onClick={() => openEditForm(voucher)}
                        className="w-8 h-8 rounded-full bg-transparent flex items-center justify-center text-sway-dim hover:text-sway-text hover:bg-sway-card-hi transition-all duration-150"
                        title="Edit Voucher"
                      >
                        <Pencil size={15} />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => setDeletingVoucher(voucher)}
                        className="w-8 h-8 rounded-full bg-transparent flex items-center justify-center text-sway-dim hover:text-sway-error hover:bg-sway-error/10 transition-all duration-150"
                        title="Hapus Voucher"
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
          {/* Left info */}
          <div className="font-grotesk text-[11px] uppercase tracking-[0.1em] text-sway-ghost font-bold">
            MENAMPILKAN {paginatedVouchers.length} DARI {filteredVouchers.length} VOUCHER
          </div>

          {/* Right page buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage <= 1}
              className="w-8 h-8 flex items-center justify-center text-sway-dim hover:text-sway-text hover:bg-sway-card-hi transition-colors disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPages }).map((_, idx) => {
              const p = idx + 1
              const isActive = p === currentPage
              return (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={cn(
                    "w-8 h-8 rounded text-[13px] font-grotesk font-bold transition-all duration-150 flex items-center justify-center border select-none",
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
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages}
              className="w-8 h-8 flex items-center justify-center text-sway-dim hover:text-sway-text hover:bg-sway-card-hi transition-colors disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Voucher Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-sway-text/40 flex items-center justify-center z-50 p-4 transition-all duration-300 backdrop-blur-sm">
          <div className="w-[460px] bg-sway-card border border-sway-border rounded-[6px] p-7 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex justify-between items-center select-none">
              <h3 className="font-bebas text-[28px] text-sway-text tracking-wide leading-none mt-1">
                {editingVoucher ? 'EDIT VOUCHER' : 'BUAT VOUCHER'}
              </h3>
              <button
                onClick={closeForm}
                className="w-6 h-6 flex items-center justify-center text-sway-ghost hover:text-sway-text transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="h-[1px] bg-sway-border-dim my-5" />

            {/* Form */}
            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 font-grotesk">
              {/* KODE VOUCHER */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-wider text-sway-dim font-bold">
                  KODE VOUCHER <span className="text-sway-accent">*</span>
                </label>
                <input
                  type="text"
                  placeholder="CTH: DISC20 / PROMO10K"
                  {...register('code')}
                  disabled={isMutating}
                  className="h-11 bg-sway-surface border border-sway-border rounded px-4 text-[13px] text-sway-text uppercase placeholder-sway-ghost outline-none focus:border-sway-accent transition-colors font-mono tracking-wider"
                  onChange={(e) => {
                    // Auto-capitalize and strip out spaces
                    const val = e.target.value.toUpperCase().replace(/\s/g, '')
                    setValue('code', val)
                  }}
                />
                {errors.code ? (
                  <p className="text-[11px] text-sway-accent font-bold mt-0.5">{errors.code.message}</p>
                ) : (
                  <span className="text-[11px] text-sway-ghost leading-none mt-0.5">
                    Kode otomatis uppercase, tanpa spasi
                  </span>
                )}
              </div>

              {/* TIPE DISKON */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase tracking-wider text-sway-dim font-bold select-none">
                  TIPE DISKON
                </label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <div className="flex row gap-3 w-full">
                      <button
                        type="button"
                        onClick={() => field.onChange('PERCENTAGE')}
                        className={cn(
                          "flex-1 h-10 rounded border font-grotesk text-[11px] uppercase tracking-widest font-bold transition-all duration-150 select-none",
                          field.value === 'PERCENTAGE'
                            ? "bg-sway-accent/20 border-sway-accent text-sway-accent"
                            : "bg-transparent border-sway-border-dim text-sway-ghost hover:border-sway-border"
                        )}
                      >
                        PERSENTASE
                      </button>
                      <button
                        type="button"
                        onClick={() => field.onChange('FIXED')}
                        className={cn(
                          "flex-1 h-10 rounded border font-grotesk text-[11px] uppercase tracking-widest font-bold transition-all duration-150 select-none",
                          field.value === 'FIXED'
                            ? "bg-sway-accent/20 border-sway-accent text-sway-accent"
                            : "bg-transparent border-sway-border-dim text-sway-ghost hover:border-sway-border"
                        )}
                      >
                        NOMINAL TETAP
                      </button>
                    </div>
                  )}
                />
              </div>

              {/* NILAI DISKON */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-wider text-sway-dim font-bold">
                  NILAI DISKON <span className="text-sway-accent">*</span>
                </label>
                <div className="relative flex items-center h-11 w-full bg-sway-surface border border-sway-border rounded overflow-hidden focus-within:border-sway-accent transition-colors">
                  {watchedType === 'FIXED' && (
                    <span className="pl-4 pr-1 text-[13px] text-sway-dim font-semibold select-none leading-none">
                      Rp
                    </span>
                  )}
                  <input
                    type="number"
                    placeholder={watchedType === 'PERCENTAGE' ? '20' : '10000'}
                    {...register('value')}
                    disabled={isMutating}
                    className="flex-1 h-full bg-transparent px-4 pl-3 py-2 text-[13px] text-sway-text font-semibold outline-none"
                    min={1}
                    max={watchedType === 'PERCENTAGE' ? 100 : undefined}
                    step={watchedType === 'FIXED' ? 1000 : 1}
                  />
                  {watchedType === 'PERCENTAGE' && (
                    <span className="pr-4 pl-1 text-[13px] text-sway-dim font-semibold select-none leading-none">
                      %
                    </span>
                  )}
                </div>
                {errors.value ? (
                  <p className="text-[11px] text-sway-accent font-bold mt-0.5">{errors.value.message}</p>
                ) : (
                  <span className="text-[11px] text-sway-ghost leading-none mt-0.5">
                    {watchedType === 'PERCENTAGE' 
                      ? "Persentase diskon (1-100%)" 
                      : "Potongan harga dalam Rupiah"
                    }
                  </span>
                )}
              </div>

              {/* KUOTA */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-wider text-sway-dim font-bold">
                  KUOTA PEMAKAIAN <span className="text-sway-accent">*</span>
                </label>
                <input
                  type="number"
                  placeholder="100"
                  {...register('quota')}
                  disabled={isMutating}
                  className="h-11 bg-sway-surface border border-sway-border rounded px-4 text-[13px] text-sway-text outline-none focus:border-sway-accent transition-colors font-semibold"
                  min={1}
                />
                {errors.quota ? (
                  <p className="text-[11px] text-sway-accent font-bold mt-0.5">{errors.quota.message}</p>
                ) : (
                  <span className="text-[11px] text-sway-ghost leading-none mt-0.5">
                    Batas maksimal voucher bisa dipakai
                  </span>
                )}
              </div>

              {/* TANGGAL EXPIRED */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-wider text-sway-dim font-bold">
                  TANGGAL EXPIRED
                </label>
                <input
                  type="date"
                  {...register('expiredAt')}
                  disabled={isMutating}
                  className="h-11 bg-sway-surface border border-sway-border rounded px-4 text-[13px] text-sway-text outline-none focus:border-sway-accent transition-colors cursor-pointer"
                />
                <span className="text-[11px] text-sway-ghost leading-none mt-0.5">
                  Kosongkan jika tidak ada batas waktu
                </span>
              </div>

              {/* ACTIVE TOGGLE */}
              <div className="flex items-center gap-3 pt-2">
                <Controller
                  name="isActive"
                  control={control}
                  render={({ field }) => (
                    <button
                      type="button"
                      onClick={() => field.onChange(!field.value)}
                      disabled={isMutating}
                      className={cn(
                        "w-9 h-5 rounded-full flex items-center p-0.5 transition-colors cursor-pointer duration-300",
                        field.value ? "bg-sway-accent justify-end" : "bg-sway-card-hi justify-start border border-sway-border-dim"
                      )}
                    >
                      <span className={cn(
                        "w-4 h-4 rounded-full shadow transition-all duration-300",
                        field.value ? "bg-sway-bg" : "bg-sway-ghost"
                      )} />
                    </button>
                  )}
                />
                <span className="text-[12px] font-bold text-sway-text cursor-pointer select-none leading-none">
                  Aktifkan langsung setelah disimpan
                </span>
              </div>

              {/* ACTION BUTTONS ROW */}
              <div className="pt-4 flex justify-end gap-3 select-none">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={isMutating}
                  className="h-10 px-5 rounded font-grotesk text-[11px] uppercase tracking-widest font-bold bg-transparent text-sway-dim hover:text-sway-text transition-colors border border-transparent"
                >
                  BATAL
                </button>
                <button
                  type="submit"
                  disabled={isMutating}
                  className="h-10 px-5 rounded font-grotesk text-[11px] uppercase tracking-widest font-bold bg-sway-accent text-white hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-sway-accent/20 cursor-pointer"
                >
                  {isMutating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      MEMBUAT...
                    </>
                  ) : (
                    editingVoucher ? 'SIMPAN VOUCHER' : 'BUAT VOUCHER'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Bespoke Sway Style) */}
      {deletingVoucher && (
        <div className="fixed inset-0 bg-sway-text/40 flex items-center justify-center z-50 p-4 transition-all duration-300 backdrop-blur-sm">
          <div className="w-[420px] bg-sway-card border border-sway-border rounded-[6px] p-7 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 font-grotesk">
            <h3 className="font-bebas text-[28px] text-sway-text tracking-wide leading-none mt-1">
              HAPUS VOUCHER
            </h3>
            
            <div className="h-[1px] bg-sway-border-dim my-4" />
            
            <p className="text-sway-dim text-[13px] leading-relaxed select-none">
              Apakah Anda yakin ingin menghapus kupon voucher <span className="font-bold text-sway-text">"{deletingVoucher.code}"</span> secara permanen? Sesi foto aktif yang menggunakan voucher ini mungkin akan terpengaruh.
            </p>

            <div className="mt-6 flex justify-end gap-3 select-none">
              <button
                type="button"
                onClick={() => setDeletingVoucher(null)}
                disabled={deleteMutation.isPending}
                className="h-10 px-5 rounded font-grotesk text-[11px] uppercase tracking-widest font-bold bg-transparent text-sway-dim hover:text-sway-text transition-colors"
              >
                BATAL
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleteMutation.isPending}
                className="h-10 px-5 rounded font-grotesk text-[11px] uppercase tracking-widest font-bold bg-sway-error text-sway-text hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-sway-error/10"
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    MENGHAPUS...
                  </>
                ) : (
                  'HAPUS VOUCHER'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VouchersPage
