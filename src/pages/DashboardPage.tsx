import { useState, useCallback, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, ArrowLeft, AlertTriangle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import GuardianDataSection, { type GuardianData } from "@/components/GuardianDataSection";
import StudentDataSection, { type StudentData } from "@/components/StudentDataSection";
import ReferralSection from "@/components/ReferralSection";

import EnrollmentsList from "@/components/EnrollmentsList";
import PaymentsList from "@/components/PaymentsList";
import ContractsList from "@/components/ContractsList";
import QuizResultsList from "@/components/QuizResultsList";
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
  const [hasUnsignedContract, setHasUnsignedContract] = useState(false);
  const [hasOverdueInstallment, setHasOverdueInstallment] = useState(false);

  useEffect(() => {
    const checkUnsignedContracts = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("enrollments")
        .select("id, contract_url, contract_url_summercamp, contract_signed_at_platform, contract_signed_at_summercamp")
        .eq("user_id", user.id);
      const hasUnsigned = (data || []).some(e =>
        (e.contract_url && !e.contract_signed_at_platform) ||
        (e.contract_url_summercamp && !e.contract_signed_at_summercamp)
      );
      setHasUnsignedContract(hasUnsigned);
    };
    checkUnsignedContracts();
  }, [user, refreshKey]);

  useEffect(() => {
    const checkOverdueInstallments = async () => {
      if (!user) return;
      const { data: enrs } = await supabase
        .from("enrollments")
        .select("id")
        .eq("user_id", user.id);
      if (!enrs || enrs.length === 0) { setHasOverdueInstallment(false); return; }
      const ids = enrs.map(e => e.id);
      const { data: overdueInsts } = await supabase
        .from("installments")
        .select("id")
        .in("enrollment_id", ids)
        .eq("status", "overdue")
        .limit(1);
      setHasOverdueInstallment((overdueInsts || []).length > 0);
    };
    checkOverdueInstallments();
  }, [user, refreshKey]);
  
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<{ plataforma: boolean; summercamp: boolean }>({ plataforma: false, summercamp: false });

  const emptyGuardian: GuardianData = { fullName: "", email: "", phone: "", cpf: "", nationality: "", civilStatus: "", profession: "", rgNumber: "", guardianAddress: "" };
  const guardianRef = useRef<GuardianData>({ ...emptyGuardian });
  const contractGuardianRef = useRef<GuardianData>({ ...emptyGuardian });
  const [contractGuardianInitial, setContractGuardianInitial] = useState<GuardianData>({ ...emptyGuardian });
  const studentRef = useRef<StudentData>({ studentName: "", studentBirthDate: "", studentGender: "", studentEmail: "", studentAddress: "", studentSchool: "", studentGraduationYear: "", studentPhotoUrl: "" });
  const referralRef = useRef("");

  const handleGuardianChange = useCallback((data: GuardianData) => { guardianRef.current = data; }, []);
  const handleContractGuardianChange = useCallback((data: GuardianData) => { contractGuardianRef.current = data; }, []);
  const handleStudentChange = useCallback((data: StudentData) => { studentRef.current = data; }, []);
  const handleReferralChange = useCallback((email: string) => { referralRef.current = email; }, []);

  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Aluno";

  const handleSubmitEnrollment = async () => {
    const g = guardianRef.current;
    const cg = contractGuardianRef.current;
    const s = studentRef.current;
    if (!user) return;

    const targetEmail = cg.email?.trim() || g.email?.trim() || user?.email;
    if (!targetEmail) {
      toast({ title: "Preencha o email do responsável do contrato", variant: "destructive" });
      return;
    }

    setPaying(true);
    try {
      const [{ data: existingEnrollment }, { data: activeTest }] = await Promise.all([
        supabase
          .from("enrollments")
          .select("id")
          .eq("student_email", s.studentEmail.trim())
          .maybeSingle(),
        supabase
          .from("quiz_tests" as any)
          .select("id")
          .eq("is_active", true)
          .limit(1)
          .maybeSingle(),
      ]);

      if (existingEnrollment) {
        toast({
          title: "Email do aluno já inscrito",
          description: `Já existe uma matrícula com o email de aluno "${s.studentEmail.trim()}". Volte ao passo 1 e use um email de aluno diferente.`,
          variant: "destructive",
        });
        setWizardStep(1);
        setPaying(false);
        return;
      }

      // Save guardian profile data (pai/mãe da conta)
      await supabase
        .from("profiles")
        .update({
          full_name: g.fullName.trim(),
          email: g.email.trim(),
          phone: g.phone.trim(),
          cpf: g.cpf.trim(),
          nationality: g.nationality.trim(),
          civil_status: g.civilStatus.trim(),
          profession: g.profession.trim(),
          rg_number: g.rgNumber.trim(),
          guardian_address: g.guardianAddress.trim(),
        } as any)
        .eq("user_id", user.id);

      // Create enrollment record (with contract guardian data)
      const insertData: any = {
        user_id: user.id,
        student_name: s.studentName.trim(),
        student_email: s.studentEmail.trim(),
        student_birth_date: s.studentBirthDate || null,
        student_address: s.studentAddress.trim(),
        student_school: s.studentSchool.trim(),
        student_photo_url: s.studentPhotoUrl?.trim() || null,
        student_graduation_year: s.studentGraduationYear ? parseInt(s.studentGraduationYear, 10) : null,
        referred_by_email: referralRef.current.trim(),
        guardian_email: cg.email?.trim() || g.email?.trim() || user?.email || "",
        contract_guardian_full_name: cg.fullName.trim(),
        contract_guardian_email: cg.email.trim(),
        contract_guardian_phone: cg.phone.trim(),
        contract_guardian_cpf: cg.cpf.trim(),
        contract_guardian_rg: cg.rgNumber.trim(),
        contract_guardian_nationality: cg.nationality.trim(),
        contract_guardian_civil_status: cg.civilStatus.trim(),
        contract_guardian_profession: cg.profession.trim(),
        contract_guardian_address: cg.guardianAddress.trim(),
        status: "Matrícula submetida",
        inscription_fee_cents: 0,
        tuition_installments: selectedServices.plataforma ? 16 : 0,
        summercamp_installments: selectedServices.summercamp ? 6 : 0,
        tuition_installment_cents: 0,
        summercamp_installment_cents: 0,
      };
      if (activeTest) {
        insertData.quiz_test_id = (activeTest as any).id;
      }

      const { data: newEnrollment, error: enrollError } = await supabase
        .from("enrollments")
        .insert(insertData)
        .select("id")
        .single();
      if (enrollError) throw enrollError;

      const referral = referralRef.current.trim();
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

      const guardianName = cg.fullName?.trim() || g.fullName?.trim() || userName;

      const [enrollmentResult, notificationResult] = await Promise.all([
        supabase.functions.invoke("send-enrollment-email", {
          body: {
            email: targetEmail,
            name: guardianName,
            studentName: s.studentName?.trim() || "",
          },
        }),
        supabase.functions.invoke("send-purchase-notification", {
          body: {
            guardian: {
              full_name: cg.fullName,
              email: cg.email || user?.email || "",
              phone: cg.phone,
              cpf: cg.cpf,
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
      setRefreshKey((k) => k + 1);
      studentRef.current = { studentName: "", studentBirthDate: "", studentGender: "", studentEmail: "", studentAddress: "", studentSchool: "", studentGraduationYear: "", studentPhotoUrl: "" };
      contractGuardianRef.current = { ...emptyGuardian };
      setContractGuardianInitial({ ...emptyGuardian });
      referralRef.current = "";
      setSelectedServices({ plataforma: false, summercamp: false });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Erro ao processar", description: err.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setPaying(false);
    }
  };

  // Step 1: Student data + services + referral
  const validateStep1 = async (): Promise<boolean> => {
    const s = studentRef.current;
    const errors: string[] = [];
    const missingFields: string[] = [];

    if (!s.studentName.trim()) { missingFields.push("Nome do aluno"); errors.push("studentName"); }
    if (!s.studentPhotoUrl) { missingFields.push("Foto do aluno"); errors.push("studentPhoto"); }
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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (s.studentEmail.trim() && !emailRegex.test(s.studentEmail.trim())) {
      setValidationErrors(["studentEmail"]);
      toast({ title: "Email inválido", description: "O email do aluno não tem um formato válido.", variant: "destructive" });
      return false;
    }

    if (s.studentBirthDate) {
      const birthDate = new Date(s.studentBirthDate);
      const today = new Date();
      if (birthDate > today) {
        setValidationErrors(["studentBirthDate"]);
        toast({ title: "Data de nascimento inválida", description: "A data de nascimento não pode ser superior à data atual.", variant: "destructive" });
        return false;
      }
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
      if (age < 13) {
        setValidationErrors(["studentBirthDate"]);
        toast({ title: "Idade inválida", description: "O aluno deve ter pelo menos 13 anos na data da inscrição.", variant: "destructive" });
        return false;
      }
    }

    if (s.studentGraduationYear) {
      const gradYear = parseInt(s.studentGraduationYear, 10);
      const currentYear = new Date().getFullYear();
      if (gradYear <= currentYear) {
        setValidationErrors(["studentGraduationYear"]);
        toast({ title: "Ano de conclusão inválido", description: `O ano previsto deve ser superior a ${currentYear}.`, variant: "destructive" });
        return false;
      }
    }

    const referralEmail = referralRef.current?.trim();
    if (referralEmail) {
      const { data: referralEnrollment } = await supabase
        .from("enrollments")
        .select("id, contract_signed_at_platform")
        .ilike("student_email", referralEmail)
        .limit(1);

      if (!referralEnrollment || referralEnrollment.length === 0) {
        setValidationErrors(["referralEmail"]);
        toast({ title: "Aluno indicado não encontrado", description: "O email indicado não corresponde a nenhum aluno matriculado.", variant: "destructive" });
        return false;
      }

      if (!referralEnrollment[0].contract_signed_at_platform) {
        setValidationErrors(["referralEmail"]);
        toast({ title: "Aluno indicado não encontrado", description: "O email indicado não corresponde a nenhum aluno matriculado.", variant: "destructive" });
        return false;
      }
    }

    if (!selectedServices.plataforma && !selectedServices.summercamp) {
      setValidationErrors(["services"]);
      toast({ title: "Serviço obrigatório", description: "Selecione pelo menos um serviço (Plataforma Online ou Summer Camp).", variant: "destructive" });
      return false;
    }

    setValidationErrors([]);
    return true;
  };

  // Step 2: Contract guardian data
  const validateStep2 = (): boolean => {
    const cg = contractGuardianRef.current;
    const errors: string[] = [];
    const missingFields: string[] = [];

    if (!cg.fullName.trim()) { missingFields.push("Nome do responsável"); errors.push("contractGuardianFullName"); }
    if (!cg.email.trim()) { missingFields.push("Email"); errors.push("contractGuardianEmail"); }
    if (!cg.phone.trim()) { missingFields.push("Celular"); errors.push("contractGuardianPhone"); }
    if (!cg.nationality.trim()) { missingFields.push("Nacionalidade"); errors.push("contractGuardianNationality"); }
    if (!cg.civilStatus.trim()) { missingFields.push("Estado Civil"); errors.push("contractGuardianCivilStatus"); }
    if (!cg.profession.trim()) { missingFields.push("Profissão"); errors.push("contractGuardianProfession"); }
    if (!cg.cpf.trim()) { missingFields.push("CPF"); errors.push("contractGuardianCpf"); }
    if (!cg.rgNumber.trim()) { missingFields.push("Nº RG"); errors.push("contractGuardianRgNumber"); }
    if (!cg.guardianAddress.trim()) { missingFields.push("Endereço"); errors.push("contractGuardianAddress"); }

    if (errors.length > 0) {
      setValidationErrors(errors);
      toast({ title: "Campos obrigatórios em falta", description: missingFields.join(", "), variant: "destructive" });
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cg.email.trim())) {
      setValidationErrors(["contractGuardianEmail"]);
      toast({ title: "Email inválido", description: "O email do responsável do contrato não tem um formato válido.", variant: "destructive" });
      return false;
    }

    setValidationErrors([]);
    return true;
  };

  return (
    <div className="min-h-screen bg-background">
        <SEOHead
        title="Matrículas — Chronos Education"
        description="Gerencie as suas matrículas no programa Dual Diploma."
        canonical="/gestao-matriculas"
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
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground mb-2">Painel</h1>
        <p className="text-muted-foreground mb-6">Gerencie as matrículas e pagamentos do programa Dual Diploma</p>

        <Tabs defaultValue="inscricoes" className="w-full">
          <TabsList className="mb-10 bg-transparent border-0 border-b border-border p-0 gap-1 sm:gap-6 md:gap-10 pb-0 w-full flex-nowrap">
            <TabsTrigger
              value="inscricoes"
              className="shrink-0 whitespace-nowrap bg-transparent px-2 sm:px-4 py-3 rounded-none shadow-none text-sm sm:text-lg text-muted-foreground data-[state=active]:text-[#f9b41f] data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#f9b41f] data-[state=active]:bg-transparent font-semibold"
            >
              Matrículas
            </TabsTrigger>
            <TabsTrigger
              value="contratos"
              className="shrink-0 whitespace-nowrap bg-transparent px-2 sm:px-4 py-3 rounded-none shadow-none text-sm sm:text-lg text-muted-foreground data-[state=active]:text-[#f9b41f] data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#f9b41f] data-[state=active]:bg-transparent font-semibold"
            >
              Contratos
              {hasUnsignedContract && <AlertTriangle size={14} className="ml-1 text-amber-500" />}
            </TabsTrigger>
            <TabsTrigger
              value="prova-ingles"
              className="shrink-0 whitespace-nowrap bg-transparent px-2 sm:px-4 py-3 rounded-none shadow-none text-sm sm:text-lg text-muted-foreground data-[state=active]:text-[#f9b41f] data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#f9b41f] data-[state=active]:bg-transparent font-semibold"
            >
              <span className="sm:hidden">Prova</span>
              <span className="hidden sm:inline">Prova de Inglês</span>
            </TabsTrigger>
            <TabsTrigger
              value="pagamentos"
              className="shrink-0 whitespace-nowrap bg-transparent px-2 sm:px-4 py-3 rounded-none shadow-none text-sm sm:text-lg text-muted-foreground data-[state=active]:text-[#f9b41f] data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#f9b41f] data-[state=active]:bg-transparent font-semibold"
            >
              <span className="sm:hidden">Pagamentos</span>
              <span className="hidden sm:inline">Pagamentos</span>
              {hasOverdueInstallment && <AlertTriangle size={14} className="ml-1" style={{ color: "#F9B91D" }} />}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inscricoes">
            <div className="max-w-2xl">
              {!showForm ? (
                <>
                  <GuardianDataSection onChange={handleGuardianChange} validationErrors={validationErrors} requireExplicitSave simplified />
                  <div className="mt-8">
                    <EnrollmentsList
                      onNewEnrollment={() => {
                        studentRef.current = { studentName: "", studentBirthDate: "", studentGender: "", studentEmail: "", studentAddress: "", studentSchool: "", studentGraduationYear: "", studentPhotoUrl: "" };
                        referralRef.current = "";
                        setValidationErrors([]);
                        setSelectedServices({ plataforma: false, summercamp: false });
                        setWizardStep(1);
                        setShowForm(true);
                      }}
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
                        setValidationErrors([]);
                      } else {
                        setShowForm(false);
                        setWizardStep(1);
                      }
                    }}
                    className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-4"
                  >
                    <ArrowLeft size={16} />
                    {wizardStep === 2 ? "Voltar ao passo anterior" : "Voltar às matrículas"}
                  </button>

                  <h2 className="font-heading text-xl font-semibold text-foreground mb-2">
                    Nova Matrícula
                  </h2>

                  {/* Wizard step indicator */}
                  <div className="flex items-center gap-2 mb-6 text-sm">
                    <span className={`flex items-center gap-1.5 ${wizardStep === 1 ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
                      <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs ${wizardStep === 1 ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"}`}>1</span>
                      Dados do Aluno
                    </span>
                    <span className="text-muted-foreground">→</span>
                    <span className={`flex items-center gap-1.5 ${wizardStep === 2 ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
                      <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs ${wizardStep === 2 ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"}`}>2</span>
                      Responsável do Contrato
                    </span>
                  </div>

                  {wizardStep === 1 && (
                    <>
                      <StudentDataSection onChange={handleStudentChange} validationErrors={validationErrors} initialData={studentRef.current} guardianAddress={guardianRef.current.guardianAddress} />

                      {/* Serviços contratados */}
                      <div className="mt-8">
                        <h3 className="font-heading text-lg font-semibold text-foreground mb-1">Serviços contratados</h3>
                        <p className="text-sm text-muted-foreground mb-4">Selecione os serviços que pretende contratar. Pode escolher um ou ambos.</p>
                        <div className="space-y-3">
                          <div
                            className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedServices.plataforma ? "border-secondary bg-secondary/5" : "border-border bg-card hover:border-muted-foreground/30"}`}
                            onClick={() => setSelectedServices((prev) => ({ ...prev, plataforma: !prev.plataforma }))}
                          >
                            <Checkbox checked={selectedServices.plataforma} onCheckedChange={() => {}} className="h-5 w-5 rounded-[3px]" />
                            <div>
                              <p className="font-semibold text-foreground">Plataforma Online</p>
                              <p className="text-xs text-muted-foreground">Acesso à plataforma digital do programa Dual Diploma</p>
                            </div>
                          </div>
                          <div
                            className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedServices.summercamp ? "border-secondary bg-secondary/5" : "border-border bg-card hover:border-muted-foreground/30"}`}
                            onClick={() => setSelectedServices((prev) => ({ ...prev, summercamp: !prev.summercamp }))}
                          >
                            <Checkbox checked={selectedServices.summercamp} onCheckedChange={() => {}} className="h-5 w-5 rounded-[3px]" />
                            <div>
                              <p className="font-semibold text-foreground">Summer Camp</p>
                              <p className="text-xs text-muted-foreground">Programa presencial de imersão durante o verão</p>
                            </div>
                          </div>
                        </div>
                        {validationErrors.includes("services") && (
                          <p className="text-destructive text-sm mt-2">Selecione pelo menos um serviço.</p>
                        )}
                      </div>

                      <div className="mt-8">
                        <ReferralSection onChange={handleReferralChange} validationErrors={validationErrors} />
                      </div>

                      <div className="mt-8">
                        <button
                          onClick={async () => {
                            const valid = await validateStep1();
                            if (valid) {
                              // Pre-fill contract guardian with the parent profile data the first time
                              if (!contractGuardianRef.current.fullName && !contractGuardianRef.current.email) {
                                const initial = { ...guardianRef.current };
                                contractGuardianRef.current = initial;
                                setContractGuardianInitial(initial);
                              }
                              setWizardStep(2);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }
                          }}
                          disabled={paying}
                          className="w-full bg-secondary text-secondary-foreground font-semibold py-3.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Continuar
                        </button>
                      </div>
                    </>
                  )}

                  {wizardStep === 2 && (
                    <>
                      <p className="text-sm text-muted-foreground mb-4">
                        Os dados do responsável que assinará o contrato podem ser diferentes dos dados do pai/mãe registados na sua conta. Pode editar os campos abaixo.
                      </p>
                      <GuardianDataSection
                        mode="memory"
                        title="Responsável pelo Contrato"
                        alwaysExpanded
                        errorPrefix="contractGuardian"
                        onChange={handleContractGuardianChange}
                        validationErrors={validationErrors}
                        initialData={contractGuardianInitial}
                      />

                      <div className="mt-8">
                        <button
                          onClick={async () => {
                            if (!validateStep2()) return;
                            await handleSubmitEnrollment();
                          }}
                          disabled={paying}
                          className="w-full bg-secondary text-secondary-foreground font-semibold py-3.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {paying ? "Processando..." : "Confirmar matrícula"}
                        </button>
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

          <TabsContent value="contratos">
            <div className="max-w-2xl">
              <ContractsList refreshKey={refreshKey} />
            </div>
          </TabsContent>

          <TabsContent value="prova-ingles">
            <div className="max-w-2xl">
              <QuizResultsList refreshKey={refreshKey} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DashboardPage;
