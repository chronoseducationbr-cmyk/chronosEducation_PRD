import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
}

const AdminUsersPage = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      setProfiles((data as Profile[]) || []);
      setLoading(false);
    };
    load();
  }, []);

  const formatDate = (d: string) => {
    const dt = new Date(d);
    return `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}/${dt.getFullYear()}`;
  };

  const filtered = profiles.filter(
    (p) =>
      p.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (p.email?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (p.phone?.toLowerCase() || "").includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">Utilizadores</h1>
        <p className="text-sm text-muted-foreground">{profiles.length} utilizadores registados</p>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Pesquisar por nome, email ou telefone..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => (
            <div key={p.id} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Users size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{p.full_name || "Sem nome"}</p>
                <p className="text-xs text-muted-foreground">{p.email || "—"}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-muted-foreground">{p.phone || "—"}</p>
                <p className="text-[10px] text-muted-foreground">Registado em {formatDate(p.created_at)}</p>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-8">Nenhum utilizador encontrado.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
