import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const testimonials = [
  {
    name: "Maria Clara, 17 anos",
    role: "Aluna do Dual Diploma",
    text: "O programa mudou completamente a minha visão de futuro. Hoje me sinto preparada para concorrer a universidades internacionais e tenho um diferencial enorme no currículo.",
  },
  {
    name: "Roberto Almeida",
    role: "Pai de aluno",
    text: "A segurança e o acompanhamento do programa nos deram total tranquilidade. O meu filho conseguiu conciliar com os estudos no Brasil, sem dificuldade.",
  },
  {
    name: "Ana Beatriz, 16 anos",
    role: "Aluna do Dual Diploma",
    text: "Poder estudar no meu ritmo, com professores que me ajudam no meu nivel de inglês, faz toda a diferença. A plataforma é muito intuitiva e os conteúdos são incríveis.",
  },
];

const TestimonialsSection = () => {
  return (
    <section id="depoimentos" className="section-padding bg-primary">
      <div className="container-narrow">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-base font-semibold text-secondary uppercase tracking-widest">
            Depoimentos
          </span>
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-primary-foreground mt-3">
            O que dizem os nossos alunos
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
              className="bg-primary-foreground/10 rounded-2xl p-8 shadow-card border border-primary-foreground/10 relative"
            >
              <Quote size={32} className="text-secondary/30 mb-4" />
              <p className="text-primary-foreground/80 text-sm leading-relaxed mb-6">
                "{t.text}"
              </p>
              <div>
                <div className="font-semibold text-primary-foreground text-sm">{t.name}</div>
                <div className="text-xs text-primary-foreground/50">{t.role}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
