// Gerador de Markdown — exportação de ficha do cliente para base de conhecimento IA
// Função pura: não acessa APIs, apenas formata os dados recebidos.

function fDate(str) {
  if (!str) return '—'
  const [y, m, d] = str.split('-')
  return `${d}/${m}/${y}`
}

function fVal(v) {
  if (v === null || v === undefined || v === '') return '—'
  return String(v)
}

function pipe(...args) {
  return args.filter(Boolean).join(' | ')
}

export function generateMarkdown({ client, project, contacts = [], clientUsers = [], emissoras = [] }) {
  const now = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const lines = []

  // ── Cabeçalho ──────────────────────────────────────────────────────────────
  lines.push(`# ${client.razao_social} — Ficha do Cliente`)
  lines.push(``)
  lines.push(`> Exportado em ${now} pelo Portal CS TDSOFT  `)
  lines.push(`> Status: **${fVal(client.status)}**  `)
  if (project?.sistemas_contratados?.length) {
    lines.push(`> Sistemas: **${project.sistemas_contratados.join(', ')}**`)
  }
  lines.push(``)
  lines.push(`---`)
  lines.push(``)

  // ── 1. Dados do Cliente ────────────────────────────────────────────────────
  lines.push(`## 1. Dados do Cliente`)
  lines.push(``)
  lines.push(`| Campo | Valor |`)
  lines.push(`|---|---|`)
  lines.push(`| Razão Social | ${fVal(client.razao_social)} |`)
  lines.push(`| Nome Fantasia | ${fVal(client.fantasia)} |`)
  lines.push(`| CNPJ | ${fVal(client.cnpj)} |`)
  lines.push(`| CEP | ${fVal(client.cep)} |`)
  lines.push(`| Cidade | ${fVal(client.cidade)} |`)
  lines.push(`| Estado | ${fVal(client.estado)} |`)
  lines.push(`| Segmentos | ${client.segmentos?.join(', ') || '—'} |`)
  lines.push(`| Status | ${fVal(client.status)} |`)
  lines.push(``)

  // ── 2. Dados do Projeto ────────────────────────────────────────────────────
  if (project) {
    lines.push(`## 2. Dados do Projeto`)
    lines.push(``)
    lines.push(`| Campo | Valor |`)
    lines.push(`|---|---|`)
    lines.push(`| Sistemas Contratados | ${project.sistemas_contratados?.join(', ') || '—'} |`)
    lines.push(`| Status do Projeto | ${fVal(project.status)} |`)
    lines.push(`| Número do Contrato | ${fVal(project.contrato_numero)} |`)
    lines.push(`| Data de Assinatura | ${fDate(project.data_assinatura)} |`)
    lines.push(`| Data de Kickoff | ${fDate(project.data_kickoff)} |`)
    lines.push(`| Go-live Previsto | ${fDate(project.data_golive_prevista)} |`)
    lines.push(`| Go-live Real | ${fDate(project.data_golive_real)} |`)
    lines.push(`| Responsável CS | ${project.responsavel_cs?.nome || '—'} |`)
    lines.push(`| Apoio CS | ${project.apoio_cs?.nome || '—'} |`)
    lines.push(`| Responsável Técnico | ${project.responsavel_tecnico?.nome || '—'} |`)
    lines.push(`| Responsável Comercial | ${fVal(project.responsavel_comercial)} |`)
    lines.push(`| ID Movidesk | ${fVal(project.movidesk_id)} |`)
    lines.push(`| ID Sensedata | ${fVal(project.sensedata_id)} |`)
    lines.push(`| Licenças Adsim | ${fVal(project.licencas_adsim)} |`)
    lines.push(`| Licenças Mídia+ | ${fVal(project.licencas_midiaplus)} |`)
    lines.push(`| Licenças Ad Analytics | ${fVal(project.licencas_adanalytics)} |`)
    lines.push(`| Licenças Ad Checking | ${fVal(project.licencas_adchecking)} |`)
    if (project.alertas_suporte) lines.push(`| Alertas de Suporte | ${project.alertas_suporte} |`)
    if (project.obs_geral) lines.push(`| Obs. Geral | ${project.obs_geral} |`)
    lines.push(``)
  }

  // ── 3. Contatos ────────────────────────────────────────────────────────────
  if (contacts.length > 0) {
    lines.push(`## 3. Contatos`)
    lines.push(``)
    lines.push(`| Nome | Cargo | Telefone | E-mail | Responsabilidade | Sponsor |`)
    lines.push(`|---|---|---|---|---|---|`)
    contacts.forEach(c => {
      lines.push(`| ${fVal(c.nome)} | ${fVal(c.cargo)} | ${fVal(c.telefone)} | ${fVal(c.email)} | ${fVal(c.responsabilidade)} | ${c.is_sponsor ? '⭐ Sim' : 'Não'} |`)
    })
    lines.push(``)
  }

  // ── 4. Configuração Técnica ────────────────────────────────────────────────
  const ct = project?.config_tecnica
  if (ct) {
    lines.push(`## 4. Configuração Técnica`)
    lines.push(``)

    // Módulos
    const hasModulos = (ct.modulos_adsim?.length || 0) + (ct.modulos_midiaplus?.length || 0) > 0
    if (hasModulos) {
      lines.push(`### 4.1 Módulos Ativados`)
      lines.push(``)
      if (ct.modulos_adsim?.length) lines.push(`**Adsim:** ${ct.modulos_adsim.join(', ')}  `)
      if (ct.modulos_midiaplus?.length) lines.push(`**Mídia+:** ${ct.modulos_midiaplus.join(', ')}`)
      lines.push(``)
    }

    // Config AD
    const ad = ct.adsim
    if (ad && (ad.ad_status || ad.ad_servidor || ad.ad_obs || ad.pipelines?.length)) {
      lines.push(`### 4.2 Configuração AD (Adsim)`)
      lines.push(``)
      lines.push(`| Campo | Valor |`)
      lines.push(`|---|---|`)
      if (ad.ad_status) lines.push(`| Status AD | ${fVal(ad.ad_status)} |`)
      if (ad.ad_servidor) lines.push(`| Servidor AD | ${fVal(ad.ad_servidor)} |`)
      if (ad.ad_obs) lines.push(`| Observações | ${fVal(ad.ad_obs)} |`)
      lines.push(``)
      if (ad.pipelines?.length) {
        lines.push(`**Pipelines:**`)
        lines.push(``)
        lines.push(`| Pipeline | Etapas | Travas |`)
        lines.push(`|---|---|---|`)
        ad.pipelines.forEach(p => {
          lines.push(`| ${fVal(p.pipeline)} | ${fVal(p.etapas)} | ${fVal(p.travas)} |`)
        })
        lines.push(``)
      }
    }

    // Config Mídia+
    const mp = ct.midiaplus
    if (mp && (mp.adchecking_status || mp.adchecking_exibidores || mp.tipos_negociacao)) {
      lines.push(`### 4.3 Configuração Mídia+`)
      lines.push(``)
      lines.push(`| Campo | Valor |`)
      lines.push(`|---|---|`)
      if (mp.adchecking_status) lines.push(`| Status Adchecking | ${fVal(mp.adchecking_status)} |`)
      if (mp.adchecking_exibidores) lines.push(`| Exibidores | ${fVal(mp.adchecking_exibidores)} |`)
      if (mp.adchecking_obs) lines.push(`| Obs. Adchecking | ${fVal(mp.adchecking_obs)} |`)
      if (mp.tipos_negociacao) lines.push(`| Tipos de Negociação | ${fVal(mp.tipos_negociacao)} |`)
      if (mp.naturezas) lines.push(`| Naturezas | ${fVal(mp.naturezas)} |`)
      if (mp.condicoes_pagamento) lines.push(`| Condições de Pagamento | ${fVal(mp.condicoes_pagamento)} |`)
      lines.push(``)
    }

    // Migrações
    if (ct.migracoes?.length) {
      lines.push(`### 4.4 Migrações`)
      lines.push(``)
      lines.push(`| Sistema | Descrição | Origem | Responsável | Data | Status | Obs |`)
      lines.push(`|---|---|---|---|---|---|---|`)
      ct.migracoes.forEach(m => {
        lines.push(`| ${fVal(m.sistema)} | ${fVal(m.descricao)} | ${fVal(m.origem)} | ${fVal(m.responsavel)} | ${fDate(m.data)} | ${fVal(m.status)} | ${fVal(m.obs)} |`)
      })
      lines.push(``)
    }

    // Integrações
    if (ct.integracoes?.length) {
      lines.push(`### 4.5 Integrações`)
      lines.push(``)
      lines.push(`| Sistema | Tipo | Status | Obs |`)
      lines.push(`|---|---|---|---|`)
      ct.integracoes.forEach(i => {
        lines.push(`| ${fVal(i.sistema)} | ${fVal(i.tipo)} | ${fVal(i.status)} | ${fVal(i.obs)} |`)
      })
      lines.push(``)
    }

    // Validação
    const val = ct.validacao
    if (val && (val.status || val.data || val.obs)) {
      lines.push(`### 4.6 Validação Interna`)
      lines.push(``)
      lines.push(`| Campo | Valor |`)
      lines.push(`|---|---|`)
      if (val.status) lines.push(`| Status | ${fVal(val.status)} |`)
      if (val.data) lines.push(`| Data | ${fDate(val.data)} |`)
      if (val.obs) lines.push(`| Obs | ${fVal(val.obs)} |`)
      lines.push(``)
    }
  }

  // ── 5. Usuários do Cliente ─────────────────────────────────────────────────
  if (clientUsers.length > 0) {
    lines.push(`## 5. Usuários do Cliente`)
    lines.push(``)
    lines.push(`| Nome | E-mail | Perfil | Login | Sistemas | Ativo |`)
    lines.push(`|---|---|---|---|---|---|`)
    clientUsers.forEach(u => {
      lines.push(`| ${fVal(u.nome)} | ${fVal(u.email)} | ${fVal(u.perfil)} | ${fVal(u.login)} | ${u.sistemas?.join(', ') || '—'} | ${u.ativo ? 'Sim' : 'Não'} |`)
    })
    lines.push(``)
  }

  // ── 6. Emissoras e Veículos ────────────────────────────────────────────────
  if (emissoras.length > 0) {
    lines.push(`## 6. Emissoras e Veículos`)
    lines.push(``)
    emissoras.forEach((em, ei) => {
      const emNome = em.fantasia || em.razao_social || '(sem nome)'
      lines.push(`### ${ei + 1}. ${emNome}`)
      lines.push(``)
      if (em.razao_social && em.fantasia) lines.push(`**Razão Social:** ${em.razao_social}  `)
      if (em.cnpj) lines.push(`**CNPJ:** ${em.cnpj}  `)
      if (em.tipo) lines.push(`**Tipo:** ${em.tipo}  `)
      if (em.cod_midiaplus) lines.push(`**Cód. Mídia+:** ${em.cod_midiaplus}  `)
      if (em.id_emissora_adsim) lines.push(`**ID Adsim:** ${em.id_emissora_adsim}  `)
      lines.push(``)
      if (em.veiculos?.length) {
        em.veiculos.forEach((v, vi) => {
          const vNome = pipe(v.sigla, v.nome) || '(sem nome)'
          lines.push(`#### ${ei + 1}.${vi + 1}. Veículo: ${vNome}`)
          lines.push(``)
          if (v.pracas?.length) {
            lines.push(`| Sigla | Nome | Exibidores | Layout Roteiro | Arquivo Retorno |`)
            lines.push(`|---|---|---|---|---|`)
            v.pracas.forEach(p => {
              lines.push(`| ${fVal(p.sigla)} | ${fVal(p.nome)} | ${fVal(p.exibidores)} | ${fVal(p.layout_exportacao_roteiro)} | ${fVal(p.arquivo_retorno_asrun)} |`)
            })
            lines.push(``)
          } else {
            lines.push(`_(sem praças cadastradas)_`)
            lines.push(``)
          }
        })
      } else {
        lines.push(`_(sem veículos cadastrados)_`)
        lines.push(``)
      }
    })
  }

  lines.push(`---`)
  lines.push(``)
  lines.push(`_Documento gerado automaticamente pelo Portal CS TDSOFT em ${now}._`)

  return lines.join('\n')
}
