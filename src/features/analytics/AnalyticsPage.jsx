import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import Spinner from '@/components/ui/Spinner'
import { Users, TrendingUp, CheckCircle, BarChart3 } from 'lucide-react'

/* ─── data hook ─────────────────────────────────────────────────────────── */
function useAnalyticsData() {
  return useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, status, projects(onboarding_pct, sistemas_contratados, responsavel_cs:profiles!responsavel_cs_id(nome))')
      if (error) throw error
      return data ?? []
    },
    staleTime: 60_000,
  })
}

/* ─── status config ──────────────────────────────────────────────────────── */
const STATUS_CFG = {
  prospecto:   { label: 'Prospecto',   color: 'bg-slate-400' },
  implantacao: { label: 'Implantação', color: 'bg-blue-500'  },
  ativo:       { label: 'Ativo',       color: 'bg-green-500' },
  pausado:     { label: 'Pausado',     color: 'bg-yellow-500'},
  cancelado:   { label: 'Cancelado',   color: 'bg-red-500'   },
}

/* ─── derivations ────────────────────────────────────────────────────────── */
function derive(clients) {
  const total = clients.length

  // status breakdown
  const byStatus = {}
  clients.forEach(c => {
    const s = c.status || 'indefinido'
    byStatus[s] = (byStatus[s] || 0) + 1
  })

  // ativos
  const ativos = byStatus['ativo'] || 0

  // avg onboarding (only where pct is set)
  const pcts = clients
    .map(c => c.projects?.[0]?.onboarding_pct)
    .filter(v => v != null && v >= 0)
  const avgOnboarding = pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : null

  // by CS (responsavel)
  const byCS = {}
  clients.forEach(c => {
    const nome = c.projects?.[0]?.responsavel_cs?.nome || 'Sem CS'
    byCS[nome] = (byCS[nome] || 0) + 1
  })
  const csRanking = Object.entries(byCS).sort((a, b) => b[1] - a[1])

  // top sistemas
  const sysCount = {}
  clients.forEach(c => {
    const sistemas = c.projects?.[0]?.sistemas_contratados || []
    sistemas.forEach(s => { sysCount[s] = (sysCount[s] || 0) + 1 })
  })
  const topSistemas = Object.entries(sysCount).sort((a, b) => b[1] - a[1]).slice(0, 10)

  return { total, ativos, avgOnboarding, byStatus, csRanking, topSistemas }
}

/* ─── sub-components ─────────────────────────────────────────────────────── */
function KpiCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800 tabular-nums">{value ?? '—'}</p>
        <p className="text-sm font-medium text-slate-700 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function BarRow({ label, value, max, color = 'bg-orange-400' }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-32 truncate text-slate-600 shrink-0">{label}</span>
      <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
        <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-right font-semibold text-slate-700 tabular-nums">{value}</span>
    </div>
  )
}

/* ─── page ───────────────────────────────────────────────────────────────── */
export default function AnalyticsPage() {
  const { data: clients = [], isLoading, error } = useAnalyticsData()
  const { total, ativos, avgOnboarding, byStatus, csRanking, topSistemas } = derive(clients)
  const maxCS  = csRanking[0]?.[1] || 1
  const maxSys = topSistemas[0]?.[1] || 1
  const maxStatus = Math.max(...Object.values(byStatus), 1)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
        Erro ao carregar dados: {error.message}
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Analytics CS</h1>
        <p className="text-slate-500 mt-1">Visão consolidada da carteira de clientes.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Users}       label="Total de clientes" value={total}
          sub="carteira completa" accent="bg-slate-700" />
        <KpiCard icon={CheckCircle} label="Clientes ativos"   value={ativos}
          sub={total > 0 ? `${Math.round((ativos/total)*100)}% da carteira` : '—'} accent="bg-green-600" />
        <KpiCard icon={TrendingUp}  label="Onboarding médio"
          value={avgOnboarding != null ? `${avgOnboarding}%` : '—'}
          sub="média dos projetos ativos" accent="bg-orange-500" />
        <KpiCard icon={BarChart3}   label="Em implantação"    value={byStatus['implantacao'] || 0}
          sub="clientes em onboarding" accent="bg-blue-600" />
      </div>

      {/* Grid: status + CS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Status breakdown */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="font-semibold text-slate-800 mb-5">Clientes por status</h2>
          {Object.keys(byStatus).length === 0 ? (
            <p className="text-slate-400 text-sm">Sem dados.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(byStatus)
                .sort((a, b) => b[1] - a[1])
                .map(([status, count]) => {
                  const cfg = STATUS_CFG[status] || { label: status, color: 'bg-slate-400' }
                  return (
                    <BarRow key={status} label={cfg.label} value={count}
                      max={maxStatus} color={cfg.color} />
                  )
                })
              }
            </div>
          )}
        </div>

        {/* CS distribution */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="font-semibold text-slate-800 mb-5">Distribuição por CS responsável</h2>
          {csRanking.length === 0 ? (
            <p className="text-slate-400 text-sm">Sem dados.</p>
          ) : (
            <div className="space-y-3">
              {csRanking.map(([nome, count]) => (
                <BarRow key={nome} label={nome} value={count}
                  max={maxCS} color="bg-orange-400" />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top sistemas */}
      {topSistemas.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="font-semibold text-slate-800 mb-5">Sistemas mais contratados</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {topSistemas.map(([sys, count]) => (
              <BarRow key={sys} label={sys} value={count}
                max={maxSys} color="bg-blue-400" />
            ))}
          </div>
        </div>
      )}

      {topSistemas.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="font-semibold text-slate-800 mb-2">Sistemas mais contratados</h2>
          <p className="text-slate-400 text-sm">Nenhum sistema registrado nos projetos ainda.</p>
        </div>
      )}
    </div>
  )
}
