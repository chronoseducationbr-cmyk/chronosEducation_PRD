import { motion } from "framer-motion";
import { Plus, Equal } from "lucide-react";
import flagBrazil from "@/assets/flag-brazil.png";
import flagUSA from "@/assets/flag-usa.png";

const steps = [
  {
    number: "1",
    title: "Matrícula",
    description: "Faça a sua inscrição e receba acesso à plataforma americana de ensino com suporte completo.",
  },
  {
    number: "2",
    title: "Estudo Online",
    description: "Curse as disciplinas americanas online, com flexibilidade de horário e acompanhamento pedagógico.",
  },
  {
    number: "3",
    title: "Avaliações",
    description: "Realize as avaliações e projetos com orientação de tutores especializados.",
  },
  {
    number: "4",
    title: "Formatura",
    description: "Participe na formatura na escola americana e abra as portas para o mundo.",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="como-funciona" className="section-padding bg-primary">
      <div className="container-narrow">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-base font-semibold text-secondary uppercase tracking-widest">
            Como funciona
          </span>
          <p className="font-heading text-2xl md:text-3xl font-bold text-primary-foreground mt-3 max-w-3xl mx-auto leading-snug">
            Os convênios internacionais alcançados por Chronos permitem a máxima validação possível:
          </p>
        </motion.div>

        {/* Credits visual */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row items-stretch justify-center gap-4 md:gap-6 mb-16"
        >
          <div className="overflow-hidden rounded-2xl border border-primary-foreground/20 text-center w-48 flex flex-col">
            <div className="relative h-20">
              <img src={flagBrazil} alt="" className="absolute inset-0 w-full h-full object-cover opacity-75" />
            </div>
            <div className="px-6 py-3 bg-background flex-1 flex flex-col items-center justify-center">
              <div className="text-4xl font-heading font-bold text-[#F9B91D]">18</div>
              <div className="text-sm font-bold text-primary/80 mt-1">Créditos Brasil</div>
            </div>
          </div>

          <Plus size={32} className="text-secondary shrink-0 self-center" strokeWidth={3} />

          <div className="overflow-hidden rounded-2xl border border-primary-foreground/20 text-center w-48 flex flex-col">
            <div className="relative h-20">
              <img src={flagUSA} alt="" className="absolute inset-0 w-full h-full object-cover opacity-75" />
            </div>
            <div className="px-6 py-3 bg-background flex-1 flex flex-col items-center justify-center">
              <div className="text-4xl font-heading font-bold text-[#F9B91D]">5</div>
              <div className="text-sm font-bold text-primary/80 mt-1">Créditos programa Chronos</div>
            </div>
          </div>

          <Equal size={32} className="text-secondary shrink-0 self-center" strokeWidth={3} />

          <div className="overflow-hidden rounded-2xl text-center w-48 flex flex-col">
            <div className="relative h-20 flex">
              <img src={flagBrazil} alt="" className="w-1/2 h-full object-cover opacity-75" />
              <img src={flagUSA} alt="" className="w-1/2 h-full object-cover opacity-75" />
            </div>
            <div className="px-6 py-3 bg-gradient-gold flex-1 flex flex-col items-center justify-center">
              <div className="text-xl font-heading font-bold text-primary">Diploma Americano</div>
            </div>
          </div>
        </motion.div>

        {/* Steps title */}
        <motion.h3
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-heading text-2xl md:text-3xl font-bold text-primary-foreground text-center mb-12"
        >
          <span className="text-5xl md:text-6xl text-secondary">4</span> passos para o seu futuro internacional
        </motion.h3>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              className="relative"
            >
              <div className="text-5xl font-heading font-bold text-[#F9B91D] mb-3">
                {step.number}
              </div>
              <h3 className="font-heading text-xl font-bold text-primary-foreground mb-2">
                {step.title}
              </h3>
              <p className="text-primary-foreground/70 text-sm leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
