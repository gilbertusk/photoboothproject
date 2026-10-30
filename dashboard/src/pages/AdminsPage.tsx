import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/useToast'
import { useAuthStore } from '@/stores/authStore'
import { useBranches, apiErrorMessage } from '@/hooks/useBranches'
import { AdminRole } from '@/types'

interface AdminRow {
  _id: string
  email: string
  name: string
  role?: AdminRole
  branchId?: { _id: string; name: string } | null
}

const inputClass = 'h-10 rounded border border-sway-border bg-sway-surface px-3 text-sm text-sway-text'
const emptyForm = { email: '', name: '', password: '', role: 'BRANCH_ADMIN' as AdminRole, branchId: '' }

export function AdminsPage() {
  const me = useAuthStore((s) => s.admin)
  const client = useQueryClient()
  const { success, error } = useToast()
  const branches = useBranches()
  const admins = useQuery({
    queryKey: ['admins'],
    queryFn: async () => (await api.get('/api/admins')).data.data as AdminRow[],
  })
  const [form, setForm] = useState(emptyForm)
  const onError = (err: unknown) => error('Gagal', apiErrorMessage(err))
  const refresh = () => client.invalidateQueries({ queryKey: ['admins'] })

  const create = useMutation({
    mutationFn: () => api.post('/api/admins', { ...form, branchId: form.role === 'BRANCH_ADMIN' ? form.branchId : undefined }),
    onSuccess: () => { setForm(emptyForm); refresh(); success('Admin dibuat') },
    onError,
  })
  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) => api.put(`/api/admins/${id}`, body),
    onSuccess: () => { refresh(); success('Admin diperbarui') },
    onError,
  })
  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/api/admins/${id}`),
    onSuccess: () => { refresh(); success('Admin dihapus') },
    onError,
  })

  if (admins.isLoading) return <p>Memuat admin...</p>
  if (admins.isError) return <button onClick={refresh}>Gagal memuat admin. Coba lagi</button>

  return (
    <section className="space-y-6 text-sway-text">
      <div>
        <h1 className="font-bebas text-3xl">ADMIN & AKSES</h1>
        <p className="text-sm text-sway-dim">
          Owner melihat semua cabang dan mengatur paket, template, voucher, booking, pelanggan, dan pengaturan.
          Admin cabang hanya melihat dashboard, transaksi, kiosk, dan stok cabangnya.
        </p>
      </div>

      <form className="flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); create.mutate() }}>
        <input aria-label="Nama" required placeholder="Nama" className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input aria-label="Email" required type="email" placeholder="Email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input aria-label="Password" required type="password" minLength={8} placeholder="Password (min. 8)" className={inputClass} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <select aria-label="Peran" className={inputClass} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as AdminRole })}>
          <option value="BRANCH_ADMIN">Admin cabang</option>
          <option value="OWNER">Owner</option>
        </select>
        {form.role === 'BRANCH_ADMIN' && (
          <select aria-label="Cabang" required className={inputClass} value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })}>
            <option value="">Pilih cabang</option>
            {branches.data?.filter((b) => b.isActive).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        )}
        <button type="submit" disabled={create.isPending} className="h-10 rounded bg-sway-accent px-4 text-sm font-bold text-white disabled:opacity-40">Tambah admin</button>
      </form>

      <ul className="space-y-2">
        {admins.data?.map((admin) => {
          const role = admin.role ?? 'OWNER'
          const isMe = admin._id === me?.id
          return (
            <li key={admin._id} className="flex flex-wrap items-center justify-between gap-4 rounded border border-sway-border bg-sway-card p-3">
              <div>
                <p className="font-bold">{admin.name}{isMe && ' (Anda)'}</p>
                <p className="text-xs text-sway-dim">{admin.email}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <select
                  aria-label={`Peran ${admin.name}`}
                  disabled={isMe}
                  className={inputClass}
                  value={role === 'OWNER' ? 'OWNER' : admin.branchId?._id ?? ''}
                  onChange={(e) => update.mutate({
                    id: admin._id,
                    body: e.target.value === 'OWNER' ? { role: 'OWNER' } : { role: 'BRANCH_ADMIN', branchId: e.target.value },
                  })}
                >
                  <option value="OWNER">Owner (semua cabang)</option>
                  {role !== 'OWNER' && !admin.branchId && <option value="">Pilih cabang</option>}
                  {branches.data?.map((b) => <option key={b.id} value={b.id}>Admin {b.name}</option>)}
                </select>
                {!isMe && (
                  <button className="underline text-sway-error" onClick={() => window.confirm(`Hapus akun ${admin.email}?`) && remove.mutate(admin._id)}>
                    Hapus
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
