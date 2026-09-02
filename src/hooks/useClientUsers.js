import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

const KEY = ['client_users']

export function useClientUsers(projectId) {
  return useQuery({
    queryKey: [...KEY, projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_users')
        .select('*')
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
      if (toDelete.length) {
        const { error } = await supabase.from('client_users').delete().in('id', toDelete)
        if (error) throw error
      }
      if (toUpsert.length) {
        const { error } = await supabase
          .from('client_users')
          .upsert(toUpsert.map(u => ({ ...u, project_id: projectId })))
        if (error) throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [...KEY, projectId] }),
  })
}
