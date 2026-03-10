import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import InvitePage from "./pages/InvitePage";
import DashboardPage from "./pages/DashboardPage";

import NotFound from "./pages/NotFound";
import TermsPage from "./pages/TermsPage";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminEnrollmentsPage from "./pages/admin/AdminEnrollmentsPage";
import AdminPaymentsPage from "./pages/admin/AdminPaymentsPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/convite" element={<InvitePage />} />
            <Route
              path="/pagamentos"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route path="/termos" element={<TermsPage />} />

            {/* Admin routes */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route index element={<Navigate to="/admin/inscricoes" replace />} />
              <Route path="inscricoes" element={<AdminEnrollmentsPage />} />
              <Route path="pagamentos" element={<AdminPaymentsPage />} />
              <Route path="utilizadores" element={<AdminUsersPage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
