import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ContactSection = () => {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const mailtoLink = `mailto:miguel.ggr.sa@gmail.com?subject=Contato Chronos Education - ${encodeURIComponent(form.name)}&body=${encodeURIComponent(
      `Nome: ${form.name}\nEmail: ${form.email}\nTelefone: ${form.phone}\n\nMensagem:\n${form.message}`
    )}`;
    
    window.open(mailtoLink, "_blank");
    
    setLoading(false);
    toast({
      title: "Redirecionado para o email!",
      description: "Complete o envio no seu cliente de email.",
    });
    setForm({ name: "", email: "", phone: "", message: "" });
  };

  return (
    <section id="contato" className="section-padding bg-primary">
      <div className="container-narrow">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-base font-semibold text-secondary uppercase tracking-widest">
              Contato
            </span>
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-primary-foreground mt-3 mb-6">
              Agende uma reunião
            </h2>
            <p className="text-primary-foreground/70 leading-relaxed mb-10">
              Tire as suas dúvidas com a nossa equipe e descubra como o Dual Diploma pode transformar o seu futuro.
            </p>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-secondary/15 flex items-center justify-center flex-shrink-0">
                  <Mail size={18} className="text-secondary" />
                </div>
                <div>
                  <div className="text-xs text-primary-foreground/50 uppercase tracking-wide">Email</div>
                  <a href="mailto:contato@chronoseducation.com" className="text-primary-foreground hover:text-secondary transition-colors text-sm">
                    contato@chronoseducation.com
                  </a>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            onSubmit={handleSubmit}
            className="bg-card rounded-2xl p-8 shadow-elevated space-y-5"
          >
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Nome</label>
              <input
                type="text"
                required
                maxLength={100}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition"
                placeholder="Seu nome"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Email</label>
              <input
                type="email"
                required
                maxLength={255}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition"
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Telefone</label>
              <input
                type="tel"
                maxLength={20}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition"
                placeholder="(11) 99999-9999"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Mensagem</label>
              <textarea
                required
                maxLength={1000}
                rows={4}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition resize-none"
                placeholder="Como podemos ajudar?"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-lime text-primary font-semibold py-3.5 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Enviando..." : "Enviar Mensagem"}
              <Send size={16} />
            </button>
          </motion.form>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
