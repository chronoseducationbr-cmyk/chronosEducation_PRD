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
}

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
            <td style="background:linear-gradient(135deg,#062a45 0%,#0d3d5e 100%);padding:32px 40px;border-radius:16px 16px 0 0;text-align:center;">
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;font-family:Georgia,'Times New Roman',serif;">
                📋 Nova Inscrição Recebida
              </h1>
              <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.6);letter-spacing:2px;text-transform:uppercase;">
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

              <p style="margin:0 0 24px;font-size:15px;color:#5a6a78;line-height:1.6;">
                Uma nova inscrição foi submetida através da plataforma. Seguem os detalhes:
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
                      <tr>
                        <td style="padding:6px 0;font-size:14px;color:#5a6a78;width:140px;vertical-align:top;">Nome:</td>
                        <td style="padding:6px 0;font-size:14px;color:#333;font-weight:600;">${data.guardian.full_name || "—"}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:14px;color:#5a6a78;vertical-align:top;">Email:</td>
                        <td style="padding:6px 0;font-size:14px;color:#333;font-weight:600;">${data.guardian.email || "—"}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:14px;color:#5a6a78;vertical-align:top;">Telefone:</td>
                        <td style="padding:6px 0;font-size:14px;color:#333;font-weight:600;">${data.guardian.phone || "—"}</td>
                      </tr>
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
                      <tr>
                        <td style="padding:6px 0;font-size:14px;color:#5a6a78;width:140px;vertical-align:top;">Nome:</td>
                        <td style="padding:6px 0;font-size:14px;color:#333;font-weight:600;">${data.student.student_name || "—"}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:14px;color:#5a6a78;vertical-align:top;">Email:</td>
                        <td style="padding:6px 0;font-size:14px;color:#333;font-weight:600;">${data.student.student_email || "—"}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:14px;color:#5a6a78;vertical-align:top;">Data nasc.:</td>
                        <td style="padding:6px 0;font-size:14px;color:#333;font-weight:600;">${data.student.student_birth_date || "—"}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:14px;color:#5a6a78;vertical-align:top;">Morada:</td>
                        <td style="padding:6px 0;font-size:14px;color:#333;font-weight:600;">${data.student.student_address || "—"}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:14px;color:#5a6a78;vertical-align:top;">Escola:</td>
                        <td style="padding:6px 0;font-size:14px;color:#333;font-weight:600;">${data.student.student_school || "—"}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:14px;color:#5a6a78;vertical-align:top;">Ano conclusão:</td>
                        <td style="padding:6px 0;font-size:14px;color:#333;font-weight:600;">${data.student.student_graduation_year || "—"}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Payment Method -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;border:1px solid #e8ecef;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <h3 style="margin:0 0 8px;font-size:16px;font-weight:700;color:#062a45;">💳 Método de Pagamento</h3>
                    <p style="margin:0;font-size:15px;color:#333;font-weight:600;">${data.payment_method}</p>
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
        from: "Chronos Education <onboarding@resend.dev>",
        to: ["chronoseducationbr@gmail.com"],
        subject: `Nova Inscrição — ${body.student.student_name || body.guardian.full_name} | Dual Diploma`,
        html: buildNotificationHtml(body),
        reply_to: body.guardian.email || "chronoseducationbr@gmail.com",
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
