import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  isAdmin: false,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const checkAdmin = async (userId: string) => {
    const { data } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    setIsAdmin(!!data);
  };

  useEffect(() => {
    const SESSION_FLAG = "chronos_session_active";
    let initialized = false;

    const initSession = async () => {
      // If sessionStorage flag is missing, this is a new browser session → sign out
      if (!sessionStorage.getItem(SESSION_FLAG)) {
        const { data: { session: existing } } = await supabase.auth.getSession();
        if (existing) {
          await supabase.auth.signOut();
          setSession(null);
          setIsAdmin(false);
          initialized = true;
          setLoading(false);
          return;
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session?.user) {
        sessionStorage.setItem(SESSION_FLAG, "1");
        checkAdmin(session.user.id);
      }
      initialized = true;
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Ignore auth events until initSession has finished its check
      if (!initialized) return;
      setSession(session);
      if (session?.user) {
        sessionStorage.setItem(SESSION_FLAG, "1");
        checkAdmin(session.user.id);
      } else {
        sessionStorage.removeItem(SESSION_FLAG);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    initSession();

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, isAdmin, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
