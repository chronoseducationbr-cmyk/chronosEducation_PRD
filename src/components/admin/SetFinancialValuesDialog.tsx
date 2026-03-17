import { useState, type ChangeEvent, type FocusEvent, type MouseEvent } from "react";
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
import { Settings } from "lucide-react";

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
    tuition_installment_cents: number;
    tuition_installments: number;
    summercamp_installment_cents: number;
    summercamp_installments: number;
    tuition_start_date: string | null;
    summercamp_start_date: string | null;
  };
  onSaved: (updates: Record<string, any>) => void;
}

const SetFinancialValuesDialog = ({ enrollmentId, studentName, contractSignedAt, currentValues, onSaved }: Props) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [inscriptionFee, setInscriptionFee] = useState("");
  const [tuitionValue, setTuitionValue] = useState("");
  const [tuitionInstallments, setTuitionInstallments] = useState("16");
  const [tuitionStartDate, setTuitionStartDate] = useState("");
  const [summercampValue, setSummercampValue] = useState("");
  const [summercampInstallments, setSummercampInstallments] = useState("6");
  const [summercampStartDate, setSummercampStartDate] = useState("");

  const formatMoneyInput = (value: string) => (value ? `${value},00` : "");

  const parseMoneyInput = (value: string) => {
    const [integerPart = ""] = value.split(",");
    return integerPart.replace(/\D/g, "");
  };

  const placeCaretBeforeDecimals = (input: HTMLInputElement) => {
    const caretPosition = parseMoneyInput(input.value).length;
    requestAnimationFrame(() => {
      input.setSelectionRange(caretPosition, caretPosition);
    });
  };

  const handleMoneyChange = (event: ChangeEvent<HTMLInputElement>, setValue: (value: string) => void) => {
    const integerPart = parseMoneyInput(event.target.value);
    setValue(integerPart);
    placeCaretBeforeDecimals(event.target);
  };

  const handleMoneyFocus = (event: FocusEvent<HTMLInputElement>) => {
    placeCaretBeforeDecimals(event.currentTarget);
  };

  const handleMoneyClick = (event: MouseEvent<HTMLInputElement>) => {
    placeCaretBeforeDecimals(event.currentTarget);
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

    setInscriptionFee(currentValues.inscription_fee_cents > 0 ? String(currentValues.inscription_fee_cents / 100) : String(dInscription / 100));
    setTuitionValue(currentValues.tuition_installment_cents > 0 ? String(currentValues.tuition_installment_cents / 100) : String(dTuition / 100));
    setTuitionInstallments(currentValues.tuition_installments > 0 ? String(currentValues.tuition_installments) : String(dTuitionInst));
    setTuitionStartDate(currentValues.tuition_start_date || "");
    setSummercampValue(currentValues.summercamp_installment_cents > 0 ? String(currentValues.summercamp_installment_cents / 100) : (dSummer > 0 ? String(dSummer / 100) : ""));
    setSummercampInstallments(currentValues.summercamp_installments > 0 ? String(currentValues.summercamp_installments) : String(dSummerInst));
    setSummercampStartDate(currentValues.summercamp_start_date || "");
    setOpen(true);
  };

  const handleSave = async () => {
    const fee = Math.round(parseFloat(inscriptionFee || "0")) * 100;
    const tuition = Math.round(parseFloat(tuitionValue || "0")) * 100;
    const tInstallments = parseInt(tuitionInstallments) || 16;
    const summer = Math.round(parseFloat(summercampValue || "0")) * 100;
    const sInstallments = parseInt(summercampInstallments) || 6;

    if (fee < 0 || tuition < 0 || summer < 0) {
      toast({ title: "Valores não podem ser negativos", variant: "destructive" });
      return;
    }

    setSaving(true);
    const updates: Record<string, any> = {
      inscription_fee_cents: fee,
      tuition_installment_cents: tuition,
      tuition_installments: tInstallments,
      summercamp_installment_cents: summer,
      summercamp_installments: sInstallments,
      tuition_start_date: tuitionStartDate || null,
      summercamp_start_date: summercampStartDate || null,
    };

    const { error } = await supabase
      .from("enrollments")
      .update(updates as any)
      .eq("id", enrollmentId);

    if (error) {
      toast({ title: "Erro ao guardar valores", variant: "destructive" });
    } else {
      toast({ title: "Valores financeiros atualizados" });
      onSaved(updates);
      setOpen(false);
    }
    setSaving(false);
  };

  const hasValues = currentValues.inscription_fee_cents > 0 || currentValues.tuition_installment_cents > 0 || currentValues.summercamp_installment_cents > 0;

  if (hasValues) return null;

  return (
    <>
      <button
        onClick={(ev) => { ev.stopPropagation(); handleOpen(); }}
        className="inline-flex items-center gap-1 text-[11px] font-medium transition-colors text-accent hover:text-accent/80"
        title="Definir valores financeiros"
      >
        <Settings size={12} />
        Definir valores
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Valores Financeiros</DialogTitle>
            <DialogDescription>
              Definir valores para <span className="font-semibold text-accent">{studentName}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Matrícula</Label>
              <div className="grid grid-cols-2 gap-3 mt-1">
                <div>
                  <Label className="text-xs text-muted-foreground">Valor ($)</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="0,00"
                    value={formatMoneyInput(inscriptionFee)}
                    onChange={(e) => handleMoneyChange(e, setInscriptionFee)}
                    onFocus={handleMoneyFocus}
                    onClick={handleMoneyClick}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Data de vencimento</Label>
                  <Input
                    type="text"
                    readOnly
                    value={contractSignedAt ? new Date(contractSignedAt).toLocaleDateString("pt-BR") : "Data da assinatura"}
                    className="h-9 bg-muted cursor-not-allowed"
                    title="Igual à data de assinatura do contrato"
                  />
                  <p className="text-[10px] text-muted-foreground mt-0.5">Igual à data de assinatura do contrato</p>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-3">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Plataforma Online</Label>
              <div className="grid grid-cols-2 gap-3 mt-1">
                <div>
                  <Label className="text-xs text-muted-foreground">Nº parcelas</Label>
                  <Input
                    type="number"
                    min="1"
                    value={tuitionInstallments}
                    onChange={(e) => setTuitionInstallments(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Valor da mensalidade ($)</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="0,00"
                    value={formatMoneyInput(tuitionValue)}
                    onChange={(e) => handleMoneyChange(e, setTuitionValue)}
                    onFocus={handleMoneyFocus}
                    onClick={handleMoneyClick}
                    className="h-9"
                  />
                </div>
              </div>
              <div className="mt-2">
                <Label className="text-xs text-muted-foreground">Data início das parcelas</Label>
                <Input
                  type="date"
                  value={tuitionStartDate}
                  onChange={(e) => setTuitionStartDate(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>

            <div className="border-t border-border pt-3">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Summer Camp</Label>
              <div className="grid grid-cols-2 gap-3 mt-1">
                <div>
                  <Label className="text-xs text-muted-foreground">Nº parcelas</Label>
                  <Input
                    type="number"
                    min="1"
                    value={summercampInstallments}
                    onChange={(e) => setSummercampInstallments(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Valor da mensalidade ($)</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="0,00"
                    value={formatMoneyInput(summercampValue)}
                    onChange={(e) => handleMoneyChange(e, setSummercampValue)}
                    onFocus={handleMoneyFocus}
                    onClick={handleMoneyClick}
                    className="h-9"
                  />
                </div>
              </div>
              <div className="mt-2">
                <Label className="text-xs text-muted-foreground">Data início das parcelas</Label>
                <Input
                  type="date"
                  value={summercampStartDate}
                  onChange={(e) => setSummercampStartDate(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "A guardar..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SetFinancialValuesDialog;
