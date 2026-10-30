import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { Button } from '@/components/shared/Button'
import { User, Heart } from 'lucide-react'

interface GuestbookMedia {
  id: string
  shareToken: string
  url: string
  type: string
  createdAt: string
  sessionId: {
    _id: string
    status: string
    finishedAt?: string
    totalPrice?: number
  }
}

interface GuestbookResponse {
  success: boolean
  message: string
  data: {
    media: GuestbookMedia[]
    pagination: { page: number; limit: number; total: number; totalPages: number }
  }
}

export function GuestBookScreen() {
  const [media, setMedia] = useState<GuestbookMedia[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    const fetchGuestbook = async () => {
      try {
        const res = await api.get<GuestbookResponse>(
          `/api/guestbook?page=${page}&limit=12`
        )
        setMedia(res.data.data.media)
        setTotalPages(res.data.data.pagination.totalPages)
      } catch (err: any) {
        console.error(err)
        setError(err.response?.data?.message || 'Gagal memuat buku tamu.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchGuestbook()
  }, [page])

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-sway-bg text-sway-text">
        <div className="animate-spin w-12 h-12 border-4 border-sway-accent border-t-transparent rounded-full mb-4" />
        <p className="font-grotesk text-[12px] text-sway-dim uppercase tracking-widest">Memuat buku tamu...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-sway-bg text-sway-text text-center px-6">
        <div className="w-16 h-16 bg-sway-error/10 rounded-full flex items-center justify-center mb-4">
          <span className="text-sway-accent text-2xl">⚠</span>
        </div>
        <h2 className="font-bebas text-[28px] text-sway-text mb-2">GAGAL MEMUAT BUKU TAMU</h2>
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

  if (media.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-sway-bg text-sway-text px-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-sway-surface/50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-8 h-8 text-sway-dim" />
          </div>
          <h2 className="font-bebas text-[28px] text-sway-text mb-4 uppercase">Belum Ada Foto di Buku Tamu</h2>
          <p className="font-grotesk text-[14px] text-sway-dim mb-8">
            Belum ada foto yang ditambahkan ke buku tamu. Foto akan muncul di sini setelah sesi photobooth selesai.
          </p>
          <Link to="/booking" className="inline-flex items-center h-11 px-6 rounded bg-sway-accent text-white font-bold font-grotesk tracking-widest uppercase">PESAN PAKET ANDA</Link>
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
              <Link to="/booking" className="text-sway-text hover:text-sway-accent transition-colors">
                PEMESANAN
              </Link>
              <Link
                to="/testimonial"
                className="text-sway-text hover:text-sway-accent transition-colors"
              >
                TESTIMONI
              </Link>
              <Link
                to="/guestbook"
                className="px-3 py-1.5 bg-sway-accent text-white rounded font-bold text-xs"
              >
                BUKU TAMU
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-b from-sway-accent/10 to-sway-bg border-b border-sway-border-dim py-12 lg:py-20 px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <span className="font-grotesk text-[11px] text-sway-accent font-extrabold tracking-widest block uppercase mb-4">
            BUKU TAMU DIGITAL
          </span>
          <h1 className="font-bebas text-[40px] lg:text-[56px] text-sway-text leading-tight tracking-wide mb-6 font-bold uppercase">
            Kenangan Bahagia dari Setiap Acara
          </h1>
          <p className="font-grotesk text-[14px] lg:text-[16px] text-sway-muted max-w-lg mx-auto leading-relaxed">
            Lihat hasil foto photobooth dari acara-acara yang telah kami awetkan. Setiap momen berharga disimpan di sini.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="py-8 px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap gap-6 justify-center">
            <div className="text-center">
              <span className="font-bebas text-[32px] text-sway-accent font-bold">{media.length}</span>
              <p className="font-grotesk text-[11px] text-sway-dim uppercase tracking-widest">FOTO DI BUKU TAMU</p>
            </div>
            <div className="text-center">
              <span className="font-bebas text-[32px] text-sway-accent font-bold">bertpixx</span>
              <p className="font-grotesk text-[11px] text-sway-dim uppercase tracking-widest">PHOTOBOOTH</p>
            </div>
          </div>
        </div>
      </div>

      {/* Photo Grid */}
      <section className="py-12 lg:py-20 px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row justify-between items-end mb-10 lg:mb-16 gap-4">
            <div>
              <h2 className="font-bebas text-[32px] lg:text-[40px] text-sway-text font-bold tracking-wide uppercase mb-2">
                Koleksi Foto
              </h2>
              <p className="font-grotesk text-[12px] text-sway-dim">
                Klik foto untuk melihat detail lengkap dan berbagi ke media sosial.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                variant="ghost"
                className="h-11 font-bold font-grotesk tracking-widest uppercase"
              >
                <span>← Sebelumnya</span>
              </Button>
              <Button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                variant="ghost"
                className="h-11 font-bold font-grotesk tracking-widest uppercase"
              >
                <span>Selanjutnya →</span>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {media.map((item) => (
              <div key={item.id} className="group">
                <Link
                  to={`/gallery/${item.shareToken}`}
                  className="block"
                >
                  <div className="aspect-[2/3] bg-sway-surface border border-sway-border-dim rounded-lg overflow-hidden group-hover:border-sway-accent transition-colors mb-3">
                    <img
                      src={item.url}
                      alt="Guestbook photo"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <User className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </Link>
                <div className="flex justify-between items-start">
                  <span className="font-grotesk text-[11px] text-sway-dim">
                    {formatDate(item.sessionId.finishedAt)}
                  </span>
                  <Heart className="w-4 h-4 text-sway-accent/50 group-hover:text-sway-accent transition-colors" />
                </div>
              </div>
            ))}
          </div>

          {/* Pagination info */}
          <div className="mt-8 text-center">
            <p className="font-grotesk text-[11px] text-sway-dim uppercase tracking-widest">
              Halaman {page} dari {totalPages}
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
