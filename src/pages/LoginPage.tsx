import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, ArrowLeft, Eye, EyeOff } from "lucide-react";
import chronosLogoHeader from "@/assets/chronos-logo-header.png";
import SEOHead from "@/components/SEOHead";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) {
        void redirectByRole(session.user.id);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const redirectByRole = async (userId: string) => {
    const { data } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin" as const,
    });
    navigate(data ? "/admin" : "/gestao-matriculas");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await redirectByRole(data.user.id);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message === "Invalid login credentials"
          ? "O seu email de login e/ou senha estão errados."
          : (error.message || "Ocorreu um erro. Tente novamente."),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEOHead
        title="Entrar — Chronos Education"
        description="Acesse a sua área privada do programa Dual Diploma da Chronos Education."
        canonical="/login"
      />
      <div className="min-h-screen bg-background flex">
        {/* Left panel */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-hero items-center justify-center p-12 relative">
          <div className="max-w-md">
            <img src={chronosLogoHeader} alt="Chronos Education" className="h-12 mb-6" />
            <p className="text-primary-foreground/70 text-lg leading-relaxed">
              Acesse a sua área privada para fazer a matrícula
            </p>
          </div>
        </div>

        {/* Right panel */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
              <ArrowLeft size={16} />
              Voltar ao site
            </Link>

            <h2 className="font-heading text-3xl font-bold text-foreground mb-2">
              Entrar
            </h2>
            <p className="text-muted-foreground mb-8">
              Acesse a sua área privada
            </p>

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

              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Senha</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
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
              </div>

              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-sm text-secondary hover:underline">
                  Esqueceu a senha?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-lime text-primary font-semibold py-3.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? "Aguarde..." : "Entrar"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
