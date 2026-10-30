import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

import { AppLayout } from '@/components/layout/AppLayout'
import { WelcomeScreen } from '@/screens/WelcomeScreen'
import { PackageScreen } from '@/screens/PackageScreen'
import { PaymentScreen } from '@/screens/PaymentScreen'
import { TemplateScreen } from '@/screens/TemplateScreen'
import { CameraScreen } from '@/screens/CameraScreen'
import { PreviewScreen } from '@/screens/PreviewScreen'
import { OutputScreen } from '@/screens/OutputScreen'
import { ThankYouScreen } from '@/screens/ThankYouScreen'
import { GalleryScreen } from '@/screens/GalleryScreen'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { PricingPage } from '@/screens/PricingPage'
import { BookingPage } from '@/screens/BookingPage'
import { TestimonialPage } from '@/screens/TestimonialPage'

function App() {
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch('/api/public/settings')

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        console.log('Backend berhasil terhubung:', data)
      } catch (error: any) {
        console.error('Backend gagal terhubung:', error)
      }
    }

    checkBackend()
  }, [])

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<WelcomeScreen />} />
        <Route path="/packages" element={<PackageScreen />} />
        <Route path="/payment" element={<PaymentScreen />} />
        <Route path="/template" element={<TemplateScreen />} />
        <Route path="/camera" element={<CameraScreen />} />
        <Route path="/preview" element={<PreviewScreen />} />
        <Route path="/output" element={<OutputScreen />} />
        <Route path="/thankyou" element={<ThankYouScreen />} />
        <Route path="/gallery/:shareToken" element={<GalleryScreen />} />
      </Route>

      {/* Public marketing pages (no kiosk session required) */}
      <Route element={<PublicLayout />}>
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/testimonial" element={<TestimonialPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App