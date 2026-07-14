import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSessionStore } from '@/stores/sessionStore'
import { useCamera } from '@/hooks/useCamera'
import { Countdown } from '@/components/camera/Countdown'
import { CaptureFlash } from '@/components/camera/CaptureFlash'
import { RefreshCw, X, RotateCcw, Camera } from 'lucide-react'
import Webcam from 'react-webcam'
import { FILTERS, FilterType } from '@/types'

const FILTERS_LIST: { key: FilterType; label: string }[] = [
  { key: 'normal',  label: 'NORMAL'  },
  { key: 'bw',      label: 'B&W'     },
  { key: 'warm',    label: 'WARM'    },
  { key: 'cool',    label: 'COOL'    },
  { key: 'vintage', label: 'VINTAGE' },
]

export function CameraScreen() {
  const navigate = useNavigate()
  const {
    sessionId, selectedPackage,
    capturedPhotos, addPhoto, removeLastPhoto, replacePhoto,
    isMirror, toggleMirror,
    selectedFilter, setFilter,
    resetSession,
  } = useSessionStore()

  const { webcamRef, captureWithFilter } = useCamera()

  const [isCountdownActive, setIsCountdownActive]       = useState(false)
  const [isAutoSequenceRunning, setIsAutoSequenceRunning] = useState(false)
  const [flashTrigger, setFlashTrigger]                 = useState(0)
  const [retakeIndex, setRetakeIndex]                   = useState<number | null>(null)

  useEffect(() => {
    if (!sessionId || !selectedPackage) navigate('/')
  }, [sessionId, selectedPackage, navigate])

  // Auto-advance to next shot during sequence
  useEffect(() => {
    if (!isAutoSequenceRunning || retakeIndex !== null) return
    if (capturedPhotos.length < (selectedPackage?.photoCount ?? 0)) {
      const t = setTimeout(() => setIsCountdownActive(true), 2000)
      return () => clearTimeout(t)
    } else {
      setIsAutoSequenceRunning(false)
    }
  }, [capturedPhotos.length, isAutoSequenceRunning, selectedPackage, retakeIndex])

  // Navigate to preview when all photos done
  useEffect(() => {
    if (!selectedPackage) return
    if (capturedPhotos.length === selectedPackage.photoCount && retakeIndex === null && !isAutoSequenceRunning) {
      const t = setTimeout(() => navigate('/preview'), 1400)
      return () => clearTimeout(t)
    }
  }, [capturedPhotos, selectedPackage, retakeIndex, isAutoSequenceRunning, navigate])

  if (!sessionId || !selectedPackage) return null

  const requiredPhotos = selectedPackage.photoCount
  const currentCount   = capturedPhotos.length
  const isDone         = currentCount === requiredPhotos && retakeIndex === null

  // ── Thumbnail click — enter retake mode ──────────────────────────────────
  const handleThumbnailClick = (idx: number) => {
    if (!capturedPhotos[idx]) return
    if (isCountdownActive || isAutoSequenceRunning) return
    setRetakeIndex(idx)
    setIsAutoSequenceRunning(false)
  }

  const cancelRetake = () => setRetakeIndex(null)

  // ── Start capture ────────────────────────────────────────────────────────
  const triggerCapture = () => {
    if (isCountdownActive || isAutoSequenceRunning) return
    if (retakeIndex !== null) {
      setIsCountdownActive(true)
    } else {
      if (isDone) return
      setIsAutoSequenceRunning(true)
      setIsCountdownActive(true)
    }
  }

  // ── Countdown done — take photo ──────────────────────────────────────────
  const handleCountdownComplete = () => {
    setIsCountdownActive(false)
    const photo = captureWithFilter(selectedFilter, isMirror)
    if (!photo) return
    setFlashTrigger(p => p + 1)
    if (retakeIndex !== null) {
      replacePhoto(retakeIndex, photo)
      setRetakeIndex(null)
    } else {
      addPhoto(photo)
    }
  }

  const handleReset = () => {
    if (window.confirm('Batalkan sesi ini dan kembali ke menu utama?')) {
      setIsAutoSequenceRunning(false)
      setIsCountdownActive(false)
      resetSession()
      navigate('/')
    }
  }

  const isCaptureBusy  = isCountdownActive || isAutoSequenceRunning
  const inRetakeMode   = retakeIndex !== null

  // Button label
  const captureLabel = isCountdownActive
    ? 'MENGHITUNG...'
    : isAutoSequenceRunning
    ? 'SESI BERJALAN...'
    : inRetakeMode
    ? `AMBIL ULANG FOTO ${retakeIndex! + 1}`
    : 'MULAI AMBIL FOTO'

  return (
    <div className="w-full h-screen flex flex-col lg:flex-row bg-sway-bg text-sway-text select-none overflow-hidden animate-fadeIn">
      <CaptureFlash trigger={flashTrigger} />
      {isCountdownActive && <Countdown from={3} onComplete={handleCountdownComplete} />}

      {/* ── LEFT — camera + thumbnails ──────────────────────────────────── */}
      <div className="flex-1 lg:w-[65%] h-full flex flex-col min-h-0">

        {/* TOP BAR */}
        <div className="h-12 px-5 flex items-center justify-between border-b border-sway-border-dim bg-sway-bg shrink-0">
          {inRetakeMode ? (
            <div className="flex items-center gap-2">
              <RotateCcw className="w-3.5 h-3.5 text-sway-accent" />
              <span className="font-bebas text-[17px] text-sway-accent tracking-wide uppercase">
                RETAKE FOTO {retakeIndex! + 1}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Camera className="w-3.5 h-3.5 text-sway-accent" />
              <span className="font-bebas text-[17px] text-sway-text tracking-wide uppercase">
                {isDone ? 'SEMUA FOTO SELESAI' : `FOTO ${currentCount + 1} / ${requiredPhotos}`}
              </span>
            </div>
          )}

          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: requiredPhotos }).map((_, i) => {
              const filled  = !!capturedPhotos[i]
              const isCurr  = i === currentCount && !isDone && !inRetakeMode
              const isRetake = inRetakeMode && i === retakeIndex
              return (
                <div
                  key={i}
                  className={`rounded-full transition-all duration-300 ${
                    isRetake ? 'w-2.5 h-2.5 bg-sway-accent animate-pulse ring-2 ring-sway-accent/40'
                    : filled  ? 'w-2 h-2 bg-sway-accent'
                    : isCurr  ? 'w-2.5 h-2.5 border-2 border-sway-accent animate-pulse'
                    : 'w-2 h-2 bg-sway-border'
                  }`}
                />
              )
            })}
          </div>
        </div>

        {/* VIDEO FEED */}
        <div className="flex-grow relative overflow-hidden bg-black min-h-0">
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode:'user', width:{ideal:1280}, height:{ideal:720}, aspectRatio:16/9 }}
            style={{
              width:'100%', height:'100%', objectFit:'cover',
              filter: FILTERS[selectedFilter],
              transform: isMirror ? 'scaleX(-1)' : 'none',
            }}
          />

          {/* Grid overlay */}
          <div className="absolute inset-0 pointer-events-none z-10 opacity-20">
            <div className="absolute inset-0 grid grid-cols-3">
              <div className="border-r border-white/30" />
              <div className="border-r border-white/30" />
              <div />
            </div>
            <div className="absolute inset-0 grid grid-rows-3">
              <div className="border-b border-white/30" />
              <div className="border-b border-white/30" />
              <div />
            </div>
          </div>

          {/* Retake mode vignette */}
          {inRetakeMode && !isCountdownActive && (
            <div className="absolute inset-0 z-20 pointer-events-none"
              style={{ boxShadow: 'inset 0 0 60px rgba(255,86,56,0.3)' }}
            />
          )}

          {/* Intermission overlay */}
          {isAutoSequenceRunning && !isCountdownActive && !isDone && (
            <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center gap-3 animate-fadeIn">
              <span className="font-grotesk text-[10px] text-sway-accent font-extrabold tracking-widest uppercase">
                BERSIAP UNTUK FOTO {currentCount + 1}
              </span>
              <span className="font-bebas text-[44px] text-white tracking-widest leading-none animate-pulse">
                SIAP-SIAP...
              </span>
            </div>
          )}

          {/* Done overlay */}
          {isDone && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center gap-3 animate-fadeIn">
              <span className="font-bebas text-[36px] text-sway-accent tracking-widest leading-none">SEMUA FOTO SIAP!</span>
              <span className="font-grotesk text-[11px] text-white/70 tracking-widest uppercase">Menuju preview...</span>
            </div>
          )}
        </div>

        {/* THUMBNAILS STRIP */}
        <div className="h-[88px] bg-black/90 border-t border-sway-border-dim flex items-center justify-center gap-2.5 px-4 shrink-0">
          {Array.from({ length: requiredPhotos }).map((_, idx) => {
            const photo     = capturedPhotos[idx]
            const isFilled  = !!photo
            const isCurrent = idx === currentCount && !isCaptureBusy && !isDone && !inRetakeMode
            const isRetaking = inRetakeMode && idx === retakeIndex

            return (
              <button
                key={idx}
                onClick={() => handleThumbnailClick(idx)}
                disabled={!isFilled || isCaptureBusy}
                title={isFilled ? `Klik untuk retake foto ${idx + 1}` : ''}
                className={`
                  relative w-[70px] h-[62px] rounded overflow-hidden shrink-0
                  border-2 transition-all duration-200 group
                  ${isRetaking
                    ? 'border-sway-accent scale-105 shadow-[0_0_16px_rgba(255,86,56,0.5)]'
                    : isFilled
                    ? 'border-sway-accent/60 hover:border-sway-accent hover:scale-105 cursor-pointer'
                    : isCurrent
                    ? 'border-sway-accent border-dashed animate-pulse'
                    : 'border-sway-border-dim cursor-default'
                  }
                `}
              >
                {photo ? (
                  <>
                    <img src={photo} alt={`Foto ${idx+1}`} className="w-full h-full object-cover" />
                    {/* Retake hover overlay */}
                    {!isCaptureBusy && (
                      <div className={`
                        absolute inset-0 flex flex-col items-center justify-center gap-0.5
                        transition-opacity duration-150
                        ${isRetaking
                          ? 'bg-sway-accent/30 opacity-100'
                          : 'bg-black/0 opacity-0 group-hover:bg-black/50 group-hover:opacity-100'
                        }
                      `}>
                        <RotateCcw className="w-4 h-4 text-white drop-shadow" />
                        <span className="font-grotesk text-[8px] text-white font-bold uppercase tracking-wider drop-shadow">
                          {isRetaking ? 'RETAKE' : 'ULANG'}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                    <span className="font-grotesk text-[8px] text-sway-ghost font-bold uppercase tracking-wider">
                      SLOT {idx + 1}
                    </span>
                  </div>
                )}

                {/* Slot number badge */}
                <div className={`
                  absolute bottom-1 right-1 w-4 h-4 rounded-full flex items-center justify-center
                  font-grotesk text-[8px] font-black
                  ${isRetaking ? 'bg-sway-accent text-white' : isFilled ? 'bg-black/60 text-white' : 'bg-transparent'}
                `}>
                  {isFilled || isRetaking ? idx + 1 : ''}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── RIGHT — controls ─────────────────────────────────────────────── */}
      <div className="w-full lg:w-[35%] h-auto lg:h-full flex flex-col border-t lg:border-t-0 lg:border-l border-sway-border-dim bg-sway-surface shrink-0">

        {/* FILTER SECTION */}
        <div className="flex-1 flex flex-col p-5 gap-3 min-h-0 overflow-y-auto">
          <div className="flex items-center justify-between mb-1">
            <span className="font-grotesk text-[10px] text-sway-dim uppercase tracking-widest font-bold">FILTER FOTO</span>
            <button
              onClick={handleReset}
              className="w-7 h-7 flex items-center justify-center text-sway-ghost hover:text-sway-accent rounded-full hover:bg-sway-card cursor-pointer active:scale-95 transition-all"
              title="Batalkan Sesi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {FILTERS_LIST.map(({ key, label }) => {
              const isActive = selectedFilter === key
              return (
                <button
                  key={key}
                  disabled={isCaptureBusy}
                  onClick={() => setFilter(key)}
                  className={`
                    h-11 w-full px-4 rounded border flex items-center justify-between
                    transition-all cursor-pointer font-grotesk font-bold text-[11px] uppercase tracking-widest
                    ${isActive
                      ? 'bg-sway-accent/12 border-sway-accent text-sway-accent'
                      : 'bg-sway-card border-sway-border text-sway-muted hover:border-sway-border hover:text-sway-text'
                    }
                    ${isCaptureBusy && !isActive ? 'opacity-40 cursor-not-allowed' : ''}
                  `}
                >
                  <span>{label}</span>
                  {isActive && <div className="w-1.5 h-1.5 rounded-full bg-sway-accent" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* ACTION SECTION */}
        <div className="p-5 flex flex-col gap-3 border-t border-sway-border-dim bg-sway-bg shrink-0">

          {/* Retake mode — cancel button OR mirror toggle */}
          {inRetakeMode ? (
            <button
              onClick={cancelRetake}
              disabled={isCaptureBusy}
              className="h-11 w-full bg-transparent hover:bg-sway-surface border border-sway-border-dim rounded font-grotesk text-[11px] uppercase tracking-widest text-sway-muted hover:text-sway-text active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 font-bold disabled:opacity-40"
            >
              <X className="w-4 h-4" />
              <span>BATAL RETAKE</span>
            </button>
          ) : (
            <button
              onClick={toggleMirror}
              disabled={isCaptureBusy || isDone}
              className="h-11 w-full bg-sway-card hover:bg-sway-card-hi border border-sway-border-dim rounded font-grotesk text-[11px] uppercase tracking-widest text-sway-muted hover:text-sway-text active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 font-bold disabled:opacity-40"
            >
              <RefreshCw className="w-4 h-4" />
              <span>MIRROR KAMERA</span>
            </button>
          )}

          {/* CAPTURE BUTTON */}
          <button
            onClick={triggerCapture}
            disabled={isCaptureBusy || (!inRetakeMode && isDone)}
            className={`
              w-full h-16 rounded border-2 flex items-center justify-center transition-all select-none
              ${isCaptureBusy || (!inRetakeMode && isDone)
                ? 'border-sway-border-dim opacity-40 cursor-not-allowed'
                : inRetakeMode
                ? 'border-sway-accent hover:scale-[1.01] active:scale-[0.99] cursor-pointer'
                : 'border-sway-text hover:scale-[1.01] active:scale-[0.99] cursor-pointer'
              }
            `}
          >
            <div className={`
              w-full h-full rounded flex items-center justify-center
              font-bebas text-[17px] tracking-widest font-bold transition-colors duration-200
              ${isCaptureBusy || (!inRetakeMode && isDone)
                ? 'bg-sway-border-dim text-sway-ghost'
                : inRetakeMode
                ? 'bg-sway-accent text-white'
                : 'bg-sway-accent text-white hover:bg-sway-accent/90'
              }
            `}>
              {captureLabel}
            </div>
          </button>

          {/* RETAKE LAST — only in normal mode */}
          {!inRetakeMode && (
            <button
              onClick={() => removeLastPhoto()}
              disabled={isCaptureBusy || currentCount === 0 || isDone}
              className="h-10 w-full bg-transparent hover:bg-sway-surface border border-sway-border-dim rounded font-grotesk text-[10px] uppercase tracking-widest text-sway-ghost hover:text-sway-muted active:scale-95 transition-all disabled:opacity-30 cursor-pointer flex items-center justify-center gap-2 font-bold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>HAPUS FOTO TERAKHIR</span>
            </button>
          )}

          {/* Hint text */}
          <p className="text-center font-grotesk text-[9px] text-sway-ghost uppercase tracking-widest">
            {inRetakeMode
              ? `Klik ambil ulang untuk foto ${retakeIndex! + 1}`
              : isDone
              ? 'Klik foto di bawah untuk retake'
              : 'Klik foto di bawah untuk retake pose'}
          </p>
        </div>
      </div>
    </div>
  )
}
