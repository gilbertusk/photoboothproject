import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

// Pages
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { TemplatesPage } from '@/pages/TemplatesPage'
import { PricingPage } from '@/pages/PricingPage'
import { VouchersPage } from '@/pages/VouchersPage'
import { TransactionsPage } from '@/pages/TransactionsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { CustomersPage } from '@/pages/CustomersPage'
import { NotificationsPage } from '@/pages/NotificationsPage'
import { BranchesPage } from '@/pages/BranchesPage'
import { AdminsPage } from '@/pages/AdminsPage'

interface ProtectedRouteProps {
  children: React.ReactNode
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

// UX guard only; the API enforces owner-only access.
function OwnerRoute({ children }: ProtectedRouteProps) {
  const role = useAuthStore((state) => state.admin?.role ?? 'OWNER')
  if (role !== 'OWNER') return <Navigate to="/" replace />
  return <>{children}</>
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Login Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Admin Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="templates" element={<OwnerRoute><TemplatesPage /></OwnerRoute>} />
          <Route path="pricing" element={<OwnerRoute><PricingPage /></OwnerRoute>} />
          <Route path="vouchers" element={<OwnerRoute><VouchersPage /></OwnerRoute>} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="branches" element={<BranchesPage />} />
          <Route path="customers" element={<OwnerRoute><CustomersPage /></OwnerRoute>} />
          <Route path="notifications" element={<OwnerRoute><NotificationsPage /></OwnerRoute>} />
          <Route path="admins" element={<OwnerRoute><AdminsPage /></OwnerRoute>} />
          <Route path="settings" element={<OwnerRoute><SettingsPage /></OwnerRoute>} />
        </Route>

        {/* Fallback Catch All */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
