import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, BookOpen, Check, ExternalLink, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getClassification } from "@/lib/quizScoring";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Enrollment {
  id: string;
  student_name: string;
  student_photo_url: string | null;
  quiz_test_id: string | null;
}

interface Props {
  refreshKey: number;
}

const levelDescriptions: Record<string, string> = {
  "A0": "Os alunos neste nível estão começando a aprender as suas primeiras palavras.",
  "A1": "Os alunos que atingem o nível A1 conseguem comunicar usando expressões do dia a dia familiares e frases muito básicas.",
  "A2": "Os alunos que atingem o nível A2 conseguem comunicar usando expressões frequentes em situações do dia a dia.",
  "B1": "Os alunos que atingem o nível B1 conseguem compreender informação sobre temas familiares. Conseguem comunicar na maioria das situações enquanto viajam para países de língua inglesa.",
  "B2": "Os alunos que atingem o nível B2 conseguem compreender as principais ideias de textos complexos. Conseguem interagir com alguma fluência e comunicar facilmente.",
  "C1": "Os alunos que atingem o nível C1 conseguem compreender uma vasta gama de textos longos e complexos.",
  "C2": "Os alunos que atingem o nível C2 conseguem facilmente compreender quase tudo o que ouvem ou escrevem. Conseguem expressar-se de forma fluente e espontânea com precisão em situações complexas.",
};

const QuizResultsList = ({ refreshKey }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [quizResults, setQuizResults] = useState<Record<string, { score_points: number; max_points: number }>>({});
  const [activeTestIds, setActiveTestIds] = useState<Set<string>>(new Set());
  const [testSlugMap, setTestSlugMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);

      const [{ data }, { data: qr }, { data: activeTests }] = await Promise.all([
        supabase
          .from("enrollments")
          .select("id, student_name, student_photo_url, quiz_test_id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("quiz_results" as any)
          .select("enrollment_id, score_points, max_points")
          .eq("user_id", user.id),
        supabase
          .from("quiz_tests" as any)
          .select("id, slug, is_active"),
      ]);

      setEnrollments((data as Enrollment[]) || []);

      const resultsMap: Record<string, { score_points: number; max_points: number }> = {};
      if (qr) {
        (qr as any[]).forEach((r: any) => {
          resultsMap[r.enrollment_id] = { score_points: r.score_points || 0, max_points: r.max_points || 0 };
        });
      }
      setQuizResults(resultsMap);

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

  if (loading) {
    return <div className="animate-pulse h-32 bg-muted rounded-xl" />;
  }

  // Filter enrollments that have a result OR an active test
  const visibleEnrollments = enrollments.filter(e => {
    const hasResult = !!quizResults[e.id];
    const testActive = e.quiz_test_id && activeTestIds.has(e.quiz_test_id);
    return hasResult || testActive;
  });

  if (visibleEnrollments.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border shadow-card p-8 text-center">
        <BookOpen size={40} className="mx-auto text-secondary mb-3" />
        <p className="text-muted-foreground">Nenhuma prova de inglês disponível de momento.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-heading text-lg font-semibold text-foreground mb-3">
        Prova de Inglês <span className="text-[#f9b41f]">({visibleEnrollments.length})</span>
      </h2>
      <div className="space-y-3">
        {visibleEnrollments.map((e) => {
          const hasResult = !!quizResults[e.id];
          const cls = hasResult
            ? getClassification(quizResults[e.id].score_points, e.quiz_test_id ? testSlugMap[e.quiz_test_id] : undefined)
            : null;
          const hiddenLevel = cls && ["A0", "A1", "A2"].includes(cls.level);

          return (
            <div key={e.id} className="bg-card rounded-xl border border-border shadow-card p-4">
              <div className="flex items-center gap-3 mb-3">
                {e.student_photo_url ? (
                  <img src={e.student_photo_url} alt={e.student_name} className="w-10 h-10 rounded-full object-cover border-2 border-secondary/30 shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
                    <GraduationCap size={20} />
                  </div>
                )}
                <p className="font-medium text-foreground">{e.student_name || "Sem nome"}</p>
              </div>

              {hasResult && cls ? (
                <div className="flex flex-col gap-1 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-secondary font-semibold inline-flex items-center gap-1">Realizado <Check size={14} /></span>
                  </div>
                  {hiddenLevel ? (
                    <span className="text-muted-foreground text-xs">Em breve serás informado sobre a nota do teste realizado.</span>
                  ) : (
                    <div className="flex items-center gap-2">
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
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => navigate(`/teste-ingles?enrollment=${e.id}`)}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#F9B91D] hover:text-[#F9B91D]/80 transition-colors"
                >
                  Realizar teste de inglês
                  <ExternalLink size={14} className="text-[#042d44]" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QuizResultsList;
