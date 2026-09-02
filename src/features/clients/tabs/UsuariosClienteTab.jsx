import { useState, useEffect, useRef } from 'react'
import { Users, Plus, X, Save, Loader2 } from 'lucide-react'
import { useClientUsers, useSaveClientUsers } from '@/hooks/useClientUsers'
import { useToast } from '@/components/shared/ToastContext'
import Spinner from '@/components/ui/Spinner'
import SectionCard from '@/components/ui/SectionCard'

// ── Constantes ────────────────────────────────────────────────────────────────

const SISTEMA_LABELS = {
  adsim:       'Adsim',
  midiaplus:   'Mídia+',
  adanalytics: 'Adanalytics',
  adchecking:  'Adchecking',
}

function newUser(projectId) {
  return {
    id:         crypto.randomUUID(),
    project_id: projectId,
    nome:       '',
    email:      '',
    perfil:     '',
    login:      '',
    sistemas:   [],
    ativo:      true,
  }
}

// ── UserRow ───────────────────────────────────────────────────────────────────

function UserRow({ user, sistemas_contratados, onUpdate, onRemove }) {
  const cellCls = 'w-full px-2 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white'

  function toggleSistema(s) {
    const cur = user.sistemas ?? []
    onUpdate('sistemas', cur.includes(s) ? cur.filter(x => x !== s) : [...cur, s])
  }

  return (
    <tr className="group border-b border-slate-100 last:border-0 align-middle">
      {/* Nome */}
      <td className="px-3 py-2 min-w-36">
        <input
          type="text"
          value={user.nome ?? ''}
          onChange={e => onUpdate('nome', e.target.value)}
          placeholder="Nome completo"
          className={cellCls}
        />
      </td>

      {/* E-mail */}
      <td className="px-2 py-2 min-w-44">
        <input
          type="email"
          value={user.email ?? ''}
          onChange={e => onUpdate('email', e.target.value)}
          placeholder="email@empresa.com"
          className={cellCls}
        />
      </td>

      {/* Perfil de Acesso */}
      <td className="px-2 py-2 min-w-32">
        <input
          type="text"
          value={user.perfil ?? ''}
          onChange={e => onUpdate('perfil', e.target.value)}
          placeholder="ex: Gestor"
          className={cellCls}
        />
      </td>

      {/* Login */}
      <td className="px-2 py-2 min-w-28">
        <input
          type="text"
          value={user.login ?? ''}
          onChange={e => onUpdate('login', e.target.value)}
          placeholder="login"
          className={cellCls}
        />
      </td>

      {/* Sistemas */}
      <td className="px-2 py-2 min-w-40">
        {sistemas_contratados.length === 0 ? (
          <span className="text-xs text-slate-300 italic">—</span>
        ) : (
          <div className="flex flex-wrap gap-x-3 gap-y-1.5">
            {sistemas_contratados.map(s => (
              <label key={s} className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={(user.sistemas ?? []).includes(s)}
                  onChange={() => toggleSistema(s)}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-orange-500 focus:ring-orange-400 focus:ring-offset-0"
                />
                <span className="text-xs text-slate-600">{SISTEMA_LABELS[s] ?? s}</span>
              </label>
            ))}
          </div>
        )}
      </td>

      {/* Ativo — toggle */}
      <td className="px-2 py-2 text-center w-16">
        <button
          onClick={() => onUpdate('ativo', !user.ativo)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-1 ${
            user.ativo ? 'bg-emerald-500' : 'bg-slate-300'
          }`}
          title={user.ativo ? 'Ativo — clique para desativar' : 'Inativo — clique para ativar'}
        >
          <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
              user.ativo ? 'translate-x-[18px]' : 'translate-x-0.5'
            }`}
          />
        </button>
      </td>

      {/* Remover */}
      <td className="py-2 pr-2 w-8">
        <button
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 p-1 rounded text-white bg-red-500 hover:bg-red-600 transition-all"
          title="Remover usuário"
        >
          <X className="w-3 h-3" />
        </button>
      </td>
    </tr>
  )
}

// ── UsuariosClienteTab ────────────────────────────────────────────────────────

export default function UsuariosClienteTab({ project }) {
  const { data: dbUsers = [], isLoading } = useClientUsers(project?.id)
  const save  = useSaveClientUsers(project?.id)
  const toast = useToast()

  const sistemas_contratados = project?.sistemas_contratados ?? []

  const [users,      setUsers]      = useState([])
  const [deletedIds, setDeletedIds] = useState([])

  const dbStrRef = useRef(null)
  useEffect(() => {
    const str = JSON.stringify(dbUsers)
    if (str !== dbStrRef.current) {
      dbStrRef.current = str
      setUsers(JSON.parse(str))
      setDeletedIds([])
    }
  }, [dbUsers])

  const dirty =
    JSON.stringify(users) !== JSON.stringify(dbUsers) ||
    deletedIds.length > 0

  // ── Handlers ──

  function addUser() {
    setUsers(prev => [...prev, newUser(project.id)])
  }

  function updateUser(id, key, val) {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, [key]: val } : u))
  }

  function removeUser(id) {
    setUsers(prev => prev.filter(u => u.id !== id))
    if (dbUsers.find(u => u.id === id)) {
      setDeletedIds(prev => [...prev, id])
    }
  }

  async function handleSave() {
    try {
      const dbIds = new Set(dbUsers.map(u => u.id))
      const toInsert = users.filter(u => !dbIds.has(u.id))
      const toUpdate = users.filter(u =>  dbIds.has(u.id))
      await save.mutateAsync({ toInsert, toUpdate, toDelete: deletedIds })
      toast({ type: 'success', message: 'Usuários salvos com sucesso.' })
    } catch {
      toast({ type: 'error', message: 'Erro ao salvar usuários. Tente novamente.' })
    }
  }

  function handleDiscard() {
    setUsers(JSON.parse(JSON.stringify(dbUsers)))
    setDeletedIds([])
  }

  // ── Render ──

  if (isLoading) {
    return <div className="flex justify-center py-16"><Spinner /></div>
  }

  if (!project?.id) {
    return <p className="text-slate-400 text-sm py-8">Projeto não encontrado.</p>
  }

  const ativos = users.filter(u => u.ativo).length
  const subtitle = users.length === 0
    ? 'Nenhum usuário cadastrado'
    : `${users.length} usuário${users.length !== 1 ? 's' : ''} · ${ativos} ativo${ativos !== 1 ? 's' : ''}`

  const actionBtn = (
    <button
      onClick={addUser}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors shadow-sm"
    >
      <Plus className="w-3.5 h-3.5" />
      Novo Usuário
    </button>
  )

  return (
    <div className="pb-28">
      <SectionCard
        color="violet"
        icon={Users}
        title="Usuários do Cliente"
        subtitle={subtitle}
        action={actionBtn}
      >
        {/* Estado vazio */}
        {users.length === 0 ? (
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-10 text-center">
            <Users className="w-7 h-7 text-slate-300 mx-auto mb-2.5" />
            <p className="text-sm text-slate-400 mb-1">Nenhum usuário cadastrado</p>
            <p className="text-xs text-slate-300">Clique em "Novo Usuário" para começar</p>
          </div>
        ) : (
          /* Tabela — quebra o padding do SectionCard para ir até as bordas */
          <div className="-mx-4 -mb-4 overflow-x-auto rounded-b-xl">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide min-w-36">Nome</th>
                  <th className="text-left px-2 py-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide min-w-44">E-mail</th>
                  <th className="text-left px-2 py-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide min-w-32">Perfil de Acesso</th>
                  <th className="text-left px-2 py-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide min-w-28">Login</th>
                  <th className="text-left px-2 py-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide min-w-40">Sistemas</th>
                  <th className="text-center px-2 py-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide w-16">Ativo</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-50">
                {users.map(u => (
                  <UserRow
                    key={u.id}
                    user={u}
                    sistemas_contratados={sistemas_contratados}
                    onUpdate={(key, val) => updateUser(u.id, key, val)}
                    onRemove={() => removeUser(u.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Sticky save bar */}
      {dirty && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-lg px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <p className="text-sm text-slate-600">
              <span className="font-medium text-orange-600">Você tem alterações não salvas</span> nos usuários do cliente.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDiscard}
                disabled={save.isPending}
                className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-60"
              >
                Descartar
              </button>
              <button
                onClick={handleSave}
                disabled={save.isPending}
                className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {save.isPending
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando…</>
                  : <><Save className="w-4 h-4" />Salvar alterações</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
