import { Check, X } from "lucide-react";

interface PasswordStrengthProps {
  password: string;
}

const rules = [
  { label: "Mínimo 8 caracteres", test: (p: string) => p.length >= 8 },
  { label: "Letra maiúscula", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Letra minúscula", test: (p: string) => /[a-z]/.test(p) },
  { label: "Número", test: (p: string) => /[0-9]/.test(p) },
  { label: "Carácter especial (!@#$...)", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export const passwordIsValid = (password: string) =>
  rules.every((r) => r.test(password));

const PasswordStrength = ({ password }: PasswordStrengthProps) => {
  if (!password) return null;

  const passed = rules.filter((r) => r.test(password)).length;
  const strength = passed <= 2 ? "Fraca" : passed <= 4 ? "Média" : "Forte";
  const color =
    passed <= 2
      ? "bg-destructive"
      : passed <= 4
        ? "bg-[hsl(var(--warning,45_93%_47%))]"
        : "bg-secondary";

  return (
    <div className="mt-2 space-y-2">
      {/* Strength bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${color}`}
            style={{ width: `${(passed / rules.length) * 100}%` }}
          />
        </div>
        <span className="text-xs font-medium text-muted-foreground">{strength}</span>
      </div>

      {/* Rules checklist */}
      <ul className="space-y-1">
        {rules.map((rule) => {
          const ok = rule.test(password);
          return (
            <li key={rule.label} className="flex items-center gap-1.5 text-xs">
              {ok ? (
                <Check size={14} className="text-secondary shrink-0" />
              ) : (
                <X size={14} className="text-muted-foreground shrink-0" />
              )}
              <span className={ok ? "text-foreground" : "text-muted-foreground"}>
                {rule.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default PasswordStrength;
