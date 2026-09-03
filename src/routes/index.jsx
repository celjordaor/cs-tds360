import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import AppLayout from '@/components/layout/AppLayout'
import DashboardsPageContent from '@/features/dashboards/DashboardsPage'
import AnalyticsPageContent from '@/features/analytics/AnalyticsPage'
import { useScreenPermissions, SCREEN_DEFAULTS } from '@/hooks/useScreenPermissions'

const ROLE_HOME = {
  cs:          '/clients',
  manager:     '/analytics',
  admin:       '/analytics',
  super_admin: '/analytics',
}

export function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <PageLoading />
  if (!user) return <Navigate to="/login" replace />
  return children
}

export function RequireRole({ roles, screen, children }) {
  const { profile, loading } = useAuth()
  const { data: permissions } = useScreenPermissions()
  if (loading) return <PageLoading />
  // super_admin sempre tem acesso
  if (profile?.role === 'super_admin') return children
  // Se screen fornecida, usa permissões do DB (com fallback para defaults estáticos)
  const allowedRoles = screen
    ? (permissions?.[screen]?.roles ?? SCREEN_DEFAULTS[screen]?.roles ?? [])
    : (roles ?? [])
  if (!allowedRoles.includes(profile?.role)) {
    return <Navigate to={ROLE_HOME[profile?.role] || '/login'} replace />
  }
  return children
}

export function RoleHome() {
  const { profile, loading, user } = useAuth()
  if (loading) return <PageLoading />
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={ROLE_HOME[profile?.role] || '/clients'} replace />
}

function PageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export function AnalyticsPage() {
  return (
    <RequireAuth>
      <RequireRole screen="analytics">
        <AppLayout><AnalyticsPageContent /></AppLayout>
      </RequireRole>
    </RequireAuth>
  )
}

export function DashboardsPage() {
  return (
    <RequireAuth>
      <RequireRole screen="dashboards">
        <AppLayout><DashboardsPageContent /></AppLayout>
      </RequireRole>
    </RequireAuth>
  )
}
