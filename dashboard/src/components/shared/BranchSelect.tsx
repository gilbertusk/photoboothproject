import { useAuthStore } from '@/stores/authStore'
import { useBranchStore } from '@/stores/branchStore'
import { useBranches } from '@/hooks/useBranches'

/** Owners pick a report branch; branch admins see their fixed branch name. */
export function BranchSelect() {
  const role = useAuthStore((s) => s.admin?.role ?? 'OWNER')
  const { branchId, setBranchId } = useBranchStore()
  const { data: branches = [] } = useBranches()

  if (role === 'BRANCH_ADMIN') {
    return (
      <span className="text-xs font-bold uppercase tracking-wider text-sway-dim">
        Cabang: {branches[0]?.name ?? '—'}
      </span>
    )
  }

  return (
    <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sway-dim">
      Cabang
      <select
        value={branchId}
        onChange={(e) => setBranchId(e.target.value)}
        className="h-9 rounded border border-sway-border bg-sway-surface px-2 text-sway-text normal-case"
      >
        <option value="">Semua cabang</option>
        {branches.map((b) => (
          <option key={b.id} value={b.id}>{b.name}{b.isActive ? '' : ' (nonaktif)'}</option>
        ))}
      </select>
    </label>
  )
}
