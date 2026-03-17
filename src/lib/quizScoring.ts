import type { QuizQuestion } from "@/data/englishQuizQuestions";

/**
 * Calculate weighted score for quiz answers.
 * - Questions 1-46: 1 point each
 * - Questions 47-54: 2 points each
 * - Questions 55-60: 3 points each
 */
export function calculateQuizScore(
  questions: QuizQuestion[],
  answers: Record<number, string>
): { scorePoints: number; maxPoints: number; correctCount: number } {
  let scorePoints = 0;
  let maxPoints = 0;
  let correctCount = 0;

  for (const q of questions) {
    const weight = getQuestionWeight(q.id);
    maxPoints += weight;

    const userAnswer = answers[q.id];
    if (userAnswer && userAnswer === q.correctAnswer) {
      scorePoints += weight;
      correctCount++;
    }
  }

  return { scorePoints, maxPoints, correctCount };
}

function getQuestionWeight(questionId: number): number {
  if (questionId >= 55) return 3;
  if (questionId >= 47) return 2;
  return 1;
}

export interface Classification {
  level: string;
  label: string;
}

/**
 * Get CEFR classification based on total score points.
 */
export function getClassification(scorePoints: number): Classification {
  if (scorePoints >= 75) return { level: "C2", label: "Proficiente" };
  if (scorePoints >= 61) return { level: "C1", label: "Avançado" };
  if (scorePoints >= 51) return { level: "B2", label: "Intermédio Superior" };
  if (scorePoints >= 41) return { level: "B1", label: "Intermédio" };
  if (scorePoints >= 31) return { level: "A2", label: "Elementar" };
  if (scorePoints >= 21) return { level: "A1", label: "Iniciante" };
  return { level: "A0", label: "" };
}
