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
    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email é obrigatório." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Não autorizado." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller } } = await supabaseAdmin.auth.getUser(token);
    if (!caller) {
      return new Response(
        JSON.stringify({ error: "Não autorizado." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check admin role
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Apenas administradores podem reenviar confirmações." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find the user
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const targetUser = users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase().trim()
    );

    if (!targetUser) {
      return new Response(
        JSON.stringify({ error: "Utilizador não encontrado." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (targetUser.email_confirmed_at) {
      return new Response(
        JSON.stringify({ error: "Este utilizador já confirmou o email." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Reset email confirmation so a new link can be generated
    await supabaseAdmin.auth.admin.updateUserById(targetUser.id, { email_confirm: false });

    // Generate a new confirmation link using invite type (no password needed)
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "invite",
      email: email.toLowerCase().trim(),
    });

    if (linkError || !linkData) {
      console.error("Failed to generate confirmation link:", linkError);
      // Re-confirm email so user isn't stuck
      await supabaseAdmin.auth.admin.updateUserById(targetUser.id, { email_confirm: true });
      return new Response(
        JSON.stringify({ error: "Erro ao gerar link de confirmação." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tokenHash = linkData.properties?.hashed_token;
    const confirmUrl = `https://chronoseducation.com/confirm-email?token_hash=${tokenHash}&type=invite`;
    console.log("Generated confirmation URL for:", email, "tokenHash exists:", !!tokenHash);
    // Get user's name from profile
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("user_id", targetUser.id)
      .maybeSingle();

    const fullName = profile?.full_name || targetUser.user_metadata?.full_name || "Utilizador";

    // Send confirmation email via Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: "Serviço de email não configurado." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailHtml = buildConfirmationEmailHtml(fullName, confirmUrl);

    const resendRes = await fetch("https://api.resend.com/emails", {
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

    const resendBody = await resendRes.text();
    console.log("Resend response:", resendRes.status, resendBody);

    if (!resendRes.ok) {
      return new Response(
        JSON.stringify({ error: "Erro ao enviar email de confirmação." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in resend-confirmation:", error);
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
        <tr>
          <td style="background-color:#042D45;padding:32px 40px;text-align:center;">
            <img src="https://qqgfqjpgxoourayjlrwc.supabase.co/storage/v1/object/public/email-assets/chronos-logo-header.png" alt="Chronos Education" height="40" />
          </td>
        </tr>
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
        <tr>
          <td style="background-color:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="color:#999;font-size:12px;margin:0;">© 2025 Chronos Education. Todos os direitos reservados.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
