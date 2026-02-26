import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const buildEmailHtml = (userName: string) => `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Inscrição Confirmada</title>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#062a45 0%,#0d3d5e 100%);padding:32px 40px;border-radius:16px 16px 0 0;text-align:center;">
              <img src="https://id-preview--7dbf840a-6321-4069-8c9e-133584e3a12c.lovable.app/chronos-logo-header.png" alt="Chronos Education" style="height:40px;margin-bottom:12px;" />
              <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.6);letter-spacing:2px;text-transform:uppercase;">
                Dual Diploma Program
              </p>
            </td>
          </tr>

          <!-- Green accent bar -->
          <tr>
            <td style="background:linear-gradient(135deg,#80ff00 0%,#6de600 100%);height:4px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:#f7f8f9;padding:40px;border-radius:0 0 16px 16px;">

              <!-- Success icon -->
              <div style="text-align:center;margin-bottom:24px;">
                <div style="display:inline-block;width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#80ff00,#6de600);line-height:64px;text-align:center;font-size:32px;">
                  ✓
                </div>
              </div>

              <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#062a45;text-align:center;font-family:Georgia,'Times New Roman',serif;">
                Inscrição Confirmada!
              </h2>
              <p style="margin:0 0 24px;font-size:15px;color:#5a6a78;text-align:center;line-height:1.6;">
                Parabéns, <strong style="color:#062a45;">${userName}</strong>!
              </p>

              <!-- Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;border:1px solid #e8ecef;margin-bottom:24px;">
                <tr>
                  <td style="padding:24px;">
                    <p style="margin:0 0 16px;font-size:15px;color:#333;line-height:1.7;">
                      A sua inscrição no programa <strong>Dual Diploma</strong> foi processada com sucesso. 
                      Agradecemos a confiança nos nossos serviços.
                    </p>
                    <p style="margin:0 0 16px;font-size:15px;color:#333;line-height:1.7;">
                      A partir de agora, a nossa equipa irá entrar em contacto consigo com os próximos passos para iniciar a sua jornada rumo ao diploma americano.
                    </p>
                    <p style="margin:0;font-size:15px;color:#333;line-height:1.7;">
                      Se tiver alguma dúvida, não hesite em contactar-nos.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #e8ecef;margin:32px 0 24px;" />

              <!-- Footer info -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align:center;">
                    <p style="margin:0 0 4px;font-size:13px;color:#5a6a78;">
                      📧 chronoseducationbr@gmail.com
                    </p>
                    <p style="margin:0 0 16px;font-size:13px;color:#5a6a78;">
                      📞 (11) 99949-1067
                    </p>
                    <p style="margin:0;font-size:12px;color:#9aa8b5;">
                      © ${new Date().getFullYear()} Chronos Education. Todos os direitos reservados.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) {
    return new Response(
      JSON.stringify({ error: "RESEND_API_KEY is not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { email, name } = await req.json();

    if (!email || !name) {
      return new Response(
        JSON.stringify({ error: "Email e nome são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Chronos Education <onboarding@resend.dev>",
        to: [email],
        subject: "Inscrição Confirmada — Dual Diploma | Chronos Education",
        html: buildEmailHtml(name),
        reply_to: "chronoseducationbr@gmail.com",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Resend API error:", data);
      throw new Error(`Resend API error [${response.status}]: ${JSON.stringify(data)}`);
    }

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error sending enrollment email:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
