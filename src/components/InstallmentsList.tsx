import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Download, FileText, CheckCircle2, Clock, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";

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
        const allPaid = items.every((i) => i.status === "paid");

        return (
          <TypeSection key={type} type={type} items={items} allPaid={allPaid} formatDate={formatDate} handleDownload={handleDownload} />
        );
      })}
      })}
    </div>
  );
};

export default InstallmentsList;
