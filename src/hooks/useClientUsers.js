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
          .from('client_users').delete().in('id', toDelete)
        if (error) throw error
      }

      // 2. Insere novos SEM sistemas (INSERT/POST adiciona ?columns= e quebra TEXT[])
      //    Depois faz UPDATE do sistemas separado (PATCH não adiciona ?columns=)
      if (toInsert?.length) {
        const base = toInsert.map(u => ({
          id:         u.id,
          project_id: projectId,
          nome:       u.nome   ?? '',
          email:      u.email  ?? '',
          perfil:     u.perfil ?? '',
          login:      u.login  ?? '',
          ativo:      u.ativo  ?? true,
          // sistemas omitido aqui — será atualizado abaixo
        }))
        const { error } = await supabase.from('client_users').insert(base)
        if (error) throw error

        // Agora atualiza sistemas via UPDATE (sem ?columns=)
        for (const u of toInsert) {
          const { error: e2 } = await supabase
            .from('client_users')
            .update({ sistemas: Array.isArray(u.sistemas) ? u.sistemas : [] })
            .eq('id', u.id)
          if (e2) throw e2
        }
      }

      // 3. Atualiza existentes (UPDATE/PATCH não tem o bug de ?columns=)
      for (const u of (toUpdate ?? [])) {
        const { error } = await supabase
          .from('client_users')
          .update({
            nome:     u.nome   ?? '',
            email:    u.email  ?? '',
            perfil:   u.perfil ?? '',
            login:    u.login  ?? '',
            sistemas: Array.isArray(u.sistemas) ? u.sistemas : [],
            ativo:    u.ativo  ?? true,
          })
          .eq('id', u.id)
        if (error) throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [...KEY, projectId] }),
  })
}
