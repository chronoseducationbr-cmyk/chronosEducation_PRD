import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { GraduationCap, Mail, MapPin, Calendar, Camera, X } from "lucide-react";

export interface StudentData {
  studentName: string;
  studentBirthDate: string;
  studentGender: string;
  studentEmail: string;
  studentAddress: string;
  studentSchool: string;
  studentGraduationYear: string;
  studentPhotoUrl: string;
}

interface Props {
  onChange?: (data: StudentData) => void;
  validationErrors?: string[];
  initialData?: StudentData;
}

const StudentDataSection = ({ onChange, validationErrors = [], initialData }: Props) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  const [studentName, setStudentName] = useState(initialData?.studentName || "");
  const [studentBirthDate, setStudentBirthDate] = useState(initialData?.studentBirthDate || "");
  const [studentGender, setStudentGender] = useState(initialData?.studentGender || "");
  const [studentEmail, setStudentEmail] = useState(initialData?.studentEmail || "");
  const [studentAddress, setStudentAddress] = useState(initialData?.studentAddress || "");
  const [studentSchool, setStudentSchool] = useState(initialData?.studentSchool || "");
  const [studentGraduationYear, setStudentGraduationYear] = useState(initialData?.studentGraduationYear || String(new Date().getFullYear() + 3));
  const [studentPhotoUrl, setStudentPhotoUrl] = useState(initialData?.studentPhotoUrl || "");
  const [photoPreview, setPhotoPreview] = useState<string | null>(initialData?.studentPhotoUrl || null);
  const [uploading, setUploading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [birthDateError, setBirthDateError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateEmail = (email: string) => {
    if (!email.trim()) {
      setEmailError("");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setEmailError(emailRegex.test(email.trim()) ? "" : "Formato de email inválido");
  };

  useEffect(() => {
    if (initialData) {
      setLoading(false);
      return;
    }
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
        setStudentGraduationYear((data as any).student_graduation_year?.toString() || String(new Date().getFullYear() + 3));
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    onChange?.({ studentName, studentBirthDate, studentGender, studentEmail, studentAddress, studentSchool, studentGraduationYear, studentPhotoUrl });
  }, [studentName, studentBirthDate, studentGender, studentEmail, studentAddress, studentSchool, studentGraduationYear, studentPhotoUrl]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      return;
    }

    // Show local preview immediately
    const localPreview = URL.createObjectURL(file);
    setPhotoPreview(localPreview);
    setUploading(true);

    const ext = file.name.split(".").pop();
    const uniqueId = crypto.randomUUID();
    const filePath = `${user.id}/${uniqueId}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("student-photos")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      setPhotoPreview(studentPhotoUrl || null);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("student-photos")
      .getPublicUrl(filePath);

    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;
    setStudentPhotoUrl(publicUrl);
    setPhotoPreview(publicUrl);

    setUploading(false);
  };

  const handleRemovePhoto = async () => {
    setPhotoPreview(null);
    setStudentPhotoUrl("");
  };

  const inputClasses = (field?: string) => `w-full px-4 py-3 rounded-lg border ${field && validationErrors.includes(field) ? "border-destructive" : "border-border"} bg-background text-foreground text-sm focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition`;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-heading text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
        <GraduationCap size={20} className="text-secondary" />
        Dados do Aluno
      </h2>
      <div className="bg-card rounded-xl border border-border shadow-card p-5">
        {/* Photo upload */}
        <div className="flex items-center gap-4 mb-5">
          <div className="relative">
            {photoPreview ? (
              <div className="relative">
                <img
                  src={photoPreview}
                  alt="Foto do aluno"
                  className="w-20 h-20 rounded-full object-cover border-2 border-secondary/30"
                />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 hover:opacity-80 transition-opacity"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 rounded-full border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center text-muted-foreground hover:border-secondary/50 hover:text-secondary transition-colors"
              >
                <Camera size={20} />
              </button>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-background/60 rounded-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-secondary" />
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Foto do aluno <span className="text-[#F9B91D]">*</span></p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-secondary hover:underline"
            >
              {photoPreview ? "Alterar foto" : "Carregar foto"}
            </button>
            <p className="text-[10px] text-muted-foreground mt-0.5">JPG ou PNG, máx. 5MB</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handlePhotoUpload}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-foreground block mb-1.5">Nome completo do aluno <span className="text-[#F9B91D]">*</span></label>
            <input
              type="text"
              required
              maxLength={100}
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className={inputClasses("studentName")}
              placeholder="Nome completo do aluno"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Data de nascimento <span className="text-[#F9B91D]">*</span></label>
            <div className="relative">
              <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="date"
                required
                max={new Date().toISOString().split("T")[0]}
                value={studentBirthDate}
                onChange={(e) => setStudentBirthDate(e.target.value)}
                className={`${inputClasses("studentBirthDate")} pl-10`}
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Gênero <span className="text-[#F9B91D]">*</span></label>
            <select
              required
              value={studentGender}
              onChange={(e) => setStudentGender(e.target.value)}
              className={inputClasses("studentGender")}
            >
              <option value="">Selecionar...</option>
              <option value="Feminino">Feminino</option>
              <option value="Masculino">Masculino</option>
              <option value="Prefiro não dizer">Prefiro não dizer</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-foreground block mb-1.5">Email do aluno <span className="text-[#F9B91D]">*</span></label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                required
                maxLength={100}
                value={studentEmail}
                onChange={(e) => {
                  setStudentEmail(e.target.value);
                  if (emailError) validateEmail(e.target.value);
                }}
                onBlur={(e) => validateEmail(e.target.value)}
                className={`${inputClasses("studentEmail")} pl-10 ${emailError ? "border-destructive" : ""}`}
                placeholder="aluno@exemplo.com"
              />
              {emailError && (
                <p className="text-xs text-destructive mt-1">{emailError}</p>
              )}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Ano previsto para finalizar o ensino médio <span className="text-[#F9B91D]">*</span></label>
            <input
              type="number"
              required
              min={new Date().getFullYear() + 1}
              max={new Date().getFullYear() + 20}
              value={studentGraduationYear}
              onChange={(e) => setStudentGraduationYear(e.target.value)}
              className={inputClasses("studentGraduationYear")}
              placeholder={String(new Date().getFullYear() + 2)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-foreground block mb-1.5">Endereço <span className="text-[#F9B91D]">*</span></label>
            <div className="relative">
              <MapPin size={18} className="absolute left-3 top-3 text-muted-foreground" />
              <input
                type="text"
                required
                maxLength={300}
                value={studentAddress}
                onChange={(e) => setStudentAddress(e.target.value)}
                className={`${inputClasses("studentAddress")} pl-10`}
                placeholder="Endereço completo do aluno"
              />
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-foreground block mb-1.5">Escola atual <span className="text-[#F9B91D]">*</span></label>
            <input
              type="text"
              required
              maxLength={200}
              value={studentSchool}
              onChange={(e) => setStudentSchool(e.target.value)}
              className={inputClasses("studentSchool")}
              placeholder="Nome da escola atual do aluno"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDataSection;
