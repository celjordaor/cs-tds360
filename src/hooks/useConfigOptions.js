import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

// Lê opções de uma categoria específica
export function useConfigOptions(category) {
  return useQuery({
    queryKey: ['config_options', category],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('config_options')
        .select('id, value, label, ordem, ativo')
        .eq('category', category)
        .order('ordem')
      if (error) throw error
      return data ?? []
    },
    staleTime: 10 * 60 * 1000,
  })
}

// Versão só com ativos (para usar em selects)
export function useConfigOptionsActive(category) {
  const { data = [], ...rest } = useConfigOptions(category)
  return {
    ...rest,
    data: data.filter(o => o.ativo).map(o => ({ value: o.value, label: o.label })),
  }
}

// CRUD
export function useCreateConfigOption() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ category, value, label, ordem }) => {
      const { error } = await supabase.from('config_options').insert({ category, value, label, ordem })
      if (error) throw error
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['config_options', v.category] }),
  })
}

export function useUpdateConfigOption() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, category, ...data }) => {
      const { error } = await supabase.from('config_options').update(data).eq('id', id)
      if (error) throw error
      return { category }
    },
    onSuccess: (r) => qc.invalidateQueries({ queryKey: ['config_options', r.category] }),
  })
}

export function useDeleteConfigOption() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, category }) => {
      const { error } = await supabase.from('config_options').delete().eq('id', id)
      if (error) throw error
      return { category }
    },
    onSuccess: (r) => qc.invalidateQueries({ queryKey: ['config_options', r.category] }),
  })
}
