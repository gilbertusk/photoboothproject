import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Trash2,
  Pencil,
  Upload,
  X,
  Loader2
} from 'lucide-react'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/useToast'
import { Template } from '@/types'
import { FramePreview } from '@/components/canvas/FramePreview'
import { parseISO, format } from 'date-fns'
import { id } from 'date-fns/locale'
import { cn } from '@/lib/utils'

// Schema validation for Template
const templateSchema = z.object({
  name: z.string().min(1, 'Nama template wajib diisi'),
  description: z.string().optional(),
  slots: z.coerce.number().min(1, 'Slots minimal bernilai 1').max(6, 'Slots maksimal bernilai 6'),
  previewUrl: z.string().optional(),
  layout: z.string().refine((val) => {
    try {
      JSON.parse(val)
      return true
    } catch (e) {
      return false
    }
  }, 'Format JSON tidak valid'),
  isActive: z.boolean().default(true),
})

type TemplateFormValues = z.infer<typeof templateSchema>

export function TemplatesPage() {
  const queryClient = useQueryClient()
  const { success, error } = useToast()

  // State Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6

  // Form States
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [deletingTemplate, setDeletingTemplate] = useState<Template | null>(null)
  const [fileUploading, setFileUploading] = useState(false)

  // Register dynamic Topbar trigger listener
  useEffect(() => {
    const handleOpen = () => openCreateForm()
    window.addEventListener('open-add-template-modal', handleOpen)
    return () => window.removeEventListener('open-add-template-modal', handleOpen)
  }, [])

  // Fetch templates via react-query
  const { data: templates = [], isError: templatesError } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const response = await api.get('/api/templates')
      return response.data?.data as Template[]
    },
  })

  // React Hook Form config
  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema) as any,
    defaultValues: {
      name: '',
      description: '',
      slots: 4,
      previewUrl: '',
      layout: '{\n  "width": 1200,\n  "height": 1800,\n  "slots": []\n}',
      isActive: true,
    },
  })

  // Create Template mutation
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post('/api/templates', payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      success('Template Dibuat', 'Template baru berhasil ditambahkan!')
      closeForm()
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Gagal menambahkan template'
      error('Kesalahan', msg)
    },
  })

  // Update Template mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      return api.put(`/api/templates/${id}`, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      success('Template Diperbarui', 'Perubahan template berhasil disimpan!')
      closeForm()
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Gagal memperbarui template'
      error('Kesalahan', msg)
    },
  })

  // Delete Template mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/api/templates/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      success('Template Dihapus', 'Template telah berhasil dihapus secara permanen!')
      setDeletingTemplate(null)
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Gagal menghapus template'
      error('Kesalahan', msg)
    },
  })

  // Toggle active status mutation
  const toggleMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.patch(`/api/templates/${id}/toggle`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      success('Status Diubah', 'Status aktif/nonaktif template diperbarui!')
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Gagal mengubah status aktif'
      error('Kesalahan', msg)
    },
  })

  // Actions
  const openCreateForm = () => {
    setEditingTemplate(null)
    reset({
      name: '',
      description: '',
      slots: 4,
      previewUrl: '',
      layout: '{\n  "width": 1200,\n  "height": 1800,\n  "slots": []\n}',
      isActive: true,
    })
    setIsFormOpen(true)
  }

  const openEditForm = (template: Template) => {
    setEditingTemplate(template)
    reset({
      name: template.name,
      description: template.description || '',
      slots: template.slots,
      previewUrl: template.previewUrl || '',
      layout: JSON.stringify(template.layout, null, 2),
      isActive: template.isActive,
    })
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingTemplate(null)
  }

  const onFormSubmit = (values: TemplateFormValues) => {
    const payload = {
      ...values,
      layout: JSON.parse(values.layout),
    }

    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  // Handle custom upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setFileUploading(true)
      const formData = new FormData()
      formData.append('image', file)
      const response = await api.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const url = response.data?.url || response.data?.data?.url
      setValue('previewUrl', url)
      success('Sukses', 'Gambar pratinjau berhasil diunggah!')
    } catch (err) {
      console.error('Gagal mengunggah gambar template:', err)
      error('Kesalahan', 'Gambar gagal diunggah. Periksa koneksi backend lalu coba lagi.')
    } finally {
      setFileUploading(false)
    }
  }

  // Formatting date for display in Indonesian format
  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr) return '—'
    try {
      const parsedDate = parseISO(dateStr)
      return format(parsedDate, 'dd MMMM yyyy', { locale: id })
    } catch (e) {
      return '—'
    }
  }

  // Filter & Search Logic
  const filteredTemplates = templates
    .filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (template.description || '').toLowerCase().includes(searchQuery.toLowerCase())
      
      if (statusFilter === 'active') return matchesSearch && template.isActive
      if (statusFilter === 'inactive') return matchesSearch && !template.isActive
      return matchesSearch
    })

  // Pagination calculations
  const totalEntries = filteredTemplates.length
  const totalPages = Math.ceil(totalEntries / itemsPerPage) || 1
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredTemplates.slice(indexOfFirstItem, indexOfLastItem)

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1)
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1)
  }

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter])

  const isMutating = createMutation.isPending || updateMutation.isPending || fileUploading

  if (templatesError) {
    return <DataLoadError label="template" />
  }

  return (
    <div className="space-y-5">
      {/* FILTER & SEARCH ROW */}
      <div className="flex gap-3">
        {/* Search Input Container */}
        <div className="relative w-[320px] h-11 shrink-0">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari template..."
            className="w-full h-full bg-sway-surface border border-sway-border rounded pl-10 pr-4 font-grotesk text-[13px] text-sway-text placeholder-sway-ghost outline-none focus:border-sway-accent transition-colors"
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sway-ghost pointer-events-none" />
        </div>

        {/* Dropdown status selection */}
        <div className="relative w-[180px] h-11 shrink-0">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full h-full bg-sway-surface border border-sway-border rounded px-3.5 pr-10 font-grotesk text-[13px] text-sway-text outline-none focus:border-sway-accent cursor-pointer appearance-none"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sway-ghost pointer-events-none" />
        </div>
      </div>

      {/* TEMPLATES TABLE CARD */}
      <div className="bg-sway-card border border-sway-border-dim rounded-md overflow-hidden">
        
        {/* TABLE HEADER */}
        <div className="flex border-b border-sway-border-dim px-6 py-3.5 font-grotesk text-[10px] uppercase tracking-[0.14em] font-bold text-sway-dim select-none">
          <div className="w-[10%]">PREVIEW</div>
          <div className="w-[30%]">NAMA TEMPLATE</div>
          <div className="w-[12%]">SLOT FOTO</div>
          <div className="w-[12%]">STATUS</div>
          <div className="w-[14%]">DIBUAT</div>
          <div className="w-[22%] text-right">AKSI</div>
        </div>

        {/* TABLE ROWS */}
        {currentItems.length > 0 ? (
          <div className="divide-y divide-sway-border-dim/40">
            {currentItems.map((template, idx) => (
              <div
                key={template.id}
                className={cn(
                  "flex px-6 py-4 items-center min-h-[88px] font-grotesk hover:bg-sway-surface/30 transition-colors",
                  idx % 2 === 1 ? "bg-sway-bg/20" : "bg-transparent"
                )}
              >
                {/* PREVIEW COLUMN */}
                <div className="w-[10%]">
                  <div className="w-[64px] rounded bg-sway-bg border border-sway-border-dim overflow-hidden flex items-center justify-center shrink-0 shadow-sm" style={{ minHeight: 80 }}>
                    {template.previewUrl ? (
                      <img
                        src={template.previewUrl}
                        alt="Thumbnail"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FramePreview
                        name={template.name}
                        slots={template.slots}
                        previewWidth={60}
                        inactive={!template.isActive}
                      />
                    )}
                  </div>
                </div>

                {/* TEMPLATE NAME COLUMN */}
                <div className="w-[30%] pr-4">
                  <span className="font-bebas text-[18px] text-sway-text tracking-wide block leading-tight">
                    {template.name.toUpperCase()}
                  </span>
                  <span className="font-grotesk text-[12px] text-sway-ghost mt-1 block truncate">
                    {template.description || "Standard vertical strip presentation"}
                  </span>
                </div>

                {/* SLOTS COLUMN */}
                <div className="w-[12%]">
                  <span className="font-bebas text-[18px] text-sway-text tracking-wide">
                    {template.slots} FOTO
                  </span>
                </div>

                {/* STATUS COLUMN */}
                <div className="w-[12%]">
                  {template.isActive ? (
                    <span className="border border-sway-success text-sway-success px-3 py-1 rounded-[2px] font-grotesk text-[10px] uppercase tracking-[0.1em] font-bold bg-transparent inline-block">
                      AKTIF
                    </span>
                  ) : (
                    <span className="border border-sway-ghost text-sway-ghost px-3 py-1 rounded-[2px] font-grotesk text-[10px] uppercase tracking-[0.1em] font-bold bg-transparent inline-block">
                      NONAKTIF
                    </span>
                  )}
                </div>

                {/* CREATED AT COLUMN */}
                <div className="w-[14%] text-sway-dim text-[13px]">
                  {formatDateDisplay(template.createdAt)}
                </div>

                {/* ACTION COLUMN */}
                <div className="w-[22%] flex justify-end items-center gap-2">
                  {/* Edit Button */}
                  <button
                    onClick={() => openEditForm(template)}
                    className="w-9 h-9 border-none bg-sway-card-hi rounded flex items-center justify-center cursor-pointer text-sway-dim hover:bg-sway-border hover:text-sway-text transition-colors"
                    title="Edit Template"
                  >
                    <Pencil size={16} />
                  </button>

                  {/* Toggle Button */}
                  <button
                    onClick={() => toggleMutation.mutate(template.id)}
                    disabled={toggleMutation.isPending}
                    className={cn(
                      "w-9 h-9 border-none rounded flex items-center justify-center cursor-pointer transition-all hover:brightness-110 active:scale-95 disabled:opacity-50",
                      template.isActive
                        ? "bg-sway-success/20 text-sway-success"
                        : "bg-sway-card-hi text-sway-ghost"
                    )}
                    title={template.isActive ? "Nonaktifkan" : "Aktifkan"}
                  >
                    {template.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => setDeletingTemplate(template)}
                    className="w-9 h-9 border-none bg-sway-card-hi rounded flex items-center justify-center cursor-pointer text-sway-dim hover:bg-sway-error/20 hover:text-sway-error transition-colors"
                    title="Hapus Template"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-transparent">
            <span className="font-grotesk text-[13px] text-sway-ghost italic block">
              Tidak ada template yang ditemukan matching filter.
            </span>
          </div>
        )}

        {/* PAGINATION ROW */}
        <div className="flex justify-between items-center px-6 py-3.5 border-t border-sway-border-dim bg-transparent select-none">
          <span className="font-grotesk text-[12px] italic text-sway-ghost">
            Menampilkan {totalEntries > 0 ? indexOfFirstItem + 1 : 0}-
            {indexOfLastItem > totalEntries ? totalEntries : indexOfLastItem} dari {totalEntries} entri
          </span>

          <div className="flex gap-2 items-center">
            {/* Prev Button */}
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="w-8 h-8 rounded border-none bg-transparent text-sway-dim hover:bg-sway-card-hi disabled:opacity-30 disabled:hover:bg-transparent flex items-center justify-center cursor-pointer transition-colors"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Page indicators */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={cn(
                  "w-8 h-8 rounded flex items-center justify-center font-grotesk text-[13px] border-none select-none cursor-pointer transition-colors",
                  page === currentPage
                    ? "bg-sway-accent text-white font-bold"
                    : "bg-transparent text-sway-dim hover:bg-sway-card-hi"
                )}
              >
                {page}
              </button>
            ))}

            {/* Next Button */}
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="w-8 h-8 rounded border-none bg-transparent text-sway-dim hover:bg-sway-card-hi disabled:opacity-30 disabled:hover:bg-transparent flex items-center justify-center cursor-pointer transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* FORM DIALOG MODAL (ADD / EDIT) */}
      {isFormOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-xs px-4"
          onClick={(e) => e.target === e.currentTarget && closeForm()}
        >
          <div className="w-[560px] max-h-[90vh] overflow-y-auto bg-sway-card border border-sway-border rounded p-7 flex flex-col justify-between scrollbar-thin shadow-2xl">
            {/* Header */}
            <div className="flex justify-between items-center mb-5 shrink-0">
              <span className="font-bebas text-[28px] text-sway-text leading-none mt-1">
                {editingTemplate ? 'EDIT TEMPLATE' : 'TAMBAH TEMPLATE'}
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
              {/* Template Name */}
              <div className="space-y-1.5">
                <label htmlFor="name" className="text-[10px] uppercase tracking-[0.12em] text-sway-dim font-bold font-grotesk block mb-1.5">
                  NAMA TEMPLATE <span className="text-sway-accent">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Contoh: Classic Strip"
                  {...register('name')}
                  className="h-11 bg-sway-bg border border-sway-border-dim rounded px-3.5 font-grotesk text-[14px] text-sway-text placeholder-sway-ghost focus:border-sway-accent focus:outline-none w-full transition-colors"
                  disabled={isMutating}
                />
                {errors.name && (
                  <p className="text-[11px] text-sway-accent font-semibold font-grotesk mt-1">{errors.name.message}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label htmlFor="description" className="text-[10px] uppercase tracking-[0.12em] text-sway-dim font-bold font-grotesk block mb-1.5">
                  DESKRIPSI
                </label>
                <textarea
                  id="description"
                  placeholder="Deskripsi singkat template (opsional)"
                  {...register('description')}
                  className="h-[72px] bg-sway-bg border border-sway-border-dim rounded p-3 font-grotesk text-[14px] text-sway-text placeholder-sway-ghost focus:border-sway-accent focus:outline-none w-full resize-none transition-colors"
                  disabled={isMutating}
                />
              </div>

              {/* Slots Count */}
              <div className="space-y-1.5">
                <label htmlFor="slots" className="text-[10px] uppercase tracking-[0.12em] text-sway-dim font-bold font-grotesk block mb-1.5">
                  JUMLAH SLOT FOTO <span className="text-sway-accent">*</span>
                </label>
                <input
                  id="slots"
                  type="number"
                  min={1}
                  max={6}
                  {...register('slots')}
                  className="w-[140px] h-11 bg-sway-bg border border-sway-border-dim rounded px-3.5 font-grotesk text-[14px] text-sway-text focus:border-sway-accent focus:outline-none transition-colors"
                  disabled={isMutating}
                />
                <span className="text-[11px] text-sway-ghost font-grotesk mt-1 block">
                  Jumlah foto dalam satu strip (1-6)
                </span>
                {errors.slots && (
                  <p className="text-[11px] text-sway-accent font-semibold font-grotesk mt-1">{errors.slots.message}</p>
                )}
              </div>

              {/* Upload Zone */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-[0.12em] text-sway-dim font-bold font-grotesk block mb-1.5">
                  PREVIEW IMAGE
                </label>
                
                <Controller
                  name="previewUrl"
                  control={control}
                  render={({ field }) => {
                    const url = field.value
                    return (
                      <div className="space-y-3">
                        {!url ? (
                          <div
                            onClick={() => document.getElementById('preview-file-input')?.click()}
                            className="h-[100px] border-2 border-dashed border-sway-border hover:border-sway-accent bg-sway-bg/50 hover:bg-sway-surface/30 rounded flex flex-col items-center justify-center gap-1 cursor-pointer transition-all duration-200"
                          >
                            <Upload size={24} className="text-sway-dim" />
                            <span className="font-grotesk text-[12px] text-sway-dim font-bold">
                              Drag & drop atau klik untuk upload
                            </span>
                            <span className="font-grotesk text-[10px] text-sway-ghost">
                              JPG, PNG — maks 5MB
                            </span>
                            <input
                              id="preview-file-input"
                              type="file"
                              accept="image/*"
                              onChange={handleFileUpload}
                              className="hidden"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-4 bg-sway-bg/40 p-3 border border-sway-border-dim rounded">
                            <div className="w-[60px] h-[80px] rounded border border-sway-border-dim overflow-hidden shrink-0">
                              <img src={url} alt="Uploaded thumbnail" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-grotesk text-[12px] text-sway-text truncate font-semibold">
                                Preview Image
                              </p>
                              <p className="font-grotesk text-[10px] text-sway-ghost mt-0.5">
                                Ready to save
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setValue('previewUrl', '')}
                              className="w-8 h-8 bg-sway-card-hi rounded flex items-center justify-center text-sway-dim hover:text-sway-accent cursor-pointer transition-colors border-none"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  }}
                />
              </div>

              {/* Layout Config JSON */}
              <div className="space-y-1.5">
                <label htmlFor="layout" className="text-[10px] uppercase tracking-[0.12em] text-sway-dim font-bold font-grotesk block mb-1.5">
                  LAYOUT CONFIG (JSON) <span className="text-sway-accent">*</span>
                </label>
                <textarea
                  id="layout"
                  rows={5}
                  {...register('layout')}
                  className="h-[120px] bg-sway-bg font-mono text-[12px] text-sway-text border border-sway-border-dim rounded p-3 focus:border-sway-accent focus:outline-none w-full resize-none transition-colors"
                  disabled={isMutating}
                />
                <span className="text-[11px] text-sway-ghost font-grotesk mt-1 block">
                  Konfigurasi posisi slot foto dalam strip
                </span>
                {errors.layout && (
                  <p className="text-[11px] text-sway-accent font-semibold font-grotesk mt-1">{errors.layout.message}</p>
                )}
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
                    'SIMPAN TEMPLATE'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE DIALOG */}
      {deletingTemplate !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-xs px-4"
          onClick={(e) => e.target === e.currentTarget && setDeletingTemplate(null)}
        >
          <div className="w-[400px] bg-sway-card border border-sway-border rounded p-6 shadow-2xl">
            <Trash2 className="w-10 h-10 text-sway-error mx-auto block" />
            <h3 className="font-bebas text-[24px] text-sway-text text-center mt-3 tracking-wider leading-none">
              HAPUS TEMPLATE?
            </h3>
            <p className="font-grotesk text-[13px] text-sway-dim text-center mt-2 leading-relaxed">
              Template "{deletingTemplate.name}" akan dihapus permanen.
            </p>

            <div className="flex gap-3 justify-center mt-6">
              <button
                type="button"
                onClick={() => setDeletingTemplate(null)}
                disabled={deleteMutation.isPending}
                className="border border-sway-border text-sway-muted hover:bg-sway-card-hi bg-transparent h-11 px-5 rounded font-grotesk text-[12px] uppercase tracking-widest font-bold cursor-pointer transition-colors"
              >
                BATAL
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(deletingTemplate.id)}
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

function DataLoadError({ label }: { label: string }) {
  return (
    <div className="rounded border border-sway-error/30 bg-sway-card p-6 text-center">
      <p className="font-bebas text-2xl text-sway-error">DATA TIDAK DAPAT DIMUAT</p>
      <p className="mt-2 text-sm text-sway-dim">Gagal mengambil data {label} dari server.</p>
    </div>
  )
}

export default TemplatesPage
