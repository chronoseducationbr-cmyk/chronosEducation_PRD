import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Plus, ChevronDown, ChevronUp } from "lucide-react";
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
  student_photo_url: string | null;
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
  quiz_test_id: string | null;
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
  const { toast } = useToast();
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [quizResults, setQuizResults] = useState<Record<string, { correct_count: number; total_questions: number; score_points: number; max_points: number }>>({});
  const [activeTestIds, setActiveTestIds] = useState<Set<string>>(new Set());
  const [testSlugMap, setTestSlugMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [acceptingContract, setAcceptingContract] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);

      const [{ data }, { data: qr }, { data: activeTests }] = await Promise.all([
        supabase
          .from("enrollments")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("quiz_results" as any)
          .select("enrollment_id, correct_count, total_questions, score_points, max_points")
          .eq("user_id", user.id),
        supabase
          .from("quiz_tests" as any)
          .select("id, slug, is_active"),
      ]);

      setEnrollments((data as Enrollment[]) || []);

      const resultsMap: Record<string, { correct_count: number; total_questions: number; score_points: number; max_points: number }> = {};
      if (qr) {
        (qr as any[]).forEach((r: any) => {
          resultsMap[r.enrollment_id] = { correct_count: r.correct_count, total_questions: r.total_questions, score_points: r.score_points || 0, max_points: r.max_points || 0 };
        });
      }
      setQuizResults(resultsMap);

      // Build active test IDs set
      const idsSet = new Set<string>();
      const slugMap: Record<string, string> = {};
      if (activeTests) {
        (activeTests as any[]).forEach((t: any) => {
          if (t.is_active) idsSet.add(t.id);
          slugMap[t.id] = t.slug;
        });
      }
      setActiveTestIds(idsSet);
      setTestSlugMap(slugMap);

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
          className="flex items-center gap-1.5 text-sm font-semibold text-secondary hover:text-secondary/80 transition-colors"
        >
          <Plus size={16} />
          Nova Matrícula
        </button>
      </div>

      {enrollments.length === 0 ? (
        <div className="bg-card rounded-xl border border-border shadow-card p-8 text-center">
          <GraduationCap size={40} className="mx-auto text-secondary mb-3" />
          <p className="text-muted-foreground mb-4">Ainda não tem matrículas registradas.</p>
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
                    {e.student_photo_url ? (
                      <img
                        src={e.student_photo_url}
                        alt={e.student_name}
                        className="w-10 h-10 rounded-full object-cover border-2 border-secondary/30 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
                        <GraduationCap size={20} />
                      </div>
                    )}
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
                       <Detail label="Endereço" value={e.student_address} />
                       <Detail label="Escola" value={e.student_school} />
                       <Detail label="Ano de conclusão" value={e.student_graduation_year?.toString() || ""} />
                       <Detail label="Indicado por" value={e.referred_by_email} />
                     </div>
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

const Detail = ({ label, value, emptyText }: { label: string; value: string; emptyText?: string }) => (
  <div>
    <p className="text-muted-foreground text-xs">{label}</p>
    {value ? (
      <p className="text-foreground font-medium">{value}</p>
    ) : (
      <p className="text-muted-foreground font-medium italic">{emptyText || "—"}</p>
    )}
  </div>
);

export default EnrollmentsList;
