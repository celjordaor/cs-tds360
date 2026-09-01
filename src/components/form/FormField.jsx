// Wrapper padrão: label + input/children + mensagem de erro
export default function FormField({ label, error, required, children, hint, className = '' }) {
  return (
    <div className={className}>
      {label && (
        <label className="label block mb-1">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-slate-400 text-xs mt-1">{hint}</p>}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}
