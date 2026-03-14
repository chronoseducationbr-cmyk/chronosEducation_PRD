import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { quizQuestions } from "@/data/englishQuizQuestions";
import chronosLogo from "@/assets/chronos-logo-header.png";
import SEOHead from "@/components/SEOHead";
import { useAuth } from "@/contexts/AuthContext";

const EnglishQuizPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [finished, setFinished] = useState(false);

  const total = quizQuestions.length;
  const current = quizQuestions[currentIndex];
  const progress = ((currentIndex + (finished ? 1 : 0)) / total) * 100;

  const handleSelect = (label: string) => {
    setSelectedAnswer(label);
  };

  const handleNext = () => {
    if (!selectedAnswer) return;
    const updated = { ...answers, [current.id]: selectedAnswer };
    setAnswers(updated);

    if (currentIndex < total - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
    } else {
      setFinished(true);
    }
  };

  const correctCount = Object.entries(answers).filter(([id, ans]) => {
    const q = quizQuestions.find((q) => q.id === Number(id));
    return q && q.correctAnswer === ans;
  }).length;

  if (finished) {
    return (
      <div className="min-h-screen bg-background">
        <SEOHead title="Resultado — Teste de Inglês" description="Resultado do teste de nível de inglês." />
        <header className="bg-primary border-b border-primary-foreground/10">
          <div className="container-narrow flex items-center justify-between h-16 px-4 md:px-8">
            <Link to="/" className="flex items-center">
              <img src={chronosLogo} alt="Chronos Education" className="h-8" />
            </Link>
          </div>
        </header>

        <div className="container-narrow px-4 md:px-8 py-12 max-w-xl mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-secondary" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-foreground mb-3">Teste Concluído!</h1>
          <p className="text-muted-foreground mb-8">
            Acertaste <span className="font-bold text-foreground">{correctCount}</span> de{" "}
            <span className="font-bold text-foreground">{total}</span> perguntas.
          </p>

          <div className="bg-card border border-border rounded-xl p-6 mb-8">
            <div className="text-5xl font-heading font-bold text-secondary mb-2">
              {Math.round((correctCount / total) * 100)}%
            </div>
            <p className="text-sm text-muted-foreground">Taxa de acerto</p>
          </div>

          <button
            onClick={() => navigate("/pagamentos")}
            className="w-full bg-primary text-primary-foreground font-semibold py-3.5 rounded-lg hover:opacity-90 transition-opacity"
          >
            Voltar ao Painel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Teste de Inglês — Chronos Education" description="Avaliação de nível de inglês." />
      <header className="bg-primary border-b border-primary-foreground/10">
        <div className="container-narrow flex items-center justify-between h-16 px-4 md:px-8">
          <Link to="/" className="flex items-center">
            <img src={chronosLogo} alt="Chronos Education" className="h-8" />
          </Link>
        </div>
      </header>

      <div className="container-narrow px-4 md:px-8 py-8 max-w-xl mx-auto">
        {/* Back link */}
        <button
          onClick={() => navigate("/pagamentos")}
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          Voltar ao Painel
        </button>

        {/* Progress header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="font-heading text-xl font-bold text-foreground">English Level Test</h1>
            <span className="text-sm font-semibold text-muted-foreground">
              {currentIndex + 1}/{total}
            </span>
          </div>
          <Progress value={progress} className="h-2 bg-muted [&>div]:bg-secondary" />
        </div>

        {/* Question card */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <p className="text-sm font-medium text-muted-foreground mb-1">Pergunta {currentIndex + 1}</p>
          <h2 className="text-lg font-semibold text-foreground leading-relaxed">{current.question}</h2>
        </div>

        {/* Options */}
        <div className="space-y-3 mb-8">
          {current.options.map((opt) => {
            const isSelected = selectedAnswer === opt.label;
            return (
              <button
                key={opt.label}
                onClick={() => handleSelect(opt.label)}
                className={`w-full text-left flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  isSelected
                    ? "border-secondary bg-secondary/10"
                    : "border-border bg-card hover:border-muted-foreground/30"
                }`}
              >
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                    isSelected
                      ? "bg-secondary text-secondary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {opt.label}
                </span>
                <span className={`font-medium ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>
                  {opt.text}
                </span>
              </button>
            );
          })}
        </div>

        {/* Next button */}
        <button
          onClick={handleNext}
          disabled={!selectedAnswer}
          className="w-full flex items-center justify-center gap-2 bg-secondary text-secondary-foreground font-semibold py-3.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {currentIndex < total - 1 ? "Próxima" : "Finalizar"}
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default EnglishQuizPage;
