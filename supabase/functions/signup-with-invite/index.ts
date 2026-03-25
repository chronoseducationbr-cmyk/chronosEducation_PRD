import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password, full_name, invite_code } = await req.json();

    if (!email || !password || !full_name || !invite_code) {
      return new Response(
        JSON.stringify({ error: "Todos os campos são obrigatórios." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Verify the invite is valid and pending
    const { data: invite, error: inviteError } = await supabaseAdmin
      .from("invitations")
      .select("id, status, expires_at")
      .eq("email", email.toLowerCase().trim())
      .eq("invite_code", invite_code.trim())
      .eq("status", "pending")
      .maybeSingle();

    if (inviteError || !invite) {
      return new Response(
        JSON.stringify({ error: "Convite inválido ou já utilizado." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (new Date(invite.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "Este convite já expirou." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Create user WITHOUT email confirmation (email must be confirmed via link)
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password,
      email_confirm: false,
      user_metadata: { full_name },
    });

    let userId: string | undefined;

    if (createError) {
      if (createError.message?.includes("already been registered")) {
        const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = users?.find(
          (u) => u.email?.toLowerCase() === email.toLowerCase().trim()
        );

        if (existingUser) {
          userId = existingUser.id;
          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            existingUser.id,
            { email_confirm: false, password, user_metadata: { full_name } }
          );
          if (updateError) {
            return new Response(
              JSON.stringify({ error: updateError.message }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        } else {
          return new Response(
            JSON.stringify({ error: createError.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else {
        return new Response(
          JSON.stringify({ error: createError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      userId = userData.user.id;
    }

    // 3. Generate a confirmation link (token_hash) via admin API
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "signup",
      email: email.toLowerCase().trim(),
      password,
    });

    if (linkError || !linkData) {
      // If link generation fails, clean up by confirming the email so user isn't stuck
      console.error("Failed to generate confirmation link:", linkError);
      await supabaseAdmin.auth.admin.updateUserById(userId!, { email_confirm: true });

      // Mark invite as used and allow direct login as fallback
      await supabaseAdmin
        .from("invitations")
        .update({ status: "used", used_at: new Date().toISOString() })
        .eq("id", invite.id);

      return new Response(
        JSON.stringify({ success: true, fallback: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tokenHash = linkData.properties?.hashed_token;
    const confirmUrl = `https://chronoseducation.com/confirm-email?token_hash=${tokenHash}&type=signup`;

    // 4. Send confirmation email via Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey) {
      const emailHtml = buildConfirmationEmailHtml(full_name, confirmUrl);
      
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: "Chronos Education <notify@info.chronoseducation.com>",
          to: [email.toLowerCase().trim()],
          subject: "Confirme o seu email — Chronos Education",
          html: emailHtml,
        }),
      });
    }

    // 5. Mark invite as used
    await supabaseAdmin
      .from("invitations")
      .update({ status: "used", used_at: new Date().toISOString() })
      .eq("id", invite.id);

    return new Response(
      JSON.stringify({ success: true, requiresConfirmation: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in signup-with-invite:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildConfirmationEmailHtml(name: string, confirmUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;">
        <!-- Header -->
        <tr>
          <td style="background-color:#042D45;padding:32px 40px;text-align:center;">
            <img src="https://qqgfqjpgxoourayjlrwc.supabase.co/storage/v1/object/public/email-assets/chronos-logo-header.png" alt="Chronos Education" height="40" />
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <h1 style="color:#042D45;font-family:'Playfair Display',Georgia,serif;font-size:24px;margin:0 0 16px;">
              Confirme o seu email
            </h1>
            <p style="color:#55575d;font-size:15px;line-height:1.6;margin:0 0 12px;">
              Olá ${name},
            </p>
            <p style="color:#55575d;font-size:15px;line-height:1.6;margin:0 0 24px;">
              A sua conta na Chronos Education foi criada com sucesso. Para ativá-la, clique no botão abaixo para confirmar o seu endereço de email.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
              <tr>
                <td style="background-color:#97E50B;border-radius:8px;padding:14px 32px;text-align:center;">
                  <a href="${confirmUrl}" style="color:#042D45;font-weight:700;font-size:15px;text-decoration:none;display:inline-block;">
                    Confirmar Email
                  </a>
                </td>
              </tr>
            </table>
            <p style="color:#999;font-size:13px;line-height:1.5;margin:0;">
              Importante: clique no botão acima. Não copie o link diretamente, só funciona quando clicado manualmente.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background-color:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
