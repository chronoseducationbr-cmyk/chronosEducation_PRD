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
const AMBER = rgb(180 / 255, 140 / 255, 20 / 255);

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
  const safe = sanitize(text);
  const width = ctx.fontBold.widthOfTextAtSize(safe, size);
  ctx.page.drawText(safe, { x: (595.28 - width) / 2, y: ctx.y, size, font: ctx.fontBold, color: PRIMARY });
  ctx.y -= size + 6;
}

function drawSectionTitle(ctx: DrawCtx, text: string) {
  ensureSpace(ctx, 30);
  ctx.y -= 10;
  const safe = sanitize(text);
  ctx.page.drawText(safe, { x: 50, y: ctx.y, size: 11, font: ctx.fontBold, color: BLACK });
  ctx.y -= 16;
}

// Sanitize text to remove characters unsupported by WinAnsi encoding (e.g. tabs)
function sanitize(text: string): string {
  return text.replace(/[\t\r]/g, " ").replace(/[^\x20-\x7E\xA0-\xFF\n]/g, " ");
}

function wrapText(text: string, font: DrawCtx["font"], size: number, maxWidth: number): string[] {
  const words = sanitize(text).split(" ").filter(w => w.length > 0);
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
  const safeLabel = sanitize(label);
  const safeValue = sanitize(value || "\u2014");
  const labelWidth = ctx.font.widthOfTextAtSize(safeLabel + " ", 10);
  ctx.page.drawText(safeLabel, { x, y: ctx.y, size: 10, font: ctx.font, color: GRAY });
  ctx.page.drawText(safeValue, { x: x + labelWidth, y: ctx.y, size: 10, font: ctx.fontBold, color: BLACK });
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

/**
 * Parses contract text from app_settings into structured sections.
 * Same logic as ContractSignatureSection on the frontend.
 */
function parseContractSections(text: string) {
  if (!text?.trim()) return [];
  const lines = text.split("\n");
  const sections: { title: string; paragraphs: string[]; listItems: string[] }[] = [];
  let current: { title: string; paragraphs: string[]; listItems: string[] } | null = null;

  for (const raw of lines) {
    const line = raw.trimEnd();
    // Only match "CLÁUSULA X – TITLE" or "CLÁUSULA X TITLE" as section headers
    // Do NOT match bare "1. text" as that catches numbered list items
    const headerMatch = line.match(/^CL[AÁ]USULA\s+(\d+)\s*[\-–—]?\s*(.+)$/i);
    if (headerMatch) {
      if (current) sections.push(current);
      current = { title: `CLAUSULA ${headerMatch[1]} - ${headerMatch[2]}`, paragraphs: [], listItems: [] };
      continue;
    }
    if (!current) continue;
    // Match list items: "• ...", "a) ...", "I. ...", "1º ...", "- ...", "1. ..." (numbered within a clause)
    const bulletLine = line.replace(/^[\u2022\u2023\u25E6\u2043]\s*/, "");
    if (bulletLine !== line) {
      // Was a bullet item
      if (bulletLine.trim()) current.listItems.push(bulletLine.trim());
    } else {
      const listMatch = line.match(/^(?:[a-z]\)|[IVX]+[\.\)]\s|[0-9]+[ºª\.]\s|\-\s)\s*(.+)$/);
      if (listMatch) {
        current.listItems.push(listMatch[1]);
      } else if (line.trim()) {
        current.paragraphs.push(line.trim());
      }
    }
  }
  if (current) sections.push(current);
  return sections;
}

function isPaymentSection(title: string): boolean {
  return /(D[OA]S?\s*)?(VALORES?|PAGAMENTO|VALOR\s+E\s+FORMA|CONDI[CÇ][OÕ]ES\s*(FINANC|DE\s*PAGAMENTO))/i.test(title);
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
  financial: {
    inscriptionFeeCents: number;
    tuitionInstallmentCents: number;
    tuitionInstallments: number;
    summercampInstallmentCents: number;
    summercampInstallments: number;
  },
  dateLabel: string,
  signed: boolean,
  signedDate?: string,
  contractType: "platform" | "summercamp" = "platform",
  contractText: string = ""
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const page = doc.addPage([595.28, 841.89]);
  const ctx: DrawCtx = { page, y: 780, font, fontBold, doc };

  // Logo
  try {
    const logoUrl = "https://qqgfqjpgxoourayjlrwc.supabase.co/storage/v1/object/public/email-assets/chronos-logo-header.png";
    const logoResponse = await fetch(logoUrl);
    if (logoResponse.ok) {
      const logoBytes = new Uint8Array(await logoResponse.arrayBuffer());
      const logoImage = await doc.embedPng(logoBytes);
      const logoHeight = 36;
      const logoWidth = (logoImage.width / logoImage.height) * logoHeight;
      ctx.page.drawImage(logoImage, {
        x: (595.28 - logoWidth) / 2,
        y: ctx.y - logoHeight + 10,
        width: logoWidth,
        height: logoHeight,
      });
      ctx.y -= logoHeight + 16;
    }
  } catch (e) {
    console.error("Failed to embed logo:", e);
  }

  // Title
  drawTitle(ctx, "CONTRATO DE PRESTACAO DE SERVICOS EDUCACIONAIS", 13);
  const subtitle = contractType === "summercamp"
    ? "Programa Summer Camp - Chronos Education"
    : "Programa Dual Diploma - Chronos Education";
  drawTitle(ctx, subtitle, 11);
  ctx.y -= 4;
  const dateStr = `Data: ${dateLabel}`;
  const dateW = font.widthOfTextAtSize(dateStr, 9);
  ctx.page.drawText(dateStr, { x: (595.28 - dateW) / 2, y: ctx.y, size: 9, font, color: GRAY });
  ctx.y -= 24;

  // Section 1 - PARTES (always dynamic from enrollment data)
  drawSectionTitle(ctx, "1. PARTES");
  drawParagraph(ctx, "Pelo presente instrumento particular, de um lado:");
  ctx.y -= 4;
  drawParagraph(ctx, `CONTRATANTE: ${guardian.fullName || "[Nome completo]"}, residente e domiciliado(a) em ${student.studentAddress || "[endereco completo]"}, e-mail ${guardian.email || "[e-mail]"}, celular ${guardian.phone || "[celular]"};`);
  ctx.y -= 4;
  drawParagraph(ctx, "E, de outro lado:");
  ctx.y -= 4;
  drawParagraph(ctx, "CONTRATADA: Chronos8 Consultoria de Negocios Ltda., inscrita no CNPJ sob o n. 12.004.589/0001-85, com endereco em Rua Alberto Willo, n. 419 - Casa 3 - CEP 04067-041, Sao Paulo/SP, neste ato representada por Mario Miguel Guallar Galvez Reis e Sa;");
  ctx.y -= 4;
  drawParagraph(ctx, "Tem entre si justo e contratado:");
  ctx.y -= 8;

  // Student info block
  ctx.page.drawText("Aluno(a) Beneficiario(a)", { x: 60, y: ctx.y, size: 9, font: fontBold, color: GRAY });
  ctx.y -= 16;
  drawField(ctx, "Nome:", student.studentName, 60);
  drawField(ctx, "Data de nascimento:", formatDate(student.studentBirthDate), 60);
  drawField(ctx, "Email:", student.studentEmail, 60);
  drawField(ctx, "Endereco:", student.studentAddress, 60);
  drawField(ctx, "Escola atual:", student.studentSchool, 60);
  drawField(ctx, "Ano de conclusao do Ensino Medio:", student.studentGraduationYear || "\u2014", 60);

  // Currency formatter - plain number (no currency symbol, used inside "USD $ ..." text)
  const fmtNumber = (cents: number) => {
    if (!cents || cents <= 0) return "0,00";
    return (cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Replace placeholders in contract text
  const filledContractText = contractText.replace(/\[Data\]/gi, dateLabel);

  // Parse and render contract text sections
  const sections = parseContractSections(filledContractText);

  for (const section of sections) {
    // The preamble (PARTES) is already rendered dynamically above from enrollment data
    // No sections need to be skipped - all parsed CLÁUSULA sections should be rendered

    drawSectionTitle(ctx, section.title);

    // If this is the payment section, replace placeholders with actual financial values
    if (isPaymentSection(section.title)) {
      // Calculate values based on contract type
      const installmentCents = contractType === "platform" ? financial.tuitionInstallmentCents : financial.summercampInstallmentCents;
      const installmentCount = contractType === "platform" ? financial.tuitionInstallments : financial.summercampInstallments;
      const totalCents = installmentCents * installmentCount;

      const replacePlaceholders = (text: string): string => {
        let result = text;
        // Replace placeholders with formatted numbers - "USD $" prefix is kept from the original text
        result = result.replace(/\[Total_1\]/gi, fmtNumber(totalCents + financial.inscriptionFeeCents));
        result = result.replace(/\[Valor[\s_]*Matricula\]/gi, fmtNumber(financial.inscriptionFeeCents));
        result = result.replace(/\[TOTAL_2\]/gi, fmtNumber(totalCents));
        result = result.replace(/\[Numero\s*Parcelas?\]/gi, String(installmentCount));
        result = result.replace(/\[Valor[\s_]*Parcela\]/gi, fmtNumber(installmentCents));
        result = result.replace(/\[xxx\]/gi, "A definir");
        return result;
      };

      for (const p of section.paragraphs) {
        drawParagraph(ctx, replacePlaceholders(p));
      }
      for (const item of section.listItems) {
        drawBullet(ctx, replacePlaceholders(item));
      }
    } else {
      // Normal section - render paragraphs and list items from contract text
      for (const p of section.paragraphs) {
        drawParagraph(ctx, p);
      }
      for (const item of section.listItems) {
        drawBullet(ctx, item);
      }
    }
  }

  // Signature block
  ensureSpace(ctx, 60);
  ctx.y -= 20;
  ctx.page.drawLine({ start: { x: 50, y: ctx.y }, end: { x: 545, y: ctx.y }, thickness: 0.5, color: GRAY });
  ctx.y -= 24;

  if (signed && signedDate) {
    const checkText = "Contrato aceite digitalmente";
    const checkW = fontBold.widthOfTextAtSize(checkText, 11);
    ctx.page.drawText(checkText, { x: (595.28 - checkW) / 2, y: ctx.y, size: 11, font: fontBold, color: GREEN });
    ctx.y -= 18;
    const sigText = `Assinado por ${guardian.fullName || "\u2014"} em ${signedDate}`;
    const sigW = font.widthOfTextAtSize(sigText, 10);
    ctx.page.drawText(sigText, { x: (595.28 - sigW) / 2, y: ctx.y, size: 10, font, color: BLACK });
  } else {
    const pendingText = "Aguarda assinatura digital";
    const pendingW = fontBold.widthOfTextAtSize(pendingText, 11);
    ctx.page.drawText(pendingText, { x: (595.28 - pendingW) / 2, y: ctx.y, size: 11, font: fontBold, color: AMBER });
    ctx.y -= 18;
    const infoText = "O contratante devera aceitar este contrato na plataforma Chronos Education.";
    const infoW = font.widthOfTextAtSize(infoText, 9);
    ctx.page.drawText(infoText, { x: (595.28 - infoW) / 2, y: ctx.y, size: 9, font, color: GRAY });
  }

  return await doc.save();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { enrollmentId, guardian, student, signed, contractType } = body;
    const resolvedContractType: "platform" | "summercamp" = contractType === "summercamp" ? "summercamp" : "platform";

    if (!enrollmentId) {
      return new Response(
        JSON.stringify({ error: "enrollmentId e obrigatorio" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch enrollment data
    const { data: enrollment, error: enrollError } = await supabase
      .from("enrollments")
      .select("*")
      .eq("id", enrollmentId)
      .single();

    if (enrollError || !enrollment) {
      return new Response(
        JSON.stringify({ error: "Matrícula não encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch guardian profile
    let guardianData = guardian;
    let studentData = student;

    if (!guardianData || !studentData) {
      const [{ data: profile }, { data: authUser }] = await Promise.all([
        supabase.from("profiles").select("full_name, email, phone").eq("user_id", enrollment.user_id).single(),
        supabase.auth.admin.getUserById(enrollment.user_id),
      ]);

      const guardianEmail = enrollment.guardian_email || profile?.email || authUser?.user?.email || "";

      const guardianName = profile?.full_name || authUser?.user?.user_metadata?.full_name || "";

      guardianData = guardianData || {
        fullName: guardianName,
        email: guardianEmail,
        phone: profile?.phone || "",
      };

      studentData = studentData || {
        studentName: enrollment.student_name || "",
        studentBirthDate: enrollment.student_birth_date || "",
        studentEmail: enrollment.student_email || "",
        studentAddress: enrollment.student_address || "",
        studentSchool: enrollment.student_school || "",
        studentGraduationYear: enrollment.student_graduation_year?.toString() || "",
      };
    }

    const financial = {
      inscriptionFeeCents: enrollment.inscription_fee_cents ?? 0,
      tuitionInstallmentCents: enrollment.tuition_installment_cents ?? 0,
      tuitionInstallments: enrollment.tuition_installments ?? 0,
      summercampInstallmentCents: enrollment.summercamp_installment_cents ?? 0,
      summercampInstallments: enrollment.summercamp_installments ?? 0,
    };

    // Fetch contract text from app_settings
    const { data: appSettings } = await supabase
      .from("app_settings")
      .select("contract_text, contract_text_summercamp")
      .eq("id", 1)
      .single();

    const contractText = resolvedContractType === "summercamp"
      ? (appSettings?.contract_text_summercamp || "")
      : (appSettings?.contract_text || "");

    const now = new Date();
    const dateLabel = now.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const isSigned = signed === true;
    const signedDateStr = isSigned ? dateLabel : undefined;

    const pdfBytes = await buildContractPdf(guardianData, studentData, financial, dateLabel, isSigned, signedDateStr, resolvedContractType, contractText);

    // Upload to Supabase Storage
    const typeSuffix = resolvedContractType === "summercamp" ? "-summercamp" : "";
    const fileName = `contrato${typeSuffix}-${enrollmentId}.pdf`;
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

    // Update enrollment
    const contractUrlField = resolvedContractType === "summercamp" ? "contract_url_summercamp" : "contract_url";
    const updateFields: Record<string, unknown> = {
      [contractUrlField]: contractUrl,
    };

    if (isSigned) {
      updateFields.contract_signed_at = now.toISOString();
      updateFields.status = "Contrato assinado";
    } else {
      updateFields.contract_sent_at = now.toISOString();
      updateFields.contract_signed_at = null;
      updateFields.status = "Pendente de assinatura de contrato";
    }

    const { error: updateError } = await supabase
      .from("enrollments")
      .update(updateFields)
      .eq("id", enrollmentId);

    if (updateError) {
      console.error("Update enrollment error:", updateError);
    }

    // Convert to base64 for response (chunked)
    const chunkSize = 8192;
    let binary = "";
    for (let i = 0; i < pdfBytes.length; i += chunkSize) {
      const chunk = pdfBytes.subarray(i, Math.min(i + chunkSize, pdfBytes.length));
      for (let j = 0; j < chunk.length; j++) {
        binary += String.fromCharCode(chunk[j]);
      }
    }
    const base64Content = btoa(binary);

    console.log("Contract PDF response payload:", JSON.stringify({
      guardianEmail: guardianData.email,
      guardianName: guardianData.fullName,
      studentName: studentData.studentName,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        contractUrl,
        contractType: resolvedContractType,
        contractBase64: base64Content,
        contentType: "application/pdf",
        fileName,
        guardianEmail: guardianData.email,
        guardianName: guardianData.fullName,
        studentName: studentData.studentName,
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
