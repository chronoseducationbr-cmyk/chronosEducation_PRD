import { useState, useEffect, Fragment } from "react";
import { useParams, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Pencil, Check, X, Monitor, PlaneTakeoff, AlertTriangle, Wand2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { findSpellingIssues, applySpellingFixes, type SpellIssue } from "@/lib/contractSpellCheck";

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

const schoolConfig = {
  knox: {
    name: "Knox School",
    plataformaKey: "plataforma" as ContractEditorKey,
    summercampKey: "summercamp" as ContractEditorKey,
  },
  wayland: {
    name: "Wayland Academy",
    plataformaKey: "plataforma_wayland" as ContractEditorKey,
    summercampKey: "summercamp_wayland" as ContractEditorKey,
  },
};

const AdminContractsPage = () => {
  const { school } = useParams<{ school: string }>();
  const { toast } = useToast();

  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [editingContract, setEditingContract] = useState<ContractEditorKey | null>(null);
  const [contractDraft, setContractDraft] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  // Reset edit state when changing school
  useEffect(() => {
    setEditingContract(null);
  }, [school]);

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
              className={`w-full text-sm rounded-lg border bg-background p-3 text-foreground resize-vertical focus:outline-none focus:ring-1 min-h-[400px] ${hasIssues ? "border-[#F9B91D] focus:ring-[#F9B91D]" : "border-border focus:ring-secondary"}`}
              rows={20}
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
          <div className="bg-muted/30 border border-border rounded-lg p-4 max-h-[600px] overflow-auto">
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

  if (!school || !(school in schoolConfig)) {
    return <Navigate to="/admin/contratos/knox" replace />;
  }

  const config = schoolConfig[school as keyof typeof schoolConfig];

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground mb-1">Contratos — {config.name}</h1>
      <p className="text-muted-foreground mb-6">Gerir os textos dos contratos da escola.</p>

      <div className="flex items-center justify-between mb-6 max-w-3xl">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">Contratos ativos</span>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${settings.contract_enabled ? "bg-secondary/20 text-secondary" : "bg-muted text-muted-foreground"}`}>
            {settings.contract_enabled ? "ON" : "OFF"}
          </span>
        </div>
        {!loadingSettings && (
          <Switch checked={settings.contract_enabled} onCheckedChange={handleContractToggle} disabled={savingSettings} />
        )}
      </div>

      {loadingSettings ? (
        <div className="animate-pulse h-40 bg-muted rounded-xl max-w-3xl" />
      ) : !settings.contract_enabled ? (
        <p className="text-sm text-muted-foreground italic">Contrato desativado. Os alunos não precisarão assinar contrato na matrícula.</p>
      ) : (
        <div className="max-w-4xl">
          <Tabs defaultValue="plataforma" className="w-full">
            <TabsList className="bg-muted/50 border border-border p-1 rounded-lg">
              <TabsTrigger value="plataforma" className="data-[state=active]:bg-[#ABFE0E] data-[state=active]:text-black data-[state=active]:font-bold data-[state=active]:shadow-sm rounded-md px-4 py-2 text-sm font-medium gap-1.5">
                <Monitor size={14} />
                Plataforma Online
              </TabsTrigger>
              <TabsTrigger value="summercamp" className="data-[state=active]:bg-[#ABFE0E] data-[state=active]:text-black data-[state=active]:font-bold data-[state=active]:shadow-sm rounded-md px-4 py-2 text-sm font-medium gap-1.5">
                <PlaneTakeoff size={14} />
                Summer Camp
              </TabsTrigger>
            </TabsList>
            <TabsContent value="plataforma" className="mt-4">
              {renderContractEditor(
                config.plataformaKey,
                `Texto do Contrato — ${config.name} · Plataforma Online`,
                settings[editorFieldMap[config.plataformaKey]] as string
              )}
            </TabsContent>
            <TabsContent value="summercamp" className="mt-4">
              {renderContractEditor(
                config.summercampKey,
                `Texto do Contrato — ${config.name} · Summer Camp`,
                settings[editorFieldMap[config.summercampKey]] as string
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default AdminContractsPage;
