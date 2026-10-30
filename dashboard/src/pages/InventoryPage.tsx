import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/useToast'
import { apiErrorMessage } from '@/hooks/useBranches'
import { useBranchStore } from '@/stores/branchStore'
import { BranchSelect } from '@/components/shared/BranchSelect'
import { InventoryKiosk, InventoryStockItem, InventoryMovementRow } from '@/types'

const inputClass = 'h-10 rounded border border-sway-border bg-sway-surface px-3 text-sm text-sway-text'
const buttonClass = 'h-10 rounded bg-sway-accent px-4 text-sm font-bold text-white disabled:opacity-40'
const kindLabel: Record<InventoryMovementRow['kind'], string> = {
  PRINT: 'Cetak', REPRINT: 'Cetak ulang', RESTOCK: 'Isi ulang', ADJUST: 'Penyesuaian',
}
const emptyItem = { name: '', unit: 'lembar', perPrint: '1', lowStockThreshold: '20', initialQuantity: '0' }

// A fresh ID per form submission; reused if the same submission is retried.
// randomUUID needs a secure context; the dashboard may be served over plain HTTP on a LAN.
const newRequestId = () =>
  typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('')

function ItemRow({ item, onChanged }: { item: InventoryStockItem; onChanged: () => void }) {
  const { success, error } = useToast()
  const [mode, setMode] = useState<'restock' | 'adjust' | null>(null)
  const [amount, setAmount] = useState('')
  const [requestId, setRequestId] = useState(newRequestId)
  const [showHistory, setShowHistory] = useState(false)
  const history = useQuery({
    queryKey: ['inventory-movements', item.id],
    enabled: showHistory,
    queryFn: async () => (await api.get(`/api/inventory/items/${item.id}/movements`)).data.data as InventoryMovementRow[],
  })

  const submit = useMutation({
    mutationFn: () => mode === 'restock'
      ? api.post(`/api/inventory/items/${item.id}/restock`, { quantity: Number(amount), requestId })
      : api.post(`/api/inventory/items/${item.id}/adjust`, { countedQuantity: Number(amount), requestId }),
    onSuccess: () => {
      success(mode === 'restock' ? 'Stok ditambahkan' : 'Stok disesuaikan')
      setMode(null); setAmount(''); setRequestId(newRequestId())
      onChanged()
    },
    onError: (err) => error('Gagal', apiErrorMessage(err)),
  })
  const toggle = useMutation({
    mutationFn: () => api.put(`/api/inventory/items/${item.id}`, { isActive: !item.isActive }),
    onSuccess: onChanged,
    onError: (err) => error('Gagal', apiErrorMessage(err)),
  })

  return (
    <li className="rounded border border-sway-border bg-sway-card p-3 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-bold">
            {item.name}
            {item.lowStock && <span className="ml-2 rounded bg-sway-accent px-2 py-0.5 text-[10px] font-bold uppercase text-white">Stok menipis</span>}
            {!item.isActive && <span className="ml-2 text-xs text-sway-dim">(tidak dilacak)</span>}
          </p>
          <p className="text-xs text-sway-dim">
            {item.perPrint} {item.unit} per cetak · peringatan di ≤ {item.lowStockThreshold}
          </p>
        </div>
        <p className={`font-bebas text-3xl ${item.quantity < 0 ? 'text-sway-error' : ''}`} aria-label={`Sisa ${item.quantity} ${item.unit}`}>
          {item.quantity} <span className="text-sm">{item.unit}</span>
        </p>
      </div>
      {item.quantity < 0 && (
        <p className="text-xs text-sway-error">Stok tercatat negatif: ada cetak yang belum diimbangi isi ulang. Lakukan stock opname.</p>
      )}
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <button className="underline" onClick={() => setMode(mode === 'restock' ? null : 'restock')}>Isi ulang</button>
        <button className="underline" onClick={() => setMode(mode === 'adjust' ? null : 'adjust')}>Stock opname</button>
        <button className="underline" onClick={() => setShowHistory(!showHistory)}>{showHistory ? 'Tutup riwayat' : 'Riwayat'}</button>
        <button className="underline" onClick={() => toggle.mutate()}>{item.isActive ? 'Berhenti lacak' : 'Lacak lagi'}</button>
      </div>
      {mode && (
        <form className="flex flex-wrap items-center gap-2" onSubmit={(e) => { e.preventDefault(); submit.mutate() }}>
          <input
            aria-label={mode === 'restock' ? 'Jumlah ditambahkan' : 'Jumlah hasil hitung fisik'}
            required type="number" min={mode === 'restock' ? 1 : 0} step={1}
            placeholder={mode === 'restock' ? 'Jumlah ditambahkan' : 'Hasil hitung fisik'}
            className={inputClass} value={amount}
            onChange={(e) => { setAmount(e.target.value); setRequestId(newRequestId()) }}
          />
          <button type="submit" disabled={submit.isPending} className={buttonClass}>Simpan</button>
          {mode === 'adjust' && <span className="text-xs text-sway-dim">Selisih dicatat sebagai penyesuaian.</span>}
        </form>
      )}
      {showHistory && (
        <ul className="text-xs text-sway-dim space-y-1">
          {history.isLoading && <li>Memuat riwayat...</li>}
          {history.data?.length === 0 && <li>Belum ada riwayat.</li>}
          {history.data?.map((m) => (
            <li key={m._id}>
              {new Date(m.createdAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB · {kindLabel[m.kind]} ·{' '}
              <span className={m.delta < 0 ? 'text-sway-error' : 'text-sway-success'}>{m.delta > 0 ? `+${m.delta}` : m.delta}</span>
              {m.adminId?.name && ` · ${m.adminId.name}`}{m.note && ` · ${m.note}`}
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

export function InventoryPage() {
  const client = useQueryClient()
  const { success, error } = useToast()
  const branchId = useBranchStore((s) => s.branchId)
  const inventory = useQuery({
    queryKey: ['inventory', branchId],
    refetchInterval: 60000,
    queryFn: async () => (await api.get('/api/inventory', { params: branchId ? { branchId } : {} })).data.data as InventoryKiosk[],
  })
  const [addingTo, setAddingTo] = useState<string | null>(null)
  const [itemForm, setItemForm] = useState(emptyItem)
  const refresh = () => client.invalidateQueries({ queryKey: ['inventory'] })

  const createItem = useMutation({
    mutationFn: (kioskId: string) => api.post('/api/inventory/items', {
      kioskId,
      name: itemForm.name,
      unit: itemForm.unit,
      perPrint: Number(itemForm.perPrint),
      lowStockThreshold: Number(itemForm.lowStockThreshold),
      initialQuantity: Number(itemForm.initialQuantity),
    }),
    onSuccess: () => { setAddingTo(null); setItemForm(emptyItem); refresh(); success('Barang ditambahkan') },
    onError: (err) => error('Gagal', apiErrorMessage(err)),
  })

  if (inventory.isLoading) return <p>Memuat stok...</p>
  if (inventory.isError) return <button onClick={refresh}>Gagal memuat stok. Coba lagi</button>

  const lowCount = inventory.data?.reduce((n, k) => n + k.items.filter((i) => i.lowStock).length, 0) ?? 0

  return (
    <section className="space-y-6 text-sway-text">
      <div className="space-y-2">
        <h1 className="font-bebas text-3xl">STOK KIOSK</h1>
        <p className="text-sm text-sway-dim">
          Stok dicatat per kiosk. Setiap cetak dan cetak ulang mengurangi stok otomatis; isi ulang dan stock opname menambah catatan baru, tidak mengubah riwayat.
        </p>
        <BranchSelect />
        {lowCount > 0 && <p role="status" className="text-sm font-bold text-sway-accent">{lowCount} barang stoknya menipis.</p>}
      </div>

      {inventory.data?.length === 0 && <p className="text-sm text-sway-dim">Belum ada kiosk. Daftarkan kiosk di halaman Cabang & Kiosk.</p>}

      {inventory.data?.map((kiosk) => (
        <div key={kiosk.id} className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-bebas text-2xl">
              {kiosk.name} <span className="text-sm text-sway-dim">{typeof kiosk.branch === 'object' ? kiosk.branch?.name : ''}{kiosk.isActive ? '' : ' · nonaktif'}</span>
            </h2>
            <button className="text-sm underline" onClick={() => setAddingTo(addingTo === kiosk.id ? null : kiosk.id)}>Tambah barang</button>
          </div>
          {addingTo === kiosk.id && (
            <form className="flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); createItem.mutate(kiosk.id) }}>
              <input aria-label="Nama barang" required placeholder="Nama (mis. Kertas 4R)" className={inputClass} value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} />
              <input aria-label="Satuan" required placeholder="Satuan" className={`${inputClass} w-24`} value={itemForm.unit} onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })} />
              <label className="flex items-center gap-1 text-xs">Per cetak
                <input required type="number" min={0} step="any" className={`${inputClass} w-20`} value={itemForm.perPrint} onChange={(e) => setItemForm({ ...itemForm, perPrint: e.target.value })} />
              </label>
              <label className="flex items-center gap-1 text-xs">Batas peringatan
                <input required type="number" min={0} step={1} className={`${inputClass} w-20`} value={itemForm.lowStockThreshold} onChange={(e) => setItemForm({ ...itemForm, lowStockThreshold: e.target.value })} />
              </label>
              <label className="flex items-center gap-1 text-xs">Stok awal
                <input required type="number" min={0} step={1} className={`${inputClass} w-24`} value={itemForm.initialQuantity} onChange={(e) => setItemForm({ ...itemForm, initialQuantity: e.target.value })} />
              </label>
              <button type="submit" disabled={createItem.isPending} className={buttonClass}>Simpan</button>
            </form>
          )}
          {kiosk.items.length === 0 ? (
            <p className="text-sm text-sway-dim">Belum ada barang dilacak untuk kiosk ini.</p>
          ) : (
            <ul className="space-y-2">
              {kiosk.items.map((item) => <ItemRow key={item.id} item={item} onChanged={refresh} />)}
            </ul>
          )}
        </div>
      ))}
    </section>
  )
}
