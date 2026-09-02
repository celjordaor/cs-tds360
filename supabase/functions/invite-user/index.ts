import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Verificar que o chamador está autenticado como admin/super_admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Authorization header ausente')

    const supabaseUrl    = Deno.env.get('SUPABASE_URL')!
    const anonKey        = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user }, error: userErr } = await callerClient.auth.getUser()
    if (userErr || !user) throw new Error('Não autorizado')

    const { data: callerProfile, error: profileErr } = await callerClient
      .from('profiles').select('role').eq('id', user.id).single()
    if (profileErr || !callerProfile) throw new Error('Perfil do chamador não encontrado')
    if (!['admin', 'super_admin'].includes(callerProfile.role))
      throw new Error('Permissão insuficiente — apenas admin e super_admin podem convidar usuários')

    // 2. Ler payload
    const { email, nome, role, siteUrl } = await req.json()
    if (!email || !nome || !role) throw new Error('email, nome e role são obrigatórios')

    const redirectTo = `${siteUrl ?? 'http://localhost:5173'}/reset-password`

    // 3. Client com service role para operações de admin
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // 4. Criar usuário em auth.users (email já confirmado, sem enviar e-mail ainda)
    //    O trigger handle_new_user cria o perfil automaticamente
    const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { nome, role },
    })
    if (createErr) throw createErr

    // 5. Garantir que perfil tem nome e role corretos (caso trigger tenha rodado primeiro)
    const { error: upsertErr } = await adminClient
      .from('profiles')
      .upsert({ id: created.user.id, email, nome, role, ativo: true }, { onConflict: 'id' })
    if (upsertErr) throw upsertErr

    // 6. Enviar e-mail de redefinição de senha — usa o fluxo PASSWORD_RECOVERY
    //    existente em /reset-password (mesmo fluxo do "esqueci minha senha")
    const { error: resetErr } = await adminClient.auth.resetPasswordForEmail(email, {
      redirectTo,
    })
    if (resetErr) throw resetErr

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
