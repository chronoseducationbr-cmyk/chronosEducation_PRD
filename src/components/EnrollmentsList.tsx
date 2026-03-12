import { useState, useEffect } from "react";
import { GraduationCap, Clock, Plus, ChevronDown, ChevronUp, FileText, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Enrollment {
  id: string;
  student_name: string;
  student_email: string;
  student_birth_date: string | null;
  student_address: string;
  student_school: string;
  student_graduation_year: number | null;
  referred_by_email: string;
  status: string;
  created_at: string;
  inscription_fee_cents: number;
  tuition_installment_cents: number;
  tuition_installments: number;
  summercamp_installment_cents: number;
  summercamp_installments: number;
  contract_url: string | null;
  contract_sent_at: string | null;
  contract_signed_at: string | null;
}

interface Props {
  onNewEnrollment: () => void;
  refreshKey: number;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  "Aguarda assinatura de contrato": { bg: "bg-amber-100", text: "text-amber-800" },
  "Contrato assinado": { bg: "bg-blue-100", text: "text-blue-800" },
  "Em curso": { bg: "bg-green-100", text: "text-green-800" },
  "Concluído": { bg: "bg-emerald-100", text: "text-emerald-800" },
  "Cancelado": { bg: "bg-red-100", text: "text-red-800" },
};

const EnrollmentsList = ({ onNewEnrollment, refreshKey }: Props) => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);
      const { data } = await supabase
        .from("enrollments")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setEnrollments((data as Enrollment[]) || []);
      setLoading(false);
    };
    load();
  }, [user, refreshKey]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  };

  if (loading) {
    return <div className="animate-pulse h-32 bg-muted rounded-xl" />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-heading text-lg font-semibold text-foreground">
          Matrículas <span className="text-[#f9b41f]">({enrollments.length})</span>
        </h2>
        <button
          onClick={onNewEnrollment}
          className="flex items-center gap-1.5 text-sm font-semibold text-[#25D366] hover:text-[#25D366]/80 transition-colors"
        >
          <Plus size={16} />
          Nova Matrícula
        </button>
      </div>

      {enrollments.length === 0 ? (
        <div className="bg-card rounded-xl border border-border shadow-card p-8 text-center">
          <GraduationCap size={40} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground mb-4">Ainda não tem matrículas registadas.</p>
          <button
            onClick={onNewEnrollment}
            className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground font-semibold py-2.5 px-5 rounded-lg hover:opacity-90 transition-opacity text-sm"
          >
            <Plus size={16} />
            Inscrever Aluno
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {enrollments.map((e) => {
            const colors = statusColors[e.status] || { bg: "bg-muted", text: "text-muted-foreground" };
            const isExpanded = expandedId === e.id;

            return (
              <div
                key={e.id}
                className="bg-card rounded-xl border border-border shadow-card overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : e.id)}
                  className="w-full flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-4 text-left hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
                      <GraduationCap size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">
                        {e.student_name || "Sem nome"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Inscrito em {formatDate(e.created_at)}
                      </p>
                    </div>
                    <div className="sm:hidden shrink-0">
                      {isExpanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pl-[52px] sm:pl-0">
                    <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${colors.bg} ${colors.text}`}>
                      {e.status}
                    </span>
                    <div className="hidden sm:block">
                      {isExpanded ? <ChevronUp size={16} className="text-muted-foreground shrink-0" /> : <ChevronDown size={16} className="text-muted-foreground shrink-0" />}
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-border">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 text-sm">
                       <Detail label="Email" value={e.student_email} />
                       <Detail label="Data de nascimento" value={e.student_birth_date || ""} />
                       <Detail label="Morada" value={e.student_address} />
                       <Detail label="Escola" value={e.student_school} />
                       <Detail label="Ano de conclusão" value={e.student_graduation_year?.toString() || ""} />
                       <Detail label="Indicado por" value={e.referred_by_email} />
                     </div>
                     {/* Contract section - always visible */}
                     <div className="mt-3 pt-3 border-t border-border">
                       <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                         <FileText size={14} />
                         Contrato
                       </p>
                       <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                         <Detail label="Enviado em" value={e.contract_sent_at ? formatDate(e.contract_sent_at) : ""} />
                         <Detail label="Assinado em" value={e.contract_signed_at ? formatDate(e.contract_signed_at) : ""} />
                         <div>
                           <p className="text-muted-foreground text-xs">Documento</p>
                           {e.contract_url ? (
                             <a
                               href={e.contract_url}
                               target="_blank"
                               rel="noopener noreferrer"
                               className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 font-medium text-sm mt-0.5"
                             >
                               <Download size={14} />
                               Descarregar contrato
                             </a>
                           ) : (
                             <p className="text-foreground font-medium text-xs mt-0.5 italic text-muted-foreground">Ainda não disponível</p>
                           )}
                         </div>
                       </div>
                     </div>
                     {(e.inscription_fee_cents > 0 || e.tuition_installment_cents > 0 || e.summercamp_installment_cents > 0) && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">Valores</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                          <Detail label="Inscrição" value={`$${(e.inscription_fee_cents / 100).toFixed(0)}`} />
                          <Detail label={`Aulas Online (${e.tuition_installments}x)`} value={`$${(e.tuition_installment_cents / 100).toFixed(0)}`} />
                          <Detail label={`Summer Camp (${e.summercamp_installments}x)`} value={`$${(e.summercamp_installment_cents / 100).toFixed(0)}`} />
                        </div>
                      </div>
                     )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const Detail = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-muted-foreground text-xs">{label}</p>
    <p className="text-foreground font-medium">{value || "—"}</p>
  </div>
);

export default EnrollmentsList;
