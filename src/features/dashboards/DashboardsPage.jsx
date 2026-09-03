import { useRef, useState } from 'react'
import { ExternalLink, Upload, RefreshCw } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/shared/ToastContext'
import { useDashboards, useUploadDashboard, getDashboardUrl } from '@/hooks/useDashboards'
import PageWrapper from '@/components/layout/PageWrapper'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'

// ─── Mapa de cores por slug ───────────────────────────────────────────────────
const COR = {
  blue:   { border: '#3B82F6', iconBg: '#EFF6FF', cat: 'bg-blue-50 text-blue-700 border-blue-200' },
  orange: { border: '#F97316', iconBg: '#FFF7ED', cat: 'bg-orange-50 text-orange-700 border-orange-200' },
  violet: { border: '#8B5CF6', iconBg: '#F5F3FF', cat: 'bg-violet-50 text-violet-700 border-violet-200' },
  green:  { border: '#059669', iconBg: '#ECFDF5', cat: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  red:    { border: '#EF4444', iconBg: '#FEF2F2', cat: 'bg-red-50 text-red-700 border-red-200' },
  sky:    { border: '#0EA5E9', iconBg: '#F0F9FF', cat: 'bg-sky-50 text-sky-700 border-sky-200' },
  amber:  { border: '#D97706', iconBg: '#FFFBEB', cat: 'bg-amber-50 text-amber-700 border-amber-200' },
}

const ADMIN_ROLES = ['super_admin', 'admin']

function fmtDate(iso) {
  if (!iso) return 'Nunca atualizado'
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

// ─── Card individual ──────────────────────────────────────────────────────────
function DashboardCard({ dash, isAdmin, uploadingId, onUpload }) {
  const fileRef = useRef(null)
  const colors = COR[dash.cor] ?? COR.orange
  const isUploading = uploadingId === dash.id
  const publicUrl = getDashboardUrl(dash.storage_path)

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    onUpload({ id: dash.id, storagePath: dash.storage_path, file })
    // reset para permitir re-upload do mesmo arquivo
    e.target.value = ''
  }

  return (
    <div
      className="bg-white rounded-xl border border-slate-100 shadow-sm flex flex-col overflow-hidden
                 hover:shadow-md hover:border-slate-200 transition-all duration-150"
      style={{ borderLeftColor: colors.border, borderLeftWidth: '3.5px' }}
    >
      {/* Ícone + título + descrição */}
      <div className="px-4 pt-4 pb-3 flex-1">
        <div className="flex items-start gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0"
            style={{ background: colors.iconBg }}
          >
            {dash.icone}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-slate-800 text-sm leading-snug">{dash.nome}</p>
            {dash.descricao && (
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{dash.descricao}</p>
            )}
          </div>
        </div>

        {/* Categoria + data de atualização */}
        <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
          <span className={`text-xs border rounded-full px-2.5 py-0.5 font-medium ${colors.cat}`}>
            {dash.categoria}
          </span>
          <span className="text-xs text-slate-400">
            {fmtDate(dash.atualizado_em)}
            {dash.tamanho_kb ? ` · ${dash.tamanho_kb} KB` : ''}
          </span>
        </div>
      </div>

      {/* Botões de ação */}
      <div className="border-t border-slate-50 px-4 py-3 flex items-center gap-2">
        <a
          href={publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-white
                     rounded-lg py-2 px-3 transition-opacity hover:opacity-90"
          style={{ background: colors.border }}
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Abrir
        </a>

        {isAdmin && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept=".html,text/html"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={isUploading}
              className="flex items-center justify-center gap-1.5 text-xs font-medium text-slate-600
                         bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg py-2 px-3
                         transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Substituir arquivo HTML"
            >
              {isUploading
                ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                : <Upload className="w-3.5 h-3.5" />
              }
              {isUploading ? 'Enviando…' : 'Atualizar'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Página principal (sem auth wrapper — feito em routes/index.jsx) ──────────
export default function DashboardsPageContent() {
  const { profile } = useAuth()
  const toast = useToast()
  const [catFiltro, setCatFiltro] = useState('Todos')
  const [uploadingId, setUploadingId] = useState(null)

  const { data: dashboards = [], isLoading } = useDashboards()
  const upload = useUploadDashboard()

  const isAdmin = ADMIN_ROLES.includes(profile?.role)

  // Categorias disponíveis a partir dos dados reais (mantém ordem de aparição)
  const categorias = ['Todos', ...new Set(dashboards.map(d => d.categoria))]

  const filtered = catFiltro === 'Todos'
    ? dashboards
    : dashboards.filter(d => d.categoria === catFiltro)

  async function handleUpload({ id, storagePath, file }) {
    setUploadingId(id)
    try {
      await upload.mutateAsync({ id, storagePath, file })
      toast({
        title: 'Dashboard atualizado!',
        description: `${file.name} enviado com sucesso.`,
        variant: 'success',
      })
    } catch (err) {
      toast({
        title: 'Erro no upload',
        description: err.message ?? 'Não foi possível enviar o arquivo.',
        variant: 'error',
      })
    } finally {
      setUploadingId(null)
    }
  }

  return (
    <PageWrapper
      title="Dashboards"
      subtitle={`${filtered.length} dashboard${filtered.length !== 1 ? 's' : ''}`}
    >
      {/* Filtro por categoria */}
      {dashboards.length > 0 && (
        <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
          {categorias.map(cat => (
            <button
              key={cat}
              onClick={() => setCatFiltro(cat)}
              className={`shrink-0 text-sm px-4 py-1.5 rounded-full border font-medium transition-colors ${
                catFiltro === cat
                  ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-orange-300 hover:text-orange-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Conteúdo principal */}
      {isLoading ? (
        <div className="py-20 flex justify-center">
          <Spinner size="lg" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200">
          <EmptyState
            title="Nenhum dashboard disponível"
            description="Os dashboards aparecerão aqui após serem cadastrados e carregados no Storage."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(dash => (
            <DashboardCard
              key={dash.id}
              dash={dash}
              isAdmin={isAdmin}
              uploadingId={uploadingId}
              onUpload={handleUpload}
            />
          ))}
        </div>
      )}
    </PageWrapper>
  )
}
