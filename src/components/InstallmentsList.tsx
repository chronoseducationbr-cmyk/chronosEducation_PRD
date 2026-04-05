import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Download, FileText, CheckCircle2, Clock, AlertCircle, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";

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
  final_amount_brl_cents: number | null;
}

interface Props {
  enrollmentId: string;
}

const typeLabels: Record<string, string> = {
  inscription_fee: "Matrícula",
  tuition: "Plataforma Online",
  summercamp: "Summer Camp",
};

const statusConfig: Record<string, { label: string; icon: typeof Clock; bg: string; text: string }> = {
  pending: { label: "Pendente", icon: Clock, bg: "bg-gray-100", text: "text-gray-600" },
  paid: { label: "Pago", icon: CheckCircle2, bg: "bg-green-100", text: "text-green-800" },
  overdue: { label: "Em atraso", icon: AlertCircle, bg: "bg-red-100", text: "text-red-800" },
};

const TypeSection = ({
  type,
  items,
  allPaid,
  formatDate,
  handleDownload,
}: {
  type: string;
  items: Installment[];
  allPaid: boolean;
  formatDate: (d: string | null) => string;
  handleDownload: (url: string) => void;
}) => {
  const [open, setOpen] = useState(!allPaid);

  return (
    <div className="mb-8 last:mb-0 bg-card rounded-lg border border-border overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors"
      >
        <span className="text-sm font-bold text-foreground uppercase tracking-wide flex items-center gap-1">
          {items.some(i => i.status === "overdue") && <AlertTriangle size={14} className="shrink-0" style={{ color: "#F9B91D" }} />}
          {typeLabels[type] || type}
        </span>
        <span className="flex items-center gap-2">
          {allPaid && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-800">
              <CheckCircle2 size={10} />
              Pago
            </span>
          )}
          {open ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-1.5 pr-2 text-muted-foreground font-medium">#</th>
                <th className="text-left py-1.5 pr-2 text-muted-foreground font-medium">Valor ($)</th>
                <th className="text-left py-1.5 pr-2 text-muted-foreground font-medium">Valor Final (R$)</th>
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
                      {(() => {
                        if (inst.amount_cents <= 0) return "—";
                        const disc = inst.discount_percent || 0;
                        if (disc > 0) {
                          const finalCents = Math.round(inst.amount_cents * (1 - disc / 100));
                          return (
                            <span className="flex flex-col leading-tight">
                              <span className="line-through text-muted-foreground text-[10px]">${(inst.amount_cents / 100).toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              <span className="text-green-700">${(finalCents / 100).toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[10px] text-muted-foreground font-normal">(-{disc}%)</span></span>
                            </span>
                          );
                        }
                        return `$${(inst.amount_cents / 100).toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                      })()}
                    </td>
                    <td className="py-2 pr-2 text-foreground font-medium">
                      {inst.final_amount_brl_cents != null
                        ? `R$${(inst.final_amount_brl_cents / 100).toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : "—"}
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
      )}
    </div>
  );
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

  const grouped = installments.reduce<Record<string, Installment[]>>((acc, inst) => {
    if (!acc[inst.type]) acc[inst.type] = [];
    acc[inst.type].push(inst);
    return acc;
  }, {});

  const sortedTypes = Object.keys(grouped).sort(
    (a, b) => (typeOrder.indexOf(a) === -1 ? 99 : typeOrder.indexOf(a)) - (typeOrder.indexOf(b) === -1 ? 99 : typeOrder.indexOf(b))
  );

  return (
    <div className="space-y-2">
      {sortedTypes.map((type) => {
        const items = grouped[type];
        const allPaid = items.every((i) => i.status === "paid");

        return (
          <TypeSection key={type} type={type} items={items} allPaid={allPaid} formatDate={formatDate} handleDownload={handleDownload} />
        );
      })}
    </div>
  );
};

export default InstallmentsList;
