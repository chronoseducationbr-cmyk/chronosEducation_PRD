import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, Mail, MapPin, Calendar, Save } from "lucide-react";

const StudentDataSection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [studentName, setStudentName] = useState("");
  const [studentBirthDate, setStudentBirthDate] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentAddress, setStudentAddress] = useState("");
  const [studentSchool, setStudentSchool] = useState("");
  const [studentGraduationYear, setStudentGraduationYear] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("student_name, student_birth_date, student_email, student_address, student_school, student_graduation_year")
        .maybeSingle();

      if (data) {
        setStudentName(data.student_name || "");
        setStudentBirthDate((data as any).student_birth_date || "");
        setStudentEmail((data as any).student_email || "");
        setStudentAddress((data as any).student_address || "");
        setStudentSchool(data.student_school || "");
        setStudentGraduationYear((data as any).student_graduation_year?.toString() || "");
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        student_name: studentName.trim(),
        student_birth_date: studentBirthDate || null,
        student_email: studentEmail.trim(),
        student_address: studentAddress.trim(),
        student_school: studentSchool.trim(),
        student_graduation_year: studentGraduationYear ? parseInt(studentGraduationYear, 10) : null,
      } as any)
      .eq("user_id", user.id);

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Dados do aluno salvos!", description: "Informações atualizadas com sucesso." });
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
        <GraduationCap size={20} className="text-secondary" />
        Dados do Aluno
      </h2>
      <div className="bg-card rounded-xl border border-border shadow-card p-5">
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Nome completo do aluno</label>
            <input
              type="text"
              maxLength={100}
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className={inputClasses}
              placeholder="Nome completo do aluno"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Data de nascimento</label>
            <div className="relative">
              <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="date"
                value={studentBirthDate}
                onChange={(e) => setStudentBirthDate(e.target.value)}
                className={`${inputClasses} pl-10`}
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Email do aluno</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                maxLength={100}
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                className={`${inputClasses} pl-10`}
                placeholder="aluno@exemplo.com"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Ano previsto para fim do secundário</label>
            <input
              type="number"
              min={2024}
              max={2040}
              value={studentGraduationYear}
              onChange={(e) => setStudentGraduationYear(e.target.value)}
              className={inputClasses}
              placeholder="Ex: 2027"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-foreground block mb-1.5">Morada</label>
            <div className="relative">
              <MapPin size={18} className="absolute left-3 top-3 text-muted-foreground" />
              <input
                type="text"
                maxLength={300}
                value={studentAddress}
                onChange={(e) => setStudentAddress(e.target.value)}
                className={`${inputClasses} pl-10`}
                placeholder="Morada completa do aluno"
              />
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-foreground block mb-1.5">Escola de origem</label>
            <input
              type="text"
              maxLength={200}
              value={studentSchool}
              onChange={(e) => setStudentSchool(e.target.value)}
              className={inputClasses}
              placeholder="Nome da escola atual do aluno"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="mt-5 bg-secondary text-secondary-foreground font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 text-sm"
        >
          <Save size={16} />
          {saving ? "Salvando..." : "Salvar dados do aluno"}
        </button>
      </div>
    </form>
  );
};

export default StudentDataSection;
