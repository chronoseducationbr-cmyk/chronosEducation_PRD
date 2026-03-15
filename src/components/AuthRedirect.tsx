import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const AuthRedirect = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    let isActive = true;

    const resolveAuthRedirect = async () => {
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type");

      if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as "signup" | "magiclink" | "recovery" | "invite" | "email_change" | "email",
        });

        if (error) {
          if (isActive) navigate("/login", { replace: true });
          return;
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isActive) return;

      if (!session?.user) {
        navigate("/login", { replace: true });
        return;
      }

      const { data: isAdmin } = await supabase.rpc("has_role", {
        _user_id: session.user.id,
        _role: "admin" as const,
      });

      if (!isActive) return;
      navigate(isAdmin ? "/admin" : "/gestao-matriculas", { replace: true });
    };

    void resolveAuthRedirect();

    return () => {
      isActive = false;
    };
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
};

export default AuthRedirect;
