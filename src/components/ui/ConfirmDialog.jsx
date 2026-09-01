import Modal from './Modal'
import Spinner from './Spinner'

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, loading = false,
  confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', variant = 'danger' }) {
  const btnCls = variant === 'danger'
    ? 'bg-red-600 hover:bg-red-700 text-white'
    : 'btn-primary'
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary" disabled={loading}>{cancelLabel}</button>
          <button onClick={onConfirm} disabled={loading}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${btnCls}`}>
            {loading && <Spinner size="sm" />}
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-slate-600 text-sm">{message}</p>
    </Modal>
  )
}
