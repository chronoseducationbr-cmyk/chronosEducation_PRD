import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GraduationCap, Search, Upload, Download, FileText, Info, ChevronDown, ChevronUp, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";

interface Guardian {
  full_name: string;
  email: string | null;
  phone: string | null;
}

interface Enrollment {
  id: string;
  user_id: string;
  student_name: string;
  student_email: string | null;
  student_birth_date: string | null;
  student_address: string | null;
  student_school: string | null;
  student_graduation_year: number | null;
  referred_by_email: string | null;
  status: string;
  created_at: string;
  inscription_fee_cents: number;
  tuition_installment_cents: number;
  tuition_installments: number;
  summercamp_installment_cents: number;
  summercamp_installments: number;
  contract_url: string | null;
  contract_sent_at: string | null;
  contract_signed_at: string | null;
  guardian?: Guardian;
}

const statuses = [
  "Aguarda assinatura de contrato",
  "Contrato assinado",
  "Em curso",
  "Concluído",
  "Cancelado",
];

const statusColors: Record<string, string> = {
  "Aguarda assinatura de contrato": "bg-amber-100 text-amber-800",
  "Contrato assinado": "bg-blue-100 text-blue-800",
  "Em curso": "bg-green-100 text-green-800",
  "Concluído": "bg-emerald-100 text-emerald-800",
  "Cancelado": "bg-red-100 text-red-800",
};

const AdminEnrollmentsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetId, setUploadTargetId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("enrollments")
      .select("*")
      .order("created_at", { ascending: false });
    const enrs = (data as Enrollment[]) || [];

    // Fetch guardian info from profiles
    const userIds = [...new Set(enrs.map((e) => e.user_id))];
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, phone")
        .in("user_id", userIds);
      const guardianMap: Record<string, Guardian> = {};
      (profiles || []).forEach((p: any) => {
        guardianMap[p.user_id] = { full_name: p.full_name, email: p.email, phone: p.phone };
      });
      enrs.forEach((e) => {
        e.guardian = guardianMap[e.user_id];
      });
    }

    setEnrollments(enrs);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const updates: any = { status };
    // Auto-set contract_signed_at when status changes to "Contrato assinado"
    if (status === "Contrato assinado") {
      updates.contract_signed_at = new Date().toISOString();
    }
    const { error } = await supabase
      .from("enrollments")
      .update(updates)
      .eq("id", id);
    if (error) {
      toast({ title: "Erro ao atualizar estado", variant: "destructive" });
    } else {
      toast({ title: `Estado alterado para "${status}"` });
      setEnrollments((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
      );
    }
  };

  const handleUploadContract = async (file: File) => {
    if (!uploadTargetId) return;
    const filePath = `contracts/${uploadTargetId}/${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("contracts")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Erro no upload", description: uploadError.message, variant: "destructive" });
      return;
    }

    const { data: urlData } = supabase.storage.from("contracts").getPublicUrl(filePath);
    const { error } = await supabase
      .from("enrollments")
      .update({
        contract_url: urlData.publicUrl,
        contract_sent_at: new Date().toISOString(),
      } as any)
      .eq("id", uploadTargetId);

    if (error) {
      toast({ title: "Erro ao guardar contrato", variant: "destructive" });
    } else {
      toast({ title: "Contrato carregado com sucesso" });
      setEnrollments((prev) =>
        prev.map((e) =>
          e.id === uploadTargetId
            ? { ...e, contract_url: urlData.publicUrl, contract_sent_at: new Date().toISOString() }
            : e
        )
      );
    }
    setUploadTargetId(null);
  };

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    const dt = new Date(d);
    return `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}/${dt.getFullYear()}`;
  };

  const filtered = enrollments.filter(
    (e) =>
      e.student_name.toLowerCase().includes(search.toLowerCase()) ||
      (e.student_email?.toLowerCase() || "").includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Inscrições</h1>
          <p className="text-sm text-muted-foreground">{enrollments.length} inscrições registadas</p>
        </div>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Pesquisar por nome ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".pdf,.doc,.docx"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUploadContract(file);
          e.target.value = "";
        }}
      />

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((e) => {
            const isExpanded = expandedId === e.id;
            return (
              <div
                key={e.id}
                className={`bg-card rounded-xl border-2 overflow-hidden transition-colors ${isExpanded ? "border-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.2)]" : "border-border"}`}
              >
                {/* Collapsed row: name + status badge + select + expand */}
                <div className="flex items-center gap-3 p-4">
                  <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
                    <GraduationCap size={20} />
                  </div>
                  <div className="flex-1 min-w-0 flex items-center gap-3 flex-wrap">
                    <p className="font-semibold text-foreground">{e.student_name || "Sem nome"}</p>
                    {e.guardian && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted hover:bg-muted-foreground/20 transition-colors" title="Dados do responsável">
                            <Info size={12} className="text-muted-foreground" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-3" side="right">
                          <p className="text-xs font-semibold text-muted-foreground mb-2">Responsável</p>
                          <div className="space-y-1.5 text-sm">
                            <div>
                              <span className="text-muted-foreground text-xs">Nome:</span>{" "}
                              <span className="text-foreground font-medium">{e.guardian.full_name || "—"}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-xs">Email:</span>{" "}
                              <span className="text-foreground font-medium">{e.guardian.email || "—"}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-xs">Telefone:</span>{" "}
                              <span className="text-foreground font-medium">{e.guardian.phone || "—"}</span>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[e.status] || "bg-muted text-muted-foreground"}`}>
                      {e.status}
                    </span>
                  </div>
                  <div className="shrink-0 w-48" onClick={(ev) => ev.stopPropagation()}>
                    <Select value={e.status} onValueChange={(v) => updateStatus(e.id, v)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map((s) => (
                          <SelectItem key={s} value={s} className="text-xs">
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : e.id)}
                    className="shrink-0 p-1 rounded hover:bg-muted transition-colors"
                  >
                    {isExpanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                  </button>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-border">
                    <p className="text-xs text-muted-foreground mt-3 mb-3">{e.student_email || "—"} · Inscrito em {formatDate(e.created_at)}</p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Escola:</span>{" "}
                        <span className="text-foreground font-medium">{e.student_school || "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Ano conclusão:</span>{" "}
                        <span className="text-foreground font-medium">{e.student_graduation_year || "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Indicação:</span>{" "}
                        <span className="text-foreground font-medium">{e.referred_by_email || "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Morada:</span>{" "}
                        <span className="text-foreground font-medium">{e.student_address || "—"}</span>
                      </div>
                    </div>

                    {/* Contract section */}
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Contrato</p>
                      <div className="flex items-center gap-4 text-xs flex-wrap">
                        <div>
                          <span className="text-muted-foreground">Enviado:</span>{" "}
                          <span className="text-foreground font-medium">{formatDate(e.contract_sent_at)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Assinado:</span>{" "}
                          <span className="text-foreground font-medium">{formatDate(e.contract_signed_at)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {e.contract_url ? (
                            <a
                              href={e.contract_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-secondary hover:text-secondary/80 font-medium"
                            >
                              <Download size={12} />
                              Ver contrato
                            </a>
                          ) : (
                            <span className="text-muted-foreground inline-flex items-center gap-1">
                              <FileText size={12} />
                              Sem contrato
                            </span>
                          )}
                          <button
                            onClick={() => {
                              setUploadTargetId(e.id);
                              fileInputRef.current?.click();
                            }}
                            className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                            title="Upload contrato"
                          >
                            <Upload size={12} />
                            Upload
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-8">Nenhuma inscrição encontrada.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminEnrollmentsPage;
