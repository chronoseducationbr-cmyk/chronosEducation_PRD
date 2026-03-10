import { useState, useEffect } from "react";
import { GraduationCap, ChevronDown, ChevronUp, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import InstallmentsList from "@/components/InstallmentsList";

interface Referral {
  referred_student_email: string;
  referred_enrollment_id: string;
  referred_name?: string;
}

interface Enrollment {
  id: string;
  student_name: string;
  student_email: string;
  status: string;
  created_at: string;
  inscription_fee_cents: number;
  tuition_installment_cents: number;
  tuition_installments: number;
  summercamp_installment_cents: number;
  summercamp_installments: number;
}

interface Props {
  refreshKey: number;
}

const PaymentsList = ({ refreshKey }: Props) => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<Record<string, Referral[]>>({});

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

  if (loading) {
    return <div className="animate-pulse h-32 bg-muted rounded-xl" />;
  }

  if (enrollments.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border shadow-card p-8 text-center">
        <GraduationCap size={40} className="mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">Sem inscrições para exibir pagamentos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {enrollments.map((e) => {
        const isExpanded = expandedId === e.id;
        const hasValues = e.inscription_fee_cents > 0 || e.tuition_installment_cents > 0 || e.summercamp_installment_cents > 0;

        return (
          <div
            key={e.id}
            className="bg-card rounded-xl border border-border shadow-card overflow-hidden"
          >
            <button
              onClick={() => setExpandedId(isExpanded ? null : e.id)}
              className="w-full flex items-center gap-4 p-4 text-left hover:bg-muted/30 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
                <GraduationCap size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {e.student_name || "Sem nome"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {e.student_email || "—"}
                </p>
              </div>
              {isExpanded ? (
                <ChevronUp size={16} className="text-muted-foreground shrink-0" />
              ) : (
                <ChevronDown size={16} className="text-muted-foreground shrink-0" />
              )}
            </button>

            {isExpanded && (
              <div className="px-4 pb-5 border-t border-border space-y-6">
                {hasValues && (
                  <div className="mt-4 bg-muted/40 rounded-lg p-4">
                    <h3 className="text-sm font-bold text-foreground mb-3 tracking-wide uppercase">
                      Resumo de Valores
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-card rounded-lg p-3 border border-border">
                        <p className="text-muted-foreground text-xs mb-0.5">Inscrição</p>
                        <p className="text-foreground text-lg font-bold">${(e.inscription_fee_cents / 100).toFixed(0)}</p>
                      </div>
                      <div className="bg-card rounded-lg p-3 border border-border">
                        <p className="text-muted-foreground text-xs mb-0.5">Aulas Online ({e.tuition_installments}x)</p>
                        <p className="text-foreground text-lg font-bold">${(e.tuition_installment_cents / 100).toFixed(0)}</p>
                      </div>
                      <div className="bg-card rounded-lg p-3 border border-border">
                        <p className="text-muted-foreground text-xs mb-0.5">Summer Camp ({e.summercamp_installments}x)</p>
                        <p className="text-foreground text-lg font-bold">${(e.summercamp_installment_cents / 100).toFixed(0)}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <InstallmentsList enrollmentId={e.id} />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PaymentsList;
