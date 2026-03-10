import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, Users, Send, RefreshCw, Mail, Clock, CheckCircle2, XCircle, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface UserData {
  user_id: string;
  email: string | null;
  last_sign_in_at: string | null;
  created_at: string;
  full_name: string;
  phone: string | null;
  is_admin: boolean;
}

interface Invitation {
  id: string;
  email: string;
  invite_code: string;
  status: string;
  created_at: string;
  expires_at: string;
  used_at: string | null;
}

const AdminUsersPage = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserData[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [authRes, profilesRes, invRes, rolesRes] = await Promise.all([
      supabase.rpc("get_admin_users"),
      supabase.from("profiles").select("user_id, full_name, phone"),
      supabase.rpc("get_admin_invitations"),
      supabase.from("user_roles").select("user_id, role"),
    ]);

    const authUsers = (authRes.data as any[]) || [];
    const profiles = (profilesRes.data as any[]) || [];
    const roles = (rolesRes.data as any[]) || [];
    const profileMap: Record<string, { full_name: string; phone: string | null }> = {};
    profiles.forEach((p: any) => {
      profileMap[p.user_id] = { full_name: p.full_name, phone: p.phone };
    });
    const adminSet = new Set(roles.filter((r: any) => r.role === "admin").map((r: any) => r.user_id));

    setUsers(authUsers.map((u: any) => ({
      user_id: u.user_id,
      email: u.email,
      last_sign_in_at: u.last_sign_in_at,
      created_at: u.created_at,
      full_name: profileMap[u.user_id]?.full_name || "",
      phone: profileMap[u.user_id]?.phone || null,
      is_admin: adminSet.has(u.user_id),
    })));

    setInvitations((invRes.data as Invitation[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) {
      toast({ title: "Email é obrigatório", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("create-invite", {
        body: { email: inviteEmail.trim() },
      });
      if (error) throw error;
      toast({ title: "Convite enviado com sucesso", description: `Email enviado para ${inviteEmail}` });
      setInviteEmail("");
      setShowInviteDialog(false);
      load();
    } catch (err: any) {
      toast({ title: "Erro ao enviar convite", description: err.message || "Tente novamente", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleResendInvite = async (email: string, invitationId: string) => {
    setResendingId(invitationId);
    try {
      const { error } = await supabase.functions.invoke("create-invite", {
        body: { email },
      });
      if (error) throw error;
      toast({ title: "Novo convite enviado", description: `Email reenviado para ${email}` });
      load();
    } catch (err: any) {
      toast({ title: "Erro ao reenviar convite", description: err.message || "Tente novamente", variant: "destructive" });
    } finally {
      setResendingId(null);
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    const dt = new Date(d);
    return `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}/${dt.getFullYear()}`;
  };

  const formatDateTime = (d: string | null) => {
    if (!d) return "Nunca";
    const dt = new Date(d);
    return `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}/${dt.getFullYear()} ${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`;
  };

  const isExpired = (inv: Invitation) => inv.status === "pending" && new Date(inv.expires_at) < new Date();
  const isUsed = (inv: Invitation) => inv.status === "used";

  const getInviteStatus = (inv: Invitation) => {
    if (isUsed(inv)) return { label: "Utilizado", icon: CheckCircle2, color: "bg-green-100 text-green-800" };
    if (isExpired(inv)) return { label: "Expirado", icon: XCircle, color: "bg-red-100 text-red-800" };
    return { label: "Pendente", icon: Clock, color: "bg-amber-100 text-amber-800" };
  };

  const filteredUsers = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (u.email?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (u.phone?.toLowerCase() || "").includes(search.toLowerCase())
  );

  const filteredInvites = invitations.filter(
    (inv) => inv.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Utilizadores</h1>
          <p className="text-sm text-muted-foreground">{users.length} utilizadores · {invitations.length} convites</p>
        </div>
        <Button onClick={() => setShowInviteDialog(true)} className="flex items-center gap-2" size="sm">
          <Send size={14} />
          Enviar Convite
        </Button>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Pesquisar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Utilizadores ({users.length})</TabsTrigger>
          <TabsTrigger value="invites">Convites ({invitations.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted rounded-xl" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((u) => (
                <div key={u.user_id} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Users size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{u.full_name || "Sem nome"}</p>
                    <p className="text-xs text-muted-foreground">{u.email || "—"}</p>
                  </div>
                  <div className="text-right shrink-0 space-y-0.5">
                    <p className="text-xs text-muted-foreground">{u.phone || "—"}</p>
                    <p className="text-[10px] text-muted-foreground">Último login: {formatDateTime(u.last_sign_in_at)}</p>
                    <p className="text-[10px] text-muted-foreground">Registado em {formatDate(u.created_at)}</p>
                  </div>
                </div>
              ))}
              {filteredUsers.length === 0 && (
                <p className="text-center text-muted-foreground py-8">Nenhum utilizador encontrado.</p>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="invites" className="mt-4">
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted rounded-xl" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredInvites.map((inv) => {
                const st = getInviteStatus(inv);
                const StatusIcon = st.icon;
                const canResend = isExpired(inv) || (inv.status === "pending");

                return (
                  <div key={inv.id} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Mail size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{inv.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${st.color}`}>
                          <StatusIcon size={10} />
                          {st.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Enviado em {formatDate(inv.created_at)} · Expira em {formatDate(inv.expires_at)}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0">
                      {canResend && !isUsed(inv) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResendInvite(inv.email, inv.id)}
                          disabled={resendingId === inv.id}
                          className="flex items-center gap-1.5 text-xs"
                        >
                          <RefreshCw size={12} className={resendingId === inv.id ? "animate-spin" : ""} />
                          {isExpired(inv) ? "Reenviar" : "Novo convite"}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
              {filteredInvites.length === 0 && (
                <p className="text-center text-muted-foreground py-8">Nenhum convite encontrado.</p>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar Convite</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Introduza o email do utilizador que pretende convidar para a plataforma.
            </p>
            <Input
              type="email"
              placeholder="email@exemplo.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendInvite()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)} disabled={sending}>
              Cancelar
            </Button>
            <Button onClick={handleSendInvite} disabled={sending}>
              {sending ? "A enviar..." : "Enviar Convite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsersPage;
