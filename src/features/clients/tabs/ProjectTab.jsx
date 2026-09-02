import { useState } from 'react'
import {
  User, LayoutGrid, Users, Calendar, Link2,
  Star, AlertTriangle, Phone, Plus, Pencil, Trash2, Check,
} from 'lucide-react'
import SectionCard from '@/components/ui/SectionCard'
import { useUpdateClient, useUpdateProject, useContacts, useDeleteContact } from '@/hooks/useClients'
import { useConfigOptionsActive } from '@/hooks/useConfigOptions'
import { useProfilesCS } from '@/hooks/useProfiles'
import { useToast } from '@/components/shared/ToastContext'
import FormField from '@/components/form/FormField'
import PhoneInput from '@/components/form/PhoneInput'
import MultiSelect from '@/components/form/MultiSelect'
import SearchSelect from '@/components/form/SearchSelect'
import Toggle from '@/components/ui/Toggle'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import ContactPopover from '../components/ContactPopover'

// ─── ProjectTab ───────────────────────────────────────────────────────────────

export default function ProjectTab({ client, project }) {
  const { toast } = useToast()

  // ── Estado do formulário ──
  const [cForm, setCForm] = useState({ ...client })
  const [pForm, setPForm] = useState({ ...project })

  const sc   = (field) => (value) => setCForm((f) => ({ ...f, [field]: value }))
  const sp   = (field) => (value) => setPForm((f) => ({ ...f, [field]: value }))
  const scev = (field) => (e) => sc(field)(e.target.value)
  const spev = (field) => (e) => sp(field)(e.target.value)

  // dirty check
  const clientDirty  = JSON.stringify(cForm) !== JSON.stringify(client)
  const projectDirty = JSON.stringify(pForm) !== JSON.stringify(project)
  const dirty = clientDirty || projectDirty

  // ── Mutations ──
  const updateClient  = useUpdateClient()
  const updateProject = useUpdateProject()

  async function handleSave() {
    try {
      if (clientDirty)  await updateClient.mutateAsync({ id: client.id, ...cForm })
      if (projectDirty) await updateProject.mutateAsync({ id: project.id, ...pForm })
      toast({ type: 'success', message: 'Alterações salvas com sucesso!' })
    } catch {
      toast({ type: 'error', message: 'Erro ao salvar. Tente novamente.' })
    }
  }

  function handleCancel() {
    setCForm({ ...client })
    setPForm({ ...project })
  }

  // ── Dados auxiliares ──
  const { data: sistemasOpts = [] }  = useConfigOptionsActive('sistema')
  const { data: segmentosOpts = [] } = useConfigOptionsActive('segmento')
  // status_projeto é a category renomeada de status_cliente (migration 011)
  const { data: statusOpts = [] }    = useConfigOptionsActive('status_projeto')
  // useProfilesCS já retorna [{value, label, sublabel}] — não remapear
  const { data: profileOpts = [] }   = useProfilesCS()
  const { data: contacts = [] }      = useContacts(project?.id)
  const deleteContact = useDeleteContact()

  // ── Contatos: popover ──
  const [contactPopover, setContactPopover] = useState({ open: false, contact: null })
  const openNew    = () => setContactPopover({ open: true, contact: null })
  const openEdit   = (c) => setContactPopover({ open: true, contact: c })
  const closePopover = () => setContactPopover({ open: false, contact: null })

  // ── Contatos: confirmação de exclusão ──
  const [deleteTarget, setDeleteTarget] = useState(null)

  // ── Indicadores de conclusão ──
  const isIdentComplete = !!(cForm.razao_social && cForm.cnpj && cForm.segmentos?.length)
  const isSistComplete  = !!(pForm.sistemas_contratados?.length)
  const isRespComplete  = !!(pForm.responsavel_cs_id)
  const isContratoComp  = !!(pForm.data_kickoff || pForm.data_golive_prevista)
  const isIdsComplete   = !!(pForm.movidesk_id || pForm.sensedata_id)
  const isContactsComp  = contacts.length > 0

  const sponsors = contacts.filter((c) => c.is_sponsor)

  return (
    <div className="space-y-4 pb-28">

      {/* ── 1. Identificação ──────────────────────────────────────────── */}
      <SectionCard
        color="orange"
        icon={User}
        title="Identificação"
        subtitle="Razão social, CNPJ, segmento e localização"
        complete={isIdentComplete}
      >
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Razão Social" className="col-span-2">
            <input className="input" value={cForm.razao_social ?? ''} onChange={scev('razao_social')} />
          </FormField>
          <FormField label="Nome Fantasia">
            <input className="input" value={cForm.fantasia ?? ''} onChange={scev('fantasia')} />
          </FormField>
          <FormField label="CNPJ">
            <input className="input" value={cForm.cnpj ?? ''} onChange={scev('cnpj')} maxLength={18} />
          </FormField>
          <FormField label="Segmentos" className="col-span-2">
            <MultiSelect
              options={segmentosOpts}
              value={cForm.segmentos ?? []}
              onChange={sc('segmentos')}
              placeholder="Selecione os segmentos…"
            />
          </FormField>
          {/* Status fica aqui — único campo de status, renomeado para "Status do Projeto" */}
          <FormField label="Status do Projeto" className="col-span-2">
            <SearchSelect
              options={statusOpts}
              value={cForm.status ?? null}
              onChange={sc('status')}
              placeholder="Selecione o status…"
              clearable={false}
            />
          </FormField>
          <FormField label="CEP">
            <input className="input" value={cForm.cep ?? ''} onChange={scev('cep')} maxLength={9} />
          </FormField>
          <FormField label="Cidade">
            <input className="input" value={cForm.cidade ?? ''} onChange={scev('cidade')} />
          </FormField>
          <FormField label="Estado">
            <input className="input" value={cForm.estado ?? ''} onChange={scev('estado')} maxLength={2} />
          </FormField>
        </div>
      </SectionCard>

      {/* ── 2. Sistemas ───────────────────────────────────────────────── */}
      <SectionCard
        color="violet"
        icon={LayoutGrid}
        title="Sistemas"
        subtitle="Produtos TDSOFT ativos neste cliente"
        complete={isSistComplete}
      >
        <FormField label="Sistemas Contratados">
          <MultiSelect
            options={sistemasOpts}
            value={pForm.sistemas_contratados ?? []}
            onChange={sp('sistemas_contratados')}
            placeholder="Selecione os sistemas…"
          />
        </FormField>
      </SectionCard>

      {/* ── 3. Responsáveis ───────────────────────────────────────────── */}
      <SectionCard
        color="blue"
        icon={Users}
        title="Responsáveis"
        subtitle="Equipe CS alocada neste projeto"
        complete={isRespComplete}
      >
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Responsável CS" className="col-span-2">
            <SearchSelect
              options={profileOpts}
              value={pForm.responsavel_cs_id ?? null}
              onChange={sp('responsavel_cs_id')}
              placeholder="Selecione…"
            />
          </FormField>
          <FormField label="Apoio CS">
            <SearchSelect
              options={profileOpts}
              value={pForm.apoio_cs_id ?? null}
              onChange={sp('apoio_cs_id')}
              placeholder="Selecione…"
            />
          </FormField>
          <FormField label="Resp. Técnico">
            <SearchSelect
              options={profileOpts}
              value={pForm.responsavel_tecnico_id ?? null}
              onChange={sp('responsavel_tecnico_id')}
              placeholder="Selecione…"
            />
          </FormField>
          <FormField label="Responsável Comercial" className="col-span-2">
            <input
              className="input"
              value={pForm.responsavel_comercial ?? ''}
              onChange={spev('responsavel_comercial')}
              placeholder="Nome do responsável comercial"
            />
          </FormField>
        </div>
      </SectionCard>

      {/* ── 4. Contrato e Datas ───────────────────────────────────────── */}
      <SectionCard
        color="green"
        icon={Calendar}
        title="Contrato e Datas"
        subtitle="Datas de assinatura, kickoff e go-live"
        complete={isContratoComp}
      >
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Nº do Contrato" className="col-span-2">
            <input className="input" value={pForm.contrato_numero ?? ''} onChange={spev('contrato_numero')} />
          </FormField>
          <FormField label="Data Assinatura">
            <input className="input" type="date" value={pForm.data_assinatura ?? ''} onChange={spev('data_assinatura')} />
          </FormField>
          <FormField label="Data Kickoff">
            <input className="input" type="date" value={pForm.data_kickoff ?? ''} onChange={spev('data_kickoff')} />
          </FormField>
          <FormField label="Go-live Previsto">
            <input className="input" type="date" value={pForm.data_golive_prevista ?? ''} onChange={spev('data_golive_prevista')} />
          </FormField>
          <FormField label="Go-live Real">
            <input className="input" type="date" value={pForm.data_golive_real ?? ''} onChange={spev('data_golive_real')} />
          </FormField>
        </div>
      </SectionCard>

      {/* ── 5. IDs Externos ──────────────────────────────────────────── */}
      <SectionCard
        color="sky"
        icon={Link2}
        title="IDs Externos"
        subtitle="Integrações com Movidesk e Sense Data"
        complete={isIdsComplete}
      >
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Movidesk ID">
            <input className="input" value={pForm.movidesk_id ?? ''} onChange={spev('movidesk_id')} />
          </FormField>
          <FormField label="Sense Data ID">
            <input className="input" value={pForm.sensedata_id ?? ''} onChange={spev('sensedata_id')} />
          </FormField>
        </div>
      </SectionCard>

      {/* ── 6. Licenças ───────────────────────────────────────────────── */}
      <SectionCard
        color="amber"
        icon={Star}
        title="Licenças"
        subtitle="Quantidades contratadas por produto"
        complete={null}
      >
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Mídia+">
            <input className="input" type="number" min="0" value={pForm.licencas_midiaplus ?? ''} onChange={spev('licencas_midiaplus')} />
          </FormField>
          <FormField label="AdSim">
            <input className="input" type="number" min="0" value={pForm.licencas_adsim ?? ''} onChange={spev('licencas_adsim')} />
          </FormField>
          <FormField label="AdAnalytics">
            <input className="input" type="number" min="0" value={pForm.licencas_adanalytics ?? ''} onChange={spev('licencas_adanalytics')} />
          </FormField>
          <FormField label="AdChecking">
            <input className="input" type="number" min="0" value={pForm.licencas_adchecking ?? ''} onChange={spev('licencas_adchecking')} />
          </FormField>
        </div>
      </SectionCard>

      {/* ── 7. Alertas ───────────────────────────────────────────────── */}
      <SectionCard
        color="red"
        icon={AlertTriangle}
        title="Alertas"
        subtitle="Visível para toda a equipe de suporte"
        complete={null}
      >
        <FormField label="Alertas de Suporte">
          <textarea
            className="input resize-none"
            rows={3}
            value={pForm.alertas_suporte ?? ''}
            onChange={spev('alertas_suporte')}
            placeholder="Descreva situações especiais de atendimento…"
          />
        </FormField>
        <div className="mt-3">
          <FormField label="Observações Gerais">
            <textarea
              className="input resize-none"
              rows={3}
              value={pForm.obs_geral ?? ''}
              onChange={spev('obs_geral')}
              placeholder="Contexto adicional sobre o cliente…"
            />
          </FormField>
        </div>
      </SectionCard>

      {/* ── 8. Contatos ──────────────────────────────────────────────── */}
      <SectionCard
        color="orange"
        icon={Phone}
        title="Contatos"
        subtitle={
          contacts.length === 0
            ? 'Nenhum contato cadastrado'
            : `${contacts.length} contato${contacts.length > 1 ? 's' : ''} cadastrado${contacts.length > 1 ? 's' : ''}${sponsors.length > 0 ? ` · ${sponsors.length} sponsor` : ''}`
        }
        complete={isContactsComp ? true : false}
      >
        {contacts.length > 0 && (
          <div className="space-y-2 mb-3">
            {contacts.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {c.is_sponsor && (
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{c.nome}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {c.cargo && <span className="text-xs text-slate-400">{c.cargo}</span>}
                      {c.telefone && <span className="text-xs text-slate-400">· {c.telefone}</span>}
                      {c.email && <span className="text-xs text-slate-400">· {c.email}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(c)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Editar contato"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(c)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Excluir contato"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={openNew}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 border-dashed border-slate-200 text-sm text-slate-400 hover:border-orange-300 hover:text-orange-500 hover:bg-orange-50 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Adicionar contato
        </button>
      </SectionCard>

      {/* ── Barra de salvar (sticky) ───────────────────────────────────── */}
      {dirty && (
        <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center gap-3 px-6 py-3 bg-white border-t border-slate-200 shadow-lg">
          <span className="text-xs text-slate-400 mr-auto">Você tem alterações não salvas</span>
          <button
            type="button"
            onClick={handleCancel}
            className="btn-secondary text-sm"
            disabled={updateClient.isPending || updateProject.isPending}
          >
            Descartar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={updateClient.isPending || updateProject.isPending}
            className="btn-primary text-sm flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4" />
            {(updateClient.isPending || updateProject.isPending) ? 'Salvando…' : 'Salvar alterações'}
          </button>
        </div>
      )}

      {/* ── Popover de contato ─────────────────────────────────────────── */}
      <ContactPopover
        open={contactPopover.open}
        initial={contactPopover.contact}
        projectId={project?.id}
        onClose={closePopover}
      />

      {/* ── Confirmação de exclusão ────────────────────────────────────── */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir contato"
        description={`Tem certeza que deseja excluir "${deleteTarget?.nome}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={() => {
          deleteContact.mutate({ id: deleteTarget.id, project_id: project?.id })
          setDeleteTarget(null)
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
