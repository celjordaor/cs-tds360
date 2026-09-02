import { ChevronLeft, Building2, User, Star, MapPin } from 'lucide-react'
import StatusBadge from './StatusBadge'

/**
 * ClientPageHeader — cabeçalho visualmente proeminente para a tela de cliente.
 *
 * Props:
 *   client   — objeto da tabela clients (razao_social, fantasia, status, cidade, estado)
 *   project  — objeto da tabela projects com join responsavel_cs:profiles!responsavel_cs_id(nome)
 *              e array sistemas_contratados
 *   contacts — array da tabela contacts para o projeto (useContacts)
 *   onBack   — função chamada ao clicar no botão voltar
 *
 * Reutilizável: basta passar os mesmos props em qualquer outra tela que
 * carregue um cliente + projeto + contatos.
 */
export default function ClientPageHeader({ client, project, contacts = [], onBack }) {
  const sponsor = contacts.find((c) => c.is_sponsor)
  const sistemas = project?.sistemas_contratados ?? []
  const csNome = project?.responsavel_cs?.nome
  const location = [client.cidade, client.estado].filter(Boolean).join(' · ')

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-6 shadow-sm">
      {/* Barra de acento laranja no topo */}
      <div className="h-1.5 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600" />

      <div className="px-6 py-5">
        {/* Linha principal: voltar + ícone + nome + status */}
        <div className="flex items-start gap-2">
          <button
            onClick={onBack}
            className="mt-0.5 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0 -ml-1"
            aria-label="Voltar"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Ícone com gradiente */}
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                <Building2 className="w-5 h-5 text-white" />
              </div>

              <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                <h1 className="text-xl font-bold text-slate-900 leading-tight truncate">
                  {client.razao_social}
                </h1>
                <StatusBadge status={client.status} />
              </div>
            </div>

            {/* Nome fantasia */}
            {client.fantasia && (
              <p className="mt-1 ml-[52px] text-sm text-slate-500 leading-snug">
                {client.fantasia}
              </p>
            )}
          </div>
        </div>

        {/* Linha de informações extras */}
        {(csNome || sponsor || location || sistemas.length > 0) && (
          <div className="mt-4 ml-[52px] flex flex-wrap items-center gap-2">

            {/* CS Responsável */}
            {csNome && (
              <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg px-3 py-1.5 text-sm font-medium">
                <User className="w-3.5 h-3.5 flex-shrink-0" />
                {csNome}
              </span>
            )}

            {/* Contato Sponsor */}
            {sponsor && (
              <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg px-3 py-1.5 text-sm font-medium">
                <Star className="w-3.5 h-3.5 flex-shrink-0" />
                {sponsor.nome}
                {sponsor.cargo && (
                  <span className="text-amber-500 font-normal">· {sponsor.cargo}</span>
                )}
              </span>
            )}

            {/* Localização */}
            {location && (
              <span className="inline-flex items-center gap-1.5 text-slate-500 text-sm">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                {location}
              </span>
            )}

            {/* Separador visual antes dos sistemas, se houver outros chips antes */}
            {sistemas.length > 0 && (csNome || sponsor || location) && (
              <span className="w-px h-4 bg-slate-200 mx-1" aria-hidden="true" />
            )}

            {/* Sistemas contratados */}
            {sistemas.map((s) => (
              <span
                key={s}
                className="inline-flex items-center bg-violet-50 text-violet-700 border border-violet-200 rounded-md px-2.5 py-1 text-xs font-semibold uppercase tracking-wide"
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
