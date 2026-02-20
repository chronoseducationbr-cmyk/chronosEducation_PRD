import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, User, GraduationCap, Phone, Mail, MapPin, Calendar, Camera } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const ProfilePage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentBirthDate, setStudentBirthDate] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentAddress, setStudentAddress] = useState("");
  const [studentSchool, setStudentSchool] = useState("");
  const [studentGraduationYear, setStudentGraduationYear] = useState("");
  const [studentPhotoUrl, setStudentPhotoUrl] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, email, phone, student_name, student_birth_date, student_email, student_address, student_school, student_graduation_year, student_photo_url")
        .maybeSingle();

      if (data) {
        setFullName(data.full_name || "");
        setEmail((data as any).email || "");
        setPhone(data.phone || "");
        setStudentName(data.student_name || "");
        setStudentBirthDate((data as any).student_birth_date || "");
        setStudentEmail((data as any).student_email || "");
        setStudentAddress((data as any).student_address || "");
        setStudentSchool(data.student_school || "");
        setStudentGraduationYear((data as any).student_graduation_year?.toString() || "");
        setStudentPhotoUrl((data as any).student_photo_url || "");
      }
      setLoading(false);
    };

    fetchProfile();
  }, []);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/photo.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("student-photos")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Erro ao enviar foto", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("student-photos")
      .getPublicUrl(filePath);

    setStudentPhotoUrl(urlData.publicUrl);
    setUploading(false);
    toast({ title: "Foto enviada!", description: "A foto foi carregada com sucesso." });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        student_name: studentName.trim(),
        student_birth_date: studentBirthDate || null,
        student_email: studentEmail.trim(),
        student_address: studentAddress.trim(),
        student_school: studentSchool.trim(),
        student_graduation_year: studentGraduationYear ? parseInt(studentGraduationYear, 10) : null,
        student_photo_url: studentPhotoUrl,
      } as any)
      .eq("user_id", user!.id);

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Perfil atualizado!", description: "Suas informações foram salvas com sucesso." });
    }

    setSaving(false);
  };

  const inputClasses = "w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary border-b border-primary-foreground/10">
        <div className="container-narrow flex items-center justify-between h-16 px-4 md:px-8">
          <Link to="/" className="font-heading text-xl font-bold text-primary-foreground">
            Ponte <span className="text-secondary">Acadêmica</span>
          </Link>
        </div>
      </header>

      <div className="container-narrow px-4 md:px-8 py-8 max-w-2xl mx-auto">
        <Link
          to="/pagamentos"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          Voltar ao painel
        </Link>

        <h1 className="font-heading text-3xl font-bold text-foreground mb-2">Meu Perfil</h1>
        <p className="text-muted-foreground mb-8">Atualize as suas informações pessoais e do aluno.</p>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Dados do encarregado de educação */}
          <section>
            <h2 className="font-heading text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <User size={20} className="text-secondary" />
              Dados do Encarregado de Educação
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
                  className={inputClasses}
                  placeholder="Seu nome completo"
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

            {/* Photo upload */}
            <div className="flex items-center gap-5 mb-6">
              <Avatar className="h-20 w-20 border-2 border-border">
                {studentPhotoUrl ? (
                  <AvatarImage src={studentPhotoUrl} alt="Foto do aluno" />
                ) : null}
                <AvatarFallback className="bg-muted text-muted-foreground">
                  <Camera size={28} />
                </AvatarFallback>
              </Avatar>
              <div>
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm font-medium text-secondary hover:text-secondary/80 transition-colors disabled:opacity-50"
                >
                  {uploading ? "Enviando..." : "Carregar foto de rosto"}
                </button>
                <p className="text-xs text-muted-foreground mt-1">JPG, PNG ou WEBP. Máx. 5MB.</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
              </div>
            </div>

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
