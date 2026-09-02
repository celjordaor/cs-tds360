import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useProfilesCS() {
  return useQuery({
    queryKey: ['profiles', 'cs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nome, email, role')
        .in('role', ['cs', 'manager', 'admin', 'super_admin'])
        .eq('ativo', true)
        .order('nome')
      if (error) throw error
      return (data ?? []).map(p => ({ value: p.id, label: p.nome, sublabel: p.email }))
    },
    staleTime: 5 * 60 * 1000,
  })
}
