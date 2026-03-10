import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GraduationCap, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Enrollment {
  id: string;
  user_id: string;
  student_name: string;
  student_email: string | null;
  student_birth_date: string | null;
  student_address: string | null;
  student_school: string | null;
  student_graduation_year: number | null;
  referred_by_email: string | null;
  status: string;
  created_at: string;
  inscription_fee_cents: number;
  tuition_installment_cents: number;
  tuition_installments: number;
  summercamp_installment_cents: number;
  summercamp_installments: number;
}

const statuses = [
  "Aguarda assinatura de contrato",
  "Contrato assinado",
  "Em curso",
  "Concluído",
  "Cancelado",
];

const statusColors: Record<string, string> = {
  "Aguarda assinatura de contrato": "bg-amber-100 text-amber-800",
  "Contrato assinado": "bg-blue-100 text-blue-800",
  "Em curso": "bg-green-100 text-green-800",
  "Concluído": "bg-emerald-100 text-emerald-800",
  "Cancelado": "bg-red-100 text-red-800",
};

const AdminEnrollmentsPage = () => {
  const { toast } = useToast();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("enrollments")
      .select("*")
      .order("created_at", { ascending: false });
    setEnrollments((data as Enrollment[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("enrollments")
      .update({ status } as any)
      .eq("id", id);
    if (error) {
      toast({ title: "Erro ao atualizar estado", variant: "destructive" });
    } else {
      toast({ title: `Estado alterado para "${status}"` });
      setEnrollments((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status } : e))
      );
    }
  };

  const formatDate = (d: string) => {
    const dt = new Date(d);
    return `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}/${dt.getFullYear()}`;
  };

  const filtered = enrollments.filter(
    (e) =>
      e.student_name.toLowerCase().includes(search.toLowerCase()) ||
      (e.student_email?.toLowerCase() || "").includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Inscrições</h1>
          <p className="text-sm text-muted-foreground">{enrollments.length} inscrições registadas</p>
        </div>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Pesquisar por nome ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((e) => (
            <div
              key={e.id}
              className="bg-card rounded-xl border border-border p-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary shrink-0 mt-0.5">
                  <GraduationCap size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="font-semibold text-foreground">{e.student_name || "Sem nome"}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[e.status] || "bg-muted text-muted-foreground"}`}>
                      {e.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{e.student_email || "—"} · Inscrito em {formatDate(e.created_at)}</p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-xs">
                    <div>
                      <span className="text-muted-foreground">Escola:</span>{" "}
                      <span className="text-foreground font-medium">{e.student_school || "—"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Ano conclusão:</span>{" "}
                      <span className="text-foreground font-medium">{e.student_graduation_year || "—"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Indicação:</span>{" "}
                      <span className="text-foreground font-medium">{e.referred_by_email || "—"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Morada:</span>{" "}
                      <span className="text-foreground font-medium">{e.student_address || "—"}</span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 w-48">
                  <Select value={e.status} onValueChange={(v) => updateStatus(e.id, v)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((s) => (
                        <SelectItem key={s} value={s} className="text-xs">
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-8">Nenhuma inscrição encontrada.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminEnrollmentsPage;
