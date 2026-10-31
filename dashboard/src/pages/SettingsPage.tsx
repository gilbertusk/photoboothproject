import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Image as ImageIcon,
  Camera,
  MessageSquare,
  Cloud,
  Info,
  AlertTriangle,
  Check,
  Loader2
} from 'lucide-react'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/useToast'

// Schema validation for settings matching backend
const settingsSchema = z.object({
  branding_name: z.string().min(1, 'Nama brand wajib diisi').trim(),
  branding_logo: z.string().optional().or(z.literal('')),
  session_countdown: z.coerce.number().min(2, 'Countdown minimal 2 detik').max(20, 'Countdown maksimal 20 detik'),
  session_interval: z.coerce.number().min(1, 'Interval minimal 1 detik').max(15, 'Interval maksimal 15 detik'),
  inactive_timeout: z.coerce.number().min(5, 'Timeout minimal 5 detik').max(300, 'Timeout maksimal 300 detik'),
  message_welcome: z.string().min(1, 'Pesan selamat datang wajib diisi').max(100, 'Maksimal 100 karakter').trim(),
  message_thankyou: z.string().min(1, 'Pesan terima kasih wajib diisi').max(100, 'Maksimal 100 karakter').trim(),
})

type SettingsFormValues = z.infer<typeof settingsSchema>

export function SettingsPage() {
  const queryClient = useQueryClient()
  const { error: toastError, success: toastSuccess } = useToast()
  
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [showSuccessToast, setShowSuccessToast] = useState(false)

  // Fetch settings from API
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await api.get('/api/settings')
      return response.data?.data as Record<string, string>
    },
  })

  // Initialize form with defaults matching the visual screenshot
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors }
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema) as any,
    defaultValues: {
      branding_name: 'bertpixx',
      branding_logo: '',
      session_countdown: 3,
      session_interval: 2,
      inactive_timeout: 60,
      message_welcome: 'Abadikan Momen Bersama',
      message_thankyou: 'Sampai jumpa di bertpixx berikutnya!',
    },
  })

  // Monitor welcome and thank you message values for live character limits
  const watchedLogo = watch('branding_logo')
  const messageWelcomeVal = watch('message_welcome') || ''
  const messageThankyouVal = watch('message_thankyou') || ''

  // Reset form when settings query succeeds
  useEffect(() => {
    if (settingsData) {
      reset({
        branding_name: settingsData.branding_name || 'bertpixx',
        branding_logo: settingsData.branding_logo || '',
        session_countdown: settingsData.session_countdown ? parseInt(settingsData.session_countdown) : 3,
        session_interval: settingsData.session_interval ? parseInt(settingsData.session_interval) : 2,
        inactive_timeout: settingsData.inactive_timeout ? parseInt(settingsData.inactive_timeout) : 60,
        message_welcome: settingsData.message_welcome || 'Abadikan Momen Bersama',
        message_thankyou: settingsData.message_thankyou || 'Sampai jumpa di bertpixx berikutnya!',
      })
    }
  }, [settingsData, reset])

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: async (payload: Record<string, string>) => {
      return api.put('/api/settings', payload)
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      setShowSuccessToast(true)
      
      // Auto dismiss success toast after 4s
      const timer = setTimeout(() => {
        setShowSuccessToast(false)
      }, 4000)

      if (res.data?.data) {
        const data = res.data.data
        reset({
          branding_name: data.branding_name || 'bertpixx',
          branding_logo: data.branding_logo || '',
          session_countdown: data.session_countdown ? parseInt(data.session_countdown) : 3,
          session_interval: data.session_interval ? parseInt(data.session_interval) : 2,
          inactive_timeout: data.inactive_timeout ? parseInt(data.inactive_timeout) : 60,
          message_welcome: data.message_welcome || 'Abadikan Momen Bersama',
          message_thankyou: data.message_thankyou || 'Sampai jumpa di bertpixx berikutnya!',
        })
      }
      return () => clearTimeout(timer)
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Gagal menyimpan pengaturan'
      toastError('Kesalahan', msg)
    },
  })

  // Logo upload direct file handler
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Enforce file size limit of 2MB matching screenshot constraints
    if (file.size > 2 * 1024 * 1024) {
      toastError('Gagal Mengunggah', 'Ukuran file logo maksimal adalah 2MB!')
      return
    }

    setIsUploadingLogo(true)
    const formData = new FormData()
    formData.append('image', file)

    try {
      const response = await api.post('/api/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      if (response.data?.success && response.data?.data?.url) {
        const uploadedUrl = response.data.data.url
        setValue('branding_logo', uploadedUrl, { shouldDirty: true })
        toastSuccess('Gambar berhasil diunggah')
      } else {
        toastError('Gagal mengunggah gambar', 'Respons server tidak valid')
      }
    } catch (err: any) {
      console.error(err)
      const errMsg = err.response?.data?.message || 'Terjadi kesalahan jaringan'
      toastError('Gagal mengunggah gambar', errMsg)
    } finally {
      setIsUploadingLogo(false)
    }
  }

  const onSubmit = (values: SettingsFormValues) => {
    const payload: Record<string, string> = {
      branding_name: values.branding_name,
      branding_logo: values.branding_logo || '',
      session_countdown: values.session_countdown.toString(),
      session_interval: values.session_interval.toString(),
      inactive_timeout: values.inactive_timeout.toString(),
      message_welcome: values.message_welcome,
      message_thankyou: values.message_thankyou,
    }
    updateMutation.mutate(payload)
  }

  // Bind global Topbar "SIMPAN SEMUA PERUBAHAN" trigger to programmatically submit the form
  useEffect(() => {
    const handleTriggerSave = () => {
      document.getElementById('settings-form-submit-btn')?.click()
    }
    window.addEventListener('trigger-save-settings', handleTriggerSave)
    return () => window.removeEventListener('trigger-save-settings', handleTriggerSave)
  }, [])

  // Danger zone action confirmations
  const handleResetSession = () => {
    const confirmReset = window.confirm('APAKAH ANDA YAKIN? Tindakan ini akan menghapus seluruh data antrean sesi foto di database!')
    if (confirmReset) {
      toastSuccess('Data sesi dibersihkan')
    }
  }

  const handleCreateAdmin = () => {
    toastError('Akses Ditolak', 'Pembuatan admin baru membutuhkan otorisasi Master Administrator.')
  }

  const isSaving = updateMutation.isPending

  return (
    <div className="relative">
      {isLoading ? (
        <div className="h-[400px] flex flex-col items-center justify-center gap-3 bg-sway-card border border-sway-border rounded-[4px] select-none">
          <Loader2 className="h-10 w-10 text-sway-accent animate-spin" />
          <p className="text-sm text-sway-dim font-bold font-grotesk tracking-wider">Memuat pengaturan sistem...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6 select-none">
          {/* Hidden submit trigger programmatically clicked by Topbar event */}
          <button id="settings-form-submit-btn" type="submit" className="hidden" disabled={isSaving} />

          {/* LEFT COLUMN: Configuration Forms */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* BRANDING CARD */}
            <div className="bg-sway-card border border-sway-border rounded-[4px] p-6 space-y-5">
              <div className="flex items-center gap-3 text-sway-text border-b border-sway-border-dim/20 pb-3">
                <ImageIcon size={20} className="text-sway-accent" />
                <h3 className="font-bebas text-[20px] tracking-wider leading-none">BRANDING</h3>
              </div>

              <div className="space-y-4">
                {/* Business Name */}
                <div className="space-y-1.5">
                  <label htmlFor="branding_name" className="text-[10px] text-sway-dim tracking-wider font-bold uppercase block">
                    NAMA BISNIS
                  </label>
                  <input
                    id="branding_name"
                    type="text"
                    {...register('branding_name')}
                    placeholder="bertpixx"
                    className="bg-sway-card border border-sway-border text-sway-text rounded-[4px] px-4 py-2 font-grotesk text-[14px] w-full focus:border-sway-accent focus:ring-0 outline-none transition-colors"
                    disabled={isSaving}
                  />
                  {errors.branding_name && (
                    <p className="text-xs text-rose-600 font-semibold">{errors.branding_name.message}</p>
                  )}
                </div>

                {/* Company Logo Custom Dotted Box */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-sway-dim tracking-wider font-bold uppercase block">
                    LOGO PERUSAHAAN
                  </span>
                  <div className="border border-dashed border-sway-border rounded-[4px] bg-sway-card p-4 flex items-center gap-4 transition-colors hover:border-sway-accent/40">
                    {/* Thumbnail Box */}
                    <div className="w-[72px] h-[48px] rounded-[4px] bg-sway-card-hi border border-sway-border flex items-center justify-center overflow-hidden shrink-0 select-none">
                      {watchedLogo ? (
                        <img
                          src={watchedLogo}
                          alt="Company Logo"
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <span className="font-bebas text-[14px] text-sway-dim tracking-wide">
                          SWAY
                        </span>
                      )}
                    </div>
                    
                    {/* Action details */}
                    <div className="flex flex-col flex-1 relative cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        disabled={isUploadingLogo || isSaving}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      {isUploadingLogo ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 text-sway-accent animate-spin" />
                          <span className="font-grotesk text-[12px] font-bold text-sway-dim uppercase">
                            MENGUNGGAH...
                          </span>
                        </div>
                      ) : (
                        <>
                          <span className="font-grotesk text-[13px] font-bold text-sway-text tracking-wider uppercase">
                            GANTI LOGO
                          </span>
                          <span className="font-grotesk text-[11px] text-sway-dim mt-0.5">
                            JPG/PNG, MAKS 2MB
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SESI FOTO CARD */}
            <div className="bg-sway-card border border-sway-border rounded-[4px] p-6 space-y-5">
              <div className="flex items-center gap-3 text-sway-text border-b border-sway-border-dim/20 pb-3">
                <Camera size={20} className="text-sway-accent" />
                <h3 className="font-bebas text-[20px] tracking-wider leading-none">SESI FOTO</h3>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Countdown Duration */}
                  <div className="space-y-1.5">
                    <label htmlFor="session_countdown" className="text-[10px] text-sway-dim tracking-wider font-bold uppercase block">
                      DURASI COUNTDOWN
                    </label>
                    <div className="relative flex items-center">
                      <input
                        id="session_countdown"
                        type="number"
                        {...register('session_countdown')}
                        className="bg-sway-card border border-sway-border text-sway-text rounded-[4px] pl-4 pr-16 py-2.5 font-grotesk text-[14px] w-full focus:border-sway-accent focus:ring-0 outline-none transition-colors"
                        disabled={isSaving}
                      />
                      <span className="absolute right-4 text-sway-dim font-grotesk text-[12px] font-bold pointer-events-none">
                        DETIK
                      </span>
                    </div>
                    {errors.session_countdown && (
                      <p className="text-xs text-rose-600 font-semibold">{errors.session_countdown.message}</p>
                    )}
                    <span className="text-[11px] text-sway-dim mt-1.5 block leading-normal">
                      Waktu jeda sebelum shutter kamera aktif.
                    </span>
                  </div>

                  {/* Interval Between Photos */}
                  <div className="space-y-1.5">
                    <label htmlFor="session_interval" className="text-[10px] text-sway-dim tracking-wider font-bold uppercase block">
                      JEDA ANTAR FOTO
                    </label>
                    <div className="relative flex items-center">
                      <input
                        id="session_interval"
                        type="number"
                        {...register('session_interval')}
                        className="bg-sway-card border border-sway-border text-sway-text rounded-[4px] pl-4 pr-16 py-2.5 font-grotesk text-[14px] w-full focus:border-sway-accent focus:ring-0 outline-none transition-colors"
                        disabled={isSaving}
                      />
                      <span className="absolute right-4 text-sway-dim font-grotesk text-[12px] font-bold pointer-events-none">
                        DETIK
                      </span>
                    </div>
                    {errors.session_interval && (
                      <p className="text-xs text-rose-600 font-semibold">{errors.session_interval.message}</p>
                    )}
                    <span className="text-[11px] text-sway-dim mt-1.5 block leading-normal">
                      Waktu istirahat pemain antar pengambilan gambar.
                    </span>
                  </div>
                </div>

                {/* Inactive Timeout */}
                <div className="space-y-1.5 pt-2">
                  <label htmlFor="inactive_timeout" className="text-[10px] text-sway-dim tracking-wider font-bold uppercase block">
                    TIMEOUT INAKTIF
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="inactive_timeout"
                      type="number"
                      {...register('inactive_timeout')}
                      className="bg-sway-card border border-sway-border text-sway-text rounded-[4px] pl-4 pr-16 py-2.5 font-grotesk text-[14px] w-full focus:border-sway-accent focus:ring-0 outline-none transition-colors"
                      disabled={isSaving}
                    />
                    <span className="absolute right-4 text-sway-dim font-grotesk text-[12px] font-bold pointer-events-none">
                      DETIK
                    </span>
                  </div>
                  {errors.inactive_timeout && (
                    <p className="text-xs text-rose-600 font-semibold">{errors.inactive_timeout.message}</p>
                  )}
                  <span className="text-[11px] text-sway-dim mt-1.5 block leading-normal">
                    Kembali ke welcome screen jika tidak ada aktivitas.
                  </span>
                </div>
              </div>
            </div>

            {/* PESAN APLIKASI CARD */}
            <div className="bg-sway-card border border-sway-border rounded-[4px] p-6 space-y-5">
              <div className="flex items-center gap-3 text-sway-text border-b border-sway-border-dim/20 pb-3">
                <MessageSquare size={20} className="text-sway-accent" />
                <h3 className="font-bebas text-[20px] tracking-wider leading-none">PESAN APLIKASI</h3>
              </div>

              <div className="space-y-4">
                {/* Welcome Screen Text */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label htmlFor="message_welcome" className="text-[10px] text-sway-dim tracking-wider font-bold uppercase block">
                      TEKS WELCOME SCREEN
                    </label>
                    <span className="text-[11px] text-sway-dim font-mono">
                      {messageWelcomeVal.length}/100
                    </span>
                  </div>
                  <textarea
                    id="message_welcome"
                    rows={2}
                    {...register('message_welcome')}
                    className="bg-sway-card border border-sway-border text-sway-text rounded-[4px] px-4 py-2.5 font-grotesk text-[14px] w-full h-[64px] resize-none focus:border-sway-accent focus:ring-0 outline-none transition-colors"
                    disabled={isSaving}
                  />
                  {errors.message_welcome && (
                    <p className="text-xs text-rose-600 font-semibold">{errors.message_welcome.message}</p>
                  )}
                </div>

                {/* Thank You Text */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between items-center">
                    <label htmlFor="message_thankyou" className="text-[10px] text-sway-dim tracking-wider font-bold uppercase block">
                      TEKS TERIMA KASIH
                    </label>
                    <span className="text-[11px] text-sway-dim font-mono">
                      {messageThankyouVal.length}/100
                    </span>
                  </div>
                  <textarea
                    id="message_thankyou"
                    rows={2}
                    {...register('message_thankyou')}
                    className="bg-sway-card border border-sway-border text-sway-text rounded-[4px] px-4 py-2.5 font-grotesk text-[14px] w-full h-[64px] resize-none focus:border-sway-accent focus:ring-0 outline-none transition-colors"
                    disabled={isSaving}
                  />
                  {errors.message_thankyou && (
                    <p className="text-xs text-rose-600 font-semibold">{errors.message_thankyou.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Status & Admin Controls */}
          <div className="space-y-6">
            
            {/* STATUS SISTEM CARD */}
            <div className="bg-sway-card border border-sway-border rounded-[4px] p-6 space-y-5">
              <div className="flex items-center gap-3 text-sway-text border-b border-sway-border-dim/20 pb-3">
                <Cloud size={20} className="text-sway-accent" />
                <h3 className="font-bebas text-[20px] tracking-wider leading-none">STATUS SISTEM</h3>
              </div>

              <div className="space-y-4 select-none">
                <div className="flex items-center justify-between border-b border-sway-border-dim/20 pb-2.5">
                  <span className="text-[13px] font-bold text-sway-muted font-grotesk">MongoDB Atlas</span>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sway-success" />
                    <span className="text-[11px] font-bold text-sway-success font-grotesk">Terhubung</span>
                  </div>
                </div>
                <div className="flex items-center justify-between border-b border-sway-border-dim/20 pb-2.5">
                  <span className="text-[13px] font-bold text-sway-muted font-grotesk">Redis Queue</span>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sway-success" />
                    <span className="text-[11px] font-bold text-sway-success font-grotesk">Aktif</span>
                  </div>
                </div>
                <div className="flex items-center justify-between border-b border-sway-border-dim/20 pb-2.5">
                  <span className="text-[13px] font-bold text-sway-muted font-grotesk">Cloudflare R2</span>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sway-success" />
                    <span className="text-[11px] font-bold text-sway-success font-grotesk">Terhubung</span>
                  </div>
                </div>
                <div className="flex items-center justify-between border-b border-sway-border-dim/20 pb-2.5">
                  <span className="text-[13px] font-bold text-sway-muted font-grotesk">Midtrans</span>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sway-gold" />
                    <span className="text-[11px] font-bold text-sway-gold font-grotesk">Mode Sandbox</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold text-sway-muted font-grotesk">Resend Email</span>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sway-success" />
                    <span className="text-[11px] font-bold text-sway-success font-grotesk">Aktif</span>
                  </div>
                </div>
              </div>
            </div>

            {/* TENTANG APLIKASI CARD */}
            <div className="bg-sway-card border border-sway-border rounded-[4px] p-6 space-y-5">
              <div className="flex items-center gap-3 text-sway-text border-b border-sway-border-dim/20 pb-3">
                <Info size={20} className="text-sway-accent" />
                <h3 className="font-bebas text-[20px] tracking-wider leading-none">TENTANG APLIKASI</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-sway-border-dim/20 pb-2.5">
                  <span className="text-[13px] font-bold text-sway-muted font-grotesk">VERSI</span>
                  <span className="text-[13px] font-bold text-sway-text font-mono">1.0.0</span>
                </div>
                <div className="flex items-center justify-between border-b border-sway-border-dim/20 pb-2.5">
                  <span className="text-[13px] font-bold text-sway-muted font-grotesk">ENVIRONMENT</span>
                  <span className="text-[10px] font-black tracking-widest bg-sway-accent text-white px-2 py-0.5 rounded-[3px] font-grotesk uppercase">
                    DEVELOPMENT
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-sway-border-dim/20 pb-2.5">
                  <span className="text-[13px] font-bold text-sway-muted font-grotesk">BACKEND URL</span>
                  <span className="text-[13px] font-bold text-sway-text font-mono">localhost:3000</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold text-sway-muted font-grotesk">LAST UPDATED</span>
                  <span className="text-[13px] font-bold text-sway-text font-grotesk">22 Mei 2026</span>
                </div>
              </div>
            </div>

            {/* DANGER ZONE CARD */}
            <div className="bg-sway-card border border-sway-accent/20 rounded-[4px] p-6 space-y-5">
              <div className="flex items-center gap-3 text-sway-accent border-b border-sway-accent/10 pb-3">
                <AlertTriangle size={20} className="text-sway-accent" />
                <h3 className="font-bebas text-[20px] tracking-wider leading-none uppercase">DANGER ZONE</h3>
              </div>

              <div className="space-y-3.5 pt-1">
                <button
                  type="button"
                  onClick={handleResetSession}
                  className="border border-sway-error/60 hover:border-sway-error hover:bg-sway-error/10 text-sway-accent hover:text-sway-error font-grotesk text-[12px] tracking-widest font-bold w-full py-2.5 rounded-[4px] uppercase select-none transition-all duration-200 cursor-pointer bg-transparent"
                >
                  RESET DATA SESI
                </button>

                <button
                  type="button"
                  onClick={handleCreateAdmin}
                  className="border border-sway-border hover:border-sway-dim hover:bg-sway-card/40 text-sway-text font-grotesk text-[12px] tracking-widest font-bold w-full py-2.5 rounded-[4px] uppercase select-none transition-all duration-200 cursor-pointer bg-transparent"
                >
                  BUAT ADMIN BARU
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* FLOAT-RIGHT FLOATING SUCCESS TOAST NOTIFICATION MATCHING SCREENSHOT */}
      {showSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-start gap-3.5 p-4 border border-sway-success bg-sway-card text-sway-text shadow-2xl rounded-[4px] w-[340px] animate-fade-in transition-all duration-300">
          <div className="w-6 h-6 rounded-full bg-sway-success/10 border border-sway-success/30 flex items-center justify-center text-sway-success shrink-0 mt-0.5">
            <Check size={14} className="stroke-[3]" />
          </div>
          <div className="space-y-1">
            <h4 className="font-grotesk text-[13px] font-black uppercase tracking-wider text-sway-text leading-none">
              PENGATURAN DISIMPAN
            </h4>
            <p className="font-grotesk text-[11px] text-sway-dim leading-snug">
              Perubahan Anda telah disinkronkan ke server.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default SettingsPage
