import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ChevronRight, CheckCircle2, Volume2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { quizQuestions } from "@/data/englishQuizQuestions";
import chronosLogo from "@/assets/chronos-logo-header.png";
import SEOHead from "@/components/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const EnglishQuizPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const enrollmentId = searchParams.get("enrollment");
  const { toast } = useToast();

  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);

  const total = quizQuestions.length;
  const current = quizQuestions[currentIndex];
  const progress = ((currentIndex + (finished ? 1 : 0)) / total) * 100;

  const correctCount = Object.entries(answers).filter(([id, ans]) => {
    const q = quizQuestions.find((q) => q.id === Number(id));
    return q && q.correctAnswer === ans;
  }).length;

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
      saveResults(updated);
    }
  };

  const saveResults = async (finalAnswers: Record<number, string>) => {
    if (!user || !enrollmentId) return;
    setSaving(true);
    const correct = Object.entries(finalAnswers).filter(([id, ans]) => {
      const q = quizQuestions.find((q) => q.id === Number(id));
      return q && q.correctAnswer === ans;
    }).length;

    const { error } = await supabase.from("quiz_results" as any).insert({
      enrollment_id: enrollmentId,
      user_id: user.id,
      correct_count: correct,
      total_questions: quizQuestions.length,
    } as any);

    if (error) {
      console.error("Error saving quiz results:", error);
      toast({ title: "Erro ao guardar resultado do teste", variant: "destructive" });
    }
    setSaving(false);
  };

  useEffect(() => {
    if (!enrollmentId) {
      navigate("/gestao-matriculas");
    }
  }, [enrollmentId, navigate]);

  if (!enrollmentId) return null;
  if (!started) {
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

        <div className="container-narrow px-4 md:px-8 py-12 max-w-3xl mx-auto">
          <button
            onClick={() => navigate("/gestao-matriculas")}
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft size={16} />
            Voltar ao Painel
          </button>

          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <h1 className="font-heading text-3xl font-bold text-accent mb-4">Bem-vindo ao teste de nível de inglês!</h1>
            <p className="text-foreground mb-6">Este teste avalia o teu conhecimento da gramática inglesa.</p>
            
            <h2 className="font-heading text-lg font-semibold text-foreground mb-4 text-left">Instruções para o teste:</h2>
            <ol className="text-foreground text-left space-y-3 mb-8 list-none pl-0">
              <li><span className="font-heading text-accent font-bold text-xl">1.</span> <strong>Responde a todas as perguntas:</strong> Há 60 perguntas de múltipla escolha no total.</li>
              <li><span className="font-heading text-accent font-bold text-xl">2.</span> <strong>Após avançar para a pergunta seguinte</strong> já não podes voltar a pergunta anterior.</li>
              <li><span className="font-heading text-accent font-bold text-xl">3.</span> <strong>Sê honesto:</strong> Para aproveitar ao máximo o teste, certifica-te de que as tuas respostas são verdadeiras. Se não souberes a resposta, seleciona "I don't know". Ninguém te está julgando!</li>
              <li><span className="font-heading text-accent font-bold text-xl">4.</span> <strong>Fica atento ao tempo:</strong> Embora não tenhas limite de tempo, tenta não pensar demais em cada resposta. Isso te ajudará a obter um resultado mais preciso.</li>
              <li><span className="font-heading text-accent font-bold text-xl">5.</span> <strong>Lê as perguntas com atenção:</strong> Não te apresses ao ler as perguntas e certifica-te de entendê-las antes de responder.</li>
            </ol>

            <button
              onClick={() => setStarted(true)}
              className="w-full bg-secondary text-secondary-foreground font-semibold py-3.5 rounded-lg hover:opacity-90 transition-opacity"
            >
              Let's start!
            </button>
          </div>
        </div>
      </div>
    );
  }

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

        <div className="container-narrow px-4 md:px-8 py-12 max-w-3xl mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-secondary" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-foreground mb-8">Test Completed!</h1>

          <button
             onClick={() => navigate("/gestao-matriculas")}
            disabled={saving}
            className="w-full bg-primary text-primary-foreground font-semibold py-3.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? "A guardar..." : "Voltar ao Painel"}
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

      <div className="container-narrow px-4 md:px-8 py-8 max-w-3xl mx-auto">
        <button
          onClick={() => navigate("/gestao-matriculas")}
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          Voltar ao Painel
        </button>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="font-heading text-xl font-bold text-accent">English Level Test</h1>
            <span className="text-sm font-semibold text-muted-foreground">
              {currentIndex + 1}/{total}
            </span>
          </div>
          <Progress value={progress} className="h-2 bg-muted [&>div]:bg-secondary" />
        </div>

        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <p className="text-sm font-medium text-muted-foreground mb-1">Question {currentIndex + 1}</p>
          {(() => {
            const text = current.question;
            const instructionPrefixes = ["Read and select the best option.", "Listen to the audio and answer the question.", "Listen to the following audio and select the most appropriate sentence.", "Listen to the audio passage and select the most appropriate sentence.", "Listen and answer the question."];
            const matchedPrefix = instructionPrefixes.find(p => text.startsWith(p));
            
            if (matchedPrefix) {
              const rest = text.slice(matchedPrefix.length).trim();
              return (
                <>
                  <p className="text-sm font-medium text-secondary mb-3">{matchedPrefix}</p>
                  {current.audioUrl && (
                    <div className="my-4 flex items-center gap-3 bg-muted/50 rounded-lg p-4">
                      <Volume2 className="w-5 h-5 text-accent shrink-0" />
                      <audio controls className="w-full h-10" src={current.audioUrl}>
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  )}
                  {rest && <p className="text-lg font-semibold text-foreground leading-relaxed whitespace-pre-line">{rest}</p>}
                </>
              );
            }
            return (
              <>
                {current.audioUrl && (
                  <div className="my-4 flex items-center gap-3 bg-muted/50 rounded-lg p-4">
                    <Volume2 className="w-5 h-5 text-accent shrink-0" />
                    <audio controls className="w-full h-10" src={current.audioUrl}>
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                )}
                <p className="text-lg font-semibold text-foreground leading-relaxed whitespace-pre-line">{text}</p>
              </>
            );
          })()}
        </div>

        <div className="space-y-3 mb-8">
          {[...current.options, { label: "e", text: "I don't know" }].map((opt) => {
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

        <button
          onClick={handleNext}
          disabled={!selectedAnswer}
          className="w-full flex items-center justify-center gap-2 bg-secondary text-secondary-foreground font-semibold py-3.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {currentIndex < total - 1 ? "Next" : "Finish"}
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default EnglishQuizPage;
