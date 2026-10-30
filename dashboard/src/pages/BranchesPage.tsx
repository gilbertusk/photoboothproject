import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/hooks/useToast'
import { useBranches, apiErrorMessage } from '@/hooks/useBranches'
import { Kiosk } from '@/types'

const inputClass = 'h-10 rounded border border-sway-border bg-sway-surface px-3 text-sm text-sway-text'
const buttonClass = 'h-10 rounded bg-sway-accent px-4 text-sm font-bold text-white disabled:opacity-40'

function kioskBranchId(kiosk: Kiosk) {
  return typeof kiosk.branchId === 'string' ? kiosk.branchId : kiosk.branchId?._id
}

export function BranchesPage() {
  const isOwner = useAuthStore((s) => (s.admin?.role ?? 'OWNER') === 'OWNER')
  const client = useQueryClient()
  const { success, error } = useToast()
  const branches = useBranches()
  const kiosks = useQuery({
    queryKey: ['kiosks'],
    queryFn: async () => (await api.get('/api/kiosks')).data.data as Kiosk[],
  })

  const [branchForm, setBranchForm] = useState({ name: '', code: '', address: '' })
  const [kioskForm, setKioskForm] = useState({ name: '', branchId: '' })
  const [issuedToken, setIssuedToken] = useState<{ kiosk: string; token: string } | null>(null)

  const refresh = () => {
    client.invalidateQueries({ queryKey: ['branches'] })
    client.invalidateQueries({ queryKey: ['kiosks'] })
  }
  const onError = (err: unknown) => error('Gagal', apiErrorMessage(err))

  const createBranch = useMutation({
    mutationFn: () => api.post('/api/branches', branchForm),
    onSuccess: () => { setBranchForm({ name: '', code: '', address: '' }); refresh(); success('Cabang dibuat') },
    onError,
  })
  const toggleBranch = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => api.put(`/api/branches/${id}`, { isActive }),
    onSuccess: refresh,
    onError,
  })
  const createKiosk = useMutation({
    mutationFn: () => api.post('/api/kiosks', kioskForm),
    onSuccess: (res) => {
      setIssuedToken({ kiosk: res.data.data.kiosk.name, token: res.data.data.token })
      setKioskForm({ name: '', branchId: '' })
      refresh()
    },
    onError,
  })
  const moveKiosk = useMutation({
    mutationFn: ({ id, branchId }: { id: string; branchId: string }) => api.patch(`/api/kiosks/${id}/branch`, { branchId }),
    onSuccess: () => { refresh(); success('Kiosk dipindahkan', 'Riwayat lama tetap tercatat di cabang sebelumnya.') },
    onError,
  })
  const toggleKiosk = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => api.patch(`/api/kiosks/${id}/active`, { isActive }),
    onSuccess: refresh,
    onError,
  })
  const rotateToken = useMutation({
    mutationFn: (id: string) => api.post(`/api/kiosks/${id}/token`),
    onSuccess: (res) => { setIssuedToken({ kiosk: res.data.data.kiosk.name, token: res.data.data.token }); refresh() },
    onError,
  })

  if (branches.isLoading || kiosks.isLoading) return <p>Memuat cabang...</p>
  if (branches.isError || kiosks.isError) return <button onClick={refresh}>Gagal memuat data. Coba lagi</button>

  const branchName = (id?: string) => branches.data?.find((b) => b.id === id)?.name ?? '—'

  return (
    <section className="space-y-8 text-sway-text">
      <div>
        <h1 className="font-bebas text-3xl">CABANG & KIOSK</h1>
        <p className="text-sm text-sway-dim">
          Kiosk dapat dipindah antar cabang. Sesi, transaksi, dan stok yang sudah terjadi tetap tercatat di cabang saat itu.
        </p>
      </div>

      {issuedToken && (
        <div role="alert" className="rounded border border-sway-accent bg-sway-card p-4 space-y-2">
          <p className="font-bold">Token untuk kiosk “{issuedToken.kiosk}”</p>
          <p className="text-sm text-sway-dim">
            Tampil sekali saja. Buka <code>/setup</code> di perangkat kiosk lalu tempel token ini. Token lama (jika ada) sudah tidak berlaku.
          </p>
          <code className="block break-all rounded bg-sway-surface p-3 text-sm select-all">{issuedToken.token}</code>
          <div className="flex gap-2">
            <button className={buttonClass} onClick={() => navigator.clipboard.writeText(issuedToken.token).then(() => success('Token disalin'))}>Salin</button>
            <button className="h-10 px-4 text-sm" onClick={() => setIssuedToken(null)}>Sudah disimpan</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="font-bebas text-2xl">CABANG</h2>
        {isOwner && (
          <form className="flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); createBranch.mutate() }}>
            <input aria-label="Nama cabang" required placeholder="Nama cabang" className={inputClass} value={branchForm.name} onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })} />
            <input aria-label="Kode cabang" required placeholder="Kode (mis. JKT-01)" className={inputClass} value={branchForm.code} onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })} />
            <input aria-label="Alamat" placeholder="Alamat (opsional)" className={`${inputClass} flex-1 min-w-[200px]`} value={branchForm.address} onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })} />
            <button type="submit" disabled={createBranch.isPending} className={buttonClass}>Tambah cabang</button>
          </form>
        )}
        {branches.data?.length === 0 && <p className="text-sm text-sway-dim">Belum ada cabang. Kiosk lama tanpa cabang tetap berjalan sampai didaftarkan.</p>}
        <ul className="space-y-2">
          {branches.data?.map((branch) => (
            <li key={branch.id} className="flex items-center justify-between gap-4 rounded border border-sway-border bg-sway-card p-3">
              <div>
                <p className="font-bold">{branch.name} <span className="text-xs text-sway-dim">{branch.code}</span></p>
                {branch.address && <p className="text-xs text-sway-dim">{branch.address}</p>}
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span>{branch.isActive ? 'Aktif' : 'Nonaktif'}</span>
                {isOwner && (
                  <button className="underline" onClick={() => toggleBranch.mutate({ id: branch.id, isActive: !branch.isActive })}>
                    {branch.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-3">
        <h2 className="font-bebas text-2xl">KIOSK</h2>
        {isOwner && (
          <form className="flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); createKiosk.mutate() }}>
            <input aria-label="Nama kiosk" required placeholder="Nama kiosk (mis. iPad Booth 1)" className={inputClass} value={kioskForm.name} onChange={(e) => setKioskForm({ ...kioskForm, name: e.target.value })} />
            <select aria-label="Cabang kiosk" required className={inputClass} value={kioskForm.branchId} onChange={(e) => setKioskForm({ ...kioskForm, branchId: e.target.value })}>
              <option value="">Pilih cabang</option>
              {branches.data?.filter((b) => b.isActive).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <button type="submit" disabled={createKiosk.isPending} className={buttonClass}>Daftarkan kiosk</button>
          </form>
        )}
        {kiosks.data?.length === 0 && <p className="text-sm text-sway-dim">Belum ada kiosk terdaftar.</p>}
        <ul className="space-y-2">
          {kiosks.data?.map((kiosk) => (
            <li key={kiosk.id} className="flex flex-wrap items-center justify-between gap-4 rounded border border-sway-border bg-sway-card p-3">
              <div>
                <p className="font-bold">{kiosk.name}</p>
                <p className="text-xs text-sway-dim">
                  {branchName(kioskBranchId(kiosk))} · {kiosk.isActive ? 'Aktif' : 'Nonaktif'} · terakhir online:{' '}
                  {kiosk.lastSeenAt ? new Date(kiosk.lastSeenAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) + ' WIB' : 'belum pernah'}
                </p>
                <p className="text-xs text-sway-dim">{kiosk.assignments.length} penempatan tercatat</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {isOwner && (
                  <select
                    aria-label={`Pindahkan ${kiosk.name}`}
                    className={inputClass}
                    value={kioskBranchId(kiosk)}
                    onChange={(e) => {
                      if (window.confirm(`Pindahkan ${kiosk.name} ke ${branchName(e.target.value)}? Transaksi berikutnya akan tercatat di cabang baru.`)) {
                        moveKiosk.mutate({ id: kiosk.id, branchId: e.target.value })
                      }
                    }}
                  >
                    {branches.data?.filter((b) => b.isActive || b.id === kioskBranchId(kiosk)).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                )}
                <button className="underline" onClick={() => toggleKiosk.mutate({ id: kiosk.id, isActive: !kiosk.isActive })}>
                  {kiosk.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                </button>
                {isOwner && (
                  <button
                    className="underline"
                    onClick={() => window.confirm('Buat token baru? Kiosk akan berhenti bekerja sampai token baru dipasang.') && rotateToken.mutate(kiosk.id)}
                  >
                    Token baru
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
