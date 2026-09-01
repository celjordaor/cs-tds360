const VARIANTS = {
  green:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  yellow: 'bg-amber-50 text-amber-700 border-amber-200',
  red:    'bg-red-50 text-red-700 border-red-200',
  blue:   'bg-blue-50 text-blue-700 border-blue-200',
  slate:  'bg-slate-100 text-slate-600 border-slate-200',
  orange: 'bg-orange-50 text-orange-700 border-orange-200',
}

export default function Badge({ children, variant = 'slate', className = '' }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${VARIANTS[variant] ?? VARIANTS.slate} ${className}`}>
      {children}
    </span>
  )
}
