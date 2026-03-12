import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const AuthRedirect = () => {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    // Wait a tick for isAdmin to be resolved
    const timer = setTimeout(() => {
      navigate(isAdmin ? "/admin" : "/pagamentos", { replace: true });
    }, 300);
    return () => clearTimeout(timer);
  }, [user, loading, isAdmin, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
};

export default AuthRedirect;
