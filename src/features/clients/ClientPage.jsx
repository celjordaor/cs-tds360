import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Building2 } from 'lucide-react'
import { useClient, useProject } from '@/hooks/useClients'
import { RequireAuth } from '@/routes/index'
import AppLayout from '@/components/layout/AppLayout'
import PageWrapper from '@/components/layout/PageWrapper'
import Spinner from '@/components/ui/Spinner'
import StatusBadge from './components/StatusBadge'
import ProjectTab from './tabs/ProjectTab'
import ComingSoon from '@/components/shared/ComingSoon'

const TABS = [
  { id: 'projeto',   label: 'Projeto'       },
  { id: 'emissoras', label: 'Emissoras'     },
  { id: 'config',    label: 'Configurações' },
  { id: 'usuarios',  label: 'Usuários'      },
  { id: 'pendencias',label: 'Pendências'    },
  { id: 'checklist', label: 'Checklist'     },
]

export default function ClientPage() {
  return (
    <RequireAuth>
      <AppLayout>
        <ClientPageInner />
      </AppLayout>
    </RequireAuth>
  )
}

function ClientPageInner() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: client, isLoading: loadingClient } = useClient(id)
  const { data: project, isLoading: loadingProject } = useProject(id)

  const activeTab = new URLSearchParams(window.location.search).get('tab') || 'projeto'
  function setTab(t) {
    const url = new URL(window.location.href)
    url.searchParams.set('tab', t)
    window.history.replaceState({}, '', url.pathname + url.search)
    // force re-render
    navigate(`/clients/${id}?tab=${t}`, { replace: true })
  }

  if (loadingClient) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  }
  if (!client) {
    return <div className="text-center py-20 text-slate-400">Cliente não encontrado.</div>
  }

  return (
    <PageWrapper
      title={
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/clients')} className="p-1 text-slate-400 hover:text-slate-700">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <Building2 className="w-5 h-5 text-orange-500" />
          <span>{client.razao_social}</span>
          {client.status && <StatusBadge status={client.status} />}
        </div>
      }
      subtitle={client.fantasia || client.cnpj}
    >
      {/* Tabs */}
      <div className="border-b border-slate-200 mb-6">
        <nav className="flex gap-1 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                ${activeTab === t.id
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Conteúdo da tab */}
      <div className="max-w-4xl">
        {activeTab === 'projeto' && (
          loadingProject
            ? <div className="flex justify-center py-12"><Spinner /></div>
            : <ProjectTab client={client} project={project} />
        )}
        {activeTab !== 'projeto' && <ComingSoon title={TABS.find(t=>t.id===activeTab)?.label} />}
      </div>
    </PageWrapper>
  )
}
