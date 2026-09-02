import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

const KEY = ['users']

export function useUsers() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, nome, role, ativo, created_at')
        .order('nome')
      if (error) throw error
      return data ?? []
    },
  })
}

// Convida usuário via Edge Function (usa service role server-side)
// Fluxo: cria auth.users → trigger cria profile → envia e-mail PASSWORD_RECOVERY
export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ email, nome, role }) => {
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: { email, nome, role, siteUrl: window.location.origin },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      return { email }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useUpdateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }) => {
      const { error } = await supabase.from('profiles').update(data).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}
