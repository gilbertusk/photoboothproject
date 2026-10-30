import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSessionStore } from '@/stores/sessionStore'
import { generateQRDataURL } from '@/lib/qrcode'
import { api } from '@/lib/api'
import { ProgressBar } from '@/components/shared/ProgressBar'
import { BottomBar } from '@/components/shared/BottomBar'
import { Button } from '@/components/shared/Button'
import { Printer, ArrowRight, Check, AlertTriangle, Copy, Smartphone, Camera, RefreshCw } from 'lucide-react'

export function OutputScreen() {
  const navigate = useNavigate()
  const {
    sessionId,
    stripUrl,
    localStripUrl,
    stripDataUrl,
    selectedPackage,
    galleryUrl,
    shareToken,
  } = useSessionStore()

  // Prefer the in-memory composed strip: no network, no mixed-content (https page -> http LAN url)
  const displayStripSrc = stripDataUrl || stripUrl || localStripUrl || ''
  const printImgRef = useRef<HTMLImageElement>(null)
  const [isPrinting, setIsPrinting] = useState(false)

  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [isCompleting, setIsCompleting] = useState(false)

  // Redirect if session state is missing
  useEffect(() => {
    if (!sessionId || !stripUrl) {
      navigate('/')
    }
  }, [sessionId, stripUrl, navigate])

  // Generate QR Code on mount
  useEffect(() => {
    // Prioritize public R2 URL (stripUrl containing r2.dev) so mobile devices can access it over the internet.
    // Fall back to localUrl (local IP) when running offline or without R2.
    const qrTargetUrl = (stripUrl && stripUrl.includes('r2.dev')) ? stripUrl : (localStripUrl || stripUrl)
    if (qrTargetUrl) {
      generateQRDataURL(qrTargetUrl)
        .then(setQrCodeUrl)
        .catch((err) => console.error('Failed to generate QR Code:', err))
    }
  }, [stripUrl, localStripUrl])

  if (!sessionId || !stripUrl || !selectedPackage) {
    return null
  }

  const handlePrint = async () => {
    const img = printImgRef.current
    if (!img || isPrinting) return
    setIsPrinting(true)
    try {
      if (!img.complete || img.naturalWidth === 0) {
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve()
          img.onerror = () => reject(new Error('Gagal memuat gambar cetak'))
        })
      }
      await img.decode().catch(() => undefined)
      window.print()
    } catch (err) {
      console.error(err)
      alert('Gambar strip belum siap untuk dicetak. Silakan coba lagi.')
    } finally {
      setIsPrinting(false)
    }
  }

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || isSendingEmail) return
    setIsSendingEmail(true)
    setEmailSent(false)
    setEmailError(null)

    try {
      await api.post('/api/public/send-email', {
        sessionId,
        email: email.trim(),
        shareUrl: stripUrl,
      })

      setEmailSent(true)
      setEmail('')
    } catch (err: any) {
      console.error(err)
      setEmailError(err.response?.data?.message || 'Gagal mengirim email. Silakan periksa kembali alamat email Anda.')
    } finally {
      setIsSendingEmail(false)
    }
  }

  const handleFinish = async () => {
    setIsCompleting(true)
    try {
      // 1. Complete Session on backend
      await api.patch(`/api/sessions/${sessionId}/complete`)

      // 2. Navigate to Thank You screen
      navigate('/thankyou')
    } catch (err) {
      console.error('Failed to complete session:', err)
      // Fallback: still go to thank you screen so kiosk doesn't freeze
      navigate('/thankyou')
    } finally {
      setIsCompleting(false)
    }
  }

  return (
    <div className="h-screen w-full flex flex-col bg-sway-bg text-sway-text select-none justify-between overflow-hidden">
      
      {/* Hidden Print Container for Kiosk CSS Printer */}
      <div id="print-area" className="hidden print:block print:w-full print:h-full">
        <img
          ref={printImgRef}
          src={displayStripSrc}
          alt="Printed Photobooth Strip"
          className="w-full h-auto object-contain max-h-screen mx-auto"
        />
      </div>

      {/* Top: ProgressBar (step=5) */}
      <ProgressBar currentStep={5} onBack={handleFinish} />

      {/* MAIN CONTENT */}
      <div className="flex-grow min-h-0 flex flex-col lg:flex-row px-6 lg:px-8 py-6 gap-6 lg:gap-8 overflow-y-auto print:hidden">
        
        {/* LEFT PANEL */}
        <div className="w-full lg:w-[35%] flex flex-col justify-center items-center gap-3 lg:border-r lg:border-sway-border-dim lg:pr-6">
          <div className="p-2.5 bg-sway-card border border-sway-border-dim rounded shadow-lg flex items-center justify-center shrink-0">
            <img
              src={displayStripSrc}
              alt="Final Photobooth Strip"
              className="w-[140px] h-auto rounded"
            />
          </div>
          
          <div className="w-full max-w-[200px] flex flex-col gap-2 mt-1">
            <div className="flex flex-col gap-2">
              <Button
                onClick={handlePrint}
                disabled={isPrinting}
                variant="accent"
                className="w-full h-11 font-bebas text-sm tracking-widest cursor-pointer flex items-center justify-center gap-2 font-bold"
              >
                <Printer className="w-4 h-4" />
                <span>CETAK SEKARANG</span>
              </Button>
              <Button
                onClick={handlePrint}
                disabled={isPrinting}
                variant="ghost"
                className="w-full h-10 font-bebas text-[11px] tracking-widest cursor-pointer flex items-center justify-center gap-2 font-bold opacity-70 hover:opacity-100 transition-opacity"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>CETAK ULANG</span>
              </Button>
            </div>
            <span className="text-[10px] text-sway-dim uppercase tracking-wider text-center font-grotesk block font-bold">
              KOMPOSISI CETAK FISIK & DIGITAL
            </span>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="w-full lg:w-[65%] flex flex-col justify-center gap-4 lg:pl-2">
          
          {/* Header Title inside panel right */}
          <div className="shrink-0">
            <span className="font-grotesk text-[10px] text-sway-accent font-extrabold tracking-widest block uppercase">
              LANGKAH 06
            </span>
            <h2 className="font-bebas text-[36px] lg:text-[48px] text-sway-text leading-tight font-bold tracking-wide uppercase mt-1">
              UNDUH & SIMPAN FOTO
            </h2>
          </div>

          <div className="flex flex-col gap-3">
            {/* QR Code download card */}
            <div className="bg-sway-card border border-sway-border-dim rounded p-4 flex flex-col items-center justify-center shadow-lg">
              <div className="flex flex-col sm:flex-row items-center gap-5 w-full justify-center text-center sm:text-left">
                <div className="relative p-2 bg-white border border-sway-border-dim rounded overflow-hidden flex items-center justify-center w-28 h-28 shrink-0">
                  {qrCodeUrl ? (
                    <img
                      src={qrCodeUrl}
                      alt="Download QR Code"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="animate-pulse bg-sway-bg/20 w-full h-full rounded" />
                  )}
                </div>
                
                <div className="flex-1 flex flex-col justify-center">
                  <span className="font-grotesk text-[11px] font-bold text-sway-text uppercase tracking-wider">UNDUH KE HANDPHONE INSTAN</span>
                  <p className="text-[10px] text-sway-muted mt-1.5 leading-relaxed max-w-[280px]">
                    Arahkan kamera smartphone Anda ke QR code ini untuk mengunduh versi resolusi tinggi dari cetakan foto digital dan GIF animasi Anda.
                  </p>
                </div>
              </div>
            </div>

            {/* Email Subscription share form */}
            {selectedPackage.includeEmail && (
              <div className="bg-sway-card border border-sway-border-dim rounded p-4">
                <span className="font-grotesk text-sway-dim uppercase tracking-widest block mb-2 text-[10px] font-bold">KIRIM SALINAN KE EMAIL</span>

                <form onSubmit={handleSendEmail} className="flex gap-2">
                  <input
                    type="email"
                    required
                    placeholder="MASUKKAN ALAMAT EMAIL"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 h-11 bg-sway-surface border border-sway-border-dim rounded px-3 font-grotesk text-[12px] text-sway-text placeholder-sway-ghost uppercase focus:outline-none focus:border-sway-accent transition-colors disabled:opacity-50"
                  />
                  <Button
                    type="submit"
                    disabled={isSendingEmail || !email.trim()}
                    variant="accent"
                    className="h-11 cursor-pointer font-bold font-grotesk"
                  >
                    {isSendingEmail ? '...' : 'KIRIM'}
                  </Button>
                </form>

                {emailSent && (
                  <div className="flex items-center gap-1.5 text-[10px] text-sway-success font-bold mt-2.5 animate-scaleIn uppercase tracking-wider">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    Foto berhasil dikirim ke email!
                  </div>
                )}

                {emailError && (
                  <div className="flex items-center gap-1.5 text-[10px] text-sway-accent font-bold mt-2.5 animate-scaleIn uppercase tracking-wider">
                    <AlertTriangle className="w-3.5 h-3.5 stroke-[3] shrink-0" />
                    <span>{emailError}</span>
                  </div>
                )}
              </div>
            )}

            {/* Social Share */}
            {galleryUrl && shareToken && (
              <div className="bg-sway-card border border-sway-border-dim rounded p-4">
                <span className="font-grotesk text-sway-dim uppercase tracking-widest block mb-2 text-[10px] font-bold">
                  BAGIKAN KE SOSIAL MEDIA
                </span>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      const text = `Lihat hasil foto photobooth saya dari bertpixx: ${galleryUrl}`
                      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
                    }}
                    variant="ghost"
                    className="flex-1 h-11 flex items-center justify-center gap-2 font-bold font-grotesk text-[11px] uppercase"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>WA</span>
                  </Button>
                  <Button
                    onClick={() => {
                      window.open(`https://www.instagram.com/stories/?share_url=${encodeURIComponent(galleryUrl)}`, '_blank')
                    }}
                    variant="ghost"
                    className="flex-1 h-11 flex items-center justify-center gap-2 font-bold font-grotesk text-[11px] uppercase"
                  >
                    <Camera className="w-4 h-4" />
                    <span>IG</span>
                  </Button>
                  <Button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(galleryUrl)
                      } catch (err) {
                        console.error('Failed to copy:', err)
                      }
                    }}
                    variant="ghost"
                    className="flex-1 h-11 flex items-center justify-center gap-2 font-bold font-grotesk text-[11px] uppercase"
                  >
                    <Copy className="w-4 h-4" />
                    <span>SALIN</span>
                  </Button>
                </div>
                <p className="font-grotesk text-[9px] text-sway-ghost mt-3 break-all text-center uppercase tracking-wider">
                  {galleryUrl}
                </p>
              </div>
            )}

          </div>

        </div>
      </div>

      {/* BOTTOM BAR */}
      <BottomBar
        left={
          <div className="flex flex-col justify-center">
            <span className="font-grotesk text-sway-dim text-[10px] tracking-widest uppercase font-bold">STATUS SESI</span>
            <span className="text-[20px] font-bebas text-sway-success leading-none select-none tracking-wide uppercase mt-0.5 font-bold">
              TRANSAKSI SELESAI ✓
            </span>
          </div>
        }
        right={
          <Button
            onClick={handleFinish}
            disabled={isCompleting}
            variant="accent"
            size="lg"
            className="h-11 min-w-[140px] font-bold font-grotesk"
          >
            <span>{isCompleting ? 'MENYIMPAN...' : 'SELESAI'}</span>
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
          </Button>
        }
      />
    </div>
  )
}
