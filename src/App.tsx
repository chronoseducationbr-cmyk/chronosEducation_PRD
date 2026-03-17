import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import AuthRedirect from "@/components/AuthRedirect";
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import InvitePage from "./pages/InvitePage";
import ConfirmEmailPage from "./pages/ConfirmEmailPage";
import DashboardPage from "./pages/DashboardPage";
import EnglishQuizPage from "./pages/EnglishQuizPage";

import NotFound from "./pages/NotFound";
import TermsPage from "./pages/TermsPage";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminEnrollmentsPage from "./pages/admin/AdminEnrollmentsPage";
import AdminPaymentsPage from "./pages/admin/AdminPaymentsPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage";

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
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/auth-redirect" element={<AuthRedirect />} />
            <Route path="/convite" element={<InvitePage />} />
            <Route path="/confirm-email" element={<ConfirmEmailPage />} />
            <Route
              path="/gestao-matriculas"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route path="/termos" element={<TermsPage />} />
            <Route
              path="/teste-ingles"
              element={
                <ProtectedRoute>
                  <EnglishQuizPage />
                </ProtectedRoute>
              }
            />

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
              <Route path="configuracoes" element={<AdminSettingsPage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
