import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { Button } from '@/components/shared/Button'
import { Download, Copy, AlertTriangle, Check, Smartphone, Camera } from 'lucide-react'

interface GalleryMedia {
  id: string
  type: 'PHOTO' | 'STRIP' | 'GIF'
  url: string
  shareToken: string
  createdAt: string
}

interface GalleryResponse {
  success: boolean
  message: string
  data: {
    id: string
    shareToken: string
    url: string
    type: string
    sessionId: string
    createdAt: string
  }
}

export function GalleryScreen() {
  const { shareToken } = useParams<{ shareToken: string }>()
  const navigate = useNavigate()
  const [media, setMedia] = useState<GalleryResponse['data'] | null>(null)
  const [sessionMedia, setSessionMedia] = useState<GalleryMedia[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const galleryUrl = shareToken ? `${window.location.origin}/gallery/${shareToken}` : ''

  useEffect(() => {
    if (!shareToken) {
      setError('Token galeri tidak valid.')
      setIsLoading(false)
      return
    }

    const loadGallery = async () => {
      try {
        // 1. Fetch media by share token (primary media, usually the strip)
        const res = await api.get<GalleryResponse>(`/api/public/gallery/${shareToken}`)
        setMedia(res.data.data)

        // 2. Fetch all media for the session (to show individual photos)
        const sessionId = res.data.data.sessionId
        const sessionRes = await api.get<{
          success: boolean
          message: string
          data: { session: any; media: GalleryMedia[]; total: number }
        }>(`/api/public/sessions/${sessionId}/media`)
        setSessionMedia(sessionRes.data.data.media)
      } catch (err: any) {
        console.error(err)
        setError(err.response?.data?.message || 'Gagal memuat galeri. Silakan coba lagi.')
      } finally {
        setIsLoading(false)
      }
    }

    loadGallery()
  }, [shareToken])

  const handleDownload = (url: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = 'bertpixx-photostrip.jpg'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleCopyLink = async () => {
    if (!galleryUrl) return
    try {
      await navigator.clipboard.writeText(galleryUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleShareWhatsApp = () => {
    if (!galleryUrl) return
    const text = `Lihat hasil foto photobooth saya dari bertpixx: ${galleryUrl}`
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(waUrl, '_blank')
  }

  const handleShareInstagram = () => {
    if (!galleryUrl) return
    const instagramUrl = `https://www.instagram.com/stories/?share_url=${encodeURIComponent(galleryUrl)}`
    window.open(instagramUrl, '_blank')
  }

  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-sway-bg text-sway-text">
        <div className="animate-spin w-12 h-12 border-4 border-sway-accent border-t-transparent rounded-full mb-4" />
        <p className="font-grotesk text-[12px] text-sway-dim uppercase tracking-widest">Memuat galeri...</p>
      </div>
    )
  }

  if (error || !media) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-sway-bg text-sway-text text-center px-6">
        <AlertTriangle className="w-16 h-16 text-sway-accent mb-4" />
        <h2 className="font-bebas text-[28px] text-sway-text mb-2">GALERI TIDAK DITEMUKAN</h2>
        <p className="font-grotesk text-[12px] text-sway-dim mb-6">{error || 'Token galeri tidak valid atau telah kadaluarsa.'}</p>
        <Button
          onClick={() => navigate('/')}
          variant="accent"
          className="h-11 font-bold font-grotesk tracking-widest uppercase"
        >
          KEMBALI KE BERANDA
        </Button>
      </div>
    )
  }

  const stripMedia = sessionMedia.find((m) => m.type === 'STRIP')
  const photoMedia = sessionMedia.filter((m) => m.type === 'PHOTO')
  const gifMedia = sessionMedia.find((m) => m.type === 'GIF')

  return (
    <div className="h-screen w-full flex flex-col bg-sway-bg text-sway-text select-none overflow-hidden">
      {/* Header */}
      <div className="bg-sway-card border-b border-sway-border-dim p-6 lg:p-8 z-10">
        <div className="max-w-5xl mx-auto">
          <Link to="/" className="inline-block mb-6">
            <span className="font-bebas text-[24px] lg:text-[32px] text-sway-accent tracking-widest uppercase font-bold">
              BERTPIXX
            </span>
          </Link>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <span className="font-grotesk text-[10px] text-sway-accent font-extrabold tracking-widest block uppercase">
                GALERI DIGITAL
              </span>
              <h1 className="font-bebas text-[32px] lg:text-[40px] text-sway-text leading-tight tracking-wide mt-1 font-bold uppercase">
                HASIL FOTO ANDA
              </h1>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleCopyLink}
                variant="ghost"
                className="h-10 font-bold font-grotesk tracking-widest uppercase"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" /> DISALIN
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> SALIN TAUTAN
                  </>
                )}
              </Button>
              <Button
                onClick={handleShareWhatsApp}
                variant="ghost"
                className="h-10 font-bold font-grotesk tracking-widest uppercase"
              >
                <Smartphone className="w-4 h-4" /> SHARE WA
              </Button>
              <Button
                onClick={handleShareInstagram}
                variant="ghost"
                className="h-10 font-bold font-grotesk tracking-widest uppercase"
              >
                <Camera className="w-4 h-4" /> INSTAGRAM
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Content */}
      <div className="flex-grow overflow-y-auto p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          {/* Main Strip */}
          {stripMedia && (
            <div className="mb-8">
              <div className="bg-sway-card border border-sway-border-dim rounded-xl shadow-xl p-4 lg:p-6 mb-4">
                <img
                  src={stripMedia.url}
                  alt="Photobooth Strip"
                  className="w-full h-auto rounded-lg object-contain shadow-inner"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => handleDownload(stripMedia.url)}
                  variant="accent"
                  className="flex-1 h-12 font-bold font-grotesk tracking-widest uppercase"
                >
                  <Download className="w-4 h-4" /> UNDUH STRIP
                </Button>
                {gifMedia && (
                  <Button
                    onClick={() => handleDownload(gifMedia.url)}
                    variant="ghost"
                    className="flex-1 h-12 font-bold font-grotesk tracking-widest uppercase"
                  >
                    <Download className="w-4 h-4" /> UNDUH GIF
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Individual Photos */}
          {photoMedia.length > 0 && (
            <div>
              <h2 className="font-grotesk text-[11px] text-sway-accent font-extrabold tracking-widest block uppercase mb-4">
                FOTO INDIVIDUAL
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {photoMedia.map((photo) => (
                  <div key={photo.id} className="group">
                    <div className="aspect-square bg-sway-surface border border-sway-border-dim rounded-lg overflow-hidden">
                      <img
                        src={photo.url}
                        alt={`Foto ${photoMedia.indexOf(photo) + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                    <Button
                      onClick={() => handleDownload(photo.url)}
                      variant="ghost"
                      size="sm"
                      className="w-full mt-2 h-8 text-[10px] font-bold font-grotesk uppercase"
                    >
                      Unduh
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gallery Info */}
          <div className="mt-12 pt-8 border-t border-sway-border-dim bg-sway-surface/30 rounded-xl p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <p className="font-grotesk text-[11px] text-sway-dim uppercase tracking-widest font-bold">
                  Dibuat oleh bertpixx Photobooth
                </p>
                <p className="font-grotesk text-[11px] text-sway-muted mt-1 break-all">
                  {galleryUrl}
                </p>
              </div>
              <div className="flex gap-3 pt-4 lg:pt-0">
                <Button
                  onClick={handleShareWhatsApp}
                  variant="ghost"
                  className="flex-1 h-11 font-bold font-grotesk tracking-widest uppercase"
                >
                  <Smartphone className="w-4 h-4" /> Bagikan ke WhatsApp
                </Button>
                <Button
                  onClick={handleShareInstagram}
                  variant="ghost"
                  className="flex-1 h-11 font-bold font-grotesk tracking-widest uppercase"
                >
                  <Camera className="w-4 h-4" /> Bagikan ke Instagram
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
