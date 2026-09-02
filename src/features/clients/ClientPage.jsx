import { useParams, useNavigate } from 'react-router-dom'
import { useClient, useProject, useContacts, useDeleteClient } from '@/hooks/useClients'
import { useToast } from '@/components/shared/ToastContext'
import { RequireAuth } from '@/routes/index'
import AppLayout from '@/components/layout/AppLayout'
import Spinner from '@/components/ui/Spinner'
import ClientPageHeader from './components/ClientPageHeader'
import ProjectTab from './tabs/ProjectTab'
import EmissorasTab from './tabs/EmissorasTab'
import ComingSoon from '@/components/shared/ComingSoon'
import ConfigTecnicaTab from './tabs/ConfigTecnicaTab'
import UsuariosClienteTab from './tabs/UsuariosClienteTab'
import AlertasTab from './tabs/AlertasTab'

const TABS = [
  { id: 'projeto',   label: 'Projeto'       },
  { id: 'emissoras', label: 'Emissoras'     },
  { id: 'config',    label: 'Configurações' },
  { id: 'usuarios',  label: 'Usuários'      },
  { id: 'alertas',   label: 'Alertas'       },
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
  const { toast } = useToast()

  const { data: client, isLoading: loadingClient } = useClient(id)
  const { data: project, isLoading: loadingProject } = useProject(id)
  const { data: contacts = [] } = useContacts(project?.id)
  const deleteClient = useDeleteClient()

  const activeTab = new URLSearchParams(window.location.search).get('tab') || 'projeto'

  function setTab(t) {
    navigate(`/clients/${id}?tab=${t}`, { replace: true })
  }

  async function handleDeleteClient() {
    try {
      await deleteClient.mutateAsync(id)
      toast({ type: 'success', message: 'Cliente excluído com sucesso.' })
      navigate('/clients')
    } catch {
      toast({ type: 'error', message: 'Erro ao excluir cliente. Tente novamente.' })
    }
  }

  if (loadingClient) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  }
  if (!client) {
    return <div className="text-center py-20 text-slate-400">Cliente não encontrado.</div>
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <ClientPageHeader
        client={client}
        project={project}
        contacts={contacts}
        onBack={() => navigate('/clients')}
        onDelete={handleDeleteClient}
        isDeleting={deleteClient.isPending}
      />

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-6">
        <nav className="flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                ${activeTab === t.id
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
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
        {activeTab === 'emissoras' && (
          loadingProject
            ? <div className="flex justify-center py-12"><Spinner /></div>
            : <EmissorasTab project={project} />
        )}
        {activeTab === 'config' && (
          loadingProject
            ? <div className="flex justify-center py-12"><Spinner /></div>
            : <ConfigTecnicaTab project={project} />
        )}
        {activeTab === 'usuarios' && (
          loadingProject
            ? <div className="flex justify-center py-12"><Spinner /></div>
            : <UsuariosClienteTab project={project} />
        )}
        {activeTab === 'alertas' && (
          loadingProject
            ? <div className="flex justify-center py-12"><Spinner /></div>
            : <AlertasTab project={project} />
        )}
        {!['projeto','emissoras','config','usuarios','alertas'].includes(activeTab) && (
          <ComingSoon title={TABS.find(t => t.id === activeTab)?.label} />
        )}
      </div>
    </div>
  )
}
