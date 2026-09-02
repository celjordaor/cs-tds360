import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, MapPin, User, Star, LayoutGrid } from 'lucide-react'
import { useClients } from '@/hooks/useClients'
import { useConfigOptionsActive } from '@/hooks/useConfigOptions'
import { useDebounce } from '@/hooks/useDebounce'
import { RequireAuth } from '@/routes/index'
import AppLayout from '@/components/layout/AppLayout'
import PageWrapper from '@/components/layout/PageWrapper'
import FilterBar from '@/components/data/FilterBar'
import StatusBadge from './components/StatusBadge'
import NewClientModal from './NewClientModal'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'

const SISTEMA_FILTER = [
  { value: 'adsim',       label: 'Adsim'        },
  { value: 'midiaplus',   label: 'Mídia+'        },
  { value: 'adanalytics', label: 'Ad Analytics'  },
  { value: 'adchecking',  label: 'Adchecking'    },
]

const SISTEMA_LABEL = {
  adsim: 'Adsim', midiaplus: 'Mídia+', adanalytics: 'Analytics', adchecking: 'Adchecking',
}

// Cor da borda esquerda conforme status
const STATUS_BORDER = {
  prospecto:   '#94A3B8',
  implantacao: '#3B82F6',
  ativo:       '#059669',
  pausado:     '#D97706',
  cancelado:   '#EF4444',
}

// ─── Card de cliente ──────────────────────────────────────────────────────────
function ClientCard({ client, onClick }) {
  const proj    = client.projects?.[0]
  const sistemas = proj?.sistemas_contratados ?? []
  const pct      = proj?.onboarding_pct ?? 0
  const csNome   = proj?.responsavel_cs?.nome ?? null
  const sponsor  = proj?.contacts?.find(c => c.is_sponsor) ?? null
  const borderColor = STATUS_BORDER[client.status] ?? '#CBD5E1'

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-slate-100 shadow-sm cursor-pointer
                 hover:shadow-md hover:border-slate-200 transition-all duration-150 overflow-hidden flex flex-col"
      style={{ borderLeftColor: borderColor, borderLeftWidth: '3.5px' }}
    >
      {/* Cabeçalho */}
      <div className="px-4 pt-4 pb-3 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-slate-800 text-sm leading-snug truncate">
              {client.razao_social}
            </p>
            {client.fantasia && (
              <p className="text-xs text-slate-400 truncate mt-0.5">{client.fantasia}</p>
            )}
          </div>
          <div className="shrink-0 mt-0.5">
            <StatusBadge status={client.status} />
          </div>
        </div>

        {/* Localização */}
        {(client.cidade || client.estado) && (
          <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">
              {[client.cidade, client.estado].filter(Boolean).join(' / ')}
            </span>
          </div>
        )}

        {/* Sistemas contratados */}
        {sistemas.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {sistemas.map(s => (
              <span
                key={s}
                className="text-xs bg-orange-50 text-orange-700 border border-orange-200 rounded-full px-2 py-0.5 font-medium"
              >
                {SISTEMA_LABEL[s] ?? s}
              </span>
            ))}
          </div>
        )}
        {sistemas.length === 0 && (
          <div className="flex items-center gap-1 mt-3 text-xs text-slate-300">
            <LayoutGrid className="w-3 h-3" />
            <span>Sem sistemas cadastrados</span>
          </div>
        )}
      </div>

      {/* Rodapé: CS + Sponsor */}
      <div className="border-t border-slate-50 px-4 py-2.5 flex items-center gap-3 flex-wrap">
        {csNome ? (
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <User className="w-3 h-3 text-blue-500" />
            </div>
            <span className="text-xs text-slate-600 truncate">{csNome}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
              <User className="w-3 h-3 text-slate-300" />
            </div>
            <span className="text-xs text-slate-300">Sem CS</span>
          </div>
        )}

        {sponsor ? (
          <div className="flex items-center gap-1.5 min-w-0 ml-auto">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
            <span className="text-xs text-slate-500 truncate">{sponsor.nome}</span>
          </div>
        ) : null}
      </div>

      {/* Barra de progresso */}
      <div className="px-4 pb-3 pt-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-slate-400">Onboarding</span>
          <span className="text-xs font-medium text-slate-500">{pct}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${pct}%`,
              background: pct >= 100
                ? '#059669'
                : pct >= 60
                  ? '#F97316'
                  : '#94A3B8',
            }}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function ClientsListPage() {
  return (
    <RequireAuth>
      <AppLayout>
        <ClientsListInner />
      </AppLayout>
    </RequireAuth>
  )
}

function ClientsListInner() {
  const navigate = useNavigate()
  const [search, setSearch]   = useState('')
  const [filters, setFilters] = useState({})
  const [showNew, setShowNew] = useState(false)
  const dSearch = useDebounce(search, 350)
  const { data: statusOpts = [] } = useConfigOptionsActive('status_projeto')

  const { data: clients = [], isLoading } = useClients({ search: dSearch, ...filters })

  const filtered = filters.sistema
    ? clients.filter(c => c.projects?.some(p => p.sistemas_contratados?.includes(filters.sistema)))
    : clients

  function setFilter(key, val) { setFilters(f => ({ ...f, [key]: val })) }
  function clearAll()          { setSearch(''); setFilters({}) }

  return (
    <PageWrapper
      title="Clientes"
      subtitle={`${filtered.length} cliente${filtered.length !== 1 ? 's' : ''}`}
      actions={
        <button onClick={() => setShowNew(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Novo Cliente
        </button>
      }
    >
      <div className="space-y-4">
        <FilterBar
          search={search}
          onSearch={setSearch}
          values={filters}
          onChange={setFilter}
          onClear={clearAll}
          filters={[
            { key: 'status',  label: 'Status',  options: statusOpts     },
            { key: 'sistema', label: 'Sistema', options: SISTEMA_FILTER },
          ]}
        />

        {isLoading ? (
          <div className="py-20 flex justify-center">
            <Spinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200">
            <EmptyState
              title="Nenhum cliente encontrado"
              description="Clique em Novo Cliente para cadastrar o primeiro."
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(client => (
              <ClientCard
                key={client.id}
                client={client}
                onClick={() => navigate(`/clients/${client.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      <NewClientModal
        open={showNew}
        onClose={() => setShowNew(false)}
        onCreated={({ client }) => navigate(`/clients/${client.id}`)}
      />
    </PageWrapper>
  )
}
