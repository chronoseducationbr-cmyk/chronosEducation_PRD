import { useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut } from "lucide-react";
import GuardianDataSection, { type GuardianData } from "@/components/GuardianDataSection";
import StudentDataSection, { type StudentData } from "@/components/StudentDataSection";
import ReferralSection from "@/components/ReferralSection";
import EnrollmentsList from "@/components/EnrollmentsList";
import PaymentsList from "@/components/PaymentsList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import chronosLogo from "@/assets/chronos-logo-header.png";
import SEOHead from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const DashboardPage = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [paying, setPaying] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const guardianRef = useRef<GuardianData>({ fullName: "", email: "", phone: "", cpf: "" });
  const studentRef = useRef<StudentData>({ studentName: "", studentBirthDate: "", studentEmail: "", studentAddress: "", studentSchool: "", studentGraduationYear: "" });
  const referralRef = useRef("");

  const handleGuardianChange = useCallback((data: GuardianData) => { guardianRef.current = data; }, []);
  const handleStudentChange = useCallback((data: StudentData) => { studentRef.current = data; }, []);
  const handleReferralChange = useCallback((email: string) => { referralRef.current = email; }, []);

  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Aluno";

  const handleSubmitEnrollment = async () => {
    const g = guardianRef.current;
    const s = studentRef.current;
    if (!user) return;

    if (!s.studentName.trim()) {
      toast({ title: "Preencha o nome do aluno", variant: "destructive" });
      return;
    }

    const targetEmail = g.email?.trim() || user?.email;
    if (!targetEmail) {
      toast({ title: "Preencha o email do responsável", variant: "destructive" });
      return;
    }

    setPaying(true);
    try {
      // Save guardian profile data
      await supabase
        .from("profiles")
        .update({
          full_name: g.fullName.trim(),
          email: g.email.trim(),
          phone: g.phone.trim(),
        } as any)
        .eq("user_id", user.id);

      // Create enrollment record
      const { error: enrollError } = await supabase
        .from("enrollments")
        .insert({
          user_id: user.id,
          student_name: s.studentName.trim(),
          student_email: s.studentEmail.trim(),
          student_birth_date: s.studentBirthDate || null,
          student_address: s.studentAddress.trim(),
          student_school: s.studentSchool.trim(),
          student_graduation_year: s.studentGraduationYear ? parseInt(s.studentGraduationYear, 10) : null,
          referred_by_email: referralRef.current.trim(),
          status: "Aguarda assinatura de contrato",
        } as any);
      if (enrollError) throw enrollError;

      const guardianName = g.fullName?.trim() || userName;

      // Send both emails
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
              cpf: g.cpf,
            },
            student: {
              student_name: s.studentName,
              student_email: s.studentEmail,
              student_birth_date: s.studentBirthDate,
              student_address: s.studentAddress,
              student_school: s.studentSchool,
              student_graduation_year: s.studentGraduationYear,
            },
            payment_method: "Não especificado",
            referred_by_email: referralRef.current.trim(),
          },
        }),
      ]);
      if (enrollmentResult.error) throw enrollmentResult.error;
      if (notificationResult.error) throw notificationResult.error;

      toast({ title: "Inscrição enviada!", description: "A equipa Chronos foi notificada e entrará em contacto em breve." });
      setShowForm(false);
      setRefreshKey((k) => k + 1);
      // Reset student refs
      studentRef.current = { studentName: "", studentBirthDate: "", studentEmail: "", studentAddress: "", studentSchool: "", studentGraduationYear: "" };
      referralRef.current = "";
    } catch (err: any) {
      console.error(err);
      toast({ title: "Erro ao processar", description: err.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Inscrições — Chronos Education"
        description="Gerencie as suas inscrições no programa Dual Diploma."
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
        <h1 className="font-heading text-3xl font-bold text-foreground mb-2">Painel</h1>
        <p className="text-muted-foreground mb-6">Gerencie as inscrições e pagamentos do programa Dual Diploma.</p>

        <Tabs defaultValue="inscricoes" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="inscricoes">Inscrições</TabsTrigger>
            <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
          </TabsList>

          <TabsContent value="inscricoes">
            <div className="max-w-lg">
              {!showForm ? (
                <>
                  <GuardianDataSection onChange={handleGuardianChange} />
                  <div className="mt-8">
                    <EnrollmentsList
                      onNewEnrollment={() => setShowForm(true)}
                      refreshKey={refreshKey}
                    />
                  </div>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setShowForm(false)}
                    className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-4"
                  >
                    <ArrowLeft size={16} />
                    Voltar às inscrições
                  </button>

                  <h2 className="font-heading text-xl font-semibold text-foreground mb-6">
                    Nova Inscrição
                  </h2>

                  <StudentDataSection onChange={handleStudentChange} />

                  <div className="mt-8">
                    <ReferralSection onChange={handleReferralChange} />
                  </div>

                  <div className="mt-8">
                    <button
                      onClick={handleSubmitEnrollment}
                      disabled={paying}
                      className="w-full bg-secondary text-secondary-foreground font-semibold py-3.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {paying ? "Processando..." : "Confirmar Inscrição"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="pagamentos">
            <div className="max-w-2xl">
              <PaymentsList refreshKey={refreshKey} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DashboardPage;
