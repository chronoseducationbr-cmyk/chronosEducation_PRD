import { useState, useEffect } from "react";
import { GraduationCap, Plus, ChevronDown, ChevronUp, PlusCircle, Monitor, PlaneTakeoff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
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

interface Enrollment {
  id: string;
  student_name: string;
  student_email: string;
  student_birth_date: string | null;
  student_address: string;
  student_school: string;
  student_graduation_year: number | null;
  student_photo_url: string | null;
  referred_by_email: string;
  status: string;
  created_at: string;
  inscription_fee_cents: number;
  tuition_installment_cents: number;
  tuition_installments: number;
  summercamp_installment_cents: number;
  summercamp_installments: number;
  contract_url: string | null;
  contract_sent_at_platform: string | null;
  contract_signed_at_platform: string | null;
  contract_sent_at_summercamp: string | null;
  contract_signed_at_summercamp: string | null;
  quiz_test_id: string | null;
  guardian_email: string | null;
}

interface Props {
  onNewEnrollment: () => void;
  refreshKey: number;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  "Matrícula submetida": { bg: "bg-purple-100", text: "text-purple-800" },
  "Matrícula confirmada": { bg: "bg-blue-100", text: "text-blue-800" },
  "Pendente de assinatura de contrato": { bg: "bg-amber-100", text: "text-amber-800" },
  "Aguarda assinatura de contrato": { bg: "bg-amber-100", text: "text-amber-800" },
  "Contrato assinado": { bg: "bg-green-100", text: "text-green-800" },
  "Em curso": { bg: "bg-emerald-100", text: "text-emerald-800" },
  "Concluído": { bg: "bg-emerald-100", text: "text-emerald-800" },
  "Cancelado": { bg: "bg-red-100", text: "text-red-800" },
};

const EnrollmentsList = ({ onNewEnrollment, refreshKey }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    enrollmentId: string;
    studentName: string;
    guardianEmail: string | null;
    serviceType: "plataforma" | "summercamp";
  }>({ open: false, enrollmentId: "", studentName: "", guardianEmail: null, serviceType: "plataforma" });

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);

      const { data } = await supabase
        .from("enrollments")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setEnrollments((data as Enrollment[]) || []);

      setLoading(false);
    };
    load();
  }, [user, refreshKey]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  };

  const handleAddService = async () => {
    const { enrollmentId, serviceType, studentName, guardianEmail } = confirmDialog;
    setConfirmDialog((prev) => ({ ...prev, open: false }));
    setRequesting(true);

    const serviceName = serviceType === "plataforma" ? "Plataforma Online" : "Summer Camp";
    const settingsField = serviceType === "plataforma"
      ? "default_tuition_installments, default_tuition_installment_cents"
      : "default_summercamp_installments, default_summercamp_installment_cents";

    const { data: settings } = await supabase.from("app_settings").select("*").single();

    const updateData = serviceType === "plataforma"
      ? { tuition_installments: (settings as any)?.default_tuition_installments ?? 16, tuition_installment_cents: 0 }
      : { summercamp_installments: (settings as any)?.default_summercamp_installments ?? 6, summercamp_installment_cents: 0 };

    const { error } = await supabase
      .from("enrollments")
      .update(updateData as any)
      .eq("id", enrollmentId);

    if (error) {
      toast({ title: "Erro ao adicionar serviço", variant: "destructive" });
      setRequesting(false);
      return;
    }

    toast({ title: `${serviceName} adicionado com sucesso` });
    setEnrollments((prev) =>
      prev.map((en) => en.id === enrollmentId ? { ...en, ...updateData } : en)
    );

    // Send notification emails
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("user_id", user!.id)
      .single();

    const recipientEmail = guardianEmail || profile?.email || user!.email;
    const guardianName = profile?.full_name || "Responsável";

    try {
      await supabase.functions.invoke("send-service-subscription-email", {
        body: {
          guardianName,
          guardianEmail: recipientEmail,
          studentName,
          serviceName,
        },
      });
    } catch (emailError) {
      console.error("Error sending service subscription email:", emailError);
    }

    setRequesting(false);
  };

  if (loading) {
    return <div className="animate-pulse h-32 bg-muted rounded-xl" />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-heading text-lg font-semibold text-foreground">
          Matrículas <span className="text-[#f9b41f]">({enrollments.length})</span>
        </h2>
        <button
          onClick={onNewEnrollment}
          className="flex items-center gap-1.5 text-sm font-semibold text-secondary hover:text-secondary/80 transition-colors"
        >
          <Plus size={16} />
          Nova Matrícula
        </button>
      </div>

      {enrollments.length === 0 ? (
        <div className="bg-card rounded-xl border border-border shadow-card p-8 text-center">
          <GraduationCap size={40} className="mx-auto text-secondary mb-3" />
          <p className="text-muted-foreground mb-4">Ainda não tem matrículas registradas.</p>
          <button
            onClick={onNewEnrollment}
            className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground font-semibold py-2.5 px-5 rounded-lg hover:opacity-90 transition-opacity text-sm"
          >
            <Plus size={16} />
            Nova Matrícula
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {enrollments.map((e) => {
            const colors = statusColors[e.status] || { bg: "bg-muted", text: "text-muted-foreground" };
            const isExpanded = expandedId === e.id;

            return (
              <div
                key={e.id}
                className="bg-card rounded-xl border border-border shadow-card overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : e.id)}
                  className="w-full flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-4 text-left hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {e.student_photo_url ? (
                      <img
                        src={e.student_photo_url}
                        alt={e.student_name}
                        className="w-10 h-10 rounded-full object-cover border-2 border-secondary/30 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
                        <GraduationCap size={20} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">
                        {e.student_name || "Sem nome"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Inscrito em {formatDate(e.created_at)}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {e.tuition_installments > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground">
                            <Monitor size={11} />
                            Plataforma Online
                          </span>
                        )}
                        {e.summercamp_installments > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground">
                            <Sun size={11} />
                            Summer Camp
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="sm:hidden shrink-0">
                      {isExpanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pl-[52px] sm:pl-0">
                    <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${colors.bg} ${colors.text}`}>
                      {e.status}
                    </span>
                    <div className="hidden sm:block">
                      {isExpanded ? <ChevronUp size={16} className="text-muted-foreground shrink-0" /> : <ChevronDown size={16} className="text-muted-foreground shrink-0" />}
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-border">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 text-sm">
                       <Detail label="Email" value={e.student_email} />
                       <Detail label="Data de nascimento" value={e.student_birth_date || ""} />
                       <Detail label="Endereço" value={e.student_address} />
                       <Detail label="Escola" value={e.student_school} />
                       <Detail label="Ano de conclusão" value={e.student_graduation_year?.toString() || ""} />
                       <Detail label="Indicado por" value={e.referred_by_email} />
                     </div>

                    {/* Request missing service */}
                    {(e.tuition_installments === 0 || e.summercamp_installments === 0) && (
                      <div className="mt-4 pt-3 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-2">Adicionar serviço</p>
                        <div className="flex gap-2">
                          {e.tuition_installments === 0 && (
                            <button
                              disabled={requesting}
                              onClick={() => setConfirmDialog({
                                open: true,
                                enrollmentId: e.id,
                                studentName: e.student_name,
                                guardianEmail: e.guardian_email,
                                serviceType: "plataforma",
                              })}
                              className="flex items-center gap-1.5 text-sm font-semibold text-secondary hover:text-secondary/80 transition-colors disabled:opacity-50"
                            >
                              <Plus size={16} />
                              Plataforma Online
                            </button>
                          )}
                          {e.summercamp_installments === 0 && (
                            <button
                              disabled={requesting}
                              onClick={() => setConfirmDialog({
                                open: true,
                                enrollmentId: e.id,
                                studentName: e.student_name,
                                guardianEmail: e.guardian_email,
                                serviceType: "summercamp",
                              })}
                              className="flex items-center gap-1.5 text-sm font-semibold text-secondary hover:text-secondary/80 transition-colors disabled:opacity-50"
                            >
                              <Plus size={16} />
                              Summer Camp
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar subscrição de serviço</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que pretende adicionar o serviço{" "}
              <strong>{confirmDialog.serviceType === "plataforma" ? "Plataforma Online" : "Summer Camp"}</strong>{" "}
              à matrícula de <strong>{confirmDialog.studentName}</strong>?
              <br /><br />
              Será enviada uma notificação por email a confirmar a subscrição.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAddService}
              disabled={requesting}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
            >
              {requesting ? "A processar..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const Detail = ({ label, value, emptyText }: { label: string; value: string; emptyText?: string }) => (
  <div>
    <p className="text-muted-foreground text-xs">{label}</p>
    {value ? (
      <p className="text-foreground font-medium">{value}</p>
    ) : (
      <p className="text-muted-foreground font-medium italic">{emptyText || "—"}</p>
    )}
  </div>
);

export default EnrollmentsList;
