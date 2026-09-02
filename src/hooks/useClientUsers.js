import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

const KEY = ['client_users']

export function useClientUsers(projectId) {
  return useQuery({
    queryKey: [...KEY, projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_users')
        .select('id, project_id, nome, email, perfil, login, sistemas, ativo, created_at')
        .eq('project_id', projectId)
        .order('created_at')
      if (error) throw error
      return data ?? []
    },
    enabled: !!projectId,
  })
}

export function useSaveClientUsers(projectId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ toUpsert, toDelete }) => {
      // 1. Deleta os removidos
      if (toDelete.length) {
        const { error } = await supabase
          .from('client_users')
          .delete()
          .in('id', toDelete)
        if (error) throw error
      }

      // 2. Upsert com payload limpo e onConflict explícito
      if (toUpsert.length) {
        const payload = toUpsert.map(u => ({
          id:         u.id,
          project_id: projectId,
          nome:       u.nome   ?? '',
          email:      u.email  ?? '',
          perfil:     u.perfil ?? '',
          login:      u.login  ?? '',
          sistemas:   Array.isArray(u.sistemas) ? u.sistemas : [],
          ativo:      u.ativo  ?? true,
        }))
        const { error } = await supabase
          .from('client_users')
          .upsert(payload, { onConflict: 'id', ignoreDuplicates: false })
        if (error) throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [...KEY, projectId] }),
  })
}
