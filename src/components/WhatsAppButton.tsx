import { MessageCircle } from "lucide-react";

const WhatsAppButton = () => {
  const phoneNumber = "5511999491067";
  const message = encodeURIComponent("Olá! Gostaria de saber mais sobre o programa Dual Diploma da Chronos Education.");
  const url = `https://web.whatsapp.com/send?phone=${phoneNumber}&text=${message}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contato via WhatsApp"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)] text-[hsl(0,0%,100%)] rounded-full flex items-center justify-center shadow-elevated transition-colors"
    >
      <MessageCircle size={28} />
    </a>
  );
};

export default WhatsAppButton;
