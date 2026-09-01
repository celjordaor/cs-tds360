import { useState } from 'react'
import { Plus, Pencil, Trash2, GripVertical, Check, X } from 'lucide-react'
import {
  useConfigOptions, useCreateConfigOption,
  useUpdateConfigOption, useDeleteConfigOption,
} from '@/hooks/useConfigOptions'
import Toggle from '@/components/ui/Toggle'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Spinner from '@/components/ui/Spinner'

const CATEGORIES = [
  { key: 'sistema',        label: 'Sistemas Contratados',  hint: 'Sistemas disponíveis para seleção nos projetos'         },
  { key: 'segmento',       label: 'Segmentos de Mercado',  hint: 'Segmentos que uma emissora/empresa pode atuar'          },
  { key: 'status_cliente', label: 'Status do Cliente',     hint: 'Status disponíveis para os clientes (referência)'       },
]

function OptionRow({ opt, category, onEdit }) {
  const update = useUpdateConfigOption()
  const del    = useDeleteConfigOption()
  const [confirm, setConfirm] = useState(false)

  return (
    <>
      <tr className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 group">
        <td className="px-3 py-2.5 text-slate-400 w-8">
          <GripVertical className="w-4 h-4 opacity-0 group-hover:opacity-100" />
        </td>
        <td className="px-3 py-2.5 text-xs font-mono text-slate-500">{opt.value}</td>
        <td className="px-3 py-2.5 text-slate-800">{opt.label}</td>
        <td className="px-3 py-2.5 text-center">
          <Toggle
            checked={opt.ativo}
            onChange={v => update.mutate({ id: opt.id, category, ativo: v })}
          />
        </td>
        <td className="px-3 py-2.5">
          <div className="flex items-center gap-1 justify-end">
            <button onClick={() => onEdit(opt)} className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setConfirm(true)} className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </td>
      </tr>
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={() => del.mutateAsync({ id: opt.id, category }).then(() => setConfirm(false))}
        loading={del.isPending}
        title="Remover opção"
        message={`Remover "${opt.label}"? Projetos que já usam este valor não serão afetados, mas a opção não aparecerá mais nos campos.`}
        confirmLabel="Remover"
      />
    </>
  )
}

function CategorySection({ category, label, hint }) {
  const { data = [], isLoading } = useConfigOptions(category)
  const create = useCreateConfigOption()
  const update = useUpdateConfigOption()
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ value: '', label: '' })

  function startAdd() { setForm({ value: '', label: '' }); setAdding(true); setEditing(null) }
  function startEdit(o) { setForm({ value: o.value, label: o.label }); setEditing(o); setAdding(false) }
  function cancel() { setAdding(false); setEditing(null) }

  async function save() {
    if (!form.value.trim() || !form.label.trim()) return
    if (editing) {
      await update.mutateAsync({ id: editing.id, category, label: form.label })
    } else {
      await create.mutateAsync({ category, value: form.value.trim().toLowerCase().replace(/\s+/g, '_'), label: form.label.trim(), ordem: data.length + 1 })
    }
    cancel()
  }

  const isSaving = create.isPending || update.isPending

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{label}</h3>
          {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
        </div>
        <button onClick={startAdd} className="flex items-center gap-1.5 text-xs text-orange-500 hover:text-orange-600 font-medium">
          <Plus className="w-4 h-4" /> Adicionar
        </button>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400 font-semibold">
            <th className="w-8" />
            <th className="px-3 py-2.5 text-left">Valor (chave)</th>
            <th className="px-3 py-2.5 text-left">Label exibido</th>
            <th className="px-3 py-2.5 text-center w-20">Ativo</th>
            <th className="w-20" />
          </tr>
        </thead>
        <tbody>
          {(adding || editing) && (
            <tr className="bg-orange-50/40 border-b border-orange-100">
              <td />
              <td className="px-2 py-2">
                <input className="input py-1.5 text-sm font-mono" placeholder="ex: adsim" value={form.value}
                  onChange={e => setForm(f => ({ ...f, value: e.target.value }))} disabled={!!editing}
                  readOnly={!!editing} />
              </td>
              <td className="px-2 py-2">
                <input className="input py-1.5 text-sm" placeholder="ex: Adsim" value={form.label}
                  onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel() }} />
              </td>
              <td />
              <td className="px-2 py-2">
                <div className="flex items-center gap-1">
                  <button onClick={save} disabled={isSaving || !form.value || !form.label}
                    className="p-1.5 rounded bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50">
                    {isSaving ? <Spinner size="sm" /> : <Check className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={cancel} className="p-1.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          )}
          {isLoading
            ? <tr><td colSpan={5} className="py-8 text-center"><Spinner /></td></tr>
            : data.map(o => <OptionRow key={o.id} opt={o} category={category} onEdit={startEdit} />)
          }
          {!isLoading && data.length === 0 && !adding && (
            <tr><td colSpan={5} className="px-5 py-6 text-center text-slate-400 text-sm">Nenhuma opção cadastrada</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export default function ConfigOptionsTab() {
  return (
    <div className="space-y-6 max-w-3xl">
      {CATEGORIES.map(c => (
        <CategorySection key={c.key} category={c.key} label={c.label} hint={c.hint} />
      ))}
    </div>
  )
}
