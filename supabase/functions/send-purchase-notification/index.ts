import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PurchaseData {
  guardian: {
    full_name: string;
    email: string;
    phone: string;
    cpf?: string;
  };
  student: {
    student_name: string;
    student_email: string;
    student_birth_date: string;
    student_address: string;
    student_school: string;
    student_graduation_year: string;
  };
  payment_method: string;
  referred_by_email?: string;
}

const formatDate = () => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} às ${hours}:${minutes}`;
};

const row = (label: string, value: string) => `
  <tr>
    <td style="padding:8px 0;font-size:14px;color:#5a6a78;width:160px;vertical-align:top;border-bottom:1px solid #f0f2f4;">${label}</td>
    <td style="padding:8px 0;font-size:14px;color:#1a2b3c;font-weight:600;border-bottom:1px solid #f0f2f4;">${value || "—"}</td>
  </tr>
`;

const buildNotificationHtml = (data: PurchaseData) => `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Nova Inscrição — Dual Diploma</title>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#062a45 0%,#0d3d5e 100%);padding:32px 40px;border-radius:16px 16px 0 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;font-family:Georgia,'Times New Roman',serif;">
                      📋 Nova Inscrição Recebida
                    </h1>
                    <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.6);letter-spacing:2px;text-transform:uppercase;">
                      Dual Diploma Program
                    </p>
                  </td>
                  <td style="text-align:right;vertical-align:top;">
                    <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.8);font-weight:600;">
                      📅 ${formatDate()}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Green accent bar -->
          <tr>
            <td style="background:linear-gradient(135deg,#80ff00 0%,#6de600 100%);height:4px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:#f7f8f9;padding:40px;border-radius:0 0 16px 16px;">

              <p style="margin:0 0 24px;font-size:15px;color:#5a6a78;line-height:1.6;">
                Uma nova inscrição foi submetida através da plataforma. Seguem todos os detalhes:
              </p>

              <!-- Guardian Section -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;border:1px solid #e8ecef;margin-bottom:20px;">
                <tr>
                  <td style="padding:20px 24px 8px;">
                    <h3 style="margin:0;font-size:16px;font-weight:700;color:#062a45;">👤 Encarregado de Educação</h3>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 24px 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      ${row("Nome completo", data.guardian.full_name)}
                      ${row("Email", data.guardian.email)}
                      ${row("Telefone", data.guardian.phone)}
                      ${row("CPF", data.guardian.cpf || "")}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Student Section -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;border:1px solid #e8ecef;margin-bottom:20px;">
                <tr>
                  <td style="padding:20px 24px 8px;">
                    <h3 style="margin:0;font-size:16px;font-weight:700;color:#062a45;">🎓 Dados do Aluno</h3>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 24px 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      ${row("Nome completo", data.student.student_name)}
                      ${row("Email", data.student.student_email)}
                      ${row("Data de nascimento", data.student.student_birth_date)}
                      ${row("Morada", data.student.student_address)}
                      ${row("Escola", data.student.student_school)}
                      ${row("Ano de conclusão", data.student.student_graduation_year)}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Payment Method -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;border:1px solid #e8ecef;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <h3 style="margin:0 0 8px;font-size:16px;font-weight:700;color:#062a45;">💳 Método de Pagamento</h3>
                    <p style="margin:0;font-size:15px;color:#1a2b3c;font-weight:600;">${data.payment_method}</p>
                  </td>
                </tr>
              </table>

              <hr style="border:none;border-top:1px solid #e8ecef;margin:24px 0;" />

              <p style="margin:0;font-size:12px;color:#9aa8b5;text-align:center;">
                © ${new Date().getFullYear()} Chronos Education. Email gerado automaticamente.
              </p>

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
    const body: PurchaseData = await req.json();

    if (!body.guardian || !body.student) {
      return new Response(
        JSON.stringify({ error: "Dados do encarregado e do aluno são obrigatórios" }),
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
        from: "Chronos Education <contato@info.chronoseducation.com>",
        to: ["contato@chronoseducation.com"],
        subject: `Nova Inscrição — ${body.student.student_name || body.guardian.full_name} | Dual Diploma`,
        html: buildNotificationHtml(body),
        reply_to: body.guardian.email || "contato@chronoseducation.com",
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
    console.error("Error sending purchase notification:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
