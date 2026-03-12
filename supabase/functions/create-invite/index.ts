import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

  // Verify the caller is authenticated
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
    authHeader.replace('Bearer ', '')
  )
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const { email } = await req.json()
    if (!email) {
      return new Response(JSON.stringify({ error: 'Email é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Generate invite code
    const array = new Uint8Array(6)
    crypto.getRandomValues(array)
    const inviteCode = Array.from(array, b => b.toString(16).padStart(2, '0')).join('')

    // Store invitation
    const { error: insertError } = await supabaseAdmin
      .from('invitations')
      .insert({
        email,
        invite_code: inviteCode,
        status: 'pending',
        invited_by: user.id,
      })

    if (insertError) {
      console.error('Failed to store invitation:', insertError)
      return new Response(JSON.stringify({ error: 'Erro ao criar convite' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Send invite email via Resend
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (RESEND_API_KEY) {
      const inviteUrl = `https://info.chronoseducation.com/convite`
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Chronos Education <noreply@info.chronoseducation.com>',
          to: [email],
          subject: 'Foi convidado para a Chronos Education',
          html: buildInviteHtml(inviteUrl, inviteCode),
          reply_to: 'chronoseducationbr@gmail.com',
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        console.error('Resend error:', err)
      }
    }

    return new Response(
      JSON.stringify({ success: true, invite_code: inviteCode }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error creating invite:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

function buildInviteHtml(inviteUrl: string, inviteCode: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="background-color:#042D45;padding:32px 40px;border-radius:16px 16px 0 0;text-align:center;">
          <img src="https://qqgfqjpgxoourayjlrwc.supabase.co/storage/v1/object/public/email-assets/chronos-logo-header.png" alt="Chronos Education" height="36" />
        </td></tr>
        <tr><td style="background:linear-gradient(135deg,#80ff00 0%,#6de600 100%);height:4px;font-size:0;">&nbsp;</td></tr>
        <tr><td style="background-color:#f7f8f9;padding:40px;border-radius:0 0 16px 16px;">
          <h1 style="font-size:22px;font-weight:bold;color:#042D45;margin:0 0 20px;font-family:'Playfair Display',Georgia,serif;">
            Foi convidado!
          </h1>
          <p style="font-size:15px;color:#476878;line-height:1.6;margin:0 0 16px;">
            Foi convidado para se juntar à <strong>Chronos Education</strong>.
          </p>
          <p style="font-size:15px;color:#476878;line-height:1.6;margin:0 0 8px;">
            O seu código de convite:
          </p>
          <div style="background:#042D45;color:#80ff00;font-size:20px;font-weight:bold;padding:12px 24px;border-radius:8px;text-align:center;letter-spacing:3px;margin:0 0 24px;">
            ${inviteCode}
          </div>
          <p style="margin:0 0 25px;font-size:15px;color:#476878;line-height:1.6;">
            Clique no botão abaixo para aceitar o convite e criar a sua conta.
          </p>
          <a href="${inviteUrl}" style="display:inline-block;background-color:#80ff00;color:#042D45;font-size:14px;font-weight:600;border-radius:12px;padding:14px 24px;text-decoration:none;">
            Aceitar Convite
          </a>
          <p style="font-size:12px;color:#9aa8b5;margin:30px 0 0;">
            Se não esperava este convite, pode ignorar este email com segurança.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
