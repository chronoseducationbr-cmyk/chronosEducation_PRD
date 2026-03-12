import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Search, Upload, Download, FileText, CheckCircle2, Clock, AlertCircle, Plus, ChevronDown, ChevronUp, GraduationCap } from "lucide-react";
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
  user_id: string;
  guardian_name?: string;
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
  discount_percent: number;
}

const typeLabels: Record<string, string> = {
  inscription_fee: "Matrícula",
  tuition: "Plataforma Online",
  summercamp: "Summer Camp",
};

const statusConfig: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  pending: { label: "Pendente", icon: Clock, color: "bg-amber-100 text-amber-800" },
  paid: { label: "Pago", icon: CheckCircle2, color: "bg-green-100 text-green-800" },
  overdue: { label: "Em atraso", icon: AlertCircle, color: "bg-red-100 text-red-800" },
};

const AdminPaymentsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [installments, setInstallments] = useState<Record<string, Installment[]>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [initialExpanded, setInitialExpanded] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({ type: "tuition", count: "1", startDate: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<string | null>(null);
  const [editingAmount, setEditingAmount] = useState<string | null>(null);
  const [editAmountValue, setEditAmountValue] = useState("");
  const [editingDiscount, setEditingDiscount] = useState<string | null>(null);
  const [editDiscountValue, setEditDiscountValue] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("enrollments")
      .select("*")
      .order("created_at", { ascending: false });
    const enrs = (data as Enrollment[]) || [];
    
    // Load guardian names from profiles
    const userIds = [...new Set(enrs.map((e) => e.user_id))];
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);
      const nameMap = (profiles || []).reduce<Record<string, string>>((acc, p: any) => {
        acc[p.user_id] = p.full_name;
        return acc;
      }, {});
      enrs.forEach((e) => { e.guardian_name = nameMap[e.user_id] || ""; });
    }
    setEnrollments(enrs);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Auto-expand student from URL param
  useEffect(() => {
    const studentId = searchParams.get("student");
    if (studentId && !loading && enrollments.length > 0 && !initialExpanded) {
      setInitialExpanded(true);
      setExpandedId(studentId);
      if (!installments[studentId]) loadInstallments(studentId);
    }
  }, [searchParams, loading, enrollments, initialExpanded]);
  const loadInstallments = async (enrollmentId: string) => {
    const typeOrder = ["inscription_fee", "tuition", "summercamp"];
    const { data } = await supabase
      .from("installments")
      .select("*")
      .eq("enrollment_id", enrollmentId)
      .order("installment_number", { ascending: true });
    const sorted = ((data as Installment[]) || []).sort((a, b) => {
      const ai = typeOrder.indexOf(a.type) === -1 ? 99 : typeOrder.indexOf(a.type);
      const bi = typeOrder.indexOf(b.type) === -1 ? 99 : typeOrder.indexOf(b.type);
      return ai - bi || a.installment_number - b.installment_number;
    });
    setInstallments((prev) => ({ ...prev, [enrollmentId]: sorted }));
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

  const saveAmount = async (instId: string, enrollmentId: string) => {
    const cents = Math.round(parseFloat(editAmountValue || "0") * 100);
    if (isNaN(cents) || cents < 0) {
      toast({ title: "Valor inválido", variant: "destructive" });
      return;
    }
    const { error } = await supabase
      .from("installments")
      .update({ amount_cents: cents } as any)
      .eq("id", instId);
    if (error) {
      toast({ title: "Erro ao atualizar valor", variant: "destructive" });
    } else {
      toast({ title: "Valor atualizado" });
      loadInstallments(enrollmentId);
    }
    setEditingAmount(null);
  };

  const saveDiscount = async (instId: string, enrollmentId: string) => {
    const val = parseFloat(editDiscountValue || "0");
    if (isNaN(val) || val < 0 || val > 100) {
      toast({ title: "Valor inválido (0-100%)", variant: "destructive" });
      return;
    }
    const { error } = await supabase
      .from("installments")
      .update({ discount_percent: val } as any)
      .eq("id", instId);
    if (error) {
      toast({ title: "Erro ao atualizar desconto", variant: "destructive" });
    } else {
      toast({ title: "Desconto atualizado" });
      loadInstallments(enrollmentId);
    }
    setEditingDiscount(null);
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
      toast({ title: "Erro ao criar mensalidades", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `${count} mensalidades criadas` });
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
      <p className="text-sm text-muted-foreground mb-6">Gerir mensalidades e boletos de cada aluno</p>

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
              <div key={e.id} className={`bg-card rounded-xl border-2 overflow-hidden transition-colors ${isExpanded ? "border-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.2)]" : "border-border"}`}>
                <button
                  onClick={() => toggleExpand(e.id)}
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground">{e.student_name}</p>
                      <button
                        onClick={(ev) => { ev.stopPropagation(); navigate(`/admin/inscricoes?student=${e.id}`); }}
                        className="shrink-0 p-1 rounded hover:bg-muted transition-colors"
                        title="Ver matrícula"
                      >
                        <GraduationCap size={16} className="text-muted-foreground" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">{e.student_email || "—"}</p>
                    {e.guardian_name && (
                      <p className="text-xs text-muted-foreground">Responsável: {e.guardian_name}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{insts.length || "—"} mensalidades</span>
                  {isExpanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-border">
                    <div className="flex items-center justify-between mt-3 mb-3">
                      <p className="text-sm font-bold text-foreground uppercase tracking-wide">Mensalidades</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowCreateDialog(e.id)}
                        className="text-xs"
                      >
                        <Plus size={14} className="mr-1" />
                        Criar Mensalidades
                      </Button>
                    </div>

                    {insts.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Sem mensalidades registadas.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left py-2 pr-2 text-muted-foreground font-medium">Tipo</th>
                              <th className="text-left py-2 pr-2 text-muted-foreground font-medium">#</th>
                              <th className="text-left py-2 pr-2 text-muted-foreground font-medium">Valor</th>
                              <th className="text-left py-2 pr-2 text-muted-foreground font-medium">Desconto</th>
                              <th className="text-left py-2 pr-2 text-muted-foreground font-medium">Valor Final</th>
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
                                  <td className="py-2 pr-2">
                                    {editingAmount === inst.id ? (
                                      <div className="flex items-center gap-1">
                                        <span className="text-foreground text-[10px]">$</span>
                                        <input
                                          type="number"
                                          step="0.01"
                                          min="0"
                                          className="w-16 h-6 text-[10px] border border-border rounded px-1 bg-background text-foreground"
                                          value={editAmountValue}
                                          onChange={(ev) => setEditAmountValue(ev.target.value)}
                                          onKeyDown={(ev) => {
                                            if (ev.key === "Enter") saveAmount(inst.id, e.id);
                                            if (ev.key === "Escape") setEditingAmount(null);
                                          }}
                                          autoFocus
                                        />
                                        <button
                                          onClick={() => saveAmount(inst.id, e.id)}
                                          className="text-secondary hover:text-secondary/80 text-[10px] font-semibold"
                                        >
                                          ✓
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => {
                                          setEditingAmount(inst.id);
                                          setEditAmountValue((inst.amount_cents / 100).toString());
                                        }}
                                        className="text-foreground font-medium hover:text-secondary transition-colors cursor-pointer"
                                        title="Clique para editar"
                                      >
                                        {inst.amount_cents > 0 ? `$${(inst.amount_cents / 100).toFixed(2)}` : "—"}
                                      </button>
                                    )}
                                  </td>
                                  <td className="py-2 pr-2">
                                    {inst.type !== "summercamp" || inst.status === "paid" ? (
                                      <span className="text-muted-foreground">
                                        {inst.discount_percent > 0 ? `${inst.discount_percent}%` : "—"}
                                      </span>
                                    ) : editingDiscount === inst.id ? (
                                      <div className="flex items-center gap-1">
                                        <input
                                          type="number"
                                          step="0.1"
                                          min="0"
                                          max="100"
                                          className="w-14 h-6 text-[10px] border border-border rounded px-1 bg-background text-foreground"
                                          value={editDiscountValue}
                                          onChange={(ev) => setEditDiscountValue(ev.target.value)}
                                          onKeyDown={(ev) => {
                                            if (ev.key === "Enter") saveDiscount(inst.id, e.id);
                                            if (ev.key === "Escape") setEditingDiscount(null);
                                          }}
                                          autoFocus
                                        />
                                        <span className="text-[10px] text-foreground">%</span>
                                        <button
                                          onClick={() => saveDiscount(inst.id, e.id)}
                                          className="text-secondary hover:text-secondary/80 text-[10px] font-semibold"
                                        >
                                          ✓
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => {
                                          setEditingDiscount(inst.id);
                                          setEditDiscountValue((inst.discount_percent || 0).toString());
                                        }}
                                        className="text-foreground font-medium hover:text-secondary transition-colors cursor-pointer"
                                        title="Clique para editar desconto"
                                      >
                                        {inst.discount_percent > 0 ? `${inst.discount_percent}%` : "—"}
                                      </button>
                                    )}
                                  </td>
                                  <td className="py-2 pr-2 text-foreground font-medium">
                                    {(() => {
                                      if (inst.amount_cents <= 0) return "—";
                                      const disc = inst.discount_percent || 0;
                                      const final_cents = inst.status === "paid" ? inst.amount_cents : Math.round(inst.amount_cents * (1 - disc / 100));
                                      return disc > 0 && inst.status !== "paid"
                                        ? <span className="text-green-700">${(final_cents / 100).toFixed(2)}</span>
                                        : `$${(final_cents / 100).toFixed(2)}`;
                                    })()}
                                  </td>
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
            <DialogTitle>Criar Mensalidades</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Tipo</label>
              <Select value={createForm.type} onValueChange={(v) => setCreateForm((f) => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="inscription_fee">Matrícula</SelectItem>
                  <SelectItem value="tuition">Plataforma Online</SelectItem>
                  <SelectItem value="summercamp">Summer Camp</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Número de mensalidades</label>
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
