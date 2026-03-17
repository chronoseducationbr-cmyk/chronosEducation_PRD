import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { BookOpen, Pencil, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { scoringConfigs } from "@/lib/quizScoring";

interface QuizTest {
  id: string;
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

const AdminSettingsPage = () => {
  const { toast } = useToast();
  const [tests, setTests] = useState<QuizTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("quiz_tests")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading tests:", error);
      toast({ title: "Erro ao carregar testes", variant: "destructive" });
    } else {
      setTests((data as any[]) || []);
    }
    setLoading(false);
  };

  const quizEnabled = tests.some((t) => t.is_active);

  const handleGeneralToggle = async () => {
    if (quizEnabled) {
      // Deactivate all tests
      const { error } = await supabase
        .from("quiz_tests")
        .update({ is_active: false } as any)
        .in("id", tests.map((t) => t.id));

      if (error) {
        toast({ title: "Erro ao desativar testes", variant: "destructive" });
      } else {
        setTests((prev) => prev.map((t) => ({ ...t, is_active: false })));
        toast({ title: "Testes de inglês desativados" });
      }
    } else {
      // Enable: activate the first test by default
      const first = tests[0];
      if (first) {
        const { error } = await supabase
          .from("quiz_tests")
          .update({ is_active: true } as any)
          .eq("id", first.id);

        if (error) {
          toast({ title: "Erro ao ativar teste", variant: "destructive" });
        } else {
          setTests((prev) => prev.map((t) => ({ ...t, is_active: t.id === first.id })));
          toast({ title: "Testes de inglês ativados", description: `${first.name} selecionado.` });
        }
      }
    }
  };

  const handleSelectTest = async (selectedTest: QuizTest) => {
    if (selectedTest.is_active) return;
    setToggling(selectedTest.id);

    // Deactivate all, then activate the selected one
    await supabase
      .from("quiz_tests")
      .update({ is_active: false } as any)
      .in("id", tests.map((t) => t.id));

    const { error } = await supabase
      .from("quiz_tests")
      .update({ is_active: true } as any)
      .eq("id", selectedTest.id);

    if (error) {
      toast({ title: "Erro ao selecionar teste", variant: "destructive" });
    } else {
      setTests((prev) => prev.map((t) => ({ ...t, is_active: t.id === selectedTest.id })));
      toast({ title: "Teste selecionado", description: `${selectedTest.name} é agora o teste ativo.` });
    }
    setToggling(null);
  };

  const handleSaveDescription = async (test: QuizTest) => {
    const { error } = await supabase
      .from("quiz_tests")
      .update({ description: editValue } as any)
      .eq("id", test.id);

    if (error) {
      toast({ title: "Erro ao guardar descrição", variant: "destructive" });
    } else {
      setTests((prev) =>
        prev.map((t) => (t.id === test.id ? { ...t, description: editValue } : t))
      );
      toast({ title: "Descrição atualizada" });
    }
    setEditingId(null);
  };

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground mb-1">Configurações</h1>
      <p className="text-muted-foreground mb-8">Gerir testes de inglês e outras configurações.</p>

      <div className="max-w-2xl">
        <h2 className="font-heading text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <BookOpen size={20} className="text-secondary" />
          Testes de Inglês
        </h2>

        {loading ? (
          <div className="animate-pulse h-20 bg-muted rounded-xl" />
        ) : tests.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhum teste configurado.</p>
        ) : (
          <div className="space-y-4">
            {/* Master toggle */}
            <div className="flex items-center justify-between p-4 bg-card border border-border rounded-xl">
              <div>
                <p className="font-medium text-foreground">Teste de Inglês (Geral)</p>
                <p className="text-xs text-muted-foreground">
                  {quizEnabled ? "Ativo — os alunos realizam o teste selecionado" : "Desativado — nenhum aluno faz teste"}
                </p>
              </div>
              <Switch checked={quizEnabled} onCheckedChange={handleGeneralToggle} />
            </div>

            {/* Test list (only when enabled) */}
            {quizEnabled && (
              <div className="space-y-3 pl-4 border-l-2 border-secondary/30">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Selecionar teste ativo</p>
                {tests.map((test) => (
                  <div
                    key={test.id}
                    className={`p-4 bg-card border rounded-xl transition-colors ${test.is_active ? "border-secondary" : "border-border"}`}
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className="flex items-center gap-3 cursor-pointer flex-1"
                        onClick={() => setExpandedId(expandedId === test.id ? null : test.id)}
                      >
                        {expandedId === test.id ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                        <div>
                          <p className="font-medium text-foreground">{test.name}</p>
                          {expandedId !== test.id && test.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-md">{test.description}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleSelectTest(test)}
                        disabled={toggling === test.id}
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                          test.is_active
                            ? "border-secondary bg-secondary"
                            : "border-muted-foreground/40 hover:border-secondary"
                        }`}
                      >
                        {test.is_active && <div className="w-2 h-2 rounded-full bg-secondary-foreground" />}
                      </button>
                    </div>

                    {expandedId === test.id && (
                      <div className="mt-3 space-y-3">
                        {editingId === test.id ? (
                          <div className="flex items-start gap-2">
                            <textarea
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="flex-1 text-sm rounded-lg border border-border bg-background p-2 text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-secondary"
                              rows={2}
                              placeholder="Descrição do teste..."
                            />
                            <button onClick={() => handleSaveDescription(test)} className="p-1.5 rounded-md hover:bg-muted text-secondary">
                              <Check size={16} />
                            </button>
                            <button onClick={() => setEditingId(null)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground">
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-start gap-2">
                            <p className="text-sm text-muted-foreground flex-1">
                              {test.description || <span className="italic">Sem descrição</span>}
                            </p>
                            <button
                              onClick={() => { setEditingId(test.id); setEditValue(test.description || ""); }}
                              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground shrink-0"
                            >
                              <Pencil size={14} />
                            </button>
                          </div>
                        )}

                        {scoringConfigs[test.slug] && (
                          <div className="bg-muted/50 rounded-lg p-3">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Graus de Classificação</p>
                            <div className="space-y-1">
                              {(() => {
                                const config = scoringConfigs[test.slug];
                                const cls = [...config.classifications].reverse();
                                return cls.map((c, i) => {
                                  const nextMin = i < cls.length - 1 ? cls[i + 1].minPoints - 1 : config.maxPoints;
                                  const rangeLabel = c.minPoints === 0
                                    ? `0 – ${nextMin} pontos`
                                    : i === cls.length - 1
                                      ? `${c.minPoints} – ${config.maxPoints} pontos`
                                      : `${c.minPoints} – ${nextMin} pontos`;
                                  return (
                                    <div key={c.level} className="flex items-center justify-between text-sm">
                                      <span className="font-medium text-foreground">
                                        {c.level}{c.label ? ` — ${c.label}` : ""}
                                      </span>
                                      <span className="text-muted-foreground text-xs">{rangeLabel}</span>
                                    </div>
                                  );
                                });
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSettingsPage;
