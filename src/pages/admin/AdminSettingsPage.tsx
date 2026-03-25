import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { BookOpen, Pencil, Check, X, ChevronDown, ChevronUp, Info, FileText } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { scoringConfigs } from "@/lib/quizScoring";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
}

const defaultSettings: AppSettings = {
  contract_enabled: true,
  contract_text: "",
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
  const [editingContract, setEditingContract] = useState(false);
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
      toast({ title: "Erro ao carregar testes", variant: "destructive" });
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
        toast({ title: "Erro ao desativar testes", variant: "destructive" });
      } else {
        setTests((prev) => prev.map((t) => ({ ...t, is_active: false })));
        toast({ title: "Testes de inglês desativados" });
      }
    } else {
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
    await supabase.from("quiz_tests").update({ is_active: false } as any).in("id", tests.map((t) => t.id));
    const { error } = await supabase.from("quiz_tests").update({ is_active: true } as any).eq("id", selectedTest.id);
    if (error) {
      toast({ title: "Erro ao selecionar teste", variant: "destructive" });
    } else {
      setTests((prev) => prev.map((t) => ({ ...t, is_active: t.id === selectedTest.id })));
      toast({ title: "Teste selecionado", description: `${selectedTest.name} é agora o teste ativo.` });
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

  const handleSaveContractText = () => {
    updateSettings({ contract_text: contractDraft });
    setEditingContract(false);
  };

  const handleSaveFinancials = () => {
    updateSettings({
      default_inscription_fee_cents: Math.round(financialDraft.inscription * 100),
      default_tuition_installment_cents: Math.round(financialDraft.tuition * 100),
      default_tuition_installments: financialDraft.tuitionInstallments,
      default_summercamp_installment_cents: Math.round(financialDraft.summercamp * 100),
      default_summercamp_installments: financialDraft.summercampInstallments,
    });
    setEditingFinancials(false);
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

  const tabTriggerClass = "bg-transparent px-4 py-3 rounded-none shadow-none text-lg text-muted-foreground data-[state=active]:text-[#f9b41f] data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#f9b41f] data-[state=active]:bg-transparent font-semibold";

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground mb-1">Configurações</h1>
      <p className="text-muted-foreground mb-6">Gerir testes de inglês, contrato e valores padrão.</p>

      <Tabs defaultValue="testes" className="w-full">
        <TabsList className="mb-8 bg-transparent border-0 border-b border-border p-0 gap-10 pb-0">
          <TabsTrigger value="testes" className={tabTriggerClass}>
            <BookOpen size={18} className="mr-2" />
            Testes
            <span className={`ml-2 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${quizEnabled ? "bg-secondary/20 text-secondary" : "bg-muted text-muted-foreground"}`}>
              {quizEnabled ? "ON" : "OFF"}
            </span>
          </TabsTrigger>
          <TabsTrigger value="contrato" className={tabTriggerClass}>
            <FileText size={18} className="mr-2" />
            Contrato
            <span className={`ml-2 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${settings.contract_enabled ? "bg-secondary/20 text-secondary" : "bg-muted text-muted-foreground"}`}>
              {settings.contract_enabled ? "ON" : "OFF"}
            </span>
          </TabsTrigger>
          <TabsTrigger value="valores" className={tabTriggerClass}>
            <DollarSign size={18} className="mr-2" />
            Valores Padrão
          </TabsTrigger>
        </TabsList>

        {/* ─── Testes de Inglês ─── */}
        <TabsContent value="testes">
          <div className="max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-lg font-semibold text-foreground">Testes de Inglês</h2>
              {!loading && tests.length > 0 && (
                <Switch checked={quizEnabled} onCheckedChange={handleGeneralToggle} />
              )}
            </div>

            {loading ? (
              <div className="animate-pulse h-20 bg-muted rounded-xl" />
            ) : tests.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhum teste configurado.</p>
            ) : quizEnabled ? (
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
              <p className="text-sm text-muted-foreground italic">Testes de inglês desativados.</p>
            )}
          </div>
        </TabsContent>

        {/* ─── Contrato ─── */}
        <TabsContent value="contrato">
          <div className="max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-lg font-semibold text-foreground">Contrato</h2>
              {!loadingSettings && (
                <Switch checked={settings.contract_enabled} onCheckedChange={handleContractToggle} disabled={savingSettings} />
              )}
            </div>

            {loadingSettings ? (
              <div className="animate-pulse h-20 bg-muted rounded-xl" />
            ) : !settings.contract_enabled ? (
              <p className="text-sm text-muted-foreground italic">Contrato desativado. Os alunos não precisarão assinar contrato na matrícula.</p>
            ) : (
              <div className="space-y-4">
                {/* Section 1 info */}
                <div className="bg-muted/40 border border-border rounded-xl p-4 flex items-start gap-3">
                  <Info size={16} className="text-secondary shrink-0 mt-0.5" />
                  <div className="text-sm text-muted-foreground leading-relaxed">
                    <p className="font-medium text-foreground mb-1">1. PARTES — Secção dinâmica</p>
                    <p>
                      Esta secção é preenchida automaticamente com os dados do responsável (nome, email, celular) e do aluno (nome, data de nascimento, email, endereço, escola, ano de conclusão) inseridos no momento da matrícula.
                    </p>
                  </div>
                </div>

                {/* Contract text */}
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Texto do Contrato</p>
                    {!editingContract && (
                      <button
                        onClick={() => { setEditingContract(true); setContractDraft(settings.contract_text); }}
                        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"
                      >
                        <Pencil size={14} />
                      </button>
                    )}
                  </div>
                  {editingContract ? (
                    <div className="space-y-3">
                      <textarea
                        value={contractDraft}
                        onChange={(e) => setContractDraft(e.target.value)}
                        className="w-full text-sm rounded-lg border border-border bg-background p-3 text-foreground resize-vertical focus:outline-none focus:ring-1 focus:ring-secondary min-h-[200px]"
                        rows={10}
                        placeholder="Insira o texto do contrato aqui. Pode usar parágrafos separados por linhas em branco..."
                      />
                      <p className="text-xs text-muted-foreground">
                        Dica: Utilize linhas em branco para separar parágrafos. Os dados do responsável e do aluno são inseridos automaticamente.
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleSaveContractText}
                          disabled={savingSettings}
                          className="inline-flex items-center gap-1.5 bg-secondary text-secondary-foreground font-semibold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity text-sm disabled:opacity-50"
                        >
                          <Check size={14} />
                          Guardar
                        </button>
                        <button
                          onClick={() => setEditingContract(false)}
                          className="inline-flex items-center gap-1.5 text-muted-foreground font-medium py-2 px-4 rounded-lg hover:bg-muted transition-colors text-sm"
                        >
                          <X size={14} />
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-muted/30 border border-border rounded-lg p-3 max-h-[300px] overflow-y-auto">
                      {settings.contract_text ? (
                        <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{settings.contract_text}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">Nenhum texto de contrato personalizado definido.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ─── Valores Financeiros ─── */}
        <TabsContent value="valores">
          <div className="max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-lg font-semibold text-foreground">Valores Financeiros Padrão</h2>
              {!loadingSettings && !editingFinancials && (
                <button
                  onClick={() => {
                    setEditingFinancials(true);
                    setFinancialDraft({
                      inscription: settings.default_inscription_fee_cents / 100,
                      tuition: settings.default_tuition_installment_cents / 100,
                      tuitionInstallments: settings.default_tuition_installments,
                      summercamp: settings.default_summercamp_installment_cents / 100,
                      summercampInstallments: settings.default_summercamp_installments,
                    });
                  }}
                  className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"
                >
                  <Pencil size={14} />
                </button>
              )}
            </div>

            {loadingSettings ? (
              <div className="animate-pulse h-20 bg-muted rounded-xl" />
            ) : editingFinancials ? (
              <div className="bg-card border border-border rounded-xl p-4 space-y-4">
                <p className="text-xs text-muted-foreground">Estes valores serão aplicados como padrão em novas matrículas.</p>
                <p className="text-[11px] text-muted-foreground/70 italic">Utilize ponto (.) como separador decimal — ex: 450.50</p>
                <div className="space-y-4">
                  {/* Taxa de Matrícula - sozinha */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Taxa de Matrícula ($)</label>
                    <div className="relative max-w-[240px]">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={financialDraft.inscriptionDisplay ?? financialDraft.inscription.toFixed(2)}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/[^0-9.]/g, "");
                          setFinancialDraft((d) => ({ ...d, inscriptionDisplay: raw, inscription: parseFloat(raw) || 0 }));
                        }}
                        onBlur={() => setFinancialDraft((d) => ({ ...d, inscriptionDisplay: undefined, inscription: parseFloat(String(d.inscription)) || 0 }))}
                        className="w-full rounded-lg border border-border bg-background p-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-secondary"
                      />
                    </div>
                  </div>

                  {/* Plataforma - lado a lado */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Nº Parcelas Plataforma</label>
                      <input
                        type="number"
                        min={1}
                        value={financialDraft.tuitionInstallments}
                        onChange={(e) => setFinancialDraft((d) => ({ ...d, tuitionInstallments: parseInt(e.target.value) || 1 }))}
                        className="w-full rounded-lg border border-border bg-background p-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-secondary"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Mensalidade Plataforma ($)</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={financialDraft.tuitionDisplay ?? financialDraft.tuition.toFixed(2)}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/[^0-9.]/g, "");
                          setFinancialDraft((d) => ({ ...d, tuitionDisplay: raw, tuition: parseFloat(raw) || 0 }));
                        }}
                        onBlur={() => setFinancialDraft((d) => ({ ...d, tuitionDisplay: undefined, tuition: parseFloat(String(d.tuition)) || 0 }))}
                        className="w-full rounded-lg border border-border bg-background p-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-secondary"
                      />
                    </div>
                  </div>

                  {/* Summer Camp - lado a lado */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Nº Parcelas Summer Camp</label>
                      <input
                        type="number"
                        min={1}
                        value={financialDraft.summercampInstallments}
                        onChange={(e) => setFinancialDraft((d) => ({ ...d, summercampInstallments: parseInt(e.target.value) || 1 }))}
                        className="w-full rounded-lg border border-border bg-background p-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-secondary"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Mensalidade Summer Camp ($)</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={financialDraft.summercampDisplay ?? financialDraft.summercamp.toFixed(2)}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/[^0-9.]/g, "");
                          setFinancialDraft((d) => ({ ...d, summercampDisplay: raw, summercamp: parseFloat(raw) || 0 }));
                        }}
                        onBlur={() => setFinancialDraft((d) => ({ ...d, summercampDisplay: undefined, summercamp: parseFloat(String(d.summercamp)) || 0 }))}
                        className="w-full rounded-lg border border-border bg-background p-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-secondary"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={handleSaveFinancials}
                    disabled={savingSettings}
                    className="inline-flex items-center gap-1.5 bg-secondary text-secondary-foreground font-semibold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity text-sm disabled:opacity-50"
                  >
                    <Check size={14} />
                    Guardar
                  </button>
                  <button
                    onClick={() => setEditingFinancials(false)}
                    className="inline-flex items-center gap-1.5 text-muted-foreground font-medium py-2 px-4 rounded-lg hover:bg-muted transition-colors text-sm"
                  >
                    <X size={14} />
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-3">Valores aplicados por padrão em novas matrículas.</p>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Taxa de Matrícula</p>
                    <p className="text-foreground font-medium">${(settings.default_inscription_fee_cents / 100).toFixed(2)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-muted-foreground text-xs">Nº Parcelas Plataforma</p>
                      <p className="text-foreground font-medium">{settings.default_tuition_installments}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Mensalidade Plataforma</p>
                      <p className="text-foreground font-medium">${(settings.default_tuition_installment_cents / 100).toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-muted-foreground text-xs">Nº Parcelas Summer Camp</p>
                      <p className="text-foreground font-medium">{settings.default_summercamp_installments}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Mensalidade Summer Camp</p>
                      <p className="text-foreground font-medium">
                        {settings.default_summercamp_installment_cents > 0
                          ? `$${(settings.default_summercamp_installment_cents / 100).toFixed(2)}`
                          : "Não definido"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettingsPage;
