import { quizQuestions as test1Questions } from "./englishQuizQuestions";
import { quizQuestions2 as test2Questions } from "./englishQuizQuestions2";
import type { QuizQuestion } from "./englishQuizQuestions";

// Map test slugs to their question sets
const quizTestsMap: Record<string, QuizQuestion[]> = {
  test1: test1Questions,
  test2: test2Questions,
};

export default quizTestsMap;
