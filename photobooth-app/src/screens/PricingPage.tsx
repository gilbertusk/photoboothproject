import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { Button } from '@/components/shared/Button'
import { PricingPackage } from '@/types'
import { Clock, Camera, Image, Gift } from 'lucide-react'

export function PricingPage() {
  const navigate = useNavigate()
  const [packages, setPackages] = useState<PricingPackage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const res = await api.get<{ success: boolean; message: string; data: PricingPackage[] }>(
          '/api/public/packages'
        )
        setPackages(res.data.data)
      } catch (err: any) {
        console.error(err)
        setError(err.response?.data?.message || 'Gagal memuat daftar paket.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPackages()
  }, [])

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-sway-bg text-sway-text">
        <div className="animate-spin w-12 h-12 border-4 border-sway-accent border-t-transparent rounded-full mb-4" />
        <p className="font-grotesk text-[12px] text-sway-dim uppercase tracking-widest">Memuat paket...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-sway-bg text-sway-text text-center px-6">
        <div className="w-16 h-16 bg-sway-error/10 rounded-full flex items-center justify-center mb-4">
          <span className="text-sway-accent text-2xl">⚠</span>
        </div>
        <h2 className="font-bebas text-[28px] text-sway-text mb-2">GAGAL MEMUAT PAKET</h2>
        <p className="font-grotesk text-[12px] text-sway-dim mb-6 max-w-sm">{error}</p>
        <Button
          onClick={() => window.location.reload()}
          variant="accent"
          className="h-11 font-bold font-grotesk tracking-widest uppercase"
        >
          COBA LAGI
        </Button>
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
              <Link
                to="/pricing"
                className="px-3 py-1.5 bg-sway-accent text-white rounded font-bold text-xs"
              >
                PAKET HARGA
              </Link>
              <Link to="/booking" className="text-sway-text hover:text-sway-accent transition-colors">
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
      <div className="bg-gradient-to-b from-sway-accent/10 to-sway-bg border-b border-sway-border-dim py-12 lg:py-20 px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <span className="font-grotesk text-[11px] text-sway-accent font-extrabold tracking-widest block uppercase mb-4">
            PILIH PAKET YANG TEPAT UNTUK ACARA ANDA
          </span>
          <h1 className="font-bebas text-[40px] lg:text-[56px] text-sway-text leading-tight tracking-wide mb-6 font-bold uppercase">
            Kami Mengabadikan Momen Berharga Anda
          </h1>
          <p className="font-grotesk text-[14px] lg:text-[16px] text-sway-muted max-w-lg mx-auto leading-relaxed">
            Dari acara intimate hingga pesta besar, kami memiliki paket photobooth yang sesuai dengan kebutuhan dan anggaran Anda.
          </p>
        </div>
      </div>

      {/* Pricing Cards */}
      <section className="py-12 lg:py-20 px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row justify-between items-end mb-10 lg:mb-16 gap-4">
            <div>
              <h2 className="font-bebas text-[32px] lg:text-[40px] text-sway-text font-bold tracking-wide uppercase mb-2">
                Paket Kami
              </h2>
              <p className="font-grotesk text-[12px] text-sway-dim">Semua paket mencetak strip foto fisik dan digital.</p>
            </div>
            <p className="font-grotesk text-[11px] text-sway-accent font-bold uppercase tracking-widest">
              Harga dalam Rupiah (IDR)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <div
                key={pkg._id}
                className={cn(
                  'bg-sway-card border rounded-xl p-6 lg:p-8 relative overflow-hidden transition-all hover:border-sway-accent/50',
                  pkg.price === Math.max(...packages.map((p) => p.price))
                    ? 'border-sway-accent shadow-[0_0_30px_rgba(255,107,90,0.15)]'
                    : 'border-sway-border-dim'
                )}
              >
                {pkg.price === Math.max(...packages.map((p) => p.price)) && (
                  <div className="absolute top-0 right-0 bg-sway-accent text-white px-3 py-1 rounded-bl-lg font-grotesk text-[10px] font-bold uppercase tracking-widest">
                    POPULER
                  </div>
                )}
                <div className="mb-4">
                  <span className="font-grotesk text-[10px] text-sway-accent font-extrabold tracking-widest uppercase block mb-1">
                    {pkg.name}
                  </span>
                  <span className="font-bebas text-[32px] lg:text-[40px] text-sway-text font-bold">
                    {formatRupiah(pkg.price)}
                  </span>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-2">
                    <Camera className="w-4 h-4 text-sway-accent shrink-0 mt-0.5" />
                    <span className="font-grotesk text-[12px] text-sway-text">
                      {pkg.photoCount} Foto Strip
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-sway-accent shrink-0 mt-0.5" />
                    <span className="font-grotesk text-[12px] text-sway-text">
                      {Math.round(pkg.duration / 60)} Menit Layanan
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="font-grotesk text-[12px] text-sway-text">
                      {pkg.printCount} Cetakan Fisik
                    </span>
                  </div>
                  {pkg.includeGif && (
                    <div className="flex items-start gap-2">
                      <Image className="w-4 h-4 text-sway-accent shrink-0 mt-0.5" />
                      <span className="font-grotesk text-[12px] text-sway-text">
                        GIF Animasi
                      </span>
                    </div>
                  )}
                  {pkg.includeEmail && (
                    <div className="flex items-start gap-2">
                      <Gift className="w-4 h-4 text-sway-accent shrink-0 mt-0.5" />
                      <span className="font-grotesk text-[12px] text-sway-text">
                        Kirim via Email
                      </span>
                    </div>
                  )}
                </div>
                <Button
                  onClick={() => navigate(`/booking?package=${pkg._id}`)}
                  variant="accent"
                  className="w-full h-11 font-bold font-grotesk tracking-widest uppercase"
                >
                  PESAN SEKARANG
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 lg:py-20 bg-sway-surface/30 px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-bebas text-[32px] lg:text-[40px] text-sway-text font-bold tracking-wide uppercase mb-10 text-center">
            Pertanyaan Umum
          </h2>
          <div className="space-y-4">
            {[
              {
                q: 'Apakah ada biaya tambahan untuk transportasi?',
                a: 'Biaya transportasi dihitung berdasarkan jarak lokasi acara dari base kami. Akan diterangkan sebelum konfirmasi pemesanan.',
              },
              {
                q: 'Bisakah saya mengganti paket setelah pemesanan?',
                a: 'Ya, Anda dapat mengubah paket paling lambat 3 hari sebelum acara, dengan menyesuaikan selisih harga.',
              },
              {
                q: 'Kapan foto digital akan tersedia?',
                a: 'Foto digital dapat diakses segera melalui galeri online setelah sesi selesai dan dikirim ke email Anda.',
              },
              {
                q: 'Apakah ada opsi cetak ulang?',
                a: 'Ya, cetak ulang dapat dilakukan melalui galeri digital atau langsung di lokasi acara.',
              },
            ].map((faq, idx) => (
              <div key={idx} className="bg-sway-card border border-sway-border-dim rounded-lg p-5">
                <button
                  className="w-full flex justify-between items-center text-left"
                  onClick={() => {}}
                >
                  <span className="font-grotesk text-[13px] font-bold text-sway-text">{faq.q}</span>
                  <span className="text-sway-accent">+</span>
                </button>
                <p className="font-grotesk text-[12px] text-sway-dim mt-3 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 lg:px-8">
        <div className="max-w-2xl mx-auto bg-sway-accent rounded-2xl p-8 lg:p-12 text-center shadow-[0_0_40px_rgba(255,107,90,0.3)]">
          <h2 className="font-bebas text-[32px] lg:text-[40px] text-white font-bold tracking-wide mb-4 uppercase">
            Siap Memesan?
          </h2>
          <p className="font-grotesk text-[14px] text-sway-dim/90 mb-8">
            Pilih paket dan pilih tanggal acara Anda. Kami akan segera mengonfirmasi ketersediaan.
          </p>
          <Link to="/booking" className="inline-block bg-white text-sway-accent px-8 py-3 rounded font-bebas font-bold text-lg tracking-widest uppercase hover:bg-sway-surface transition-colors">
            PESAN PAKET ANDA
          </Link>
        </div>
      </section>
    </div>
  )
}

function cn(...classes: (string | undefined | null | boolean)[]) {
  return classes.filter(Boolean).join(' ')
}
