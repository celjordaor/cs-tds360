import { useState } from 'react'
import { ChevronLeft, Building2, User, Star, MapPin, Trash2, Loader2 } from 'lucide-react'
import StatusBadge from './StatusBadge'

/**
 * ClientPageHeader — cabeçalho da tela de cliente.
 *
 * Props:
 *   client     — objeto da tabela clients
 *   project    — objeto da tabela projects
 *   contacts   — array de contacts
 *   onBack     — fn ao clicar em voltar
 *   onDelete   — fn async chamada ao confirmar exclusão (opcional)
 *   isDeleting — boolean de loading durante exclusão (opcional)
 */
export default function ClientPageHeader({ client, project, contacts = [], onBack, onDelete, isDeleting }) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  const sponsor  = contacts.find(c => c.is_sponsor)
  const sistemas = project?.sistemas_contratados ?? []
  const csNome   = project?.responsavel_cs?.nome
  const location = [client.cidade, client.estado].filter(Boolean).join(' · ')

  async function handleConfirmDelete() {
    if (onDelete) await onDelete()
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-5 shadow-sm">
      {/* Barra de acento laranja */}
      <div className="h-1 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600" />

      <div className="px-5 py-3">
        {/* Linha principal */}
        <div className="flex items-start justify-between gap-2">

          {/* Esquerda: voltar + ícone + nome */}
          <div className="flex items-start gap-1.5 min-w-0 flex-1">
            <button
              onClick={onBack}
              className="mt-0.5 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0 -ml-0.5"
              aria-label="Voltar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Ícone */}
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Building2 className="w-4 h-4 text-white" />
                </div>

                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <h1 className="text-base font-bold text-slate-900 leading-tight truncate">
                    {client.razao_social}
                  </h1>
                  <StatusBadge status={client.status} />
                </div>
              </div>

              {/* Nome fantasia */}
              {client.fantasia && (
                <p className="mt-0.5 ml-10 text-xs text-slate-400 leading-snug">
                  {client.fantasia}
                </p>
              )}
            </div>
          </div>

          {/* Direita: botão excluir */}
          {onDelete && (
            <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
              {confirmDelete ? (
                <>
                  <span className="text-xs text-slate-500 whitespace-nowrap">Confirmar exclusão?</span>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    disabled={isDeleting}
                    className="px-2.5 py-1 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    disabled={isDeleting}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isDeleting
                      ? <Loader2 className="w-3 h-3 animate-spin" />
                      : <Trash2 className="w-3 h-3" />
                    }
                    Excluir
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Excluir cliente"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Linha de pills */}
        {(csNome || sponsor || location || sistemas.length > 0) && (
          <div className="mt-2.5 ml-10 flex flex-wrap items-center gap-1.5">

            {/* CS Responsável */}
            {csNome && (
              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-md px-2 py-1 text-xs font-medium">
                <User className="w-3 h-3 flex-shrink-0" />
                {csNome}
              </span>
            )}

            {/* Sponsor */}
            {sponsor && (
              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-md px-2 py-1 text-xs font-medium">
                <Star className="w-3 h-3 flex-shrink-0" />
                {sponsor.nome}
                {sponsor.cargo && (
                  <span className="text-amber-500 font-normal">· {sponsor.cargo}</span>
                )}
              </span>
            )}

            {/* Localização */}
            {location && (
              <span className="inline-flex items-center gap-1 text-slate-400 text-xs">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                {location}
              </span>
            )}

            {/* Separador */}
            {sistemas.length > 0 && (csNome || sponsor || location) && (
              <span className="w-px h-3 bg-slate-200 mx-0.5" aria-hidden="true" />
            )}

            {/* Sistemas contratados */}
            {sistemas.map(s => (
              <span
                key={s}
                className="inline-flex items-center bg-violet-50 text-violet-700 border border-violet-200 rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
              >
                {s}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
