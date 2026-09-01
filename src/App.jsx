import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage       from '@/features/auth/LoginPage'
import ForgotPassword  from '@/features/auth/ForgotPassword'
import ResetPassword   from '@/features/auth/ResetPassword'
import ClientsListPage from '@/features/clients/ClientsListPage'
import ClientPage      from '@/features/clients/ClientPage'
import {
  RoleHome,
  AnalyticsPage,
  DashboardsPage,
  SettingsPage,
} from '@/routes/index'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Públicas */}
        <Route path="/login"           element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password"  element={<ResetPassword />} />

        {/* Raiz → home do perfil */}
        <Route path="/" element={<RoleHome />} />

        {/* Clientes */}
        <Route path="/clients"     element={<ClientsListPage />} />
        <Route path="/clients/:id" element={<ClientPage />} />

        {/* Demais protegidas */}
        <Route path="/analytics"   element={<AnalyticsPage />} />
        <Route path="/dashboards"  element={<DashboardsPage />} />
        <Route path="/settings"    element={<SettingsPage />} />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
