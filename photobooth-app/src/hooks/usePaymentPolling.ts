import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Transaction, ApiResponse } from '@/types'

interface UsePaymentPollingOptions {
  sessionId: string | null
  enabled?: boolean
}

export function usePaymentPolling({ sessionId, enabled = true }: UsePaymentPollingOptions) {
  const query = useQuery<Transaction | null>({
    queryKey: ['payment-status', sessionId],
    queryFn: async () => {
      if (!sessionId) return null
      const response = await api.get<ApiResponse<Transaction>>(
        `/api/transactions/${sessionId}`
      )
      return response.data?.data ?? null
    },
    enabled: enabled && !!sessionId,
    refetchInterval: (query) => {
      const data = query.state.data
      // Stop polling if status is terminal
      if (data && ['PAID', 'FAILED', 'EXPIRED'].includes(data.status)) {
        return false
      }
      return 3000
    },
    refetchIntervalInBackground: true,
  })

  return {
    transaction: query.data,
    status: query.data?.status ?? 'PENDING',
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}
