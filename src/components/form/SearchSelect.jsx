import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Search, Check, ChevronDown, X } from 'lucide-react'
import Spinner from '@/components/ui/Spinner'

// options: [{value, label, sublabel?}]
// value: string | null    onChange(string|null)
export default function SearchSelect({
  options = [], value = null, onChange, placeholder = 'Buscar…',
  onSearch, loading = false, clearable = true, disabled = false,
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 })
  const triggerRef = useRef(null)
  const panelRef = useRef(null)
  const inputRef = useRef(null)

  const reposition = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const panelH = 260
    const openUp = spaceBelow < panelH && rect.top > spaceBelow
    setPos({ left: rect.left, width: rect.width, top: openUp ? rect.top - panelH - 4 : rect.bottom + 4 })
  }, [])

  function handleOpen() {
    if (disabled) return
    reposition()
    setOpen(true)
    setQuery('')
    setTimeout(() => inputRef.current?.focus(), 30)
  }

  useEffect(() => {
    if (!open) return
    function onScroll() { reposition() }
    function onClickOutside(e) {
      if (!triggerRef.current?.contains(e.target) && !panelRef.current?.contains(e.target)) {
        setOpen(false); setQuery('')
      }
    }
    window.addEventListener('scroll', onScroll, true)
    document.addEventListener('mousedown', onClickOutside)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      document.removeEventListener('mousedown', onClickOutside)
    }
  }, [open, reposition])

  useEffect(() => {
    if (open && onSearch) onSearch(query)
  }, [query, open])

  const filtered = onSearch ? options : options.filter(o =>
    `${o.label} ${o.sublabel ?? ''}`.toLowerCase().includes(query.toLowerCase())
  )
  const selected = options.find(o => o.value === value)

  function pick(v) { onChange?.(v); setOpen(false); setQuery('') }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={handleOpen}
        className={`input flex items-center justify-between gap-2 w-full text-left
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span className={selected ? 'text-slate-900 truncate' : 'text-slate-400'}>
          {selected ? selected.label : placeholder}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {clearable && value && !disabled && (
            <span
              onMouseDown={e => { e.stopPropagation(); e.preventDefault(); onChange?.(null) }}
              className="p-0.5 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {open && createPortal(
        <div
          ref={panelRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
          className="bg-white border border-slate-200 rounded-xl shadow-xl"
        >
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => { setQuery(e.target.value); onSearch?.(e.target.value) }}
                onKeyDown={e => { if (e.key === 'Escape') { setOpen(false); setQuery('') } }}
                placeholder={placeholder}
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-orange-400"
              />
            </div>
          </div>
          <ul className="max-h-48 overflow-auto py-1">
            {loading
              ? <li className="px-3 py-3 flex justify-center"><Spinner size="sm" /></li>
              : filtered.length === 0
                ? <li className="px-3 py-3 text-sm text-slate-400 text-center">Sem resultados</li>
                : filtered.map(o => (
                  <li key={o.value}>
                    <button
                      type="button"
                      onMouseDown={e => { e.preventDefault(); pick(o.value) }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 text-left"
                    >
                      <Check className={`w-4 h-4 shrink-0 text-orange-500 ${o.value === value ? 'opacity-100' : 'opacity-0'}`} />
                      <span>
                        <span className="block text-slate-800">{o.label}</span>
                        {o.sublabel && <span className="block text-xs text-slate-400">{o.sublabel}</span>}
                      </span>
                    </button>
                  </li>
                ))
            }
          </ul>
        </div>,
        document.body
      )}
    </>
  )
}
