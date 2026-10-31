import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { PricingPackage, Voucher, ApiResponse } from '@/types'
import { useSessionStore } from '@/stores/sessionStore'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ProgressBar } from '@/components/shared/ProgressBar'
import { PackageCard } from '@/components/PackageCard'
import { BottomBar } from '@/components/shared/BottomBar'
import { Button } from '@/components/shared/Button'

export function PackageScreen() {
  const navigate = useNavigate()
  const { setPackage, setVoucher, resetSession } = useSessionStore()
  const [selectedPkg, setSelectedPkg] = useState<PricingPackage | null>(null)
  const [voucherCode, setVoucherCode] = useState('')
  const [voucherError, setVoucherError] = useState<string | null>(null)
  const [appliedVoucherData, setAppliedVoucherData] = useState<Voucher | null>(null)
  const [isValidatingVoucher, setIsValidatingVoucher] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Fetch active packages
  const { data: packages, isLoading, error } = useQuery<PricingPackage[]>({
    queryKey: ['packages'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<PricingPackage[]>>('/api/public/packages')
      return res.data.data || []
    },
  })

  // Set default package selection when packages are loaded
  useEffect(() => {
    if (packages && packages.length > 0 && !selectedPkg) {
      const premiumPkg = packages.find(p => p.name.toUpperCase().includes('PREMIUM'))
      setSelectedPkg(premiumPkg || packages[0])
    }
  }, [packages, selectedPkg])

  // Handle voucher validation
  const validateVoucher = async () => {
    if (!voucherCode.trim()) return
    setVoucherError(null)
    setIsValidatingVoucher(true)

    try {
      const res = await api.post<ApiResponse<Voucher>>('/api/public/vouchers/validate', {
        code: voucherCode.trim().toUpperCase(),
      })

      if (res.data.success && res.data.data) {
        setAppliedVoucherData(res.data.data)
        setVoucherCode('')
      } else {
        setVoucherError(res.data.message || 'Voucher tidak valid')
      }
    } catch (e: any) {
      setVoucherError(e.response?.data?.message || 'Kode voucher tidak ditemukan atau sudah habis kuota')
    } finally {
      setIsValidatingVoucher(false)
    }
  }

  const handleRemoveVoucher = () => {
    setAppliedVoucherData(null)
  }

  // Calculate pricing summary
  const originalPrice = selectedPkg?.price || 0
  let discountAmount = 0
  if (selectedPkg && appliedVoucherData) {
    if (appliedVoucherData.type === 'PERCENTAGE') {
      discountAmount = Math.round((originalPrice * appliedVoucherData.value) / 100)
    } else {
      discountAmount = appliedVoucherData.value
    }
  }
  const finalPrice = Math.max(0, originalPrice - discountAmount)

  const handleCheckout = async () => {
    if (!selectedPkg) return
    setIsSubmitting(true)
    setErrorMsg(null)

    // Save selected data to Zustand sessionStore
    setPackage(selectedPkg)
    setVoucher(appliedVoucherData)

    try {
      // 1. Create Session
      const sessionRes = await api.post('/api/sessions', {
        packageId: selectedPkg._id,
        voucherCode: appliedVoucherData?.code || undefined,
      })

      const session = sessionRes.data.data
      if (!session || !session._id) {
        throw new Error('Gagal membuat sesi photobooth')
      }

      useSessionStore.setState({ sessionId: session._id })

      // 2. Create Transaction
      const transactionRes = await api.post('/api/transactions', {
        sessionId: session._id,
      })

      const transaction = transactionRes.data.data
      if (!transaction || !transaction.qrUrl) {
        throw new Error('Gagal membuat transaksi QRIS')
      }

      useSessionStore.setState({
        transactionId: transaction._id,
        qrUrl: transaction.qrUrl,
      })

      // Navigate directly to payment screen
      navigate('/payment')
    } catch (e: any) {
      console.error(e)
      setErrorMsg(e.response?.data?.message || e.message || 'Terjadi kesalahan sistem. Silakan coba lagi.')
      setIsSubmitting(false)
    }
  }

  const handleBack = () => {
    resetSession()
    navigate('/kiosk')
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-sway-bg text-sway-text select-none">
        <LoadingSpinner label="Memuat paket layanan..." />
      </div>
    )
  }

  if (error || !packages) {
    return (
      <div className="flex flex-col min-h-screen w-full items-center justify-center bg-sway-bg text-sway-text px-6 text-center select-none">
        <p className="text-sway-accent font-bold mb-4 font-grotesk text-lg">Gagal menghubungkan ke server.</p>
        <Button variant="accent" onClick={() => window.location.reload()}>
          Coba Lagi
        </Button>
      </div>
    )
  }

  return (
    <div className="h-screen w-full flex flex-col bg-sway-bg text-sway-text select-none justify-between overflow-hidden">
      {/* TOP: ProgressBar */}
      <ProgressBar currentStep={1} onBack={handleBack} />

      {/* MAIN CONTENT */}
      <div className="flex-grow min-h-0 flex flex-col lg:flex-row px-6 lg:px-8 py-6 gap-6 lg:gap-8 overflow-y-auto">
        
        {/* LEFT PANEL */}
        <div className="w-full lg:w-[45%] flex flex-col gap-4 lg:border-r lg:border-sway-border-dim lg:pr-6">
          <div className="flex flex-col mb-2">
            <span className="font-grotesk text-[10px] text-sway-accent font-extrabold tracking-widest uppercase">
              LANGKAH 01
            </span>
            <h2 className="font-bebas text-[36px] lg:text-[48px] text-sway-text leading-tight font-bold tracking-wide uppercase mt-1">
              PILIH PAKET
            </h2>
            <div className="w-full h-[1px] bg-sway-border-dim mt-3" />
          </div>

          <div className="flex flex-col gap-3">
            {packages.map((pkg) => {
              const isSelected = selectedPkg?._id === pkg._id
              const isFeatured = pkg.name.toUpperCase().includes('PREMIUM') || pkg.price === 45000

              const features = [
                `${pkg.photoCount} FOTO`,
                `${Math.round(pkg.duration / 60)} MIN`,
                `1× CETAK`,
              ]
              if (pkg.includeGif) features.push('+GIF')
              if (pkg.includeEmail) features.push('+EMAIL')

              return (
                <PackageCard
                  key={pkg._id}
                  name={pkg.name}
                  price={pkg.price}
                  photoCount={pkg.photoCount}
                  features={features}
                  isSelected={isSelected}
                  isFeatured={isFeatured}
                  onClick={() => setSelectedPkg(pkg)}
                />
              )
            })}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="w-full lg:w-[55%] flex flex-col justify-between lg:pl-2">
          <div className="flex flex-col gap-6">
            {/* Voucher Section */}
            <div className="flex flex-col">
              <label className="font-grotesk text-[11px] text-sway-ghost uppercase tracking-widest font-bold mb-2">KODE VOUCHER</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="MASUKKAN KODE"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                  disabled={isSubmitting || !!appliedVoucherData}
                  className="flex-grow h-11 bg-sway-surface border border-sway-border-dim rounded px-4 font-grotesk text-[13px] text-sway-text placeholder-sway-ghost uppercase focus:outline-none focus:border-sway-accent transition-colors disabled:opacity-50"
                />
                <Button
                  onClick={validateVoucher}
                  disabled={isValidatingVoucher || !voucherCode.trim() || !!appliedVoucherData || isSubmitting}
                  variant="ghost"
                  className="h-11 cursor-pointer"
                >
                  {isValidatingVoucher ? '...' : 'TERAPKAN'}
                </Button>
              </div>

              {voucherError && (
                <p className="text-sway-error text-[11px] font-bold mt-2 uppercase tracking-wide">
                  {voucherError}
                </p>
              )}

              {appliedVoucherData && (
                <div className="flex items-center justify-between bg-sway-success/10 border border-sway-success/30 rounded p-3 px-4 mt-3 animate-scaleIn">
                  <span className="font-grotesk text-sway-success font-extrabold text-[12px] uppercase tracking-wider flex items-center gap-1.5">
                    ✓ {appliedVoucherData.code} — HEMAT Rp {discountAmount.toLocaleString('id-ID')}
                  </span>
                  <button
                    onClick={handleRemoveVoucher}
                    disabled={isSubmitting}
                    className="w-6 h-6 flex items-center justify-center text-sway-success/60 hover:text-sway-success active:scale-90 transition-colors cursor-pointer"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M9 3l-6 6M3 3l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {errorMsg && (
              <div className="p-3 bg-sway-error/15 border border-sway-error border-opacity-30 text-sway-text rounded text-xs font-bold text-center uppercase tracking-wider animate-fadeIn">
                {errorMsg}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 mt-6 border-t border-sway-border-dim pt-4 bg-sway-bg">
            <span className="font-grotesk text-[11px] text-sway-dim uppercase tracking-widest font-bold">RINGKASAN SESI</span>
            <div className="flex justify-between items-center bg-sway-surface/40 p-3 rounded border border-sway-border-dim">
              <span className="font-grotesk text-[11px] text-sway-ghost uppercase font-bold">PAKET TERPILIH</span>
              <span className="font-bebas text-lg text-sway-accent tracking-wide uppercase">
                {selectedPkg?.name || '-'}
              </span>
            </div>
            {isSubmitting && (
              <div className="flex items-center justify-center gap-2 text-sway-accent animate-pulse font-grotesk text-[11px] uppercase tracking-wider mt-1">
                MEMPERSIAPKAN PEMBAYARAN...
              </div>
            )}
          </div>
        </div>

      </div>

      {/* BOTTOM BAR */}
      <BottomBar
        left={
          <div className="flex flex-col justify-center">
            {discountAmount > 0 && (
              <span className="font-grotesk text-[11px] text-sway-ghost line-through">
                Rp {originalPrice.toLocaleString('id-ID')}
              </span>
            )}
            <span className="text-[28px] font-bebas text-sway-text leading-none select-none tracking-wide">
              Rp {finalPrice.toLocaleString('id-ID')}
            </span>
          </div>
        }
        right={
          <Button
            onClick={handleCheckout}
            disabled={isSubmitting || !selectedPkg}
            variant="accent"
            size="lg"
            className="w-full min-w-[140px]"
          >
            {isSubmitting ? 'MEMPROSES...' : 'BAYAR →'}
          </Button>
        }
      />
    </div>
  )
}
