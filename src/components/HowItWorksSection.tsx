import { motion } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "Matrícula",
    description: "Faça sua inscrição e receba acesso à plataforma americana de ensino com suporte completo.",
  },
  {
    number: "02",
    title: "Estudo Online",
    description: "Curse as disciplinas americanas online, com flexibilidade de horário e acompanhamento pedagógico.",
  },
  {
    number: "03",
    title: "Avaliações",
    description: "Realize as avaliações e projetos com orientação de tutores especializados.",
  },
  {
    number: "04",
    title: "Formatura",
    description: "Receba seu diploma americano junto com o brasileiro e abra portas para o mundo.",
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
          <span className="text-sm font-semibold text-secondary uppercase tracking-widest">
            Como funciona
          </span>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-primary-foreground mt-3">
            Quatro passos para o futuro internacional
          </h2>
        </motion.div>

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
              <div className="text-5xl font-heading font-bold text-secondary/20 mb-3">
                {step.number}
              </div>
              <h3 className="font-heading text-xl font-bold text-primary-foreground mb-2">
                {step.title}
              </h3>
              <p className="text-primary-foreground/70 text-sm leading-relaxed">
                {step.description}
              </p>
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 right-0 w-8 h-0.5 bg-secondary/30 translate-x-4" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
