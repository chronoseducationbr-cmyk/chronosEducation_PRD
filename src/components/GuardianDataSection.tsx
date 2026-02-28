import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Users, Mail, Phone, FileText, Save } from "lucide-react";

const GuardianDataSection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, email, phone")
        .maybeSingle();

      if (data) {
        setFullName(data.full_name || user?.user_metadata?.full_name || "");
        setEmail(data.email || user?.email || "");
        setPhone(data.phone || "");
      } else {
        setFullName(user?.user_metadata?.full_name || "");
        setEmail(user?.email || "");
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
      })
      .eq("user_id", user.id);

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Dados do responsável salvos!", description: "Informações atualizadas com sucesso." });
    }
    setSaving(false);
  };

  const inputClasses = "w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSave}>
      <h2 className="font-heading text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
        <Users size={20} className="text-secondary" />
        Dados de Pai/Mãe ou Responsável
      </h2>
      <div className="bg-card rounded-xl border border-border shadow-card p-5">
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Nome completo</label>
            <input
              type="text"
              maxLength={100}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={inputClasses}
              placeholder="Nome completo do responsável"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Email</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                maxLength={100}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`${inputClasses} pl-10`}
                placeholder="email@exemplo.com"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Telefone</label>
            <div className="relative">
              <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="tel"
                maxLength={20}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`${inputClasses} pl-10`}
                placeholder="+351 912 345 678"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">CPF</label>
            <div className="relative">
              <FileText size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={cpf}
                onChange={(e) => setCpf(formatCpf(e.target.value))}
                className={`${inputClasses} pl-10`}
                placeholder="000.000.000-00"
                maxLength={14}
              />
            </div>
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="mt-5 bg-secondary text-secondary-foreground font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 text-sm"
        >
          <Save size={16} />
          {saving ? "Salvando..." : "Salvar dados do responsável"}
        </button>
      </div>
    </form>
  );
};

export default GuardianDataSection;
