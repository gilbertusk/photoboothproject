export type AdminRole = 'OWNER' | 'BRANCH_ADMIN'

export interface Admin {
  id: string
  email: string
  name: string
  role?: AdminRole
  branchId?: string
}

export interface Branch {
  id: string
  name: string
  code: string
  address?: string
  isActive: boolean
}

export interface Kiosk {
  id: string
  name: string
  branchId: Pick<Branch, 'name' | 'code'> & { _id: string } | string
  isActive: boolean
  lastSeenAt?: string
  assignments: { branchId: string; assignedAt: string }[]
}

export interface Template {
  id: string
  name: string
  description?: string
  layout: object
  previewUrl?: string
  slots: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface PricingPackage {
  id: string
  name: string
  price: number
  photoCount: number
  duration: number
  printCount: number
  includeGif: boolean
  includeEmail: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Voucher {
  id: string
  code: string
  type: 'PERCENTAGE' | 'FIXED'
  value: number
  quota: number
  used: number
  expiredAt?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Session {
  id: string
  package: PricingPackage
  template?: Template
  voucher?: Voucher
  status: 'PENDING' | 'PAID' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED'
  totalPrice: number
  finalPrice: number
  startedAt?: string
  finishedAt?: string
  createdAt: string
}

export interface Transaction {
  id: string
  session: Session
  externalId?: string
  status: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED'
  amount: number
  paidAt?: string
  createdAt: string
}

export interface Setting {
  key: string
  value: string
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data?: T
}

export interface Customer {
  id: string
  email: string
  name: string
  phone?: string
  totalBookings: number
  totalSpent: number
  lastBookingAt?: string
  createdAt: string
  updatedAt: string
}

export interface DashboardStats {
  totalRevenue: number
  totalSessions: number
  totalCompletedSessions: number
  revenueToday: number
  sessionsToday: number
  revenueByDay: { date: string; revenue: number }[]
  popularPackages: { name: string; count: number }[]
}
