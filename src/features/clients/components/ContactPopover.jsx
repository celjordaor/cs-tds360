import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Check, Star } from 'lucide-react'
import { useUpsertContact } from '@/hooks/useClients'
import FormField from '@/components/form/FormField'
import PhoneInput from '@/components/form/PhoneInput'
import Toggle from '@/components/ui/Toggle'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const EMPTY = {
  nome: '',
  cargo: '',
  telefone: '',
  email: '',
  responsabilidade: '',
  is_sponsor: false,
}

/**
 * ContactPopover
 * Popover/modal para criar ou editar um contato de cliente.
 *
 * Props:
 *   open       {boolean}     – controla visibilidade
 *   initial    {object|null} – contato existente para edição (null = novo)
 *   projectId  {string}      – UUID do projeto pai
 *   onClose    {function}    – chamado ao fechar/salvar
 */
export default function ContactPopover({ open, initial = null, projectId, onClose }) {
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const upsert = useUpsertContact()

  // Sincroniza o form ao abrir (edição ou novo)
  useEffect(() => {
    if (open) {
      setForm(initial ? { ...initial } : EMPTY)
      setErrors({})
    }
  }, [open, initial?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const set = (field) => (value) => setForm((f) => ({ ...f, [field]: value }))
  const sev = (field) => (e) => set(field)(e.target.value)

  function validate() {
    const e = {}
    if (!form.nome.trim()) e.nome = 'Nome é obrigatório'
    if (form.telefone && form.telefone.replace(/\D/g, '').length < 10)
      e.telefone = 'Telefone inválido (mínimo 10 dígitos)'
    if (form.email && !EMAIL_RE.test(form.email))
      e.email = 'E-mail inválido'
    return e
  }

  async function handleSave() {
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }

    const payload = { ...form, project_id: projectId }
    if (initial?.id) payload.id = initial.id

    await upsert.mutateAsync(payload)
    onClose()
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') onClose()
  }

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Painel */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 flex flex-col max-h-[90vh]">

        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <p className="text-sm font-bold text-slate-800">
              {initial ? 'Editar contato' : 'Novo contato'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Preencha os dados do contato do cliente
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corpo */}
        <div className="px-6 py-5 space-y-4 overflow-y-auto">

          {/* Nome */}
          <FormField label="Nome" required error={errors.nome}>
            <input
              className="input"
              value={form.nome}
              onChange={sev('nome')}
              placeholder="Nome completo"
              autoFocus
            />
          </FormField>

          {/* Cargo */}
          <FormField label="Cargo">
            <input
              className="input"
              value={form.cargo}
              onChange={sev('cargo')}
              placeholder="Ex: Diretor Comercial"
            />
          </FormField>

          {/* Telefone + E-mail em grid */}
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Telefone" error={errors.telefone}>
              <PhoneInput value={form.telefone} onChange={set('telefone')} />
            </FormField>
            <FormField label="E-mail" error={errors.email}>
              <input
                className="input"
                type="email"
                value={form.email}
                onChange={sev('email')}
                placeholder="email@empresa.com"
              />
            </FormField>
          </div>

          {/* Responsabilidade */}
          <FormField label="Responsabilidade">
            <input
              className="input"
              value={form.responsabilidade}
              onChange={sev('responsabilidade')}
              placeholder="Ex: Decisor executivo, Implantação técnica…"
            />
          </FormField>

          {/* Sponsor toggle */}
          <div className="flex items-center justify-between px-4 py-3 bg-amber-50 rounded-xl border border-amber-100">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-700">Sponsor</p>
                <p className="text-xs text-slate-400">
                  Contato principal / tomador de decisão
                </p>
              </div>
            </div>
            <Toggle checked={form.is_sponsor} onChange={set('is_sponsor')} />
          </div>
        </div>

        {/* Rodapé */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 shrink-0">
          <button type="button" onClick={onClose} className="btn-secondary text-sm">
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={upsert.isPending}
            className="btn-primary text-sm flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4" />
            {upsert.isPending ? 'Salvando…' : 'Salvar contato'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
