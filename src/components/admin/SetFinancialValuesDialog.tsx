import { useState, type ChangeEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Settings, AlertTriangle } from "lucide-react";

interface AppDefaults {
  default_inscription_fee_cents: number;
  default_tuition_installment_cents: number;
  default_tuition_installments: number;
  default_summercamp_installment_cents: number;
  default_summercamp_installments: number;
}

interface Props {
  enrollmentId: string;
  studentName: string;
  contractSignedAt: string | null;
  currentValues: {
    inscription_fee_cents: number;
    inscription_due_date: string | null;
    tuition_installment_cents: number;
    tuition_installments: number;
    summercamp_installment_cents: number;
    summercamp_installments: number;
    tuition_start_date: string | null;
    summercamp_start_date: string | null;
  };
  onSaved: (updates: Record<string, any>) => void;
  disabled?: boolean;
}

const SetFinancialValuesDialog = ({ enrollmentId, studentName, contractSignedAt, currentValues, onSaved, disabled = false }: Props) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [inscriptionFee, setInscriptionFee] = useState("");
  const [inscriptionDueDate, setInscriptionDueDate] = useState("");
  const [tuitionValue, setTuitionValue] = useState("");
  const [tuitionInstallments, setTuitionInstallments] = useState("16");
  const [tuitionStartDate, setTuitionStartDate] = useState("");
  const [summercampValue, setSummercampValue] = useState("");
  const [summercampInstallments, setSummercampInstallments] = useState("6");
  const [summercampStartDate, setSummercampStartDate] = useState("");

  const parseMoneyToNumber = (value: string): number => {
    const normalized = value.replace(",", ".");
    return parseFloat(normalized) || 0;
  };

  const handleMoneyChange = (event: ChangeEvent<HTMLInputElement>, setValue: (value: string) => void) => {
    const raw = event.target.value.replace(/[^0-9,]/g, "");
    const parts = raw.split(",");
    const sanitized = parts.length > 2 ? `${parts[0]},${parts.slice(1).join("")}` : raw;
    if (sanitized.includes(",")) {
      const [intPart, decPart] = sanitized.split(",");
      setValue(`${intPart},${decPart.slice(0, 2)}`);
    } else {
      setValue(sanitized);
    }
  };

  const handleMoneyBlur = (value: string, setValue: (value: string) => void) => {
    if (!value) return;
    const num = parseMoneyToNumber(value);
    setValue(num.toFixed(2).replace(".", ","));
  };

  const handleOpen = async () => {
    // Load app_settings defaults
    let defaults: AppDefaults | null = null;
    const { data } = await supabase.from("app_settings").select("default_inscription_fee_cents, default_tuition_installment_cents, default_tuition_installments, default_summercamp_installment_cents, default_summercamp_installments").eq("id", 1).single();
    if (data) defaults = data as AppDefaults;

    const dInscription = defaults?.default_inscription_fee_cents ?? 80000;
    const dTuition = defaults?.default_tuition_installment_cents ?? 45000;
    const dTuitionInst = defaults?.default_tuition_installments ?? 16;
    const dSummer = defaults?.default_summercamp_installment_cents ?? 0;
    const dSummerInst = defaults?.default_summercamp_installments ?? 6;

    const toComma = (v: number) => v.toFixed(2).replace(".", ",");
    setInscriptionFee(currentValues.inscription_fee_cents > 0 ? toComma(currentValues.inscription_fee_cents / 100) : toComma(dInscription / 100));
    setTuitionValue(currentValues.tuition_installment_cents > 0 ? toComma(currentValues.tuition_installment_cents / 100) : toComma(dTuition / 100));
    setTuitionInstallments(currentValues.tuition_installments > 0 ? String(currentValues.tuition_installments) : String(dTuitionInst));
    setTuitionStartDate(currentValues.tuition_start_date || "");
    setSummercampValue(currentValues.summercamp_installment_cents > 0 ? toComma(currentValues.summercamp_installment_cents / 100) : (dSummer > 0 ? toComma(dSummer / 100) : ""));
    setSummercampInstallments(currentValues.summercamp_installments > 0 ? String(currentValues.summercamp_installments) : String(dSummerInst));
    setSummercampStartDate(currentValues.summercamp_start_date || "");
    setInscriptionDueDate(currentValues.inscription_due_date || (contractSignedAt ? contractSignedAt.split("T")[0] : ""));
    setOpen(true);
  };

  const getFormValues = () => {
    const fee = Math.round(parseMoneyToNumber(inscriptionFee) * 100);
    const tuition = Math.round(parseMoneyToNumber(tuitionValue) * 100);
    const tInstallments = parseInt(tuitionInstallments) || 16;
    const summer = Math.round(parseMoneyToNumber(summercampValue) * 100);
    const sInstallments = parseInt(summercampInstallments) || 6;
    return { fee, tuition, tInstallments, summer, sInstallments };
  };

  const buildUpdates = () => {
    const { fee, tuition, tInstallments, summer, sInstallments } = getFormValues();
    return {
      inscription_fee_cents: fee,
      inscription_due_date: inscriptionDueDate || null,
      tuition_installment_cents: tuition,
      tuition_installments: tInstallments,
      summercamp_installment_cents: summer,
      summercamp_installments: sInstallments,
      tuition_start_date: tuitionStartDate || null,
      summercamp_start_date: summercampStartDate || null,
    };
  };

  const saveEnrollment = async (): Promise<Record<string, any> | null> => {
    const { fee, tuition, summer } = getFormValues();
    if (fee < 0 || tuition < 0 || summer < 0) {
      toast({ title: "Valores não podem ser negativos", variant: "destructive" });
      return null;
    }
    const updates = buildUpdates();
    const { error } = await supabase
      .from("enrollments")
      .update(updates as any)
      .eq("id", enrollmentId);
    if (error) {
      toast({ title: "Erro ao guardar valores", variant: "destructive" });
      return null;
    }
    return updates;
  };

  const handleSave = async () => {
    setSaving(true);
    const updates = await saveEnrollment();
    if (updates) {
      toast({ title: "Valores financeiros atualizados" });
      onSaved(updates);
      setOpen(false);
    }
    setSaving(false);
  };

  const handleSaveAndGenerate = async () => {
    setSaving(true);
    const updates = await saveEnrollment();
    if (!updates) { setSaving(false); return; }

    const { inscription_fee_cents, tuition_installment_cents, tuition_installments: tCount, tuition_start_date,
            summercamp_installment_cents, summercamp_installments: sCount, summercamp_start_date } = updates;

    // Delete existing installments before regenerating
    await supabase.from("installments").delete().eq("enrollment_id", enrollmentId).in("type", ["inscription_fee", "tuition", "summercamp"] as any);

    const rows: any[] = [];

    if (inscription_fee_cents > 0 && inscriptionDueDate) {
      rows.push({
        enrollment_id: enrollmentId,
        type: "inscription_fee",
        installment_number: 1,
        due_date: inscriptionDueDate,
        status: "pending",
        amount_cents: inscription_fee_cents,
      });
    }

    const getInstallmentDate = (startDateStr: string, startDay: number, monthOffset: number): string => {
      const base = new Date(startDateStr);
      const targetYear = base.getUTCFullYear() + Math.floor((base.getUTCMonth() + monthOffset) / 12);
      const targetMonth = (base.getUTCMonth() + monthOffset) % 12;
      const lastDayOfMonth = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
      const day = Math.min(startDay, lastDayOfMonth);
      return new Date(Date.UTC(targetYear, targetMonth, day)).toISOString().split("T")[0];
    };

    if (tuition_installment_cents > 0 && tuition_start_date) {
      const startDay = new Date(tuition_start_date).getUTCDate();
      for (let i = 0; i < tCount; i++) {
        rows.push({
          enrollment_id: enrollmentId,
          type: "tuition",
          installment_number: i + 1,
          due_date: getInstallmentDate(tuition_start_date, startDay, i),
          status: "pending",
          amount_cents: tuition_installment_cents,
        });
      }
    }

    if (summercamp_installment_cents > 0 && summercamp_start_date) {
      const startDay = new Date(summercamp_start_date).getUTCDate();
      for (let i = 0; i < sCount; i++) {
        rows.push({
          enrollment_id: enrollmentId,
          type: "summercamp",
          installment_number: i + 1,
          due_date: getInstallmentDate(summercamp_start_date, startDay, i),
          status: "pending",
          amount_cents: summercamp_installment_cents,
        });
      }
    }

    if (rows.length > 0) {
      const { error } = await supabase.from("installments").insert(rows as any);
      if (error) {
        toast({ title: "Erro ao gerar parcelas", description: error.message, variant: "destructive" });
      } else {
        toast({ title: `${rows.length} parcelas geradas com sucesso` });
      }
    } else {
      toast({ title: "Valores guardados. Preencha datas de início para gerar parcelas.", variant: "destructive" });
    }

    // Generate contract PDF
    try {
      toast({ title: "A gerar contrato PDF..." });
      const { data: pdfResult, error: pdfError } = await supabase.functions.invoke("generate-contract-pdf", {
        body: { enrollmentId, signed: false },
      });

      if (pdfError) {
        console.error("PDF generation error:", pdfError);
        toast({ title: "Erro ao gerar contrato PDF", variant: "destructive" });
      } else if (pdfResult?.success) {
        toast({ title: "Contrato PDF gerado com sucesso" });

        // Send email to guardian
        if (pdfResult.guardianEmail) {
          try {
            const { error: emailError } = await supabase.functions.invoke("send-contract-email", {
              body: {
                email: pdfResult.guardianEmail,
                guardianName: pdfResult.guardianName,
                studentName: pdfResult.studentName || studentName,
                contractUrl: pdfResult.contractUrl,
              },
            });
            if (emailError) {
              console.error("Email send error:", emailError);
              toast({ title: "Contrato gerado, mas erro ao enviar email", variant: "destructive" });
            } else {
              toast({ title: "Email enviado ao responsável com o contrato" });
            }
          } catch (emailErr) {
            console.error("Email error:", emailErr);
            toast({ title: "Contrato gerado, mas erro ao enviar email", variant: "destructive" });
          }
        } else {
          toast({ title: "Contrato gerado. Email do responsável não encontrado.", variant: "destructive" });
        }

        // Update local state with contract info
        updates.contract_url = pdfResult.contractUrl;
        updates.contract_sent_at = new Date().toISOString();
        updates.contract_signed_at = null;
      }
    } catch (err) {
      console.error("Contract generation error:", err);
      toast({ title: "Erro ao gerar contrato", variant: "destructive" });
    }

    onSaved(updates);
    setOpen(false);
    setSaving(false);
  };

  const hasValues = currentValues.inscription_fee_cents > 0 || currentValues.tuition_installment_cents > 0 || currentValues.summercamp_installment_cents > 0;

  return (
    <>
      <button
        onClick={(ev) => { ev.stopPropagation(); if (!disabled) handleOpen(); }}
        disabled={disabled}
        className={`inline-flex items-center gap-1 text-[11px] font-medium transition-colors ${disabled ? "text-muted-foreground/50 cursor-not-allowed" : hasValues ? "text-[#F9B91D] hover:text-[#F9B91D]/80" : "text-accent hover:text-accent/80"}`}
        title={disabled ? "Valores já definidos (existem parcelas geradas)" : hasValues ? "Editar valores financeiros" : "Definir valores financeiros"}
      >
        <Settings size={12} />
        {hasValues ? "Editar valores" : "Definir valores"}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Valores Financeiros</DialogTitle>
            <DialogDescription>
              Definir valores para <span className="font-semibold text-accent">{studentName}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto flex-1 px-1 pb-1">
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Matrícula</Label>
              <div className="grid grid-cols-2 gap-3 mt-1">
                <div>
                  <Label className="text-xs text-muted-foreground">Valor ($) <span className="text-destructive">*</span></Label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={inscriptionFee}
                    onChange={(e) => handleMoneyChange(e, setInscriptionFee)}
                    onBlur={() => handleMoneyBlur(inscriptionFee, setInscriptionFee)}
                    className="h-9"
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Data de vencimento <span className="text-destructive">*</span></Label>
                  <Input
                    type="date"
                    value={inscriptionDueDate}
                    onChange={(e) => setInscriptionDueDate(e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>
            </div>

            {currentValues.tuition_installments > 0 && (
              <>
                <div className="border-t border-border pt-3">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Plataforma Online</Label>
                  <div className="grid grid-cols-3 gap-3 mt-1">
                    <div>
                      <Label className="text-xs text-muted-foreground">Nº parcelas <span className="text-destructive">*</span></Label>
                      <Input
                        type="number"
                        min="1"
                        value={tuitionInstallments}
                        onChange={(e) => setTuitionInstallments(e.target.value)}
                        className="h-9"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Valor ($) <span className="text-destructive">*</span></Label>
                      <Input
                        type="text"
                        inputMode="decimal"
                        placeholder="0,00"
                        value={tuitionValue}
                        onChange={(e) => handleMoneyChange(e, setTuitionValue)}
                        onBlur={() => handleMoneyBlur(tuitionValue, setTuitionValue)}
                        className="h-9"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Data início <span className="text-destructive">*</span></Label>
                      <Input
                        type="date"
                        value={tuitionStartDate}
                        onChange={(e) => setTuitionStartDate(e.target.value)}
                        className="h-9"
                      />
                    </div>
                  </div>
                </div>
                {parseMoneyToNumber(tuitionValue) > 0 && !tuitionStartDate && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                    <AlertTriangle size={14} className="shrink-0" />
                    <span>A <strong>Plataforma Online</strong> tem valor definido mas não tem data de início. As parcelas não serão geradas sem esta data.</span>
                  </div>
                )}
              </>
            )}

            {currentValues.summercamp_installments > 0 && (
              <>
                <div className="border-t border-border pt-3">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Summer Camp</Label>
                  <div className="grid grid-cols-3 gap-3 mt-1">
                    <div>
                      <Label className="text-xs text-muted-foreground">Nº parcelas <span className="text-destructive">*</span></Label>
                      <Input
                        type="number"
                        min="1"
                        value={summercampInstallments}
                        onChange={(e) => setSummercampInstallments(e.target.value)}
                        className="h-9"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Valor ($) <span className="text-destructive">*</span></Label>
                      <Input
                        type="text"
                        inputMode="decimal"
                        placeholder="0,00"
                        value={summercampValue}
                        onChange={(e) => handleMoneyChange(e, setSummercampValue)}
                        onBlur={() => handleMoneyBlur(summercampValue, setSummercampValue)}
                        className="h-9"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Data início <span className="text-destructive">*</span></Label>
                      <Input
                        type="date"
                        value={summercampStartDate}
                        onChange={(e) => setSummercampStartDate(e.target.value)}
                        className="h-9"
                      />
                    </div>
                  </div>
                </div>
                {parseMoneyToNumber(summercampValue) > 0 && !summercampStartDate && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                    <AlertTriangle size={14} className="shrink-0" />
                    <span>O <strong>Summer Camp</strong> tem valor definido mas não tem data de início. As parcelas não serão geradas sem esta data.</span>
                  </div>
                )}
              </>
            )}
          </div>

          {(() => {
            const { fee, tuition, summer } = getFormValues();
            const missing: string[] = [];
            if (fee <= 0) missing.push("Valor da Matrícula");
            if (!inscriptionDueDate) missing.push("Data de vencimento da Matrícula");
            if (currentValues.tuition_installments > 0) {
              if (tuition <= 0) missing.push("Valor da Plataforma Online");
              if (tuition > 0 && !tuitionStartDate) missing.push("Data de início da Plataforma Online");
            }
            if (currentValues.summercamp_installments > 0) {
              if (summer <= 0) missing.push("Valor do Summer Camp");
              if (summer > 0 && !summercampStartDate) missing.push("Data de início do Summer Camp");
            }
            const canGenerate = missing.length === 0;

            return (
              <DialogFooter className="flex-col sm:flex-row gap-2 pt-4 border-t border-border shrink-0">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button variant="secondary" onClick={handleSave} disabled={saving}>
                  {saving ? "A guardar..." : "Guardar"}
                </Button>
                <div className="flex flex-col items-end gap-1">
                  <Button onClick={handleSaveAndGenerate} disabled={saving || !canGenerate}>
                    {saving ? "A processar..." : "Guardar e gerar contrato"}
                  </Button>
                  {!canGenerate && (
                    <p className="text-[10px] text-destructive max-w-xs text-right">
                      Falta: {missing.join(", ")}
                    </p>
                  )}
                </div>
              </DialogFooter>
            );
          })()}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SetFinancialValuesDialog;
