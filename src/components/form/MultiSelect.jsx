import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, X } from 'lucide-react'

// options: [{value, label}]   value: string[]   onChange(string[])
export default function MultiSelect({ options = [], value = [], onChange, placeholder = 'Selecionar…', disabled = false }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 })
  const triggerRef = useRef(null)
  const panelRef = useRef(null)

  const reposition = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    // Decide se abre para baixo ou para cima
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    const panelH = Math.min(options.length * 40 + 8, 220)
    const openUp = spaceBelow < panelH && spaceAbove > spaceBelow
    setPos({
      left: rect.left,
      width: rect.width,
      top: openUp ? rect.top - panelH - 4 : rect.bottom + 4,
    })
  }, [options.length])

  function handleOpen() {
    if (disabled) return
    reposition()
    setOpen(o => !o)
  }

  useEffect(() => {
    if (!open) return
    function onScroll() { reposition() }
    function onClickOutside(e) {
      if (!triggerRef.current?.contains(e.target) && !panelRef.current?.contains(e.target)) setOpen(false)
    }
    window.addEventListener('scroll', onScroll, true)
    document.addEventListener('mousedown', onClickOutside)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      document.removeEventListener('mousedown', onClickOutside)
    }
  }, [open, reposition])

  function toggle(v) {
    if (disabled) return
    onChange?.(value.includes(v) ? value.filter(x => x !== v) : [...value, v])
  }

  const selected = options.filter(o => value.includes(o.value))

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={handleOpen}
        className={`input flex items-center justify-between gap-2 min-h-[40px] h-auto py-1.5 text-left w-full
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="flex flex-wrap gap-1 flex-1 min-w-0">
          {selected.length === 0
            ? <span className="text-slate-400 text-sm">{placeholder}</span>
            : selected.map(o => (
              <span key={o.value}
                className="inline-flex items-center gap-1 bg-orange-50 border border-orange-200 text-orange-700 rounded-full px-2 py-0.5 text-xs font-medium">
                {o.label}
                <span
                  role="button"
                  onMouseDown={e => { e.stopPropagation(); e.preventDefault(); toggle(o.value) }}
                  className="hover:text-orange-900 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </span>
              </span>
            ))
          }
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && createPortal(
        <ul
          ref={panelRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
          className="bg-white border border-slate-200 rounded-xl shadow-xl overflow-auto max-h-56 py-1"
        >
          {options.length === 0
            ? <li className="px-3 py-3 text-sm text-slate-400 text-center">Sem opções</li>
            : options.map(o => (
              <li key={o.value}>
                <button
                  type="button"
                  onMouseDown={e => { e.preventDefault(); toggle(o.value) }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 text-left"
                >
                  <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors
                    ${value.includes(o.value) ? 'bg-orange-500 border-orange-500 text-white' : 'border-slate-300'}`}>
                    {value.includes(o.value) && <Check className="w-3 h-3" />}
                  </span>
                  {o.label}
                </button>
              </li>
            ))
          }
        </ul>,
        document.body
      )}
    </>
  )
}
