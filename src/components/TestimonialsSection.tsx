import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const testimonials = [
  {
    name: "Maria Clara, 17 anos",
    role: "Aluna do Dual Diploma",
    text: "O programa mudou completamente minha visão de futuro. Hoje me sinto preparada para universidades internacionais e tenho um diferencial enorme no currículo.",
  },
  {
    name: "Roberto Almeida",
    role: "Pai de aluno",
    text: "A segurança e o acompanhamento da Ponte Acadêmica nos deram total tranquilidade. Meu filho conseguiu conciliar com o colégio no Brasil sem dificuldade.",
  },
  {
    name: "Ana Beatriz, 16 anos",
    role: "Aluna do Dual Diploma",
    text: "Poder estudar no meu ritmo, com professores que realmente se importam, fez toda a diferença. A plataforma é muito intuitiva e os conteúdos são incríveis.",
  },
];

const TestimonialsSection = () => {
  return (
    <section id="depoimentos" className="section-padding bg-muted">
      <div className="container-narrow">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-semibold text-secondary uppercase tracking-widest">
            Depoimentos
          </span>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mt-3">
            O que dizem nossos alunos
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="bg-card rounded-2xl p-8 shadow-card border border-border relative"
            >
              <Quote size={32} className="text-secondary/30 mb-4" />
              <p className="text-foreground/80 text-sm leading-relaxed mb-6">
                "{t.text}"
              </p>
              <div>
                <div className="font-semibold text-foreground text-sm">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.role}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
