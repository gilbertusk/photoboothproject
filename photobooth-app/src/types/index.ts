// ===== Shared Types (aligned with backend models & dashboard) =====

export interface PricingPackage {
  _id: string
  name: string
  price: number
  photoCount: number
  duration: number
  includeGif: boolean
  includeEmail: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Voucher {
  _id: string
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

export interface TemplateSlot {
  x: number
  y: number
  width: number
  height: number
  rotation?: number
}

export interface TemplateOverlay {
  url: string
  x: number
  y: number
  width: number
  height: number
}

export interface TemplateLayout {
  width: number
  height: number
  background?: string
  slots: TemplateSlot[]
  overlays?: TemplateOverlay[]
}

export interface Template {
  _id: string
  name: string
  description?: string
  layout: TemplateLayout
  previewUrl: string
  slots: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Session {
  _id: string
  packageId: PricingPackage
  templateId?: Template
  voucherId?: Voucher
  status: 'PENDING' | 'PAID' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED'
  totalPrice: number
  finalPrice: number
  startedAt?: string
  finishedAt?: string
  createdAt: string
  updatedAt: string
}

export interface Transaction {
  _id: string
  sessionId: string
  externalId: string
  status: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED'
  qrUrl: string
  amount: number
  paidAt?: string
  createdAt: string
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data?: T
}

export interface Booking {
  _id: string
  customerName: string
  customerEmail: string
  customerPhone: string
  packageId: string | PricingPackage
  eventDate: string
  eventTime: string
  eventLocation: string
  eventType?: string
  guestCount?: number
  specialRequests?: string
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
  totalAmount: number
  paymentStatus: 'UNPAID' | 'PAID' | 'REFUNDED'
  paymentReference?: string
  createdAt: string
  updatedAt: string
}

export interface Testimonial {
  _id: string
  name: string
  role?: string
  eventType?: string
  rating: number
  message: string
  imageUrl?: string
  isActive: boolean
  isFeatured: boolean
  createdAt: string
  updatedAt: string
}

export type FilterType = 'normal' | 'bw' | 'warm' | 'cool' | 'vintage'

export const FILTERS: Record<FilterType, string> = {
  normal: 'none',
  bw: 'grayscale(100%)',
  warm: 'sepia(40%) saturate(150%) brightness(105%)',
  cool: 'hue-rotate(180deg) saturate(80%)',
  vintage: 'sepia(60%) contrast(90%) brightness(110%)',
}

export const FILTER_LABELS: Record<FilterType, string> = {
  normal: 'Normal',
  bw: 'B&W',
  warm: 'Warm',
  cool: 'Cool',
  vintage: 'Vintage',
}
