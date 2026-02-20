import chronosLogo from "@/assets/chronos-logo.png";

const Footer = () => {
  return (
    <footer className="bg-primary border-t border-primary-foreground/10 py-10 px-4 md:px-8">
      <div className="container-narrow">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <img src={chronosLogo} alt="Chronos" className="h-8" />
            <p className="text-xs text-primary-foreground/50 mt-1">
              Dual Diploma — Brasil e Estados Unidos
            </p>
          </div>

          <nav className="flex flex-wrap gap-6 justify-center">
            {["O que é", "Como funciona", "Programa", "FAQ", "Contato"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s/g, "-").replace("é", "e")}`}
                className="text-xs text-primary-foreground/60 hover:text-secondary transition-colors"
              >
                {item}
              </a>
            ))}
          </nav>

          <p className="text-xs text-primary-foreground/40">
            © {new Date().getFullYear()} Chronos. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
