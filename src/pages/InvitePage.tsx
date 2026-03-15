import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
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

      // Mark invite as used via edge function (service role)
      await supabase.functions.invoke("mark-invite-used", {
        body: { email: email.toLowerCase().trim(), invite_code: inviteCode.trim() },
      });

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
          emailRedirectTo: "https://chronoseducation.com/auth-redirect",
        },
      });
      if (error) throw error;

      toast({
        title: "Conta criada!",
        description: "Verifique o seu email para confirmar o registro.",
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
              Introduza o seu email e código de convite para verificar - -
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

              {verified !== true && (
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Código de Convite</label>
                <div className="relative">
                  <Key size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={inviteCode}
                    onChange={(e) => { setInviteCode(e.target.value); setVerified(null); }}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition font-mono tracking-widest"
                    placeholder="código de convite"
                  />
                </div>
              </div>
              )}

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
                <div className="p-4 rounded-lg bg-destructive/10 text-sm space-y-2">
                  <div className="flex items-center gap-2 text-destructive font-medium">
                    <XCircle size={18} />
                    <span>Convite inválido ou expirado</span>
                  </div>
                  <p className="text-muted-foreground pl-[26px]">
                    Verifique na sua conta de email o convite recebido da Chronos Education 
                    e aceda através do botão "Aceitar Convite" que recebeu no seu email.
                  </p>
                  <p className="text-muted-foreground pl-[26px]">
                    💡 Caso não encontre o email, verifique a pasta de <strong>spam</strong> ou <strong>lixo eletrônico</strong>.
                  </p>
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
              <>
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

              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">ou</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={async () => {
                  setLoading(true);
                  const { error } = await lovable.auth.signInWithOAuth("google", {
                    redirect_uri: window.location.origin,
                  });
                  if (error) {
                    toast({ title: "Erro", description: error.message, variant: "destructive" });
                    setLoading(false);
                  }
                }}
                className="w-full flex items-center justify-center gap-3 border border-border rounded-lg py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                <svg width="18" height="18" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/><path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
                Continuar com Google
              </button>
              </>
            )}

          </div>
        </div>
      </div>
    </>
  );
};

export default InvitePage;
