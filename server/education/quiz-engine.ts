/**
 * GluMira™ — Diabetes Education Quiz Engine Module
 *
 * Generates adaptive quizzes on diabetes topics, scores responses,
 * tracks knowledge gaps, and provides educational feedback.
 *
 * Clinical relevance:
 * - Patient education improves self-management and outcomes
 * - Identifying knowledge gaps enables targeted learning
 * - Gamification increases engagement
 *
 * NOT a medical device. Educational purposes only.
 */

export type QuizTopic =
  | "basics" | "nutrition" | "insulin" | "monitoring" | "exercise"
  | "complications" | "sick-day" | "hypo-management" | "hyper-management"
  | "technology";

export interface QuizQuestion {
  id: string;
  topic: QuizTopic;
  difficulty: "beginner" | "intermediate" | "advanced";
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface QuizAnswer {
  questionId: string;
  selectedIndex: number;
}

export interface QuestionResult {
  questionId: string;
  correct: boolean;
  selectedAnswer: string;
  correctAnswer: string;
  explanation: string;
  topic: QuizTopic;
}

export interface QuizResult {
  totalQuestions: number;
  correctCount: number;
  scorePercent: number;
  grade: "A" | "B" | "C" | "D" | "F";
  topicBreakdown: { topic: QuizTopic; correct: number; total: number; percent: number }[];
  weakTopics: QuizTopic[];
  strongTopics: QuizTopic[];
  questionResults: QuestionResult[];
  feedback: string[];
  nextSteps: string[];
  disclaimer: string;
}

/* ── Question bank ───────────────────────────────────────────── */

const QUESTION_BANK: QuizQuestion[] = [
  // Basics
  { id: "b1", topic: "basics", difficulty: "beginner", question: "What does insulin do?", options: ["Raises blood sugar", "Lowers blood sugar", "Has no effect on blood sugar", "Only works during sleep"], correctIndex: 1, explanation: "Insulin is a hormone that allows glucose to enter cells, lowering blood sugar levels." },
  { id: "b2", topic: "basics", difficulty: "beginner", question: "What is HbA1c?", options: ["A type of insulin", "A glucose meter", "A measure of average blood sugar over 2-3 months", "A type of carbohydrate"], correctIndex: 2, explanation: "HbA1c reflects your average blood sugar over the past 2-3 months." },
  { id: "b3", topic: "basics", difficulty: "intermediate", question: "What is the normal fasting blood glucose range?", options: ["2.0-3.5 mmol/L", "3.9-5.5 mmol/L", "7.0-10.0 mmol/L", "12.0-15.0 mmol/L"], correctIndex: 1, explanation: "Normal fasting glucose is typically 3.9-5.5 mmol/L (70-100 mg/dL)." },
  // Nutrition
  { id: "n1", topic: "nutrition", difficulty: "beginner", question: "Which macronutrient has the biggest impact on blood sugar?", options: ["Protein", "Fat", "Carbohydrates", "Vitamins"], correctIndex: 2, explanation: "Carbohydrates are broken down into glucose and have the most direct impact on blood sugar." },
  { id: "n2", topic: "nutrition", difficulty: "intermediate", question: "What is the glycemic index?", options: ["A measure of calorie content", "A ranking of how quickly foods raise blood sugar", "The amount of sugar in food", "A measure of food freshness"], correctIndex: 1, explanation: "The glycemic index ranks foods by how quickly they raise blood sugar compared to pure glucose." },
  { id: "n3", topic: "nutrition", difficulty: "advanced", question: "How does fiber affect blood sugar?", options: ["Raises it quickly", "Has no effect", "Slows glucose absorption", "Doubles glucose absorption"], correctIndex: 2, explanation: "Fiber slows the absorption of glucose, leading to a more gradual rise in blood sugar." },
  // Insulin
  { id: "i1", topic: "insulin", difficulty: "beginner", question: "What is basal insulin?", options: ["Fast-acting insulin taken with meals", "Long-acting insulin that provides background coverage", "Insulin only used in emergencies", "Insulin that only works at night"], correctIndex: 1, explanation: "Basal insulin provides a steady level of insulin throughout the day and night." },
  { id: "i2", topic: "insulin", difficulty: "intermediate", question: "What is insulin stacking?", options: ["Taking insulin with food", "Taking correction doses too close together", "Storing insulin in a stack", "Using multiple insulin types"], correctIndex: 1, explanation: "Insulin stacking occurs when correction doses are given before previous doses have fully acted, risking hypoglycemia." },
  { id: "i3", topic: "insulin", difficulty: "advanced", question: "What is the 1800 rule used for?", options: ["Calculating basal dose", "Estimating insulin sensitivity factor for rapid-acting insulin", "Determining carb intake", "Setting alarm times"], correctIndex: 1, explanation: "The 1800 rule estimates ISF: divide 1800 by your TDD to find how much 1 unit of rapid insulin lowers glucose (in mg/dL)." },
  // Monitoring
  { id: "m1", topic: "monitoring", difficulty: "beginner", question: "What does CGM stand for?", options: ["Continuous Glucose Monitoring", "Carb Gram Measurement", "Clinical Glucose Management", "Constant Glucose Meter"], correctIndex: 0, explanation: "CGM stands for Continuous Glucose Monitoring — a sensor that tracks glucose levels throughout the day." },
  { id: "m2", topic: "monitoring", difficulty: "intermediate", question: "What is Time in Range (TIR)?", options: ["Time spent sleeping", "Percentage of time glucose is between 3.9-10.0 mmol/L", "Duration of exercise", "Time between meals"], correctIndex: 1, explanation: "TIR measures the percentage of time your glucose stays within the target range of 3.9-10.0 mmol/L." },
  // Exercise
  { id: "e1", topic: "exercise", difficulty: "beginner", question: "How does exercise typically affect blood sugar?", options: ["Always raises it", "Usually lowers it", "Has no effect", "Only affects it during sleep"], correctIndex: 1, explanation: "Exercise typically lowers blood sugar by increasing glucose uptake by muscles." },
  { id: "e2", topic: "exercise", difficulty: "intermediate", question: "Why might blood sugar rise during intense exercise?", options: ["Muscles stop working", "Stress hormones release glucose from the liver", "Exercise has no effect", "Insulin increases"], correctIndex: 1, explanation: "Intense exercise triggers stress hormones (adrenaline, cortisol) that cause the liver to release glucose." },
  // Hypo management
  { id: "h1", topic: "hypo-management", difficulty: "beginner", question: "What is the rule of 15 for treating hypoglycemia?", options: ["Take 15 units of insulin", "Eat 15g fast carbs, wait 15 min, recheck", "Wait 15 hours before eating", "Drink 15 glasses of water"], correctIndex: 1, explanation: "The rule of 15: eat 15g of fast-acting carbs, wait 15 minutes, then recheck blood sugar." },
  { id: "h2", topic: "hypo-management", difficulty: "intermediate", question: "At what glucose level is hypoglycemia defined?", options: ["Below 7.0 mmol/L", "Below 5.5 mmol/L", "Below 4.0 mmol/L", "Below 10.0 mmol/L"], correctIndex: 2, explanation: "Hypoglycemia is generally defined as blood glucose below 4.0 mmol/L (70 mg/dL)." },
  // Complications
  { id: "c1", topic: "complications", difficulty: "intermediate", question: "Which complication is most associated with sustained high blood sugar?", options: ["Broken bones", "Retinopathy (eye damage)", "Hair loss", "Muscle gain"], correctIndex: 1, explanation: "Diabetic retinopathy is damage to the blood vessels in the retina caused by sustained high blood sugar." },
  // Sick day
  { id: "s1", topic: "sick-day", difficulty: "intermediate", question: "Should you stop taking insulin when sick?", options: ["Yes, always stop", "No, never take insulin when sick", "No, you usually need the same or more insulin", "Only stop basal insulin"], correctIndex: 2, explanation: "During illness, blood sugar often rises due to stress hormones. You typically need the same or more insulin." },
  // Technology
  { id: "t1", topic: "technology", difficulty: "beginner", question: "What is a closed-loop insulin pump system?", options: ["A pump that only delivers basal", "A system that automatically adjusts insulin based on CGM readings", "A pump that requires manual boluses only", "A glucose meter"], correctIndex: 1, explanation: "A closed-loop system (hybrid or full) automatically adjusts insulin delivery based on real-time CGM glucose readings." },
];

/* ── Generate quiz ───────────────────────────────────────────── */

export function generateQuiz(
  topics: QuizTopic[],
  difficulty: "beginner" | "intermediate" | "advanced" | "mixed",
  count: number
): QuizQuestion[] {
  let pool = QUESTION_BANK.filter((q) => topics.includes(q.topic));
  if (difficulty !== "mixed") {
    pool = pool.filter((q) => q.difficulty === difficulty);
  }
  // Shuffle and take count
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/* ── Score quiz ──────────────────────────────────────────────── */

export function scoreQuiz(questions: QuizQuestion[], answers: QuizAnswer[]): QuizResult {
  const answerMap = new Map(answers.map((a) => [a.questionId, a.selectedIndex]));

  const questionResults: QuestionResult[] = questions.map((q) => {
    const selected = answerMap.get(q.id) ?? -1;
    const correct = selected === q.correctIndex;
    return {
      questionId: q.id,
      correct,
      selectedAnswer: selected >= 0 ? q.options[selected] : "No answer",
      correctAnswer: q.options[q.correctIndex],
      explanation: q.explanation,
      topic: q.topic,
    };
  });

  const correctCount = questionResults.filter((r) => r.correct).length;
  const totalQuestions = questions.length;
  const scorePercent = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  // Grade
  let grade: QuizResult["grade"];
  if (scorePercent >= 90) grade = "A";
  else if (scorePercent >= 80) grade = "B";
  else if (scorePercent >= 70) grade = "C";
  else if (scorePercent >= 60) grade = "D";
  else grade = "F";

  // Topic breakdown
  const topicMap = new Map<QuizTopic, { correct: number; total: number }>();
  questionResults.forEach((r) => {
    if (!topicMap.has(r.topic)) topicMap.set(r.topic, { correct: 0, total: 0 });
    const entry = topicMap.get(r.topic)!;
    entry.total++;
    if (r.correct) entry.correct++;
  });

  const topicBreakdown = Array.from(topicMap.entries()).map(([topic, data]) => ({
    topic,
    correct: data.correct,
    total: data.total,
    percent: Math.round((data.correct / data.total) * 100),
  }));

  const weakTopics = topicBreakdown.filter((t) => t.percent < 50).map((t) => t.topic);
  const strongTopics = topicBreakdown.filter((t) => t.percent >= 80).map((t) => t.topic);

  // Feedback
  const feedback: string[] = [];
  if (scorePercent >= 90) feedback.push("Excellent! You have a strong understanding of diabetes management.");
  else if (scorePercent >= 70) feedback.push("Good job! You have a solid foundation but some areas could use review.");
  else if (scorePercent >= 50) feedback.push("Fair effort. Review the explanations for questions you missed.");
  else feedback.push("Keep learning! Review the educational materials and try again.");

  if (weakTopics.length > 0) {
    feedback.push(`Focus on improving: ${weakTopics.join(", ")}.`);
  }

  // Next steps
  const nextSteps: string[] = [];
  if (weakTopics.length > 0) {
    nextSteps.push(`Review educational content on: ${weakTopics.join(", ")}.`);
    nextSteps.push("Retake the quiz after studying to track your progress.");
  }
  if (strongTopics.length > 0) {
    nextSteps.push(`Great knowledge in: ${strongTopics.join(", ")}. Try advanced questions next.`);
  }
  nextSteps.push("Discuss any questions with your diabetes care team.");

  return {
    totalQuestions,
    correctCount,
    scorePercent,
    grade,
    topicBreakdown,
    weakTopics,
    strongTopics,
    questionResults,
    feedback,
    nextSteps,
    disclaimer:
      "GluMira™ is an informational and educational tool only. It is NOT a medical device. " +
      "Quiz content is for learning purposes and should not replace professional medical advice.",
  };
}
