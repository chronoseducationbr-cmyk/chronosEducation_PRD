import { useState, useEffect, useMemo, Fragment } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { BookOpen, Pencil, Check, X, ChevronDown, ChevronUp, Info, FileText, Monitor, PlaneTakeoff, AlertTriangle, Wand2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { scoringConfigs } from "@/lib/quizScoring";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { findSpellingIssues, applySpellingFixes, type SpellIssue } from "@/lib/contractSpellCheck";

interface QuizTest {
  id: string;
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

interface AppSettings {
  contract_enabled: boolean;
  contract_text: string;
  contract_text_summercamp: string;
  contract_text_wayland: string;
  contract_text_summercamp_wayland: string;
}

const defaultSettings: AppSettings = {
  contract_enabled: true,
  contract_text: "",
  contract_text_summercamp: "",
  contract_text_wayland: "",
  contract_text_summercamp_wayland: "",
};

type ContractEditorKey = "plataforma" | "summercamp" | "plataforma_wayland" | "summercamp_wayland";

const editorFieldMap: Record<ContractEditorKey, keyof AppSettings> = {
  plataforma: "contract_text",
  summercamp: "contract_text_summercamp",
  plataforma_wayland: "contract_text_wayland",
  summercamp_wayland: "contract_text_summercamp_wayland",
};

const AdminSettingsPage = () => {
  const { toast } = useToast();
  const [tests, setTests] = useState<QuizTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [editingContract, setEditingContract] = useState<ContractEditorKey | null>(null);
  const [contractDraft, setContractDraft] = useState("");

  useEffect(() => {
    loadTests();
    loadSettings();
  }, []);

  const loadTests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("quiz_tests")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) {
      console.error("Error loading tests:", error);
      toast({ title: "Erro ao carregar provas", variant: "destructive" });
    } else {
      setTests((data as any[]) || []);
    }
    setLoading(false);
  };

  const loadSettings = async () => {
    setLoadingSettings(true);
    const { data, error } = await supabase
      .from("app_settings" as any)
      .select("*")
      .eq("id", 1)
      .single();
    if (data && !error) {
      const s = data as any;
      setSettings({
        contract_enabled: s.contract_enabled,
        contract_text: s.contract_text || "",
        contract_text_summercamp: s.contract_text_summercamp || "",
        contract_text_wayland: s.contract_text_wayland || "",
        contract_text_summercamp_wayland: s.contract_text_summercamp_wayland || "",
      });
    }
    setLoadingSettings(false);
  };

  const updateSettings = async (partial: Partial<AppSettings>) => {
    setSavingSettings(true);
    const { error } = await supabase
      .from("app_settings" as any)
      .update({ ...partial, updated_at: new Date().toISOString() } as any)
      .eq("id", 1);
    if (error) {
      toast({ title: "Erro ao guardar configuração", variant: "destructive" });
    } else {
      setSettings((prev) => ({ ...prev, ...partial }));
      toast({ title: "Configuração guardada" });
    }
    setSavingSettings(false);
  };

  const quizEnabled = tests.some((t) => t.is_active);

  const handleGeneralToggle = async () => {
    if (quizEnabled) {
      const { error } = await supabase
        .from("quiz_tests")
        .update({ is_active: false } as any)
        .in("id", tests.map((t) => t.id));
      if (error) {
        toast({ title: "Erro ao desativar provas", variant: "destructive" });
      } else {
        setTests((prev) => prev.map((t) => ({ ...t, is_active: false })));
        toast({ title: "Provas de inglês desativadas" });
      }
    } else {
      const first = tests[0];
      if (first) {
        const { error } = await supabase
          .from("quiz_tests")
          .update({ is_active: true } as any)
          .eq("id", first.id);
        if (error) {
          toast({ title: "Erro ao ativar prova", variant: "destructive" });
        } else {
          setTests((prev) => prev.map((t) => ({ ...t, is_active: t.id === first.id })));
          toast({ title: "Provas de inglês ativadas", description: `${first.name} selecionada.` });
        }
      }
    }
  };

  const handleSelectTest = async (selectedTest: QuizTest) => {
    if (selectedTest.is_active) return;
    setToggling(selectedTest.id);
    await supabase.from("quiz_tests").update({ is_active: false } as any).in("id", tests.map((t) => t.id));
    const { error } = await supabase.from("quiz_tests").update({ is_active: true } as any).eq("id", selectedTest.id);
    if (error) {
      toast({ title: "Erro ao selecionar prova", variant: "destructive" });
    } else {
      setTests((prev) => prev.map((t) => ({ ...t, is_active: t.id === selectedTest.id })));
      toast({ title: "Prova selecionada", description: `${selectedTest.name} é agora a prova ativa.` });
    }
    setToggling(null);
  };

  const handleSaveDescription = async (test: QuizTest) => {
    const { error } = await supabase.from("quiz_tests").update({ description: editValue } as any).eq("id", test.id);
    if (error) {
      toast({ title: "Erro ao guardar descrição", variant: "destructive" });
    } else {
      setTests((prev) => prev.map((t) => (t.id === test.id ? { ...t, description: editValue } : t)));
      toast({ title: "Descrição atualizada" });
    }
    setEditingId(null);
  };

  const handleContractToggle = () => {
    updateSettings({ contract_enabled: !settings.contract_enabled });
  };

  const handleSaveContractText = (type: ContractEditorKey) => {
    const issues = findSpellingIssues(contractDraft);
    if (issues.length > 0) {
      toast({
        title: "Possíveis erros ortográficos detetados",
        description: `Foram encontradas ${issues.length} palavra(s) sem acento. Corrige ou usa "Corrigir tudo" antes de guardar.`,
        variant: "destructive",
      });
      return;
    }
    const field = editorFieldMap[type];
    updateSettings({ [field]: contractDraft } as Partial<AppSettings>);
    setEditingContract(null);
  };

  const handleAutoFix = () => {
    const issues = findSpellingIssues(contractDraft);
    if (issues.length === 0) {
      toast({ title: "Nenhum erro ortográfico detetado" });
      return;
    }
    setContractDraft((prev) => applySpellingFixes(prev, findSpellingIssues(prev)));
    toast({ title: "Ortografia corrigida", description: `${issues.length} palavra(s) atualizada(s).` });
  };

  const levelDescriptions: Record<string, string> = {
    "A0": "Os alunos neste nível estão começando a aprender as suas primeiras palavras.",
    "A1": "Os alunos que atingem o nível A1 conseguem comunicar usando expressões do dia a dia familiares e frases muito básicas.",
    "A2": "Os alunos que atingem o nível A2 conseguem comunicar usando expressões frequentes em situações do dia a dia.",
    "B1": "Os alunos que atingem o nível B1 conseguem compreender informação sobre temas familiares. Conseguem comunicar na maioria das situações enquanto viajam para países de língua inglesa.",
    "B2": "Os alunos que atingem o nível B2 conseguem compreender as principais ideias de textos complexos. Conseguem interagir com alguma fluência e comunicar facilmente.",
    "C1": "Os alunos que atingem o nível C1 conseguem compreender uma vasta gama de textos longos e complexos.",
    "C2": "Os alunos que atingem o nível C2 conseguem facilmente compreender quase tudo o que ouvem ou escrevem. Conseguem expressar-se de forma fluente e espontânea com precisão em situações complexas.",
  };

  const renderHighlightedText = (text: string, issues: SpellIssue[]) => {
    if (issues.length === 0) {
      return <span>{text}</span>;
    }
    const parts: React.ReactNode[] = [];
    let cursor = 0;
    issues.forEach((issue, idx) => {
      if (issue.start > cursor) {
        parts.push(<Fragment key={`t-${idx}`}>{text.slice(cursor, issue.start)}</Fragment>);
      }
      parts.push(
        <TooltipProvider key={`m-${idx}`} delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <mark className="bg-[#F9B91D]/30 text-foreground underline decoration-wavy decoration-[#F9B91D] underline-offset-4 cursor-help rounded px-0.5">
                {text.slice(issue.start, issue.end)}
              </mark>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              Sugestão: <strong>{issue.suggestion}</strong>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
      cursor = issue.end;
    });
    if (cursor < text.length) {
      parts.push(<Fragment key="t-end">{text.slice(cursor)}</Fragment>);
    }
    return <>{parts}</>;
  };

  const renderContractEditor = (type: ContractEditorKey, title: string, text: string) => {
    const isEditing = editingContract === type;
    const sourceText = isEditing ? contractDraft : text;
    const issues = findSpellingIssues(sourceText);
    const hasIssues = issues.length > 0;

    return (
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</p>
          {!isEditing && (
            <button
              onClick={() => { setEditingContract(type); setContractDraft(text); }}
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"
            >
              <Pencil size={14} />
            </button>
          )}
        </div>

        {hasIssues && (
          <div className="mb-3 flex items-start gap-2 rounded-lg border border-[#F9B91D]/40 bg-[#F9B91D]/10 p-3 text-xs">
            <AlertTriangle size={16} className="text-[#F9B91D] shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="font-semibold text-foreground">
                {issues.length} possível{issues.length === 1 ? "" : "s"} erro{issues.length === 1 ? "" : "s"} ortográfico{issues.length === 1 ? "" : "s"} detetado{issues.length === 1 ? "" : "s"}
              </p>
              <p className="text-muted-foreground">
                Palavras sem acento esperado:{" "}
                {Array.from(new Set(issues.map((i) => `${i.word} → ${i.suggestion}`))).slice(0, 5).join(", ")}
                {issues.length > 5 ? "…" : ""}
              </p>
            </div>
            {isEditing && (
              <button
                onClick={handleAutoFix}
                className="inline-flex items-center gap-1.5 bg-[#F9B91D] text-black font-semibold py-1.5 px-3 rounded-md hover:opacity-90 text-xs shrink-0"
              >
                <Wand2 size={12} />
                Corrigir tudo
              </button>
            )}
          </div>
        )}

        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={contractDraft}
              onChange={(e) => setContractDraft(e.target.value)}
              className={`w-full text-sm rounded-lg border bg-background p-3 text-foreground resize-vertical focus:outline-none focus:ring-1 min-h-[200px] ${hasIssues ? "border-[#F9B91D] focus:ring-[#F9B91D]" : "border-border focus:ring-secondary"}`}
              rows={10}
              placeholder="Insira o texto do contrato aqui..."
            />
            <p className="text-xs text-muted-foreground">
              Dica: Utilize linhas em branco para separar parágrafos.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSaveContractText(type)}
                disabled={savingSettings || hasIssues}
                title={hasIssues ? "Corrige os erros ortográficos antes de guardar" : undefined}
                className="inline-flex items-center gap-1.5 bg-secondary text-secondary-foreground font-semibold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check size={14} />
                Guardar
              </button>
              <button
                onClick={() => setEditingContract(null)}
                className="inline-flex items-center gap-1.5 text-muted-foreground font-medium py-2 px-4 rounded-lg hover:bg-muted transition-colors text-sm"
              >
                <X size={14} />
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-muted/30 border border-border rounded-lg p-4">
            {text ? (
              <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed font-sans break-words">
                {renderHighlightedText(text, issues)}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Nenhum texto de contrato definido.</p>
            )}
          </div>
        )}
      </div>
    );
  };

  const tabTriggerClass = "bg-transparent px-4 py-3 rounded-none shadow-none text-lg text-muted-foreground data-[state=active]:text-[#f9b41f] data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#f9b41f] data-[state=active]:bg-transparent font-semibold";

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground mb-1">Configurações</h1>
      <p className="text-muted-foreground mb-6">Gerir provas de inglês.</p>

      <Tabs defaultValue="provas" className="w-full">
        <TabsList className="mb-8 bg-transparent border-0 border-b border-border p-0 gap-10 pb-0">
          <TabsTrigger value="provas" className={tabTriggerClass}>
            <BookOpen size={18} className="mr-2" />
            Provas
            <span className={`ml-2 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${quizEnabled ? "bg-secondary/20 text-secondary" : "bg-muted text-muted-foreground"}`}>
              {quizEnabled ? "ON" : "OFF"}
            </span>
          </TabsTrigger>
        </TabsList>

        {/* ─── Provas de Inglês ─── */}
        <TabsContent value="provas">
          <div className="max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-lg font-semibold text-foreground">Provas de Inglês</h2>
              {!loading && tests.length > 0 && (
                <Switch checked={quizEnabled} onCheckedChange={handleGeneralToggle} />
              )}
            </div>

            {loading ? (
              <div className="animate-pulse h-20 bg-muted rounded-xl" />
            ) : tests.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhuma prova configurada.</p>
            ) : quizEnabled ? (
              <div className="space-y-3 pl-4 border-l-2 border-secondary/30">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Selecionar prova ativa</p>
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
                              placeholder="Descrição da prova..."
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
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-medium text-foreground">
                                          {c.level}{c.label ? ` — ${c.label}` : ""}
                                        </span>
                                        {levelDescriptions[c.level] && (
                                          <TooltipProvider delayDuration={200}>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
                                                  <Info size={13} />
                                                </button>
                                              </TooltipTrigger>
                                              <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
                                                {levelDescriptions[c.level]}
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        )}
                                      </div>
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
            ) : (
              <p className="text-sm text-muted-foreground italic">Provas de inglês desativadas.</p>
            )}
          </div>
        </TabsContent>



      </Tabs>
    </div>
  );
};

export default AdminSettingsPage;
