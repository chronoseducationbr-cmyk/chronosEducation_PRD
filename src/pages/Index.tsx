import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import WhatIsSection from "@/components/WhatIsSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import ProgramSection from "@/components/ProgramSection";
import BenefitsSection from "@/components/BenefitsSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import FAQSection from "@/components/FAQSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import SEOHead from "@/components/SEOHead";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate(isAdmin ? "/admin" : "/gestao-matriculas", { replace: true });
    }
  }, [user, loading, isAdmin, navigate]);
  return (
    <div className="min-h-screen">
      <SEOHead
        title="Chronos — Dual Diploma Brasil e Estados Unidos"
        description="Programa Dual Diploma — Diploma americano e brasileiro ao mesmo tempo. 100% online, reconhecido internacionalmente."
        canonical="/"
      />
      <Header />
      <main>
        <HeroSection />
        <WhatIsSection />
        <HowItWorksSection />
        <ProgramSection />
        <BenefitsSection />
        <TestimonialsSection />
        <FAQSection />
        <ContactSection />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Index;
