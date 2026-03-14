import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("pt-BR");
}

function buildContractHtml(
  guardian: { fullName: string; email: string; phone: string },
  student: {
    studentName: string;
    studentBirthDate: string;
    studentEmail: string;
    studentAddress: string;
    studentSchool: string;
    studentGraduationYear: string;
  },
  signedDate: string
): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #222; margin: 40px; line-height: 1.7; }
    h1 { text-align: center; font-size: 16px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 4px; color: #062a45; }
    h2 { text-align: center; font-size: 14px; margin-top: 0; color: #062a45; }
    .date { text-align: center; font-size: 12px; color: #666; margin-bottom: 28px; }
    .section-title { font-weight: 700; font-size: 13px; margin-top: 20px; margin-bottom: 4px; }
    .sub-title { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #666; font-weight: 600; margin-bottom: 4px; margin-top: 12px; }
    .data-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2px 16px; }
    .data-grid p { margin: 2px 0; }
    .data-grid .value { font-weight: 600; }
    ul { padding-left: 20px; }
    ul li { margin-bottom: 2px; }
    .indent { padding-left: 16px; }
    .signature-block { margin-top: 40px; border-top: 1px solid #ccc; padding-top: 20px; text-align: center; }
    .signature-block .check { color: #2a7d2a; font-weight: 700; }
  </style>
</head>
<body>
  <h1>Contrato de Prestação de Serviços Educacionais</h1>
  <h2>Programa Dual Diploma — Chronos Education</h2>
  <p class="date">Data: ${signedDate}</p>

  <p class="section-title">1. PARTES</p>
  <div class="indent">
    <p class="sub-title">Contratante (Pai/Mãe ou Responsável)</p>
    <div class="data-grid">
      <p>Nome: <span class="value">${guardian.fullName || "—"}</span></p>
      <p>Email: <span class="value">${guardian.email || "—"}</span></p>
      <p>Celular: <span class="value">${guardian.phone || "—"}</span></p>
    </div>
    <p class="sub-title">Aluno(a) Beneficiário(a)</p>
    <div class="data-grid">
      <p>Nome: <span class="value">${student.studentName || "—"}</span></p>
      <p>Data de nascimento: <span class="value">${formatDate(student.studentBirthDate)}</span></p>
      <p>Email: <span class="value">${student.studentEmail || "—"}</span></p>
      <p>Endereço: <span class="value">${student.studentAddress || "—"}</span></p>
      <p>Escola atual: <span class="value">${student.studentSchool || "—"}</span></p>
      <p>Ano de conclusão do Ensino Médio: <span class="value">${student.studentGraduationYear || "—"}</span></p>
    </div>
  </div>

  <p class="section-title">2. OBJETO</p>
  <p class="indent">O presente contrato tem por objeto a prestação de serviços educacionais do Programa Dual Diploma da Chronos Education, que permite ao aluno obter simultaneamente o diploma brasileiro de Ensino Médio e o diploma americano de High School, através da Plataforma Online.</p>

  <p class="section-title">3. DURAÇÃO</p>
  <p class="indent">O programa tem duração média de 2 (dois) anos, com início na data de confirmação da matrícula.</p>

  <p class="section-title">4. OBRIGAÇÕES DA CHRONOS EDUCATION</p>
  <ul>
    <li>Disponibilizar acesso à Plataforma Online;</li>
    <li>Fornecer tutoria individual e suporte técnico;</li>
    <li>Enviar relatórios periódicos aos pais/responsáveis;</li>
    <li>Emitir o diploma americano de High School após a conclusão dos créditos necessários.</li>
  </ul>

  <p class="section-title">5. OBRIGAÇÕES DO CONTRATANTE</p>
  <ul>
    <li>Efetuar o pagamento das parcelas nos prazos estabelecidos;</li>
    <li>Garantir que o aluno dedique entre 1 a 2 horas semanais às atividades do programa;</li>
    <li>Manter os dados cadastrais atualizados.</li>
  </ul>

  <p class="section-title">6. VALORES E PAGAMENTO</p>
  <p class="indent">As condições de pagamento, incluindo taxa de matrícula e mensalidades, serão comunicadas pela equipe Chronos Education após a confirmação da matrícula.</p>

  <p class="section-title">7. CANCELAMENTO</p>
  <p class="indent">O contratante poderá solicitar o cancelamento a qualquer momento, mediante comunicação por escrito. Aplicam-se as condições de reembolso conforme os Termos e Condições disponíveis em chronoseducation.com/termos.</p>

  <p class="section-title">8. PROTEÇÃO DE DADOS (LGPD)</p>
  <p class="indent">Os dados pessoais recolhidos serão tratados em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), sendo utilizados exclusivamente para fins educacionais e administrativos.</p>

  <p class="section-title">9. FORO</p>
  <p class="indent">As partes elegem o foro da Comarca de São Paulo/SP para dirimir quaisquer questões decorrentes deste contrato.</p>

  <div class="signature-block">
    <p class="check">✓ Contrato aceite digitalmente</p>
    <p>Assinado por <strong>${guardian.fullName || "—"}</strong> em ${signedDate}</p>
  </div>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { guardian, student, enrollmentId } = await req.json();

    if (!enrollmentId) {
      return new Response(
        JSON.stringify({ error: "enrollmentId é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const now = new Date();
    const signedDate = now.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const html = buildContractHtml(guardian, student, signedDate);

    // Use Lovable AI to convert HTML to PDF via a headless approach
    // Since we can't run a browser in edge functions, we'll store the HTML
    // and use a third-party API or generate a simple PDF

    // Generate PDF using a free HTML-to-PDF API
    const pdfResponse = await fetch("https://html2pdf.app/api/v1/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        html: html,
        options: {
          format: "A4",
          margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
        },
      }),
    });

    let pdfBytes: Uint8Array;

    if (!pdfResponse.ok) {
      // Fallback: store the contract as HTML content wrapped in a minimal PDF-like structure
      // We'll use the Supabase storage to store the HTML file as the contract
      console.warn("HTML-to-PDF API failed, storing as HTML contract");
      pdfBytes = new TextEncoder().encode(html);
    } else {
      pdfBytes = new Uint8Array(await pdfResponse.arrayBuffer());
    }

    // Upload to Supabase Storage
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const fileName = `contrato-${enrollmentId}.pdf`;
    const filePath = `signed/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("contracts")
      .upload(filePath, pdfBytes, {
        contentType: pdfResponse.ok ? "application/pdf" : "text/html",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error(`Erro ao guardar contrato: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from("contracts")
      .getPublicUrl(filePath);

    const contractUrl = publicUrlData.publicUrl;

    // Update enrollment with contract URL and signed date
    const { error: updateError } = await supabase
      .from("enrollments")
      .update({
        contract_url: contractUrl,
        contract_signed_at: now.toISOString(),
      })
      .eq("id", enrollmentId);

    if (updateError) {
      console.error("Update enrollment error:", updateError);
    }

    // Return the contract as base64 for email attachment
    const base64Content = btoa(
      String.fromCharCode(...pdfBytes)
    );

    return new Response(
      JSON.stringify({
        success: true,
        contractUrl,
        contractBase64: base64Content,
        contentType: pdfResponse.ok ? "application/pdf" : "text/html",
        fileName,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error generating contract:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
