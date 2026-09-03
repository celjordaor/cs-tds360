import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

const KEY = ['screen_permissions']

// Defaults estáticos — fallback enquanto o DB carrega ou em caso de erro
export const SCREEN_DEFAULTS = {
  clients:    { screen: 'clients',    label: 'Customer Success', roles: ['super_admin','admin','manager','cs'] },
  dashboards: { screen: 'dashboards', label: 'Dashboards',       roles: ['super_admin','admin','manager','cs'] },
  analytics:  { screen: 'analytics',  label: 'Analytics CS',     roles: ['super_admin','admin','manager'] },
  settings:   { screen: 'settings',   label: 'Configurações',    roles: ['super_admin','admin'] },
}

export function useScreenPermissions() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase.from('screen_permissions').select('*')
      if (error) throw error
      return Object.fromEntries((data ?? []).map(r => [r.screen, r]))
    },
    staleTime: 60_000,
    placeholderData: SCREEN_DEFAULTS, // renderiza imediatamente com defaults
  })
}

export function useUpdateScreenPermission() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ screen, roles }) => {
      const { error } = await supabase
        .from('screen_permissions')
        .update({ roles, updated_at: new Date().toISOString() })
        .eq('screen', screen)
      if (error) throw error
    },
    onMutate: async ({ screen, roles }) => {
      await qc.cancelQueries({ queryKey: KEY })
      const previous = qc.getQueryData(KEY)
      qc.setQueryData(KEY, old =>
        old ? { ...old, [screen]: { ...(old[screen] ?? {}), roles } } : old
      )
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(KEY, ctx.previous)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}
