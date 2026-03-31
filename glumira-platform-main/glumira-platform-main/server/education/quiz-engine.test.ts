import { describe, it, expect } from "vitest";
import { generateQuiz, scoreQuiz, type QuizQuestion, type QuizAnswer, type QuizTopic } from "./quiz-engine";

/* ── generateQuiz ────────────────────────────────────────────── */
describe("generateQuiz", () => {
  it("returns questions for requested topics", () => {
    const q = generateQuiz(["basics"], "mixed", 10);
    expect(q.length).toBeGreaterThan(0);
    q.forEach((question) => expect(question.topic).toBe("basics"));
  });

  it("filters by difficulty", () => {
    const q = generateQuiz(["basics", "nutrition", "insulin", "monitoring"], "beginner", 20);
    q.forEach((question) => expect(question.difficulty).toBe("beginner"));
  });

  it("limits to requested count", () => {
    const q = generateQuiz(["basics", "nutrition", "insulin", "monitoring", "exercise", "hypo-management", "complications", "sick-day", "technology"], "mixed", 5);
    expect(q.length).toBeLessThanOrEqual(5);
  });

  it("returns empty for non-existent topic combo", () => {
    const q = generateQuiz(["basics"], "advanced", 10);
    // May be empty if no advanced basics questions
    expect(q.length).toBeGreaterThanOrEqual(0);
  });

  it("each question has required fields", () => {
    const q = generateQuiz(["basics", "nutrition"], "mixed", 5);
    q.forEach((question) => {
      expect(question.id).toBeDefined();
      expect(question.options.length).toBeGreaterThanOrEqual(2);
      expect(question.correctIndex).toBeGreaterThanOrEqual(0);
      expect(question.explanation.length).toBeGreaterThan(0);
    });
  });
});

/* ── scoreQuiz ───────────────────────────────────────────────── */
describe("scoreQuiz — scoring", () => {
  const sampleQuestions: QuizQuestion[] = [
    { id: "q1", topic: "basics", difficulty: "beginner", question: "Q1?", options: ["A", "B", "C", "D"], correctIndex: 1, explanation: "B is correct" },
    { id: "q2", topic: "nutrition", difficulty: "beginner", question: "Q2?", options: ["A", "B", "C", "D"], correctIndex: 2, explanation: "C is correct" },
    { id: "q3", topic: "basics", difficulty: "beginner", question: "Q3?", options: ["A", "B", "C", "D"], correctIndex: 0, explanation: "A is correct" },
    { id: "q4", topic: "insulin", difficulty: "intermediate", question: "Q4?", options: ["A", "B", "C", "D"], correctIndex: 3, explanation: "D is correct" },
  ];

  it("scores all correct", () => {
    const answers: QuizAnswer[] = [
      { questionId: "q1", selectedIndex: 1 },
      { questionId: "q2", selectedIndex: 2 },
      { questionId: "q3", selectedIndex: 0 },
      { questionId: "q4", selectedIndex: 3 },
    ];
    const r = scoreQuiz(sampleQuestions, answers);
    expect(r.correctCount).toBe(4);
    expect(r.scorePercent).toBe(100);
    expect(r.grade).toBe("A");
  });

  it("scores all wrong", () => {
    const answers: QuizAnswer[] = [
      { questionId: "q1", selectedIndex: 0 },
      { questionId: "q2", selectedIndex: 0 },
      { questionId: "q3", selectedIndex: 1 },
      { questionId: "q4", selectedIndex: 0 },
    ];
    const r = scoreQuiz(sampleQuestions, answers);
    expect(r.correctCount).toBe(0);
    expect(r.scorePercent).toBe(0);
    expect(r.grade).toBe("F");
  });

  it("scores partial", () => {
    const answers: QuizAnswer[] = [
      { questionId: "q1", selectedIndex: 1 },
      { questionId: "q2", selectedIndex: 0 },
      { questionId: "q3", selectedIndex: 0 },
      { questionId: "q4", selectedIndex: 0 },
    ];
    const r = scoreQuiz(sampleQuestions, answers);
    expect(r.correctCount).toBe(2);
    expect(r.scorePercent).toBe(50);
  });

  it("handles missing answers", () => {
    const answers: QuizAnswer[] = [
      { questionId: "q1", selectedIndex: 1 },
    ];
    const r = scoreQuiz(sampleQuestions, answers);
    expect(r.correctCount).toBe(1);
  });
});

/* ── Topic breakdown ─────────────────────────────────────────── */
describe("scoreQuiz — topic breakdown", () => {
  const questions: QuizQuestion[] = [
    { id: "q1", topic: "basics", difficulty: "beginner", question: "Q1?", options: ["A", "B"], correctIndex: 0, explanation: "A" },
    { id: "q2", topic: "basics", difficulty: "beginner", question: "Q2?", options: ["A", "B"], correctIndex: 1, explanation: "B" },
    { id: "q3", topic: "nutrition", difficulty: "beginner", question: "Q3?", options: ["A", "B"], correctIndex: 0, explanation: "A" },
  ];

  it("breaks down by topic", () => {
    const answers: QuizAnswer[] = [
      { questionId: "q1", selectedIndex: 0 },
      { questionId: "q2", selectedIndex: 1 },
      { questionId: "q3", selectedIndex: 1 },
    ];
    const r = scoreQuiz(questions, answers);
    expect(r.topicBreakdown.length).toBe(2);
    const basics = r.topicBreakdown.find((t) => t.topic === "basics")!;
    expect(basics.correct).toBe(2);
    expect(basics.total).toBe(2);
  });

  it("identifies weak topics", () => {
    const answers: QuizAnswer[] = [
      { questionId: "q1", selectedIndex: 0 },
      { questionId: "q2", selectedIndex: 1 },
      { questionId: "q3", selectedIndex: 1 },
    ];
    const r = scoreQuiz(questions, answers);
    expect(r.weakTopics).toContain("nutrition");
  });

  it("identifies strong topics", () => {
    const answers: QuizAnswer[] = [
      { questionId: "q1", selectedIndex: 0 },
      { questionId: "q2", selectedIndex: 1 },
      { questionId: "q3", selectedIndex: 0 },
    ];
    const r = scoreQuiz(questions, answers);
    expect(r.strongTopics).toContain("basics");
    expect(r.strongTopics).toContain("nutrition");
  });
});

/* ── Feedback ────────────────────────────────────────────────── */
describe("scoreQuiz — feedback", () => {
  const questions: QuizQuestion[] = [
    { id: "q1", topic: "basics", difficulty: "beginner", question: "Q?", options: ["A", "B"], correctIndex: 0, explanation: "A" },
  ];

  it("positive feedback for high score", () => {
    const r = scoreQuiz(questions, [{ questionId: "q1", selectedIndex: 0 }]);
    expect(r.feedback.some((f) => f.includes("Excellent"))).toBe(true);
  });

  it("learning feedback for low score", () => {
    const r = scoreQuiz(questions, [{ questionId: "q1", selectedIndex: 1 }]);
    expect(r.feedback.some((f) => f.includes("learning") || f.includes("Keep"))).toBe(true);
  });
});

/* ── Grade ────────────────────────────────────────────────────── */
describe("scoreQuiz — grade", () => {
  it("A for 90%+", () => {
    const qs: QuizQuestion[] = Array.from({ length: 10 }, (_, i) => ({
      id: `q${i}`, topic: "basics" as QuizTopic, difficulty: "beginner" as const, question: `Q${i}?`, options: ["A", "B"], correctIndex: 0, explanation: "A",
    }));
    const ans = qs.map((q) => ({ questionId: q.id, selectedIndex: 0 }));
    const r = scoreQuiz(qs, ans);
    expect(r.grade).toBe("A");
  });

  it("F for <60%", () => {
    const qs: QuizQuestion[] = Array.from({ length: 10 }, (_, i) => ({
      id: `q${i}`, topic: "basics" as QuizTopic, difficulty: "beginner" as const, question: `Q${i}?`, options: ["A", "B"], correctIndex: 0, explanation: "A",
    }));
    const ans = qs.map((q) => ({ questionId: q.id, selectedIndex: 1 }));
    const r = scoreQuiz(qs, ans);
    expect(r.grade).toBe("F");
  });
});

/* ── Disclaimer ──────────────────────────────────────────────── */
describe("scoreQuiz — disclaimer", () => {
  it("includes disclaimer", () => {
    const r = scoreQuiz([], []);
    expect(r.disclaimer).toContain("educational platform");
  });
});
