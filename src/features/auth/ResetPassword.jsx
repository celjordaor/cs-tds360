import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const schema = z.object({
  password: z.string().min(8, 'Senha deve ter ao menos 8 caracteres'),
  confirm: z.string(),
}).refine(d => d.password === d.confirm, {
  message: 'As senhas não coincidem',
  path: ['confirm'],
})

export default function ResetPassword() {
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)   // token válido e sessão ativa
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    // Supabase v2 (PKCE): troca o ?code= da URL por sessão automaticamente.
    // onAuthStateChange dispara PASSWORD_RECOVERY quando o link é válido.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      } else if (event === 'SIGNED_IN') {
        // fallback: link implícito já processado
        setReady(true)
      }
    })

    // Verifica se já há sessão ativa (usuário recarregou a página)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
      else {
        // Aguarda 3s pelo evento; se não chegar, mostra erro
        setTimeout(() => {
          setError('Link inválido ou expirado. Solicite um novo link de recuperação.')
        }, 3000)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function onSubmit({ password }) {
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setDone(true)
      setTimeout(() => navigate('/login'), 3000)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-bold text-xl">CS</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">TDSOFT</h1>
          <p className="text-slate-500 text-sm mt-1">Customer Success Portal</p>
        </div>

        <div className="card">
          {done ? (
            <div className="text-center py-4">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Senha redefinida!</h2>
              <p className="text-slate-500 text-sm">Redirecionando para o login…</p>
            </div>
          ) : error && !ready ? (
            <div className="text-center py-4">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Link inválido</h2>
              <p className="text-slate-500 text-sm mb-6">{error}</p>
              <a href="/forgot-password" className="btn-primary inline-block">
                Solicitar novo link
              </a>
            </div>
          ) : !ready ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-500 text-sm">Validando link…</p>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Nova senha</h2>
              <p className="text-slate-500 text-sm mb-6">Escolha uma senha segura com ao menos 8 caracteres.</p>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="label block mb-1">Nova senha</label>
                  <div className="relative">
                    <input
                      {...register('password')}
                      type={showPass ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="input pr-10"
                    />
                    <button type="button" onClick={() => setShowPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                </div>

                <div>
                  <label className="label block mb-1">Confirmar senha</label>
                  <div className="relative">
                    <input
                      {...register('confirm')}
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="input pr-10"
                    />
                    <button type="button" onClick={() => setShowConfirm(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirm && <p className="text-red-500 text-xs mt-1">{errors.confirm.message}</p>}
                </div>

                <button type="submit" disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60">
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? 'Salvando…' : 'Redefinir senha'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
