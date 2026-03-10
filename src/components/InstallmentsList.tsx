import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Download, FileText, CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface Installment {
  id: string;
  type: string;
  installment_number: number;
  due_date: string | null;
  paid_at: string | null;
  status: string;
  boleto_url: string | null;
  amount_cents: number;
  discount_percent: number;
}

interface Props {
  enrollmentId: string;
}

const typeLabels: Record<string, string> = {
  inscription_fee: "Inscrição",
  tuition: "Aulas Online",
  summercamp: "Summer Camp",
};

const statusConfig: Record<string, { label: string; icon: typeof Clock; bg: string; text: string }> = {
  pending: { label: "Pendente", icon: Clock, bg: "bg-amber-100", text: "text-amber-800" },
  paid: { label: "Pago", icon: CheckCircle2, bg: "bg-green-100", text: "text-green-800" },
  overdue: { label: "Em atraso", icon: AlertCircle, bg: "bg-red-100", text: "text-red-800" },
};

const InstallmentsList = ({ enrollmentId }: Props) => {
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("installments")
        .select("*")
        .eq("enrollment_id", enrollmentId)
        .order("installment_number", { ascending: true });
      setInstallments((data as Installment[]) || []);
      setLoading(false);
    };
    load();
  }, [enrollmentId]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  };

  const handleDownload = (url: string) => {
    window.open(url, "_blank");
  };

  if (loading) {
    return <div className="animate-pulse h-16 bg-muted rounded-lg mt-3" />;
  }

  if (installments.length === 0) {
    return null;
  }

  const typeOrder = ["inscription_fee", "tuition", "summercamp"];

  // Group by type
  const grouped = installments.reduce<Record<string, Installment[]>>((acc, inst) => {
    if (!acc[inst.type]) acc[inst.type] = [];
    acc[inst.type].push(inst);
    return acc;
  }, {});

  const sortedTypes = Object.keys(grouped).sort(
    (a, b) => (typeOrder.indexOf(a) === -1 ? 99 : typeOrder.indexOf(a)) - (typeOrder.indexOf(b) === -1 ? 99 : typeOrder.indexOf(b))
  );

  return (
    <div className="bg-muted/40 rounded-lg p-4">
      <h3 className="text-sm font-bold text-foreground mb-4 tracking-wide uppercase">
        Prestações
      </h3>

      {sortedTypes.map((type) => {
        const items = grouped[type];
        return (
          <div key={type} className="mb-5 last:mb-0">
          <p className="text-xs font-semibold text-foreground mb-2 border-b border-border pb-1.5">
            {typeLabels[type] || type}
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-1.5 pr-2 text-muted-foreground font-medium">#</th>
                  <th className="text-left py-1.5 pr-2 text-muted-foreground font-medium">Valor</th>
                  <th className="text-left py-1.5 pr-2 text-muted-foreground font-medium">Vencimento</th>
                  <th className="text-left py-1.5 pr-2 text-muted-foreground font-medium">Pago em</th>
                  <th className="text-left py-1.5 pr-2 text-muted-foreground font-medium">Estado</th>
                  <th className="text-left py-1.5 text-muted-foreground font-medium">Boleto</th>
                </tr>
              </thead>
              <tbody>
                {items.map((inst) => {
                  const cfg = statusConfig[inst.status] || statusConfig.pending;
                  const StatusIcon = cfg.icon;

                  return (
                    <tr key={inst.id} className="border-b border-border/50 last:border-0">
                      <td className="py-2 pr-2 text-foreground font-medium">
                        {inst.installment_number}
                      </td>
                      <td className="py-2 pr-2 text-foreground font-medium">
                        {inst.amount_cents > 0 ? `$${(inst.amount_cents / 100).toFixed(0)}` : "—"}
                      </td>
                      <td className="py-2 pr-2 text-foreground">
                        {formatDate(inst.due_date)}
                      </td>
                      <td className="py-2 pr-2 text-foreground">
                        {formatDate(inst.paid_at)}
                      </td>
                      <td className="py-2 pr-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.bg} ${cfg.text}`}>
                          <StatusIcon size={10} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="py-2">
                        {inst.boleto_url ? (
                          <button
                            onClick={() => handleDownload(inst.boleto_url!)}
                            className="inline-flex items-center gap-1 text-secondary hover:text-secondary/80 transition-colors font-medium"
                            title="Descarregar boleto"
                          >
                            <Download size={12} />
                            <span>Download</span>
                          </button>
                        ) : (
                          <span className="text-muted-foreground flex items-center gap-1">
                            <FileText size={12} />
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        );
      })}
    </div>
  );
};

export default InstallmentsList;
