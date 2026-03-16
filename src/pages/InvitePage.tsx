import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, User, Key, ArrowLeft, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import chronosLogoHeader from "@/assets/chronos-logo-header.png";
import SEOHead from "@/components/SEOHead";
import PasswordStrength, { passwordIsValid } from "@/components/PasswordStrength";

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
  const [accountCreated, setAccountCreated] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Verify invite code + email (read-only check, does NOT mark as used)
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

  // Create account via backend (email auto-confirmed) and log in
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verified || !passwordIsValid(password)) return;
    setLoading(true);

    try {
      // 1. Create user via edge function (email auto-confirmed, invite marked as used)
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        "signup-with-invite",
        {
          body: {
            email: email.toLowerCase().trim(),
            password,
            full_name: fullName,
            invite_code: inviteCode.trim(),
          },
        }
      );

      if (fnError) throw fnError;
      if (fnData?.error) throw new Error(fnData.error);

      // If fallback (link generation failed), sign in directly
      if (fnData?.fallback) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.toLowerCase().trim(),
          password,
        });
        if (signInError) throw signInError;
        toast({
          title: "Conta criada com sucesso!",
          description: "Bem-vindo à Chronos Education.",
        });
        navigate("/gestao-matriculas");
        return;
      }

      // Normal flow: email confirmation required
      setAccountCreated(true);
      toast({
        title: "Conta criada!",
        description: "Verifique o seu email para confirmar a conta.",
      });
    } catch (error: any) {
      let msg = error.message || "Erro ao criar conta.";
      if (/user already registered/i.test(msg)) {
        msg = "Usuário já registrado.";
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
        title="Convite — Chronos Education"
        description="Aceite o seu convite e crie a sua conta na Chronos Education."
        canonical="/convite"
      />
      {accountCreated ? (
        <div className="min-h-screen bg-background flex items-center justify-center p-8">
          <div className="w-full max-w-md text-center space-y-6">
            <CheckCircle size={48} className="mx-auto text-secondary" />
            <h2 className="font-heading text-2xl font-bold text-foreground">
              Conta criada com sucesso!
            </h2>
            <p className="text-muted-foreground">
              Enviámos um email de confirmação para <strong>{email}</strong>. 
              Abra o email e clique no botão de confirmação para ativar a sua conta.
            </p>
            <div className="p-4 rounded-lg bg-muted text-sm text-muted-foreground">
              💡 Se não encontrar o email, verifique a pasta de <strong>spam</strong> ou <strong>lixo eletrônico</strong>.
            </div>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm font-medium text-secondary hover:underline"
            >
              Ir para o login
            </Link>
          </div>
        </div>
      ) : (
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
                  {loading ? "A criar conta..." : "Criar Conta"}
                </button>
              </form>
              </>
            )}

          </div>
        </div>
      </div>
      )}
    </>
  );
};

export default InvitePage;
