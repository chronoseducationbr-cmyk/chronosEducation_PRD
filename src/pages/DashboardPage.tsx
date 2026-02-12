import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { LogOut, ShoppingCart, User, Package, Plus, Minus, Trash2 } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  description: string;
  plan_type: string;
  price_cents: number;
}

interface CartItem {
  plan: Plan;
  quantity: number;
}

interface Order {
  id: string;
  status: string;
  total_cents: number;
  created_at: string;
}

const DashboardPage = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<"plans" | "orders">("plans");
  const [profile, setProfile] = useState<{ full_name: string; phone: string; student_name: string; student_school: string } | null>(null);
  const [loadingCheckout, setLoadingCheckout] = useState(false);

  useEffect(() => {
    fetchPlans();
    fetchOrders();
    fetchProfile();
  }, []);

  const fetchPlans = async () => {
    const { data } = await supabase.from("plans").select("*").eq("active", true);
    if (data) setPlans(data);
  };

  const fetchOrders = async () => {
    const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (data) setOrders(data);
  };

  const fetchProfile = async () => {
    const { data } = await supabase.from("profiles").select("full_name, phone, student_name, student_school").maybeSingle();
    if (data) setProfile(data);
  };

  const addToCart = (plan: Plan) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.plan.id === plan.id);
      if (existing) {
        return prev.map((item) =>
          item.plan.id === plan.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { plan, quantity: 1 }];
    });
  };

  const updateQuantity = (planId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.plan.id === planId ? { ...item, quantity: item.quantity + delta } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.plan.price_cents * item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoadingCheckout(true);

    try {
      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({ user_id: user!.id, total_cents: cartTotal })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const items = cart.map((item) => ({
        order_id: order.id,
        plan_id: item.plan.id,
        quantity: item.quantity,
        price_cents: item.plan.price_cents,
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(items);
      if (itemsError) throw itemsError;

      toast({
        title: "Pedido realizado!",
        description: "Seu pedido foi registrado com sucesso. Entraremos em contato para confirmar.",
      });

      setCart([]);
      fetchOrders();
      setActiveTab("orders");
    } catch (error: any) {
      toast({
        title: "Erro ao finalizar pedido",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingCheckout(false);
    }
  };

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

  const statusLabel: Record<string, string> = {
    pending: "Pendente",
    confirmed: "Confirmado",
    cancelled: "Cancelado",
  };

  const statusColor: Record<string, string> = {
    pending: "bg-accent text-accent-foreground",
    confirmed: "bg-secondary text-secondary-foreground",
    cancelled: "bg-destructive text-destructive-foreground",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="bg-primary border-b border-primary-foreground/10">
        <div className="container-narrow flex items-center justify-between h-16 px-4 md:px-8">
          <Link to="/" className="font-heading text-xl font-bold text-primary-foreground">
            Ponte <span className="text-secondary">Acadêmica</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-primary-foreground/70 hidden sm:block">
              {profile?.full_name || user?.email}
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
        <h1 className="font-heading text-3xl font-bold text-foreground mb-8">Minha Área</h1>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-muted rounded-lg p-1 w-fit">
          <button
            onClick={() => setActiveTab("plans")}
            className={`px-5 py-2.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === "plans" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ShoppingCart size={16} className="inline mr-2" />
            Planos
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`px-5 py-2.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === "orders" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Package size={16} className="inline mr-2" />
            Meus Pedidos
          </button>
        </div>

        {activeTab === "plans" && (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Plans */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="font-heading text-xl font-bold text-foreground mb-4">Escolha seu plano</h2>
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className="bg-card rounded-xl border border-border p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-card"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded ${
                          plan.plan_type === "enrollment" ? "bg-accent text-accent-foreground" : "bg-secondary/20 text-secondary"
                        }`}
                      >
                        {plan.plan_type === "enrollment" ? "Matrícula" : "Mensal"}
                      </span>
                    </div>
                    <h3 className="font-semibold text-foreground">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xl font-heading font-bold text-foreground whitespace-nowrap">
                      {formatCurrency(plan.price_cents)}
                    </span>
                    <button
                      onClick={() => addToCart(plan)}
                      className="bg-gradient-lime text-primary font-semibold text-sm px-4 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1"
                    >
                      <Plus size={16} />
                      Adicionar
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart */}
            <div className="bg-card rounded-xl border border-border p-6 shadow-card h-fit sticky top-24">
              <h3 className="font-heading text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <ShoppingCart size={20} />
                Carrinho
              </h3>

              {cart.length === 0 ? (
                <p className="text-sm text-muted-foreground">Seu carrinho está vazio.</p>
              ) : (
                <>
                  <div className="space-y-3 mb-6">
                    {cart.map((item) => (
                      <div key={item.plan.id} className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{item.plan.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(item.plan.price_cents)} × {item.quantity}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateQuantity(item.plan.id, -1)}
                            className="w-7 h-7 rounded border border-border flex items-center justify-center text-muted-foreground hover:text-foreground"
                          >
                            {item.quantity === 1 ? <Trash2 size={14} /> : <Minus size={14} />}
                          </button>
                          <span className="text-sm font-medium w-6 text-center text-foreground">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.plan.id, 1)}
                            className="w-7 h-7 rounded border border-border flex items-center justify-center text-muted-foreground hover:text-foreground"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-border pt-4 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-foreground">Total</span>
                      <span className="font-heading text-xl font-bold text-foreground">
                        {formatCurrency(cartTotal)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckout}
                    disabled={loadingCheckout}
                    className="w-full bg-gradient-lime text-primary font-semibold py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {loadingCheckout ? "Processando..." : "Finalizar Pedido"}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === "orders" && (
          <div>
            <h2 className="font-heading text-xl font-bold text-foreground mb-4">Histórico de Pedidos</h2>
            {orders.length === 0 ? (
              <div className="bg-card rounded-xl border border-border p-8 text-center">
                <Package size={40} className="mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Você ainda não fez nenhum pedido.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-card rounded-xl border border-border p-6 shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Pedido #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColor[order.status]}`}>
                        {statusLabel[order.status]}
                      </span>
                      <span className="font-heading text-lg font-bold text-foreground">
                        {formatCurrency(order.total_cents)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
