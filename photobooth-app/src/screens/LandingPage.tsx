import { Link, Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, ArrowUpRight, Check, MapPin, Star } from 'lucide-react'
import { api } from '@/lib/api'
import { getKioskToken } from '@/lib/kiosk'
import { cn, formatRupiah } from '@/lib/utils'
import { PhotoStrip } from '@/components/shared/PhotoStrip'
import { STRIP_TONES } from '@/components/shared/stripTones'
import type { PricingPackage, Testimonial } from '@/types'

interface PublicBranch {
  name: string
  address?: string
}

// Placeholder contact details: replace with the real ones.
const CONTACT = {
  email: 'halo@bertpixx.com',
  instagram: 'bertpixx',
  whatsapp: '6281234567890',
}

const NAV = [
  { href: '#cara-kerja', label: 'Cara kerja' },
  { href: '#paket', label: 'Paket' },
  { href: '#lokasi', label: 'Lokasi' },
  { href: '#faq', label: 'FAQ' },
]

const STEPS = [
  { n: '01', title: 'Pilih paket', body: 'Tentukan jumlah pose dan bonus yang kamu mau langsung di layar booth.' },
  { n: '02', title: 'Bayar', body: 'Scan QRIS dari e-wallet atau m-banking apa pun, atau pakai kode voucher.' },
  { n: '03', title: 'Pose', body: 'Pilih frame, lalu ikuti hitungan mundur. Hasil kurang pas? Ulangi fotonya.' },
  { n: '04', title: 'Cetak & bawa pulang', body: 'Strip dicetak di tempat. Versi digital tinggal diunduh lewat QR code.' },
]

const FAQ = [
  {
    q: 'Bayarnya pakai apa?',
    a: 'QRIS, jadi bisa dari GoPay, OVO, DANA, ShopeePay atau aplikasi bank. Kode voucher juga bisa dipakai di layar pembayaran.',
  },
  {
    q: 'Berapa lama satu sesi?',
    a: 'Tergantung paket, sekitar 3 sampai 6 menit dari mulai foto sampai strip tercetak.',
  },
  {
    q: 'Bagaimana cara dapat file digitalnya?',
    a: 'Setelah sesi selesai, layar menampilkan QR code. Scan untuk membuka galeri dan unduh foto, strip dan GIF (jika termasuk paket).',
  },
  {
    q: 'Bisa sewa booth untuk acara?',
    a: 'Bisa. Isi form booking dengan tanggal, lokasi dan jenis acara, nanti tim kami menghubungi kamu untuk konfirmasi.',
  },
]

function usePublic<T>(key: string, url: string) {
  return useQuery<T>({
    queryKey: ['landing', key],
    staleTime: 5 * 60_000,
    queryFn: async () => (await api.get(url)).data.data as T,
  })
}

function SectionHeading({ eyebrow, title, className }: { eyebrow: string; title: string; className?: string }) {
  return (
    <div className={className}>
      <p className="font-grotesk text-[12px] font-bold uppercase tracking-[0.25em] text-sway-accent">{eyebrow}</p>
      <h2 className="mt-3 font-bebas text-[52px] sm:text-[64px] leading-[0.9] tracking-[0.01em]">{title}</h2>
    </div>
  )
}

function packageFeatures(pkg: PricingPackage): string[] {
  return [
    `${pkg.photoCount} pose foto`,
    `${pkg.printCount} cetak strip`,
    `Sesi ${Math.round(pkg.duration / 60)} menit`,
    'Unduh digital via QR',
    ...(pkg.includeGif ? ['GIF animasi'] : []),
    ...(pkg.includeEmail ? ['Kirim ke email'] : []),
  ]
}

export function LandingPage() {
  const packages = usePublic<PricingPackage[]>('packages', '/api/public/packages')
  const branches = usePublic<PublicBranch[]>('branches', '/api/public/branches')
  const testimonials = usePublic<Testimonial[]>('testimonials', '/api/testimonials')

  // A registered kiosk device opening the root URL goes straight to the booth.
  if (getKioskToken()) return <Navigate to="/kiosk" replace />

  const pkgList = packages.data ?? []
  const minPrice = pkgList.length ? Math.min(...pkgList.map((p) => p.price)) : null
  const featured = (testimonials.data ?? []).slice(0, 3)
  const year = new Date().getFullYear()

  return (
    <div className="font-grotesk">
      {/* NAV */}
      <header className="sticky top-0 z-30 border-b border-sway-border/70 bg-sway-bg/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
          <a href="#top" className="font-bebas text-[28px] leading-none tracking-[0.08em]">BERTPIXX</a>
          <nav className="hidden md:flex items-center gap-8 text-[14px] font-medium text-sway-muted">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="transition-colors hover:text-sway-text">{n.label}</a>
            ))}
          </nav>
          <Link
            to="/booking"
            className="flex h-10 items-center gap-1.5 rounded-full bg-sway-text px-5 text-[13px] font-bold text-white transition-colors hover:bg-zinc-700"
          >
            Booking event
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section id="top" className="relative overflow-hidden border-b border-sway-border">
        <div className="mx-auto grid max-w-[1200px] items-center gap-14 px-6 py-20 lg:grid-cols-[1.05fr_1fr] lg:py-28">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-sway-border bg-white px-3 py-1 text-[12px] font-medium text-sway-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-sway-accent" />
              Photobooth self-service
            </p>
            <h1 className="mt-6 font-bebas text-[76px] sm:text-[104px] xl:text-[128px] leading-[0.85] tracking-[0.005em]">
              Empat pose,<br />satu strip,<br /><span className="text-sway-accent">bawa pulang.</span>
            </h1>
            <p className="mt-7 max-w-[460px] text-[17px] leading-relaxed text-sway-muted">
              Masuk booth, bayar pakai QRIS, bergaya di depan kamera. Strip foto langsung tercetak dan file digitalnya
              bisa diunduh lewat QR.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a
                href="#paket"
                className="group flex h-14 items-center gap-3 rounded-full bg-sway-accent pl-7 pr-2 text-[15px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(229,72,58,0.7)] transition-transform active:scale-[0.97]"
              >
                Lihat paket
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 transition-transform group-hover:translate-x-0.5">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </a>
              <a href="#lokasi" className="flex h-14 items-center rounded-full border border-sway-border bg-white px-7 text-[15px] font-bold transition-colors hover:border-sway-text">
                Cari booth terdekat
              </a>
            </div>
          </div>

          <div className="relative mx-auto flex h-[440px] w-full max-w-[460px] items-center justify-center sm:h-[520px]">
            <PhotoStrip tones={STRIP_TONES[1]} className="absolute -translate-x-[120px] translate-y-6 -rotate-[11deg]" />
            <PhotoStrip tones={STRIP_TONES[2]} className="absolute translate-x-[120px] translate-y-10 rotate-[9deg]" />
            <PhotoStrip tones={STRIP_TONES[0]} className="relative z-10 -rotate-[1.5deg] scale-110 animate-slideUp" />
          </div>
        </div>

        {/* Facts from live data */}
        <div className="border-t border-sway-border bg-white">
          <dl className="mx-auto grid max-w-[1200px] grid-cols-2 divide-sway-border px-6 md:grid-cols-4 md:divide-x">
            {[
              { k: 'Mulai dari', v: minPrice !== null ? formatRupiah(minPrice) : '-' },
              { k: 'Pilihan paket', v: pkgList.length ? `${pkgList.length} paket` : '-' },
              { k: 'Pembayaran', v: 'QRIS & voucher' },
              { k: 'Hasil', v: 'Cetak + digital' },
            ].map((f) => (
              <div key={f.k} className="py-6 md:px-8 first:md:pl-0">
                <dt className="text-[12px] font-medium uppercase tracking-[0.15em] text-sway-dim">{f.k}</dt>
                <dd className="mt-1 font-bebas text-[32px] leading-none tracking-[0.02em]">{f.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="cara-kerja" className="scroll-mt-16 border-b border-sway-border">
        <div className="mx-auto max-w-[1200px] px-6 py-24">
          <SectionHeading eyebrow="Cara kerja" title="Dari antre sampai pulang, sekitar lima menit." className="max-w-[720px]" />
          <ol className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-sway-border bg-sway-border sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <li key={s.n} className="flex flex-col bg-white p-7">
                <span className="font-bebas text-[56px] leading-none text-sway-accent">{s.n}</span>
                <h3 className="mt-8 text-[18px] font-bold">{s.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-sway-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* PACKAGES */}
      <section id="paket" className="scroll-mt-16 border-b border-sway-border bg-sway-surface">
        <div className="mx-auto max-w-[1200px] px-6 py-24">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading eyebrow="Paket" title="Pilih sesuai gayamu." />
            <p className="max-w-[340px] text-[14px] leading-relaxed text-sway-muted">
              Harga per sesi, berlaku di semua cabang. Satu sesi bisa ramai-ramai, selama muat di frame.
            </p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {packages.isLoading &&
              [0, 1, 2].map((i) => <div key={i} className="h-[420px] animate-pulse rounded-2xl bg-white" />)}
            {packages.isError && (
              <p className="text-[14px] text-sway-muted md:col-span-3">Paket belum bisa dimuat. Coba muat ulang halaman.</p>
            )}
            {pkgList.map((pkg, i) => {
              const dark = pkgList.length === 3 && i === 1
              return (
                <article
                  key={pkg._id}
                  className={cn(
                    'flex flex-col rounded-2xl p-8',
                    dark ? 'bg-sway-text text-white' : 'border border-sway-border bg-white'
                  )}
                >
                  <h3 className="font-bebas text-[30px] leading-none tracking-[0.06em]">{pkg.name}</h3>
                  <p className={cn('mt-1 text-[13px]', dark ? 'text-zinc-400' : 'text-sway-dim')}>
                    {pkg.photoCount} pose · {Math.round(pkg.duration / 60)} menit
                  </p>
                  <p className="mt-8 font-bebas text-[60px] leading-none tracking-[0.01em]">{formatRupiah(pkg.price)}</p>
                  <ul className={cn('mt-8 space-y-3 border-t pt-8 text-[14px]', dark ? 'border-zinc-700' : 'border-sway-border')}>
                    {packageFeatures(pkg).map((f) => (
                      <li key={f} className="flex items-center gap-3">
                        <Check className="h-4 w-4 shrink-0 text-sway-accent" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      {/* LOCATIONS */}
      <section id="lokasi" className="scroll-mt-16 border-b border-sway-border">
        <div className="mx-auto max-w-[1200px] px-6 py-24">
          <SectionHeading eyebrow="Lokasi" title="Temukan booth bertpixx." />
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {branches.isLoading &&
              [0, 1, 2].map((i) => <div key={i} className="h-[150px] animate-pulse rounded-2xl bg-sway-surface" />)}
            {!branches.isLoading && (branches.data ?? []).length === 0 && (
              <p className="text-[14px] text-sway-muted sm:col-span-3">Daftar lokasi segera diumumkan.</p>
            )}
            {(branches.data ?? []).map((b) => {
              const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                [b.name, b.address].filter(Boolean).join(', ')
              )}`
              return (
                <a
                  key={b.name}
                  href={maps}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex flex-col justify-between rounded-2xl border border-sway-border bg-white p-7 transition-colors hover:border-sway-text"
                >
                  <div className="flex items-start justify-between gap-4">
                    <MapPin className="h-5 w-5 text-sway-accent" />
                    <ArrowUpRight className="h-5 w-5 text-sway-ghost transition-colors group-hover:text-sway-text" />
                  </div>
                  <div className="mt-10">
                    <h3 className="text-[18px] font-bold">{b.name}</h3>
                    <p className="mt-1 text-[14px] leading-relaxed text-sway-muted">{b.address || 'Alamat menyusul'}</p>
                  </div>
                </a>
              )
            })}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS (only when real ones exist) */}
      {featured.length > 0 && (
        <section className="border-b border-sway-border bg-sway-surface">
          <div className="mx-auto max-w-[1200px] px-6 py-24">
            <SectionHeading eyebrow="Kata mereka" title="Yang sudah mampir." />
            <div className="mt-14 grid gap-5 md:grid-cols-3">
              {featured.map((t) => (
                <figure key={t._id} className="flex flex-col justify-between rounded-2xl border border-sway-border bg-white p-7">
                  <div>
                    <div className="flex gap-0.5" aria-label={`${t.rating} dari 5`}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={cn('h-4 w-4', i < t.rating ? 'fill-sway-gold text-sway-gold' : 'text-sway-border')} />
                      ))}
                    </div>
                    <blockquote className="mt-5 text-[15px] leading-relaxed">“{t.message}”</blockquote>
                  </div>
                  <figcaption className="mt-8 text-[14px]">
                    <span className="font-bold">{t.name}</span>
                    {(t.eventType || t.role) && <span className="text-sway-dim"> · {t.eventType || t.role}</span>}
                  </figcaption>
                </figure>
              ))}
            </div>
            <Link to="/testimonial" className="mt-8 inline-flex items-center gap-1.5 text-[14px] font-bold hover:text-sway-accent">
              Lihat semua testimoni <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section id="faq" className="scroll-mt-16 border-b border-sway-border">
        <div className="mx-auto grid max-w-[1200px] gap-12 px-6 py-24 lg:grid-cols-[1fr_1.4fr]">
          <SectionHeading eyebrow="FAQ" title="Sering ditanya." />
          <div className="divide-y divide-sway-border border-y border-sway-border">
            {FAQ.map((f) => (
              <details key={f.q} className="group py-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[17px] font-bold [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-sway-border text-[18px] leading-none transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-[560px] text-[15px] leading-relaxed text-sway-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-sway-accent text-white">
        <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-8 px-6 py-20 md:flex-row md:items-center">
          <h2 className="font-bebas text-[56px] sm:text-[72px] leading-[0.9] tracking-[0.01em]">
            Punya acara?<br />Bawa booth-nya ke sana.
          </h2>
          <Link
            to="/booking"
            className="group flex h-14 shrink-0 items-center gap-3 rounded-full bg-white pl-7 pr-2 text-[15px] font-bold text-sway-text transition-transform active:scale-[0.97]"
          >
            Booking sekarang
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sway-accent text-white transition-transform group-hover:translate-x-0.5">
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-sway-text text-zinc-400">
        <div className="mx-auto grid max-w-[1200px] gap-10 px-6 py-14 sm:grid-cols-3">
          <div>
            <span className="font-bebas text-[32px] leading-none tracking-[0.08em] text-white">BERTPIXX</span>
            <p className="mt-3 max-w-[240px] text-[14px] leading-relaxed">Photobooth self-service. Cetak di tempat, simpan selamanya.</p>
          </div>
          <div className="text-[14px]">
            <p className="font-bold text-white">Halaman</p>
            <ul className="mt-4 space-y-2">
              <li><Link to="/pricing" className="hover:text-white">Paket harga</Link></li>
              <li><Link to="/booking" className="hover:text-white">Booking event</Link></li>
              <li><Link to="/testimonial" className="hover:text-white">Testimoni</Link></li>
              <li><Link to="/guestbook" className="hover:text-white">Buku tamu</Link></li>
            </ul>
          </div>
          <div className="text-[14px]">
            <p className="font-bold text-white">Kontak</p>
            <ul className="mt-4 space-y-2">
              <li><a href={`mailto:${CONTACT.email}`} className="hover:text-white">{CONTACT.email}</a></li>
              <li><a href={`https://instagram.com/${CONTACT.instagram}`} target="_blank" rel="noreferrer" className="hover:text-white">@{CONTACT.instagram}</a></li>
              <li><a href={`https://wa.me/${CONTACT.whatsapp}`} target="_blank" rel="noreferrer" className="hover:text-white">WhatsApp</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-zinc-800">
          <p className="mx-auto max-w-[1200px] px-6 py-6 text-[12px]">© {year} bertpixx</p>
        </div>
      </footer>
    </div>
  )
}
