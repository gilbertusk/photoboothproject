import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Template, ApiResponse } from '@/types'
import { useSessionStore } from '@/stores/sessionStore'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ProgressBar } from '@/components/shared/ProgressBar'
import { BottomBar } from '@/components/shared/BottomBar'
import { Button } from '@/components/shared/Button'
import { FramePreview } from '@/components/canvas/FramePreview'
import { Check, Layers, Camera } from 'lucide-react'

export function TemplateScreen() {
  const navigate = useNavigate()
  const { sessionId, selectedPackage, setTemplate } = useSessionStore()
  const [selectedTpl, setSelectedTpl] = useState<Template | null>(null)
  const [isStarting, setIsStarting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Redirect if no session
  useEffect(() => {
    if (!sessionId) navigate('/')
  }, [sessionId, navigate])

  // Fetch all active templates
  const { data: allTemplates, isLoading, error } = useQuery<Template[]>({
    queryKey: ['templates'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Template[]>>('/api/public/templates')
      return res.data.data || []
    },
  })

  // ── Filter templates to match the package's photoCount ───────────────────
  const templates = useMemo(() => {
    if (!allTemplates) return []
    if (!selectedPackage) return allTemplates
    // Only show templates whose slot count equals the package photoCount
    const matched = allTemplates.filter(t => t.slots === selectedPackage.photoCount)
    // Fallback: if no exact match, show all (shouldn't happen with proper data)
    return matched.length > 0 ? matched : allTemplates
  }, [allTemplates, selectedPackage])

  // Auto-select first available template whenever the filtered list changes
  useEffect(() => {
    if (templates.length > 0) {
      setSelectedTpl(templates[0])
    } else {
      setSelectedTpl(null)
    }
  }, [templates])

  const handleNext = async () => {
    if (!selectedTpl || !sessionId) return
    setIsStarting(true)
    setErrorMsg(null)

    try {
      await api.patch(`/api/sessions/${sessionId}/start`, {
        templateId: selectedTpl._id,
      })
      setTemplate(selectedTpl)
      navigate('/camera')
    } catch (e: any) {
      console.error(e)
      setErrorMsg(e.response?.data?.message || 'Gagal memulai sesi pemotretan. Silakan coba lagi.')
      setIsStarting(false)
    }
  }

  // ── Loading / Error states ────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-sway-bg text-sway-text select-none">
        <LoadingSpinner label="Memuat template bingkai..." />
      </div>
    )
  }

  if (error || !allTemplates) {
    return (
      <div className="flex flex-col min-h-screen w-full items-center justify-center bg-sway-bg text-sway-text px-6 text-center select-none">
        <p className="text-sway-accent font-bold mb-4 font-grotesk text-lg">
          Gagal memuat template dari server.
        </p>
        <Button variant="accent" onClick={() => window.location.reload()}>
          Coba Lagi
        </Button>
      </div>
    )
  }

  return (
    <div className="h-screen w-full flex flex-col bg-sway-bg text-sway-text select-none justify-between overflow-hidden">
      {/* TOP */}
      <ProgressBar currentStep={3} onBack={() => navigate('/packages')} />

      {/* MAIN CONTENT */}
      <div className="flex-grow min-h-0 flex flex-col lg:flex-row px-6 lg:px-8 py-6 gap-6 lg:gap-8 overflow-y-auto">

        {/* ── LEFT PANEL: Step header + live large frame preview ─────────── */}
        <div className="w-full lg:w-[30%] flex flex-col gap-4 lg:border-r lg:border-sway-border-dim lg:pr-8">

          {/* Step label + heading */}
          <div>
            <span className="font-grotesk text-[10px] text-sway-accent font-extrabold tracking-widest uppercase">
              LANGKAH 03
            </span>
            <h2 className="font-bebas text-[36px] lg:text-[44px] text-sway-text leading-tight font-bold tracking-wide uppercase mt-1">
              PILIH FRAME
            </h2>
            <p className="font-grotesk text-[12px] text-sway-muted mt-1 leading-relaxed">
              Template bingkai disesuaikan otomatis dengan jumlah foto di paket Anda.
            </p>
            <div className="w-full h-[1px] bg-sway-border-dim mt-3" />
          </div>

          {/* Package info pill */}
          {selectedPackage && (
            <div className="flex items-center gap-2 bg-sway-surface border border-sway-border-dim rounded-lg px-3 py-2 self-start">
              <Camera className="w-3.5 h-3.5 text-sway-accent shrink-0" />
              <span className="font-grotesk text-[10px] text-sway-muted font-bold uppercase tracking-widest">
                Paket:
              </span>
              <span className="font-grotesk text-[10px] text-sway-text font-extrabold uppercase tracking-wider">
                {selectedPackage.name}
              </span>
              <span className="ml-1 font-grotesk text-[10px] text-sway-accent font-extrabold uppercase tracking-widest">
                • {selectedPackage.photoCount} FOTO
              </span>
            </div>
          )}

          {/* Live big frame preview */}
          {selectedTpl ? (
            <div className="flex flex-col items-center gap-3">
              {/* Name + slot badge */}
              <div className="w-full flex items-start justify-between gap-2">
                <div>
                  <span className="font-bebas text-[22px] text-sway-text tracking-wide uppercase leading-none">
                    {selectedTpl.name}
                  </span>
                  <span className="block font-grotesk text-[10px] text-sway-accent font-extrabold tracking-widest uppercase mt-0.5">
                    {selectedTpl.slots} SLOT FOTO
                  </span>
                  {selectedTpl.description && (
                    <p className="font-grotesk text-[10px] text-sway-dim mt-1 leading-relaxed">
                      {selectedTpl.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 bg-sway-accent/10 border border-sway-accent/30 rounded px-2.5 py-1 shrink-0">
                  <Check className="w-3 h-3 text-sway-accent stroke-[3]" />
                  <span className="font-grotesk text-[9px] text-sway-accent font-extrabold tracking-widest uppercase">
                    DIPILIH
                  </span>
                </div>
              </div>

              {/* Compact Frame Preview Card */}
              <div className="p-2.5 bg-sway-card border border-sway-border-dim rounded shadow-lg flex items-center justify-center shrink-0 mt-1 max-w-full">
                {selectedTpl.previewUrl ? (
                  <img
                    key={selectedTpl._id}
                    src={selectedTpl.previewUrl}
                    alt={selectedTpl.name}
                    className="w-[140px] h-auto object-contain rounded"
                  />
                ) : (
                  <FramePreview
                    key={selectedTpl._id}
                    layout={selectedTpl.layout}
                    slots={selectedTpl.slots}
                    name={selectedTpl.name}
                    previewWidth={140}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center gap-3 bg-sway-card/20 rounded-xl border border-sway-border-dim p-8">
              <Layers className="w-8 h-8 text-sway-ghost" />
              <span className="font-grotesk text-[11px] text-sway-ghost uppercase tracking-wider">
                {templates.length === 0
                  ? `Tidak ada frame dengan ${selectedPackage?.photoCount} slot`
                  : 'Pilih template di sebelah kanan'}
              </span>
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL: template grid ────────────────────────────────── */}
        <div className="w-full lg:w-[70%] flex flex-col lg:pl-2 gap-4">

          {/* Slot filter info */}
          {selectedPackage && (
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-sway-accent rounded-full" />
              <span className="font-grotesk text-[10px] text-sway-dim uppercase tracking-widest font-bold">
                Menampilkan frame dengan {selectedPackage.photoCount} slot — sesuai paket Anda
              </span>
            </div>
          )}

          {templates.length === 0 ? (
            <div className="flex-grow flex flex-col items-center justify-center text-center gap-3 bg-sway-card/20 rounded-xl border border-sway-border-dim p-12">
              <Layers className="w-10 h-10 text-sway-ghost" />
              <p className="font-grotesk text-[12px] text-sway-dim">
                Tidak ada template frame yang tersedia untuk paket ini.
              </p>
              <p className="font-grotesk text-[10px] text-sway-ghost">
                Silakan hubungi admin untuk menambahkan template dengan {selectedPackage?.photoCount} slot.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pb-4">
              {templates.map((tpl) => {
                const isSelected = selectedTpl?._id === tpl._id
                return (
                  <button
                    key={tpl._id}
                    onClick={() => setSelectedTpl(tpl)}
                    className={`relative flex flex-col bg-sway-card border rounded-xl overflow-hidden transition-all duration-200 active:scale-[0.97] cursor-pointer select-none text-left w-full group ${
                      isSelected
                        ? 'border-sway-accent shadow-[0_0_24px_rgba(255,107,90,0.25)] bg-sway-surface'
                        : 'border-sway-border-dim hover:border-sway-border hover:bg-sway-surface/40'
                    }`}
                  >
                    {/* Selected badge */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-sway-accent rounded-full px-2 py-0.5">
                        <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                        <span className="font-grotesk text-[7px] text-white font-extrabold uppercase tracking-wider">
                          PILIH
                        </span>
                      </div>
                    )}

                    {/* Frame visual preview area */}
                    <div
                      className={`w-full flex items-center justify-center transition-colors duration-200 ${
                        isSelected ? 'bg-sway-card-top' : 'bg-sway-bg/80 group-hover:bg-sway-card-top/60'
                      }`}
                      style={{ padding: '12px 10px', minHeight: 130 }}
                    >
                      {tpl.previewUrl ? (
                        <img
                          src={tpl.previewUrl}
                          alt={tpl.name}
                          className="max-h-[120px] w-auto object-contain"
                          loading="lazy"
                        />
                      ) : (
                        <FramePreview
                          layout={tpl.layout}
                          slots={tpl.slots}
                          name={tpl.name}
                          previewWidth={78}
                          inactive={!isSelected}
                          variant="card"
                        />
                      )}
                    </div>

                    {/* Name + slot info */}
                    <div
                      className={`px-3 py-2.5 border-t transition-colors duration-200 ${
                        isSelected
                          ? 'border-sway-accent/30 bg-sway-surface'
                          : 'border-sway-border-dim bg-sway-card'
                      }`}
                    >
                      <h3 className="font-grotesk text-sway-text font-bold text-[10px] line-clamp-1 uppercase tracking-wider leading-tight">
                        {tpl.name}
                      </h3>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Camera className="w-2.5 h-2.5 text-sway-accent" />
                        <span className="text-[9px] text-sway-accent font-extrabold font-grotesk tracking-widest uppercase">
                          {tpl.slots} SLOT
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-sway-error/15 border border-sway-error/30 text-sway-text rounded text-xs font-bold text-center uppercase tracking-wider animate-fadeIn shrink-0">
              {errorMsg}
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM BAR */}
      <BottomBar
        left={
          <Button
            onClick={() => navigate('/packages')}
            disabled={isStarting}
            variant="ghost"
            className="h-11 font-bold font-grotesk"
          >
            ← KEMBALI
          </Button>
        }
        right={
          selectedTpl ? (
            <Button
              onClick={handleNext}
              disabled={isStarting}
              variant="accent"
              size="lg"
              className="h-11 min-w-[150px] font-bold font-grotesk"
            >
              {isStarting ? 'MEMULAI...' : 'MULAI FOTO →'}
            </Button>
          ) : undefined
        }
      />
    </div>
  )
}
