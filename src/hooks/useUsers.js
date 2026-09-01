import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

const KEY = ['users']

export function useUsers() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, ativo, created_at')
        .order('full_name')
      if (error) throw error
      return data ?? []
    },
  })
}

// Cria um perfil pré-cadastrado (sem UUID de Auth ainda)
// O usuário recebe o link de reset de senha para ativar a conta
export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ email, full_name, role }) => {
      // Pré-cria o perfil com UUID temporário
      const tempId = crypto.randomUUID()
      const { error: pe } = await supabase.from('profiles').insert({
        id: tempId, email, full_name, role, ativo: true,
      })
      if (pe) throw pe
      // Envia "reset password" (funciona como convite se o email não existe ainda no Auth)
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
