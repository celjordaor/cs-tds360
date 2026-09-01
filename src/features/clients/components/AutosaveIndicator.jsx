import { Check, Loader2, AlertCircle } from 'lucide-react'

// status: 'idle' | 'saving' | 'saved' | 'error'
export default function AutosaveIndicator({ status = 'idle' }) {
  if (status === 'idle') return null
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium transition-all
      ${status === 'saving' ? 'text-slate-400' : status === 'saved' ? 'text-emerald-600' : 'text-red-500'}`}>
      {status === 'saving' && <><Loader2 className="w-3.5 h-3.5 animate-spin" />Salvando…</>}
      {status === 'saved'  && <><Check className="w-3.5 h-3.5" />Salvo</>}
      {status === 'error'  && <><AlertCircle className="w-3.5 h-3.5" />Erro ao salvar</>}
    </span>
  )
}
