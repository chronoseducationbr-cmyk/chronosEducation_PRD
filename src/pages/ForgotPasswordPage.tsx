import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import chronosLogoHeader from "@/assets/chronos-logo-header.png";
import SEOHead from "@/components/SEOHead";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "https://chronoseducation.com/reset-password",
      });
      if (error) throw error;

      setSent(true);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message === "Unable to validate email address: invalid format"
          ? "Não foi possível validar o email: formato inválido."
          : /for security purposes, you can only request this after (\d+) seconds/i.test(error.message)
          ? error.message.replace(/for security purposes, you can only request this after (\d+) seconds/i, "Por questões de segurança, podes voltar a realizar o pedido após $1 segundos.")
          : (error.message || "Erro ao enviar email de recuperação."),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEOHead
        title="Recuperar Senha — Chronos Education"
        description="Recupere a sua senha na Chronos Education."
        canonical="/forgot-password"
      />
      <div className="min-h-screen bg-background flex">
        {/* Left panel */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-hero items-center justify-center p-12 relative">
          <div className="max-w-md">
            <img src={chronosLogoHeader} alt="Chronos Education" className="h-12 mb-6" />
            <p className="text-primary-foreground/70 text-lg leading-relaxed">
              Recupere o acesso à sua conta. Enviaremos um email com instruções.
            </p>
          </div>
        </div>

        {/* Right panel */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <Link to="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
              <ArrowLeft size={16} />
              Voltar ao login
            </Link>

            <h2 className="font-heading text-3xl font-bold text-foreground mb-2">
              Recuperar Senha
            </h2>
            <p className="text-muted-foreground mb-8">
              Introduza o seu email para receber um link de recuperação
            </p>

            {sent ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-secondary/10 text-sm">
                  <CheckCircle size={20} className="text-secondary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Email enviado!</p>
                    <p className="text-muted-foreground mt-1">
                      Verifique a sua caixa de entrada (e a pasta de spam) em <strong>{email}</strong> e clique no link para redefinir a sua senha.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSent(false)}
                  className="text-sm text-secondary hover:underline"
                >
                  Enviar novamente
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Email</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="email"
                      required
                      maxLength={255}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition"
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full bg-gradient-lime text-primary font-semibold py-3.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading ? "A enviar..." : "Enviar Link de Recuperação"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgotPasswordPage;
