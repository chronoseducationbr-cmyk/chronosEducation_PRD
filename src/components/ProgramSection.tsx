import { motion } from "framer-motion";
import { Check } from "lucide-react";
import schoolInfraImg from "@/assets/school-infrastructure.jpg";
import graduationImg from "@/assets/graduation.jpg";

const subjects = [
  "English",
  "U.S. History",
  "Media Art",
  "Economics",
  "Robotics",
  "Anatomy and Physiology",
];

const ProgramSection = () => {
  return (
    <section id="programa" className="section-padding bg-background">
      <div className="container-narrow">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-base font-semibold text-secondary-contrast uppercase tracking-widest">
            Programa de Estudos
          </span>
          <h2 className="font-heading text-5xl md:text-6xl font-bold text-foreground mt-3 mb-4">
            Currículo Americano
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            O aluno cursa disciplinas obrigatórias do currículo americano, complementando com disciplinas opcionais de acordo com os seus interesses.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Subjects card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-card rounded-2xl p-8 shadow-card border border-border"
          >
            <h3 className="font-heading text-xl font-bold text-foreground mb-6">
              Disciplinas
            </h3>
            <ul className="space-y-3">
              {subjects.map((subject) => (
                <li key={subject} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-secondary-contrast flex items-center justify-center mt-0.5">
                    <Check size={12} className="text-white" />
                  </div>
                  <span className="text-sm text-foreground">{subject}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Image cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl overflow-hidden shadow-card relative group"
          >
            <img
              src={schoolInfraImg}
              alt="Infraestruturas da escola"
              className="w-full h-full object-cover min-h-[300px] group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6">
              <span className="bg-accent text-accent-foreground text-sm font-semibold px-4 py-2 rounded-lg">
                Infraestruturas
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl overflow-hidden shadow-card relative group"
          >
            <img
              src={graduationImg}
              alt="Cerimônia de graduação"
              className="w-full h-full object-cover min-h-[300px] group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6">
              <span className="bg-accent text-accent-foreground text-sm font-semibold px-4 py-2 rounded-lg">
                Graduação Oficial
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ProgramSection;
