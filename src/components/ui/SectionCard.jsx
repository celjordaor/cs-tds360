import { Check } from 'lucide-react'
import { GRAD, BORDER } from '@/lib/sectionColors'

/**
 * SectionCard — card de seção com borda colorida e cabeçalho rico.
 * Padrão visual aprovado (Option A + C hybrid) — usar em todas as telas.
 *
 * Props:
 *   color     {string}        – chave de cor: 'orange'|'violet'|'blue'|'green'|'sky'|'amber'|'red'|'slate'|'teal'|'pink'
 *   icon      {LucideIcon}    – ícone do react-icons/lucide-react
 *   title     {string}        – título da seção
 *   subtitle  {string}        – subtítulo/descrição (opcional)
 *   complete  {boolean|null}  – true=✓ verde, false=○ slate, null=sem indicador
 *   action    {ReactNode}     – botão/elemento extra no canto direito do cabeçalho (opcional)
 *   children  {ReactNode}     – conteúdo da seção
 */
export default function SectionCard({ color = 'slate', icon: Icon, title, subtitle, complete, action, children }) {
  const borderColor = BORDER[color] ?? '#94A3B8'
  const gradient    = GRAD[color]   ?? GRAD.slate

  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden"
      style={{ borderLeftColor: borderColor, borderLeftWidth: '3.5px' }}
    >
      {/* Cabeçalho */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50">
        <div className="flex items-center gap-3 min-w-0">
          {Icon && (
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm"
              style={{ background: gradient }}
            >
              <Icon className="w-4 h-4 text-white" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 leading-tight">{title}</p>
            {subtitle && (
              <p className="text-xs text-slate-400 mt-0.5 leading-tight">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-2">
          {/* Ação extra (botão, badge, etc.) */}
          {action}

          {/* Indicador de conclusão */}
          {complete === true && (
            <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
              <Check className="w-3 h-3 text-emerald-600" strokeWidth={2.5} />
            </span>
          )}
          {complete === false && (
            <span className="w-5 h-5 rounded-full border-2 border-slate-300" />
          )}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-4">{children}</div>
    </div>
  )
}
