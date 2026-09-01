import { InboxIcon } from 'lucide-react'
export default function EmptyState({ title = 'Sem resultados', description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <InboxIcon className="w-10 h-10 text-slate-300 mb-3" />
      <p className="text-slate-600 font-medium">{title}</p>
      {description && <p className="text-slate-400 text-sm mt-1">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
