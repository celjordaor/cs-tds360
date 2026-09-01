import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from '@/features/auth/LoginPage'
import ForgotPassword from '@/features/auth/ForgotPassword'
import {
  RoleHome,
  AnalyticsPage,
  DashboardsPage,
  CustomersPage,
  SettingsPage,
} from '@/routes/index'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Públicas */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Raiz — redireciona para home do perfil */}
        <Route path="/" element={<RoleHome />} />

        {/* Protegidas */}
        <Route path="/analytics"  element={<AnalyticsPage />} />
        <Route path="/dashboards" element={<DashboardsPage />} />
        <Route path="/customers"  element={<CustomersPage />} />
        <Route path="/settings"   element={<SettingsPage />} />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
