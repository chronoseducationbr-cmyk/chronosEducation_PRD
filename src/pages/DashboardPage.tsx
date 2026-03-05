import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, User, CreditCard, QrCode, FileText, Building2, Mail, Eye, Send } from "lucide-react";
import GuardianDataSection, { type GuardianData } from "@/components/GuardianDataSection";
import StudentDataSection, { type StudentData } from "@/components/StudentDataSection";
import chronosLogo from "@/assets/chronos-logo-header.png";
import SEOHead from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const paymentMethods = [
  { id: "credit", icon: CreditCard, label: "Cartão de Crédito", description: "Visa, Mastercard, Amex" },
  { id: "pix", icon: QrCode, label: "PIX", description: "Pagamento instantâneo" },
  { id: "boleto", icon: FileText, label: "Boleto Bancário", description: "Vencimento em 3 dias úteis" },
  { id: "transfer", icon: Building2, label: "Transferência Bancária", description: "TED ou DOC" },
];

const buildPreviewHtml = (userName: string) => `
<div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;">
  <div style="background:linear-gradient(135deg,#062a45 0%,#0d3d5e 100%);padding:32px 40px;border-radius:16px 16px 0 0;text-align:center;">
    <img src="/chronos-logo-header.png" alt="Chronos Education" style="height:40px;margin-bottom:12px;" />
    <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.6);letter-spacing:2px;text-transform:uppercase;">Dual Diploma Program</p>
  </div>
  <div style="background:linear-gradient(135deg,#80ff00 0%,#6de600 100%);height:4px;"></div>
  <div style="background-color:#f7f8f9;padding:40px;border-radius:0 0 16px 16px;">
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-block;width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#80ff00,#6de600);line-height:64px;text-align:center;font-size:32px;">✓</div>
    </div>
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#062a45;text-align:center;font-family:Georgia,serif;">Inscrição Confirmada!</h2>
    <p style="margin:0 0 24px;font-size:15px;color:#5a6a78;text-align:center;line-height:1.6;">Parabéns, <strong style="color:#062a45;">${userName}</strong>!</p>
    <div style="background-color:#ffffff;border-radius:12px;border:1px solid #e8ecef;padding:24px;margin-bottom:24px;">
      <p style="margin:0 0 16px;font-size:15px;color:#333;line-height:1.7;">A sua inscrição no programa <strong>Dual Diploma</strong> foi processada com sucesso. Agradecemos a confiança nos nossos serviços.</p>
      <p style="margin:0 0 16px;font-size:15px;color:#333;line-height:1.7;">A partir de agora, a nossa equipa irá entrar em contacto consigo com os próximos passos para iniciar a sua jornada rumo ao diploma americano.</p>
      <p style="margin:0;font-size:15px;color:#333;line-height:1.7;">Se tiver alguma dúvida, não hesite em contactar-nos.</p>
    </div>
    <hr style="border:none;border-top:1px solid #e8ecef;margin:32px 0 24px;" />
    <hr style="border:none;border-top:1px solid #e8ecef;margin:32px 0 24px;" />
    <div style="text-align:center;">
      <p style="margin:0 0 4px;font-size:13px;color:#5a6a78;">📧 chronoseducationbr@gmail.com</p>
      <p style="margin:0 0 16px;font-size:13px;color:#5a6a78;">📞 (11) 99949-1067</p>
      <p style="margin:0;font-size:12px;color:#9aa8b5;">© ${new Date().getFullYear()} Chronos Education. Todos os direitos reservados.</p>
    </div>
  </div>
</div>
`;

const DashboardPage = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [sendingTest, setSendingTest] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  const guardianRef = useRef<GuardianData>({ fullName: "", email: "", phone: "", cpf: "" });
  const studentRef = useRef<StudentData>({ studentName: "", studentBirthDate: "", studentEmail: "", studentAddress: "", studentSchool: "", studentGraduationYear: "" });

  const handleGuardianChange = useCallback((data: GuardianData) => { guardianRef.current = data; }, []);
  const handleStudentChange = useCallback((data: StudentData) => { studentRef.current = data; }, []);

  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Aluno";

  const handlePayment = async () => {
    const g = guardianRef.current;
    const s = studentRef.current;
    if (!selectedMethod) {
      toast({ title: "Selecione um método de pagamento", variant: "destructive" });
      return;
    }
    if (!user) return;
    setPaying(true);
    try {
      // Save profile data automatically
      await supabase
        .from("profiles")
        .update({
          full_name: g.fullName.trim(),
          email: g.email.trim(),
          phone: g.phone.trim(),
          student_name: s.studentName.trim(),
          student_email: s.studentEmail.trim(),
          student_birth_date: s.studentBirthDate || null,
          student_address: s.studentAddress.trim(),
          student_school: s.studentSchool.trim(),
          student_graduation_year: s.studentGraduationYear ? parseInt(s.studentGraduationYear, 10) : null,
        } as any)
        .eq("user_id", user.id);

      const methodLabel = paymentMethods.find(m => m.id === selectedMethod)?.label || selectedMethod;
      const { error } = await supabase.functions.invoke("send-purchase-notification", {
        body: {
          guardian: {
            full_name: g.fullName,
            email: g.email || user?.email || "",
            phone: g.phone,
          },
          student: {
            student_name: s.studentName,
            student_email: s.studentEmail,
            student_birth_date: s.studentBirthDate,
            student_address: s.studentAddress,
            student_school: s.studentSchool,
            student_graduation_year: s.studentGraduationYear,
          },
          payment_method: methodLabel,
        },
      });
      if (error) throw error;
      toast({ title: "Inscrição enviada!", description: "A equipa Chronos foi notificada e entrará em contacto em breve." });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Erro ao processar", description: err.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setPaying(false);
    }
  };

  const handleSendTestEmails = async () => {
    const guardianEmail = guardianRef.current.email?.trim();
    const targetEmail = guardianEmail || user?.email;
    if (!targetEmail) {
      toast({ title: "Preencha o email do responsável", variant: "destructive" });
      return;
    }
    const guardianName = guardianRef.current.fullName?.trim() || userName;
    const g = guardianRef.current;
    const s = studentRef.current;
    const methodLabel = selectedMethod
      ? paymentMethods.find(m => m.id === selectedMethod)?.label || selectedMethod
      : "Não selecionado (teste)";

    setSendingTest(true);
    try {
      const [enrollmentResult, notificationResult] = await Promise.all([
        supabase.functions.invoke("send-enrollment-email", {
          body: { email: targetEmail, name: guardianName },
        }),
        supabase.functions.invoke("send-purchase-notification", {
          body: {
            guardian: {
              full_name: g.fullName,
              email: g.email || user?.email || "",
              phone: g.phone,
            },
            student: {
              student_name: s.studentName,
              student_email: s.studentEmail,
              student_birth_date: s.studentBirthDate,
              student_address: s.studentAddress,
              student_school: s.studentSchool,
              student_graduation_year: s.studentGraduationYear,
            },
            payment_method: methodLabel,
          },
        }),
      ]);
      if (enrollmentResult.error) throw enrollmentResult.error;
      if (notificationResult.error) throw notificationResult.error;
      toast({
        title: "Emails de teste enviados!",
        description: `Confirmação → ${targetEmail} | Notificação → contato@chronoseducation.com`,
      });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Erro ao enviar", description: err.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Pagamentos — Chronos Education"
        description="Gerencie os seus pagamentos do programa Dual Diploma."
        canonical="/pagamentos"
      />
      {/* Top bar */}
      <header className="bg-primary border-b border-primary-foreground/10">
        <div className="container-narrow flex items-center justify-between h-16 px-4 md:px-8">
          <Link to="/" className="flex items-center">
            <img src={chronosLogo} alt="Chronos Education" className="h-8" />
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-primary-foreground/70 hidden sm:block">
              {user?.email}
            </span>
            <Link
              to="/profile"
              className="text-primary-foreground/70 hover:text-secondary transition-colors"
              title="Editar perfil"
            >
              <User size={20} />
            </Link>
            <button
              onClick={signOut}
              className="text-primary-foreground/70 hover:text-secondary transition-colors"
              title="Sair"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <div className="container-narrow px-4 md:px-8 py-8">
        <h1 className="font-heading text-3xl font-bold text-foreground mb-2">Pagamentos</h1>
        <p className="text-muted-foreground mb-8">Compre o Dual Diploma de forma fácil e segura.</p>

        <div className="max-w-lg">
          <GuardianDataSection onChange={handleGuardianChange} />

          <div className="mt-8">
            <StudentDataSection onChange={handleStudentChange} />
          </div>

          <div className="mt-8">
          <h2 className="font-heading text-lg font-semibold text-foreground mb-3">Forma de pagamento</h2>
          <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
            {paymentMethods.map((method, index) => (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                className={`w-full flex items-center gap-4 p-5 text-left transition-colors ${
                  index > 0 ? "border-t border-border" : ""
                } ${selectedMethod === method.id ? "bg-secondary/10 ring-2 ring-secondary ring-inset" : "hover:bg-muted/50"}`}
              >
                <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
                  <method.icon size={20} />
                </div>
                <div>
                  <p className="font-medium text-foreground">{method.label}</p>
                  <p className="text-sm text-muted-foreground">{method.description}</p>
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={handlePayment}
            disabled={!selectedMethod || paying}
            className="w-full bg-secondary text-secondary-foreground font-semibold py-3.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {paying ? "Processando..." : "Confirmar Inscrição"}
          </button>

          {/* Test email section */}
          <div className="mt-8 p-5 bg-card rounded-xl border border-border shadow-card">
            <h3 className="font-heading text-base font-semibold text-foreground mb-1">
              📧 Email de confirmação (teste)
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Simule o envio do email que o aluno receberá após o pagamento ser confirmado.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPreview(true)}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border border-border text-foreground font-medium hover:bg-muted/50 transition-colors text-sm"
              >
                <Eye size={16} />
                Pré-visualizar
              </button>
              <button
                onClick={handleSendTestEmail}
                disabled={sendingTest}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-secondary text-secondary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 text-sm"
              >
                <Mail size={16} />
                {sendingTest ? "Enviando..." : "Enviar para mim"}
              </button>
            </div>
          </div>

          {/* Test Chronos notification email */}
          <div className="mt-4 p-5 bg-card rounded-xl border border-border shadow-card">
            <h3 className="font-heading text-base font-semibold text-foreground mb-1">
              📩 Email de notificação Chronos (teste)
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Simule o envio do email que a Chronos receberá com todos os dados do responsável, aluno e método de pagamento.
            </p>
            <button
              onClick={handleSendChronosTestEmail}
              disabled={sendingChronosTest}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 text-sm"
            >
              <Send size={16} />
              {sendingChronosTest ? "Enviando..." : "Enviar notificação de teste para Chronos"}
            </button>
          </div>
          </div>
        </div>
      </div>

      {/* Email preview dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pré-visualização do Email</DialogTitle>
            <DialogDescription>
              Este é o email que o aluno receberá após a confirmação do pagamento.
            </DialogDescription>
          </DialogHeader>
          <div
            className="mt-4 rounded-lg overflow-hidden border border-border"
            dangerouslySetInnerHTML={{ __html: buildPreviewHtml(userName) }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardPage;
