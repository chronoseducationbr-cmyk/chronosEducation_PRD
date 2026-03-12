import { useState, useEffect } from "react";
import { FileText, Download, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  onAcceptChange: (accepted: boolean) => void;
}

const ContractSignatureSection = ({ onAcceptChange }: Props) => {
  const [accepted, setAccepted] = useState(false);
  const [contractUrl, setContractUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadContract = async () => {
      // Look for a standard contract template in the contracts bucket
      const { data } = await supabase.storage
        .from("contracts")
        .list("templates", { limit: 1, sortBy: { column: "created_at", order: "desc" } });

      if (data && data.length > 0) {
        const { data: urlData } = supabase.storage
          .from("contracts")
          .getPublicUrl(`templates/${data[0].name}`);
        setContractUrl(urlData.publicUrl);
      }
      setLoading(false);
    };
    loadContract();
  }, []);

  const handleToggle = () => {
    const next = !accepted;
    setAccepted(next);
    onAcceptChange(next);
  };

  return (
    <div className="bg-card rounded-xl border border-border shadow-card p-6 space-y-4">
      <h2 className="font-heading text-lg font-semibold text-foreground flex items-center gap-2">
        <FileText size={20} className="text-secondary" />
        Assinatura do Contrato
      </h2>

      <p className="text-sm text-muted-foreground">
        Antes de confirmar a matrícula, é necessário ler e aceitar o contrato do programa Dual Diploma.
      </p>

      {loading ? (
        <div className="animate-pulse h-10 bg-muted rounded-lg" />
      ) : contractUrl ? (
        <a
          href={contractUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-primary/10 text-primary font-medium text-sm px-4 py-2.5 rounded-lg hover:bg-primary/20 transition-colors"
        >
          <Download size={16} />
          Descarregar contrato (PDF)
        </a>
      ) : (
        <p className="text-sm text-muted-foreground italic">
          O contrato ainda não está disponível. Contacte a equipa Chronos.
        </p>
      )}

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
