import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useProfilesCS() {
  return useQuery({
    queryKey: ['profiles', 'cs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .in('role', ['cs', 'manager', 'admin', 'super_admin'])
        .eq('ativo', true)
        .order('full_name')
      if (error) throw error
      return (data ?? []).map(p => ({ value: p.id, label: p.full_name, sublabel: p.email }))
    },
    staleTime: 5 * 60 * 1000,
  })
}
