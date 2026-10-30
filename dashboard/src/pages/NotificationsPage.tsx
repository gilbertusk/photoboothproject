import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

interface Notification {
  _id: string
  to: string
  subject: string
  status: 'PENDING' | 'SENDING' | 'SENT' | 'FAILED' | 'CANCELLED'
  attempts: number
  lastError?: string
  createdAt: string
}

export function NotificationsPage() {
  const [page, setPage] = useState(1)
  const client = useQueryClient()
  const query = useQuery({
    queryKey: ['notifications', page],
    refetchInterval: 15000,
    queryFn: async () => (await api.get('/api/notifications', { params: { page } })).data.data as {
      notifications: Notification[]; totalPages: number; enabled: boolean; configured: boolean
    },
  })
  const retry = useMutation({
    mutationFn: (id: string) => api.post(`/api/notifications/${id}/retry`),
    onSuccess: () => client.invalidateQueries({ queryKey: ['notifications'] }),
  })
  if (query.isLoading) return <p>Memuat notifikasi...</p>
  if (query.isError) return <button onClick={() => query.refetch()}>Gagal memuat notifikasi. Coba lagi</button>
  return (
    <section className="space-y-5 text-sway-text">
      <h1 className="font-bebas text-3xl">NOTIFIKASI BOOKING</h1>
      <p className="text-sm text-sway-dim">Konfirmasi dan pengingat 24 jam sebelum acara (WIB). SENT berarti diterima penyedia email, bukan bukti email dibaca.</p>
      {(!query.data?.enabled || !query.data.configured) && <p className="rounded border border-sway-border p-4">Pengiriman belum aktif. Konfigurasikan RESEND_API_KEY, EMAIL_FROM dan NOTIFICATIONS_ENABLED=true di backend.</p>}
      {retry.isError && <p role="alert">Gagal mengantrekan ulang email. Periksa konfigurasi atau muat ulang halaman.</p>}
      {query.data?.notifications.length === 0 && <p>Belum ada notifikasi.</p>}
      <div className="space-y-3">
        {query.data?.notifications.map(notification => (
          <article key={notification._id} className="rounded border border-sway-border bg-sway-card p-4 space-y-2">
            <div className="flex justify-between gap-4"><h2 className="font-bold">{notification.subject}</h2><span>{notification.status}</span></div>
            <p className="text-sm">{notification.to} · {notification.attempts} percobaan</p>
            <p className="text-xs text-sway-dim">{new Date(notification.createdAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB</p>
            {notification.lastError && <p className="text-sm text-sway-error">{notification.lastError}</p>}
            {notification.status === 'FAILED' && <button
              disabled={retry.isPending || !query.data?.enabled || !query.data.configured}
              onClick={() => retry.mutate(notification._id)}
              className="rounded bg-sway-accent px-3 py-2 text-white disabled:opacity-40"
            >Antrekan ulang</button>}
          </article>
        ))}
      </div>
      <div className="flex gap-4 items-center">
        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Sebelumnya</button>
        <span>{page} / {query.data?.totalPages || 1}</span>
        <button disabled={page >= (query.data?.totalPages || 1)} onClick={() => setPage(p => p + 1)}>Berikutnya</button>
      </div>
    </section>
  )
}
