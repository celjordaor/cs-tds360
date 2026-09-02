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
    mutationFn: async ({ toInsert, toUpdate, toDelete }) => {
      // 1. Remove excluídos
      if (toDelete?.length) {
        const { error } = await supabase
          .from('client_users')
          .delete()
          .in('id', toDelete)
        if (error) throw error
      }

      // 2. Insere e atualiza via RPC — evita o bug columns+TEXT[] do PostgREST
      //    supabase-js v2 adiciona ?columns= mesmo no .insert(), quebrando TEXT[].
      //    Chamadas RPC vão para /rpc/... sem esse parâmetro.
      const toSave = [...(toInsert ?? []), ...(toUpdate ?? [])]
      for (const u of toSave) {
        const { error } = await supabase.rpc('upsert_client_user', {
          p_id:         u.id,
          p_project_id: projectId,
          p_nome:       u.nome   ?? '',
          p_email:      u.email  ?? '',
          p_perfil:     u.perfil ?? '',
          p_login:      u.login  ?? '',
          p_sistemas:   Array.isArray(u.sistemas) ? u.sistemas : [],
          p_ativo:      u.ativo  ?? true,
        })
        if (error) throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [...KEY, projectId] }),
  })
}
