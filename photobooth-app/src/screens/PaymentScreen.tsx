import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSessionStore } from '@/stores/sessionStore'
import { usePaymentPolling } from '@/hooks/usePaymentPolling'
import { CountdownTimer } from '@/components/shared/CountdownTimer'
import { ProgressBar } from '@/components/shared/ProgressBar'
import { PaymentSuccessOverlay } from '@/components/PaymentSuccessOverlay'
import { BottomBar } from '@/components/shared/BottomBar'
import { Button } from '@/components/shared/Button'
import { formatRupiah } from '@/lib/utils'
import { ShieldCheck } from 'lucide-react'

export function PaymentScreen() {
  const navigate = useNavigate()
  const { sessionId, qrUrl, selectedPackage, resetSession } = useSessionStore()

  // Poll payment status
  const { status, transaction } = usePaymentPolling({
    sessionId,
    enabled: !!sessionId,
  })

  // Redirect if session state is missing
  useEffect(() => {
    if (!sessionId || !qrUrl || !selectedPackage) {
      navigate('/packages')
    }
  }, [sessionId, qrUrl, selectedPackage, navigate])

  const handleCancel = () => {
    resetSession()
    navigate('/')
  }

  if (!sessionId || !qrUrl || !selectedPackage) {
    return null
  }

  const finalAmount = transaction?.amount || selectedPackage.price

  return (
    <div className="h-screen w-full flex flex-col bg-sway-bg text-sway-text select-none justify-between overflow-hidden">
      {/* Top: ProgressBar (step=2) */}
      <ProgressBar currentStep={2} onBack={handleCancel} />

      {/* MAIN CONTENT */}
      <div className="flex-grow min-h-0 flex flex-col lg:flex-row px-6 lg:px-8 py-6 gap-6 lg:gap-8 overflow-y-auto">
        
        {/* LEFT PANEL */}
        <div className="w-full lg:w-[45%] flex flex-col justify-center items-center gap-5 lg:border-r lg:border-sway-border-dim lg:pr-6">
          <div className="text-center w-full">
            <span className="font-grotesk text-[11px] text-sway-dim uppercase tracking-widest block mb-1 font-bold">TOTAL PEMBAYARAN</span>
            <h3 className="font-bebas text-[36px] lg:text-[48px] text-sway-accent leading-none tracking-wide font-bold">
              {formatRupiah(finalAmount)}
            </h3>
          </div>

          {/* Thick Red Accented Visual Border Frame around QR */}
          <div className="relative p-2.5 bg-white border-[4px] border-sway-accent rounded overflow-hidden w-[180px] h-[180px] lg:w-[200px] lg:h-[200px] flex items-center justify-center shadow-[0_0_30px_rgba(255,86,56,0.15)] animate-scaleIn shrink-0">
            {qrUrl ? (
              <img
                src={qrUrl}
                alt="QRIS Payment"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="animate-pulse bg-sway-bg/20 w-full h-full rounded" />
            )}
          </div>

          <span className="font-grotesk text-sway-muted font-bold tracking-widest text-[10px] text-center uppercase">
            PINDAI QRIS UNTUK PEMBAYARAN
          </span>
        </div>

        {/* RIGHT PANEL */}
        <div className="w-full lg:w-[55%] flex flex-col justify-center gap-4 lg:pl-2">
          {/* Expiry Countdown Timer block */}
          {status === 'PENDING' && (
            <div className="w-full flex flex-col items-center gap-1.5 bg-sway-card/50 border border-sway-border-dim rounded py-2.5 px-4 shrink-0">
              <span className="font-grotesk text-sway-dim text-[10px] tracking-widest uppercase font-extrabold">QRIS KADALUARSA DALAM</span>
              <CountdownTimer 
                totalSeconds={900} 
                onExpired={handleCancel}
                showBar={false}
              />
            </div>
          )}

          {/* Instructions Step Cards */}
          <div className="flex flex-col gap-2.5">
            <span className="font-grotesk text-sway-dim mb-0.5 text-[11px] font-bold uppercase tracking-wider">PETUNJUK PEMBAYARAN</span>
            
            {/* Step 1 */}
            <div className="flex bg-sway-card border-l-[3px] border-sway-accent rounded p-2.5 gap-3 items-start">
              <span className="font-bebas text-xl text-sway-accent leading-none font-bold">01</span>
              <div className="flex-1 flex flex-col">
                <span className="font-grotesk text-sway-text text-[11px] font-bold uppercase tracking-wider">Buka Aplikasi</span>
                <span className="text-[11px] text-sway-muted mt-0.5 leading-normal">
                  Buka GoPay, ShopeePay, OVO, Dana, LinkAja, atau aplikasi Mobile Banking Anda.
                </span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex bg-sway-card border-l-[3px] border-sway-accent rounded p-2.5 gap-3 items-start">
              <span className="font-bebas text-xl text-sway-accent leading-none font-bold">02</span>
              <div className="flex-1 flex flex-col">
                <span className="font-grotesk text-sway-text text-[11px] font-bold uppercase tracking-wider">Pindai QR Code</span>
                <span className="text-[11px] text-sway-muted mt-0.5 leading-normal">
                  Arahkan pemindai kamera Anda ke QR Code merah di sebelah kiri.
                </span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex bg-sway-card border-l-[3px] border-sway-accent rounded p-2.5 gap-3 items-start">
              <span className="font-bebas text-xl text-sway-accent leading-none font-bold">03</span>
              <div className="flex-1 flex flex-col">
                <span className="font-grotesk text-sway-text text-[11px] font-bold uppercase tracking-wider">Proses Otomatis</span>
                <span className="text-[11px] text-sway-muted mt-0.5 leading-normal">
                  Setelah berhasil dibayar, sistem akan mendeteksi otomatis dalam beberapa detik.
                </span>
              </div>
            </div>
          </div>

          {/* Secure & Status Badges */}
          <div className="flex flex-col gap-1 bg-sway-surface/50 border border-sway-border-dim rounded p-2.5 shrink-0">
            <div className="flex items-center gap-1.5 text-sway-success text-[11px] font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-sway-success" />
              <span>TRANSAKSI AMAN & TERVERIFIKASI</span>
            </div>
            <p className="text-[10px] text-sway-dim leading-relaxed">
              Kiosk ini terhubung langsung dengan sistem pembayaran resmi Tobooth.
            </p>
          </div>
        </div>

      </div>

      {/* BOTTOM BAR */}
      <BottomBar
        left={
          <div className="flex items-center gap-3">
            {/* Pulsing Status Dot */}
            <div className="relative w-3 h-3 flex items-center justify-center">
              {status === 'PENDING' ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sway-gold opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-sway-gold"></span>
                </>
              ) : status === 'EXPIRED' ? (
                <span className="relative inline-flex rounded-full h-3 w-3 bg-sway-accent"></span>
              ) : (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sway-success opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-sway-success"></span>
                </>
              )}
            </div>
            <span className="font-grotesk text-sway-text font-bold text-[12px] uppercase tracking-wider">
              {status === 'PENDING' && 'MENUNGGU PEMBAYARAN...'}
              {status === 'EXPIRED' && 'QRIS KADALUARSA'}
              {status === 'PAID' && 'PEMBAYARAN BERHASIL!'}
            </span>
          </div>
        }
        right={
          status === 'PENDING' ? (
            <Button
              onClick={handleCancel}
              variant="ghost"
              className="h-11 cursor-pointer font-bold font-grotesk"
            >
              BATALKAN SESI
            </Button>
          ) : status === 'EXPIRED' ? (
            <Button
              onClick={handleCancel}
              variant="accent"
              className="h-11 cursor-pointer font-bold font-grotesk"
            >
              KEMBALI KE BERANDA
            </Button>
          ) : undefined
        }
      />

      {/* Fullscreen Payment Success Overlay */}
      {status === 'PAID' && (
        <PaymentSuccessOverlay onComplete={() => navigate('/template')} />
      )}
    </div>
  )
}
