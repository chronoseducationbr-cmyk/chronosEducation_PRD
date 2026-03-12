import { useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, ArrowLeft } from "lucide-react";
import GuardianDataSection, { type GuardianData } from "@/components/GuardianDataSection";
import StudentDataSection, { type StudentData } from "@/components/StudentDataSection";
import ReferralSection from "@/components/ReferralSection";
import ContractSignatureSection from "@/components/ContractSignatureSection";
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
  const [wizardStep, setWizardStep] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [contractAccepted, setContractAccepted] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const guardianRef = useRef<GuardianData>({ fullName: "", email: "", phone: "", cpf: "" });
  const studentRef = useRef<StudentData>({ studentName: "", studentBirthDate: "", studentGender: "", studentEmail: "", studentAddress: "", studentSchool: "", studentGraduationYear: "", studentPhotoUrl: "" });
  const referralRef = useRef("");

  const handleGuardianChange = useCallback((data: GuardianData) => { guardianRef.current = data; }, []);
  const handleStudentChange = useCallback((data: StudentData) => { studentRef.current = data; }, []);
  const handleReferralChange = useCallback((email: string) => { referralRef.current = email; }, []);

  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Aluno";

  const handleSubmitEnrollment = async () => {
    const g = guardianRef.current;
    const s = studentRef.current;
    if (!user) return;

    const missingFields: string[] = [];
    if (!s.studentName.trim()) missingFields.push("Nome do aluno");
    if (!s.studentBirthDate) missingFields.push("Data de nascimento");
    if (!s.studentEmail.trim()) missingFields.push("Email do aluno");
    if (!s.studentAddress.trim()) missingFields.push("Endereço");
    if (!s.studentSchool.trim()) missingFields.push("Escola atual");
    if (!s.studentGraduationYear) missingFields.push("Ano de conclusão");

    if (missingFields.length > 0) {
      toast({ title: "Campos obrigatórios em falta", description: missingFields.join(", "), variant: "destructive" });
      return;
    }

    // Validate student age (must be between 13 and 17)
    if (s.studentBirthDate) {
      const birthDate = new Date(s.studentBirthDate);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 13 || age > 17) {
        toast({ title: "Idade inválida", description: "O aluno deve ter entre 13 e 17 anos na data da inscrição.", variant: "destructive" });
        return;
      }
    }

    // Validate graduation year: November of that year must be at least 16 months from now
    if (s.studentGraduationYear) {
      const now = new Date();
      const gradYear = parseInt(s.studentGraduationYear, 10);
      const gradDate = new Date(gradYear, 10, 1); // November 1st of graduation year
      const minDate = new Date(now.getFullYear(), now.getMonth() + 16, 1);
      if (gradDate < minDate) {
        const minGradYear = minDate.getMonth() >= 10 ? minDate.getFullYear() : minDate.getFullYear() + (minDate.getMonth() < 10 ? 0 : 1);
        const earliestYear = new Date(now.getFullYear(), now.getMonth() + 16, 1).getMonth() >= 10
          ? new Date(now.getFullYear(), now.getMonth() + 16, 1).getFullYear()
          : new Date(now.getFullYear(), now.getMonth() + 16, 1).getFullYear() + 1;
        toast({ title: "Ano de conclusão inválido", description: `O ano previsto deve ser ${earliestYear} ou superior.`, variant: "destructive" });
        return;
      }
    }

    const targetEmail = g.email?.trim() || user?.email;
    if (!targetEmail) {
      toast({ title: "Preencha o email do responsável", variant: "destructive" });
      return;
    }

    setPaying(true);
    try {
      // Check if student email is already enrolled
      const { data: existingEnrollment } = await supabase
        .from("enrollments")
        .select("id")
        .eq("student_email", s.studentEmail.trim())
        .maybeSingle();

      if (existingEnrollment) {
        toast({ title: "Email já inscrito", description: "Já existe uma matrícula com este email de aluno.", variant: "destructive" });
        setPaying(false);
        return;
      }

      // Validate referral email if provided
      const referral = referralRef.current.trim();
      if (referral) {
        const { data: referredEnrollment } = await supabase
          .from("enrollments")
          .select("id")
          .eq("student_email", referral)
          .maybeSingle();

        if (!referredEnrollment) {
          toast({ title: "Email de indicação inválido", description: "O email indicado não corresponde a nenhum aluno inscrito.", variant: "destructive" });
          setPaying(false);
          return;
        }
      }
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
      const { data: newEnrollment, error: enrollError } = await supabase
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
        } as any)
        .select("id")
        .single();
      if (enrollError) throw enrollError;

      // Track referral if a referral email was provided
      if (referral && newEnrollment) {
        const { data: referrerEnrollment } = await supabase
          .from("enrollments")
          .select("id, student_email")
          .eq("student_email", referral)
          .maybeSingle();

        if (referrerEnrollment) {
          await supabase.from("referrals" as any).insert({
            referrer_enrollment_id: referrerEnrollment.id,
            referred_enrollment_id: newEnrollment.id,
            referrer_student_email: referrerEnrollment.student_email,
            referred_student_email: s.studentEmail.trim(),
          });
        }
      }

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

      toast({ title: "Matrícula enviada!", description: "A equipa Chronos foi notificada e entrará em contacto em breve." });
      setShowForm(false);
      setWizardStep(1);
      setContractAccepted(false);
      setRefreshKey((k) => k + 1);
      // Reset student refs
      studentRef.current = { studentName: "", studentBirthDate: "", studentGender: "", studentEmail: "", studentAddress: "", studentSchool: "", studentGraduationYear: "", studentPhotoUrl: "" };
      referralRef.current = "";
    } catch (err: any) {
      console.error(err);
      toast({ title: "Erro ao processar", description: err.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setPaying(false);
    }
  };

  const validateStep1 = (): boolean => {
    const g = guardianRef.current;
    const s = studentRef.current;
    const errors: string[] = [];
    const missingFields: string[] = [];

    // Guardian fields
    if (!g.fullName.trim()) { missingFields.push("Nome do responsável"); errors.push("guardianFullName"); }
    if (!g.email.trim()) { missingFields.push("Email do responsável"); errors.push("guardianEmail"); }
    if (!g.phone.trim()) { missingFields.push("Celular do responsável"); errors.push("guardianPhone"); }

    // Student fields
    if (!s.studentName.trim()) { missingFields.push("Nome do aluno"); errors.push("studentName"); }
    if (!s.studentBirthDate) { missingFields.push("Data de nascimento"); errors.push("studentBirthDate"); }
    if (!s.studentEmail.trim()) { missingFields.push("Email do aluno"); errors.push("studentEmail"); }
    if (!s.studentAddress.trim()) { missingFields.push("Endereço"); errors.push("studentAddress"); }
    if (!s.studentSchool.trim()) { missingFields.push("Escola atual"); errors.push("studentSchool"); }
    if (!s.studentGraduationYear) { missingFields.push("Ano de conclusão"); errors.push("studentGraduationYear"); }

    if (errors.length > 0) {
      setValidationErrors(errors);
      toast({ title: "Campos obrigatórios em falta", description: missingFields.join(", "), variant: "destructive" });
      return false;
    }

    if (s.studentBirthDate) {
      const birthDate = new Date(s.studentBirthDate);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
      if (age < 13 || age > 17) {
        setValidationErrors(["studentBirthDate"]);
        toast({ title: "Idade inválida", description: "O aluno deve ter entre 13 e 17 anos na data da inscrição.", variant: "destructive" });
        return false;
      }
    }

    if (s.studentGraduationYear) {
      const now = new Date();
      const gradYear = parseInt(s.studentGraduationYear, 10);
      const gradDate = new Date(gradYear, 10, 1);
      const minDate = new Date(now.getFullYear(), now.getMonth() + 16, 1);
      if (gradDate < minDate) {
        const earliestYear = minDate.getMonth() >= 10 ? minDate.getFullYear() : minDate.getFullYear() + 1;
        setValidationErrors(["studentGraduationYear"]);
        toast({ title: "Ano de conclusão inválido", description: `O ano previsto deve ser ${earliestYear} ou superior.`, variant: "destructive" });
        return false;
      }
    }

    setValidationErrors([]);
    return true;
  };

  return (
    <div className="min-h-screen bg-background">
        <SEOHead
        title="Matrículas — Chronos Education"
        description="Gerencie as suas matrículas no programa Dual Diploma."
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
        <p className="text-muted-foreground mb-6">Gerencie as matrículas e pagamentos do programa Dual Diploma</p>

        <Tabs defaultValue="inscricoes" className="w-full">
          <TabsList className="mb-10 bg-transparent border-0 border-b border-border p-0 gap-10 pb-0">
            <TabsTrigger
              value="inscricoes"
              className="bg-transparent px-4 py-3 rounded-none shadow-none text-lg text-muted-foreground data-[state=active]:text-[#f9b41f] data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#f9b41f] data-[state=active]:bg-transparent font-semibold"
            >
              Matrículas
            </TabsTrigger>
            <TabsTrigger
              value="pagamentos"
              className="bg-transparent px-4 py-3 rounded-none shadow-none text-lg text-muted-foreground data-[state=active]:text-[#f9b41f] data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#f9b41f] data-[state=active]:bg-transparent font-semibold"
            >
              Pagamentos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inscricoes">
            <div className="max-w-xl">
              {!showForm ? (
                <>
                  <GuardianDataSection onChange={handleGuardianChange} validationErrors={validationErrors} />
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
                    onClick={() => {
                      if (wizardStep === 2) {
                        setWizardStep(1);
                      } else {
                        setShowForm(false);
                        setWizardStep(1);
                        setContractAccepted(false);
                      }
                    }}
                    className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-4"
                  >
                    <ArrowLeft size={16} />
                    {wizardStep === 2 ? "Voltar aos dados do aluno" : "Voltar às matrículas"}
                  </button>

                  <h2 className="font-heading text-xl font-semibold text-foreground mb-2">
                    Nova Matrícula
                  </h2>

                  {/* Step indicator */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${wizardStep === 1 ? "bg-secondary text-secondary-foreground" : "bg-secondary/20 text-secondary"}`}>
                        1
                      </div>
                      <span className={`text-sm font-medium ${wizardStep === 1 ? "text-foreground" : "text-muted-foreground"}`}>
                        Dados do Aluno
                      </span>
                    </div>
                    <div className="w-8 h-px bg-border" />
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${wizardStep === 2 ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"}`}>
                        2
                      </div>
                      <span className={`text-sm font-medium ${wizardStep === 2 ? "text-foreground" : "text-muted-foreground"}`}>
                        Assinatura de Contrato
                      </span>
                    </div>
                  </div>

                  {/* Step 1: Student Data */}
                  {wizardStep === 1 && (
                    <>
                      <GuardianDataSection onChange={handleGuardianChange} validationErrors={validationErrors} />
                      <div className="mt-6">
                        <StudentDataSection onChange={handleStudentChange} validationErrors={validationErrors} initialData={studentRef.current} />
                      </div>

                      <div className="mt-8">
                        <ReferralSection onChange={handleReferralChange} />
                      </div>

                      <div className="mt-8">
                        <button
                          onClick={() => {
                            if (validateStep1()) {
                              setWizardStep(2);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }
                          }}
                          className="w-full border-2 border-secondary text-primary bg-transparent font-semibold py-3.5 rounded-lg hover:bg-secondary/10 transition-colors"
                        >
                          Continuar para Assinatura
                        </button>
                      </div>
                    </>
                  )}

                  {/* Step 2: Contract Signature */}
                  {wizardStep === 2 && (
                    <>
                      <ContractSignatureSection onAcceptChange={setContractAccepted} guardianData={guardianRef.current} studentData={studentRef.current} />

                      <div className="mt-8">
                        <button
                          onClick={handleSubmitEnrollment}
                          disabled={paying || !contractAccepted}
                          className="w-full bg-secondary text-secondary-foreground font-semibold py-3.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {paying ? "Processando..." : "Confirmar matrícula"}
                        </button>
                        {!contractAccepted && (
                          <p className="text-xs text-muted-foreground text-center mt-2">
                            É necessário assinar o contrato para prosseguir.
                          </p>
                        )}
                      </div>
                    </>
                  )}
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
