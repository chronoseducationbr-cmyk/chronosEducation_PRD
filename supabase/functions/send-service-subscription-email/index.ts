import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const buildParentEmailHtml = (guardianName: string, studentName: string, serviceName: string) => `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr>
            <td style="background:linear-gradient(135deg,#062a45 0%,#0d3d5e 100%);padding:32px 40px;border-radius:16px 16px 0 0;text-align:center;">
              <img src="https://qqgfqjpgxoourayjlrwc.supabase.co/storage/v1/object/public/email-assets/chronos-logo-header.png" alt="Chronos Education" style="height:40px;margin-bottom:12px;" />
              <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.6);letter-spacing:2px;text-transform:uppercase;">
                Dual Diploma Program
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:linear-gradient(135deg,#80ff00 0%,#6de600 100%);height:4px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="background-color:#f7f8f9;padding:40px;border-radius:0 0 16px 16px;">
              <div style="text-align:center;margin-bottom:24px;">
                <div style="display:inline-block;width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#80ff00,#6de600);line-height:64px;text-align:center;font-size:32px;">
                  ✓
                </div>
              </div>

              <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#062a45;text-align:center;font-family:Georgia,'Times New Roman',serif;">
                Novo serviço adicionado!
              </h2>
              <p style="margin:0 0 24px;font-size:15px;color:#5a6a78;text-align:center;line-height:1.6;">
                Olá <strong style="color:#062a45;">${guardianName}</strong>,
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;border:1px solid #e8ecef;margin-bottom:24px;">
                <tr>
                  <td style="padding:24px;">
                    <p style="margin:0 0 16px;font-size:15px;color:#333;line-height:1.7;">
                      O serviço <strong style="color:#062a45;">${serviceName}</strong> foi adicionado à matrícula do(a) aluno(a) <strong style="color:#062a45;">${studentName}</strong> no programa Dual Diploma da Chronos Education.
                    </p>
                    <p style="margin:0;font-size:15px;color:#333;line-height:1.7;">
                      A equipa Chronos entrará em contacto brevemente para finalizar os detalhes do novo serviço.
                    </p>
                  </td>
                </tr>
              </table>

              <hr style="border:none;border-top:1px solid #e8ecef;margin:32px 0 24px;" />
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align:center;">
                    <p style="margin:0 0 12px;font-size:12px;color:#9aa8b5;">
                      © ${new Date().getFullYear()} Chronos Education. Todos os direitos reservados.
                    </p>
                    <p style="margin:0;font-size:11px;color:#b0bac3;font-style:italic;">
                      Este é um email automático. Não responda!
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

const buildChronosEmailHtml = (guardianName: string, guardianEmail: string, studentName: string, serviceName: string) => `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr>
            <td style="background:linear-gradient(135deg,#062a45 0%,#0d3d5e 100%);padding:32px 40px;border-radius:16px 16px 0 0;text-align:center;">
              <img src="https://qqgfqjpgxoourayjlrwc.supabase.co/storage/v1/object/public/email-assets/chronos-logo-header.png" alt="Chronos Education" style="height:40px;margin-bottom:12px;" />
              <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.6);letter-spacing:2px;text-transform:uppercase;">
                Notificação Interna
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:linear-gradient(135deg,#f9b91d 0%,#f0a500 100%);height:4px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="background-color:#f7f8f9;padding:40px;border-radius:0 0 16px 16px;">
              <h2 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#062a45;font-family:Georgia,'Times New Roman',serif;">
                📋 Novo Serviço Subscrito
              </h2>

              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;border:1px solid #e8ecef;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #f0f2f5;">
                          <span style="font-size:13px;color:#8a95a0;">Aluno</span><br/>
                          <span style="font-size:15px;color:#1a2b3c;font-weight:600;">${studentName}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #f0f2f5;">
                          <span style="font-size:13px;color:#8a95a0;">Responsável</span><br/>
                          <span style="font-size:15px;color:#1a2b3c;font-weight:600;">${guardianName}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #f0f2f5;">
                          <span style="font-size:13px;color:#8a95a0;">Email do Responsável</span><br/>
                          <span style="font-size:15px;color:#1a2b3c;font-weight:600;">${guardianEmail}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;">
                          <span style="font-size:13px;color:#8a95a0;">Serviço adicionado</span><br/>
                          <span style="font-size:15px;color:#062a45;font-weight:700;">${serviceName}</span>
                        </td>
                      </tr>
                    </table>
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
    const { guardianName, guardianEmail, studentName, serviceName } = await req.json();

    if (!guardianEmail || !studentName || !serviceName) {
      return new Response(
        JSON.stringify({ error: "guardianEmail, studentName e serviceName são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sendEmail = async (to: string[], subject: string, html: string) => {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Chronos Education <contato@info.chronoseducation.com>",
          to,
          subject,
          html,
          reply_to: "chronoseducationbr@gmail.com",
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        console.error("Resend API error:", data);
        throw new Error(`Resend API error [${response.status}]: ${JSON.stringify(data)}`);
      }
      return data;
    };

    // Send to parent
    await sendEmail(
      [guardianEmail],
      `Novo serviço adicionado — ${serviceName} | Chronos Education`,
      buildParentEmailHtml(guardianName || "Responsável", studentName, serviceName)
    );

    // Send to Chronos
    await sendEmail(
      ["contato@chronoseducation.com"],
      `Novo Serviço Subscrito — ${studentName} | ${serviceName}`,
      buildChronosEmailHtml(guardianName || "Responsável", guardianEmail, studentName, serviceName)
    );

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error sending service subscription email:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
