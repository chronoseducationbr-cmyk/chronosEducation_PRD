import { useState, useEffect } from "react";
import { GraduationCap, FileText, Download, ShieldCheck, Check, Monitor, Sun, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Enrollment {
  id: string;
  student_name: string;
  student_photo_url: string | null;
  contract_url: string | null;
  contract_url_summercamp: string | null;
  contract_sent_at_platform: string | null;
  contract_signed_at_platform: string | null;
  contract_sent_at_summercamp: string | null;
  contract_signed_at_summercamp: string | null;
  status: string;
  tuition_installment_cents: number;
  summercamp_installment_cents: number;
}

interface Props {
  refreshKey: number;
}

const ContractsList = ({ refreshKey }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingContract, setAcceptingContract] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);
      const { data } = await supabase
        .from("enrollments")
        .select("id, student_name, student_photo_url, contract_url, contract_url_summercamp, contract_sent_at_platform, contract_signed_at_platform, contract_sent_at_summercamp, contract_signed_at_summercamp, status, tuition_installment_cents, summercamp_installment_cents")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setEnrollments((data as unknown as Enrollment[]) || []);
      setLoading(false);
    };
    load();
  }, [user, refreshKey]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  };

  if (loading) {
    return <div className="animate-pulse h-32 bg-muted rounded-xl" />;
  }

  if (enrollments.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border shadow-card p-8 text-center">
        <FileText size={40} className="mx-auto text-secondary mb-3" />
        <p className="text-muted-foreground">Ainda não tem matrículas registradas.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-heading text-lg font-semibold text-foreground mb-3">
        Contratos <span className="text-[#f9b41f]">({enrollments.length})</span>
      </h2>
      <div className="space-y-3">
        {enrollments.map((e) => {
          const hasUnsigned =
            (e.contract_url && !e.contract_signed_at_platform) ||
            (e.contract_url_summercamp && !e.contract_signed_at_summercamp);

          return (
            <EnrollmentContractCard key={e.id} enrollment={e} defaultExpanded={!!hasUnsigned} acceptingContract={acceptingContract} setAcceptingContract={setAcceptingContract} setEnrollments={setEnrollments} toast={toast} formatDate={formatDate} />
          );
        })}

            {/* Contrato Plataforma Online */}
            {(e.tuition_installment_cents > 0 || e.contract_url) && (
              <div className="text-sm mb-3">
                <p className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1.5">
                  <Monitor size={12} /> Contrato Plataforma Online
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Detail label="Enviado em" value={e.contract_sent_at_platform ? formatDate(e.contract_sent_at_platform) : ""} />
                  <Detail label="Assinado em" value={e.contract_signed_at_platform ? formatDate(e.contract_signed_at_platform) : ""} />
                  <div>
                    <p className="text-muted-foreground text-xs">Documento</p>
                    {e.contract_url ? (
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch(e.contract_url!);
                            const blob = await res.blob();
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `contrato-plataforma-${e.student_name.replace(/\s+/g, "-").toLowerCase()}.pdf`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                          } catch (err) {
                            console.error("Download error:", err);
                          }
                        }}
                        className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 font-medium text-sm text-left mt-0.5"
                      >
                        <Download size={14} className="text-secondary" />
                        Download PDF
                      </button>
                    ) : (
                      <p className="text-muted-foreground font-medium italic mt-0.5">Ainda não disponível</p>
                    )}
                  </div>
                </div>

                {/* Platform: pending acceptance */}
                {e.contract_url && !e.contract_signed_at_platform && (
                  <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <p className="text-sm text-amber-800 dark:text-amber-200 mb-2">
                      O contrato de <strong>Plataforma Online</strong> está disponível e aguarda a sua aceitação.
                    </p>
                    <Button
                      size="sm"
                      onClick={async () => {
                        setAcceptingContract(`${e.id}-platform`);
                        try {
                          const { data: pdfResult, error: pdfError } = await supabase.functions.invoke("generate-contract-pdf", {
                            body: { enrollmentId: e.id, signed: true, contractType: "platform" },
                          });
                          if (pdfError || !pdfResult?.success) {
                            toast({ title: "Erro ao aceitar contrato", variant: "destructive" });
                            return;
                          }
                          const now = new Date().toISOString();
                          setEnrollments(prev => prev.map(en =>
                            en.id === e.id
                              ? { ...en, contract_url: pdfResult.contractUrl, contract_signed_at_platform: now }
                              : en
                          ));
                          const allSigned = e.contract_url_summercamp ? !!e.contract_signed_at_summercamp : true;
                          if (allSigned) {
                            await supabase.from("enrollments").update({ status: "Contrato assinado" } as any).eq("id", e.id);
                            setEnrollments(prev => prev.map(en => en.id === e.id ? { ...en, status: "Contrato assinado" } : en));
                          }
                          toast({ title: "Contrato Plataforma Online aceite com sucesso!" });
                        } catch (err) {
                          console.error("Accept contract error:", err);
                          toast({ title: "Erro ao aceitar contrato", variant: "destructive" });
                        } finally {
                          setAcceptingContract(null);
                        }
                      }}
                      disabled={acceptingContract === `${e.id}-platform`}
                      className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                    >
                      <ShieldCheck size={16} className="mr-1.5" />
                      {acceptingContract === `${e.id}-platform` ? "A processar..." : "Aceitar contrato Plataforma Online"}
                    </Button>
                  </div>
                )}

                {/* Platform: signed */}
                {e.contract_url && e.contract_signed_at_platform && (
                  <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
                    <Check size={16} className="text-green-600 shrink-0" />
                    <p className="text-sm text-green-800 dark:text-green-200 font-medium">Contrato Plataforma Online aceite digitalmente</p>
                  </div>
                )}
              </div>
            )}

            {/* Contrato Summer Camp */}
            {(e.summercamp_installment_cents > 0 || e.contract_url_summercamp) && (
              <div className="text-sm mb-3">
                <p className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1.5">
                  <Sun size={12} /> Contrato Summer Camp
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Detail label="Enviado em" value={e.contract_sent_at_summercamp ? formatDate(e.contract_sent_at_summercamp) : ""} />
                  <Detail label="Assinado em" value={e.contract_signed_at_summercamp ? formatDate(e.contract_signed_at_summercamp) : ""} />
                  <div>
                    <p className="text-muted-foreground text-xs">Documento</p>
                    {e.contract_url_summercamp ? (
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch(e.contract_url_summercamp!);
                            const blob = await res.blob();
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `contrato-summercamp-${e.student_name.replace(/\s+/g, "-").toLowerCase()}.pdf`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                          } catch (err) {
                            console.error("Download error:", err);
                          }
                        }}
                        className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 font-medium text-sm text-left mt-0.5"
                      >
                        <Download size={14} className="text-secondary" />
                        Download PDF
                      </button>
                    ) : (
                      <p className="text-muted-foreground font-medium italic mt-0.5">Ainda não disponível</p>
                    )}
                  </div>
                </div>

                {/* Summercamp: pending acceptance */}
                {e.contract_url_summercamp && !e.contract_signed_at_summercamp && (
                  <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <p className="text-sm text-amber-800 dark:text-amber-200 mb-2">
                      O contrato de <strong>Summer Camp</strong> está disponível e aguarda a sua aceitação.
                    </p>
                    <Button
                      size="sm"
                      onClick={async () => {
                        setAcceptingContract(`${e.id}-summercamp`);
                        try {
                          const { data: pdfResult, error: pdfError } = await supabase.functions.invoke("generate-contract-pdf", {
                            body: { enrollmentId: e.id, signed: true, contractType: "summercamp" },
                          });
                          if (pdfError || !pdfResult?.success) {
                            toast({ title: "Erro ao aceitar contrato", variant: "destructive" });
                            return;
                          }
                          const now = new Date().toISOString();
                          setEnrollments(prev => prev.map(en =>
                            en.id === e.id
                              ? { ...en, contract_url_summercamp: pdfResult.contractUrl, contract_signed_at_summercamp: now }
                              : en
                          ));
                          const allSigned = e.contract_url ? !!e.contract_signed_at_platform : true;
                          if (allSigned) {
                            await supabase.from("enrollments").update({ status: "Contrato assinado" } as any).eq("id", e.id);
                            setEnrollments(prev => prev.map(en => en.id === e.id ? { ...en, status: "Contrato assinado" } : en));
                          }
                          toast({ title: "Contrato Summer Camp aceite com sucesso!" });
                        } catch (err) {
                          console.error("Accept contract error:", err);
                          toast({ title: "Erro ao aceitar contrato", variant: "destructive" });
                        } finally {
                          setAcceptingContract(null);
                        }
                      }}
                      disabled={acceptingContract === `${e.id}-summercamp`}
                      className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                    >
                      <ShieldCheck size={16} className="mr-1.5" />
                      {acceptingContract === `${e.id}-summercamp` ? "A processar..." : "Aceitar contrato Summer Camp"}
                    </Button>
                  </div>
                )}

                {/* Summercamp: signed */}
                {e.contract_url_summercamp && e.contract_signed_at_summercamp && (
                  <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
                    <Check size={16} className="text-green-600 shrink-0" />
                    <p className="text-sm text-green-800 dark:text-green-200 font-medium">Contrato Summer Camp aceite digitalmente</p>
                  </div>
                )}
              </div>
            )}

            {!e.contract_url && !e.contract_url_summercamp && e.tuition_installment_cents === 0 && e.summercamp_installment_cents === 0 && (
              <p className="text-muted-foreground font-medium text-xs italic">Ainda não disponível</p>
            )}
      </div>
    </div>
  );
};

const EnrollmentContractCard = ({ enrollment: e, defaultExpanded, acceptingContract, setAcceptingContract, setEnrollments, toast, formatDate }: {
  enrollment: Enrollment;
  defaultExpanded: boolean;
  acceptingContract: string | null;
  setAcceptingContract: (v: string | null) => void;
  setEnrollments: React.Dispatch<React.SetStateAction<Enrollment[]>>;
  toast: any;
  formatDate: (d: string) => string;
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const allSigned =
    (!e.contract_url || !!e.contract_signed_at_platform) &&
    (!e.contract_url_summercamp || !!e.contract_signed_at_summercamp);

  return (
    <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors"
      >
        {e.student_photo_url ? (
          <img src={e.student_photo_url} alt={e.student_name} className="w-10 h-10 rounded-full object-cover border-2 border-secondary/30 shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
            <GraduationCap size={20} />
          </div>
        )}
        <p className="font-medium text-foreground flex-1">{e.student_name || "Sem nome"}</p>
        {allSigned && (e.contract_url || e.contract_url_summercamp) && (
          <Check size={16} className="text-green-600 shrink-0" />
        )}
        {expanded ? <ChevronUp size={16} className="text-muted-foreground shrink-0" /> : <ChevronDown size={16} className="text-muted-foreground shrink-0" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-border">
          <div className="mt-3 space-y-3">
  );
};

const Detail = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-muted-foreground text-xs">{label}</p>
    {value ? (
      <p className="text-foreground font-medium">{value}</p>
    ) : (
      <p className="text-muted-foreground font-medium italic">—</p>
    )}
  </div>
);

export default ContractsList;
