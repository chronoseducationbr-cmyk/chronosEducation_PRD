import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Users, Mail, Phone, FileText, ChevronDown, ChevronUp, MapPin } from "lucide-react";
import NationalityCombobox from "@/components/NationalityCombobox";

export interface GuardianData {
  fullName: string;
  email: string;
  phone: string;
  cpf: string;
  nationality: string;
  civilStatus: string;
  profession: string;
  rgNumber: string;
  guardianAddress: string;
}

interface Props {
  onChange?: (data: GuardianData) => void;
  validationErrors?: string[];
  initialData?: GuardianData;
}

const GuardianDataSection = ({ onChange, validationErrors = [], initialData }: Props) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasEnrollments, setHasEnrollments] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const [fullName, setFullName] = useState(initialData?.fullName || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [phone, setPhone] = useState(initialData?.phone || "");
  const [cpf, setCpf] = useState(initialData?.cpf || "");
  const [nationality, setNationality] = useState(initialData?.nationality || "");
  const [civilStatus, setCivilStatus] = useState(initialData?.civilStatus || "");
  const [profession, setProfession] = useState(initialData?.profession || "");
  const [rgNumber, setRgNumber] = useState(initialData?.rgNumber || "");
  const [guardianAddress, setGuardianAddress] = useState(initialData?.guardianAddress || "");

  useEffect(() => {
    if (initialData && (initialData.fullName || initialData.email)) {
      setLoading(false);
      return;
    }
    const fetchData = async () => {
      const [profileRes, enrollRes] = await Promise.all([
        supabase.from("profiles").select("full_name, email, phone, cpf, nationality, civil_status, profession, rg_number, guardian_address").eq("user_id", user!.id).maybeSingle(),
        supabase.from("enrollments").select("id").eq("user_id", user!.id).limit(1),
      ]);

      if (profileRes.data) {
        const p = profileRes.data as any;
        setFullName(p.full_name || user?.user_metadata?.full_name || "");
        setEmail(p.email || user?.email || "");
        setPhone(p.phone || "");
        setCpf(p.cpf || "");
        setNationality(p.nationality || "");
        setCivilStatus(p.civil_status || "");
        setProfession(p.profession || "");
        setRgNumber(p.rg_number || "");
        setGuardianAddress(p.guardian_address || "");
      } else {
        setFullName(user?.user_metadata?.full_name || "");
        setEmail(user?.email || "");
      }

      setHasEnrollments((enrollRes.data?.length ?? 0) > 0);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const saveProfile = async (fields: Record<string, string>) => {
    if (!user) return;
    await supabase.from("profiles").update(fields as any).eq("user_id", user.id);
  };

  useEffect(() => {
    onChange?.({ fullName, email, phone, cpf, nationality, civilStatus, profession, rgNumber, guardianAddress });
  }, [fullName, email, phone, cpf, nationality, civilStatus, profession, rgNumber, guardianAddress]);

  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits.length ? `(${digits}` : "";
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const inputClass = (field?: string) => `w-full px-4 py-3 rounded-lg border ${field && validationErrors.includes(field) ? "border-destructive" : "border-border"} bg-background text-foreground text-sm focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition`;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  const isCollapsed = hasEnrollments && !expanded;

  return (
    <div>
      <h2 className="font-heading text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
        <Users size={20} className="text-secondary" />
        Dados Pai/Mãe ou Responsável
      </h2>

      {isCollapsed ? (
        <button
          onClick={() => setExpanded(true)}
          className="w-full bg-card rounded-xl border border-border shadow-card p-5 flex items-center justify-between hover:bg-muted/30 transition-colors text-left"
        >
          <div>
            <p className="text-sm text-muted-foreground">Responsável</p>
            <p className="font-medium text-foreground">{fullName || "—"}</p>
          </div>
          <ChevronDown size={18} className="text-muted-foreground shrink-0" />
        </button>
      ) : (
        <div className="bg-card rounded-xl border border-border shadow-card p-5">
          {hasEnrollments && (
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setExpanded(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronUp size={18} />
              </button>
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-foreground block mb-1.5">Nome completo <span className="text-[#F9B91D]">*</span></label>
              <input
                type="text"
                maxLength={100}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onBlur={() => saveProfile({ full_name: fullName.trim() })}
                className={inputClass("guardianFullName")}
                placeholder="Nome completo do responsável"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Nacionalidade <span className="text-[#F9B91D]">*</span></label>
              <NationalityCombobox
                value={nationality}
                onChange={(val) => setNationality(val)}
                onBlur={() => saveProfile({ nationality: nationality.trim() })}
                className={inputClass("guardianNationality")}
                placeholder="Ex: Brasileira"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Estado Civil <span className="text-[#F9B91D]">*</span></label>
              <select
                value={civilStatus}
                onChange={(e) => {
                  setCivilStatus(e.target.value);
                  saveProfile({ civil_status: e.target.value });
                }}
                className={inputClass("guardianCivilStatus")}
              >
                <option value="">Selecione...</option>
                <option value="Solteiro(a)">Solteiro(a)</option>
                <option value="Casado(a)">Casado(a)</option>
                <option value="Viúvo(a)">Viúvo(a)</option>
                <option value="Divorciado(a)">Divorciado(a)</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-foreground block mb-1.5">Profissão <span className="text-[#F9B91D]">*</span></label>
              <input
                type="text"
                maxLength={60}
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                onBlur={() => saveProfile({ profession: profession.trim() })}
                className={inputClass("guardianProfession")}
                placeholder="Ex: Engenheiro(a)"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-foreground block mb-1.5">Email <span className="text-[#F9B91D]">*</span></label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  maxLength={100}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => saveProfile({ email: email.trim() })}
                  className={`${inputClass("guardianEmail")} pl-10`}
                  placeholder="email@exemplo.com"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Celular <span className="text-[#F9B91D]">*</span></label>
              <div className="relative">
                <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="tel"
                  maxLength={20}
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  onBlur={() => saveProfile({ phone: phone.trim() })}
                  className={`${inputClass("guardianPhone")} pl-10`}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">CPF <span className="text-[#F9B91D]">*</span></label>
              <div className="relative">
                <FileText size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={cpf}
                  onChange={(e) => setCpf(formatCpf(e.target.value))}
                  className={`${inputClass("guardianCpf")} pl-10`}
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Nº RG <span className="text-[#F9B91D]">*</span></label>
              <div className="relative">
                <FileText size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  maxLength={20}
                  value={rgNumber}
                  onChange={(e) => setRgNumber(e.target.value)}
                  onBlur={() => saveProfile({ rg_number: rgNumber.trim() })}
                  className={`${inputClass("guardianRgNumber")} pl-10`}
                  placeholder="Número do RG"
                />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-foreground block mb-1.5">Endereço <span className="text-[#F9B91D]">*</span></label>
              <div className="relative">
                <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  maxLength={200}
                  value={guardianAddress}
                  onChange={(e) => setGuardianAddress(e.target.value)}
                  onBlur={() => saveProfile({ guardian_address: guardianAddress.trim() })}
                  className={`${inputClass("guardianAddress")} pl-10`}
                  placeholder="Endereço completo"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuardianDataSection;
