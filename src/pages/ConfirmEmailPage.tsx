import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, ArrowLeft, Mail } from "lucide-react";
import chronosLogoHeader from "@/assets/chronos-logo-header.png";
import SEOHead from "@/components/SEOHead";

const ConfirmEmailPage = () => {
  const [searchParams] = useSearchParams();
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") || "signup";
  const navigate = useNavigate();
  const { toast } = useToast();

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleConfirm = async () => {
    if (!tokenHash) return;
    setStatus("loading");

    try {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as "signup" | "magiclink" | "recovery" | "invite" | "email_change" | "email",
      });

      if (error) throw error;

      setStatus("success");
      toast({
        title: "Email confirmado!",
        description: "A sua conta está ativa. Pode iniciar sessão.",
      });

      setTimeout(() => navigate("/login", { replace: true }), 2500);
    } catch (error: any) {
      setStatus("error");
      let msg = error.message || "Não foi possível confirmar o email. O link pode ter expirado.";
      if (/token has expired or is invalid/i.test(msg)) {
        msg = "Token já está expirado ou é inválido.";
      }
      toast({
        title: "Erro na confirmação",
        description: msg,
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <SEOHead
        title="Confirmar Email — Chronos Education"
        description="Confirme o seu endereço de email para ativar a sua conta."
        canonical="/confirm-email"
      />
      <div className="min-h-screen bg-background flex">
        {/* Left panel */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-hero items-center justify-center p-12">
          <div className="max-w-md">
            <img src={chronosLogoHeader} alt="Chronos Education" className="h-12 mb-6" />
            <p className="text-primary-foreground/70 text-lg leading-relaxed">
              Confirme o seu email para ativar a sua conta na Chronos Education.
            </p>
          </div>
        </div>

        {/* Right panel */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
              <ArrowLeft size={16} />
              Voltar ao site
            </Link>

            {!tokenHash ? (
              <div className="space-y-4">
                <XCircle size={48} className="mx-auto text-destructive" />
                <h2 className="font-heading text-2xl font-bold text-foreground">
                  Link inválido
                </h2>
                <p className="text-muted-foreground">
                  Este link de confirmação é inválido. Verifique o email que recebeu e tente novamente.
                </p>
              </div>
            ) : status === "success" ? (
              <div className="space-y-4">
                <CheckCircle size={48} className="mx-auto text-secondary" />
                <h2 className="font-heading text-2xl font-bold text-foreground">
                  Email confirmado!
                </h2>
                <p className="text-muted-foreground">
                  A sua conta está ativa. A redirecionar para o login...
                </p>
              </div>
            ) : status === "error" ? (
              <div className="space-y-4">
                <XCircle size={48} className="mx-auto text-destructive" />
                <h2 className="font-heading text-2xl font-bold text-foreground">
                  Erro na confirmação
                </h2>
                <p className="text-muted-foreground">
                  Não foi possível confirmar o seu email. O link pode ter expirado ou já foi utilizado.
                </p>
                <Link
                  to="/login"
                  className="inline-block mt-4 text-sm font-medium text-secondary hover:underline"
                >
                  Ir para o login
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                <Mail size={48} className="mx-auto text-primary" />
                <h2 className="font-heading text-2xl font-bold text-foreground">
                  Confirmar o seu email
                </h2>
                <p className="text-muted-foreground">
                  Clique no botão abaixo para confirmar o seu endereço de email e ativar a sua conta.
                </p>
                <button
                  onClick={handleConfirm}
                  disabled={status === "loading"}
                  className="w-full bg-gradient-lime text-primary font-semibold py-3.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {status === "loading" ? "A confirmar..." : "Confirmar o meu email"}
                </button>
                <p className="text-xs text-muted-foreground">
                  Este botão é necessário para garantir que é realmente você a confirmar a conta.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ConfirmEmailPage;
