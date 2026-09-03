import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import AppLayout from '@/components/layout/AppLayout'
import ComingSoon from '@/components/shared/ComingSoon'
import DashboardsPageContent from '@/features/dashboards/DashboardsPage'

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

export function RequireRole({ roles, children }) {
  const { profile, loading } = useAuth()
  if (loading) return <PageLoading />
  if (!roles.includes(profile?.role)) {
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
      <RequireRole roles={['super_admin','admin','manager']}>
        <AppLayout><ComingSoon title="Analytics CS" /></AppLayout>
      </RequireRole>
    </RequireAuth>
  )
}

export function DashboardsPage() {
  return (
    <RequireAuth>
      <RequireRole roles={['super_admin','admin','manager','cs']}>
        <AppLayout><DashboardsPageContent /></AppLayout>
      </RequireRole>
    </RequireAuth>
  )
}
