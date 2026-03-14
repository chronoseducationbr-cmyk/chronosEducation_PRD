export interface QuizQuestion {
  id: number;
  question: string;
  options: { label: string; text: string }[];
  correctAnswer: string;
}

export const quizQuestions: QuizQuestion[] = [
  {
    id: 1,
    question: "I ________________ from Spain.",
    options: [
      { label: "a", text: "is" },
      { label: "b", text: "are" },
      { label: "c", text: "am" },
      { label: "d", text: "be" },
    ],
    correctAnswer: "c",
  },
  {
    id: 2,
    question: "This is my friend. _____________ name is Oscar.",
    options: [
      { label: "a", text: "her" },
      { label: "b", text: "our" },
      { label: "c", text: "yours" },
      { label: "d", text: "his" },
    ],
    correctAnswer: "d",
  },
  {
    id: 3,
    question: "_______________ 20 chairs in the office.",
    options: [
      { label: "a", text: "This is" },
      { label: "b", text: "There is" },
      { label: "c", text: "They are" },
      { label: "d", text: "There are" },
    ],
    correctAnswer: "d",
  },
];
