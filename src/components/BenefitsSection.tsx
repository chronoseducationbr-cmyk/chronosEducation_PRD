import { motion } from "framer-motion";
import { Languages, Monitor, Brain, BookOpen, GraduationCap, Briefcase } from "lucide-react";

const benefits = [
  {
    icon: Languages,
    title: "Fluência em Inglês",
    description: "Melhoria do idioma inglês, com conhecimento da cultura e estilo de vida dos Estados Unidos",
  },
  {
    icon: Monitor,
    title: "Domínio da Tecnologia",
    description: "Aulas 100% online, permitindo aos alunos aprender num ambiente totalmente digital",
  },
  {
    icon: Brain,
    title: "Desenvolvimento Pessoal",
    description: "Desenvolvimento da autonomia, responsabilidade e maturidade, quer na auto-gestão do ritmo de aprendizagem, quer no Summer Camp nas férias de julho",
  },
  {
    icon: BookOpen,
    title: "Disciplinas Exclusivas",
    description: "Possibilidade de escolha de disciplinas que não existem no curriculum nacional, tal como economia, arte e robótica, entre outras",
  },
  {
    icon: GraduationCap,
    title: "Acesso a Universidades",
    description: "Facilidade no acesso a universidades: Estados Unidos, Inglaterra, Canadá, Australia...",
  },
  {
    icon: Briefcase,
    title: "Valorização do Currículo",
    description: "Valorização do currículo para acesso ao mercado de trabalho",
  },
];

const BenefitsSection = () => {
  return (
    <section id="beneficios" className="section-padding bg-muted">
      <div className="container-narrow">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-base font-semibold text-secondary-contrast uppercase tracking-widest">
            Vantagens
          </span>
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mt-3">
            Benefícios do Dual Diploma
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, i) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card rounded-2xl p-8 shadow-card border border-border"
            >
              <div className="mb-5 flex items-center justify-center gap-3">
                <benefit.icon size={32} className="text-secondary-contrast shrink-0" />
                <h3 className="font-heading text-lg font-bold text-foreground">
                  {benefit.title}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
