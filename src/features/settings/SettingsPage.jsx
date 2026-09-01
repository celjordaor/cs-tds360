import { useState } from 'react'
import { Settings, Users } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import ConfigOptionsTab from './tabs/ConfigOptionsTab'
import UsersTab from './tabs/UsersTab'

const TABS = [
  { key: 'options', label: 'Opções de campos', icon: Settings },
  { key: 'users',   label: 'Usuários',          icon: Users },
]

export default function SettingsPage() {
  const [tab, setTab] = useState('options')

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Configurações</h1>
          <p className="text-slate-500 mt-1">
            Gerencie opções de campos, usuários e preferências do sistema.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6 w-fit">
          {TABS.map(t => {
            const Icon = t.icon
            const active = tab === t.key
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  active
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon size={16} />
                {t.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          {tab === 'options' && <ConfigOptionsTab />}
          {tab === 'users'   && <UsersTab />}
        </div>
      </div>
    </AppLayout>
  )
}
