import { Search, X } from 'lucide-react'

// filters: [{key, label, type:'text'|'select', options:[{value,label}]}]
// values: {key: value}   onChange(key, value)
export default function FilterBar({ search, onSearch, filters = [], values = {}, onChange, onClear }) {
  const hasActive = search || Object.values(values).some(Boolean)
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search global */}
      {onSearch !== undefined && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => onSearch(e.target.value)}
            placeholder="Buscar…"
            className="pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white outline-none focus:border-orange-400 w-60"
          />
        </div>
      )}

      {/* Filtros select */}
      {filters.map(f => (
        <select key={f.key}
          value={values[f.key] ?? ''}
          onChange={e => onChange?.(f.key, e.target.value || null)}
          className="py-2 pl-3 pr-8 text-sm border border-slate-200 rounded-lg bg-white outline-none focus:border-orange-400 text-slate-600"
        >
          <option value="">{f.label}</option>
          {(f.options ?? []).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ))}

      {/* Limpar */}
      {hasActive && (
        <button onClick={onClear} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors">
          <X className="w-3.5 h-3.5" /> Limpar
        </button>
      )}
    </div>
  )
}
