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
