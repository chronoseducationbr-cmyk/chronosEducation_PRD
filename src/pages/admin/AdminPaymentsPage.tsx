import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, Upload, Download, FileText, CheckCircle2, Clock, AlertCircle, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Enrollment {
  id: string;
  student_name: string;
  student_email: string | null;
  inscription_fee_cents: number;
  tuition_installment_cents: number;
  tuition_installments: number;
  summercamp_installment_cents: number;
  summercamp_installments: number;
}

interface Installment {
  id: string;
  enrollment_id: string;
  type: string;
  installment_number: number;
  due_date: string | null;
  paid_at: string | null;
  status: string;
  boleto_url: string | null;
  amount_cents: number;
}

const typeLabels: Record<string, string> = {
  inscription_fee: "Inscrição",
  tuition: "Aulas Online",
  summercamp: "Summer Camp",
};

const statusConfig: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  pending: { label: "Pendente", icon: Clock, color: "bg-amber-100 text-amber-800" },
  paid: { label: "Pago", icon: CheckCircle2, color: "bg-green-100 text-green-800" },
  overdue: { label: "Em atraso", icon: AlertCircle, color: "bg-red-100 text-red-800" },
};

const AdminPaymentsPage = () => {
  const { toast } = useToast();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [installments, setInstallments] = useState<Record<string, Installment[]>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({ type: "tuition", count: "1", startDate: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("enrollments")
      .select("*")
      .order("created_at", { ascending: false });
    setEnrollments((data as Enrollment[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const loadInstallments = async (enrollmentId: string) => {
    const { data } = await supabase
      .from("installments")
      .select("*")
      .eq("enrollment_id", enrollmentId)
      .order("type")
      .order("installment_number", { ascending: true });
    setInstallments((prev) => ({ ...prev, [enrollmentId]: (data as Installment[]) || [] }));
  };

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      if (!installments[id]) loadInstallments(id);
    }
  };

  const updateInstallmentStatus = async (instId: string, enrollmentId: string, status: string) => {
    const updates: any = { status };
    if (status === "paid") updates.paid_at = new Date().toISOString();
    else updates.paid_at = null;

    const { error } = await supabase.from("installments").update(updates).eq("id", instId);
    if (error) {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    } else {
      toast({ title: "Estado atualizado" });
      loadInstallments(enrollmentId);
    }
  };

  const handleUploadBoleto = async (file: File) => {
    if (!uploadTarget) return;
    const instId = uploadTarget;
    const enrollmentId = Object.keys(installments).find((eid) =>
      installments[eid]?.some((i) => i.id === instId)
    );

    const filePath = `boletos/${instId}/${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("boletos")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Erro no upload", description: uploadError.message, variant: "destructive" });
      return;
    }

    const { data: urlData } = supabase.storage.from("boletos").getPublicUrl(filePath);
    const { error } = await supabase
      .from("installments")
      .update({ boleto_url: urlData.publicUrl } as any)
      .eq("id", instId);

    if (error) {
      toast({ title: "Erro ao guardar URL", variant: "destructive" });
    } else {
      toast({ title: "Boleto carregado com sucesso" });
      if (enrollmentId) loadInstallments(enrollmentId);
    }
    setUploadTarget(null);
  };

  const handleCreateInstallments = async () => {
    if (!showCreateDialog || !createForm.startDate) return;
    const count = parseInt(createForm.count, 10);
    if (!count || count < 1) return;

    // Get amount from enrollment based on type
    const enrollment = enrollments.find((e) => e.id === showCreateDialog);
    let amountCents = 0;
    if (enrollment) {
      if (createForm.type === "inscription_fee") amountCents = enrollment.inscription_fee_cents;
      else if (createForm.type === "tuition") amountCents = enrollment.tuition_installment_cents;
      else if (createForm.type === "summercamp") amountCents = enrollment.summercamp_installment_cents;
    }

    const rows = Array.from({ length: count }, (_, i) => {
      const date = new Date(createForm.startDate);
      date.setMonth(date.getMonth() + i);
      return {
        enrollment_id: showCreateDialog,
        type: createForm.type,
        installment_number: i + 1,
        due_date: date.toISOString().split("T")[0],
        status: "pending",
        amount_cents: amountCents,
      };
    });

    const { error } = await supabase.from("installments").insert(rows as any);
    if (error) {
      toast({ title: "Erro ao criar prestações", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `${count} prestações criadas` });
      loadInstallments(showCreateDialog);
    }
    setShowCreateDialog(null);
    setCreateForm({ type: "tuition", count: "1", startDate: "" });
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
      <h1 className="font-heading text-2xl font-bold text-foreground mb-1">Pagamentos</h1>
      <p className="text-sm text-muted-foreground mb-6">Gerir prestações e boletos de cada aluno.</p>

      <div className="relative mb-4 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Pesquisar por nome ou email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUploadBoleto(file);
          e.target.value = "";
        }}
      />

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((e) => {
            const isExpanded = expandedId === e.id;
            const insts = installments[e.id] || [];

            return (
              <div key={e.id} className="bg-card rounded-xl border border-border overflow-hidden">
                <button
                  onClick={() => toggleExpand(e.id)}
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">{e.student_name}</p>
                    <p className="text-xs text-muted-foreground">{e.student_email || "—"}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{insts.length || "—"} prestações</span>
                  {isExpanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-border">
                    <div className="flex items-center justify-between mt-3 mb-3">
                      <p className="text-sm font-bold text-foreground uppercase tracking-wide">Prestações</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowCreateDialog(e.id)}
                        className="text-xs"
                      >
                        <Plus size={14} className="mr-1" />
                        Criar Prestações
                      </Button>
                    </div>

                    {insts.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Sem prestações registadas.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left py-2 pr-2 text-muted-foreground font-medium">Tipo</th>
                              <th className="text-left py-2 pr-2 text-muted-foreground font-medium">#</th>
                              <th className="text-left py-2 pr-2 text-muted-foreground font-medium">Valor</th>
                              <th className="text-left py-2 pr-2 text-muted-foreground font-medium">Vencimento</th>
                              <th className="text-left py-2 pr-2 text-muted-foreground font-medium">Pago em</th>
                              <th className="text-left py-2 pr-2 text-muted-foreground font-medium">Estado</th>
                              <th className="text-left py-2 text-muted-foreground font-medium">Boleto</th>
                            </tr>
                          </thead>
                          <tbody>
                            {insts.map((inst) => {
                              const cfg = statusConfig[inst.status] || statusConfig.pending;
                              const StatusIcon = cfg.icon;

                              return (
                                <tr key={inst.id} className="border-b border-border/50 last:border-0">
                                  <td className="py-2 pr-2 text-foreground font-medium">{typeLabels[inst.type] || inst.type}</td>
                                  <td className="py-2 pr-2 text-foreground">{inst.installment_number}</td>
                                  <td className="py-2 pr-2 text-foreground font-medium">{inst.amount_cents > 0 ? `$${(inst.amount_cents / 100).toFixed(0)}` : "—"}</td>
                                  <td className="py-2 pr-2 text-foreground">{formatDate(inst.due_date)}</td>
                                  <td className="py-2 pr-2 text-foreground">{formatDate(inst.paid_at)}</td>
                                  <td className="py-2 pr-2">
                                    <Select
                                      value={inst.status}
                                      onValueChange={(v) => updateInstallmentStatus(inst.id, e.id, v)}
                                    >
                                      <SelectTrigger className="h-6 w-28 text-[10px]">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="pending" className="text-xs">Pendente</SelectItem>
                                        <SelectItem value="paid" className="text-xs">Pago</SelectItem>
                                        <SelectItem value="overdue" className="text-xs">Em atraso</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </td>
                                  <td className="py-2">
                                    <div className="flex items-center gap-2">
                                      {inst.boleto_url ? (
                                        <a
                                          href={inst.boleto_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 text-secondary hover:text-secondary/80 font-medium"
                                        >
                                          <Download size={12} />
                                          Ver
                                        </a>
                                      ) : (
                                        <span className="text-muted-foreground">—</span>
                                      )}
                                      <button
                                        onClick={() => {
                                          setUploadTarget(inst.id);
                                          fileInputRef.current?.click();
                                        }}
                                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                        title="Upload boleto"
                                      >
                                        <Upload size={12} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create installments dialog */}
      <Dialog open={!!showCreateDialog} onOpenChange={(open) => !open && setShowCreateDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Prestações</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Tipo</label>
              <Select value={createForm.type} onValueChange={(v) => setCreateForm((f) => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="inscription_fee">Inscrição</SelectItem>
                  <SelectItem value="tuition">Aulas Online</SelectItem>
                  <SelectItem value="summercamp">Summer Camp</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Número de prestações</label>
              <Input type="number" min="1" value={createForm.count} onChange={(e) => setCreateForm((f) => ({ ...f, count: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Data de início (vencimento da 1ª)</label>
              <Input type="date" value={createForm.startDate} onChange={(e) => setCreateForm((f) => ({ ...f, startDate: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(null)}>Cancelar</Button>
            <Button onClick={handleCreateInstallments} disabled={!createForm.startDate}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPaymentsPage;
