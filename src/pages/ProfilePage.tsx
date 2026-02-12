import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, User, GraduationCap, Phone } from "lucide-react";

const ProfilePage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentAge, setStudentAge] = useState("");
  const [studentSchool, setStudentSchool] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, phone, student_name, student_age, student_school")
        .maybeSingle();

      if (data) {
        setFullName(data.full_name || "");
        setPhone(data.phone || "");
        setStudentName(data.student_name || "");
        setStudentAge(data.student_age?.toString() || "");
        setStudentSchool(data.student_school || "");
      }
      setLoading(false);
    };

    fetchProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        phone: phone.trim(),
        student_name: studentName.trim(),
        student_age: studentAge ? parseInt(studentAge, 10) : null,
        student_school: studentSchool.trim(),
      })
      .eq("user_id", user!.id);

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Perfil atualizado!", description: "Suas informações foram salvas com sucesso." });
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="bg-primary border-b border-primary-foreground/10">
        <div className="container-narrow flex items-center justify-between h-16 px-4 md:px-8">
          <Link to="/" className="font-heading text-xl font-bold text-primary-foreground">
            Ponte <span className="text-secondary">Acadêmica</span>
          </Link>
        </div>
      </header>

      <div className="container-narrow px-4 md:px-8 py-8 max-w-2xl mx-auto">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          Voltar ao painel
        </Link>

        <h1 className="font-heading text-3xl font-bold text-foreground mb-2">Meu Perfil</h1>
        <p className="text-muted-foreground mb-8">Atualize suas informações pessoais e do aluno.</p>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Dados do responsável */}
          <section>
            <h2 className="font-heading text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <User size={20} className="text-secondary" />
              Dados do Responsável
            </h2>
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Nome completo</label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition"
                  placeholder="Seu nome completo"
                />
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
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition"
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Dados do aluno */}
          <section>
            <h2 className="font-heading text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <GraduationCap size={20} className="text-secondary" />
              Dados do Aluno
            </h2>
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Nome do aluno</label>
                <input
                  type="text"
                  maxLength={100}
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition"
                  placeholder="Nome completo do aluno"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Idade do aluno</label>
                <input
                  type="number"
                  min={5}
                  max={25}
                  value={studentAge}
                  onChange={(e) => setStudentAge(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition"
                  placeholder="Ex: 15"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-foreground block mb-1.5">Escola de origem</label>
                <input
                  type="text"
                  maxLength={200}
                  value={studentSchool}
                  onChange={(e) => setStudentSchool(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition"
                  placeholder="Nome da escola atual do aluno"
                />
              </div>
            </div>
          </section>

          <button
            type="submit"
            disabled={saving}
            className="bg-gradient-lime text-primary font-semibold px-8 py-3.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
          >
            <Save size={18} />
            {saving ? "Salvando..." : "Salvar Alterações"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
