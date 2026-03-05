import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, User, Key, ArrowLeft, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import chronosLogoHeader from "@/assets/chronos-logo-header.png";
import SEOHead from "@/components/SEOHead";

const InvitePage = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [inviteCode, setInviteCode] = useState(searchParams.get("code") || "");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState<boolean | null>(null);
  const [verifying, setVerifying] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Verify invite code + email
  const handleVerify = async () => {
    if (!email || !inviteCode) return;
    setVerifying(true);
    setVerified(null);

    try {
      const { data, error } = await supabase
        .from("invitations")
        .select("id, status, expires_at")
        .eq("email", email.toLowerCase().trim())
        .eq("invite_code", inviteCode.trim())
        .eq("status", "pending")
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setVerified(false);
        toast({
          title: "Convite inválido",
          description: "O email ou código de convite não correspondem.",
          variant: "destructive",
        });
        return;
      }

      // Check expiry
      if (new Date(data.expires_at) < new Date()) {
        setVerified(false);
        toast({
          title: "Convite expirado",
          description: "Este convite já expirou. Solicite um novo convite.",
          variant: "destructive",
        });
        return;
      }

      setVerified(true);
      toast({
        title: "Convite verificado!",
        description: "Preencha os dados abaixo para criar a sua conta.",
      });
    } catch (error: any) {
      setVerified(false);
      toast({
        title: "Erro",
        description: error.message || "Erro ao verificar convite.",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  // Create account after verification
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verified) return;
    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) throw error;

      // Mark invitation as used
      await supabase
        .from("invitations")
        .update({ status: "used", used_at: new Date().toISOString() } as any)
        .eq("email", email.toLowerCase().trim())
        .eq("invite_code", inviteCode.trim());

      toast({
        title: "Conta criada!",
        description: "Verifique o seu email para confirmar o registo.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar conta.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEOHead
        title="Convite — Chronos Education"
        description="Aceite o seu convite e crie a sua conta na Chronos Education."
        canonical="/convite"
      />
      <div className="min-h-screen bg-background flex">
        {/* Left panel */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-hero items-center justify-center p-12 relative">
          <div className="max-w-md">
            <img src={chronosLogoHeader} alt="Chronos Education" className="h-12 mb-6" />
            <p className="text-primary-foreground/70 text-lg leading-relaxed">
              Foi convidado para se juntar à Chronos Education. Verifique o seu convite e crie a sua conta.
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
              Aceitar Convite
            </h2>
            <p className="text-muted-foreground mb-8">
              Introduza o seu email e código de convite para verificar
            </p>

            {/* Step 1: Verify code */}
            <div className="space-y-5 mb-6">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setVerified(null); }}
                    disabled={verified === true}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition disabled:opacity-60"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Código de Convite</label>
                <div className="relative">
                  <Key size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={inviteCode}
                    readOnly
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-muted text-foreground text-sm outline-none transition font-mono tracking-widest cursor-not-allowed opacity-70"
                  />
                </div>
              </div>

              {verified === null && (
                <button
                  onClick={handleVerify}
                  disabled={verifying || !email || !inviteCode}
                  className="w-full bg-primary text-primary-foreground font-semibold py-3.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {verifying ? "A verificar..." : "Verificar Convite"}
                </button>
              )}

              {verified === false && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  <XCircle size={18} />
                  <span>Convite inválido ou expirado. Verifique os dados.</span>
                </div>
              )}

              {verified === true && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/10 text-secondary-foreground text-sm">
                  <CheckCircle size={18} className="text-secondary" />
                  <span>Convite verificado! Crie a sua conta abaixo.</span>
                </div>
              )}
            </div>

            {/* Step 2: Create account (only after verification) */}
            {verified === true && (
              <form onSubmit={handleSignup} className="space-y-5 border-t border-border pt-6">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Nome Completo</label>
                  <div className="relative">
                    <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      required
                      maxLength={100}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition"
                      placeholder="O seu nome"
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-lime text-primary font-semibold py-3.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading ? "A criar conta..." : "Criar Conta"}
                </button>
              </form>
            )}

          </div>
        </div>
      </div>
    </>
  );
};

export default InvitePage;
