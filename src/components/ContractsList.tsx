import { useState, useEffect } from "react";
import { GraduationCap, FileText, Download, ShieldCheck, Check } from "lucide-react";
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
  contract_sent_at: string | null;
  contract_signed_at: string | null;
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
        .select("id, student_name, student_photo_url, contract_url, contract_url_summercamp, contract_sent_at, contract_signed_at, status, tuition_installment_cents, summercamp_installment_cents")
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
        {enrollments.map((e) => (
          <div key={e.id} className="bg-card rounded-xl border border-border shadow-card p-4">
            <div className="flex items-center gap-3 mb-3">
              {e.student_photo_url ? (
                <img src={e.student_photo_url} alt={e.student_name} className="w-10 h-10 rounded-full object-cover border-2 border-secondary/30 shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
                  <GraduationCap size={20} />
                </div>
              )}
              <p className="font-medium text-foreground">{e.student_name || "Sem nome"}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <Detail label="Enviado em" value={e.contract_sent_at ? formatDate(e.contract_sent_at) : ""} />
              <Detail label="Assinado em" value={e.contract_signed_at ? formatDate(e.contract_signed_at) : ""} />
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
                        a.download = `contrato-${e.student_name.replace(/\s+/g, "-").toLowerCase()}.pdf`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      } catch (err) {
                        console.error("Download error:", err);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 font-medium text-sm mt-0.5"
                  >
                    <Download size={14} className="text-secondary" />
                    Download contrato
                  </button>
                ) : (
                  <p className="text-foreground font-medium text-xs mt-0.5 italic text-muted-foreground">Ainda não disponível</p>
                )}
              </div>
            </div>

            {/* Accept contract button */}
            {e.contract_url && !e.contract_signed_at && (
              <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-200 mb-2">
                  O contrato está disponível e aguarda a sua aceitação para concluir a matrícula.
                </p>
                <Button
                  size="sm"
                  onClick={async () => {
                    setAcceptingContract(e.id);
                    try {
                      const { data: pdfResult, error: pdfError } = await supabase.functions.invoke("generate-contract-pdf", {
                        body: { enrollmentId: e.id, signed: true },
                      });
                      if (pdfError || !pdfResult?.success) {
                        toast({ title: "Erro ao aceitar contrato", variant: "destructive" });
                        return;
                      }
                      setEnrollments(prev => prev.map(en =>
                        en.id === e.id
                          ? { ...en, contract_signed_at: new Date().toISOString(), contract_url: pdfResult.contractUrl, status: "Contrato assinado" }
                          : en
                      ));
                      await supabase.from("enrollments").update({ status: "Contrato assinado" } as any).eq("id", e.id);
                      toast({ title: "Contrato aceite com sucesso!" });
                    } catch (err) {
                      console.error("Accept contract error:", err);
                      toast({ title: "Erro ao aceitar contrato", variant: "destructive" });
                    } finally {
                      setAcceptingContract(null);
                    }
                  }}
                  disabled={acceptingContract === e.id}
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                >
                  <ShieldCheck size={16} className="mr-1.5" />
                  {acceptingContract === e.id ? "A processar..." : "Aceitar contrato"}
                </Button>
              </div>
            )}

            {/* Signed confirmation */}
            {e.contract_signed_at && (
              <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
                <Check size={16} className="text-green-600 shrink-0" />
                <p className="text-sm text-green-800 dark:text-green-200 font-medium">Contrato aceite digitalmente</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
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
