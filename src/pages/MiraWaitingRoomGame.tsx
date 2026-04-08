/**
 * GluMira™ V7 — Block 66: Mira Waiting Room Game
 * Interactive educational games for children waiting at clinic.
 * Scandinavian Minimalist design — mobile first
 */
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";

/* ─── Style tokens ───────────────────────────────────────────────────────── */

const page: React.CSSProperties = {
  minHeight: "100vh",
  maxWidth: 640,
  margin: "0 auto",
  padding: "clamp(16px, 4vw, 32px)",
  background: "var(--bg-primary)",
  color: "var(--text-primary)",
  fontFamily: "'DM Sans', sans-serif",
};

const card: React.CSSProperties = {
  background: "var(--bg-card)",
  border: "1px solid var(--border-light)",
  borderRadius: 12,
  padding: 20,
  marginBottom: 16,
};

const heading: React.CSSProperties = {
  fontFamily: "'Playfair Display', serif",
  fontSize: "1.4rem",
  fontWeight: 700,
  marginBottom: 8,
};

const subheading: React.CSSProperties = {
  fontFamily: "'Playfair Display', serif",
  fontSize: "1.1rem",
  fontWeight: 600,
  marginBottom: 12,
};

const label: React.CSSProperties = {
  fontSize: "0.82rem",
  color: "var(--text-secondary)",
  marginBottom: 4,
  display: "block",
};

const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
};

const btnPrimary: React.CSSProperties = {
  background: "var(--accent-teal)",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "10px 20px",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: "0.95rem",
};

const btnOutline: React.CSSProperties = {
  background: "transparent",
  color: "var(--accent-teal)",
  border: "2px solid var(--accent-teal)",
  borderRadius: 8,
  padding: "10px 20px",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: "0.95rem",
};

/* ─── Game data ──────────────────────────────────────────────────────────── */

type GameType = "selector" | "insulin" | "glucose" | "carb";

interface InsulinPair {
  name: string;
  description: string;
}

const INSULIN_PAIRS: InsulinPair[] = [
  { name: "Rapid-acting (Novorapid)", description: "Starts working in 10-15 minutes, peaks at 1-2 hours" },
  { name: "Short-acting (Actrapid)", description: "Starts working in 30 minutes, peaks at 2-4 hours" },
  { name: "Intermediate (NPH)", description: "Starts working in 1-2 hours, peaks at 4-8 hours" },
  { name: "Long-acting (Lantus)", description: "Provides steady background insulin for up to 24 hours" },
  { name: "Ultra-long (Tresiba)", description: "Lasts over 42 hours with a very flat profile" },
];

interface GlucoseQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

const GLUCOSE_QUESTIONS: GlucoseQuestion[] = [
  {
    question: "What happens to glucose when you eat a banana?",
    options: ["Goes up", "Goes down", "Stays the same"],
    correct: 0,
    explanation: "Bananas contain carbohydrates which are broken down into glucose, raising your blood sugar.",
  },
  {
    question: "What does insulin do?",
    options: ["Helps glucose enter cells", "Makes you hungry", "Gives you energy directly"],
    correct: 0,
    explanation: "Insulin acts like a key, unlocking cells so glucose can enter and be used for energy.",
  },
  {
    question: "What happens to glucose when you go for a run?",
    options: ["Goes up", "Goes down", "Stays the same"],
    correct: 1,
    explanation: "Exercise helps muscles use glucose for energy, which usually lowers blood sugar.",
  },
  {
    question: "What is a hypo (hypoglycaemia)?",
    options: ["Blood sugar too high", "Blood sugar too low", "Normal blood sugar"],
    correct: 1,
    explanation: "A hypo means your blood sugar has dropped below the safe range, usually under 4 mmol/L.",
  },
  {
    question: "Which food raises glucose the fastest?",
    options: ["Grilled chicken", "White bread", "Cheese"],
    correct: 1,
    explanation: "White bread is a fast-acting carbohydrate that quickly raises blood glucose.",
  },
  {
    question: "What should you do if you feel shaky and sweaty?",
    options: ["Take more insulin", "Eat fast-acting sugar", "Go to sleep"],
    correct: 1,
    explanation: "Shaky and sweaty feelings are signs of a hypo. Eat fast-acting sugar like juice or glucose tablets.",
  },
  {
    question: "How does stress affect glucose?",
    options: ["Usually raises it", "Usually lowers it", "Has no effect"],
    correct: 0,
    explanation: "Stress hormones like cortisol and adrenaline cause the liver to release extra glucose.",
  },
  {
    question: "What is an A1C test?",
    options: ["A test of insulin levels", "An average blood sugar over 2-3 months", "A test for ketones"],
    correct: 1,
    explanation: "A1C (HbA1c) measures the average blood glucose over the past 2-3 months using red blood cells.",
  },
  {
    question: "What are ketones?",
    options: ["A type of insulin", "Chemicals produced when the body burns fat for energy", "A type of sugar"],
    correct: 1,
    explanation: "When the body can't use glucose (not enough insulin), it burns fat and produces ketones, which can be dangerous.",
  },
  {
    question: "What is the dawn phenomenon?",
    options: ["Glucose drops at sunrise", "Glucose rises in early morning hours", "Glucose stays flat overnight"],
    correct: 1,
    explanation: "Hormones released in the early morning can cause blood sugar to rise, even without eating.",
  },
];

interface CarbFood {
  name: string;
  description: string;
  carbs: number;
}

const CARB_FOODS: CarbFood[] = [
  { name: "Apple (medium)", description: "A fresh medium-sized apple", carbs: 15 },
  { name: "Slice of bread", description: "One slice of white or wholemeal bread", carbs: 15 },
  { name: "Banana (medium)", description: "A ripe medium banana", carbs: 25 },
  { name: "Glass of milk", description: "250 ml of full-fat milk", carbs: 12 },
  { name: "Cup of rice", description: "One cup of cooked white rice", carbs: 45 },
  { name: "Orange juice", description: "200 ml glass of orange juice", carbs: 20 },
  { name: "Potato (medium)", description: "One medium baked potato", carbs: 30 },
  { name: "Pasta (1 cup)", description: "One cup of cooked spaghetti", carbs: 40 },
  { name: "Chocolate bar", description: "A small milk chocolate bar (40 g)", carbs: 25 },
  { name: "Yoghurt (plain)", description: "150 g tub of plain yoghurt", carbs: 8 },
];

/* ─── Local storage helpers ──────────────────────────────────────────────── */

interface Scores {
  insulin: number;
  glucose: number;
  carb: number;
}

const STORAGE_KEY = "glumira_waiting_room_scores";

function loadScores(): Scores {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Scores;
  } catch { /* ignore */ }
  return { insulin: 0, glucose: 0, carb: 0 };
}

function saveScore(game: keyof Scores, score: number) {
  const existing = loadScores();
  if (score > existing[game]) {
    existing[game] = score;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  }
}

/* ─── Mira speech bubble ─────────────────────────────────────────────────── */

function MiraBubble({ message }: { message: string }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 16,
        left: "50%",
        transform: "translateX(-50%)",
        maxWidth: 400,
        width: "calc(100% - 32px)",
        background: "var(--bg-card)",
        border: "2px solid var(--accent-teal)",
        borderRadius: 16,
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        zIndex: 50,
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: "var(--accent-teal)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontWeight: 700,
          fontSize: "0.85rem",
          flexShrink: 0,
        }}
      >
        M
      </div>
      <span style={{ fontSize: "0.88rem", color: "var(--text-primary)" }}>{message}</span>
    </div>
  );
}

/* ─── Insulin Explorer game ──────────────────────────────────────────────── */

function InsulinExplorerGame({ onBack }: { onBack: () => void }) {
  const [selectedName, setSelectedName] = useState<number | null>(null);
  const [matches, setMatches] = useState<Record<number, number>>({});
  const [wrongFlash, setWrongFlash] = useState<number | null>(null);
  const [correctFlash, setCorrectFlash] = useState<number | null>(null);
  const [miraMsg, setMiraMsg] = useState("Match each insulin to its description!");
  const [finished, setFinished] = useState(false);

  // Shuffled descriptions
  const [descOrder] = useState(() => {
    const arr = INSULIN_PAIRS.map((_, i) => i);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  });

  const matchedDescs = new Set(Object.values(matches));

  const handleDescClick = (descIdx: number) => {
    if (selectedName === null || matchedDescs.has(descIdx)) return;
    const actualNameIdx = descOrder[descIdx];
    if (actualNameIdx === selectedName) {
      // Correct
      const newMatches = { ...matches, [selectedName]: descIdx };
      setMatches(newMatches);
      setCorrectFlash(descIdx);
      setSelectedName(null);
      setTimeout(() => setCorrectFlash(null), 600);
      const count = Object.keys(newMatches).length;
      if (count === 5) {
        setMiraMsg(`Amazing! You matched all 5! Score: 5/5`);
        saveScore("insulin", 5);
        setFinished(true);
      } else {
        setMiraMsg("Great job! Keep going!");
      }
    } else {
      // Wrong
      setWrongFlash(descIdx);
      setMiraMsg("Not quite — try again!");
      setTimeout(() => setWrongFlash(null), 600);
    }
  };

  const score = Object.keys(matches).length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={subheading}>Insulin Explorer</h2>
        <span style={{ ...mono, fontSize: "0.9rem", color: "var(--accent-teal)" }}>
          {score}/5
        </span>
      </div>
      <p style={{ ...label, marginBottom: 16 }}>Tap an insulin name, then tap its matching description.</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {/* Names column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {INSULIN_PAIRS.map((pair, i) => {
            const isMatched = i in matches;
            return (
              <button
                key={i}
                onClick={() => !isMatched && setSelectedName(i)}
                style={{
                  ...card,
                  padding: 12,
                  marginBottom: 0,
                  cursor: isMatched ? "default" : "pointer",
                  opacity: isMatched ? 0.5 : 1,
                  border: selectedName === i
                    ? "2px solid var(--accent-teal)"
                    : "1px solid var(--border-light)",
                  textAlign: "left",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                }}
              >
                {pair.name}
              </button>
            );
          })}
        </div>

        {/* Descriptions column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {descOrder.map((origIdx, displayIdx) => {
            const isMatched = matchedDescs.has(displayIdx);
            const isCorrectFlash = correctFlash === displayIdx;
            const isWrongFlash = wrongFlash === displayIdx;
            let bg = "var(--bg-card)";
            if (isCorrectFlash) bg = "#d1fae5";
            if (isWrongFlash) bg = "#fef3c7";

            return (
              <button
                key={displayIdx}
                onClick={() => handleDescClick(displayIdx)}
                style={{
                  ...card,
                  padding: 12,
                  marginBottom: 0,
                  cursor: isMatched ? "default" : "pointer",
                  opacity: isMatched ? 0.5 : 1,
                  background: bg,
                  textAlign: "left",
                  fontSize: "0.78rem",
                  transition: "background 0.3s ease",
                }}
              >
                {INSULIN_PAIRS[origIdx].description}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
        <button style={btnOutline} onClick={onBack}>Back to Games</button>
        {finished && (
          <button
            style={btnPrimary}
            onClick={() => {
              setMatches({});
              setSelectedName(null);
              setFinished(false);
              setMiraMsg("Match each insulin to its description!");
            }}
          >
            Play Again
          </button>
        )}
      </div>

      <MiraBubble message={miraMsg} />
    </div>
  );
}

/* ─── Glucose Detective game ─────────────────────────────────────────────── */

function GlucoseDetectiveGame({ onBack }: { onBack: () => void }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<number | null>(null);
  const [miraMsg, setMiraMsg] = useState("Let's test your glucose knowledge!");
  const [finished, setFinished] = useState(false);

  const q = GLUCOSE_QUESTIONS[currentQ];

  const handleAnswer = (idx: number) => {
    if (answered !== null) return;
    setAnswered(idx);
    const correct = idx === q.correct;
    const newScore = correct ? score + 1 : score;
    if (correct) {
      setScore(newScore);
      setMiraMsg("Correct! " + q.explanation);
    } else {
      setMiraMsg("Not quite. " + q.explanation);
    }
  };

  const handleNext = () => {
    if (currentQ < 9) {
      setCurrentQ(currentQ + 1);
      setAnswered(null);
      setMiraMsg("Next question!");
    } else {
      const finalScore = score;
      saveScore("glucose", finalScore);
      setMiraMsg(`Quiz complete! You scored ${finalScore}/10!`);
      setFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentQ(0);
    setScore(0);
    setAnswered(null);
    setFinished(false);
    setMiraMsg("Let's test your glucose knowledge!");
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={subheading}>Glucose Detective</h2>
        <span style={{ ...mono, fontSize: "0.9rem", color: "var(--accent-teal)" }}>
          {score}/{currentQ + (answered !== null ? 1 : 0)}
        </span>
      </div>

      {!finished ? (
        <div style={card}>
          <p style={{ ...label, marginBottom: 4 }}>Question {currentQ + 1} of 10</p>
          <p style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 16 }}>{q.question}</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {q.options.map((opt, i) => {
              let bg = "var(--bg-card)";
              let borderCol = "var(--border-light)";
              if (answered !== null) {
                if (i === q.correct) { bg = "#d1fae5"; borderCol = "#34d399"; }
                else if (i === answered && i !== q.correct) { bg = "#fef3c7"; borderCol = "#fbbf24"; }
              }
              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  style={{
                    background: bg,
                    border: `2px solid ${borderCol}`,
                    borderRadius: 8,
                    padding: "10px 14px",
                    textAlign: "left",
                    cursor: answered !== null ? "default" : "pointer",
                    fontSize: "0.92rem",
                    transition: "background 0.3s ease",
                  }}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {answered !== null && (
            <div style={{ marginTop: 16, padding: 12, background: "#f0f9ff", borderRadius: 8, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              {q.explanation}
            </div>
          )}

          {answered !== null && (
            <button style={{ ...btnPrimary, marginTop: 12, width: "100%" }} onClick={handleNext}>
              {currentQ < 9 ? "Next Question" : "See Results"}
            </button>
          )}
        </div>
      ) : (
        <div style={card}>
          <p style={{ ...heading, textAlign: "center" }}>Quiz Complete!</p>
          <p style={{ ...mono, textAlign: "center", fontSize: "2rem", color: "var(--accent-teal)", margin: "16px 0" }}>
            {score}/10
          </p>
          <p style={{ textAlign: "center", color: "var(--text-secondary)", marginBottom: 16, fontSize: "0.9rem" }}>
            {score >= 8 ? "Outstanding! You really know your stuff!" :
             score >= 5 ? "Good effort! Keep learning!" :
             "Keep practising — you'll get there!"}
          </p>
          <button style={{ ...btnPrimary, width: "100%" }} onClick={handleRestart}>
            Play Again
          </button>
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <button style={btnOutline} onClick={onBack}>Back to Games</button>
      </div>

      <MiraBubble message={miraMsg} />
    </div>
  );
}

/* ─── Carb Counter Challenge ─────────────────────────────────────────────── */

function CarbCounterGame({ onBack }: { onBack: () => void }) {
  const [round, setRound] = useState(0);
  const [guess, setGuess] = useState(25);
  const [submitted, setSubmitted] = useState(false);
  const [totalDiff, setTotalDiff] = useState(0);
  const [miraMsg, setMiraMsg] = useState("Guess how many carbs are in each food!");
  const [finished, setFinished] = useState(false);
  const [roundScores, setRoundScores] = useState<number[]>([]);

  const food = CARB_FOODS[round];

  const handleSubmit = () => {
    if (submitted) return;
    setSubmitted(true);
    const diff = Math.abs(guess - food.carbs);
    const newTotal = totalDiff + diff;
    setTotalDiff(newTotal);
    const points = diff <= 3 ? 10 : diff <= 5 ? 8 : diff <= 10 ? 5 : diff <= 20 ? 2 : 0;
    setRoundScores([...roundScores, points]);
    if (diff <= 3) setMiraMsg(`Spot on! Only ${diff}g off!`);
    else if (diff <= 10) setMiraMsg(`Close! You were ${diff}g off.`);
    else setMiraMsg(`The actual value is ${food.carbs}g. You were ${diff}g off.`);
  };

  const handleNext = () => {
    if (round < 9) {
      setRound(round + 1);
      setGuess(25);
      setSubmitted(false);
      setMiraMsg("Guess how many carbs are in each food!");
    } else {
      const finalScore = roundScores.reduce((a, b) => a + b, 0);
      saveScore("carb", finalScore);
      setMiraMsg(`Challenge complete! Score: ${finalScore}/100`);
      setFinished(true);
    }
  };

  const handleRestart = () => {
    setRound(0);
    setGuess(25);
    setSubmitted(false);
    setTotalDiff(0);
    setRoundScores([]);
    setFinished(false);
    setMiraMsg("Guess how many carbs are in each food!");
  };

  const currentTotal = roundScores.reduce((a, b) => a + b, 0);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={subheading}>Carb Counter Challenge</h2>
        <span style={{ ...mono, fontSize: "0.9rem", color: "var(--accent-teal)" }}>
          {currentTotal} pts
        </span>
      </div>

      {!finished ? (
        <div style={card}>
          <p style={{ ...label, marginBottom: 4 }}>Round {round + 1} of 10</p>
          <p style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 4 }}>{food.name}</p>
          <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", marginBottom: 20 }}>{food.description}</p>

          <label style={label}>Your guess: <strong style={mono}>{guess}g</strong></label>
          <input
            type="range"
            min={0}
            max={100}
            value={guess}
            onChange={(e) => !submitted && setGuess(Number(e.target.value))}
            style={{ width: "100%", accentColor: "var(--accent-teal)" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-faint)" }}>
            <span>0g</span>
            <span>50g</span>
            <span>100g</span>
          </div>

          {submitted && (
            <div style={{ marginTop: 16, padding: 12, background: "#f0f9ff", borderRadius: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.88rem" }}>
                  Actual: <strong style={mono}>{food.carbs}g</strong>
                </span>
                <span style={{ fontSize: "0.88rem" }}>
                  Your guess: <strong style={mono}>{guess}g</strong>
                </span>
              </div>
              <div style={{ marginTop: 8, fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                Difference: {Math.abs(guess - food.carbs)}g
              </div>
            </div>
          )}

          {!submitted ? (
            <button style={{ ...btnPrimary, marginTop: 16, width: "100%" }} onClick={handleSubmit}>
              Lock In Guess
            </button>
          ) : (
            <button style={{ ...btnPrimary, marginTop: 12, width: "100%" }} onClick={handleNext}>
              {round < 9 ? "Next Food" : "See Results"}
            </button>
          )}
        </div>
      ) : (
        <div style={card}>
          <p style={{ ...heading, textAlign: "center" }}>Challenge Complete!</p>
          <p style={{ ...mono, textAlign: "center", fontSize: "2rem", color: "var(--accent-teal)", margin: "16px 0" }}>
            {currentTotal}/100
          </p>
          <p style={{ textAlign: "center", color: "var(--text-secondary)", marginBottom: 4, fontSize: "0.85rem" }}>
            Average difference: {(totalDiff / 10).toFixed(1)}g per food
          </p>
          <p style={{ textAlign: "center", color: "var(--text-secondary)", marginBottom: 16, fontSize: "0.9rem" }}>
            {currentTotal >= 80 ? "You're a carb counting expert!" :
             currentTotal >= 50 ? "Good knowledge! Keep practising!" :
             "Keep learning about carbs — you'll improve!"}
          </p>
          <button style={{ ...btnPrimary, width: "100%" }} onClick={handleRestart}>
            Play Again
          </button>
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <button style={btnOutline} onClick={onBack}>Back to Games</button>
      </div>

      <MiraBubble message={miraMsg} />
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────── */

export default function MiraWaitingRoomGame() {
  const [game, setGame] = useState<GameType>("selector");
  const [scores, setScores] = useState<Scores>(loadScores);

  useEffect(() => {
    setScores(loadScores());
  }, [game]);

  const goBack = useCallback(() => setGame("selector"), []);

  if (game === "insulin") return <div style={page}><InsulinExplorerGame onBack={goBack} /></div>;
  if (game === "glucose") return <div style={page}><GlucoseDetectiveGame onBack={goBack} /></div>;
  if (game === "carb") return <div style={page}><CarbCounterGame onBack={goBack} /></div>;

  return (
    <div style={page}>
      {/* Header */}
      <header style={{ marginBottom: 24 }}>
        <Link
          to="/"
          style={{ fontSize: "0.85rem", color: "var(--text-secondary)", textDecoration: "none" }}
        >
          &larr; Back
        </Link>
        <h1 style={{ ...heading, fontSize: "1.6rem", marginTop: 8 }}>Mira's Waiting Room</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
          Play fun games while you wait and learn about diabetes!
        </p>
      </header>

      {/* Game cards */}
      <div
        role="button"
        tabIndex={0}
        style={{ ...card, cursor: "pointer" }}
        onClick={() => setGame("insulin")}
        onKeyDown={(e) => e.key === "Enter" && setGame("insulin")}
      >
        <h3 style={subheading}>Insulin Explorer</h3>
        <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", marginBottom: 8 }}>
          Match insulin types to their action profiles. Learn how different insulins work!
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ ...mono, fontSize: "0.82rem", color: "var(--text-faint)" }}>
            Best: {scores.insulin}/5
          </span>
          <span style={{ color: "var(--accent-teal)", fontWeight: 600, fontSize: "0.88rem" }}>Play &rarr;</span>
        </div>
      </div>

      <div
        role="button"
        tabIndex={0}
        style={{ ...card, cursor: "pointer" }}
        onClick={() => setGame("glucose")}
        onKeyDown={(e) => e.key === "Enter" && setGame("glucose")}
      >
        <h3 style={subheading}>Glucose Detective</h3>
        <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", marginBottom: 8 }}>
          Answer questions about what makes glucose go up and down. Become a glucose expert!
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ ...mono, fontSize: "0.82rem", color: "var(--text-faint)" }}>
            Best: {scores.glucose}/10
          </span>
          <span style={{ color: "var(--accent-teal)", fontWeight: 600, fontSize: "0.88rem" }}>Play &rarr;</span>
        </div>
      </div>

      <div
        role="button"
        tabIndex={0}
        style={{ ...card, cursor: "pointer" }}
        onClick={() => setGame("carb")}
        onKeyDown={(e) => e.key === "Enter" && setGame("carb")}
      >
        <h3 style={subheading}>Carb Counter Challenge</h3>
        <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", marginBottom: 8 }}>
          Estimate the carbs in common foods. How close can you get?
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ ...mono, fontSize: "0.82rem", color: "var(--text-faint)" }}>
            Best: {scores.carb}/100
          </span>
          <span style={{ color: "var(--accent-teal)", fontWeight: 600, fontSize: "0.88rem" }}>Play &rarr;</span>
        </div>
      </div>

      {/* Score board */}
      <div style={card}>
        <h3 style={subheading}>Score Board</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, textAlign: "center" }}>
          <div>
            <p style={label}>Insulin</p>
            <p style={{ ...mono, fontSize: "1.2rem", color: "var(--accent-teal)" }}>{scores.insulin}/5</p>
          </div>
          <div>
            <p style={label}>Glucose</p>
            <p style={{ ...mono, fontSize: "1.2rem", color: "var(--accent-teal)" }}>{scores.glucose}/10</p>
          </div>
          <div>
            <p style={label}>Carbs</p>
            <p style={{ ...mono, fontSize: "1.2rem", color: "var(--accent-teal)" }}>{scores.carb}/100</p>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <p style={{ fontSize: "0.75rem", color: "var(--text-faint)", textAlign: "center", marginTop: 24, paddingBottom: 72 }}>
        This game is for educational entertainment only. It does not constitute medical advice.
        Always consult your healthcare team for diabetes management decisions.
      </p>

      <MiraBubble message="Pick a game and let's learn together!" />
    </div>
  );
}
