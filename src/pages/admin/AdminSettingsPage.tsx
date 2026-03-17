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

  const handleToggle = async (test: QuizTest) => {
    setToggling(test.id);
    const newActive = !test.is_active;

    const { error } = await supabase
      .from("quiz_tests")
      .update({ is_active: newActive } as any)
      .eq("id", test.id);

    if (error) {
      console.error("Error toggling test:", error);
      toast({ title: "Erro ao atualizar teste", variant: "destructive" });
    } else {
      setTests((prev) =>
        prev.map((t) => (t.id === test.id ? { ...t, is_active: newActive } : t))
      );
      toast({
        title: newActive ? "Teste ativado" : "Teste desativado",
        description: `${test.name} foi ${newActive ? "ativado" : "desativado"}.`,
      });
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
          <div className="space-y-3">
            {tests.map((test) => (
              <div
                key={test.id}
                className="p-4 bg-card border border-border rounded-xl"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-foreground">{test.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Slug: {test.slug} · {test.is_active ? "Ativo" : "Desativado"}
                    </p>
                  </div>
                  <Switch
                    checked={test.is_active}
                    onCheckedChange={() => handleToggle(test)}
                    disabled={toggling === test.id}
                  />
                </div>

                {editingId === test.id ? (
                  <div className="flex items-start gap-2 mt-2">
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
                  <div className="flex items-start gap-2 mt-2">
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSettingsPage;
