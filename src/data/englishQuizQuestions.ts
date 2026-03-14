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
  {
    id: 11,
    question: "It was hard to get home last night because there weren't ________________ buses or trains running after midnight.",
    options: [
      { label: "a", text: "much" },
      { label: "b", text: "some" },
      { label: "c", text: "any" },
      { label: "d", text: "a few" },
    ],
    correctAnswer: "c",
  },
  {
    id: 12,
    question: "The car park is _________________ to the restaurant.",
    options: [
      { label: "a", text: "next" },
      { label: "b", text: "opposite" },
      { label: "c", text: "behind" },
      { label: "d", text: "in front" },
    ],
    correctAnswer: "a",
  },
  {
    id: 13,
    question: "Angelina ________________ shopping every day.",
    options: [
      { label: "a", text: "is going" },
      { label: "b", text: "go" },
      { label: "c", text: "going" },
      { label: "d", text: "goes" },
    ],
    correctAnswer: "d",
  },
  {
    id: 14,
    question: "They _________________ in the park when it started to rain heavily.",
    options: [
      { label: "a", text: "walked" },
      { label: "b", text: "were walking" },
      { label: "c", text: "were walk" },
      { label: "d", text: "are walking" },
    ],
    correctAnswer: "b",
  },
  {
    id: 15,
    question: "________________ seen a falling star before?",
    options: [
      { label: "a", text: "Did you ever" },
      { label: "b", text: "Are you ever" },
      { label: "c", text: "Have you ever" },
      { label: "d", text: "Do you ever" },
    ],
    correctAnswer: "c",
  },
  {
    id: 16,
    question: "We've been friends ____________________ many years.",
    options: [
      { label: "a", text: "since" },
      { label: "b", text: "from" },
      { label: "c", text: "during" },
      { label: "d", text: "for" },
    ],
    correctAnswer: "d",
  },
  {
    id: 17,
    question: "You _________________ pay for the tickets. They're free.",
    options: [
      { label: "a", text: "have to" },
      { label: "b", text: "don't have" },
      { label: "c", text: "don't need to" },
      { label: "d", text: "doesn't have to" },
    ],
    correctAnswer: "b",
  },
  {
    id: 18,
    question: "Jack was ill last week and he _________________ go out.",
    options: [
      { label: "a", text: "needn't" },
      { label: "b", text: "can't" },
      { label: "c", text: "mustn't" },
      { label: "d", text: "couldn't" },
    ],
    correctAnswer: "d",
  },
  {
    id: 19,
    question: "These are the photos ________________ I took on holiday.",
    options: [
      { label: "a", text: "which" },
      { label: "b", text: "who" },
      { label: "c", text: "what" },
      { label: "d", text: "where" },
    ],
    correctAnswer: "a",
  },
  {
    id: 20,
    question: "We'll stay at home if it _______________ this afternoon.",
    options: [
      { label: "a", text: "raining" },
      { label: "b", text: "rains" },
      { label: "c", text: "will rain" },
      { label: "d", text: "rain" },
    ],
    correctAnswer: "b",
  },
  {
    id: 21,
    question: "He doesn't smoke now, but he __________________ a lot when he was young.",
    options: [
      { label: "a", text: "has smoked" },
      { label: "b", text: "smokes" },
      { label: "c", text: "used to smoke" },
      { label: "d", text: "was smoked" },
    ],
    correctAnswer: "c",
  },
  {
    id: 22,
    question: "Michael plays basketball ___________________ anyone else I know.",
    options: [
      { label: "a", text: "more good than" },
      { label: "b", text: "as better as" },
      { label: "c", text: "best than" },
      { label: "d", text: "better than" },
    ],
    correctAnswer: "d",
  },
  {
    id: 23,
    question: "I promise I __________________ you as soon as I've finished this cleaning.",
    options: [
      { label: "a", text: "will help" },
      { label: "b", text: "am helping" },
      { label: "c", text: "going to help" },
      { label: "d", text: "have helped" },
    ],
    correctAnswer: "a",
  },
  {
    id: 24,
    question: "This town ___________________ by lots of tourists during the summer.",
    options: [
      { label: "a", text: "visits" },
      { label: "b", text: "visited" },
      { label: "c", text: "is visiting" },
      { label: "d", text: "is visited" },
    ],
    correctAnswer: "d",
  },
  {
    id: 25,
    question: "He said that his friends ____________ to speak to him after they lost the football match.",
    options: [
      { label: "a", text: "not want" },
      { label: "b", text: "weren't" },
      { label: "c", text: "didn't want" },
      { label: "d", text: "aren't wanting" },
    ],
    correctAnswer: "c",
  },
  {
    id: 26,
    question: "How about _________________ to the cinema tonight?",
    options: [
      { label: "a", text: "going" },
      { label: "b", text: "go" },
      { label: "c", text: "to go" },
      { label: "d", text: "for going" },
    ],
    correctAnswer: "a",
  },
  {
    id: 27,
    question: "Excuse me, can you ___________________ me the way to the station, please?",
    options: [
      { label: "a", text: "give" },
      { label: "b", text: "take" },
      { label: "c", text: "tell" },
      { label: "d", text: "say" },
    ],
    correctAnswer: "c",
  },
  {
    id: 28,
    question: "I wasn't interested in the performance very much. ________________.",
    options: [
      { label: "a", text: "I didn't, too." },
      { label: "b", text: "Neither was I." },
      { label: "c", text: "Nor I did." },
      { label: "d", text: "So I wasn't." },
    ],
    correctAnswer: "b",
  },
  {
    id: 29,
    question: "Take a warm coat, _______________ you might get very cold outside.",
    options: [
      { label: "a", text: "otherwise" },
      { label: "b", text: "in case" },
      { label: "c", text: "so that" },
      { label: "d", text: "in order to" },
    ],
    correctAnswer: "a",
  },
  {
    id: 30,
    question: "__________________ this great book and I can't wait to see how it ends.",
    options: [
      { label: "a", text: "I don't read" },
      { label: "b", text: "I've read" },
      { label: "c", text: "I've been reading" },
      { label: "d", text: "I read" },
    ],
    correctAnswer: "c",
  },
  {
    id: 31,
    question: "What I like more than anything else ___________________ at weekends.",
    options: [
      { label: "a", text: "playing golf" },
      { label: "b", text: "to play golf" },
      { label: "c", text: "is playing golf" },
      { label: "d", text: "is play golf" },
    ],
    correctAnswer: "c",
  },
  {
    id: 32,
    question: "She ________________ for her cat for two days when she finally found it in the garage.",
    options: [
      { label: "a", text: "looked" },
      { label: "b", text: "had been looked" },
      { label: "c", text: "had been looking" },
      { label: "d", text: "were looking" },
    ],
    correctAnswer: "c",
  },
  {
    id: 33,
    question: "We won't catch the plane _________________ we leave home now! Please hurry up!",
    options: [
      { label: "a", text: "if" },
      { label: "b", text: "providing that" },
      { label: "c", text: "except" },
      { label: "d", text: "unless" },
    ],
    correctAnswer: "d",
  },
  {
    id: 34,
    question: "If I hadn't replied to your email, I _________________ here with you now.",
    options: [
      { label: "a", text: "can't be" },
      { label: "b", text: "wouldn't be" },
      { label: "c", text: "won't be" },
      { label: "d", text: "haven't been" },
    ],
    correctAnswer: "b",
  },
  {
    id: 35,
    question: "You've been using my mobile phone for a while now. Do you think you ___________________ with it soon? I need to make a call.",
    options: [
      { label: "a", text: "will be finished" },
      { label: "b", text: "have finished" },
      { label: "c", text: "are finishing" },
      { label: "d", text: "finish" },
    ],
    correctAnswer: "a",
  },
  {
    id: 36,
    question: "We talked about many plans yesterday, but I don't remember mentioning __________________ dinner together tonight.",
    options: [
      { label: "a", text: "to have" },
      { label: "b", text: "having" },
      { label: "c", text: "have" },
      { label: "d", text: "having had" },
    ],
    correctAnswer: "b",
  },
  {
    id: 37,
    question: "Was it Captain Cook ______________ New Zealand?",
    options: [
      { label: "a", text: "who discovered" },
      { label: "b", text: "discovered" },
      { label: "c", text: "that discover" },
      { label: "d", text: "who was discovering" },
    ],
    correctAnswer: "a",
  },
  {
    id: 38,
    question: "The sightseeing bus is very old. If we don't fix it this week, repairing it will cost more than replacing it, so we'll ___________ a new one before the tourist season starts.",
    options: [
      { label: "a", text: "will be finished" },
      { label: "b", text: "have finished" },
      { label: "c", text: "are finishing" },
      { label: "d", text: "finish" },
    ],
    correctAnswer: "d",
  },
  {
    id: 39,
    question: "You may not like the cold weather here, but you'll have to ________________, I'm afraid.",
    options: [
      { label: "a", text: "tell it off" },
      { label: "b", text: "sort itself out" },
      { label: "c", text: "put up with it" },
      { label: "d", text: "put it off" },
    ],
    correctAnswer: "c",
  },
  {
    id: 40,
    question: "It's cold so you should __________________ on a warm jacket.",
    options: [
      { label: "a", text: "put" },
      { label: "b", text: "wear" },
      { label: "c", text: "dress" },
      { label: "d", text: "take" },
    ],
    correctAnswer: "b",
  },
];
