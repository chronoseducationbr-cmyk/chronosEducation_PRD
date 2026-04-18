import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Users, Mail, Phone, FileText, ChevronDown, ChevronUp, MapPin, Pencil, Check, X } from "lucide-react";
import NationalityCombobox from "@/components/NationalityCombobox";
import CivilStatusCombobox from "@/components/CivilStatusCombobox";
import { useToast } from "@/hooks/use-toast";

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
  /**
   * "profile" (default): persists to public.profiles (pai/mãe da conta).
   * "memory": only reports changes via onChange, does NOT persist anywhere.
   */
  mode?: "profile" | "memory";
  /** Custom heading title. Defaults to "Dados Pai/Mãe ou Responsável". */
  title?: string;
  /** Hide the section heading entirely. */
  hideHeading?: boolean;
  /** Disable collapsed/expanded behaviour and always show the form. */
  alwaysExpanded?: boolean;
  /** Custom prefix used to build validation error keys (e.g. "contractGuardian"). Defaults to "guardian". */
  errorPrefix?: string;
  /**
   * When true (only in "profile" mode): fields are read-only until the user clicks "Editar".
   * Changes are buffered locally and only persisted when the user clicks "Guardar".
   * "Cancelar" reverts to the last saved values.
   */
  requireExplicitSave?: boolean;
  /**
   * When true: hides Nationality, Civil Status, Profession, CPF, and RG fields.
   * Used for the parent/guardian profile, where this data is only collected per-enrollment
   * via the contract guardian step.
   */
  simplified?: boolean;
}

const GuardianDataSection = ({
  onChange,
  validationErrors = [],
  initialData,
  mode = "profile",
  title = "Dados Pai/Mãe ou Responsável",
  hideHeading = false,
  alwaysExpanded = false,
  errorPrefix = "guardian",
  requireExplicitSave = false,
}: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(mode === "profile");
  const [hasEnrollments, setHasEnrollments] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(!requireExplicitSave);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState(initialData?.fullName || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [phone, setPhone] = useState(initialData?.phone || "");
  const [cpf, setCpf] = useState(initialData?.cpf || "");
  const [nationality, setNationality] = useState(initialData?.nationality || "Brasileira");
  const [civilStatus, setCivilStatus] = useState(initialData?.civilStatus || "Casado(a)");
  const [profession, setProfession] = useState(initialData?.profession || "");
  const [rgNumber, setRgNumber] = useState(initialData?.rgNumber || "");
  const [guardianAddress, setGuardianAddress] = useState(initialData?.guardianAddress || "");

  // Snapshot of last saved values, used to revert on Cancel
  const savedRef = useRef<GuardianData>({
    fullName: initialData?.fullName || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    cpf: initialData?.cpf || "",
    nationality: initialData?.nationality || "Brasileira",
    civilStatus: initialData?.civilStatus || "Casado(a)",
    profession: initialData?.profession || "",
    rgNumber: initialData?.rgNumber || "",
    guardianAddress: initialData?.guardianAddress || "",
  });

  useEffect(() => {
    if (mode === "memory") {
      setLoading(false);
      return;
    }
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
        const loaded: GuardianData = {
          fullName: p.full_name || user?.user_metadata?.full_name || "",
          email: p.email || user?.email || "",
          phone: p.phone || "",
          cpf: p.cpf || "",
          nationality: p.nationality || "Brasileira",
          civilStatus: p.civil_status || "Casado(a)",
          profession: p.profession || "",
          rgNumber: p.rg_number || "",
          guardianAddress: p.guardian_address || "",
        };
        setFullName(loaded.fullName);
        setEmail(loaded.email);
        setPhone(loaded.phone);
        setCpf(loaded.cpf);
        setNationality(loaded.nationality);
        setCivilStatus(loaded.civilStatus);
        setProfession(loaded.profession);
        setRgNumber(loaded.rgNumber);
        setGuardianAddress(loaded.guardianAddress);
        savedRef.current = loaded;

        // Persist defaults if not yet saved
        const updates: Record<string, string> = {};
        if (!p.nationality) updates.nationality = loaded.nationality;
        if (!p.civil_status) updates.civil_status = loaded.civilStatus;
        if (Object.keys(updates).length > 0) {
          supabase.from("profiles").update(updates as any).eq("user_id", user!.id).then(() => {});
        }
      } else {
        const fn = user?.user_metadata?.full_name || "";
        const em = user?.email || "";
        setFullName(fn);
        setEmail(em);
        savedRef.current = { ...savedRef.current, fullName: fn, email: em };
        // Save defaults for new profile
        supabase.from("profiles").update({ nationality: "Brasileira", civil_status: "Casado(a)" } as any).eq("user_id", user!.id).then(() => {});
      }

      setHasEnrollments((enrollRes.data?.length ?? 0) > 0);
      setLoading(false);
    };
    fetchData();
  }, [user, mode]);

  // Save all unsaved fields on unmount (only in profile mode)
  const latestRef = useRef({ fullName, email, phone, cpf, nationality, civilStatus, profession, rgNumber, guardianAddress });
  useEffect(() => {
    latestRef.current = { fullName, email, phone, cpf, nationality, civilStatus, profession, rgNumber, guardianAddress };
  }, [fullName, email, phone, cpf, nationality, civilStatus, profession, rgNumber, guardianAddress]);

  useEffect(() => {
    return () => {
      if (mode !== "profile") return;
      if (requireExplicitSave) return; // explicit-save mode never auto-persists
      if (!user) return;
      const d = latestRef.current;
      supabase.from("profiles").update({
        full_name: d.fullName.trim(),
        email: d.email.trim(),
        phone: d.phone.trim(),
        cpf: d.cpf.trim(),
        nationality: d.nationality.trim(),
        civil_status: d.civilStatus.trim(),
        profession: d.profession.trim(),
        rg_number: d.rgNumber.trim(),
        guardian_address: d.guardianAddress.trim(),
      } as any).eq("user_id", user.id).then(() => {});
    };
  }, [user, mode, requireExplicitSave]);

  const saveProfile = async (fields: Record<string, string>) => {
    if (mode !== "profile") return;
    if (requireExplicitSave) return; // do nothing on blur in explicit-save mode
    if (!user) return;
    await supabase.from("profiles").update(fields as any).eq("user_id", user.id);
  };

  const handleSaveAll = async () => {
    if (!user) return;
    setSaving(true);
    const data: GuardianData = { fullName, email, phone, cpf, nationality, civilStatus, profession, rgNumber, guardianAddress };
    const { error } = await supabase.from("profiles").update({
      full_name: data.fullName.trim(),
      email: data.email.trim(),
      phone: data.phone.trim(),
      cpf: data.cpf.trim(),
      nationality: data.nationality.trim(),
      civil_status: data.civilStatus.trim(),
      profession: data.profession.trim(),
      rg_number: data.rgNumber.trim(),
      guardian_address: data.guardianAddress.trim(),
    } as any).eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao guardar", description: error.message, variant: "destructive" });
      return;
    }
    savedRef.current = data;
    setEditing(false);
    toast({ title: "Dados guardados", description: "Os dados do responsável foram atualizados." });
  };

  const handleCancelEdit = () => {
    const s = savedRef.current;
    setFullName(s.fullName);
    setEmail(s.email);
    setPhone(s.phone);
    setCpf(s.cpf);
    setNationality(s.nationality);
    setCivilStatus(s.civilStatus);
    setProfession(s.profession);
    setRgNumber(s.rgNumber);
    setGuardianAddress(s.guardianAddress);
    setEditing(false);
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

  const errKey = (suffix: string) => `${errorPrefix}${suffix}`;
  const isReadOnly = requireExplicitSave && !editing;
  const inputClass = (field?: string) => `w-full px-4 py-3 rounded-lg border ${field && validationErrors.includes(field) ? "border-destructive" : "border-border"} bg-background text-foreground text-sm focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition ${isReadOnly ? "opacity-70 cursor-not-allowed bg-muted/30" : ""}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  const isCollapsed = !alwaysExpanded && hasEnrollments && !expanded;

  return (
    <div>
      {!hideHeading && (
        <h2 className="font-heading text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
          <Users size={20} className="text-secondary" />
          {title}
        </h2>
      )}

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
          {(requireExplicitSave || (!alwaysExpanded && hasEnrollments)) && (
            <div className="flex justify-end items-center gap-2 mb-4">
              {requireExplicitSave && !editing && (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-foreground border border-border hover:bg-muted/40 transition-colors"
                >
                  <Pencil size={14} />
                  Editar
                </button>
              )}
              {requireExplicitSave && editing && (
                <>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-foreground border border-border hover:bg-muted/40 transition-colors disabled:opacity-50"
                  >
                    <X size={14} />
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAll}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    <Check size={14} />
                    {saving ? "A guardar..." : "Guardar"}
                  </button>
                </>
              )}
              {!alwaysExpanded && hasEnrollments && !editing && (
                <button
                  onClick={() => setExpanded(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors ml-1"
                >
                  <ChevronUp size={18} />
                </button>
              )}
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
                className={inputClass(errKey("FullName"))}
                placeholder="Nome completo do responsável"
                disabled={isReadOnly}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Nacionalidade <span className="text-[#F9B91D]">*</span></label>
              <div className={isReadOnly ? "pointer-events-none opacity-70" : ""}>
                <NationalityCombobox
                  value={nationality}
                  onChange={(val) => {
                    setNationality(val);
                    if (val) saveProfile({ nationality: val.trim() });
                  }}
                  className={inputClass(errKey("Nationality"))}
                  placeholder="Ex: Brasileira"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Estado Civil <span className="text-[#F9B91D]">*</span></label>
              <div className={isReadOnly ? "pointer-events-none opacity-70" : ""}>
                <CivilStatusCombobox
                  value={civilStatus}
                  onChange={(val) => {
                    setCivilStatus(val);
                    if (val) saveProfile({ civil_status: val });
                  }}
                  className={inputClass(errKey("CivilStatus"))}
                />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-foreground block mb-1.5">Profissão <span className="text-[#F9B91D]">*</span></label>
              <input
                type="text"
                maxLength={60}
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                onBlur={() => saveProfile({ profession: profession.trim() })}
                className={inputClass(errKey("Profession"))}
                placeholder="Ex: Engenheiro(a)"
                disabled={isReadOnly}
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
                  className={`${inputClass(errKey("Email"))} pl-10`}
                  placeholder="email@exemplo.com"
                  disabled={isReadOnly}
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
                  className={`${inputClass(errKey("Phone"))} pl-10`}
                  placeholder="(11) 99999-9999"
                  disabled={isReadOnly}
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
                  onBlur={() => saveProfile({ cpf: cpf.trim() })}
                  className={`${inputClass(errKey("Cpf"))} pl-10`}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  disabled={isReadOnly}
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
                  className={`${inputClass(errKey("RgNumber"))} pl-10`}
                  placeholder="Número do RG"
                  disabled={isReadOnly}
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
                  className={`${inputClass(errKey("Address"))} pl-10`}
                  placeholder="Endereço completo"
                  disabled={isReadOnly}
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
