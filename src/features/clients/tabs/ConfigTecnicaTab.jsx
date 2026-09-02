import { useState, useEffect, useRef } from 'react'
import {
  Layers, Wrench, Monitor, Database, Link2, ShieldCheck,
  Plus, X, Save, Loader2,
} from 'lucide-react'
import SectionCard from '@/components/ui/SectionCard'
import { useUpdateProject } from '@/hooks/useClients'
import { useConfigOptionsActive } from '@/hooks/useConfigOptions'
import { useToast } from '@/components/shared/ToastContext'

// ── Constantes ────────────────────────────────────────────────────────────────

const STATUS_OPTS = [
  { value: '',             label: '— Não definido —' },
  { value: 'nao_aplicavel', label: 'Não aplicável'  },
  { value: 'pendente',     label: 'Pendente'         },
  { value: 'em_andamento', label: 'Em andamento'     },
  { value: 'concluido',    label: 'Concluído'        },
]

const VALIDACAO_OPTS = [
  { value: '',          label: '— Não definido —' },
  { value: 'pendente',  label: 'Pendente'          },
  { value: 'aprovada',  label: 'Aprovada'          },
  { value: 'reprovada', label: 'Reprovada'         },
]

const DEFAULT_CONFIG = {
  modulos_adsim:    [],
  modulos_midiaplus: [],
  adsim: {
    ad_status:    '',
    ad_servidor:  '',
    ad_obs:       '',
    pipelines:    [],
  },
  midiaplus: {
    adchecking_status:     '',
    adchecking_exibidores: '',
    adchecking_obs:        '',
    tipos_negociacao:      '',
    naturezas:             '',
    condicoes_pagamento:   '',
  },
  migracoes:  [],
  integracoes: [],
  validacao: { status: '', data: '', obs: '' },
}

function mergeConfig(raw) {
  const base = JSON.parse(JSON.stringify(DEFAULT_CONFIG))
  if (!raw || typeof raw !== 'object') return base
  return {
    ...base,
    ...raw,
    modulos_adsim:    Array.isArray(raw.modulos_adsim)    ? raw.modulos_adsim    : base.modulos_adsim,
    modulos_midiaplus: Array.isArray(raw.modulos_midiaplus) ? raw.modulos_midiaplus : base.modulos_midiaplus,
    adsim:     { ...base.adsim,     ...(raw.adsim     ?? {}) },
    midiaplus: { ...base.midiaplus, ...(raw.midiaplus  ?? {}) },
    migracoes:  Array.isArray(raw.migracoes)  ? raw.migracoes  : base.migracoes,
    integracoes: Array.isArray(raw.integracoes) ? raw.integracoes : base.integracoes,
    validacao: { ...base.validacao, ...(raw.validacao ?? {}) },
  }
}

// ── Estilos reutilizáveis ─────────────────────────────────────────────────────

const inputCls = 'w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white'
const textareaCls = 'w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white resize-none'

function Label({ children }) {
  return (
    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
      {children}
    </label>
  )
}

function Field({ label, children }) {
  return (
    <div>
      {label && <Label>{label}</Label>}
      {children}
    </div>
  )
}

function SelectField({ label, value, onChange, opts }) {
  return (
    <Field label={label}>
      <select value={value} onChange={e => onChange(e.target.value)} className={inputCls}>
        {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Field>
  )
}

// ── Seção: Módulos Ativados ───────────────────────────────────────────────────

function ModulosSection({ form, setForm, hasAdsim, hasMidiaplus, adsimOpts, midiaplusOpts }) {
  function toggle(key, value) {
    setForm(prev => {
      const cur = prev[key] ?? []
      return { ...prev, [key]: cur.includes(value) ? cur.filter(v => v !== value) : [...cur, value] }
    })
  }

  const checkboxCls = 'w-4 h-4 rounded border-slate-300 focus:ring-offset-0'

  function ModuleGroup({ label, colorCls, ringCls, items, field }) {
    return (
      <div>
        <p className={`text-xs font-semibold uppercase tracking-widest mb-2 ${colorCls}`}>{label}</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
          {items.map(opt => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={form[field].includes(opt.value)}
                onChange={() => toggle(field, opt.value)}
                className={`${checkboxCls} ${ringCls}`}
              />
              <span className="text-sm text-slate-700 group-hover:text-slate-900 leading-tight">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>
    )
  }

  const showAdsim    = hasAdsim    && adsimOpts.length    > 0
  const showMidiaplus = hasMidiaplus && midiaplusOpts.length > 0

  if (!showAdsim && !showMidiaplus) {
    return <p className="text-sm text-slate-400 italic">Nenhum módulo configurado para os sistemas contratados.</p>
  }

  return (
    <div className="space-y-5">
      {showAdsim && (
        <ModuleGroup
          label="Adsim"
          colorCls="text-violet-600"
          ringCls="text-violet-600 focus:ring-violet-400"
          items={adsimOpts}
          field="modulos_adsim"
        />
      )}
      {showMidiaplus && (
        <ModuleGroup
          label="Mídia+"
          colorCls="text-blue-600"
          ringCls="text-blue-600 focus:ring-blue-400"
          items={midiaplusOpts}
          field="modulos_midiaplus"
        />
      )}
    </div>
  )
}

// ── Seção: Configuração AD (Adsim) ────────────────────────────────────────────

function PipelineRow({ row, onUpdate, onRemove }) {
  const cellCls = 'w-full px-2 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent bg-white'
  return (
    <tr className="group border-b border-slate-100 last:border-0">
      <td className="py-1.5 pr-2">
        <input type="text" value={row.pipeline ?? ''} onChange={e => onUpdate('pipeline', e.target.value)} placeholder="Nome do pipeline" className={cellCls} />
      </td>
      <td className="py-1.5 pr-2">
        <input type="text" value={row.etapas ?? ''} onChange={e => onUpdate('etapas', e.target.value)} placeholder="ex: 3 etapas" className={cellCls} />
      </td>
      <td className="py-1.5 pr-2">
        <input type="text" value={row.travas ?? ''} onChange={e => onUpdate('travas', e.target.value)} placeholder="Travas configuradas" className={cellCls} />
      </td>
      <td className="py-1.5 w-8">
        <button onClick={onRemove} className="opacity-0 group-hover:opacity-100 p-1 rounded text-white bg-red-500 hover:bg-red-600 transition-all" title="Remover">
          <X className="w-3 h-3" />
        </button>
      </td>
    </tr>
  )
}

function ConfigAdsimSection({ form, setForm }) {
  const { adsim } = form

  function upAdsim(key, val) {
    setForm(prev => ({ ...prev, adsim: { ...prev.adsim, [key]: val } }))
  }

  function addPipeline() {
    setForm(prev => ({
      ...prev,
      adsim: {
        ...prev.adsim,
        pipelines: [...prev.adsim.pipelines, { id: crypto.randomUUID(), pipeline: '', etapas: '', travas: '' }],
      },
    }))
  }

  function updatePipeline(id, key, val) {
    setForm(prev => ({
      ...prev,
      adsim: { ...prev.adsim, pipelines: prev.adsim.pipelines.map(p => p.id === id ? { ...p, [key]: val } : p) },
    }))
  }

  function removePipeline(id) {
    setForm(prev => ({
      ...prev,
      adsim: { ...prev.adsim, pipelines: prev.adsim.pipelines.filter(p => p.id !== id) },
    }))
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <SelectField label="Status AD" value={adsim.ad_status} onChange={v => upAdsim('ad_status', v)} opts={STATUS_OPTS} />
        <div className="col-span-2">
          <Field label="Servidor AD">
            <input
              type="text"
              value={adsim.ad_servidor}
              onChange={e => upAdsim('ad_servidor', e.target.value)}
              placeholder="ex: ad.empresa.local"
              className={inputCls}
            />
          </Field>
        </div>
      </div>

      <Field label="Observações">
        <textarea
          value={adsim.ad_obs}
          onChange={e => upAdsim('ad_obs', e.target.value)}
          rows={2}
          placeholder="Observações sobre a configuração AD..."
          className={textareaCls}
        />
      </Field>

      {/* Pipelines */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Pipelines</span>
          <button
            onClick={addPipeline}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-violet-600 border border-violet-300 rounded-lg hover:bg-violet-50 transition-colors"
          >
            <Plus className="w-3 h-3" />Pipeline
          </button>
        </div>
        {adsim.pipelines.length === 0 ? (
          <p className="text-xs text-slate-400 italic">Nenhum pipeline cadastrado.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-2 py-2 font-semibold text-slate-500 uppercase tracking-wide">Pipeline</th>
                  <th className="text-left px-2 py-2 font-semibold text-slate-500 uppercase tracking-wide w-36">Etapas</th>
                  <th className="text-left px-2 py-2 font-semibold text-slate-500 uppercase tracking-wide">Travas</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {adsim.pipelines.map(row => (
                  <PipelineRow
                    key={row.id}
                    row={row}
                    onUpdate={(key, val) => updatePipeline(row.id, key, val)}
                    onRemove={() => removePipeline(row.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Seção: Configuração Mídia+ ────────────────────────────────────────────────

function ConfigMidiaplusSection({ form, setForm }) {
  const { midiaplus } = form

  function upMidiaplus(key, val) {
    setForm(prev => ({ ...prev, midiaplus: { ...prev.midiaplus, [key]: val } }))
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <SelectField
          label="Status Adchecking"
          value={midiaplus.adchecking_status}
          onChange={v => upMidiaplus('adchecking_status', v)}
          opts={STATUS_OPTS}
        />
        <div className="col-span-2">
          <Field label="Exibidores">
            <input
              type="text"
              value={midiaplus.adchecking_exibidores}
              onChange={e => upMidiaplus('adchecking_exibidores', e.target.value)}
              placeholder="ex: Globo, Record, SBT"
              className={inputCls}
            />
          </Field>
        </div>
      </div>

      <Field label="Obs. Adchecking">
        <textarea
          value={midiaplus.adchecking_obs}
          onChange={e => upMidiaplus('adchecking_obs', e.target.value)}
          rows={2}
          placeholder="Observações sobre o Adchecking..."
          className={textareaCls}
        />
      </Field>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Tipos de Negociação">
          <textarea
            value={midiaplus.tipos_negociacao}
            onChange={e => upMidiaplus('tipos_negociacao', e.target.value)}
            rows={3}
            placeholder="ex: PI, PA, Permuta..."
            className={textareaCls}
          />
        </Field>
        <Field label="Naturezas">
          <textarea
            value={midiaplus.naturezas}
            onChange={e => upMidiaplus('naturezas', e.target.value)}
            rows={3}
            placeholder="ex: Comercial, Bonificação..."
            className={textareaCls}
          />
        </Field>
        <Field label="Condições de Pagamento">
          <textarea
            value={midiaplus.condicoes_pagamento}
            onChange={e => upMidiaplus('condicoes_pagamento', e.target.value)}
            rows={3}
            placeholder="ex: À vista, 30 dias..."
            className={textareaCls}
          />
        </Field>
      </div>
    </div>
  )
}

// ── Seção: Migrações ──────────────────────────────────────────────────────────

function MigracaoRow({ row, onUpdate, onRemove }) {
  const cellCls = 'w-full px-2 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white'
  return (
    <tr className="group border-b border-slate-100 last:border-0">
      <td className="py-1.5 pr-2 min-w-24">
        <input type="text" value={row.sistema ?? ''} onChange={e => onUpdate('sistema', e.target.value)} placeholder="Sistema" className={cellCls} />
      </td>
      <td className="py-1.5 pr-2 min-w-40">
        <input type="text" value={row.descricao ?? ''} onChange={e => onUpdate('descricao', e.target.value)} placeholder="Descrição" className={cellCls} />
      </td>
      <td className="py-1.5 pr-2 min-w-24">
        <input type="text" value={row.origem ?? ''} onChange={e => onUpdate('origem', e.target.value)} placeholder="Origem" className={cellCls} />
      </td>
      <td className="py-1.5 pr-2 min-w-28">
        <input type="text" value={row.responsavel ?? ''} onChange={e => onUpdate('responsavel', e.target.value)} placeholder="Responsável" className={cellCls} />
      </td>
      <td className="py-1.5 pr-2 min-w-28">
        <input type="date" value={row.data ?? ''} onChange={e => onUpdate('data', e.target.value)} className={cellCls} />
      </td>
      <td className="py-1.5 pr-2 min-w-36">
        <select value={row.status ?? ''} onChange={e => onUpdate('status', e.target.value)} className={cellCls}>
          {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </td>
      <td className="py-1.5 pr-2 min-w-32">
        <input type="text" value={row.obs ?? ''} onChange={e => onUpdate('obs', e.target.value)} placeholder="Observações" className={cellCls} />
      </td>
      <td className="py-1.5 w-8">
        <button onClick={onRemove} className="opacity-0 group-hover:opacity-100 p-1 rounded text-white bg-red-500 hover:bg-red-600 transition-all" title="Remover">
          <X className="w-3 h-3" />
        </button>
      </td>
    </tr>
  )
}

function MigracoesSection({ form, setForm }) {
  function addRow() {
    setForm(prev => ({
      ...prev,
      migracoes: [...prev.migracoes, {
        id: crypto.randomUUID(), sistema: '', descricao: '', origem: '',
        responsavel: '', data: '', status: '', obs: '',
      }],
    }))
  }

  function updateRow(id, key, val) {
    setForm(prev => ({ ...prev, migracoes: prev.migracoes.map(r => r.id === id ? { ...r, [key]: val } : r) }))
  }

  function removeRow(id) {
    setForm(prev => ({ ...prev, migracoes: prev.migracoes.filter(r => r.id !== id) }))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-500">
          {form.migracoes.length === 0
            ? 'Nenhuma migração registrada'
            : `${form.migracoes.length} migração${form.migracoes.length !== 1 ? 'ões' : ''} registrada${form.migracoes.length !== 1 ? 's' : ''}`}
        </span>
        <button
          onClick={addRow}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-amber-600 border border-amber-300 rounded-lg hover:bg-amber-50 transition-colors"
        >
          <Plus className="w-3 h-3" />Migração
        </button>
      </div>
      {form.migracoes.length === 0 ? (
        <p className="text-xs text-slate-400 italic py-2">Clique em "+ Migração" para registrar uma migração.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-2 py-2 font-semibold text-slate-500 uppercase tracking-wide min-w-24">Sistema</th>
                <th className="text-left px-2 py-2 font-semibold text-slate-500 uppercase tracking-wide min-w-40">Descrição</th>
                <th className="text-left px-2 py-2 font-semibold text-slate-500 uppercase tracking-wide min-w-24">Origem</th>
                <th className="text-left px-2 py-2 font-semibold text-slate-500 uppercase tracking-wide min-w-28">Responsável</th>
                <th className="text-left px-2 py-2 font-semibold text-slate-500 uppercase tracking-wide min-w-28">Data</th>
                <th className="text-left px-2 py-2 font-semibold text-slate-500 uppercase tracking-wide min-w-36">Status</th>
                <th className="text-left px-2 py-2 font-semibold text-slate-500 uppercase tracking-wide min-w-32">Observações</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {form.migracoes.map(row => (
                <MigracaoRow
                  key={row.id}
                  row={row}
                  onUpdate={(key, val) => updateRow(row.id, key, val)}
                  onRemove={() => removeRow(row.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Seção: Integrações ────────────────────────────────────────────────────────

function IntegracaoRow({ row, onUpdate, onRemove }) {
  const cellCls = 'w-full px-2 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent bg-white'
  return (
    <tr className="group border-b border-slate-100 last:border-0">
      <td className="py-1.5 pr-2 min-w-32">
        <input type="text" value={row.sistema ?? ''} onChange={e => onUpdate('sistema', e.target.value)} placeholder="Sistema" className={cellCls} />
      </td>
      <td className="py-1.5 pr-2 min-w-32">
        <input type="text" value={row.tipo ?? ''} onChange={e => onUpdate('tipo', e.target.value)} placeholder="Tipo de integração" className={cellCls} />
      </td>
      <td className="py-1.5 pr-2 min-w-36">
        <select value={row.status ?? ''} onChange={e => onUpdate('status', e.target.value)} className={cellCls}>
          {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </td>
      <td className="py-1.5 pr-2">
        <input type="text" value={row.obs ?? ''} onChange={e => onUpdate('obs', e.target.value)} placeholder="Observações" className={cellCls} />
      </td>
      <td className="py-1.5 w-8">
        <button onClick={onRemove} className="opacity-0 group-hover:opacity-100 p-1 rounded text-white bg-red-500 hover:bg-red-600 transition-all" title="Remover">
          <X className="w-3 h-3" />
        </button>
      </td>
    </tr>
  )
}

function IntegracoesSection({ form, setForm }) {
  function addRow() {
    setForm(prev => ({
      ...prev,
      integracoes: [...prev.integracoes, { id: crypto.randomUUID(), sistema: '', tipo: '', status: '', obs: '' }],
    }))
  }

  function updateRow(id, key, val) {
    setForm(prev => ({ ...prev, integracoes: prev.integracoes.map(r => r.id === id ? { ...r, [key]: val } : r) }))
  }

  function removeRow(id) {
    setForm(prev => ({ ...prev, integracoes: prev.integracoes.filter(r => r.id !== id) }))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-500">
          {form.integracoes.length === 0
            ? 'Nenhuma integração registrada'
            : `${form.integracoes.length} integração${form.integracoes.length !== 1 ? 'ões' : ''}`}
        </span>
        <button
          onClick={addRow}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-teal-600 border border-teal-300 rounded-lg hover:bg-teal-50 transition-colors"
        >
          <Plus className="w-3 h-3" />Integração
        </button>
      </div>
      {form.integracoes.length === 0 ? (
        <p className="text-xs text-slate-400 italic py-2">Clique em "+ Integração" para registrar uma integração.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-2 py-2 font-semibold text-slate-500 uppercase tracking-wide min-w-32">Sistema</th>
                <th className="text-left px-2 py-2 font-semibold text-slate-500 uppercase tracking-wide min-w-32">Tipo</th>
                <th className="text-left px-2 py-2 font-semibold text-slate-500 uppercase tracking-wide min-w-36">Status</th>
                <th className="text-left px-2 py-2 font-semibold text-slate-500 uppercase tracking-wide">Observações</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {form.integracoes.map(row => (
                <IntegracaoRow
                  key={row.id}
                  row={row}
                  onUpdate={(key, val) => updateRow(row.id, key, val)}
                  onRemove={() => removeRow(row.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Seção: Validação Interna ───────────────────────────────────────────────────

function ValidacaoSection({ form, setForm }) {
  const { validacao } = form

  function upValidacao(key, val) {
    setForm(prev => ({ ...prev, validacao: { ...prev.validacao, [key]: val } }))
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      <SelectField
        label="Status da Validação"
        value={validacao.status}
        onChange={v => upValidacao('status', v)}
        opts={VALIDACAO_OPTS}
      />
      <Field label="Data da Validação">
        <input
          type="date"
          value={validacao.data}
          onChange={e => upValidacao('data', e.target.value)}
          className={inputCls}
        />
      </Field>
      <Field label="Observações">
        <input
          type="text"
          value={validacao.obs}
          onChange={e => upValidacao('obs', e.target.value)}
          placeholder="Notas sobre a validação"
          className={inputCls}
        />
      </Field>
    </div>
  )
}

// ── ConfigTecnicaTab ──────────────────────────────────────────────────────────

export default function ConfigTecnicaTab({ project }) {
  const updateProject = useUpdateProject()
  const { toast } = useToast()

  const sistemas    = project?.sistemas_contratados ?? []
  const hasAdsim    = sistemas.includes('adsim')
  const hasMidiaplus = sistemas.includes('midiaplus')

  const { data: adsimOpts    = [] } = useConfigOptionsActive('modulo_adsim')
  const { data: midiaplusOpts = [] } = useConfigOptionsActive('modulo_midiaplus')

  const [form, setForm] = useState(() => mergeConfig(project?.config_tecnica))

  // Sincroniza quando o projeto é refetchado (após save ou navegação)
  const dbStrRef = useRef(null)
  useEffect(() => {
    const merged = mergeConfig(project?.config_tecnica)
    const str    = JSON.stringify(merged)
    if (str !== dbStrRef.current) {
      dbStrRef.current = str
      setForm(JSON.parse(str))
    }
  }, [project?.config_tecnica])

  const dirty = dbStrRef.current !== null && JSON.stringify(form) !== dbStrRef.current

  async function handleSave() {
    try {
      await updateProject.mutateAsync({ id: project.id, config_tecnica: form })
      toast({ type: 'success', message: 'Configurações técnicas salvas.' })
    } catch {
      toast({ type: 'error', message: 'Erro ao salvar. Tente novamente.' })
    }
  }

  function handleDiscard() {
    if (dbStrRef.current) setForm(JSON.parse(dbStrRef.current))
  }

  if (!project?.id) {
    return <p className="text-slate-400 text-sm py-8">Projeto não encontrado.</p>
  }

  // Indicadores de conclusão por seção
  const modulosComplete =
    form.modulos_adsim.length + form.modulos_midiaplus.length > 0 ? true : false
  const adsimComplete =
    !form.adsim.ad_status ? false : form.adsim.ad_status === 'concluido' ? true : false
  const midiaplusComplete =
    !form.midiaplus.adchecking_status ? false : form.midiaplus.adchecking_status === 'concluido' ? true : false
  const migracoesComplete =
    form.migracoes.length === 0
      ? null
      : form.migracoes.every(m => m.status === 'concluido') ? true : false
  const integracoesComplete =
    form.integracoes.length === 0
      ? null
      : form.integracoes.every(i => i.status === 'concluido') ? true : false
  const validacaoComplete =
    !form.validacao.status ? null : form.validacao.status === 'aprovada' ? true : false

  return (
    <div className="pb-28 space-y-4">

      {/* Módulos Ativados — só se houver sistemas contratados com módulos */}
      {(hasAdsim || hasMidiaplus) && (
        <SectionCard
          color="violet"
          icon={Layers}
          title="Módulos Ativados"
          subtitle="Módulos contratados por sistema"
          complete={modulosComplete}
        >
          <ModulosSection
            form={form}
            setForm={setForm}
            hasAdsim={hasAdsim}
            hasMidiaplus={hasMidiaplus}
            adsimOpts={adsimOpts}
            midiaplusOpts={midiaplusOpts}
          />
        </SectionCard>
      )}

      {/* Configuração AD — somente se Adsim contratado */}
      {hasAdsim && (
        <SectionCard
          color="violet"
          icon={Wrench}
          title="Configuração AD"
          subtitle="Active Directory e pipelines do Adsim"
          complete={adsimComplete}
        >
          <ConfigAdsimSection form={form} setForm={setForm} />
        </SectionCard>
      )}

      {/* Configuração Mídia+ — somente se Mídia+ contratado */}
      {hasMidiaplus && (
        <SectionCard
          color="blue"
          icon={Monitor}
          title="Configuração Mídia+"
          subtitle="Adchecking e configurações de negociação"
          complete={midiaplusComplete}
        >
          <ConfigMidiaplusSection form={form} setForm={setForm} />
        </SectionCard>
      )}

      {/* Base de Dados / Migrações */}
      <SectionCard
        color="amber"
        icon={Database}
        title="Base de Dados / Migrações"
        subtitle="Controle de migrações de dados"
        complete={migracoesComplete}
      >
        <MigracoesSection form={form} setForm={setForm} />
      </SectionCard>

      {/* Integrações */}
      <SectionCard
        color="teal"
        icon={Link2}
        title="Integrações"
        subtitle="Integrações com sistemas externos"
        complete={integracoesComplete}
      >
        <IntegracoesSection form={form} setForm={setForm} />
      </SectionCard>

      {/* Validação Interna */}
      <SectionCard
        color="green"
        icon={ShieldCheck}
        title="Validação Interna"
        subtitle="Resultado da validação técnica pelo CS"
        complete={validacaoComplete}
      >
        <ValidacaoSection form={form} setForm={setForm} />
      </SectionCard>

      {/* Sticky save bar */}
      {dirty && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-lg px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <p className="text-sm text-slate-600">
              <span className="font-medium text-orange-600">Você tem alterações não salvas</span> nas configurações técnicas.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDiscard}
                disabled={updateProject.isPending}
                className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-60"
              >
                Descartar
              </button>
              <button
                onClick={handleSave}
                disabled={updateProject.isPending}
                className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {updateProject.isPending
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando…</>
                  : <><Save className="w-4 h-4" />Salvar alterações</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
