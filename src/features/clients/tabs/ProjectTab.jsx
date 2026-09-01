import { useEffect, useState, useCallback } from 'react'
import { useUpdateClient, useUpdateProject, useContacts } from '@/hooks/useClients'
import { useProfilesCS } from '@/hooks/useProfiles'
import { useDebounce } from '@/hooks/useDebounce'
import { useConfigOptionsActive } from '@/hooks/useConfigOptions'
import FormField from '@/components/form/FormField'
import CEPInput from '@/components/form/CEPInput'
import CNPJInput from '@/components/form/CNPJInput'
import PhoneInput from '@/components/form/PhoneInput'
import MultiSelect from '@/components/form/MultiSelect'
import SearchSelect from '@/components/form/SearchSelect'
import AutosaveIndicator from '../components/AutosaveIndicator'
import ContactsTable from '../components/ContactsTable'

const STATUS_OPTS = [
  { value: 'prospecto', label: 'Prospecto' }, { value: 'implantacao', label: 'Implantação' },
  { value: 'ativo', label: 'Ativo' }, { value: 'pausado', label: 'Pausado' },
  { value: 'cancelado', label: 'Cancelado' },
]
const PROJECT_STATUS_OPTS = [
  { value: 'em_andamento', label: 'Em andamento' }, { value: 'concluido', label: 'Concluído' },
  { value: 'cancelado', label: 'Cancelado' },
]

function Section({ title, children }) {
  return (
    <div className="space-y-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">{title}</h3>
      {children}
    </div>
  )
}

export default function ProjectTab({ client, project }) {
  const [clientForm, setClientForm] = useState(client ?? {})
  const [projectForm, setProjectForm] = useState(project ?? {})
  const [saveStatus, setSaveStatus] = useState('idle')

  const debouncedClient  = useDebounce(clientForm,  800)
  const debouncedProject = useDebounce(projectForm, 800)

  const { data: sistemas = [] } = useConfigOptionsActive('sistema')
  const { data: segmentos = [] } = useConfigOptionsActive('segmento')
  const updateClient  = useUpdateClient()
  const updateProject = useUpdateProject()
  const { data: contacts = [] } = useContacts(project?.id)
  const { data: profiles = [] } = useProfilesCS()

  // Sync props → form when parent reloads
  useEffect(() => { if (client)  setClientForm(client)  }, [client?.id])
  useEffect(() => { if (project) setProjectForm(project) }, [project?.id])

  const autosave = useCallback(async (cd, pd) => {
    if (!client?.id) return
    setSaveStatus('saving')
    try {
      await Promise.all([
        updateClient.mutateAsync({ id: client.id, ...cd }),
        project?.id && updateProject.mutateAsync({ id: project.id, ...pd }),
      ])
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2500)
    } catch { setSaveStatus('error') }
  }, [client?.id, project?.id])

  useEffect(() => {
    if (!client?.id) return
    autosave(debouncedClient, debouncedProject)
  }, [debouncedClient, debouncedProject])

  function sc(field) { return v => setClientForm(f => ({ ...f, [field]: v })) }
  function sp(field) { return v => setProjectForm(f => ({ ...f, [field]: v })) }
  function scev(field) { return e => sc(field)(e.target.value) }
  function spev(field) { return e => sp(field)(e.target.value) }

  return (
    <div className="space-y-8">
      {/* Indicador autosave */}
      <div className="flex justify-end">
        <AutosaveIndicator status={saveStatus} />
      </div>

      {/* Identificação */}
      <Section title="Identificação">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Razão Social" required>
            <input className="input" value={clientForm.razao_social ?? ''} onChange={scev('razao_social')} />
          </FormField>
          <FormField label="Nome Fantasia">
            <input className="input" value={clientForm.nome_fantasia ?? ''} onChange={scev('nome_fantasia')} />
          </FormField>
          <FormField label="CNPJ">
            <CNPJInput value={clientForm.cnpj ?? ''} onChange={sc('cnpj')} />
          </FormField>
          <FormField label="Status">
            <select className="input" value={clientForm.status ?? ''} onChange={scev('status')}>
              {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </FormField>
          <FormField label="Segmento">
            <MultiSelect
              options={segmentos}
              value={Array.isArray(clientForm.segmento) ? clientForm.segmento : []}
              onChange={sc('segmento')}
              placeholder="Selecionar segmentos…"
            />
          </FormField>
          <FormField label="Cidade / UF">
            <div className="flex gap-2">
              <input className="input flex-1" placeholder="Cidade" value={clientForm.cidade ?? ''} onChange={scev('cidade')} />
              <input className="input w-16 uppercase" placeholder="UF" maxLength={2} value={clientForm.uf ?? ''} onChange={scev('uf')} />
            </div>
          </FormField>
          <FormField label="CEP">
            <CEPInput
              value={clientForm.cep ?? ''}
              onChange={sc('cep')}
              onAddress={({ localidade, uf }) => setClientForm(f => ({ ...f, cidade: localidade, uf }))}
            />
          </FormField>
        </div>
      </Section>

      {/* Sistemas contratados */}
      <Section title="Sistemas Contratados">
        <MultiSelect
          options={sistemas}
          value={Array.isArray(projectForm.sistemas_contratados) ? projectForm.sistemas_contratados : []}
          onChange={sp('sistemas_contratados')}
          placeholder="Selecionar sistemas…"
        />
      </Section>

      {/* Responsáveis */}
      <Section title="Responsáveis">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Analista CS Principal">
            <SearchSelect
              options={profiles}
              value={projectForm.responsavel_cs_id ?? null}
              onChange={sp('responsavel_cs_id')}
              placeholder="Selecionar analista…"
            />
          </FormField>
          <FormField label="Analista CS Apoio">
            <SearchSelect
              options={profiles}
              value={projectForm.apoio_cs_id ?? null}
              onChange={sp('apoio_cs_id')}
              placeholder="Selecionar analista…"
              clearable
            />
          </FormField>
        </div>
      </Section>

      {/* Contrato */}
      <Section title="Contrato e Datas">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField label="Status do Projeto">
            <select className="input" value={projectForm.status ?? 'em_andamento'} onChange={spev('status')}>
              {PROJECT_STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </FormField>
          <FormField label="Data de Contrato" hint="DD/MM/AAAA">
            <input type="date" className="input" value={projectForm.data_contrato ?? ''} onChange={spev('data_contrato')} />
          </FormField>
          <FormField label="Previsão Go-live" hint="DD/MM/AAAA">
            <input type="date" className="input" value={projectForm.previsao_golive ?? ''} onChange={spev('previsao_golive')} />
          </FormField>
        </div>
      </Section>

      {/* IDs Externos */}
      <Section title="IDs Externos">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="ID Movidesk">
            <input className="input" value={projectForm.id_movidesk ?? ''} onChange={spev('id_movidesk')} />
          </FormField>
          <FormField label="ID Sense Data">
            <input className="input" value={projectForm.id_sensedata ?? ''} onChange={spev('id_sensedata')} />
          </FormField>
        </div>
      </Section>

      {/* Licenças */}
      <Section title="Licenças">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[['licencas_adsim','Adsim'],['licencas_adanalytics','Ad Analytics'],['licencas_adchecking','Adchecking'],['licencas_midiaplus','Mídia+']].map(([field,label]) => (
            <FormField key={field} label={label}>
              <input type="number" min="0" className="input" value={projectForm[field] ?? 0}
                onChange={e => sp(field)(parseInt(e.target.value) || 0)} />
            </FormField>
          ))}
        </div>
      </Section>

      {/* Alertas */}
      <Section title="Alertas para o Suporte">
        <textarea className="input min-h-[80px] resize-y" placeholder="Informe alertas críticos que o suporte precisa saber…"
          value={projectForm.alertas_suporte ?? ''} onChange={spev('alertas_suporte')} />
      </Section>

      {/* Observações */}
      <Section title="Observações Gerais">
        <textarea className="input min-h-[80px] resize-y" placeholder="Observações gerais sobre o projeto…"
          value={projectForm.obs_geral ?? ''} onChange={spev('obs_geral')} />
      </Section>

      {/* Contatos */}
      {project?.id && <ContactsTable projectId={project.id} contacts={contacts} />}
    </div>
  )
}
