import { useState } from "react";
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

interface Props {
  enrollmentId: string;
  studentName: string;
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

const SetFinancialValuesDialog = ({ enrollmentId, studentName, currentValues, onSaved }: Props) => {
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

  const handleOpen = () => {
    setInscriptionFee(currentValues.inscription_fee_cents > 0 ? String(currentValues.inscription_fee_cents / 100) : "");
    setTuitionValue(currentValues.tuition_installment_cents > 0 ? String(currentValues.tuition_installment_cents / 100) : "");
    setTuitionInstallments(String(currentValues.tuition_installments));
    setTuitionStartDate(currentValues.tuition_start_date || "");
    setSummercampValue(currentValues.summercamp_installment_cents > 0 ? String(currentValues.summercamp_installment_cents / 100) : "");
    setSummercampInstallments(String(currentValues.summercamp_installments));
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
              <div className="mt-1">
                <Input
                  type="number"
                  step="1"
                  min="0"
                  placeholder="0"
                  value={inscriptionFee}
                  onChange={(e) => setInscriptionFee(e.target.value)}
                  className="h-9"
                />
                <p className="text-[10px] text-muted-foreground mt-0.5">Valor em dólares ($)</p>
              </div>
            </div>

            <div className="border-t border-border pt-3">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Plataforma Online</Label>
              <div className="grid grid-cols-2 gap-3 mt-1">
                <div>
                  <Label className="text-xs text-muted-foreground">Nº prestações</Label>
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
                    type="number"
                    step="1"
                    min="0"
                    placeholder="0"
                    value={tuitionValue}
                    onChange={(e) => setTuitionValue(e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>
              <div className="mt-2">
                <Label className="text-xs text-muted-foreground">Data início das prestações</Label>
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
                  <Label className="text-xs text-muted-foreground">Nº prestações</Label>
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
                    type="number"
                    step="1"
                    min="0"
                    placeholder="0"
                    value={summercampValue}
                    onChange={(e) => setSummercampValue(e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>
              <div className="mt-2">
                <Label className="text-xs text-muted-foreground">Data início das prestações</Label>
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
