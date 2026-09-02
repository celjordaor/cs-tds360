import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useClients } from '@/hooks/useClients'
import { useDebounce } from '@/hooks/useDebounce'
import { RequireAuth } from '@/routes/index'
import AppLayout from '@/components/layout/AppLayout'
import PageWrapper from '@/components/layout/PageWrapper'
import DataTable from '@/components/data/DataTable'
import FilterBar from '@/components/data/FilterBar'
import StatusBadge from './components/StatusBadge'
import NewClientModal from './NewClientModal'

const STATUS_FILTER = [
  { value: 'prospecto',   label: 'Prospecto'   },
  { value: 'implantacao', label: 'Implantação' },
  { value: 'ativo',       label: 'Ativo'       },
  { value: 'pausado',     label: 'Pausado'     },
  { value: 'cancelado',   label: 'Cancelado'   },
]
const SISTEMA_FILTER = [
  { value: 'adsim',       label: 'Adsim'       },
  { value: 'midiaplus',   label: 'Mídia+'      },
  { value: 'adanalytics', label: 'Ad Analytics'},
  { value: 'adchecking',  label: 'Adchecking'  },
]

const COLUMNS = [
  { key: 'razao_social', header: 'Razão Social', sortable: true,
    render: r => (
      <div>
        <p className="font-medium text-slate-800">{r.razao_social}</p>
        {r.fantasia && <p className="text-xs text-slate-400">{r.fantasia}</p>}
      </div>
    )
  },
  { key: 'cnpj',   header: 'CNPJ',   width: '200px', render: r => r.cnpj || '—' },
  { key: 'cidade', header: 'Cidade',  width: '140px', sortable: true, render: r => r.cidade ? `${r.cidade}/${r.estado||''}` : '—' },
  { key: 'status', header: 'Status',  width: '130px', sortable: true,
    render: r => <StatusBadge status={r.status} /> },
  { key: 'sistemas', header: 'Sistemas', width: '180px',
    render: r => {
      const ss = r.projects?.[0]?.sistemas_contratados ?? []
      if (!ss.length) return <span className="text-slate-400 text-xs">—</span>
      const MAP = { adsim:'Adsim', midiaplus:'Mídia+', adanalytics:'Analytics', adchecking:'Adchecking' }
      return (
        <div className="flex flex-wrap gap-1">
          {ss.map(s => (
            <span key={s} className="text-xs bg-orange-50 text-orange-700 border border-orange-200 rounded-full px-2 py-0.5">
              {MAP[s] ?? s}
            </span>
          ))}
        </div>
      )
    }
  },
  { key: 'onboarding_pct', header: '% Concl.', width: '100px',
    render: r => {
      const pct = r.projects?.[0]?.onboarding_pct ?? 0
      return (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden w-16">
            <div className="h-full bg-orange-400 rounded-full" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs text-slate-500">{pct}%</span>
        </div>
      )
    }
  },
]

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
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({})
  const [showNew, setShowNew] = useState(false)
  const dSearch = useDebounce(search, 350)

  const { data: clients = [], isLoading } = useClients({ search: dSearch, ...filters })

  // Filtro de sistema no lado cliente (projects são nested)
  const filtered = filters.sistema
    ? clients.filter(c => c.projects?.some(p => p.sistemas_contratados?.includes(filters.sistema)))
    : clients

  function setFilter(key, val) { setFilters(f => ({ ...f, [key]: val })) }
  function clearAll() { setSearch(''); setFilters({}) }

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
            { key: 'status',  label: 'Status',  options: STATUS_FILTER  },
            { key: 'sistema', label: 'Sistema', options: SISTEMA_FILTER },
          ]}
        />

        <DataTable
          columns={COLUMNS}
          rows={filtered}
          loading={isLoading}
          onRowClick={r => navigate(`/clients/${r.id}`)}
          emptyTitle="Nenhum cliente encontrado"
          emptyDescription="Clique em Novo Cliente para cadastrar o primeiro."
        />
      </div>

      <NewClientModal
        open={showNew}
        onClose={() => setShowNew(false)}
        onCreated={({ client }) => navigate(`/clients/${client.id}`)}
      />
    </PageWrapper>
  )
}
