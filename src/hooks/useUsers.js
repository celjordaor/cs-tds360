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

// Pré-cria perfil e envia e-mail de convite com link para definir senha
export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ email, nome, role }) => {
      const tempId = crypto.randomUUID()
      const { error: pe } = await supabase.from('profiles').insert({
        id: tempId, email, nome, role, ativo: true,
      })
      if (pe) throw pe
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
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
