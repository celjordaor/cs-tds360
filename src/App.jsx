import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage       from '@/features/auth/LoginPage'
import ForgotPassword  from '@/features/auth/ForgotPassword'
import ResetPassword   from '@/features/auth/ResetPassword'
import ClientsListPage from '@/features/clients/ClientsListPage'
import ClientPage      from '@/features/clients/ClientPage'
import ClientExportPage from '@/features/clients/export/ClientExportPage'
import SettingsPage    from '@/features/settings/SettingsPage'
import {
  RequireAuth,
  RequireRole,
  RoleHome,
  AnalyticsPage,
  DashboardsPage,
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
        <Route path="/clients"             element={<RequireAuth><ClientsListPage /></RequireAuth>} />
        <Route path="/clients/:id"         element={<RequireAuth><ClientPage /></RequireAuth>} />
        <Route path="/clients/:id/export"  element={<RequireAuth><ClientExportPage /></RequireAuth>} />

        {/* Configurações */}
        <Route path="/settings" element={
          <RequireAuth>
            <RequireRole roles={['super_admin','admin']}>
              <SettingsPage />
            </RequireRole>
          </RequireAuth>
        } />

        {/* Demais protegidas */}
        <Route path="/analytics"   element={<AnalyticsPage />} />
        <Route path="/dashboards"  element={<DashboardsPage />} />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
