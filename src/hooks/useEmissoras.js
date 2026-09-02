import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

const KEY = ['emissoras']

/**
 * Busca emissoras com veículos e praças aninhados para um projeto.
 * Ordenados por campo `ordem` em cada nível.
 */
export function useEmissoras(projectId) {
  return useQuery({
    queryKey: [...KEY, projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('emissoras')
        .select(`
          *,
          veiculos(
            *,
            pracas(*)
          )
        `)
        .eq('project_id', projectId)
        .order('ordem')
        .order('ordem', { foreignTable: 'veiculos' })
      if (error) throw error
      return data ?? []
    },
    enabled: !!projectId,
  })
}

/**
 * Salva o estado completo da árvore de emissoras de um projeto.
 *
 * Payload:
 *   toUpsert  — array de emissoras (com veiculos[].pracas[] aninhados)
 *   toDelete  — { emissoras: [id], veiculos: [id], pracas: [id] }
 *
 * Ordem de operações:
 *   1. Delete pracas removidas (CASCADE dispensável, mas explícito para segurança)
 *   2. Delete veiculos removidos
 *   3. Delete emissoras removidas
 *   4. Upsert emissoras (flat)
 *   5. Upsert veiculos de cada emissora (flat, emissora_id já está no objeto)
 *   6. Upsert pracas de cada veículo (flat, veiculo_id já está no objeto)
 */
export function useSaveEmissoras(projectId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ toUpsert, toDelete }) => {
      // 1–3: deletes (ordem importa por FK)
      if (toDelete.pracas.length) {
        const { error } = await supabase.from('pracas').delete().in('id', toDelete.pracas)
        if (error) throw error
      }
      if (toDelete.veiculos.length) {
        const { error } = await supabase.from('veiculos').delete().in('id', toDelete.veiculos)
        if (error) throw error
      }
      if (toDelete.emissoras.length) {
        const { error } = await supabase.from('emissoras').delete().in('id', toDelete.emissoras)
        if (error) throw error
      }

      // 4: upsert emissoras (sem os filhos)
      const emissorasFlat = toUpsert.map(({ veiculos: _v, ...em }) => ({
        ...em,
        project_id: projectId,
      }))
      if (emissorasFlat.length) {
        const { error } = await supabase.from('emissoras').upsert(emissorasFlat)
        if (error) throw error
      }

      // 5: upsert veiculos (sem as praças)
      const veiculosFlat = toUpsert.flatMap(em =>
        (em.veiculos ?? []).map(({ pracas: _p, ...v }) => ({
          ...v,
          emissora_id: em.id,
        }))
      )
      if (veiculosFlat.length) {
        const { error } = await supabase.from('veiculos').upsert(veiculosFlat)
        if (error) throw error
      }

      // 6: upsert pracas (flat)
      const pracasFlat = toUpsert.flatMap(em =>
        (em.veiculos ?? []).flatMap(v =>
          (v.pracas ?? []).map(p => ({ ...p, veiculo_id: v.id }))
        )
      )
      if (pracasFlat.length) {
        const { error } = await supabase.from('pracas').upsert(pracasFlat)
        if (error) throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [...KEY, projectId] }),
  })
}
