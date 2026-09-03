import { useScreenPermissions, useUpdateScreenPermission, SCREEN_DEFAULTS } from '@/hooks/useScreenPermissions'
import Spinner from '@/components/ui/Spinner'

const ROLES_CFG = [
  { value: 'cs',          label: 'Analista CS' },
  { value: 'manager',     label: 'Gerente'     },
  { value: 'admin',       label: 'Admin'       },
  { value: 'super_admin', label: 'Super Admin' },
]

const SCREENS_ORDER = ['clients', 'analytics', 'dashboards', 'settings']

export default function AccessProfilesTab() {
  const { data: permissions, isLoading } = useScreenPermissions()
  const updatePerm = useUpdateScreenPermission()

  function toggleRole(screen, role) {
    if (role === 'super_admin') return // sempre habilitado, imutável
    const current = permissions?.[screen]?.roles ?? SCREEN_DEFAULTS[screen]?.roles ?? []
    const next = current.includes(role)
      ? current.filter(r => r !== role)
      : [...current, role]
    // super_admin sempre presente
    if (!next.includes('super_admin')) next.push('super_admin')
    updatePerm.mutate({ screen, roles: next })
  }

  if (isLoading) {
    return <div className="flex justify-center py-12"><Spinner size="lg" /></div>
  }

  return (
    <div>
      <div className="mb-5">
        <h3 className="font-semibold text-slate-800">Perfis de acesso por tela</h3>
        <p className="text-sm text-slate-500 mt-0.5">
          Defina quais perfis têm acesso a cada tela do sistema.
          Super Admin sempre tem acesso a tudo e não pode ser removido.
        </p>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-48">
                Tela
              </th>
              {ROLES_CFG.map(r => (
                <th key={r.value}
                    className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {r.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {SCREENS_ORDER.map(screen => {
              const perm        = permissions?.[screen] ?? SCREEN_DEFAULTS[screen]
              const activeRoles = perm?.roles ?? []
              return (
                <tr key={screen} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-slate-800">
                    {perm?.label ?? screen}
                  </td>
                  {ROLES_CFG.map(r => {
                    const isActive   = activeRoles.includes(r.value)
                    const isDisabled = r.value === 'super_admin'
                    return (
                      <td key={r.value} className="px-4 py-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isActive}
                          disabled={isDisabled}
                          onChange={() => toggleRole(screen, r.value)}
                          className="w-4 h-4 rounded border-slate-300 text-orange-500
                                     focus:ring-orange-500 focus:ring-offset-0
                                     disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        />
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-400 mt-3">
        Alterações têm efeito imediato. Usuários já logados verão a mudança na próxima navegação.
      </p>
    </div>
  )
}
