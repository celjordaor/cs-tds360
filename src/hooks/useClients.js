import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

const KEY = ['clients']

export function useClients(filters = {}) {
  return useQuery({
    queryKey: [...KEY, filters],
    queryFn: async () => {
      let q = supabase
        .from('clients')
        .select(`*, projects(id, responsavel_cs_id, apoio_cs_id, onboarding_pct, sistemas_contratados, responsavel_cs:profiles!responsavel_cs_id(nome), contacts(nome, cargo, is_sponsor))`)
        .order('razao_social')

      if (filters.search) q = q.ilike('razao_social', `%${filters.search}%`)
      if (filters.status)  q = q.eq('status', filters.status)

      const { data, error } = await q
      if (error) throw error
      return data ?? []
    },
  })
}

export function useClient(id) {
  return useQuery({
    queryKey: [...KEY, id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

export function useProject(clientId) {
  return useQuery({
    queryKey: ['projects', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*, responsavel_cs:profiles!responsavel_cs_id(nome)')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data
    },
    enabled: !!clientId,
  })
}

export function useContacts(projectId) {
  return useQuery({
    queryKey: ['contacts', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('project_id', projectId)
        .order('ordem')
      if (error) throw error
      return data ?? []
    },
    enabled: !!projectId,
  })
}

export function useCreateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ client, project }) => {
      // 1. Cria o cliente
      const { data: c, error: ce } = await supabase.from('clients').insert(client).select().single()
      if (ce) throw ce

      // 2. Separa sistemas_contratados (TEXT[]) e filtra colunas válidas de projects
      //    evitando bug ?columns= do PostgREST e colunas inexistentes na tabela
      const { sistemas_contratados, ...projectRaw } = project
      const projectBase = Object.fromEntries(
        Object.entries(projectRaw).filter(([k]) => PROJECT_COLS.has(k))
      )
      const { data: p, error: pe } = await supabase
        .from('projects')
        .insert({ ...projectBase, client_id: c.id })
        .select()
        .single()
      if (pe) throw pe

      // 3. Atualiza sistemas_contratados separadamente (PATCH não adiciona ?columns=)
      if (sistemas_contratados?.length) {
        const { error: se } = await supabase
          .from('projects')
          .update({ sistemas_contratados })
          .eq('id', p.id)
        if (se) throw se
      }

      return { client: c, project: p }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

// Colunas válidas da tabela clients — nunca enviar campo inexistente ao banco
const CLIENT_COLS = new Set([
  'razao_social','fantasia','cnpj','cep','cidade','estado','segmentos','status','created_by',
])
// Colunas válidas da tabela projects
const PROJECT_COLS = new Set([
  'sistemas_contratados','contrato_numero','data_assinatura','data_kickoff',
  'data_golive_prevista','data_golive_real','responsavel_comercial','responsavel_cs_id',
  'apoio_cs_id','responsavel_tecnico_id','movidesk_id','sensedata_id',
  'licencas_midiaplus','licencas_adsim','licencas_adanalytics','licencas_adchecking',
  'alertas_suporte','obs_geral','onboarding_pct','config_tecnica','anotacoes',
])

export function useUpdateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }) => {
      const clean = Object.fromEntries(Object.entries(data).filter(([k]) => CLIENT_COLS.has(k)))
      const { error } = await supabase.from('clients').update(clean).eq('id', id)
      if (error) throw error
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: [...KEY, v.id] }),
  })
}

export function useUpdateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }) => {
      const clean = Object.fromEntries(Object.entries(data).filter(([k]) => PROJECT_COLS.has(k)))
      const { error } = await supabase.from('projects').update(clean).eq('id', id)
      if (error) throw error
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['projects'] }),
  })
}

export function useUpsertContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (contact) => {
      if (contact.id) {
        const { error } = await supabase.from('contacts').update(contact).eq('id', contact.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('contacts').insert(contact)
        if (error) throw error
      }
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['contacts', v.project_id] }),
  })
}

export function useDeleteContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, project_id }) => {
      const { error } = await supabase.from('contacts').delete().eq('id', id)
      if (error) throw error
      return { project_id }
    },
    onSuccess: (r) => qc.invalidateQueries({ queryKey: ['contacts', r.project_id] }),
  })
}

export function useDeleteClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (clientId) => {
      // Busca projetos para deletar dependentes em cascata
      const { data: projs, error: pe } = await supabase
        .from('projects').select('id').eq('client_id', clientId)
      if (pe) throw pe

      const projIds = (projs ?? []).map(p => p.id)

      if (projIds.length > 0) {
        const { error: e1 } = await supabase.from('client_users').delete().in('project_id', projIds)
        if (e1) throw e1
        const { error: e2 } = await supabase.from('contacts').delete().in('project_id', projIds)
        if (e2) throw e2
        const { error: e3 } = await supabase.from('projects').delete().in('id', projIds)
        if (e3) throw e3
      }

      const { error } = await supabase.from('clients').delete().eq('id', clientId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  })
}
