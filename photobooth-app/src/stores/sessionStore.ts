import { create } from 'zustand'
import { PricingPackage, Template, Voucher, FilterType } from '@/types'

interface SessionStore {
  // Session data
  selectedPackage: PricingPackage | null
  selectedTemplate: Template | null
  appliedVoucher: Voucher | null
  discountedPrice: number | null
  sessionId: string | null
  transactionId: string | null
  qrUrl: string | null

  // Photos
  capturedPhotos: string[]
  stripUrl: string | null
  gifUrl: string | null
  localStripUrl: string | null
  localGifUrl: string | null
  stripDataUrl: string | null

  // Gallery / sharing
  shareToken: string | null
  galleryUrl: string | null
  mediaUrls: string[]

  // Individual photo retake
  retakeIndex: number | null

  // Camera settings
  isMirror: boolean
  selectedFilter: FilterType

  // Actions
  setPackage: (pkg: PricingPackage) => void
  setTemplate: (tmpl: Template) => void
  setVoucher: (voucher: Voucher | null) => void
  setDiscountedPrice: (price: number | null) => void
  setSessionId: (id: string) => void
  setTransactionId: (id: string) => void
  setQrUrl: (url: string) => void
  addPhoto: (photo: string) => void
  removeLastPhoto: () => void
  replacePhoto: (index: number, photo: string) => void
  setStripUrl: (url: string) => void
  setGifUrl: (url: string) => void
  setLocalStripUrl: (url: string) => void
  setLocalGifUrl: (url: string) => void
  setStripDataUrl: (url: string) => void
  setShareToken: (token: string | null) => void
  setGalleryUrl: (url: string | null) => void
  setMediaUrls: (urls: string[]) => void
  setRetakeIndex: (index: number | null) => void
  toggleMirror: () => void
  setFilter: (filter: FilterType) => void
  resetSession: () => void
}

const initialState = {
  selectedPackage: null,
  selectedTemplate: null,
  appliedVoucher: null,
  discountedPrice: null,
  sessionId: null,
  transactionId: null,
  qrUrl: null,
  capturedPhotos: [],
  stripUrl: null,
  gifUrl: null,
  localStripUrl: null,
  localGifUrl: null,
  stripDataUrl: null,
  shareToken: null,
  galleryUrl: null,
  mediaUrls: [],
  retakeIndex: null,
  isMirror: true,
  selectedFilter: 'normal' as FilterType,
}

export const useSessionStore = create<SessionStore>((set) => ({
  ...initialState,

  setPackage: (pkg) => set({ selectedPackage: pkg }),
  setTemplate: (tmpl) => set({ selectedTemplate: tmpl }),
  setVoucher: (voucher) => set({ appliedVoucher: voucher }),
  setDiscountedPrice: (price) => set({ discountedPrice: price }),
  setSessionId: (id) => set({ sessionId: id }),
  setTransactionId: (id) => set({ transactionId: id }),
  setQrUrl: (url) => set({ qrUrl: url }),
  addPhoto: (photo) =>
    set((state) => ({
      capturedPhotos: [...state.capturedPhotos, photo],
    })),
  removeLastPhoto: () =>
    set((state) => ({
      capturedPhotos: state.capturedPhotos.slice(0, -1),
    })),
  replacePhoto: (index, photo) =>
    set((state) => {
      const updated = [...state.capturedPhotos]
      updated[index] = photo
      return { capturedPhotos: updated }
    }),
  setStripUrl: (url) => set({ stripUrl: url }),
  setGifUrl: (url) => set({ gifUrl: url }),
  setLocalStripUrl: (url) => set({ localStripUrl: url }),
  setLocalGifUrl: (url) => set({ localGifUrl: url }),
  setStripDataUrl: (url) => set({ stripDataUrl: url }),
  setShareToken: (token: string | null) => set({ shareToken: token }),
  setGalleryUrl: (url: string | null) => set({ galleryUrl: url }),
  setMediaUrls: (urls: string[]) => set({ mediaUrls: urls }),
  setRetakeIndex: (index: number | null) => set({ retakeIndex: index }),
  toggleMirror: () => set((state) => ({ isMirror: !state.isMirror })),
  setFilter: (filter) => set({ selectedFilter: filter }),
  resetSession: () => set({ ...initialState }),
}))
