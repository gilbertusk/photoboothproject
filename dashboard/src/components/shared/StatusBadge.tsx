import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalized = status.toUpperCase().trim()

  const getStatusStyles = () => {
    switch (normalized) {
      // Active / Success states
      case 'PAID':
      case 'COMPLETED':
      case 'ACTIVE':
      case 'TRUE':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
      
      // Warning / Pending states
      case 'PENDING':
      case 'IN_PROGRESS':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
      
      // Failed / Alert states
      case 'FAILED':
      case 'DESTRUCTIVE':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
      
      // Expired / Quota Full states
      case 'EXPIRED':
      case 'HABIS':
        return 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'

      // Inactive / Disabled states
      case 'INACTIVE':
      case 'FALSE':
      case 'NONAKTIF':
      default:
        return 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-800/80'
    }
  }

  const getStatusLabel = () => {
    switch (normalized) {
      case 'PAID':
        return 'Paid'
      case 'COMPLETED':
        return 'Selesai'
      case 'PENDING':
        return 'Menunggu'
      case 'IN_PROGRESS':
        return 'Berjalan'
      case 'FAILED':
        return 'Gagal'
      case 'EXPIRED':
        return 'Expired'
      case 'ACTIVE':
      case 'TRUE':
        return 'Aktif'
      case 'INACTIVE':
      case 'FALSE':
      case 'NONAKTIF':
        return 'Nonaktif'
      default:
        return status
    }
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "px-2.5 py-0.5 text-xs font-semibold rounded-full border transition-all duration-200",
        getStatusStyles(),
        className
      )}
    >
      {getStatusLabel()}
    </Badge>
  )
}
export default StatusBadge
