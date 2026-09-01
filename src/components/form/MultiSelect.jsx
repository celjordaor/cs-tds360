import { useState, useRef, useEffect } from 'react'
import { Check, ChevronDown, X } from 'lucide-react'

// options: [{value, label}]   value: string[]   onChange(string[])
export default function MultiSelect({ options = [], value = [], onChange, placeholder = 'Selecionar…' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function outside(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', outside)
    return () => document.removeEventListener('mousedown', outside)
  }, [])

  function toggle(v) {
    onChange?.(value.includes(v) ? value.filter(x => x !== v) : [...value, v])
  }

  const selected = options.filter(o => value.includes(o.value))

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="input flex items-center justify-between gap-2 min-h-[40px] h-auto py-1.5 text-left w-full">
        <div className="flex flex-wrap gap-1 flex-1">
          {selected.length === 0
            ? <span className="text-slate-400 text-sm">{placeholder}</span>
            : selected.map(o => (
              <span key={o.value} className="inline-flex items-center gap-1 bg-orange-50 border border-orange-200 text-orange-700 rounded-full px-2 py-0.5 text-xs font-medium">
                {o.label}
                <button type="button" onClick={e => { e.stopPropagation(); toggle(o.value) }}><X className="w-3 h-3" /></button>
              </span>
            ))
          }
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <ul className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-auto max-h-52 py-1">
          {options.map(o => (
            <li key={o.value}>
              <button type="button" onClick={() => toggle(o.value)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 text-left">
                <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors
                  ${value.includes(o.value) ? 'bg-orange-500 border-orange-500 text-white' : 'border-slate-300'}`}>
                  {value.includes(o.value) && <Check className="w-3 h-3" />}
                </span>
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
