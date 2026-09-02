import { useState, useEffect, useRef } from 'react'
import { AlertTriangle, AlertCircle, FileText, MessageSquare, Save, Loader2 } from 'lucide-react'
import { useUpdateProject } from '@/hooks/useClients'
import { useToast } from '@/components/shared/ToastContext'
import SectionCard from '@/components/ui/SectionCard'

// ── Estrutura padrão ──────────────────────────────────────────────────────────

const DEFAULT_ANOTACOES = {
  alertas:   '',
  atencao:   '',
  situacoes: '',
  obs_cs:    '',
}

function merge(raw) {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_ANOTACOES }
  return { ...DEFAULT_ANOTACOES, ...raw }
}

// ── Textarea de seção ─────────────────────────────────────────────────────────

function TextArea({ value, onChange, placeholder, rows = 5 }) {
  return (
    <textarea
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2.5 text-sm text-slate-700 bg-white border border-slate-200 rounded-lg resize-y
                 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent
                 placeholder:text-slate-300 leading-relaxed"
    />
  )
}

// ── AlertasTab ────────────────────────────────────────────────────────────────

export default function AlertasTab({ project }) {
  const updateProject = useUpdateProject()
  const toast         = useToast()

  const [form, setForm] = useState(DEFAULT_ANOTACOES)
  const dbStrRef        = useRef(null)

  useEffect(() => {
    const merged = merge(project?.anotacoes)
    const str    = JSON.stringify(merged)
    if (str !== dbStrRef.current) {
      dbStrRef.current = str
      setForm(JSON.parse(str))
    }
  }, [project?.anotacoes])

  const dirty = dbStrRef.current !== null && JSON.stringify(form) !== dbStrRef.current

  const set = (field) => (val) => setForm(prev => ({ ...prev, [field]: val }))

  async function handleSave() {
    try {
      await updateProject.mutateAsync({ id: project.id, anotacoes: form })
      toast({ type: 'success', message: 'Alertas e anotações salvos.' })
    } catch {
      toast({ type: 'error', message: 'Erro ao salvar. Tente novamente.' })
    }
  }

  function handleDiscard() {
    setForm(JSON.parse(dbStrRef.current))
  }

  if (!project?.id) {
    return <p className="text-slate-400 text-sm py-8">Projeto não encontrado.</p>
  }

  return (
    <div className="space-y-4 pb-28">

      <SectionCard
        color="red"
        icon={AlertTriangle}
        title="Alertas"
        subtitle="Urgências, bloqueios ou riscos críticos do projeto"
      >
        <TextArea
          value={form.alertas}
          onChange={set('alertas')}
          placeholder="Ex: Cliente aguardando contato do jurídico antes de iniciar. Prazo contratual vence em 30/10."
          rows={4}
        />
      </SectionCard>

      <SectionCard
        color="amber"
        icon={AlertCircle}
        title="Pontos de Atenção"
        subtitle="Situações a monitorar que ainda não são críticas"
      >
        <TextArea
          value={form.atencao}
          onChange={set('atencao')}
          placeholder="Ex: Equipe de TI do cliente reduzida em dezembro. Responsável comercial em transição."
          rows={4}
        />
      </SectionCard>

      <SectionCard
        color="blue"
        icon={FileText}
        title="Situações Específicas do Projeto"
        subtitle="Contexto particular deste cliente ou implantação"
      >
        <TextArea
          value={form.situacoes}
          onChange={set('situacoes')}
          placeholder="Ex: Cliente possui dois ambientes separados. Integração com ERP legado Totvs RM."
          rows={5}
        />
      </SectionCard>

      <SectionCard
        color="slate"
        icon={MessageSquare}
        title="Anotações da Equipe CS"
        subtitle="Notas internas para a equipe de Customer Success"
      >
        <TextArea
          value={form.obs_cs}
          onChange={set('obs_cs')}
          placeholder="Ex: Reunião semanal às terças 14h. Ponto focal técnico: João (11 9xxxx-xxxx). Cliente prefere WhatsApp."
          rows={5}
        />
      </SectionCard>

      {dirty && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-lg px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <p className="text-sm text-slate-600">
              <span className="font-medium text-orange-600">Você tem alterações não salvas</span> nos alertas e anotações.
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
