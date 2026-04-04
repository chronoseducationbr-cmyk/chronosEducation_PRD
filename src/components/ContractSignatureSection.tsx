import { useState, useRef, useCallback, useEffect } from "react";
import { FileText, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { GuardianData } from "@/components/GuardianDataSection";
import type { StudentData } from "@/components/StudentDataSection";

interface FinancialData {
  inscriptionFeeCents: number;
  tuitionInstallmentCents: number;
  tuitionInstallments: number;
  summercampInstallmentCents: number;
  summercampInstallments: number;
}

interface Props {
  onAcceptChange: (accepted: boolean) => void;
  guardianData: GuardianData;
  studentData: StudentData;
  financialData?: FinancialData;
}

type ContractItem =
  | { type: "paragraph"; text: string }
  | {
      type: "list";
      text: string;
      listStyle: "ordered" | "unordered";
      marker: string;
      level: number;
    };

interface ContractSection {
  title: string;
  items: ContractItem[];
}

function getNestedListLevel(previousItem: ContractItem | null) {
  if (previousItem?.type === "list" && previousItem.listStyle === "ordered" && /:\s*$/.test(previousItem.text)) {
    return previousItem.level + 1;
  }

  if (previousItem?.type === "list" && previousItem.listStyle === "unordered" && previousItem.level > 0) {
    return previousItem.level;
  }

  return 0;
}

function parseListItem(line: string, previousItem: ContractItem | null): Extract<ContractItem, { type: "list" }> | null {
  const trimmedLine = line.trim();
  if (!trimmedLine) return null;

  const singleLetterTabMatch = trimmedLine.match(/^([a-z])\t+(.+)$/i);
  if (singleLetterTabMatch) {
    const markerLetter = singleLetterTabMatch[1].toLowerCase();

    if (markerLetter === "o") {
      return {
        type: "list",
        text: singleLetterTabMatch[2].trim(),
        listStyle: "unordered",
        marker: "•",
        level: Math.max(1, getNestedListLevel(previousItem)),
      };
    }

    return {
      type: "list",
      text: singleLetterTabMatch[2].trim(),
      listStyle: "ordered",
      marker: `${singleLetterTabMatch[1]})`,
      level: 1,
    };
  }

  const bulletMatch = trimmedLine.match(/^[\u2022\u2023\u25E6\u2043\u25CF\u2219]\s*(.+)$/);
  if (bulletMatch) {
    return {
      type: "list",
      text: bulletMatch[1].trim(),
      listStyle: "unordered",
      marker: "•",
      level: getNestedListLevel(previousItem),
    };
  }

  const dashMatch = trimmedLine.match(/^\-\s+(.+)$/);
  if (dashMatch) {
    return {
      type: "list",
      text: dashMatch[1].trim(),
      listStyle: "unordered",
      marker: "•",
      level: getNestedListLevel(previousItem),
    };
  }

  const orderedMatch = trimmedLine.match(/^((?:\d+[ºª]?[\.)]|[IVX]+[\.)]|[a-z][\.)]))\s*(.+)$/i);
  if (orderedMatch) {
    return {
      type: "list",
      text: orderedMatch[2].trim(),
      listStyle: "ordered",
      marker: orderedMatch[1],
      level: 0,
    };
  }

  return null;
}

function parseContractSections(text: string): ContractSection[] {
  if (!text?.trim()) return [];

  const lines = text.split("\n");
  const sections: ContractSection[] = [];
  let current: ContractSection | null = null;
  let previousItem: ContractItem | null = null;

  for (const raw of lines) {
    const line = raw.trimEnd();
    const headerMatch = line.match(/^CL[AÁ]USULA\s+\d+\s*[\-–—]?.+$/i) || line.match(/^(\d+)\.\s+(.+)$/);

    if (headerMatch) {
      if (current) sections.push(current);
      current = { title: line.trim(), items: [] };
      previousItem = null;
      continue;
    }

    if (!current) continue;

    const trimmedLine = line.trim();
    if (!trimmedLine) {
      previousItem = null;
      continue;
    }

    const parsedItem = parseListItem(trimmedLine, previousItem);
    if (parsedItem) {
      current.items.push(parsedItem);
      previousItem = parsedItem;
      continue;
    }

    const paragraphItem: ContractItem = { type: "paragraph", text: trimmedLine };
    current.items.push(paragraphItem);
    previousItem = paragraphItem;
  }

  if (current) sections.push(current);
  return sections;
}

const ContractSignatureSection = ({ onAcceptChange, guardianData, studentData, financialData }: Props) => {
  const [accepted, setAccepted] = useState(false);
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);
  const [contractText, setContractText] = useState("");
  const [loading, setLoading] = useState(true);
  const contractRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("app_settings" as any)
        .select("contract_text, contract_text_summercamp")
        .eq("id", 1)
        .single();
      if (data) {
        const s = data as any;
        // Use summercamp contract if summercamp is contracted, otherwise plataforma contract
        const isSummercamp = financialData && financialData.summercampInstallments > 0;
        const isPlataforma = financialData && financialData.tuitionInstallments > 0;
        if (isSummercamp && !isPlataforma) {
          setContractText(s.contract_text_summercamp || "");
        } else {
          setContractText(s.contract_text || "");
        }
      }
      setLoading(false);
    };
    load();
  }, [financialData]);

  const handleScroll = useCallback(() => {
    const el = contractRef.current;
    if (!el || hasScrolledToEnd) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) {
      setHasScrolledToEnd(true);
    }
  }, [hasScrolledToEnd]);

  const handleToggle = () => {
    
    const next = !accepted;
    setAccepted(next);
    onAcceptChange(next);
  };

  const today = new Date();
  const formattedDate = today.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const formatBirthDate = (date: string) => {
    if (!date) return "—";
    return new Date(date + "T00:00:00").toLocaleDateString("pt-BR");
  };

  const fmtCurrency = (cents: number) => {
    if (!cents || cents <= 0) return "A definir";
    return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const sections = parseContractSections(contractText);

  return (
    <div className="bg-card rounded-xl border border-border shadow-card p-6 space-y-5">
      <h2 className="font-heading text-lg font-semibold text-foreground flex items-center gap-2">
        <FileText size={20} className="text-secondary" />
        Contrato de Prestação de Serviços Educacionais
      </h2>

      <p className="text-sm text-muted-foreground">
        Leia atentamente o contrato abaixo antes de confirmar a matrícula.
      </p>

      {/* Contract body */}
      <div ref={contractRef} onScroll={handleScroll} className="bg-muted/30 border border-border rounded-lg p-5 max-h-[420px] overflow-y-auto space-y-5 text-sm text-foreground leading-relaxed">
        {loading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-4 bg-muted rounded w-5/6" />
          </div>
        ) : (
          <>
            <div className="text-center space-y-1">
              <p className="font-heading font-bold text-base uppercase tracking-wide">
                Contrato de Prestação de Serviços Educacionais
              </p>
              <p className="font-heading font-semibold text-sm">
                Programa Dual Diploma — Chronos Education
              </p>
              <p className="text-muted-foreground text-xs">Data: {formattedDate}</p>
            </div>

            {/* Preamble / PARTES */}
            <div className="space-y-3">
              <p>Pelo presente instrumento particular, de um lado:</p>
              <p>
                <span className="font-semibold">CONTRATANTE:</span>{" "}
                <span className="font-medium">{guardianData.fullName || "[Nome completo]"}</span>,{" "}
                {guardianData.nationality || "[nacionalidade]"},{" "}
                {guardianData.civilStatus || "[estado civil]"},{" "}
                {guardianData.profession || "[profissão]"},{" "}
                inscrito(a) no CPF sob o nº{" "}
                <span className="font-medium">{guardianData.cpf || "[CPF]"}</span>{" "}
                e RG nº{" "}
                <span className="font-medium">{guardianData.rgNumber || "[RG]"}</span>,{" "}
                residente e domiciliado(a) em{" "}
                <span className="font-medium">{guardianData.guardianAddress || "[endereço completo]"}</span>;
              </p>
              <p>E, de outro lado:</p>
              <p>
                <span className="font-semibold">CONTRATADA:</span>{" "}
                Chronos8 Consultoria de Negócios Ltda., inscrita no CNPJ sob o nº 12.004.589/0001-85,
                com endereço em Rua Alberto Willo, nº 419 – Casa 3 – CEP 04067-041, São Paulo/SP,
                neste ato representada por Mário Miguel Guallar Galvez Reis e Sá;
              </p>
              <p>Têm entre si justo e contratado:</p>

              {/* Aluno beneficiário */}
              <div className="mt-2">
                <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide mb-1">
                  Aluno(a) Beneficiário(a)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5">
                  <p>Nome: <span className="font-medium">{studentData.studentName || "—"}</span></p>
                  <p>Data de nascimento: <span className="font-medium">{formatBirthDate(studentData.studentBirthDate)}</span></p>
                  <p>Email: <span className="font-medium">{studentData.studentEmail || "—"}</span></p>
                  <p>Endereço: <span className="font-medium">{studentData.studentAddress || "—"}</span></p>
                  <p>Escola atual: <span className="font-medium">{studentData.studentSchool || "—"}</span></p>
                  <p>Ano de conclusão do Ensino Médio: <span className="font-medium">{studentData.studentGraduationYear || "—"}</span></p>
                </div>
              </div>
            </div>

            {/* Dynamic sections from DB — inject financial values into payment clause */}
            {sections.map((section, idx) => {
              const isPaymentSection = /(D[OA]S?\s*)?(VALORES?|PAGAMENTO|VALOR\s+E\s+FORMA|CONDI[CÇ][OÕ]ES\s*(FINANC|DE\s*PAGAMENTO))/i.test(section.title);
              return (
                <div key={idx}>
                  <p className="font-semibold mb-1">{section.title}</p>
                  <div className="space-y-1">
                    {section.items.map((item, itemIndex) => {
                      const content = item.text.replace(/\[Data\]/gi, formattedDate);

                      if (item.type === "paragraph") {
                        return <p key={itemIndex} className="pl-3">{content}</p>;
                      }

                      return (
                        <div
                          key={itemIndex}
                          className="flex items-start gap-2"
                          style={{ paddingLeft: `${12 + item.level * 20}px` }}
                        >
                          <span className="w-5 shrink-0 font-medium text-muted-foreground">
                            {item.listStyle === "ordered" ? item.marker : "•"}
                          </span>
                          <p className="min-w-0 flex-1">{content}</p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Inject contracted financial values into clause 7 */}
                  {isPaymentSection && financialData && (
                    <div className="pl-3 mt-3 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5">
                        <p>Taxa de Matrícula: <span className="font-medium">{fmtCurrency(financialData.inscriptionFeeCents)}</span></p>
                      </div>

                      {financialData.tuitionInstallments > 0 && (
                        <div>
                          <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide mb-1">Plataforma Online</p>
                          {financialData.tuitionInstallmentCents > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5">
                              <p>Valor da parcela: <span className="font-medium">{fmtCurrency(financialData.tuitionInstallmentCents)}</span></p>
                              <p>Nº de parcelas: <span className="font-medium">{financialData.tuitionInstallments}</span></p>
                              <p>Total: <span className="font-medium">{fmtCurrency(financialData.tuitionInstallmentCents * financialData.tuitionInstallments)}</span></p>
                            </div>
                          ) : (
                            <p className="italic text-muted-foreground">Valores a definir pela equipa Chronos Education.</p>
                          )}
                        </div>
                      )}

                      {financialData.summercampInstallments > 0 && (
                        <div>
                          <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide mb-1">Summer Camp</p>
                          {financialData.summercampInstallmentCents > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5">
                              <p>Valor da parcela: <span className="font-medium">{fmtCurrency(financialData.summercampInstallmentCents)}</span></p>
                              <p>Nº de parcelas: <span className="font-medium">{financialData.summercampInstallments}</span></p>
                              <p>Total: <span className="font-medium">{fmtCurrency(financialData.summercampInstallmentCents * financialData.summercampInstallments)}</span></p>
                            </div>
                          ) : (
                            <p className="italic text-muted-foreground">Valores a definir pela equipa Chronos Education.</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Acceptance checkbox */}
      <label className="flex items-start gap-3 mt-2 cursor-pointer group">
        <div className="relative mt-0.5">
          <input
            type="checkbox"
            checked={accepted}
            onChange={handleToggle}
            className="sr-only"
          />
          <div
            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
              accepted
                ? "bg-secondary border-secondary"
                : "border-muted-foreground/40 group-hover:border-muted-foreground/70"
            }`}
          >
            {accepted && <CheckCircle2 size={14} className="text-secondary-foreground" />}
          </div>
        </div>
        <span className="text-sm text-foreground leading-snug">
          Li e aceito os termos do contrato do programa Dual Diploma da Chronos Education.
        </span>
      </label>
    </div>
  );
};

export default ContractSignatureSection;
