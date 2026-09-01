import { NavLink, useNavigate } from 'react-router-dom'
import { BarChart2, TrendingUp, Users, Settings, LogOut, ChevronRight } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { getInitials } from '@/lib/utils'

const NAV_ITEMS = [
  { label: 'Analytics CS',      icon: BarChart2,   to: '/analytics',  roles: ['super_admin','admin','manager'] },
  { label: 'Dashboards',        icon: TrendingUp,  to: '/dashboards', roles: ['super_admin','admin','manager'] },
  { label: 'Customer Success',  icon: Users,       to: '/clients',    roles: ['super_admin','admin','manager','cs'] },
  { label: 'Configurações',     icon: Settings,    to: '/settings',   roles: ['super_admin','admin'] },
]

const ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin: 'Administrador',
  manager: 'Gerente CS',
  cs: 'Analista CS',
}

export default function Sidebar() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  const visibleItems = NAV_ITEMS.filter(item => profile?.role && item.roles.includes(profile.role))

  async function handleSignOut() { await signOut(); navigate('/login') }

  const displayName = profile?.full_name || profile?.nome || ''

  return (
    <aside className="w-64 min-h-screen bg-slate-900 flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-orange-500 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">CS</span>
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">TDSOFT</p>
            <p className="text-slate-400 text-xs leading-tight">Customer Success</p>
          </div>
        </div>
      </div>

      {/* Perfil */}
      <div className="px-6 py-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-500/20 border border-orange-500/30 rounded-full flex items-center justify-center shrink-0">
            <span className="text-orange-400 text-xs font-semibold">{getInitials(displayName)}</span>
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{displayName || '…'}</p>
            <p className="text-slate-400 text-xs">{ROLE_LABELS[profile?.role] || ''}</p>
          </div>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {visibleItems.map(({ label, icon: Icon, to }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors group
              ${isActive ? 'bg-orange-500/15 text-orange-400 font-medium' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-orange-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight className="w-3 h-3 text-orange-400/60" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-slate-800">
        <button onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors w-full">
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  )
}
