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
  {
    id: 4,
    question: "Melissa enjoys comedies, but she ________________ horror movies at all.",
    options: [
      { label: "a", text: "isn't liking" },
      { label: "b", text: "doesn't like" },
      { label: "c", text: "not likes" },
      { label: "d", text: "doesn't likes" },
    ],
    correctAnswer: "b",
  },
  {
    id: 5,
    question: "Sorry, I can't talk right now. I've ____________ started my online English test.",
    options: [
      { label: "a", text: "already" },
      { label: "b", text: "yet" },
      { label: "c", text: "just" },
      { label: "d", text: "still" },
    ],
    correctAnswer: "a",
  },
  {
    id: 6,
    question: "He _________________ at the office last week.",
    options: [
      { label: "a", text: "didn't be" },
      { label: "b", text: "weren't" },
      { label: "c", text: "wasn't" },
      { label: "d", text: "isn't" },
    ],
    correctAnswer: "c",
  },
  {
    id: 7,
    question: "I wasn't expecting much, but I actually _______________ the film we watched last night.",
    options: [
      { label: "a", text: "liking" },
      { label: "b", text: "liked" },
      { label: "c", text: "like" },
      { label: "d", text: "have liked" },
    ],
    correctAnswer: "b",
  },
  {
    id: 8,
    question: "__________________ a piece of cake? No, thank you.",
    options: [
      { label: "a", text: "Do you like" },
      { label: "b", text: "Would you like" },
      { label: "c", text: "Want you" },
      { label: "d", text: "Are you like" },
    ],
    correctAnswer: "b",
  },
  {
    id: 9,
    question: "The kitchen is ___________________ than the bathroom.",
    options: [
      { label: "a", text: "more big" },
      { label: "b", text: "more bigger" },
      { label: "c", text: "biggest" },
      { label: "d", text: "bigger" },
    ],
    correctAnswer: "d",
  },
  {
    id: 10,
    question: "Jennifer has followed a vegetarian diet for over a decade. That means she ________________ meat or fish.",
    options: [
      { label: "a", text: "never eats" },
      { label: "b", text: "rarely eats" },
      { label: "c", text: "usually eats" },
      { label: "d", text: "still eats" },
    ],
    correctAnswer: "a",
  },
];
