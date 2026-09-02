import { useState, useEffect, useRef } from 'react'
import { ChevronDown, ChevronRight, Plus, X, Radio, Save, Loader2 } from 'lucide-react'
import { useEmissoras, useSaveEmissoras } from '@/hooks/useEmissoras'
import { useConfigOptionsActive } from '@/hooks/useConfigOptions'
import CNPJInput from '@/components/form/CNPJInput'
import { useToast } from '@/components/shared/ToastContext'
import SectionCard from '@/components/ui/SectionCard'
import Spinner from '@/components/ui/Spinner'

// ── Factories ─────────────────────────────────────────────────────────────────

function newEmissora(projectId, ordem) {
  return { id: crypto.randomUUID(), project_id: projectId, fantasia: '', razao_social: '', cnpj: '', tipo: null, cod_midiaplus: '', id_emissora_adsim: '', grupo_empresa_adsim: '', ordem, ativo: true, veiculos: [] }
}
function newVeiculo(emissoraId, ordem) {
  return { id: crypto.randomUUID(), emissora_id: emissoraId, sigla: '', nome: '', ordem, ativo: true, pracas: [] }
}
function newPraca(veiculoId, ordem) {
  return { id: crypto.randomUUID(), veiculo_id: veiculoId, sigla: '', nome: '', exibidores: '', layout_exportacao_roteiro: '', arquivo_retorno_asrun: '', ordem, ativo: true }
}

// ── Estilos reutilizáveis ─────────────────────────────────────────────────────

const inputCls = 'w-full px-2 py-1.5 text-xs border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent'
const labelCls = 'block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1'

// ── PracaRow ──────────────────────────────────────────────────────────────────

function PracaRow({ praca, onUpdate, onRemove }) {
  const f = (key) => (
    <input type="text" value={praca[key] ?? ''} onChange={e => onUpdate(key, e.target.value)} className={inputCls} />
  )
  return (
    <tr className="group border-b border-slate-100 last:border-0 align-middle">
      <td className="py-1.5 pr-2 w-16">{f('sigla')}</td>
      <td className="py-1.5 pr-2 w-32">{f('nome')}</td>
      <td className="py-1.5 pr-2">{f('exibidores')}</td>
      <td className="py-1.5 pr-2">{f('layout_exportacao_roteiro')}</td>
      <td className="py-1.5 pr-2">{f('arquivo_retorno_asrun')}</td>
      <td className="py-1.5 w-7">
        <button onClick={onRemove} className="opacity-0 group-hover:opacity-100 p-1 rounded text-white bg-red-500 hover:bg-red-600 transition-all" title="Remover praça">
          <X className="w-3 h-3" />
        </button>
      </td>
    </tr>
  )
}

// ── VeiculoCard ───────────────────────────────────────────────────────────────

function VeiculoCard({ veiculo, isOpen, onToggle, onUpdate, onRemove, onAddPraca, onUpdatePraca, onRemovePraca }) {
  const header = veiculo.sigla || veiculo.nome
    ? `${veiculo.sigla}${veiculo.sigla && veiculo.nome ? ' — ' : ''}${veiculo.nome}`
    : '(novo veículo)'

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 cursor-pointer select-none hover:bg-slate-100 transition-colors" onClick={onToggle}>
        {isOpen ? <ChevronDown className="w-3 h-3 text-slate-400 flex-shrink-0" /> : <ChevronRight className="w-3 h-3 text-slate-400 flex-shrink-0" />}
        <span className={`text-xs flex-1 ${header === '(novo veículo)' ? 'text-slate-400 italic' : 'text-slate-700 font-medium'}`}>{header}</span>
        <span className="text-[10px] bg-slate-200 text-slate-500 rounded-full px-2 py-0.5 mr-1">{veiculo.pracas.length} praça{veiculo.pracas.length !== 1 ? 's' : ''}</span>
        <button onClick={e => { e.stopPropagation(); onRemove() }} className="p-1 rounded text-white bg-red-500 hover:bg-red-600 transition-colors" title="Remover veículo">
          <X className="w-3 h-3" />
        </button>
      </div>

      {isOpen && (
        <div className="p-3 space-y-3 bg-white">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>Sigla</label>
              <input type="text" value={veiculo.sigla} onChange={e => onUpdate('sigla', e.target.value)} placeholder="ex: SP" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Nome do Veículo</label>
              <input type="text" value={veiculo.nome} onChange={e => onUpdate('nome', e.target.value)} placeholder="ex: TV Globo SP" className={inputCls} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className={labelCls + ' mb-0'}>Praças</span>
              <button onClick={onAddPraca} className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-blue-600 border border-blue-300 rounded hover:bg-blue-50 transition-colors">
                <Plus className="w-2.5 h-2.5" />Praça
              </button>
            </div>
            {veiculo.pracas.length === 0 ? (
              <p className="text-[10px] text-slate-400 italic py-1">Nenhuma praça cadastrada.</p>
            ) : (
              <div className="overflow-x-auto rounded border border-slate-200">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                      <th className="text-left px-2 py-1.5 w-16">Sigla</th>
                      <th className="text-left px-2 py-1.5 w-32">Nome</th>
                      <th className="text-left px-2 py-1.5">Exibidores</th>
                      <th className="text-left px-2 py-1.5">Layout Roteiro</th>
                      <th className="text-left px-2 py-1.5">Retorno ASRUN</th>
                      <th className="w-7" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {veiculo.pracas.map(p => (
                      <PracaRow key={p.id} praca={p} onUpdate={(key, val) => onUpdatePraca(p.id, key, val)} onRemove={() => onRemovePraca(p.id)} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── EmissoraCard ──────────────────────────────────────────────────────────────

function EmissoraCard({ emissora, isOpen, openVeiculos, onToggle, onUpdate, onRemove, onToggleVeiculo, onAddVeiculo, onUpdateVeiculo, onRemoveVeiculo, onAddPraca, onUpdatePraca, onRemovePraca, hasAdsim, hasMidiaplus, segmentoOpts }) {
  const header = emissora.fantasia || '(nova emissora)'

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      {/* Cabeçalho */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-white cursor-pointer select-none hover:bg-slate-50 transition-colors" onClick={onToggle}>
        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center flex-shrink-0">
          <Radio className="w-3 h-3 text-white" />
        </div>
        {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />}
        <span className={`flex-1 text-xs font-medium ${emissora.fantasia ? 'text-slate-800' : 'text-slate-400 italic'}`}>{header}</span>
        {emissora.tipo && (
          <span className="text-[10px] bg-sky-50 text-sky-700 border border-sky-200 rounded px-1.5 py-0.5 uppercase font-semibold tracking-wide">
            {(segmentoOpts ?? []).find(t => t.value === emissora.tipo)?.label ?? emissora.tipo}
          </span>
        )}
        <button onClick={e => { e.stopPropagation(); onRemove() }} className="ml-1 p-1 rounded text-white bg-red-500 hover:bg-red-600 transition-colors" title="Remover emissora">
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Corpo */}
      {isOpen && (
        <div className="border-t border-slate-100 p-4 space-y-4 bg-slate-50/30">

          {/* Dados Gerais */}
          <div>
            <p className={labelCls}>Dados Gerais</p>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className={labelCls}>Nome Fantasia</label>
                <input type="text" value={emissora.fantasia} onChange={e => onUpdate('fantasia', e.target.value)} placeholder="ex: Globo SP" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Razão Social</label>
                <input type="text" value={emissora.razao_social ?? ''} onChange={e => onUpdate('razao_social', e.target.value)} placeholder="Razão social" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>CNPJ</label>
                <CNPJInput value={emissora.cnpj ?? ''} onChange={val => onUpdate('cnpj', val)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Tipo</label>
                <select value={emissora.tipo ?? ''} onChange={e => onUpdate('tipo', e.target.value || null)} className={inputCls}>
                  <option value="">— Selecione —</option>
                  {(segmentoOpts ?? []).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Configuração Adsim */}
          {hasAdsim && (
            <div className="border border-violet-100 rounded-lg p-3 bg-violet-50/40">
              <p className="text-[10px] font-semibold text-violet-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 inline-block" />Configuração Adsim
              </p>
              <div className="grid grid-cols-2 gap-2 max-w-sm">
                <div>
                  <label className={labelCls}>ID Emissora Adsim</label>
                  <input type="text" value={emissora.id_emissora_adsim ?? ''} onChange={e => onUpdate('id_emissora_adsim', e.target.value)} placeholder="ID interno" className={inputCls + ' border-violet-200'} />
                </div>
                <div>
                  <label className={labelCls}>Grupo Empresa Adsim</label>
                  <input type="text" value={emissora.grupo_empresa_adsim ?? ''} onChange={e => onUpdate('grupo_empresa_adsim', e.target.value)} placeholder="Grupo" className={inputCls + ' border-violet-200'} />
                </div>
              </div>
            </div>
          )}

          {/* Configuração Mídia+ */}
          {hasMidiaplus && (
            <div className="border border-blue-100 rounded-lg p-3 bg-blue-50/40">
              <p className="text-[10px] font-semibold text-blue-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />Configuração Mídia+
              </p>
              <div className="w-44">
                <label className={labelCls}>Cód. Emissora Mídia+</label>
                <input type="text" value={emissora.cod_midiaplus ?? ''} onChange={e => onUpdate('cod_midiaplus', e.target.value)} placeholder="Código emissora" className={inputCls + ' border-blue-200'} />
              </div>
            </div>
          )}

          {/* Veículos */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className={labelCls + ' mb-0'}>Veículos</p>
              <button onClick={onAddVeiculo} className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-orange-600 border border-orange-300 rounded hover:bg-orange-50 transition-colors">
                <Plus className="w-2.5 h-2.5" />Veículo
              </button>
            </div>
            {emissora.veiculos.length === 0 ? (
              <p className="text-[10px] text-slate-400 italic py-1">Nenhum veículo cadastrado.</p>
            ) : (
              <div className="space-y-1.5">
                {emissora.veiculos.map(v => (
                  <VeiculoCard
                    key={v.id} veiculo={v} isOpen={!!openVeiculos[v.id]}
                    onToggle={() => onToggleVeiculo(v.id)}
                    onUpdate={(key, val) => onUpdateVeiculo(emissora.id, v.id, key, val)}
                    onRemove={() => onRemoveVeiculo(emissora.id, v.id)}
                    onAddPraca={() => onAddPraca(emissora.id, v.id)}
                    onUpdatePraca={(pId, key, val) => onUpdatePraca(emissora.id, v.id, pId, key, val)}
                    onRemovePraca={(pId) => onRemovePraca(emissora.id, v.id, pId)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── EmissorasTab ──────────────────────────────────────────────────────────────

export default function EmissorasTab({ project }) {
  const { data: dbEmissoras = [], isLoading } = useEmissoras(project?.id)
  const save  = useSaveEmissoras(project?.id)
  const toast = useToast()

  const { data: segmentoOpts = [] } = useConfigOptionsActive('segmento')
  const sistemas     = project?.sistemas_contratados ?? []
  const hasAdsim     = sistemas.includes('adsim')
  const hasMidiaplus = sistemas.includes('midiaplus')

  const [emissoras,   setEmissoras]   = useState([])
  const [deletedIds,  setDeletedIds]  = useState({ emissoras: [], veiculos: [], pracas: [] })
  const [openEmissoras, setOpenEmissoras] = useState({})
  const [openVeiculos,  setOpenVeiculos]  = useState({})
  const dbStrRef = useRef(null)

  useEffect(() => {
    const str = JSON.stringify(dbEmissoras)
    if (str !== dbStrRef.current) {
      dbStrRef.current = str
      setEmissoras(JSON.parse(str))
      setDeletedIds({ emissoras: [], veiculos: [], pracas: [] })
    }
  }, [dbEmissoras])

  const dirty = JSON.stringify(emissoras) !== JSON.stringify(dbEmissoras) ||
    deletedIds.emissoras.length + deletedIds.veiculos.length + deletedIds.pracas.length > 0

  function addEmissora() {
    const em = newEmissora(project.id, emissoras.length)
    setEmissoras(prev => [...prev, em])
    setOpenEmissoras(prev => ({ ...prev, [em.id]: true }))
  }
  function removeEmissora(emId) {
    setEmissoras(prev => prev.filter(e => e.id !== emId))
    if (dbEmissoras.find(e => e.id === emId))
      setDeletedIds(prev => ({ ...prev, emissoras: [...prev.emissoras, emId] }))
  }
  function updateEmissora(emId, key, val) {
    setEmissoras(prev => prev.map(e => e.id === emId ? { ...e, [key]: val } : e))
  }
  function toggleEmissora(emId) { setOpenEmissoras(prev => ({ ...prev, [emId]: !prev[emId] })) }

  function addVeiculo(emId) {
    const v = newVeiculo(emId, emissoras.find(e => e.id === emId)?.veiculos.length ?? 0)
    setEmissoras(prev => prev.map(e => e.id === emId ? { ...e, veiculos: [...e.veiculos, v] } : e))
    setOpenVeiculos(prev => ({ ...prev, [v.id]: true }))
  }
  function removeVeiculo(emId, vId) {
    setEmissoras(prev => prev.map(e => e.id === emId ? { ...e, veiculos: e.veiculos.filter(v => v.id !== vId) } : e))
    const dbEm = dbEmissoras.find(e => e.id === emId)
    if (dbEm?.veiculos?.find(v => v.id === vId))
      setDeletedIds(prev => ({ ...prev, veiculos: [...prev.veiculos, vId] }))
  }
  function updateVeiculo(emId, vId, key, val) {
    setEmissoras(prev => prev.map(e => e.id === emId ? { ...e, veiculos: e.veiculos.map(v => v.id === vId ? { ...v, [key]: val } : v) } : e))
  }
  function toggleVeiculo(vId) { setOpenVeiculos(prev => ({ ...prev, [vId]: !prev[vId] })) }

  function addPraca(emId, vId) {
    const em = emissoras.find(e => e.id === emId)
    const v  = em?.veiculos.find(v => v.id === vId)
    const p  = newPraca(vId, v?.pracas.length ?? 0)
    setEmissoras(prev => prev.map(e => e.id === emId ? { ...e, veiculos: e.veiculos.map(v => v.id === vId ? { ...v, pracas: [...v.pracas, p] } : v) } : e))
  }
  function removePraca(emId, vId, pId) {
    setEmissoras(prev => prev.map(e => e.id === emId ? { ...e, veiculos: e.veiculos.map(v => v.id === vId ? { ...v, pracas: v.pracas.filter(p => p.id !== pId) } : v) } : e))
    const dbEm = dbEmissoras.find(e => e.id === emId)
    const dbV  = dbEm?.veiculos?.find(v => v.id === vId)
    if (dbV?.pracas?.find(p => p.id === pId))
      setDeletedIds(prev => ({ ...prev, pracas: [...prev.pracas, pId] }))
  }
  function updatePraca(emId, vId, pId, key, val) {
    setEmissoras(prev => prev.map(e => e.id === emId ? { ...e, veiculos: e.veiculos.map(v => v.id === vId ? { ...v, pracas: v.pracas.map(p => p.id === pId ? { ...p, [key]: val } : p) } : v) } : e))
  }

  async function handleSave() {
    try {
      await save.mutateAsync({ toUpsert: emissoras, toDelete: deletedIds })
      toast({ type: 'success', message: 'Emissoras salvas com sucesso.' })
    } catch {
      toast({ type: 'error', message: 'Erro ao salvar emissoras. Tente novamente.' })
    }
  }
  function handleDiscard() {
    setEmissoras(JSON.parse(JSON.stringify(dbEmissoras)))
    setDeletedIds({ emissoras: [], veiculos: [], pracas: [] })
  }

  if (isLoading) return <div className="flex justify-center py-16"><Spinner /></div>
  if (!project?.id) return <p className="text-slate-400 text-sm py-8">Projeto não encontrado.</p>

  const totalVeiculos = emissoras.reduce((acc, e) => acc + e.veiculos.length, 0)

  return (
    <div className="space-y-4 pb-28">
      <SectionCard
        color="sky"
        icon={Radio}
        title="Emissoras"
        subtitle={emissoras.length === 0 ? 'Nenhuma emissora cadastrada.' : `${emissoras.length} emissora${emissoras.length !== 1 ? 's' : ''} · ${totalVeiculos} veículo${totalVeiculos !== 1 ? 's' : ''}`}
        action={
          <button onClick={addEmissora} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors shadow-sm">
            <Plus className="w-3.5 h-3.5" />Nova Emissora
          </button>
        }
      >
        {emissoras.length === 0 ? (
          <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center">
            <Radio className="w-7 h-7 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-400 mb-0.5">Nenhuma emissora cadastrada</p>
            <p className="text-[10px] text-slate-300">Clique em "Nova Emissora" para começar</p>
          </div>
        ) : (
          <div className="space-y-2">
            {emissoras.map(em => (
              <EmissoraCard
                key={em.id} emissora={em}
                isOpen={!!openEmissoras[em.id]}
                openVeiculos={openVeiculos}
                onToggle={() => toggleEmissora(em.id)}
                onUpdate={(key, val) => updateEmissora(em.id, key, val)}
                onRemove={() => removeEmissora(em.id)}
                onToggleVeiculo={toggleVeiculo}
                onAddVeiculo={() => addVeiculo(em.id)}
                onUpdateVeiculo={updateVeiculo}
                onRemoveVeiculo={removeVeiculo}
                onAddPraca={addPraca}
                onUpdatePraca={updatePraca}
                onRemovePraca={removePraca}
                hasAdsim={hasAdsim}
                hasMidiaplus={hasMidiaplus}
                segmentoOpts={segmentoOpts}
              />
            ))}
          </div>
        )}
      </SectionCard>

      {dirty && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-lg px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <p className="text-sm text-slate-600">
              <span className="font-medium text-orange-600">Você tem alterações não salvas</span> nas emissoras.
            </p>
            <div className="flex items-center gap-3">
              <button onClick={handleDiscard} disabled={save.isPending} className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-60">Descartar</button>
              <button onClick={handleSave} disabled={save.isPending} className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed">
                {save.isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando…</> : <><Save className="w-4 h-4" />Salvar alterações</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
