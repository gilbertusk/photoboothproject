import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface BranchState {
  /** Owner-selected report filter; empty string means all branches. Ignored server-side for branch admins. */
  branchId: string
  setBranchId: (id: string) => void
}

export const useBranchStore = create<BranchState>()(
  persist(
    (set) => ({
      branchId: '',
      setBranchId: (branchId) => set({ branchId }),
    }),
    { name: 'branch-filter' }
  )
)
