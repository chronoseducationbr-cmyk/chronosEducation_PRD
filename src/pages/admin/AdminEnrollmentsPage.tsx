import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GraduationCap, Search, Download, FileText, Info, ChevronDown, ChevronUp, CreditCard, BookOpen, CheckCircle2, Trash2 } from "lucide-react";

import { useNavigate, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { getClassification } from "@/lib/quizScoring";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Guardian {
  full_name: string;
  email: string | null;
  phone: string | null;
}

interface Enrollment {
  id: string;
  user_id: string;
  student_name: string;
  student_email: string | null;
  student_photo_url: string | null;
  student_birth_date: string | null;
  student_address: string | null;
  student_school: string | null;
  student_graduation_year: number | null;
  referred_by_email: string | null;
  status: string;
  created_at: string;
  inscription_fee_cents: number;
  inscription_due_date: string | null;
  tuition_installment_cents: number;
  tuition_installments: number;
  summercamp_installment_cents: number;
  summercamp_installments: number;
  contract_url: string | null;
  contract_sent_at: string | null;
  contract_signed_at: string | null;
  tuition_start_date: string | null;
  summercamp_start_date: string | null;
  quiz_test_id: string | null;
  guardian?: Guardian;
  has_installments?: boolean;
}

const statuses = [
  "Matrícula confirmada",
  "Pendente de assinatura de contrato",
  "Contrato assinado",
  "Em curso",
  "Concluído",
  "Cancelado",
];

const statusColors: Record<string, string> = {
  "Matrícula confirmada": "bg-blue-100 text-blue-800",
  "Pendente de assinatura de contrato": "bg-amber-100 text-amber-800",
  "Aguarda assinatura de contrato": "bg-amber-100 text-amber-800",
  "Contrato assinado": "bg-green-100 text-green-800",
  "Em curso": "bg-emerald-100 text-emerald-800",
  "Concluído": "bg-emerald-100 text-emerald-800",
  "Cancelado": "bg-red-100 text-red-800",
};

const AdminEnrollmentsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [quizResults, setQuizResults] = useState<Record<string, { correct_count: number; total_questions: number; score_points: number; max_points: number }>>({});
  const [testSlugMap, setTestSlugMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");


  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pendingStatusChange, setPendingStatusChange] = useState<{ id: string; studentName: string; from: string; to: string } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; studentName: string; contractUrl: string | null } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("enrollments")
      .select("*")
      .order("created_at", { ascending: false });
    const enrs = (data as Enrollment[]) || [];

    // Fetch guardian info from profiles
    const userIds = [...new Set(enrs.map((e) => e.user_id))];
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, phone")
        .in("user_id", userIds);
      const guardianMap: Record<string, Guardian> = {};
      (profiles || []).forEach((p: any) => {
        guardianMap[p.user_id] = { full_name: p.full_name, email: p.email, phone: p.phone };
      });
      enrs.forEach((e) => {
        e.guardian = guardianMap[e.user_id];
      });
    }

    // Fetch quiz results
    const { data: qr } = await supabase
      .from("quiz_results" as any)
      .select("enrollment_id, correct_count, total_questions, score_points, max_points");
    const resultsMap: Record<string, { correct_count: number; total_questions: number; score_points: number; max_points: number }> = {};
    if (qr) {
      (qr as any[]).forEach((r: any) => {
        resultsMap[r.enrollment_id] = { correct_count: r.correct_count, total_questions: r.total_questions, score_points: r.score_points || 0, max_points: r.max_points || 0 };
      });
    }
    setQuizResults(resultsMap);

    // Load test slug map
    const { data: tests } = await supabase.from("quiz_tests" as any).select("id, slug");
    const slugMap: Record<string, string> = {};
    if (tests) {
      (tests as any[]).forEach((t: any) => { slugMap[t.id] = t.slug; });
    }
    setTestSlugMap(slugMap);

    // Check which enrollments have installments
    const enrollmentIds = enrs.map((e) => e.id);
    if (enrollmentIds.length > 0) {
      const { data: instData } = await supabase
        .from("installments")
        .select("enrollment_id")
        .in("enrollment_id", enrollmentIds);
      const idsWithInst = new Set((instData || []).map((i: any) => i.enrollment_id));
      enrs.forEach((e) => { e.has_installments = idsWithInst.has(e.id); });
    }

    setEnrollments(enrs);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Auto-expand student from URL param
  useEffect(() => {
    const studentId = searchParams.get("student");
    if (studentId && !loading && enrollments.length > 0 && !expandedId) {
      setExpandedId(studentId);
    }
  }, [searchParams, loading, enrollments]);

  const confirmStatusChange = async () => {
    if (!pendingStatusChange) return;
    const { id, to: status } = pendingStatusChange;
    const updates: any = { status };
    if (status === "Contrato assinado") {
      updates.contract_signed_at = new Date().toISOString();
    }
    const { error } = await supabase
      .from("enrollments")
      .update(updates)
      .eq("id", id);
    if (error) {
      toast({ title: "Erro ao atualizar estado", variant: "destructive" });
    } else {
      toast({ title: `Estado alterado para "${status}"` });
      setEnrollments((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
      );
    }
    setPendingStatusChange(null);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    const { id, contractUrl } = pendingDelete;
    try {
      // Delete referrals (both directions)
      await supabase.from("referrals").delete().or(`referrer_enrollment_id.eq.${id},referred_enrollment_id.eq.${id}`);
      // Delete quiz results
      await supabase.from("quiz_results").delete().eq("enrollment_id", id);
      // Delete installments
      await supabase.from("installments").delete().eq("enrollment_id", id);
      // Delete contract file from storage if exists
      if (contractUrl) {
        try {
          const url = new URL(contractUrl);
          const pathMatch = url.pathname.match(/\/contracts\/(.+)$/);
          if (pathMatch) {
            await supabase.storage.from("contracts").remove([pathMatch[1]]);
          }
        } catch (_) { /* ignore storage errors */ }
      }
      // Delete enrollment
      const { error } = await supabase.from("enrollments").delete().eq("id", id);
      if (error) throw error;
      toast({ title: `Aluno "${pendingDelete.studentName}" apagado com sucesso` });
      setEnrollments((prev) => prev.filter((e) => e.id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch (err: any) {
      toast({ title: "Erro ao apagar aluno", description: err.message, variant: "destructive" });
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  };



  const formatDate = (d: string | null) => {
    if (!d) return "—";
    const dt = new Date(d);
    return `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}/${dt.getFullYear()}`;
  };

  const filtered = enrollments
    .filter(
      (e) =>
        e.student_name.toLowerCase().includes(search.toLowerCase()) ||
        (e.student_email?.toLowerCase() || "").includes(search.toLowerCase())
    )
    .sort((a, b) => a.student_name.localeCompare(b.student_name, "pt"));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Matrículas</h1>
          <p className="text-sm text-muted-foreground">{enrollments.length} matrículas registradas</p>
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
          {filtered.map((e) => {
            const isExpanded = expandedId === e.id;
            return (
              <div
                key={e.id}
                className={`bg-card rounded-xl border-2 overflow-hidden transition-colors ${isExpanded ? "border-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.2)]" : "border-border"}`}
              >
                {/* Collapsed row: name + status badge + select + expand */}
                <div
                  className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : e.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
                      <GraduationCap size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-foreground truncate">{e.student_name || "Sem nome"}</p>
                        {(() => {
                          const qr = quizResults[e.id];
                          if (!qr) {
                            return (
                              <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground flex items-center gap-1">
                                <BookOpen size={10} />
                                —
                              </span>
                            );
                          }
                          const cls = getClassification(qr.score_points, e.quiz_test_id ? testSlugMap[e.quiz_test_id] : undefined);
                          const isLow = ["A0", "A1", "A2"].includes(cls.level);
                          return (
                            <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${isLow ? "bg-destructive/10 text-destructive" : "bg-green-100 text-green-700"}`}>
                              <BookOpen size={10} />
                              {cls.level}
                            </span>
                          );
                        })()}
                        {e.guardian && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <button className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted hover:bg-muted-foreground/20 transition-colors" title="Dados do responsável">
                                <Info size={12} className="text-muted-foreground" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-3" side="right">
                              <p className="text-xs font-semibold text-muted-foreground mb-2">Responsável</p>
                              <div className="space-y-1.5 text-sm">
                                <div>
                                  <span className="text-muted-foreground text-xs">Nome:</span>{" "}
                                  <span className="text-foreground font-medium">{e.guardian.full_name || "—"}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground text-xs">Email:</span>{" "}
                                  <span className="text-foreground font-medium">{e.guardian.email || "—"}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground text-xs">Telefone:</span>{" "}
                                  <span className="text-foreground font-medium">{e.guardian.phone || "—"}</span>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{e.student_email || "—"}</p>
                    </div>
                    <div className="sm:hidden shrink-0">
                      {isExpanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                    </div>
                  </div>
                  <div className="flex items-start gap-4 text-[11px] pl-[52px] sm:pl-0">
                    <div>
                      <p className="text-muted-foreground">Matrícula</p>
                      <p className="font-medium text-foreground">{e.inscription_fee_cents > 0 ? `$${(e.inscription_fee_cents / 100).toFixed(2).replace('.', ',')}` : "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Plataforma</p>
                      <p className="font-medium text-foreground">{e.tuition_installment_cents > 0 ? `${e.tuition_installments}x $${(e.tuition_installment_cents / 100).toFixed(2).replace('.', ',')}` : <span className="italic text-muted-foreground">—</span>}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Summer</p>
                      <p className="font-medium text-foreground">{e.summercamp_installment_cents > 0 ? `${e.summercamp_installments}x $${(e.summercamp_installment_cents / 100).toFixed(2).replace('.', ',')}` : <span className="italic text-muted-foreground">—</span>}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pl-[52px] sm:pl-0">
                    <span className={`shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full ${statusColors[e.status] || "bg-muted text-muted-foreground"}`}>
                      {e.status}
                    </span>
                    <button
                      onClick={(ev) => { ev.stopPropagation(); navigate(`/admin/pagamentos?student=${e.id}`); }}
                      className="shrink-0 p-1 rounded hover:bg-muted transition-colors"
                      title="Ver pagamentos"
                    >
                      <CreditCard size={16} className="text-muted-foreground" />
                    </button>
                    <div className="hidden sm:block">
                      {isExpanded ? <ChevronUp size={16} className="text-muted-foreground shrink-0" /> : <ChevronDown size={16} className="text-muted-foreground shrink-0" />}
                    </div>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-border space-y-4 overflow-hidden">
                    {/* Dados do Aluno */}
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Dados do Aluno</p>
                      <div className="flex gap-4">
                        {e.student_photo_url && (
                          <img
                            src={e.student_photo_url}
                            alt={`Foto de ${e.student_name}`}
                            className="w-16 h-16 rounded-full object-cover border-2 border-secondary/30 shrink-0"
                          />
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 text-sm flex-1 min-w-0">
                        <div>
                          <p className="text-muted-foreground text-xs">Email</p>
                          <p className="text-foreground font-medium break-all">{e.student_email || "—"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Data de nascimento</p>
                          <p className="text-foreground font-medium">{e.student_birth_date ? formatDate(e.student_birth_date) : "—"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Escola</p>
                          <p className="text-foreground font-medium">{e.student_school || "—"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Ano de conclusão</p>
                          <p className="text-foreground font-medium">{e.student_graduation_year || "—"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Endereço</p>
                          <p className="text-foreground font-medium break-words">{e.student_address || "—"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Indicação</p>
                          <p className="text-foreground font-medium break-all">{e.referred_by_email || "—"}</p>
                        </div>
                      </div>
                      </div>
                    </div>

                    {/* Dados do Responsável */}
                    {e.guardian && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Responsável (Pai/Mãe)</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                          <div>
                            <p className="text-muted-foreground text-xs">Nome</p>
                            <p className="text-foreground font-medium">{e.guardian.full_name || "—"}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Email</p>
                            <p className="text-foreground font-medium break-all">{e.guardian.email || "—"}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Telefone</p>
                            <p className="text-foreground font-medium">{e.guardian.phone || "—"}</p>
                      </div>
                      </div>
                      </div>
                    )}

                    {/* Matrícula */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Matrícula</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">Data de matrícula</p>
                          <p className="text-foreground font-medium">{formatDate(e.created_at)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Alterar estado</p>
                          <div className="mt-1">
                            <Select
                              value={e.status}
                              onValueChange={(v) => {
                                if (v !== e.status) {
                                  setPendingStatusChange({ id: e.id, studentName: e.student_name, from: e.status, to: v });
                                }
                              }}
                            >
                              <SelectTrigger className="h-8 text-xs w-full max-w-[224px]">
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
                    </div>

                    {/* Contrato */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Contrato</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">Enviado em</p>
                          <p className="text-foreground font-medium">{formatDate(e.contract_sent_at)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Assinado em</p>
                          <p className="text-foreground font-medium">{formatDate(e.contract_signed_at)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Documento</p>
                          <div className="flex items-center gap-2 mt-0.5">
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
                                className="inline-flex items-center gap-1 text-secondary hover:text-secondary/80 font-medium text-sm"
                              >
                                <Download size={14} />
                                Download contrato
                              </button>
                            ) : (
                              <span className="text-muted-foreground inline-flex items-center gap-1 text-sm italic">
                                <FileText size={14} />
                                Sem contrato
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                     {/* Prova de Inglês */}
                     <div>
                       <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Prova de Inglês</p>
                      {quizResults[e.id] ? (
                        <div className="flex items-center gap-2 text-sm">
                          {(() => {
                            const cls = getClassification(quizResults[e.id].score_points, e.quiz_test_id ? testSlugMap[e.quiz_test_id] : undefined);
                            const levelDescriptions: Record<string, string> = {
                              "A0": "Os alunos neste nível estão começando a aprender as suas primeiras palavras.",
                              "A1": "Os alunos que atingem o nível A1 conseguem comunicar usando expressões do dia a dia familiares e frases muito básicas.",
                              "A2": "Os alunos que atingem o nível A2 conseguem comunicar usando expressões frequentes em situações do dia a dia.",
                              "B1": "Os alunos que atingem o nível B1 conseguem compreender informação sobre temas familiares. Conseguem comunicar na maioria das situações enquanto viajam para países de língua inglesa.",
                              "B2": "Os alunos que atingem o nível B2 conseguem compreender as principais ideias de textos complexos. Conseguem interagir com alguma fluência e comunicar facilmente.",
                              "C1": "Os alunos que atingem o nível C1 conseguem compreender uma vasta gama de textos longos e complexos.",
                              "C2": "Os alunos que atingem o nível C2 conseguem facilmente compreender quase tudo o que ouvem ou escrevem. Conseguem expressar-se de forma fluente e espontânea com precisão em situações complexas.",
                            };
                            return (
                              <>
                                <CheckCircle2 size={16} className="text-secondary" />
                                <span className="text-foreground font-semibold">
                                  {cls.level}{cls.label ? ` (${cls.label})` : ""}
                                </span>
                                {levelDescriptions[cls.level] && (
                                  <TooltipProvider delayDuration={200}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
                                          <Info size={14} />
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
                                        {levelDescriptions[cls.level]}
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                                <span className="text-muted-foreground text-xs ml-1">
                                  {quizResults[e.id].score_points}/{quizResults[e.id].max_points} pts · {quizResults[e.id].correct_count}/{quizResults[e.id].total_questions} certas
                                </span>
                              </>
                            );
                          })()}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm italic">Prova não realizada</span>
                      )}
                    </div>

                    {/* Apagar aluno */}
                    <div className="pt-2 border-t border-border flex justify-end">
                      <Button
                        variant="destructive"
                        size="sm"
                        className="gap-1.5"
                        onClick={(ev) => { ev.stopPropagation(); setPendingDelete({ id: e.id, studentName: e.student_name, contractUrl: e.contract_url }); }}
                      >
                        <Trash2 size={14} />
                        Apagar aluno
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-8">Nenhuma inscrição encontrada.</p>
          )}
        </div>
      )}

      <AlertDialog open={!!pendingStatusChange} onOpenChange={(open) => { if (!open) setPendingStatusChange(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar alteração de estado</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja alterar o estado de <span className="font-semibold">{pendingStatusChange?.studentName}</span> de{" "}
              <span className="font-semibold">"{pendingStatusChange?.from}"</span> para{" "}
              <span className="font-semibold">"{pendingStatusChange?.to}"</span>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminEnrollmentsPage;
