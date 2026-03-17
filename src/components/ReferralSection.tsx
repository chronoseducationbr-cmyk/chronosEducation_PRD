import { useState, useEffect } from "react";
import { Mail, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  onChange?: (email: string) => void;
  validationErrors?: string[];
}

const ReferralSection = ({ onChange, validationErrors = [] }: Props) => {
  const { user } = useAuth();
  const [referralEmail, setReferralEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("referred_by_email")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data?.referred_by_email) {
        setReferralEmail(data.referred_by_email);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  useEffect(() => {
    onChange?.(referralEmail);
  }, [referralEmail, onChange]);

  if (loading) {
    return (
      <div className="animate-pulse h-24 bg-muted rounded-xl" />
    );
  }

  const inputClasses =
    "w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all text-sm";

  return (
    <div>
      <h2 className="font-heading text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
        Indicação
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info size={16} className="text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-[260px] text-xs">
              Esta informação irá conceder um desconto para o aluno que está se matriculando e para o aluno que o indicou.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </h2>
      <div className="bg-card rounded-xl border border-border shadow-card p-5">
        <p className="text-sm text-muted-foreground mb-3">
          Foi indicado por um aluno já matriculado? Indique o email (opcional).
        </p>
        <div className="relative">
          <Mail
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="email"
            value={referralEmail}
            onChange={(e) => setReferralEmail(e.target.value)}
            className={inputClasses}
            placeholder="email@aluno.com"
          />
        </div>
      </div>
    </div>
  );
};

export default ReferralSection;
