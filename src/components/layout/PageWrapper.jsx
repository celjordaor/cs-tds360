export default function PageWrapper({ title, subtitle, actions, children }) {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {(title || actions) && (
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            {title && <h1 className="text-xl font-bold text-slate-900">{title}</h1>}
            {subtitle && <p className="text-slate-500 text-sm mt-0.5">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  )
}
