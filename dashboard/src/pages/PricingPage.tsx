import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2, Loader2, X } from 'lucide-react'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'
import { PricingPackage } from '@/types'
import { PricingCard } from '@/components/pricing/PricingCard'

// Schema validation for Pricing Package (on frontend we represent duration in minutes)
const pricingSchema = z.object({
  name: z.string().min(1, 'Nama paket wajib diisi'),
  price: z.coerce.number().min(0, 'Harga harus bernilai positif'),
  photoCount: z.coerce.number().min(1, 'Jumlah foto minimal 1').max(10, 'Jumlah foto maksimal 10'),
  duration: z.coerce.number().min(1, 'Durasi minimal 1 menit'),
  printCount: z.coerce.number().min(1, 'Jumlah cetak minimal 1').max(5, 'Jumlah cetak maksimal 5'),
  includeGif: z.boolean().default(false),
  includeEmail: z.boolean().default(false),
  isActive: z.boolean().default(true),
})

type PricingFormValues = z.infer<typeof pricingSchema>

export function PricingPage() {
  const queryClient = useQueryClient()
  const { success, error } = useToast()

  // Search filter query
  const [searchQuery, setSearchQuery] = useState('')

  // Listen to Topbar search and add triggers
  useEffect(() => {
    const handleSearch = (e: Event) => {
      setSearchQuery((e as CustomEvent).detail || '')
    }
    const handleOpen = () => openCreateForm()

    window.addEventListener('pricing-search', handleSearch)
    window.addEventListener('open-add-pricing-modal', handleOpen)

    return () => {
      window.removeEventListener('pricing-search', handleSearch)
      window.removeEventListener('open-add-pricing-modal', handleOpen)
    }
  }, [])

  // Page Modal & Deleting States
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingPackage, setEditingPackage] = useState<PricingPackage | null>(null)
  const [deletingPackage, setDeletingPackage] = useState<PricingPackage | null>(null)

  // Fetch packages from backend
  const { data: packages = [], isError: packagesError } = useQuery({
    queryKey: ['pricing'],
    queryFn: async () => {
      const response = await api.get('/api/pricing')
      return response.data?.data as PricingPackage[]
    },
  })

  // React Hook Form config
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<PricingFormValues>({
    resolver: zodResolver(pricingSchema) as any,
    defaultValues: {
      name: '',
      price: 0,
      photoCount: 4,
      duration: 5,
      printCount: 1,
      includeGif: false,
      includeEmail: false,
      isActive: true,
    },
  })

  // Create Package mutation
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post('/api/pricing', payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing'] })
      success('Paket Dibuat', 'Paket harga baru berhasil ditambahkan!')
      closeForm()
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Gagal menambahkan paket'
      error('Kesalahan', msg)
    },
  })

  // Update Package mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      return api.put(`/api/pricing/${id}`, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing'] })
      success('Paket Diperbarui', 'Perubahan paket harga berhasil disimpan!')
      closeForm()
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Gagal memperbarui paket'
      error('Kesalahan', msg)
    },
  })

  // Delete Package mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/api/pricing/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing'] })
      success('Paket Dihapus', 'Paket harga telah berhasil dihapus secara permanen!')
      setDeletingPackage(null)
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Gagal menghapus paket'
      error('Kesalahan', msg)
    },
  })

  // Toggle active status mutation
  const toggleMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.patch(`/api/pricing/${id}/toggle`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing'] })
      success('Status Diubah', 'Status aktif/nonaktif paket diperbarui!')
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Gagal mengubah status aktif'
      error('Kesalahan', msg)
    },
  })

  // Actions
  const openCreateForm = () => {
    setEditingPackage(null)
    reset({
      name: '',
      price: 35000,
      photoCount: 4,
      duration: 5,
      printCount: 1,
      includeGif: false,
      includeEmail: false,
      isActive: true,
    })
    setIsFormOpen(true)
  }

  const openEditForm = (pkg: PricingPackage) => {
    setEditingPackage(pkg)
    reset({
      name: pkg.name,
      price: pkg.price,
      photoCount: pkg.photoCount,
      duration: Math.round(pkg.duration / 60) || 5, // Convert seconds to minutes for form
      printCount: pkg.printCount,
      includeGif: pkg.includeGif,
      includeEmail: pkg.includeEmail,
      isActive: pkg.isActive,
    })
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingPackage(null)
  }

  const onFormSubmit = (values: PricingFormValues) => {
    const payload = {
      ...values,
      duration: values.duration * 60, // Convert minutes back to seconds for backend
    }

    if (editingPackage) {
      updateMutation.mutate({ id: editingPackage.id, payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  // Apply search query filter
  const filteredPackages = packages.filter((pkg) =>
    pkg.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const isMutating = createMutation.isPending || updateMutation.isPending

  if (packagesError) {
    return (
      <div className="rounded border border-sway-error/30 bg-sway-card p-6 text-center">
        <p className="font-bebas text-2xl text-sway-error">DATA TIDAK DAPAT DIMUAT</p>
        <p className="mt-2 text-sm text-sway-dim">Gagal mengambil data paket dari server.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 3-COLUMN CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPackages.length === 0 && (
          <div className="col-span-full rounded border border-sway-border bg-sway-card p-10 text-center text-sm text-sway-dim">
            Belum ada paket harga yang tersimpan.
          </div>
        )}
        {filteredPackages.map((pkg) => {
          const printCount = pkg.printCount
          // Display duration in minutes on cards
          const durationInMinutes = Math.round(pkg.duration / 60)

          return (
            <PricingCard
              key={pkg.id}
              id={pkg.id}
              name={pkg.name}
              price={pkg.price}
              photoCount={pkg.photoCount}
              duration={durationInMinutes}
              printCount={printCount}
              includeGif={pkg.includeGif}
              includeEmail={pkg.includeEmail}
              isActive={pkg.isActive}
              onEdit={() => openEditForm(pkg)}
              onToggle={() => toggleMutation.mutate(pkg.id)}
              onDelete={() => setDeletingPackage(pkg)}
            />
          )
        })}

        {/* TAMBAH PAKET BARU PLACEHOLDER CARD */}
        {searchQuery === '' && (
          <div
            onClick={openCreateForm}
            className="border-2 border-dashed border-sway-border hover:border-sway-accent bg-transparent hover:bg-sway-surface/20 rounded-md min-h-[360px] flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-200 select-none group"
          >
            <div className="w-14 h-14 rounded border border-sway-border-dim group-hover:border-sway-accent flex items-center justify-center text-sway-dim group-hover:text-sway-accent transition-colors duration-200">
              <Plus size={24} />
            </div>
            <span className="font-grotesk text-[13px] uppercase tracking-[0.12em] text-sway-dim group-hover:text-sway-accent font-bold transition-colors duration-200">
              TAMBAH PAKET BARU
            </span>
          </div>
        )}
      </div>

      {/* FORM DIALOG MODAL (ADD / EDIT) */}
      {isFormOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-xs px-4"
          onClick={(e) => e.target === e.currentTarget && closeForm()}
        >
          <div className="w-[480px] bg-sway-card border border-sway-border rounded p-7 flex flex-col justify-between scrollbar-none shadow-2xl">
            {/* Header */}
            <div className="flex justify-between items-center mb-5 shrink-0">
              <span className="font-bebas text-[28px] text-sway-text leading-none mt-1 select-none">
                {editingPackage ? 'EDIT PAKET' : 'TAMBAH PAKET'}
              </span>
              <button
                type="button"
                onClick={closeForm}
                className="w-9 h-9 flex items-center justify-center text-sway-dim hover:text-sway-text rounded-full hover:bg-sway-card-hi/30 cursor-pointer border-none transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="h-[1px] bg-sway-border-dim mb-5 shrink-0" />

            {/* Form */}
            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
              {/* Package Name */}
              <div className="space-y-1.5">
                <label htmlFor="name" className="text-[10px] uppercase tracking-[0.12em] text-sway-dim font-bold font-grotesk block mb-1.5">
                  NAMA PAKET <span className="text-sway-accent">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Contoh: Premium"
                  {...register('name')}
                  className="h-11 bg-sway-bg border border-sway-border-dim rounded px-3.5 font-grotesk text-[14px] text-sway-text placeholder-sway-ghost focus:border-sway-accent focus:outline-none w-full transition-colors"
                  disabled={isMutating}
                />
                {errors.name && (
                  <p className="text-[11px] text-sway-accent font-semibold font-grotesk mt-1">{errors.name.message}</p>
                )}
              </div>

              {/* Price */}
              <div className="space-y-1.5">
                <label htmlFor="price" className="text-[10px] uppercase tracking-[0.12em] text-sway-dim font-bold font-grotesk block mb-1.5">
                  HARGA (RP) <span className="text-sway-accent">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-grotesk text-[13px] text-sway-ghost font-bold select-none">
                    Rp
                  </span>
                  <input
                    id="price"
                    type="number"
                    step={1000}
                    min={0}
                    placeholder="50000"
                    {...register('price')}
                    className="h-11 bg-sway-bg border border-sway-border-dim rounded pl-10 pr-3.5 font-grotesk text-[14px] text-sway-text focus:border-sway-accent focus:outline-none w-full transition-colors"
                    disabled={isMutating}
                  />
                </div>
                <span className="text-[11px] text-sway-ghost font-grotesk mt-1 block">
                  Harga dalam Rupiah
                </span>
                {errors.price && (
                  <p className="text-[11px] text-sway-accent font-semibold font-grotesk mt-1">{errors.price.message}</p>
                )}
              </div>

              {/* Row 2 columns (Photo count & Duration in minutes) */}
              <div className="flex gap-4">
                {/* Photo count */}
                <div className="space-y-1.5 w-1/2">
                  <label htmlFor="photoCount" className="text-[10px] uppercase tracking-[0.12em] text-sway-dim font-bold font-grotesk block mb-1.5">
                    JUMLAH FOTO <span className="text-sway-accent">*</span>
                  </label>
                  <input
                    id="photoCount"
                    type="number"
                    min={1}
                    max={10}
                    placeholder="4"
                    {...register('photoCount')}
                    className="h-11 bg-sway-bg border border-sway-border-dim rounded px-3.5 font-grotesk text-[14px] text-sway-text focus:border-sway-accent focus:outline-none w-full transition-colors"
                    disabled={isMutating}
                  />
                  {errors.photoCount && (
                    <p className="text-[11px] text-sway-accent font-semibold font-grotesk mt-1">{errors.photoCount.message}</p>
                  )}
                </div>

                {/* Duration */}
                <div className="space-y-1.5 w-1/2">
                  <label htmlFor="duration" className="text-[10px] uppercase tracking-[0.12em] text-sway-dim font-bold font-grotesk block mb-1.5">
                    DURASI (MENIT) <span className="text-sway-accent">*</span>
                  </label>
                  <input
                    id="duration"
                    type="number"
                    min={1}
                    placeholder="5"
                    {...register('duration')}
                    className="h-11 bg-sway-bg border border-sway-border-dim rounded px-3.5 font-grotesk text-[14px] text-sway-text focus:border-sway-accent focus:outline-none w-full transition-colors"
                    disabled={isMutating}
                  />
                  {errors.duration && (
                    <p className="text-[11px] text-sway-accent font-semibold font-grotesk mt-1">{errors.duration.message}</p>
                  )}
                </div>
              </div>

              {/* Row 2 columns (Print count) */}
              <div className="flex gap-4">
                <div className="space-y-1.5 w-1/2">
                  <label htmlFor="printCount" className="text-[10px] uppercase tracking-[0.12em] text-sway-dim font-bold font-grotesk block mb-1.5">
                    JUMLAH CETAK <span className="text-sway-accent">*</span>
                  </label>
                  <input
                    id="printCount"
                    type="number"
                    min={1}
                    max={5}
                    placeholder="1"
                    {...register('printCount')}
                    className="h-11 bg-sway-bg border border-sway-border-dim rounded px-3.5 font-grotesk text-[14px] text-sway-text focus:border-sway-accent focus:outline-none w-full transition-colors"
                    disabled={isMutating}
                  />
                  <span className="text-[11px] text-sway-ghost font-grotesk mt-1 block">
                    Berapa strip dicetak per sesi
                  </span>
                  {errors.printCount && (
                    <p className="text-[11px] text-sway-accent font-semibold font-grotesk mt-1">{errors.printCount.message}</p>
                  )}
                </div>
              </div>

              {/* TOGGLES ROW */}
              <div className="flex flex-col gap-3 pt-2 border-y border-sway-border-dim/40 select-none">
                {/* Include Digital GIF */}
                <div className="flex justify-between items-center py-2.5">
                  <span className="font-grotesk text-[13px] text-sway-muted">
                    Include Digital GIF
                  </span>
                  <Controller
                    name="includeGif"
                    control={control}
                    render={({ field }) => (
                      <div
                        onClick={() => !isMutating && field.onChange(!field.value)}
                        className={cn(
                          "relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer flex items-center px-0.5 shrink-0",
                          field.value ? "bg-sway-accent" : "bg-sway-card-hi"
                        )}
                      >
                        <div
                          className={cn(
                            "w-5 h-5 rounded-full shadow-md transform transition-transform duration-200",
                            field.value ? "translate-x-5 bg-white" : "translate-x-0 bg-sway-ghost"
                          )}
                        />
                      </div>
                    )}
                  />
                </div>

                {/* Include Direct Email */}
                <div className="flex justify-between items-center py-2.5">
                  <span className="font-grotesk text-[13px] text-sway-muted">
                    Include Direct Email
                  </span>
                  <Controller
                    name="includeEmail"
                    control={control}
                    render={({ field }) => (
                      <div
                        onClick={() => !isMutating && field.onChange(!field.value)}
                        className={cn(
                          "relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer flex items-center px-0.5 shrink-0",
                          field.value ? "bg-sway-accent" : "bg-sway-card-hi"
                        )}
                      >
                        <div
                          className={cn(
                            "w-5 h-5 rounded-full shadow-md transform transition-transform duration-200",
                            field.value ? "translate-x-5 bg-white" : "translate-x-0 bg-sway-ghost"
                          )}
                        />
                      </div>
                    )}
                  />
                </div>
              </div>

              {/* Active Toggle Switch */}
              <div className="flex items-center gap-3 pt-2 select-none">
                <Controller
                  name="isActive"
                  control={control}
                  render={({ field }) => (
                    <div
                      onClick={() => !isMutating && field.onChange(!field.value)}
                      className={cn(
                        "relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer flex items-center px-0.5 shrink-0",
                        field.value ? "bg-sway-accent" : "bg-sway-card-hi"
                      )}
                    >
                      <div
                        className={cn(
                          "w-5 h-5 rounded-full shadow-md transform transition-transform duration-200",
                          field.value ? "translate-x-5 bg-white" : "translate-x-0 bg-sway-ghost"
                        )}
                      />
                    </div>
                  )}
                />
                <span className="font-grotesk text-[13px] text-sway-muted">
                  Aktifkan langsung setelah disimpan
                </span>
              </div>

              {/* Button Row */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-sway-border-dim/30">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={isMutating}
                  className="border border-sway-border text-sway-muted hover:bg-sway-card-hi bg-transparent h-11 px-5 rounded font-grotesk text-[12px] uppercase tracking-widest font-bold cursor-pointer transition-colors"
                >
                  BATAL
                </button>
                <button
                  type="submit"
                  disabled={isMutating}
                  className="bg-sway-accent text-white h-11 px-5 rounded font-grotesk text-[12px] uppercase tracking-widest font-bold cursor-pointer hover:bg-sway-accent/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 select-none border-none font-black"
                >
                  {isMutating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      MENYIMPAN...
                    </>
                  ) : (
                    'SIMPAN PAKET'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE DIALOG */}
      {deletingPackage !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-xs px-4"
          onClick={(e) => e.target === e.currentTarget && setDeletingPackage(null)}
        >
          <div className="w-[400px] bg-sway-card border border-sway-border rounded p-6 shadow-2xl">
            <Trash2 className="w-10 h-10 text-sway-error mx-auto block" />
            <h3 className="font-bebas text-[24px] text-sway-text text-center mt-3 tracking-wider leading-none">
              HAPUS PAKET HARGA?
            </h3>
            <p className="font-grotesk text-[13px] text-sway-dim text-center mt-2 leading-relaxed">
              Paket "{deletingPackage.name}" akan dihapus secara permanen. Tindakan ini dapat mempengaruhi sesi foto aktif yang menggunakan paket ini.
            </p>

            <div className="flex gap-3 justify-center mt-6">
              <button
                type="button"
                onClick={() => setDeletingPackage(null)}
                disabled={deleteMutation.isPending}
                className="border border-sway-border text-sway-muted hover:bg-sway-card-hi bg-transparent h-11 px-5 rounded font-grotesk text-[12px] uppercase tracking-widest font-bold cursor-pointer transition-colors"
              >
                BATAL
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(deletingPackage.id)}
                disabled={deleteMutation.isPending}
                className="bg-sway-error text-sway-text h-11 px-5 rounded font-grotesk text-[12px] uppercase tracking-widest font-bold cursor-pointer hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all border-none font-black flex items-center gap-2"
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-sway-text" />
                    MENGHAPUS...
                  </>
                ) : (
                  'HAPUS'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PricingPage
