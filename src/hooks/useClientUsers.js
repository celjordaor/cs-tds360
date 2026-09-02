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

function buildPayload(u, projectId) {
  return {
    project_id: projectId,
    nome:    u.nome    ?? '',
    email:   u.email   ?? '',
    perfil:  u.perfil  ?? '',
    login:   u.login   ?? '',
    sistemas: Array.isArray(u.sistemas) ? u.sistemas : [],
    ativo:   u.ativo   ?? true,
  }
}

export function useSaveClientUsers(projectId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ toInsert, toUpdate, toDelete }) => {
      // 1. Remove excluídos
      if (toDelete.length) {
        const { error } = await supabase
          .from('client_users')
          .delete()
          .in('id', toDelete)
        if (error) throw error
      }

      // 2. Insere novos (sem upsert para evitar bug do columns TEXT[])
      if (toInsert.length) {
        const rows = toInsert.map(u => ({ id: u.id, ...buildPayload(u, projectId) }))
        const { error } = await supabase.from('client_users').insert(rows)
        if (error) throw error
      }

      // 3. Atualiza existentes (update individual por id)
      for (const u of toUpdate) {
        const { error } = await supabase
          .from('client_users')
          .update(buildPayload(u, projectId))
          .eq('id', u.id)
        if (error) throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [...KEY, projectId] }),
  })
}
