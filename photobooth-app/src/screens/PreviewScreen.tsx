import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSessionStore } from '@/stores/sessionStore'
import { StripComposer, StripComposerRef } from '@/components/canvas/StripComposer'
import { GifGenerator } from '@/components/canvas/GifGenerator'
import { api } from '@/lib/api'
import { ProgressBar } from '@/components/shared/ProgressBar'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { BottomBar } from '@/components/shared/BottomBar'
import { Button } from '@/components/shared/Button'
import { Sparkles, ArrowRight, RefreshCw } from 'lucide-react'

// Helper to convert base64 data URL to a Blob
function dataURLtoBlob(dataurl: string): Blob {
  const arr = dataurl.split(',')
  const mime = arr[0].match(/:(.*?);/)![1]
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new Blob([u8arr], { type: mime })
}

export function PreviewScreen() {
  const navigate = useNavigate()
  const {
    sessionId,
    selectedPackage,
    selectedTemplate,
    capturedPhotos,
    setStripUrl,
    setGifUrl,
    setLocalStripUrl,
    setLocalGifUrl,
    resetSession,
  } = useSessionStore()

  const stripComposerRef = useRef<StripComposerRef>(null)
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStatus, setProcessingStatus] = useState<string>('')
  const [gifUrlLocal, setGifUrlLocal] = useState<string | null>(null)
  const [gifGenerating, setGifGenerating] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Redirect if session state is missing
  useEffect(() => {
    if (!sessionId || !selectedPackage || !selectedTemplate || capturedPhotos.length === 0) {
      navigate('/')
    }
  }, [sessionId, selectedPackage, selectedTemplate, capturedPhotos, navigate])

  // Automatically start GIF generation if package allows it
  useEffect(() => {
    if (selectedPackage?.includeGif && capturedPhotos.length > 0) {
      setGifGenerating(true)
    }
  }, [selectedPackage, capturedPhotos])

  if (!sessionId || !selectedPackage || !selectedTemplate || capturedPhotos.length === 0) {
    return null
  }

  const handleGifComplete = (gifDataUrl: string) => {
    setGifUrlLocal(gifDataUrl)
    setGifGenerating(false)
  }

  const handleGifError = () => {
    setGifGenerating(false)
  }

  const handleProcessPhotos = async () => {
    if (!stripComposerRef.current) return
    setIsProcessing(true)
    setErrorMsg(null)

    try {
      // 1. Export strip image from StripComposer
      setProcessingStatus('Merangkai foto cetak...')
      const stripDataUrl = stripComposerRef.current.exportImage()
      if (!stripDataUrl) {
        throw new Error('Gagal merangkai strip foto')
      }

      // Convert to blob for upload
      const stripBlob = dataURLtoBlob(stripDataUrl)

      // 2. Upload Strip Photo to Cloudflare R2
      setProcessingStatus('Mengunggah foto cetak ke server...')
      const stripFormData = new FormData()
      stripFormData.append('image', stripBlob, `strip-${sessionId}.jpg`)
      
      const stripUploadRes = await api.post('/api/public/upload', stripFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      const uploadedStripUrl = stripUploadRes.data.data?.url
      const localStripUrl = stripUploadRes.data.data?.localUrl || uploadedStripUrl
      if (!uploadedStripUrl) {
        throw new Error('Gagal mengunggah foto cetak')
      }
      setStripUrl(uploadedStripUrl)
      setLocalStripUrl(localStripUrl)

      // 3. Upload GIF if available
      let uploadedGifUrl = ''
      if (selectedPackage.includeGif && gifUrlLocal) {
        setProcessingStatus('Mengunggah GIF animasi...')
        const gifBlob = dataURLtoBlob(gifUrlLocal)
        const gifFormData = new FormData()
        gifFormData.append('image', gifBlob, `animated-${sessionId}.gif`)

        const gifUploadRes = await api.post('/api/public/upload', gifFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })

        uploadedGifUrl = gifUploadRes.data.data?.url || ''
        const localGifUrl = gifUploadRes.data.data?.localUrl || uploadedGifUrl
        if (uploadedGifUrl) {
          setGifUrl(uploadedGifUrl)
          setLocalGifUrl(localGifUrl)
        }
      }

      // 4. Proceed to Output Screen
      navigate('/output')
    } catch (e: any) {
      console.error(e)
      setErrorMsg(e.response?.data?.message || e.message || 'Gagal memproses foto Anda. Silakan coba lagi.')
      setIsProcessing(false)
    }
  }

  const handleRetakeAll = () => {
    if (window.confirm('Hapus semua foto dan ulangi pemotretan?')) {
      useSessionStore.setState({ capturedPhotos: [] })
      navigate('/camera')
    }
  }

  const handleCancelSession = () => {
    if (window.confirm('Batalkan sesi ini dan kembali ke menu utama?')) {
      resetSession()
      navigate('/')
    }
  }

  return (
    <div className="h-screen w-full flex flex-col bg-sway-bg text-sway-text select-none justify-between overflow-hidden">
      {/* Top: ProgressBar */}
      <ProgressBar currentStep={5} onBack={handleCancelSession} />

      {/* MAIN CONTENT */}
      <div className="flex-grow min-h-0 flex flex-col lg:flex-row px-6 lg:px-8 py-6 gap-6 lg:gap-8 overflow-y-auto">
        
        {/* LEFT PANEL */}
        <div className="w-full lg:w-[30%] flex flex-col justify-center items-center gap-3 lg:border-r lg:border-sway-border-dim lg:pr-6">
          <div className="p-2.5 bg-sway-card border border-sway-border-dim rounded shadow-lg flex items-center justify-center shrink-0">
            <StripComposer
              ref={stripComposerRef}
              layout={selectedTemplate.layout}
              photos={capturedPhotos}
              width={140}
              templateName={selectedTemplate.name}
            />
          </div>
          <div className="text-center">
            <span className="font-grotesk text-[11px] text-sway-accent font-extrabold tracking-widest block uppercase">
              PRATINJAU CETAK
            </span>
            <span className="text-[10px] text-sway-dim uppercase tracking-wider font-grotesk block mt-0.5 font-bold">
              LAYOUT: {selectedTemplate.name}
            </span>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="w-full lg:w-[70%] flex flex-col justify-center gap-4 lg:pl-2">
          
          {/* Header Title inside panel right */}
          <div className="shrink-0">
            <span className="font-grotesk text-[10px] text-sway-accent font-extrabold tracking-widest block uppercase">
              LANGKAH 05
            </span>
            <h2 className="font-bebas text-[36px] lg:text-[48px] text-sway-text leading-tight font-bold tracking-wide uppercase mt-1">
              PRATINJAU DOKUMENTASI
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
            {/* Left side of right panel: Rincian & Disclaimer */}
            <div className="flex flex-col gap-3">
              <div className="bg-sway-card border border-sway-border-dim rounded p-4 flex-1 flex flex-col justify-between">
                <h4 className="font-grotesk text-[11px] text-sway-text flex items-center gap-1.5 font-bold mb-3 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-sway-accent" />
                  RINCIAN LAYANAN
                </h4>
                
                <div className="space-y-2.5 font-grotesk text-[11px] text-sway-muted flex-grow flex flex-col justify-center">
                  <div className="flex justify-between border-b border-sway-border-dim pb-1.5">
                    <span className="text-sway-dim font-bold">PAKET DOKUMENTASI</span>
                    <span className="font-extrabold text-sway-text uppercase">{selectedPackage.name}</span>
                  </div>
                  <div className="flex justify-between border-b border-sway-border-dim pb-1.5">
                    <span className="text-sway-dim font-bold">TOTAL POSE</span>
                    <span className="font-extrabold text-sway-text">{capturedPhotos.length} / {selectedPackage.photoCount} FOTO</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sway-dim font-bold">ANIMATED GIF</span>
                    <span className={`font-extrabold uppercase ${selectedPackage.includeGif ? 'text-sway-success' : 'text-sway-dim'}`}>
                      {selectedPackage.includeGif ? 'TERSEDIA ✓' : 'TIDAK AKTIF'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Disclaimer card */}
              <div className="bg-sway-surface/50 border border-sway-border-dim rounded p-3 text-[10px] text-sway-dim leading-relaxed shrink-0">
                Pastikan pose foto Anda sudah memuaskan sebelum dicetak. Setelah diproses, hasil cetakan fisik tidak dapat dibatalkan atau diulangi.
              </div>
            </div>

            {/* Right side of right panel: GIF Preview */}
            <div className="flex flex-col">
              {selectedPackage.includeGif ? (
                <div className="w-full h-full flex flex-col">
                  {gifUrlLocal ? (
                    <div className="bg-sway-card border border-sway-border-dim rounded p-3 flex flex-col items-center justify-center shadow-lg h-full">
                      <div className="w-full aspect-[16/9] rounded overflow-hidden bg-black border border-sway-border-dim shadow-inner flex items-center justify-center p-1.5 flex-grow">
                        <img
                          src={gifUrlLocal}
                          alt="Animated GIF"
                          className="max-w-full max-h-full object-contain rounded"
                        />
                      </div>
                      <span className="font-grotesk text-sway-success font-extrabold text-center mt-2.5 tracking-wider text-[10px] uppercase">
                        GIF ANIMASI TELAH DIHASILKAN 🎉
                      </span>
                    </div>
                  ) : (
                    <div className="bg-sway-card border border-sway-border-dim rounded p-3 flex items-center justify-center h-full">
                      <GifGenerator 
                        photos={capturedPhotos} 
                        onComplete={handleGifComplete}
                        onError={handleGifError}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-sway-card/30 border border-sway-border-dim rounded p-4 flex flex-col items-center justify-center text-center h-full text-sway-dim">
                  <span className="text-[11px] font-bold tracking-wider uppercase">GIF ANIMASI DEAKTIF</span>
                  <span className="text-[10px] mt-2">Upgrade paket Anda di sesi berikutnya untuk mendapatkan file GIF animasi bergerak.</span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Loading processing indicator or Bottom bar */}
      {isProcessing ? (
        <BottomBar
          center={
            <div className="max-w-lg w-full">
              <LoadingSpinner label={processingStatus.toUpperCase()} />
            </div>
          }
        />
      ) : (
        <>
          {errorMsg && (
            <div className="absolute bottom-[80px] left-8 right-8 z-50 max-w-md mx-auto p-2.5 bg-sway-error/15 border border-sway-error border-opacity-30 text-sway-text rounded text-[10px] font-bold text-center uppercase tracking-wider animate-fadeIn">
              {errorMsg}
            </div>
          )}
          
          <BottomBar
            left={
              <Button
                onClick={handleRetakeAll}
                disabled={gifGenerating}
                variant="ghost"
                className="h-11 font-bold font-grotesk"
              >
                <RefreshCw className="w-4 h-4" />
                <span>FOTO ULANG</span>
              </Button>
            }
            right={
              <Button
                onClick={handleProcessPhotos}
                disabled={gifGenerating}
                variant="accent"
                size="lg"
                className="h-11 min-w-[160px] font-bold font-grotesk"
              >
                <span>{gifGenerating ? 'MEMPROSES GIF...' : 'PROSES HASIL'}</span>
                <ArrowRight className="w-5 h-5 stroke-[2.5]" />
              </Button>
            }
          />
        </>
      )}
    </div>
  )
}
