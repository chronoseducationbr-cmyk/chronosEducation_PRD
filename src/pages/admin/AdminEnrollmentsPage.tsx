import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GraduationCap, Search, Upload, Download, FileText, Info, ChevronDown, ChevronUp, CreditCard } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetId, setUploadTargetId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pendingStatusChange, setPendingStatusChange] = useState<{ id: string; studentName: string; from: string; to: string } | null>(null);

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

  // Auto-expand student from URL param
  useEffect(() => {
    const studentId = searchParams.get("student");
    if (studentId && !loading && enrollments.length > 0 && !expandedId) {
      setExpandedId(studentId);
    }
  }, [searchParams, loading, enrollments]);

  const confirmStatusChange = async () => {
    if (!pendingStatusChange) return;
    const { id, to: status } = pendingStatusChange;
    const updates: any = { status };
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
    setPendingStatusChange(null);
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

  const filtered = enrollments
    .filter(
      (e) =>
        e.student_name.toLowerCase().includes(search.toLowerCase()) ||
        (e.student_email?.toLowerCase() || "").includes(search.toLowerCase())
    )
    .sort((a, b) => a.student_name.localeCompare(b.student_name, "pt"));

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
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : e.id)}
                >
                  <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
                    <GraduationCap size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
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
                    </div>
                    <p className="text-xs text-muted-foreground">{e.student_email || "—"}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap text-[11px] text-muted-foreground">
                      <span>Inscrição: <span className="font-medium text-foreground">{(e.inscription_fee_cents / 100).toFixed(2)}€</span></span>
                      <span>Online: <span className="font-medium text-foreground">{e.tuition_installments}x {(e.tuition_installment_cents / 100).toFixed(2)}€</span></span>
                      <span>Summer: <span className="font-medium text-foreground">{e.summercamp_installments}x {(e.summercamp_installment_cents / 100).toFixed(2)}€</span></span>
                    </div>
                  </div>
                  <span className={`shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full ${statusColors[e.status] || "bg-muted text-muted-foreground"}`}>
                    {e.status}
                  </span>
                  <button
                    onClick={() => navigate(`/admin/pagamentos?student=${e.id}`)}
                    className="shrink-0 p-1 rounded hover:bg-muted transition-colors"
                    title="Ver pagamentos"
                  >
                    <CreditCard size={16} className="text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : e.id)}
                    className="shrink-0 p-1 rounded hover:bg-muted transition-colors"
                  >
                    {isExpanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                  </button>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-border space-y-4">
                    {/* Dados do Aluno */}
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Dados do Aluno</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">Email</p>
                          <p className="text-foreground font-medium">{e.student_email || "—"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Data de nascimento</p>
                          <p className="text-foreground font-medium">{e.student_birth_date ? formatDate(e.student_birth_date) : "—"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Escola</p>
                          <p className="text-foreground font-medium">{e.student_school || "—"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Ano de conclusão</p>
                          <p className="text-foreground font-medium">{e.student_graduation_year || "—"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Morada</p>
                          <p className="text-foreground font-medium">{e.student_address || "—"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Indicação</p>
                          <p className="text-foreground font-medium">{e.referred_by_email || "—"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Dados do Responsável */}
                    {e.guardian && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Responsável (Pai/Mãe)</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                          <div>
                            <p className="text-muted-foreground text-xs">Nome</p>
                            <p className="text-foreground font-medium">{e.guardian.full_name || "—"}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Email</p>
                            <p className="text-foreground font-medium">{e.guardian.email || "—"}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Telefone</p>
                            <p className="text-foreground font-medium">{e.guardian.phone || "—"}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Inscrição */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Inscrição</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">Data de inscrição</p>
                          <p className="text-foreground font-medium">{formatDate(e.created_at)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Alterar estado</p>
                          <div className="mt-1">
                            <Select
                              value={e.status}
                              onValueChange={(v) => {
                                if (v !== e.status) {
                                  setPendingStatusChange({ id: e.id, studentName: e.student_name, from: e.status, to: v });
                                }
                              }}
                            >
                              <SelectTrigger className="h-8 text-xs w-56">
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
                        </div>
                      </div>
                    </div>

                    {/* Contrato */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Contrato</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">Enviado em</p>
                          <p className="text-foreground font-medium">{formatDate(e.contract_sent_at)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Assinado em</p>
                          <p className="text-foreground font-medium">{formatDate(e.contract_signed_at)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Documento</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {e.contract_url ? (
                              <a
                                href={e.contract_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-secondary hover:text-secondary/80 font-medium text-sm"
                              >
                                <Download size={14} />
                                Ver contrato
                              </a>
                            ) : (
                              <span className="text-muted-foreground inline-flex items-center gap-1 text-sm italic">
                                <FileText size={14} />
                                Sem contrato
                              </span>
                            )}
                            <button
                              onClick={() => {
                                setUploadTargetId(e.id);
                                fileInputRef.current?.click();
                              }}
                              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors text-sm"
                              title="Upload contrato"
                            >
                              <Upload size={14} />
                              Upload
                            </button>
                          </div>
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

      <AlertDialog open={!!pendingStatusChange} onOpenChange={(open) => { if (!open) setPendingStatusChange(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar alteração de estado</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja alterar o estado de <span className="font-semibold">{pendingStatusChange?.studentName}</span> de{" "}
              <span className="font-semibold">"{pendingStatusChange?.from}"</span> para{" "}
              <span className="font-semibold">"{pendingStatusChange?.to}"</span>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminEnrollmentsPage;
