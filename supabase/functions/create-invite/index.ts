import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { InviteEmail } from '../_shared/email-templates/invite.tsx'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const SITE_NAME = 'Chronos Education'
const SENDER_DOMAIN = 'notify.info.chronoseducation.com'
const FROM_DOMAIN = 'info.chronoseducation.com'

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

    // Render invite email using branded template
    const templateProps = {
      siteName: SITE_NAME,
      siteUrl: 'https://www.chronoseducation.com',
      inviteCode,
    }

    const html = await renderAsync(React.createElement(InviteEmail, templateProps))
    const text = await renderAsync(React.createElement(InviteEmail, templateProps), {
      plainText: true,
    })

    const messageId = crypto.randomUUID()

    // Log pending
    await supabaseAdmin.from('email_send_log').insert({
      message_id: messageId,
      template_name: 'invite',
      recipient_email: email,
      status: 'pending',
    })

    // Enqueue email for async processing
    const { error: enqueueError } = await supabaseAdmin.rpc('enqueue_email', {
      queue_name: 'transactional_emails',
      payload: {
      run_id: crypto.randomUUID(),
      message_id: messageId,
      to: email,
      from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
      sender_domain: SENDER_DOMAIN,
      subject: 'Você foi convidado',
      html,
      text,
      purpose: 'transactional',
      label: 'invite',
      queued_at: new Date().toISOString(),
      },
    })

    if (enqueueError) {
      console.error('Failed to enqueue invite email:', enqueueError)
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
