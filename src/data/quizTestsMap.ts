import { quizQuestions as test1Questions } from "./englishQuizQuestions";
import type { QuizQuestion } from "./englishQuizQuestions";

// Map test slugs to their question sets
const quizTestsMap: Record<string, QuizQuestion[]> = {
  test1: test1Questions,
};

export default quizTestsMap;
