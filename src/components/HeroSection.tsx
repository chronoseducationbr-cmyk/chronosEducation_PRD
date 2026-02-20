import { motion } from "framer-motion";
import { ArrowRight, GraduationCap } from "lucide-react";
import heroCampus from "@/assets/hero-campus.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={heroCampus}
          alt="Campus de high school americano"
          className="w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-hero opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-transparent to-primary/40" />
      </div>

      <div className="relative container-narrow px-4 md:px-8 pt-24 pb-16">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="flex items-center gap-2 mb-6"
          >
            <GraduationCap className="text-secondary" size={20} />
            <span className="text-sm font-semibold text-secondary uppercase tracking-widest">
              Dual Diploma — Brasil e Estados Unidos
            </span>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-lg md:text-xl text-primary-foreground/80 mb-4 max-w-xl leading-relaxed"
          >
            Dois diplomas, um futuro internacional
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
            className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight mb-6"
          >
            Diploma <span className="text-accent">americano e brasileiro</span> ao mesmo tempo
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-lg md:text-xl text-primary-foreground/80 mb-10 max-w-xl leading-relaxed"
          >
            Um reconhecido programa acadêmico que abre portas para universidades de todo o mundo, sem sair do Brasil.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <a
              href="#contato"
              className="inline-flex items-center justify-center gap-2 bg-gradient-lime text-primary font-semibold px-8 py-4 rounded-lg text-base hover:opacity-90 transition-opacity"
            >
              Agendar Reunião Gratuita
              <ArrowRight size={18} />
            </a>
            <a
              href="#o-que-e"
              className="inline-flex items-center justify-center gap-2 border-2 border-primary-foreground/30 text-primary-foreground font-medium px-8 py-4 rounded-lg text-base hover:border-secondary hover:text-secondary transition-colors"
            >
              Saiba Mais
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="mt-16 flex flex-wrap gap-8 md:gap-12"
          >
            {[
              { value: "100%", label: "Online" },
              { value: "2 anos", label: "de programa" },
              { value: "+500", label: "alunos formados" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl md:text-3xl font-heading font-bold text-secondary">
                  {stat.value}
                </div>
                <div className="text-sm text-primary-foreground/60">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
