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

/**
 * Parses the contract_text from app_settings into structured sections.
 * Expected format: lines starting with "N. TITLE" begin a new section,
 * sub-items starting with "a) " / "b) " etc. become list items.
 */
function parseContractSections(text: string) {
  if (!text?.trim()) return [];

  const lines = text.split("\n");
  const sections: { title: string; paragraphs: string[]; listItems: string[] }[] = [];
  let current: { title: string; paragraphs: string[]; listItems: string[] } | null = null;

  for (const raw of lines) {
    const line = raw.trimEnd();
    // Section header: starts with "N. " or "NN. "
    const headerMatch = line.match(/^(\d+)\.\s+(.+)$/);
    if (headerMatch) {
      if (current) sections.push(current);
      current = { title: `${headerMatch[1]}. ${headerMatch[2]}`, paragraphs: [], listItems: [] };
      continue;
    }

    if (!current) continue;

    // List item: starts with "a) ", "b) ", etc.
    const listMatch = line.match(/^[a-z]\)\s+(.+)$/);
    if (listMatch) {
      current.listItems.push(listMatch[1]);
    } else if (line.trim()) {
      current.paragraphs.push(line.trim());
    }
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
        .select("contract_text")
        .eq("id", 1)
        .single();
      if (data) {
        setContractText((data as any).contract_text || "");
      }
      setLoading(false);
    };
    load();
  }, []);

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

            {/* Section 1: PARTES (always dynamic) */}
            <div>
              <p className="font-semibold mb-2">1. PARTES</p>
              <div className="space-y-3 pl-3">
                <div>
                  <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide mb-1">
                    Contratante (Pai/Mãe ou Responsável)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5">
                    <p>Nome: <span className="font-medium">{guardianData.fullName || "—"}</span></p>
                    <p>Email: <span className="font-medium">{guardianData.email || "—"}</span></p>
                    <p>Celular: <span className="font-medium">{guardianData.phone || "—"}</span></p>
                  </div>
                </div>
                <div>
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
            </div>

            {/* Dynamic sections from DB */}
            {sections.map((section, idx) => (
              <div key={idx}>
                <p className="font-semibold mb-1">{section.title}</p>
                {section.paragraphs.map((p, pi) => (
                  <p key={pi} className="pl-3">{p}</p>
                ))}
                {section.listItems.length > 0 && (
                  <ul className="pl-6 list-[lower-alpha] space-y-0.5">
                    {section.listItems.map((item, li) => (
                      <li key={li}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
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
