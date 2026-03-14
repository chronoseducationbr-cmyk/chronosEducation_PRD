import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "\u2014";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("pt-BR");
}

const PRIMARY = rgb(6 / 255, 42 / 255, 69 / 255);
const GRAY = rgb(90 / 255, 106 / 255, 120 / 255);
const BLACK = rgb(0, 0, 0);
const GREEN = rgb(42 / 255, 125 / 255, 42 / 255);

interface DrawCtx {
  page: ReturnType<PDFDocument["addPage"]>;
  y: number;
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>;
  fontBold: Awaited<ReturnType<PDFDocument["embedFont"]>>;
  doc: PDFDocument;
}

function addPage(ctx: DrawCtx) {
  ctx.page = ctx.doc.addPage([595.28, 841.89]); // A4
  ctx.y = 800;
}

function ensureSpace(ctx: DrawCtx, needed: number) {
  if (ctx.y < needed + 40) addPage(ctx);
}

function drawTitle(ctx: DrawCtx, text: string, size: number) {
  ensureSpace(ctx, 30);
  const width = ctx.fontBold.widthOfTextAtSize(text, size);
  ctx.page.drawText(text, { x: (595.28 - width) / 2, y: ctx.y, size, font: ctx.fontBold, color: PRIMARY });
  ctx.y -= size + 6;
}

function drawSectionTitle(ctx: DrawCtx, text: string) {
  ensureSpace(ctx, 30);
  ctx.y -= 10;
  ctx.page.drawText(text, { x: 50, y: ctx.y, size: 11, font: ctx.fontBold, color: BLACK });
  ctx.y -= 16;
}

function wrapText(text: string, font: DrawCtx["font"], size: number, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? current + " " + word : word;
    if (font.widthOfTextAtSize(test, size) > maxWidth) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawParagraph(ctx: DrawCtx, text: string, indent = 60) {
  const lines = wrapText(text, ctx.font, 10, 595.28 - indent - 50);
  for (const line of lines) {
    ensureSpace(ctx, 16);
    ctx.page.drawText(line, { x: indent, y: ctx.y, size: 10, font: ctx.font, color: BLACK });
    ctx.y -= 14;
  }
}

function drawField(ctx: DrawCtx, label: string, value: string, x: number) {
  ensureSpace(ctx, 16);
  const labelWidth = ctx.font.widthOfTextAtSize(label + " ", 10);
  ctx.page.drawText(label, { x, y: ctx.y, size: 10, font: ctx.font, color: GRAY });
  ctx.page.drawText(value || "\u2014", { x: x + labelWidth, y: ctx.y, size: 10, font: ctx.fontBold, color: BLACK });
  ctx.y -= 15;
}

function drawBullet(ctx: DrawCtx, text: string) {
  const lines = wrapText(text, ctx.font, 10, 595.28 - 80 - 50);
  for (let i = 0; i < lines.length; i++) {
    ensureSpace(ctx, 16);
    if (i === 0) {
      ctx.page.drawText("\u2022", { x: 65, y: ctx.y, size: 10, font: ctx.font, color: BLACK });
    }
    ctx.page.drawText(lines[i], { x: 80, y: ctx.y, size: 10, font: ctx.font, color: BLACK });
    ctx.y -= 14;
  }
}

async function buildContractPdf(
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
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const page = doc.addPage([595.28, 841.89]);
  const ctx: DrawCtx = { page, y: 780, font, fontBold, doc };

  // Title
  drawTitle(ctx, "CONTRATO DE PRESTACAO DE SERVICOS EDUCACIONAIS", 13);
  drawTitle(ctx, "Programa Dual Diploma - Chronos Education", 11);
  ctx.y -= 4;
  const dateStr = `Data: ${signedDate}`;
  const dateW = font.widthOfTextAtSize(dateStr, 9);
  ctx.page.drawText(dateStr, { x: (595.28 - dateW) / 2, y: ctx.y, size: 9, font, color: GRAY });
  ctx.y -= 24;

  // 1. PARTES
  drawSectionTitle(ctx, "1. PARTES");
  ctx.page.drawText("Contratante (Pai/Mae ou Responsavel)", { x: 60, y: ctx.y, size: 9, font: fontBold, color: GRAY });
  ctx.y -= 16;
  drawField(ctx, "Nome:", guardian.fullName, 60);
  drawField(ctx, "Email:", guardian.email, 60);
  drawField(ctx, "Celular:", guardian.phone, 60);
  ctx.y -= 6;
  ctx.page.drawText("Aluno(a) Beneficiario(a)", { x: 60, y: ctx.y, size: 9, font: fontBold, color: GRAY });
  ctx.y -= 16;
  drawField(ctx, "Nome:", student.studentName, 60);
  drawField(ctx, "Data de nascimento:", formatDate(student.studentBirthDate), 60);
  drawField(ctx, "Email:", student.studentEmail, 60);
  drawField(ctx, "Endereco:", student.studentAddress, 60);
  drawField(ctx, "Escola atual:", student.studentSchool, 60);
  drawField(ctx, "Ano de conclusao do Ensino Medio:", student.studentGraduationYear || "\u2014", 60);

  // 2. OBJETO
  drawSectionTitle(ctx, "2. OBJETO");
  drawParagraph(ctx, "O presente contrato tem por objeto a prestacao de servicos educacionais do Programa Dual Diploma da Chronos Education, que permite ao aluno obter simultaneamente o diploma brasileiro de Ensino Medio e o diploma americano de High School, atraves da Plataforma Online.");

  // 3. DURACAO
  drawSectionTitle(ctx, "3. DURACAO");
  drawParagraph(ctx, "O programa tem duracao media de 2 (dois) anos, com inicio na data de confirmacao da matricula.");

  // 4. OBRIGACOES DA CHRONOS
  drawSectionTitle(ctx, "4. OBRIGACOES DA CHRONOS EDUCATION");
  drawBullet(ctx, "Disponibilizar acesso a Plataforma Online;");
  drawBullet(ctx, "Fornecer tutoria individual e suporte tecnico;");
  drawBullet(ctx, "Enviar relatorios periodicos aos pais/responsaveis;");
  drawBullet(ctx, "Emitir o diploma americano de High School apos a conclusao dos creditos necessarios.");

  // 5. OBRIGACOES DO CONTRATANTE
  drawSectionTitle(ctx, "5. OBRIGACOES DO CONTRATANTE");
  drawBullet(ctx, "Efetuar o pagamento das parcelas nos prazos estabelecidos;");
  drawBullet(ctx, "Garantir que o aluno dedique entre 1 a 2 horas semanais as atividades do programa;");
  drawBullet(ctx, "Manter os dados cadastrais atualizados.");

  // 6. VALORES E PAGAMENTO
  drawSectionTitle(ctx, "6. VALORES E PAGAMENTO");
  drawParagraph(ctx, "As condicoes de pagamento, incluindo taxa de matricula e mensalidades, serao comunicadas pela equipe Chronos Education apos a confirmacao da matricula.");

  // 7. CANCELAMENTO
  drawSectionTitle(ctx, "7. CANCELAMENTO");
  drawParagraph(ctx, "O contratante podera solicitar o cancelamento a qualquer momento, mediante comunicacao por escrito. Aplicam-se as condicoes de reembolso conforme os Termos e Condicoes disponiveis em chronoseducation.com/termos.");

  // 8. LGPD
  drawSectionTitle(ctx, "8. PROTECAO DE DADOS (LGPD)");
  drawParagraph(ctx, "Os dados pessoais recolhidos serao tratados em conformidade com a Lei Geral de Protecao de Dados (Lei n. 13.709/2018), sendo utilizados exclusivamente para fins educacionais e administrativos.");

  // 9. FORO
  drawSectionTitle(ctx, "9. FORO");
  drawParagraph(ctx, "As partes elegem o foro da Comarca de Sao Paulo/SP para dirimir quaisquer questoes decorrentes deste contrato.");

  // Signature block
  ensureSpace(ctx, 60);
  ctx.y -= 20;
  ctx.page.drawLine({ start: { x: 50, y: ctx.y }, end: { x: 545, y: ctx.y }, thickness: 0.5, color: GRAY });
  ctx.y -= 24;
  const checkText = "Contrato aceite digitalmente";
  const checkW = fontBold.widthOfTextAtSize(checkText, 11);
  ctx.page.drawText(checkText, { x: (595.28 - checkW) / 2, y: ctx.y, size: 11, font: fontBold, color: GREEN });
  ctx.y -= 18;
  const sigText = `Assinado por ${guardian.fullName || "\u2014"} em ${signedDate}`;
  const sigW = font.widthOfTextAtSize(sigText, 10);
  ctx.page.drawText(sigText, { x: (595.28 - sigW) / 2, y: ctx.y, size: 10, font, color: BLACK });

  return await doc.save();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { guardian, student, enrollmentId } = await req.json();

    if (!enrollmentId) {
      return new Response(
        JSON.stringify({ error: "enrollmentId e obrigatorio" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const now = new Date();
    const signedDate = now.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const pdfBytes = await buildContractPdf(guardian, student, signedDate);

    // Upload to Supabase Storage
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const fileName = `contrato-${enrollmentId}.pdf`;
    const filePath = `signed/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("contracts")
      .upload(filePath, pdfBytes, {
        contentType: "application/pdf",
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

    // Convert to base64 for email attachment (chunked)
    const chunkSize = 8192;
    let binary = "";
    for (let i = 0; i < pdfBytes.length; i += chunkSize) {
      const chunk = pdfBytes.subarray(i, Math.min(i + chunkSize, pdfBytes.length));
      for (let j = 0; j < chunk.length; j++) {
        binary += String.fromCharCode(chunk[j]);
      }
    }
    const base64Content = btoa(binary);

    return new Response(
      JSON.stringify({
        success: true,
        contractUrl,
        contractBase64: base64Content,
        contentType: "application/pdf",
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
