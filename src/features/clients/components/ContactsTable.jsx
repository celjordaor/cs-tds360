import { useState } from 'react'
import { Plus, Pencil, Trash2, Star, Check, X } from 'lucide-react'
import { useUpsertContact, useDeleteContact } from '@/hooks/useClients'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import PhoneInput from '@/components/form/PhoneInput'
import Toggle from '@/components/ui/Toggle'

const EMPTY = { nome: '', cargo: '', telefone: '', email: '', responsabilidade: '', is_sponsor: false }

export default function ContactsTable({ projectId, contacts = [] }) {
  const [editing, setEditing] = useState(null)   // null | 'new' | {id,...}
  const [form, setForm] = useState(EMPTY)
  const [delTarget, setDelTarget] = useState(null)
  const upsert = useUpsertContact()
  const remove = useDeleteContact()

  function startNew() { setForm(EMPTY); setEditing('new') }
  function startEdit(c) { setForm(c); setEditing(c) }
  function cancel() { setEditing(null); setForm(EMPTY) }

  async function save() {
    const payload = { ...form, project_id: projectId }
    if (editing !== 'new') payload.id = editing.id
    await upsert.mutateAsync(payload)
    cancel()
  }

  const isSaving = upsert.isPending

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="label">Contatos do Cliente</p>
        <button type="button" onClick={startNew}
          className="flex items-center gap-1.5 text-xs text-orange-500 hover:text-orange-600 font-medium">
          <Plus className="w-4 h-4" /> Adicionar
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500 font-semibold">
              <th className="px-4 py-2.5 text-left">Nome</th>
              <th className="px-4 py-2.5 text-left">Cargo</th>
              <th className="px-4 py-2.5 text-left">Telefone</th>
              <th className="px-4 py-2.5 text-left">E-mail</th>
              <th className="px-4 py-2.5 text-left">Responsabilidade</th>
              <th className="px-4 py-2.5 text-center w-16">Sponsor</th>
              <th className="w-20" />
            </tr>
          </thead>
          <tbody>
            {/* Linha de novo/edição */}
            {editing && (
              <tr className="bg-orange-50/40 border-b border-orange-100">
                {['nome','cargo','telefone','email','responsabilidade'].map(field => (
                  <td key={field} className="px-2 py-2">
                    {field === 'telefone'
                      ? <PhoneInput value={form.telefone} onChange={v => setForm(f=>({...f,telefone:v}))} />
                      : <input className="input py-1.5 text-sm" value={form[field]}
                          onChange={e => setForm(f=>({...f,[field]:e.target.value}))}
                          placeholder={field.charAt(0).toUpperCase()+field.slice(1)} />
                    }
                  </td>
                ))}
                <td className="px-4 py-2 text-center">
                  <Toggle checked={form.is_sponsor} onChange={v => setForm(f=>({...f,is_sponsor:v}))} />
                </td>
                <td className="px-2 py-2">
                  <div className="flex items-center gap-1">
                    <button onClick={save} disabled={isSaving || !form.nome.trim()}
                      className="p-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={cancel} className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            )}
            {contacts.length === 0 && !editing && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400 text-sm">Nenhum contato cadastrado</td></tr>
            )}
            {contacts.map(c => (
              <tr key={c.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                <td className="px-4 py-2.5 font-medium text-slate-800">
                  <span className="flex items-center gap-1.5">
                    {c.is_sponsor && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                    {c.nome}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-slate-600">{c.cargo || '—'}</td>
                <td className="px-4 py-2.5 text-slate-600">{c.telefone || '—'}</td>
                <td className="px-4 py-2.5 text-slate-600">{c.email || '—'}</td>
                <td className="px-4 py-2.5 text-slate-600">{c.responsabilidade || '—'}</td>
                <td className="px-4 py-2.5 text-center">{c.is_sponsor ? <Star className="w-4 h-4 text-amber-400 fill-amber-400 mx-auto" /> : ''}</td>
                <td className="px-2 py-2">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => startEdit(c)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDelTarget(c)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={!!delTarget}
        onClose={() => setDelTarget(null)}
        onConfirm={() => remove.mutateAsync({ id: delTarget.id, project_id: projectId }).then(() => setDelTarget(null))}
        loading={remove.isPending}
        title="Remover contato"
        message={`Deseja remover "${delTarget?.nome}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Remover"
      />
    </div>
  )
}
