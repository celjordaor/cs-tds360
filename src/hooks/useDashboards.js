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
      // Força Content-Type text/html;charset=utf-8 independente do browser/SO.
      // Sem o Blob explícito, alguns browsers enviam application/octet-stream
      // e o Storage serve o arquivo como texto puro (fonte visível no browser).
      const htmlBlob = new Blob([file], { type: 'text/html; charset=utf-8' })

      const { error: uploadError } = await supabase.storage
        .from('dashboards')
        .upload(storagePath, htmlBlob, {
          upsert: true,
          contentType: 'text/html; charset=utf-8',
        })
      if (uploadError) throw uploadError

      // Atualiza metadados na tabela
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
 */
export function getDashboardUrl(storagePath) {
  return supabase.storage.from('dashboards').getPublicUrl(storagePath).data.publicUrl
}
