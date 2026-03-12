import { useState } from "react";
import { FileText, CheckCircle2 } from "lucide-react";
import type { GuardianData } from "@/components/GuardianDataSection";
import type { StudentData } from "@/components/StudentDataSection";

interface Props {
  onAcceptChange: (accepted: boolean) => void;
  guardianData: GuardianData;
  studentData: StudentData;
}

const ContractSignatureSection = ({ onAcceptChange, guardianData, studentData }: Props) => {
  const [accepted, setAccepted] = useState(false);

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
      <div className="bg-muted/30 border border-border rounded-lg p-5 max-h-[420px] overflow-y-auto space-y-5 text-sm text-foreground leading-relaxed">
        <div className="text-center space-y-1">
          <p className="font-heading font-bold text-base uppercase tracking-wide">
            Contrato de Prestação de Serviços Educacionais
          </p>
          <p className="font-heading font-semibold text-sm">
            Programa Dual Diploma — Chronos Education
          </p>
          <p className="text-muted-foreground text-xs">Data: {formattedDate}</p>
        </div>

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

        <div>
          <p className="font-semibold mb-1">2. OBJETO</p>
          <p className="pl-3">
            O presente contrato tem por objeto a prestação de serviços educacionais do Programa Dual Diploma 
            da Chronos Education, que permite ao aluno obter simultaneamente o diploma brasileiro de Ensino Médio 
            e o diploma americano de High School, através da Plataforma Online.
          </p>
        </div>

        <div>
          <p className="font-semibold mb-1">3. DURAÇÃO</p>
          <p className="pl-3">
            O programa tem duração média de 2 (dois) anos, com início na data de confirmação da matrícula.
          </p>
        </div>

        <div>
          <p className="font-semibold mb-1">4. OBRIGAÇÕES DA CHRONOS EDUCATION</p>
          <ul className="pl-6 list-[lower-alpha] space-y-0.5">
            <li>Disponibilizar acesso à Plataforma Online;</li>
            <li>Fornecer tutoria individual e suporte técnico;</li>
            <li>Enviar relatórios periódicos aos pais/responsáveis;</li>
            <li>Emitir o diploma americano de High School após a conclusão dos créditos necessários.</li>
          </ul>
        </div>

        <div>
          <p className="font-semibold mb-1">5. OBRIGAÇÕES DO CONTRATANTE</p>
          <ul className="pl-6 list-[lower-alpha] space-y-0.5">
            <li>Efetuar o pagamento das parcelas nos prazos estabelecidos;</li>
            <li>Garantir que o aluno dedique entre 1 a 2 horas semanais às atividades do programa;</li>
            <li>Manter os dados cadastrais atualizados.</li>
          </ul>
        </div>

        <div>
          <p className="font-semibold mb-1">6. VALORES E PAGAMENTO</p>
          <p className="pl-3">
            As condições de pagamento, incluindo taxa de matrícula e mensalidades, serão comunicadas 
            pela equipe Chronos Education após a confirmação da matrícula.
          </p>
        </div>

        <div>
          <p className="font-semibold mb-1">7. CANCELAMENTO</p>
          <p className="pl-3">
            O contratante poderá solicitar o cancelamento a qualquer momento, mediante comunicação por escrito. 
            Aplicam-se as condições de reembolso conforme os Termos e Condições disponíveis em chronoseducation.com/termos.
          </p>
        </div>

        <div>
          <p className="font-semibold mb-1">8. PROTEÇÃO DE DADOS (LGPD)</p>
          <p className="pl-3">
            Os dados pessoais recolhidos serão tratados em conformidade com a Lei Geral de Proteção de Dados 
            (Lei nº 13.709/2018), sendo utilizados exclusivamente para fins educacionais e administrativos.
          </p>
        </div>

        <div>
          <p className="font-semibold mb-1">9. FORO</p>
          <p className="pl-3">
            As partes elegem o foro da Comarca de São Paulo/SP para dirimir quaisquer questões decorrentes deste contrato.
          </p>
        </div>
      </div>

      {/* Acceptance checkbox */}
      <label className="flex items-start gap-3 cursor-pointer group mt-2">
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
