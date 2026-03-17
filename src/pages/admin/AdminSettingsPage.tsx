import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { BookOpen } from "lucide-react";

interface QuizTest {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
}

const AdminSettingsPage = () => {
  const { toast } = useToast();
  const [tests, setTests] = useState<QuizTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

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
                className="flex items-center justify-between p-4 bg-card border border-border rounded-xl"
              >
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSettingsPage;
