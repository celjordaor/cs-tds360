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
  { key: 'sistema',          label: 'Sistemas Contratados',  hint: 'Sistemas disponíveis para seleção nos projetos'                 },
  { key: 'segmento',         label: 'Segmentos de Mercado',  hint: 'Segmentos que uma emissora/empresa pode atuar'                  },
  { key: 'status_projeto',   label: 'Status do Projeto',     hint: 'Status do ciclo de vida dos projetos'                          },
  { key: 'modulo_adsim',     label: 'Módulos Adsim',         hint: 'Módulos do Adsim exibidos na aba Configurações Técnicas'        },
  { key: 'modulo_midiaplus', label: 'Módulos Mídia+',        hint: 'Módulos do Mídia+ exibidos na aba Configurações Técnicas'       },
]

// Gera slug interno a partir do label — nunca muda após a criação
function toSlug(str = '') {
  return str
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // remove acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

function OptionRow({ opt, category, onEdit }) {
  const update = useUpdateConfigOption()
  const del    = useDeleteConfigOption()
  const [confirm, setConfirm] = useState(false)

  return (
    <>
      <tr className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 group">
        <td className="px-3 py-2.5 text-slate-300 w-8">
          <GripVertical className="w-4 h-4 opacity-0 group-hover:opacity-100" />
        </td>
        <td className="px-3 py-2.5 text-slate-800">{opt.label}</td>
        <td className="px-3 py-2.5 text-center">
          <Toggle
            checked={opt.ativo}
            onChange={v => update.mutate({ id: opt.id, category, ativo: v })}
          />
        </td>
        <td className="px-3 py-2.5">
          <div className="flex items-center gap-1 justify-end">
            <button
              onClick={() => onEdit(opt)}
              className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              title="Editar nome"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setConfirm(true)}
              className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
              title="Remover"
            >
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
  const [adding, setAdding]   = useState(false)
  const [editing, setEditing] = useState(null)
  const [labelVal, setLabelVal] = useState('')

  function startAdd()   { setLabelVal(''); setAdding(true); setEditing(null) }
  function startEdit(o) { setLabelVal(o.label); setEditing(o); setAdding(false) }
  function cancel()     { setAdding(false); setEditing(null); setLabelVal('') }

  async function save() {
    const trimmed = labelVal.trim()
    if (!trimmed) return
    if (editing) {
      await update.mutateAsync({ id: editing.id, category, label: trimmed })
    } else {
      const slug = toSlug(trimmed)
      await create.mutateAsync({
        category,
        value: slug,
        label: trimmed,
        ordem: data.length + 1,
      })
    }
    cancel()
  }

  const isSaving = create.isPending || update.isPending

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{label}</h3>
          {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
        </div>
        <button
          onClick={startAdd}
          className="flex items-center gap-1.5 text-xs text-orange-500 hover:text-orange-600 font-medium"
        >
          <Plus className="w-4 h-4" /> Adicionar
        </button>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400 font-semibold">
            <th className="w-8" />
            <th className="px-3 py-2.5 text-left">Nome exibido</th>
            <th className="px-3 py-2.5 text-center w-20">Ativo</th>
            <th className="w-24" />
          </tr>
        </thead>
        <tbody>
          {/* Linha de adição / edição inline */}
          {(adding || editing) && (
            <tr className="bg-orange-50/40 border-b border-orange-100">
              <td />
              <td className="px-2 py-2" colSpan={2}>
                <input
                  autoFocus
                  className="input py-1.5 text-sm w-full"
                  placeholder={adding ? 'Nome da opção…' : editing?.label}
                  value={labelVal}
                  onChange={e => setLabelVal(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter')  save()
                    if (e.key === 'Escape') cancel()
                  }}
                />
              </td>
              <td className="px-2 py-2">
                <div className="flex items-center gap-1 justify-end">
                  <button
                    onClick={save}
                    disabled={isSaving || !labelVal.trim()}
                    className="p-1.5 rounded bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50"
                  >
                    {isSaving ? <Spinner size="sm" /> : <Check className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={cancel}
                    className="p-1.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          )}

          {isLoading
            ? <tr><td colSpan={4} className="py-8 text-center"><Spinner /></td></tr>
            : data.map(o => (
                <OptionRow key={o.id} opt={o} category={category} onEdit={startEdit} />
              ))
          }

          {!isLoading && data.length === 0 && !adding && (
            <tr>
              <td colSpan={4} className="px-5 py-6 text-center text-slate-400 text-sm">
                Nenhuma opção cadastrada
              </td>
            </tr>
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
