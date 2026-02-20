import { motion } from "framer-motion";
import { Globe, BookOpen, Award } from "lucide-react";
import studentsStudying from "@/assets/students-studying.jpg";

const WhatIsSection = () => {
  return (
    <section id="o-que-e" className="section-padding bg-background">
      <div className="container-narrow">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-base font-semibold text-secondary-contrast uppercase tracking-widest">
              O que é
            </span>
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mt-3 mb-6">
              Um diploma americano sem sair do Brasil
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6 text-justify">
              O Dual Diploma é um programa acadêmico que permite ao estudante brasileiro cursar o High School americano de forma online, simultaneamente ao ensino médio no Brasil. Ao final, o aluno recebe dois diplomas: o brasileiro e o americano.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-8 text-justify">
              Com o <strong className="text-foreground">Chronos Education</strong>, o aluno terá acompanhamento pedagógico personalizado, acesso a uma plataforma de ensino de excelência com professores nativos e suporte completo durante toda a jornada.
            </p>

            <div className="grid gap-4">
              {[
                { icon: Globe, title: "Reconhecimento Internacional", desc: "Diploma válido para Universidades em todo o mundo" },
                { icon: BookOpen, title: "100% Online", desc: "Estude de qualquer lugar, em qualquer horário" },
                { icon: Award, title: "Certificação Oficial", desc: "Diploma emitido por escola americana credenciada" },
              ].map((item) => (
                <div key={item.title} className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-secondary-contrast/15 flex items-center justify-center">
                    <item.icon size={20} className="text-secondary-contrast" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="rounded-2xl overflow-hidden shadow-elevated">
              <img
                src={studentsStudying}
                alt="Alunos estudando juntos"
                className="w-full h-[400px] md:h-[500px] object-cover"
                loading="lazy"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default WhatIsSection;
