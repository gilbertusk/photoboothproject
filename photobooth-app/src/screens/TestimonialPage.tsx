import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { Button } from '@/components/shared/Button'
import { Testimonial } from '@/types'
import { Star, Quote, User } from 'lucide-react'

export function TestimonialPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const res = await api.get<{ success: boolean; message: string; data: Testimonial[] }>(
          '/api/testimonials'
        )
        setTestimonials(res.data.data)
      } catch (err: any) {
        console.error(err)
        setError(err.response?.data?.message || 'Gagal memuat testimoni.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchTestimonials()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-sway-bg text-sway-text">
        <div className="animate-spin w-12 h-12 border-4 border-sway-accent border-t-transparent rounded-full mb-4" />
        <p className="font-grotesk text-[12px] text-sway-dim uppercase tracking-widest">Memuat testimoni...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-sway-bg text-sway-text text-center px-6">
        <div className="w-16 h-16 bg-sway-error/10 rounded-full flex items-center justify-center mb-4">
          <span className="text-sway-accent text-2xl">⚠</span>
        </div>
        <h2 className="font-bebas text-[28px] text-sway-text mb-2">GAGAL MEMUAT TESTIMONI</h2>
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

  if (testimonials.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-sway-bg text-sway-text px-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-sway-surface/50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Quote className="w-8 h-8 text-sway-dim" />
          </div>
          <h2 className="font-bebas text-[28px] text-sway-text mb-4">Belum Ada Testimoni</h2>
          <p className="font-grotesk text-[14px] text-sway-dim mb-8">
            Belum ada pelanggan yang memberikan testimoni. Jadilah yang pertama!
          </p>
          <Link to="/booking" className="inline-flex items-center h-11 px-6 rounded bg-sway-accent text-white font-bold font-grotesk tracking-widest uppercase">PESAN PAKET ANDA</Link>
        </div>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
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
              <Link to="/booking" className="text-sway-text hover:text-sway-accent transition-colors">
                PEMESANAN
              </Link>
              <Link
                to="/testimonial"
                className="px-3 py-1.5 bg-sway-accent text-white rounded font-bold text-xs"
              >
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
            APA KATA PELANGGAN KAMI
          </span>
          <h1 className="font-bebas text-[40px] lg:text-[56px] text-sway-text leading-tight tracking-wide mb-6 font-bold uppercase">
            Cerita Bahagia dari Acara Mereka
          </h1>
          <p className="font-grotesk text-[14px] lg:text-[16px] text-sway-muted max-w-lg mx-auto leading-relaxed">
            Baca pengalaman pelanggan kami yang telah menggunakan layanan photobooth bertpixx untuk acara mereka.
          </p>
        </div>
      </div>

      {/* Stats */}
      {testimonials.length > 0 && (
        <div className="py-8 px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-wrap gap-6 justify-center">
              <div className="text-center">
                <span className="font-bebas text-[32px] text-sway-accent font-bold">{testimonials.length}</span>
                <p className="font-grotesk text-[11px] text-sway-dim uppercase tracking-widest">TESTIMONI</p>
              </div>
              <div className="text-center">
                <span className="font-bebas text-[32px] text-sway-accent font-bold">
                  {(testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length).toFixed(1)}
                </span>
                <p className="font-grotesk text-[11px] text-sway-dim uppercase tracking-widest">RATING RATA-RATA</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Testimonial Cards */}
      <section className="py-12 lg:py-20 px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t._id} className="bg-sway-card border border-sway-border-dim rounded-xl p-6 lg:p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  {t.imageUrl ? (
                    <img
                      src={t.imageUrl}
                      alt={t.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-sway-surface flex items-center justify-center">
                      <User className="w-5 h-5 text-sway-dim" />
                    </div>
                  )}
                  <div>
                    <span className="font-grotesk text-[13px] font-bold text-sway-text">{t.name}</span>
                    {t.role && (
                      <span className="font-grotesk text-[11px] text-sway-dim block">{t.role}</span>
                    )}
                    {t.eventType && (
                      <span className="font-grotesk text-[10px] text-sway-accent font-bold uppercase tracking-wider block mt-0.5">
                        {t.eventType}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-end gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${star <= t.rating ? 'text-sway-accent fill-sway-accent' : 'text-sway-dim'}`}
                    />
                  ))}
                  <span className="ml-1 font-grotesk text-[11px] text-sway-dim">{t.rating}/5</span>
                </div>
                <blockquote className="font-grotesk text-[13px] lg:text-[14px] text-sway-text leading-relaxed mb-6 italic">
                  "{t.message}"
                </blockquote>
                <div className="flex items-center gap-2 text-xs font-grotesk text-sway-dim">
                  <span>{formatDate(t.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 lg:px-8">
        <div className="max-w-2xl mx-auto bg-sway-accent rounded-2xl p-8 lg:p-12 text-center shadow-[0_0_40px_rgba(255,107,90,0.3)]">
          <h2 className="font-bebas text-[32px] lg:text-[40px] text-white font-bold tracking-wide mb-4 uppercase">
            Buat Momen Anda Tertangani
          </h2>
          <p className="font-grotesk text-[14px] text-sway-dim/90 mb-8">
            Pesan kiosk photobooth untuk acara Anda dan dapatkan kenangan yang abadi.
          </p>
          <Link to="/booking" className="inline-block bg-white text-sway-accent px-8 py-3 rounded font-bebas font-bold text-lg tracking-widest uppercase hover:bg-sway-surface transition-colors">
            PESAN SEKARANG
          </Link>
        </div>
      </section>
    </div>
  )
}
