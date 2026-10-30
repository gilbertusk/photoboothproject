import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '@/lib/api'
import { Button } from '@/components/shared/Button'
import { PricingPackage, Booking } from '@/types'
import { Calendar, Clock, MapPin, User, Mail, Phone, ChevronRight, AlertCircle, Check } from 'lucide-react'

export function BookingPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [packages, setPackages] = useState<PricingPackage[]>([])
  const [selectedPackage, setSelectedPackage] = useState<PricingPackage | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [availableTimes, setAvailableTimes] = useState<string[]>([])
  const [isLoadingPackages, setIsLoadingPackages] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Form state
  const [form, setForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    eventLocation: '',
    eventType: '',
    guestCount: '',
    specialRequests: '',
  })

  // Initialize: load packages and check URL param
  useEffect(() => {
    const loadPackages = async () => {
      try {
        const res = await api.get<{ success: boolean; message: string; data: PricingPackage[] }>(
          '/api/public/packages'
        )
        setPackages(res.data.data)

        // Auto-select package from URL param
        const pkgId = searchParams.get('package')
        if (pkgId) {
          const found = res.data.data.find((p) => p._id === pkgId)
          if (found) {
            setSelectedPackage(found)
          }
        }
      } catch (err: any) {
        console.error(err)
      } finally {
        setIsLoadingPackages(false)
      }
    }

    loadPackages()
  }, [searchParams])

  // Load available time slots when date changes
  useEffect(() => {
    if (!selectedDate) {
      setAvailableTimes([])
      return
    }

    const loadSlots = async () => {
      try {
        const res = await api.get<{
          success: boolean
          message: string
          data: { date: string; availableSlots: string[]; bookedTimes: string[] }
        }>(`/api/bookings/available-slots?date=${encodeURIComponent(selectedDate)}`)
        setAvailableTimes(res.data.data.availableSlots)
      } catch (err: any) {
        console.error(err)
        setAvailableTimes([])
      }
    }

    loadSlots()
  }, [selectedDate])

  const handleSelectPackage = (pkg: PricingPackage) => {
    setSelectedPackage(pkg)
    setErrorMessage(null)
  }

  const handleSelectTime = (time: string) => {
    setSelectedTime(time)
    setErrorMessage(null)
  }

  const handleInputChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const minDate = new Date().toISOString().split('T')[0]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPackage) {
      setErrorMessage('Silakan pilih paket terlebih dahulu.')
      return
    }
    if (!selectedDate) {
      setErrorMessage('Silakan pilih tanggal acara.')
      return
    }
    if (!selectedTime) {
      setErrorMessage('Silakan pilih waktu acara.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const res = await api.post<{ success: boolean; message: string; data: Booking }>(
        '/api/bookings',
        {
          customerName: form.customerName,
          customerEmail: form.customerEmail,
          customerPhone: form.customerPhone,
          packageId: selectedPackage._id,
          eventDate: selectedDate,
          eventTime: selectedTime,
          eventLocation: form.eventLocation,
          eventType: form.eventType || undefined,
          guestCount: form.guestCount ? parseInt(form.guestCount, 10) : undefined,
          specialRequests: form.specialRequests || undefined,
        }
      )

      setSubmitStatus('success')
    } catch (err: any) {
      console.error(err)
      setSubmitStatus('error')
      setErrorMessage(
        err.response?.data?.message || 'Gagal membuat pesanan. Silakan coba lagi.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const isFormValid =
    form.customerName.trim() &&
    form.customerEmail.trim() &&
    form.customerPhone.trim() &&
    form.eventLocation.trim()

  // Success view
  if (submitStatus === 'success') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-sway-bg text-sway-text px-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-sway-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-sway-success" />
          </div>
          <h2 className="font-bebas text-[32px] text-sway-text font-bold tracking-wide mb-4 uppercase">
            Pesanan Diterima!
          </h2>
          <p className="font-grotesk text-[14px] text-sway-muted mb-8">
            Kami telah menerima pemesanan Anda. Tim kami akan segera mengonfirmasi ketersediaan tanggal dan waktu yang Anda pilih melalui email.
          </p>
          <div className="bg-sway-card border border-sway-border-dim rounded-xl p-6 mb-8">
            <p className="font-grotesk text-[11px] text-sway-accent font-extrabold tracking-widest uppercase mb-2">Detail Pesanan</p>
            <p className="font-grotesk text-[13px] text-sway-text mb-1"><strong>Paket:</strong> {selectedPackage?.name}</p>
            <p className="font-grotesk text-[13px] text-sway-text mb-1"><strong>Tanggal:</strong> {selectedDate}</p>
            <p className="font-grotesk text-[13px] text-sway-text mb-1"><strong>Waktu:</strong> {selectedTime}</p>
            <p className="font-grotesk text-[13px] text-sway-text mb-1"><strong>Total:</strong> {formatRupiah(selectedPackage?.price || 0)}</p>
          </div>
          <Button
            onClick={() => navigate('/pricing')}
            variant="accent"
            className="w-full h-11 font-bold font-grotesk tracking-widest uppercase"
          >
            LIHAT PAKET LAIN
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-sway-bg text-sway-text">
      {/* Header */}
      <header className="bg-sway-card border-b border-sway-border-dim sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-2">
              <span className="font-bebas text-[20px] lg:text-[28px] text-sway-accent tracking-widest uppercase font-bold">
                BERTPIXX
              </span>
            </Link>
            <nav className="flex gap-6 lg:gap-8 text-sm font-grotesk uppercase tracking-wider">
              <Link to="/pricing" className="text-sway-text hover:text-sway-accent transition-colors">
                PAKET HARGA
              </Link>
              <Link
                to="/booking"
                className="px-3 py-1.5 bg-sway-accent text-white rounded font-bold text-xs"
              >
                PEMESANAN
              </Link>
              <Link to="/testimonial" className="text-sway-text hover:text-sway-accent transition-colors">
                TESTIMONI
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-b from-sway-accent/10 to-sway-bg border-b border-sway-border-dim py-10 lg:py-16 px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <span className="font-grotesk text-[11px] text-sway-accent font-extrabold tracking-widest block uppercase mb-4">
            RESERVASI PHOTOBOOTH
          </span>
          <h1 className="font-bebas text-[36px] lg:text-[48px] text-sway-text leading-tight tracking-wide mb-4 font-bold uppercase">
            Pesan Kiosk untuk Acara Anda
          </h1>
          <p className="font-grotesk text-[14px] lg:text-[16px] text-sway-muted max-w-lg mx-auto leading-relaxed">
            Pilih paket, tentukan tanggal dan waktu, lalu kami akan konfirmasi ketersediaan segera.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 lg:px-8 py-12 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12">

          {/* Left: Booking Form */}
          <div className="space-y-6">
            <div className="bg-sway-card border border-sway-border-dim rounded-xl p-6 lg:p-8 shadow-sm">
              <h2 className="font-bebas text-[24px] lg:text-[32px] text-sway-text font-bold tracking-wide uppercase mb-6">
                Formulir Pemesanan
              </h2>

              {errorMessage && (
                <div className="bg-sway-error/10 border border-sway-error/30 text-sway-accent rounded-lg p-4 mb-6 font-grotesk text-[12px]">
                  <AlertCircle className="w-4 h-4 mr-2" /> {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Package Selection */}
                <div>
                  <label className="block font-grotesk text-[12px] font-bold text-sway-text uppercase tracking-wider mb-3">
                    Pilih Paket
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {packages.map((pkg) => {
                      const isSelected = selectedPackage?._id === pkg._id
                      return (
                        <button
                          key={pkg._id}
                          type="button"
                          onClick={() => handleSelectPackage(pkg)}
                          className={`border rounded-lg p-3 text-left transition-all ${
                            isSelected
                              ? 'border-sway-accent bg-sway-accent/10'
                              : 'border-sway-border-dim hover:border-sway-accent/50'
                          }`}
                        >
                          <div className="font-grotesk text-[12px] font-bold text-sway-text uppercase tracking-wider mb-1">
                            {pkg.name}
                          </div>
                          <div className="font-bebas text-[20px] text-sway-accent font-bold">
                            {formatRupiah(pkg.price)}
                          </div>
                          <div className="font-grotesk text-[10px] text-sway-dim mt-1 uppercase tracking-wider">
                            {pkg.photoCount} Foto • {pkg.duration} Menit
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label className="block font-grotesk text-[12px] font-bold text-sway-text uppercase tracking-wider mb-3">
                    Tanggal Acara
                  </label>
                  <input
                    type="date"
                    min={minDate}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full h-11 bg-sway-surface border border-sway-border-dim rounded px-3 font-grotesk text-[13px] text-sway-text focus:outline-none focus:border-sway-accent transition-colors"
                  />
                </div>

                {/* Time */}
                <div>
                  <label className="block font-grotesk text-[12px] font-bold text-sway-text uppercase tracking-wider mb-3">
                    Waktu Acara
                  </label>
                  {!selectedDate ? (
                    <div className="h-11 bg-sway-surface/50 rounded px-3 flex items-center font-grotesk text-[13px] text-sway-dim">
                      Pilih tanggal terlebih dahulu
                    </div>
                  ) : availableTimes.length === 0 ? (
                    <div className="h-11 bg-sway-error/10 rounded px-3 flex items-center font-grotesk text-[12px] text-sway-accent">
                      Tidak ada slot waktu tersedia untuk tanggal ini
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {availableTimes.map((time) => (
                        <button
                          key={time}
                          type="button"
                          onClick={() => handleSelectTime(time)}
                          className={`px-4 py-2 rounded border text-sm font-grotesk font-bold uppercase transition-all ${
                            selectedTime === time
                              ? 'border-sway-accent bg-sway-accent text-white'
                              : 'border-sway-border-dim text-sway-text hover:border-sway-accent/50'
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Customer Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="col-span-full md:col-span-1">
                    <label className="block font-grotesk text-[12px] font-bold text-sway-text uppercase tracking-wider mb-2">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      placeholder="Nama Anda"
                      value={form.customerName}
                      onChange={(e) => handleInputChange('customerName', e.target.value)}
                      className="w-full h-11 bg-sway-surface border border-sway-border-dim rounded px-3 font-grotesk text-[13px] text-sway-text focus:outline-none focus:border-sway-accent transition-colors"
                    />
                  </div>
                  <div className="col-span-full md:col-span-1">
                    <label className="block font-grotesk text-[12px] font-bold text-sway-text uppercase tracking-wider mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="email@contoh.com"
                      value={form.customerEmail}
                      onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                      className="w-full h-11 bg-sway-surface border border-sway-border-dim rounded px-3 font-grotesk text-[13px] text-sway-text focus:outline-none focus:border-sway-accent transition-colors"
                    />
                  </div>
                  <div className="col-span-full md:col-span-1">
                    <label className="block font-grotesk text-[12px] font-bold text-sway-text uppercase tracking-wider mb-2">
                      Nomor Telepon
                    </label>
                    <input
                      type="tel"
                      placeholder="081234567890"
                      value={form.customerPhone}
                      onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                      className="w-full h-11 bg-sway-surface border border-sway-border-dim rounded px-3 font-grotesk text-[13px] text-sway-text focus:outline-none focus:border-sway-accent transition-colors"
                    />
                  </div>
                  <div className="col-span-full">
                    <label className="block font-grotesk text-[12px] font-bold text-sway-text uppercase tracking-wider mb-2">
                      Lokasi Acara
                    </label>
                    <input
                      type="text"
                      placeholder="Alamat lengkap lokasi acara"
                      value={form.eventLocation}
                      onChange={(e) => handleInputChange('eventLocation', e.target.value)}
                      className="w-full h-11 bg-sway-surface border border-sway-border-dim rounded px-3 font-grotesk text-[13px] text-sway-text focus:outline-none focus:border-sway-accent transition-colors"
                    />
                  </div>
                  <div className="col-span-full md:col-span-1">
                    <label className="block font-grotesk text-[12px] font-bold text-sway-text uppercase tracking-wider mb-2">
                      Tipe Acara
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Pernikahan, Ulang Tahun, Korporat"
                      value={form.eventType}
                      onChange={(e) => handleInputChange('eventType', e.target.value)}
                      className="w-full h-11 bg-sway-surface border border-sway-border-dim rounded px-3 font-grotesk text-[13px] text-sway-text focus:outline-none focus:border-sway-accent transition-colors"
                    />
                  </div>
                  <div className="col-span-full md:col-span-1">
                    <label className="block font-grotesk text-[12px] font-bold text-sway-text uppercase tracking-wider mb-2">
                      Tamu (opsional)
                    </label>
                    <input
                      type="number"
                      placeholder="Jumlah tamu"
                      value={form.guestCount}
                      onChange={(e) => handleInputChange('guestCount', e.target.value)}
                      className="w-full h-11 bg-sway-surface border border-sway-border-dim rounded px-3 font-grotesk text-[13px] text-sway-text focus:outline-none focus:border-sway-accent transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-grotesk text-[12px] font-bold text-sway-text uppercase tracking-wider mb-2">
                    Permintaan Khusus (opsional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Contoh: Dekorasi spesial, backdrop custom, dll."
                    value={form.specialRequests}
                    onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                    className="w-full bg-sway-surface border border-sway-border-dim rounded px-3 py-2 font-grotesk text-[13px] text-sway-text focus:outline-none focus:border-sway-accent transition-colors"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || !selectedPackage || !selectedDate || !selectedTime || !isFormValid}
                  variant="accent"
                  className="w-full h-12 font-bold font-grotesk tracking-widest uppercase"
                >
                  {isSubmitting ? 'MEMPROSES...' : 'KIRIM PESANAN'}
                </Button>
              </form>
            </div>
          </div>

          {/* Right: Summary & Info */}
          <div className="space-y-6">
            <div className="bg-sway-card border border-sway-border-dim rounded-xl p-6 lg:p-8 shadow-sm">
              <h2 className="font-bebas text-[24px] lg:text-[32px] text-sway-text font-bold tracking-wide uppercase mb-6">
                Ringkasan Pemesanan
              </h2>

              {!selectedPackage ? (
                <div className="bg-sway-surface/30 rounded-lg p-6 text-center">
                  <div className="w-8 h-8 bg-sway-border-dim rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-[10px]">?</span>
                  </div>
                  <p className="font-grotesk text-[12px] text-sway-dim">Pilih paket terlebih dahulu</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-sway-border-dim/50">
                    <span className="font-grotesk text-[12px] text-sway-dim uppercase tracking-wider">PAKET</span>
                    <span className="font-grotesk text-[13px] font-bold text-sway-text">{selectedPackage.name}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-sway-border-dim/50">
                    <span className="font-grotesk text-[12px] text-sway-dim uppercase tracking-wider">HARGA</span>
                    <span className="font-bebas text-[20px] text-sway-accent font-bold">{formatRupiah(selectedPackage.price)}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-sway-border-dim/50">
                    <span className="font-grotesk text-[12px] text-sway-dim uppercase tracking-wider">TANGGAL</span>
                    <span className="font-grotesk text-[13px] text-sway-text">{selectedDate || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-sway-border-dim/50">
                    <span className="font-grotesk text-[12px] text-sway-dim uppercase tracking-wider">WAKTU</span>
                    <span className="font-grotesk text-[13px] text-sway-text">{selectedTime || '—'}</span>
                  </div>
                  <div className="pt-4">
                    <span className="font-grotesk text-[11px] text-sway-accent font-extrabold tracking-widest uppercase block mb-2">
                      FITUR TERMASUK
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {selectedPackage.photoCount && (
                        <span className="px-2 py-1 bg-sway-surface/50 rounded text-[10px] font-bold text-sway-text uppercase">
                          {selectedPackage.photoCount} Foto
                        </span>
                      )}
                      {selectedPackage.includeGif && (
                        <span className="px-2 py-1 bg-sway-surface/50 rounded text-[10px] font-bold text-sway-text uppercase">
                          GIF Animasi
                        </span>
                      )}
                      {selectedPackage.includeEmail && (
                        <span className="px-2 py-1 bg-sway-surface/50 rounded text-[10px] font-bold text-sway-text uppercase">
                          Kirim Email
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-sway-card border border-sway-border-dim rounded-xl p-6 lg:p-8 shadow-sm">
              <h3 className="font-grotesk text-[12px] font-bold text-sway-accent uppercase tracking-widest mb-4">
                Informasi Penting
              </h3>
              <ul className="space-y-3 font-grotesk text-[12px] text-sway-dim leading-relaxed">
                <li className="flex gap-2">
                  <Clock className="w-4 h-4 shrink-0 text-sway-accent" />
                  <span>Kami akan mengonfirmasi ketersediaan dalam 1x24 jam.</span>
                </li>
                <li className="flex gap-2">
                  <Mail className="w-4 h-4 shrink-0 text-sway-accent" />
                  <span>Konfirmasi akan dikirim ke email Anda.</span>
                </li>
                <li className="flex gap-2">
                  <Phone className="w-4 h-4 shrink-0 text-sway-accent" />
                  <span>Pembayaran dilakukan sebelum acara melalui transfer bank atau QRIS.</span>
                </li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
