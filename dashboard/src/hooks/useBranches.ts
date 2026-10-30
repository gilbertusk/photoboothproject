import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { api } from '@/lib/api'
import { Branch } from '@/types'

export function useBranches() {
  return useQuery({
    queryKey: ['branches'],
    queryFn: async () => (await api.get('/api/branches')).data.data as Branch[],
  })
}

export function apiErrorMessage(err: unknown): string {
  return (axios.isAxiosError(err) && err.response?.data?.message) || 'Terjadi kesalahan'
}
