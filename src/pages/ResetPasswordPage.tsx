import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Lock, ArrowLeft, Eye, EyeOff, CheckCircle } from "lucide-react";
import chronosLogoHeader from "@/assets/chronos-logo-header.png";
import SEOHead from "@/components/SEOHead";
import PasswordStrength, { passwordIsValid } from "@/components/PasswordStrength";

const ResetPasswordPage = () => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordIsValid(password)) return;
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setSuccess(true);
      toast({
        title: "Senha atualizada!",
        description: "A sua senha foi alterada com sucesso.",
      });

      setTimeout(() => navigate("/login"), 3000);
    } catch (error: any) {
      let msg = error.message || "Erro ao atualizar a senha.";
      if (/new password should be different/i.test(msg)) {
        msg = "A nova senha deve ser diferente da senha antiga.";
      } else if (/auth session missing/i.test(msg)) {
        msg = "Sessão expirada. Por favor, solicite um novo pedido de recuperação.";
      }
      toast({
        title: "Erro",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEOHead
        title="Redefinir Senha — Chronos Education"
        description="Redefina a sua senha na Chronos Education."
        canonical="/reset-password"
      />
      <div className="min-h-screen bg-background flex">
        {/* Left panel */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-hero items-center justify-center p-12 relative">
          <div className="max-w-md">
            <img src={chronosLogoHeader} alt="Chronos Education" className="h-12 mb-6" />
            <p className="text-primary-foreground/70 text-lg leading-relaxed">
              Crie uma nova senha segura para a sua conta.
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
              Redefinir Senha
            </h2>
            <p className="text-muted-foreground mb-8">
              Introduza a sua nova senha abaixo
            </p>

            {success ? (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary/10 text-sm">
                <CheckCircle size={20} className="text-secondary shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Senha atualizada com sucesso!</p>
                  <p className="text-muted-foreground mt-1">Será redirecionado para o login em instantes...</p>
                </div>
              </div>
            ) : !isRecovery ? (
              <div className="p-4 rounded-lg bg-muted text-sm text-muted-foreground">
                <p>A verificar o link de recuperação...</p>
                <p className="mt-2">Se chegou aqui sem usar um link de recuperação, por favor solicite um novo link na <Link to="/login" className="text-secondary underline">página de login</Link>.</p>
              </div>
            ) : (
              <form onSubmit={handleReset} className="space-y-5">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Nova Senha</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 rounded-lg border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <PasswordStrength password={password} />
                </div>

                <button
                  type="submit"
                  disabled={loading || !passwordIsValid(password)}
                  className="w-full bg-gradient-lime text-primary font-semibold py-3.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading ? "A atualizar..." : "Atualizar Senha"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ResetPasswordPage;
