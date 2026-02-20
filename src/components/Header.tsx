import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import chronosLogo from "@/assets/chronos-logo.png";

const navItems = [
  { label: "Dual Diploma", href: "#o-que-e" },
  { label: "Programa", href: "#programa" },
  { label: "Benefícios", href: "#beneficios" },
  { label: "Depoimentos", href: "#depoimentos" },
  { label: "FAQ", href: "#faq" },
];

const Header = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-primary/95 backdrop-blur-md border-b border-primary-foreground/10">
      <div className="container-narrow flex items-center justify-between h-16 px-4 md:px-8">
        <a href="#" className="flex items-center">
          <img src={chronosLogo} alt="Chronos" className="h-8" />
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-primary-foreground/80 hover:text-secondary transition-colors"
            >
              {item.label}
            </a>
          ))}
          <a
            href="#contato"
            className="bg-gradient-lime text-primary text-sm font-semibold px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
          >
            Agendar Reunião
          </a>
          <Link
            to={user ? "/dashboard" : "/login"}
            className="flex items-center gap-1.5 text-sm font-medium text-primary-foreground/80 hover:text-secondary transition-colors"
          >
            <User size={16} />
            {user ? "Minha Área" : "Entrar"}
          </Link>
        </nav>

        {/* Mobile toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden text-primary-foreground"
          aria-label="Menu"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-primary border-t border-primary-foreground/10"
          >
            <nav className="flex flex-col p-4 gap-3">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="text-sm font-medium text-primary-foreground/80 hover:text-secondary transition-colors py-2"
                >
                  {item.label}
                </a>
              ))}
              <a
                href="#contato"
                onClick={() => setIsOpen(false)}
                className="bg-gradient-lime text-primary text-sm font-semibold px-5 py-2.5 rounded-lg text-center mt-2"
              >
                Agendar Reunião
              </a>
              <Link
                to={user ? "/dashboard" : "/login"}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-1.5 text-sm font-medium text-primary-foreground/80 hover:text-secondary transition-colors py-2"
              >
                <User size={16} />
                {user ? "Minha Área" : "Entrar"}
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
