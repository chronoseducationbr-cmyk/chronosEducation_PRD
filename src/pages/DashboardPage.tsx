import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, User, CreditCard, QrCode, FileText, Building2 } from "lucide-react";
import chronosLogo from "@/assets/chronos-logo-header.png";
import SEOHead from "@/components/SEOHead";

const paymentMethods = [
  { id: "credit", icon: CreditCard, label: "Cartão de Crédito", description: "Visa, Mastercard, Amex" },
  { id: "pix", icon: QrCode, label: "PIX", description: "Pagamento instantâneo" },
  { id: "boleto", icon: FileText, label: "Boleto Bancário", description: "Vencimento em 3 dias úteis" },
  { id: "transfer", icon: Building2, label: "Transferência Bancária", description: "TED ou DOC" },
];

const DashboardPage = () => {
  const { user, signOut } = useAuth();

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
          <h2 className="font-heading text-lg font-semibold text-foreground mb-3">Forma de pagamento</h2>
          <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
            {paymentMethods.map((method, index) => (
              <button
                key={method.id}
                className={`w-full flex items-center gap-4 p-5 text-left hover:bg-muted/50 transition-colors ${
                  index > 0 ? "border-t border-border" : ""
                }`}
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
            disabled
            className="w-full bg-secondary text-secondary-foreground font-semibold py-3.5 rounded-lg opacity-50 cursor-not-allowed mt-4"
          >
            Pagar — Simulação
          </button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Integração com gateway de pagamento em breve
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
