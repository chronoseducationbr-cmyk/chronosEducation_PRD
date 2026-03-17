import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Clock, Plus, ChevronDown, ChevronUp, FileText, Download, BookOpen, Check, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getClassification } from "@/lib/quizScoring";

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
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [quizResults, setQuizResults] = useState<Record<string, { correct_count: number; total_questions: number; score_points: number; max_points: number }>>({});
  const [activeTestIds, setActiveTestIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
          .select("id")
          .eq("is_active", true),
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
      if (activeTests) {
        (activeTests as any[]).forEach((t: any) => idsSet.add(t.id));
      }
      setActiveTestIds(idsSet);

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
                     {/* Contract section - always visible */}
                     <div className="mt-3 pt-3 border-t border-border">
                       <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                         <FileText size={14} className="text-secondary" />
                         Contrato
                       </p>
                       <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                         <Detail label="Enviado em" value={e.contract_sent_at ? formatDate(e.contract_sent_at) : ""} />
                         <Detail label="Assinado em" value={e.contract_signed_at ? formatDate(e.contract_signed_at) : ""} />
                         <div>
                           <p className="text-muted-foreground text-xs">Documento</p>
                            {e.contract_url ? (
                              <button
                                onClick={async () => {
                                  try {
                                    const res = await fetch(e.contract_url!);
                                    const blob = await res.blob();
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement("a");
                                    a.href = url;
                                    a.download = `contrato-${e.student_name.replace(/\s+/g, "-").toLowerCase()}.pdf`;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    URL.revokeObjectURL(url);
                                  } catch (err) {
                                    console.error("Download error:", err);
                                  }
                                }}
                                className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 font-medium text-sm mt-0.5"
                              >
                                <Download size={14} className="text-secondary" />
                                Descarregar contrato
                              </button>
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
                          <Detail label="Matrícula" value={`$${(e.inscription_fee_cents / 100).toFixed(2)}`} />
                          <Detail label={`Plataforma Online (${e.tuition_installments}x)`} value={e.tuition_installment_cents > 0 ? `$${(e.tuition_installment_cents / 100).toFixed(2)}` : ""} emptyText="falta associar" />
                          <Detail label={`Summer Camp (${e.summercamp_installments}x)`} value={e.summercamp_installment_cents > 0 ? `$${(e.summercamp_installment_cents / 100).toFixed(2)}` : ""} emptyText="falta associar" />
                        </div>
                      </div>
                     )}
                     {/* Only show test section if enrollment has an active test */}
                     {e.quiz_test_id && activeTestIds.has(e.quiz_test_id) && (
                     <div className="mt-3 pt-3 border-t border-border">
                       <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                         <BookOpen size={14} className="text-secondary" />
                         Teste de Inglês
                       </p>
                       {quizResults[e.id] ? (() => {
                          const cls = getClassification(quizResults[e.id].score_points);
                          return (
                          <div className="flex flex-col gap-1 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-foreground font-semibold">
                                {cls.level}{cls.label ? ` (${cls.label})` : ""}
                              </span>
                              <span className="text-secondary font-semibold inline-flex items-center gap-1">Realizado <Check size={14} /></span>
                            </div>
                            <span className="text-muted-foreground text-xs">
                              {quizResults[e.id].score_points}/{quizResults[e.id].max_points} pontos · {quizResults[e.id].correct_count}/{quizResults[e.id].total_questions} respostas certas
                            </span>
                          </div>
                          );
                       })() : (
                          <button
                            onClick={() => navigate(`/teste-ingles?enrollment=${e.id}`)}
                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#F9B91D] hover:text-[#F9B91D]/80 transition-colors"
                          >
                            Realizar teste de inglês
                            <ExternalLink size={14} className="text-[#042d44]" />
                          </button>
                       )}
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
