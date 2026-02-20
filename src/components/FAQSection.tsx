import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "O diploma americano é reconhecido no Brasil?",
    a: "Sim, o diploma é emitido por uma escola americana credenciada e reconhecido tanto nos EUA quanto internacionalmente. Não substitui o diploma brasileiro, mas complementa com um diferencial acadêmico valioso.",
  },
  {
    q: "Qual a idade mínima para participar?",
    a: "O programa é recomendado para estudantes a partir dos 13 anos, cursando do 9º ano do Ensino Fundamental ao 3º ano do Ensino Médio.",
  },
  {
    q: "As aulas são em inglês?",
    a: "Sim, o conteúdo é em inglês. Recomendamos nível intermediário, mas oferecemos suporte para alunos que ainda estão aprendendo o idioma.",
  },
  {
    q: "Quanto tempo dura o programa?",
    a: "O programa pode ser concluído em até 4 anos. Contudo a duração média dos nossos alunos é em torno a 2 anos.",
  },
  {
    q: "Como funciona o acompanhamento pedagógico?",
    a: "Oferecemos tutoria individualizada, relatório periódico para os pais e suporte técnico na plataforma. O aluno nunca está sozinho.",
  },
  {
    q: "O programa interfere nos estudos no Brasil?",
    a: "Não. O programa foi desenhado para ser compatível com a rotina escolar brasileira. O aluno dedica em média de 1 a 3 horas por semana.",
  },
];

const FAQSection = () => {
  return (
    <section id="faq" className="section-padding bg-background">
      <div className="container-narrow max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-base font-semibold text-secondary-contrast uppercase tracking-widest">
            Perguntas Frequentes
          </span>
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mt-3">
            Tire as suas dúvidas
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="bg-card rounded-xl border border-border px-6 shadow-card"
              >
                <AccordionTrigger className="text-left font-semibold text-foreground hover:text-secondary-contrast transition-colors">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQSection;
