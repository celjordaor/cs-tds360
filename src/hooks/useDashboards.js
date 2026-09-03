import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

const KEY = ['dashboards']

export function useDashboards() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dashboards')
        .select('*')
        .eq('ativo', true)
        .order('ordem')
      if (error) throw error
      return data ?? []
    },
  })
}

export function useUploadDashboard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, storagePath, file }) => {
      // 1. Upload (upsert) do HTML no Storage
      const { error: uploadError } = await supabase.storage
        .from('dashboards')
        .upload(storagePath, file, {
          upsert: true,
          contentType: 'text/html',
        })
      if (uploadError) throw uploadError

      // 2. Atualiza metadados na tabela
      const { error: updateError } = await supabase
        .from('dashboards')
        .update({
          atualizado_em: new Date().toISOString(),
          tamanho_kb: Math.round(file.size / 1024),
        })
        .eq('id', id)
      if (updateError) throw updateError
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

/**
 * Retorna a URL pública do HTML de um dashboard no Storage.
 * Chamar fora de hooks (ex: no href de <a> ou window.open).
 */
export function getDashboardUrl(storagePath) {
  return supabase.storage.from('dashboards').getPublicUrl(storagePath).data.publicUrl
}
