import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Users, Mail, Phone, FileText, ChevronDown, ChevronUp } from "lucide-react";

export interface GuardianData {
  fullName: string;
  email: string;
  phone: string;
  cpf: string;
}

interface Props {
  onChange?: (data: GuardianData) => void;
  validationErrors?: string[];
}

const GuardianDataSection = ({ onChange, validationErrors = [] }: Props) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasEnrollments, setHasEnrollments] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const [profileRes, enrollRes] = await Promise.all([
        supabase.from("profiles").select("full_name, email, phone").maybeSingle(),
        supabase.from("enrollments").select("id").limit(1),
      ]);

      if (profileRes.data) {
        setFullName(profileRes.data.full_name || user?.user_metadata?.full_name || "");
        setEmail(profileRes.data.email || user?.email || "");
        setPhone(profileRes.data.phone || "");
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
    onChange?.({ fullName, email, phone, cpf });
  }, [fullName, email, phone, cpf]);

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
                  className={`${inputClass("guardianPhone")} pl-10`}
                  placeholder="(11) 99999-9999"
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
                  className={`${inputClass("guardianCpf")} pl-10`}
                  placeholder="000.000.000-00"
                  maxLength={14}
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
