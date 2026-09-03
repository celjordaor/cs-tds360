import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useClient } from '@/hooks/useClients'
import { useContacts } from '@/hooks/useClients'
import { useClientUsers } from '@/hooks/useClientUsers'
import { useEmissoras } from '@/hooks/useEmissoras'

// ── Query de projeto com todos os perfis ──────────────────────────────────────

function useProjectFull(clientId) {
  return useQuery({
    queryKey: ['project_export', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          responsavel_cs:profiles!responsavel_cs_id(nome),
          apoio_cs:profiles!apoio_cs_id(nome),
          responsavel_tecnico:profiles!responsavel_tecnico_id(nome)
        `)
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function fDate(str) {
  if (!str) return null
  const [y, m, d] = str.split('-')
  return `${d}/${m}/${y}`
}

function fVal(v) {
  if (v === null || v === undefined || v === '') return null
  return String(v)
}

const STATUS_LABEL = {
  prospecto:   'Prospecto',
  implantacao: 'Implantação',
  ativo:       'Ativo',
  pausado:     'Pausado',
  cancelado:   'Cancelado',
}

const PROJ_STATUS_LABEL = {
  em_andamento: 'Em andamento',
  concluido:    'Concluído',
  cancelado:    'Cancelado',
  pausado:      'Pausado',
}

const STATUS_OPT_LABEL = {
  nao_aplicavel: 'Não aplicável',
  pendente:      'Pendente',
  em_andamento:  'Em andamento',
  concluido:     'Concluído',
  aprovada:      'Aprovada',
  reprovada:     'Reprovada',
}

function label(map, v) {
  return map[v] || v || '—'
}

// ── Componentes de layout ─────────────────────────────────────────────────────

function Section({ title, color = '#F97316', children, avoidBreak = true }) {
  return (
    <div style={{ marginBottom: 28, pageBreakInside: avoidBreak ? 'avoid' : 'auto' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        borderLeft: `4px solid ${color}`, paddingLeft: 10,
        marginBottom: 12,
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569' }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  )
}

function FieldGrid({ fields }) {
  // fields = [{ label, value }] — renderiza em 2 colunas
  const pairs = fields.filter(f => f.value != null && f.value !== '')
  if (!pairs.length) return <Empty />
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px' }}>
      {pairs.map((f, i) => (
        <div key={i} style={{ display: 'flex', gap: 6, borderBottom: '1px solid #f1f5f9', padding: '5px 0', alignItems: 'flex-start' }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', minWidth: 130, flexShrink: 0, paddingTop: 1 }}>{f.label}</span>
          <span style={{ fontSize: 11, color: '#1e293b', lineHeight: 1.4 }}>{f.value}</span>
        </div>
      ))}
    </div>
  )
}

function DataTable({ cols, rows }) {
  if (!rows.length) return <Empty />
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
      <thead>
        <tr style={{ background: '#f8fafc' }}>
          {cols.map((c, i) => (
            <th key={i} style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 700, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
            {r.map((cell, j) => (
              <td key={j} style={{ padding: '5px 8px', color: '#334155', borderBottom: '1px solid #f1f5f9', verticalAlign: 'top' }}>
                {cell ?? '—'}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function Empty() {
  return <p style={{ fontSize: 10, color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>Não informado</p>
}

function Pill({ children, bg = '#fff7ed', color = '#9a3412', border = '#fed7aa' }) {
  return (
    <span style={{ display: 'inline-block', background: bg, color, border: `1px solid ${border}`, borderRadius: 4, padding: '1px 8px', fontSize: 10, fontWeight: 600, marginRight: 4 }}>
      {children}
    </span>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function ClientExportPage() {
  const { id } = useParams()
  const autoprint = new URLSearchParams(window.location.search).get('autoprint') === '1'

  const { data: client, isLoading: lc } = useClient(id)
  const { data: project, isLoading: lp } = useProjectFull(id)
  const { data: contacts = [], isLoading: lco } = useContacts(project?.id)
  const { data: clientUsers = [], isLoading: lu } = useClientUsers(project?.id)
  const { data: emissoras = [], isLoading: le } = useEmissoras(project?.id)

  const loading = lc || lp || lco || lu || le
  const ready   = !loading && !!client

  const exportDate = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

  // Define document.title para nomear o arquivo ao salvar como PDF
  useEffect(() => {
    if (!client) return
    const today = new Date()
    const dd   = String(today.getDate()).padStart(2, '0')
    const mm   = String(today.getMonth() + 1).padStart(2, '0')
    const aaaa = today.getFullYear()
    const nome = client.fantasia || client.razao_social
    document.title = `TDS - ${nome} - Resumo onboarding - ${dd}-${mm}-${aaaa}`
    return () => { document.title = 'Portal CS TDSOFT' }
  }, [client])

  useEffect(() => {
    if (autoprint && ready) {
      const t = setTimeout(() => window.print(), 600)
      return () => clearTimeout(t)
    }
  }, [autoprint, ready])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', color: '#64748b' }}>
        <div>Carregando ficha do cliente…</div>
      </div>
    )
  }
  if (!client) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', color: '#64748b' }}>
        Cliente não encontrado.
      </div>
    )
  }

  const ct = project?.config_tecnica ?? {}
  const sistemas = project?.sistemas_contratados ?? []
  const hasAdsim    = sistemas.includes('adsim')
  const hasMidiaplus = sistemas.includes('midiaplus')

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
          @page { margin: 18mm 16mm; size: A4; }
        }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f1f5f9; }
      `}</style>

      {/* Barra de ações — some no print */}
      <div className="no-print" style={{ background: '#1e293b', padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <span style={{ color: '#94a3b8', fontSize: 13 }}>
          Ficha do cliente — <strong style={{ color: '#fff' }}>{client.razao_social}</strong>
        </span>
        <button
          onClick={() => window.print()}
          style={{ background: '#f97316', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          Imprimir / Salvar como PDF
        </button>
      </div>

      {/* Documento */}
      <div style={{ maxWidth: 900, margin: '24px auto 60px', background: '#fff', borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', overflow: 'hidden' }}>

        {/* Cabeçalho do documento */}
        <div style={{ background: 'linear-gradient(135deg, #fb923c, #f97316)', height: 6 }} />
        <div style={{ padding: '24px 32px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#f97316', marginBottom: 6 }}>
                TDSOFT — Portal CS
              </div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                {client.razao_social}
              </h1>
              {client.fantasia && (
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>{client.fantasia}</p>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                <Pill bg="#f0fdf4" color="#166534" border="#bbf7d0">
                  {STATUS_LABEL[client.status] || client.status}
                </Pill>
                {sistemas.map(s => (
                  <Pill key={s} bg="#f5f3ff" color="#5b21b6" border="#ddd6fe">{s}</Pill>
                ))}
                {client.cidade && (
                  <Pill bg="#f8fafc" color="#475569" border="#e2e8f0">
                    {[client.cidade, client.estado].filter(Boolean).join(' · ')}
                  </Pill>
                )}
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 10, color: '#94a3b8', flexShrink: 0, marginLeft: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>Exportado em</div>
              <div style={{ fontSize: 13, color: '#475569', fontWeight: 700 }}>{exportDate}</div>
            </div>
          </div>
        </div>

        {/* Corpo */}
        <div style={{ padding: '28px 32px' }}>

          {/* 1. Dados do Cliente */}
          <Section title="1. Dados do Cliente">
            <FieldGrid fields={[
              { label: 'Razão Social',  value: fVal(client.razao_social) },
              { label: 'Nome Fantasia', value: fVal(client.fantasia) },
              { label: 'CNPJ',         value: fVal(client.cnpj) },
              { label: 'CEP',          value: fVal(client.cep) },
              { label: 'Cidade',       value: fVal(client.cidade) },
              { label: 'Estado',       value: fVal(client.estado) },
              { label: 'Segmentos',    value: client.segmentos?.join(', ') || null },
              { label: 'Status',       value: STATUS_LABEL[client.status] || client.status },
            ]} />
          </Section>

          {/* 2. Dados do Projeto */}
          {project && (
            <Section title="2. Dados do Projeto" avoidBreak={false}>
              <FieldGrid fields={[
                { label: 'Sistemas',            value: sistemas.join(', ') || null },
                { label: 'Status',              value: PROJ_STATUS_LABEL[project.status] || project.status },
                { label: 'Nº Contrato',         value: fVal(project.contrato_numero) },
                { label: 'Data Assinatura',     value: fDate(project.data_assinatura) },
                { label: 'Data Kickoff',        value: fDate(project.data_kickoff) },
                { label: 'Go-live Previsto',    value: fDate(project.data_golive_prevista) },
                { label: 'Go-live Real',        value: fDate(project.data_golive_real) },
                { label: 'Responsável CS',      value: project.responsavel_cs?.nome || null },
                { label: 'Apoio CS',            value: project.apoio_cs?.nome || null },
                { label: 'Resp. Técnico',       value: project.responsavel_tecnico?.nome || null },
                { label: 'Resp. Comercial',     value: fVal(project.responsavel_comercial) },
                { label: 'ID Movidesk',         value: fVal(project.movidesk_id) },
                { label: 'ID Sensedata',        value: fVal(project.sensedata_id) },
                { label: 'Licenças Adsim',      value: fVal(project.licencas_adsim) },
                { label: 'Licenças Mídia+',     value: fVal(project.licencas_midiaplus) },
                { label: 'Lic. Ad Analytics',   value: fVal(project.licencas_adanalytics) },
                { label: 'Lic. Ad Checking',    value: fVal(project.licencas_adchecking) },
              ]} />
              {project.obs_geral && (
                <div style={{ marginTop: 10, padding: '8px 12px', background: '#f8fafc', borderRadius: 6, fontSize: 11, color: '#475569', borderLeft: '3px solid #e2e8f0' }}>
                  <strong>Obs. Geral:</strong> {project.obs_geral}
                </div>
              )}
              {project.alertas_suporte && (
                <div style={{ marginTop: 6, padding: '8px 12px', background: '#fff7ed', borderRadius: 6, fontSize: 11, color: '#9a3412', borderLeft: '3px solid #fed7aa' }}>
                  <strong>Alertas:</strong> {project.alertas_suporte}
                </div>
              )}
            </Section>
          )}

          {/* 3. Contatos */}
          {contacts.length > 0 && (
            <Section title="3. Contatos" avoidBreak={false}>
              <DataTable
                cols={['Nome', 'Cargo', 'Telefone', 'E-mail', 'Responsabilidade', 'Sponsor']}
                rows={contacts.map(c => [
                  c.nome,
                  c.cargo,
                  c.telefone,
                  c.email,
                  c.responsabilidade,
                  c.is_sponsor ? '⭐ Sim' : 'Não',
                ])}
              />
            </Section>
          )}

          {/* 4. Configuração Técnica */}
          {project && (
            <Section title="4. Configuração Técnica" avoidBreak={false}>

              {/* Módulos */}
              {((ct.modulos_adsim?.length || 0) + (ct.modulos_midiaplus?.length || 0) > 0) && (
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Módulos Ativados</div>
                  {ct.modulos_adsim?.length > 0 && (
                    <div style={{ marginBottom: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: '#7c3aed', marginRight: 8 }}>Adsim</span>
                      {ct.modulos_adsim.map(m => <Pill key={m} bg="#f5f3ff" color="#5b21b6" border="#ddd6fe">{m}</Pill>)}
                    </div>
                  )}
                  {ct.modulos_midiaplus?.length > 0 && (
                    <div>
                      <span style={{ fontSize: 10, fontWeight: 600, color: '#2563eb', marginRight: 8 }}>Mídia+</span>
                      {ct.modulos_midiaplus.map(m => <Pill key={m} bg="#eff6ff" color="#1e40af" border="#bfdbfe">{m}</Pill>)}
                    </div>
                  )}
                </div>
              )}

              {/* Config AD */}
              {hasAdsim && ct.adsim && (ct.adsim.ad_status || ct.adsim.ad_servidor) && (
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Active Directory (Adsim)</div>
                  <FieldGrid fields={[
                    { label: 'Status AD',   value: label(STATUS_OPT_LABEL, ct.adsim.ad_status) },
                    { label: 'Servidor AD', value: fVal(ct.adsim.ad_servidor) },
                    { label: 'Observações', value: fVal(ct.adsim.ad_obs) },
                  ]} />
                  {ct.adsim.pipelines?.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Pipelines</div>
                      <DataTable
                        cols={['Pipeline', 'Etapas', 'Travas']}
                        rows={ct.adsim.pipelines.map(p => [p.pipeline, p.etapas, p.travas])}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Config Mídia+ */}
              {hasMidiaplus && ct.midiaplus && (ct.midiaplus.adchecking_status || ct.midiaplus.adchecking_exibidores) && (
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Configuração Mídia+</div>
                  <FieldGrid fields={[
                    { label: 'Status Adchecking',    value: label(STATUS_OPT_LABEL, ct.midiaplus.adchecking_status) },
                    { label: 'Exibidores',           value: fVal(ct.midiaplus.adchecking_exibidores) },
                    { label: 'Obs. Adchecking',      value: fVal(ct.midiaplus.adchecking_obs) },
                    { label: 'Tipos de Negociação',  value: fVal(ct.midiaplus.tipos_negociacao) },
                    { label: 'Naturezas',            value: fVal(ct.midiaplus.naturezas) },
                    { label: 'Cond. Pagamento',      value: fVal(ct.midiaplus.condicoes_pagamento) },
                  ]} />
                </div>
              )}

              {/* Migrações */}
              {ct.migracoes?.length > 0 && (
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Migrações de Dados</div>
                  <DataTable
                    cols={['Sistema', 'Descrição', 'Origem', 'Responsável', 'Data', 'Status']}
                    rows={ct.migracoes.map(m => [m.sistema, m.descricao, m.origem, m.responsavel, fDate(m.data), label(STATUS_OPT_LABEL, m.status)])}
                  />
                </div>
              )}

              {/* Integrações */}
              {ct.integracoes?.length > 0 && (
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Integrações</div>
                  <DataTable
                    cols={['Sistema', 'Tipo', 'Status', 'Observações']}
                    rows={ct.integracoes.map(i => [i.sistema, i.tipo, label(STATUS_OPT_LABEL, i.status), i.obs])}
                  />
                </div>
              )}

              {/* Validação */}
              {ct.validacao && (ct.validacao.status || ct.validacao.data) && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Validação Interna</div>
                  <FieldGrid fields={[
                    { label: 'Status',    value: label(STATUS_OPT_LABEL, ct.validacao.status) },
                    { label: 'Data',      value: fDate(ct.validacao.data) },
                    { label: 'Obs.',      value: fVal(ct.validacao.obs) },
                  ]} />
                </div>
              )}

              {!ct.adsim && !ct.midiaplus && !ct.migracoes?.length && !ct.integracoes?.length && (
                <Empty />
              )}
            </Section>
          )}

          {/* 5. Usuários do Cliente */}
          {project && (
            <Section title="5. Usuários do Cliente" avoidBreak={false}>
              {clientUsers.length > 0 ? (
                <DataTable
                  cols={['Nome', 'E-mail', 'Perfil', 'Login', 'Sistemas', 'Ativo']}
                  rows={clientUsers.map(u => [
                    u.nome,
                    u.email,
                    u.perfil,
                    u.login,
                    u.sistemas?.join(', ') || '—',
                    u.ativo ? 'Sim' : 'Não',
                  ])}
                />
              ) : (
                <Empty />
              )}
            </Section>
          )}

          {/* 6. Emissoras e Veículos */}
          {emissoras.length > 0 && (
            <Section title="6. Emissoras e Veículos" avoidBreak={false}>
              {emissoras.map((em, ei) => (
                <div key={em.id} style={{ marginBottom: 20, pageBreakInside: 'avoid' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>
                      {em.fantasia || em.razao_social || '(sem nome)'}
                    </span>
                    {em.tipo && <Pill bg="#f0f9ff" color="#075985" border="#bae6fd">{em.tipo}</Pill>}
                    {em.cnpj && <span style={{ fontSize: 10, color: '#94a3b8' }}>CNPJ: {em.cnpj}</span>}
                  </div>

                  {em.veiculos?.length > 0 ? (
                    <div style={{ paddingLeft: 16 }}>
                      {em.veiculos.map(v => (
                        <div key={v.id} style={{ marginBottom: 12 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                            Veículo: {[v.sigla, v.nome].filter(Boolean).join(' — ') || '(sem nome)'}
                          </div>
                          {v.pracas?.length > 0 ? (
                            <DataTable
                              cols={['Sigla', 'Nome', 'Exibidores', 'Layout Roteiro', 'Arquivo Retorno']}
                              rows={v.pracas.map(p => [p.sigla, p.nome, p.exibidores, p.layout_exportacao_roteiro, p.arquivo_retorno_asrun])}
                            />
                          ) : (
                            <span style={{ fontSize: 10, color: '#94a3b8', fontStyle: 'italic' }}>Sem praças cadastradas</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span style={{ fontSize: 10, color: '#94a3b8', fontStyle: 'italic', paddingLeft: 16 }}>Sem veículos cadastrados</span>
                  )}

                  {ei < emissoras.length - 1 && (
                    <div style={{ borderBottom: '1px solid #f1f5f9', marginTop: 12 }} />
                  )}
                </div>
              ))}
            </Section>
          )}

          {/* 7. Alertas e Anotações */}
          {project?.anotacoes && (() => {
            const an = project.anotacoes
            const hasAny = an.alertas || an.atencao || an.situacoes || an.obs_cs
            if (!hasAny) return null
            return (
              <Section title="7. Alertas e Anotações" avoidBreak={false}>
                {an.alertas && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Alertas Críticos</div>
                    <div style={{ padding: '8px 12px', background: '#fef2f2', borderRadius: 6, fontSize: 11, color: '#7f1d1d', borderLeft: '3px solid #fca5a5', whiteSpace: 'pre-wrap' }}>{an.alertas}</div>
                  </div>
                )}
                {an.atencao && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Pontos de Atenção</div>
                    <div style={{ padding: '8px 12px', background: '#fffbeb', borderRadius: 6, fontSize: 11, color: '#78350f', borderLeft: '3px solid #fcd34d', whiteSpace: 'pre-wrap' }}>{an.atencao}</div>
                  </div>
                )}
                {an.situacoes && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Situações Específicas</div>
                    <div style={{ padding: '8px 12px', background: '#eff6ff', borderRadius: 6, fontSize: 11, color: '#1e3a8a', borderLeft: '3px solid #93c5fd', whiteSpace: 'pre-wrap' }}>{an.situacoes}</div>
                  </div>
                )}
                {an.obs_cs && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Anotações da Equipe CS</div>
                    <div style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: 6, fontSize: 11, color: '#334155', borderLeft: '3px solid #cbd5e1', whiteSpace: 'pre-wrap' }}>{an.obs_cs}</div>
                  </div>
                )}
              </Section>
            )
          })()}

          {/* Rodapé */}
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 16, marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 9, color: '#cbd5e1' }}>TDSOFT — Portal CS</span>
            <span style={{ fontSize: 9, color: '#cbd5e1' }}>Documento gerado em {exportDate}</span>
          </div>

        </div>
      </div>
    </>
  )
}
