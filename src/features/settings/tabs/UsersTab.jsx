import { useState } from 'react'
import { useUsers, useCreateUser, useUpdateUser } from '@/hooks/useUsers'
import { Spinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'
import { Toggle } from '@/components/ui/Toggle'
import { Modal } from '@/components/ui/Modal'
import FormField from '@/components/form/FormField'
import { UserPlus, Mail } from 'lucide-react'

const ROLE_OPTIONS = [
  { value: 'cs',          label: 'CS' },
  { value: 'manager',     label: 'Gerente' },
  { value: 'admin',       label: 'Admin' },
  { value: 'super_admin', label: 'Super Admin' },
]

const ROLE_VARIANT = {
  cs:          'blue',
  manager:     'orange',
  admin:       'yellow',
  super_admin: 'red',
}

const EMPTY_FORM = { email: '', full_name: '', role: 'cs' }

export default function UsersTab() {
  const { data: users = [], isLoading } = useUsers()
  const createUser  = useCreateUser()
  const updateUser  = useUpdateUser()

  const [showModal, setShowModal] = useState(false)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [errors, setErrors]       = useState({})
  const [sent, setSent]           = useState(false)

  function validate() {
    const e = {}
    if (!form.email.trim())     e.email     = 'E-mail obrigatório'
    if (!form.full_name.trim()) e.full_name = 'Nome obrigatório'
    if (!form.role)             e.role      = 'Perfil obrigatório'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    try {
      await createUser.mutateAsync(form)
      setSent(true)
    } catch (err) {
      setErrors({ _api: err.message })
    }
  }

  function handleClose() {
    setShowModal(false)
    setForm(EMPTY_FORM)
    setErrors({})
    setSent(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-slate-800">Usuários do sistema</h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Gerencie quem tem acesso ao portal e seus perfis de permissão.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-xl transition-colors"
        >
          <UserPlus size={16} />
          Convidar usuário
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : (
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Nome</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">E-mail</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Perfil</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Ativo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-slate-400">
                    Nenhum usuário cadastrado.
                  </td>
                </tr>
              ) : users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800">{u.full_name || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant={ROLE_VARIANT[u.role] || 'slate'}>
                      {ROLE_OPTIONS.find(r => r.value === u.role)?.label || u.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Toggle
                      checked={!!u.ativo}
                      onChange={val => updateUser.mutate({ id: u.id, ativo: val })}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={handleClose}
        title="Convidar usuário"
        footer={
          !sent && (
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 border border-slate-200 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={createUser.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
              >
                {createUser.isPending ? <Spinner size="sm" /> : <Mail size={16} />}
                Enviar convite
              </button>
            </div>
          )
        }
      >
        {sent ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Mail size={24} className="text-green-600" />
            </div>
            <p className="font-semibold text-slate-800">Convite enviado!</p>
            <p className="text-sm text-slate-500 mt-1">
              Um link de acesso foi enviado para <strong>{form.email}</strong>.
            </p>
            <button
              onClick={handleClose}
              className="mt-4 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-xl transition-colors"
            >
              Fechar
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {errors._api && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                {errors._api}
              </div>
            )}
            <FormField label="Nome completo" error={errors.full_name} required>
              <input
                type="text"
                value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                placeholder="João Silva"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </FormField>
            <FormField label="E-mail" error={errors.email} required>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="joao@empresa.com"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </FormField>
            <FormField label="Perfil de acesso" error={errors.role} required>
              <select
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
              >
                {ROLE_OPTIONS.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </FormField>
            <p className="text-xs text-slate-400">
              O usuário receberá um e-mail com um link para definir sua senha e acessar o sistema.
            </p>
          </div>
        )}
      </Modal>
    </div>
  )
}
