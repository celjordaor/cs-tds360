import { useState, useRef, useEffect } from 'react'
import { Search, Check, ChevronDown, X } from 'lucide-react'
import Spinner from '@/components/ui/Spinner'

// options: [{value, label, sublabel?}]   — pode ser async se onSearch retornar Promise
// value: string | null    onChange(string|null)
export default function SearchSelect({
  options = [], value = null, onChange, placeholder = 'Buscar…',
  onSearch, loading = false, clearable = true, disabled = false,
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)
  const ref = useRef(null)

  useEffect(() => {
    function outside(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', outside)
    return () => document.removeEventListener('mousedown', outside)
  }, [])

  const filtered = onSearch ? options : options.filter(o =>
    `${o.label} ${o.sublabel ?? ''}`.toLowerCase().includes(query.toLowerCase())
  )
  const selected = options.find(o => o.value === value)

  function handleOpen() {
    if (disabled) return
    setOpen(true)
    setQuery('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }
  function pick(v) { onChange?.(v); setOpen(false); setQuery('') }

  useEffect(() => {
    if (open && onSearch) onSearch(query)
  }, [query, open])

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button type="button" onClick={handleOpen} disabled={disabled}
        className={`input flex items-center justify-between gap-2 w-full text-left ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <span className={selected ? 'text-slate-900' : 'text-slate-400'}>
          {selected ? selected.label : placeholder}
        </span>
        <div className="flex items-center gap-1">
          {clearable && value && (
            <span onClick={e => { e.stopPropagation(); onChange?.(null) }}
              className="p-0.5 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600">
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {open && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg">
          {/* Search */}
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input ref={inputRef} value={query} onChange={e => { setQuery(e.target.value); onSearch?.(e.target.value) }}
                placeholder={placeholder} className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-orange-400" />
            </div>
          </div>
          {/* Options */}
          <ul className="max-h-48 overflow-auto py-1">
            {loading
              ? <li className="px-3 py-3 flex justify-center"><Spinner size="sm" /></li>
              : filtered.length === 0
                ? <li className="px-3 py-3 text-sm text-slate-400 text-center">Sem resultados</li>
                : filtered.map(o => (
                  <li key={o.value}>
                    <button type="button" onClick={() => pick(o.value)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 text-left">
                      <Check className={`w-4 h-4 shrink-0 text-orange-500 transition-opacity ${o.value === value ? 'opacity-100' : 'opacity-0'}`} />
                      <span>
                        <span className="block text-slate-800">{o.label}</span>
                        {o.sublabel && <span className="block text-xs text-slate-400">{o.sublabel}</span>}
                      </span>
                    </button>
                  </li>
                ))
            }
          </ul>
        </div>
      )}
    </div>
  )
}
