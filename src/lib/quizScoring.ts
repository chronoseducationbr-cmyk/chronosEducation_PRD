import type { QuizQuestion } from "@/data/englishQuizQuestions";

export interface TestScoringConfig {
  getWeight: (questionId: number) => number;
  classifications: { minPoints: number; level: string; label: string }[];
  maxPoints: number;
}

const scoringConfigs: Record<string, TestScoringConfig> = {
  test1: {
    getWeight: (id) => {
      if (id >= 55) return 3;
      if (id >= 47) return 2;
      return 1;
    },
    classifications: [
      { minPoints: 75, level: "C2", label: "Proficiente" },
      { minPoints: 61, level: "C1", label: "Avançado" },
      { minPoints: 51, level: "B2", label: "Intermédio Superior" },
      { minPoints: 41, level: "B1", label: "Intermédio" },
      { minPoints: 31, level: "A2", label: "Elementar" },
      { minPoints: 21, level: "A1", label: "Iniciante" },
      { minPoints: 0, level: "A0", label: "" },
    ],
  },
  test2: {
    getWeight: () => 1,
    classifications: [
      { minPoints: 54, level: "B2", label: "Intermédio Superior" },
      { minPoints: 45, level: "B1", label: "Intermédio" },
      { minPoints: 35, level: "A2", label: "Elementar" },
      { minPoints: 0, level: "A1", label: "Iniciante" },
    ],
  },
};

const defaultConfig = scoringConfigs.test1;

function getConfig(testSlug?: string): TestScoringConfig {
  return (testSlug && scoringConfigs[testSlug]) || defaultConfig;
}

/**
 * Calculate weighted score for quiz answers.
 */
export function calculateQuizScore(
  questions: QuizQuestion[],
  answers: Record<number, string>,
  testSlug?: string
): { scorePoints: number; maxPoints: number; correctCount: number } {
  const config = getConfig(testSlug);
  let scorePoints = 0;
  let maxPoints = 0;
  let correctCount = 0;

  for (const q of questions) {
    const weight = config.getWeight(q.id);
    maxPoints += weight;

    const userAnswer = answers[q.id];
    if (userAnswer && userAnswer === q.correctAnswer) {
      scorePoints += weight;
      correctCount++;
    }
  }

  return { scorePoints, maxPoints, correctCount };
}

export interface Classification {
  level: string;
  label: string;
}

/**
 * Get CEFR classification based on total score points.
 */
export function getClassification(scorePoints: number, testSlug?: string): Classification {
  const config = getConfig(testSlug);
  for (const cls of config.classifications) {
    if (scorePoints >= cls.minPoints) {
      return { level: cls.level, label: cls.label };
    }
  }
  return { level: "A0", label: "" };
}
