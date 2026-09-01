import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import AppLayout from '@/components/layout/AppLayout'
import ComingSoon from '@/components/shared/ComingSoon'

// Redirecionamento inicial por perfil
const ROLE_HOME = {
  cs: '/customers',
  manager: '/analytics',
  admin: '/analytics',
  super_admin: '/analytics',
}

// Guard: redireciona para login se não autenticado
export function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <PageLoading />
  if (!user) return <Navigate to="/login" replace />
  return children
}

// Guard: redireciona para home do perfil se não tem permissão
export function RequireRole({ roles, children }) {
  const { profile, loading } = useAuth()
  if (loading) return <PageLoading />
  if (!roles.includes(profile?.role)) {
    return <Navigate to={ROLE_HOME[profile?.role] || '/login'} replace />
  }
  return children
}

// Redireciona para a home correta do perfil
export function RoleHome() {
  const { profile, loading } = useAuth()
  if (loading) return <PageLoading />
  return <Navigate to={ROLE_HOME[profile?.role] || '/login'} replace />
}

function PageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

// Rotas internas com layout
export function AnalyticsPage() {
  return (
    <RequireAuth>
      <RequireRole roles={['super_admin', 'admin', 'manager']}>
        <AppLayout>
          <ComingSoon title="Analytics CS" />
        </AppLayout>
      </RequireRole>
    </RequireAuth>
  )
}

export function DashboardsPage() {
  return (
    <RequireAuth>
      <RequireRole roles={['super_admin', 'admin', 'manager']}>
        <AppLayout>
          <ComingSoon title="Dashboards" />
        </AppLayout>
      </RequireRole>
    </RequireAuth>
  )
}

export function CustomersPage() {
  return (
    <RequireAuth>
      <AppLayout>
        <ComingSoon title="Customer Success" />
      </AppLayout>
    </RequireAuth>
  )
}

export function SettingsPage() {
  return (
    <RequireAuth>
      <RequireRole roles={['super_admin', 'admin']}>
        <AppLayout>
          <ComingSoon title="Configurações" />
        </AppLayout>
      </RequireRole>
    </RequireAuth>
  )
}
