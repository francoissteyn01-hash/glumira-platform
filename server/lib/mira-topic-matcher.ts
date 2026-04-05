/**
 * GluMira™ V7 — server/lib/mira-topic-matcher.ts
 * Mira Topic Matcher — scans user messages against 100 education topics
 * Returns top matching topics with confidence scores
 */

export interface TopicMatch {
  id: number;
  title: string;
  confidence: number;
  group: string;
}

// Keywords mapped to topic IDs for fast matching
const TOPIC_KEYWORDS: Record<string, number[]> = {
  // Diagnosis
  "diagnosed": [1, 2, 3, 8, 85],
  "new diagnosis": [1, 2, 3, 8, 85],
  "just diagnosed": [1, 2, 3, 8],
  "what is type 1": [1, 2, 3],
  "type 1 diabetes": [1, 2, 3],

  // Injections
  "injection": [4, 5, 32, 60],
  "inject": [4, 5, 32, 60],
  "needle": [4, 5, 32],
  "first injection": [4, 5],
  "self inject": [32, 5],

  // Blood glucose
  "blood glucose": [6, 7, 91, 92],
  "blood sugar": [6, 7, 91, 92],
  "glucose number": [6, 7],
  "bg level": [6, 7],
  "target range": [6, 92],

  // Hypo/Hyper
  "hypo": [7, 71, 78, 79],
  "hyper": [7, 72],
  "low blood sugar": [7, 71, 78],
  "high blood sugar": [7, 72],
  "hypoglycaemia": [7, 71, 78, 79],
  "hyperglycaemia": [7, 72],

  // Night/overnight
  "first night": [8, 19],
  "overnight": [19, 78],
  "night time": [19, 78],
  "night check": [19, 78],
  "cant sleep": [19, 82],
  "2am": [19, 82],
  "3am": [19, 82, 86],

  // School
  "school": [9, 21, 22, 23, 28, 29, 30, 36, 88],
  "teacher": [9, 28, 88],
  "school nurse": [28],
  "school kit": [21],
  "school lunch": [22],
  "pe": [23],
  "sports day": [23],
  "field trip": [29],
  "school camp": [29],
  "friends": [10, 30, 43],

  // Young children
  "infant": [11, 12],
  "toddler": [11, 15, 17, 18],
  "baby": [12, 13],
  "breastfeed": [12],
  "weaning": [13],
  "daycare": [14],
  "creche": [14],
  "tantrum": [15],
  "teething": [18],
  "sleep regression": [18],
  "growth spurt": [17, 37],
  "glucagon": [20, 79],

  // Pre-teen
  "puberty": [31, 48],
  "self-inject": [32],
  "home alone": [33],
  "burnout": [34, 81],
  "social media": [35],
  "secondary school": [36],
  "gaming": [38],
  "pocket carbs": [39],
  "why me": [40, 85],

  // Teen
  "driving": [41],
  "alcohol": [42],
  "drinking": [42],
  "dating": [43],
  "university": [44],
  "college": [44],
  "exam": [45],
  "stress": [45, 96],
  "job": [46],
  "work": [46],
  "mental health": [47, 81, 84],
  "depression": [47],
  "anxiety": [47, 84],
  "eating disorder": [47],
  "diabulimia": [47],
  "contraception": [48],
  "forgot insulin": [49],
  "transition": [50],

  // IOB / Insulin science
  "iob": [51, 53, 54],
  "insulin on board": [51],
  "basal": [52, 56, 59],
  "bolus": [52, 55, 64],
  "stacking": [53, 54],
  "overlap": [53, 54],
  "rapid acting": [55],
  "novorapid": [55],
  "fiasp": [55],
  "humalog": [55],
  "long acting": [56],
  "tresiba": [56],
  "levemir": [56],
  "lantus": [56],
  "quiet tail": [57],
  "tail": [57],
  "what if": [58],
  "dawn phenomenon": [59],
  "dawn effect": [59],
  "4am": [59],
  "injection site": [60],
  "rotation": [60],
  "lipohypertrophy": [60],

  // Nutrition
  "carb": [61, 22, 63, 64],
  "carb count": [61],
  "protein": [62],
  "fat": [62],
  "pizza": [62],
  "glycaemic index": [63],
  "gi": [63],
  "meal timing": [64],
  "pre bolus": [64],
  "restaurant": [65],
  "eating out": [65],
  "fast food": [66],
  "snack": [67, 26, 39],
  "fibre": [68],
  "water": [69],
  "dehydration": [69],
  "cooking": [70],

  // Emergency
  "severe hypo": [71, 79],
  "unconscious": [71, 79],
  "seizure": [79],
  "dka": [72],
  "ketoacidosis": [72],
  "vomiting": [73],
  "gastro": [73],
  "stomach bug": [73],
  "anouk": [73],
  "fever": [74],
  "infection": [74],
  "sick": [16, 73, 74],
  "sick day": [16, 73, 74],
  "surgery": [75],
  "travel": [76],
  "ketone": [77, 72],
  "night hypo": [78],
  "emergency": [71, 72, 79, 80],
  "emergency plan": [80],
  "action plan": [80],

  // Emotional
  "tired": [82],
  "exhausted": [82],
  "caregiver": [82],
  "sibling": [83],
  "brother": [83],
  "sister": [83],
  "checking too much": [84],
  "obsessive": [84],
  "grief": [85],
  "sad": [85],
  "support": [86],
  "support group": [86],
  "endocrinologist": [87],
  "appointment": [87],
  "legal": [88],
  "rights": [88],
  "504": [88],
  "cost": [89],
  "money": [89],
  "afford": [89],
  "hope": [90],
  "resilience": [90],

  // Clinical
  "hba1c": [91],
  "a1c": [91],
  "time in range": [92],
  "tir": [92],
  "cgm": [93],
  "sensor": [93],
  "dexcom": [93],
  "libre": [93],
  "pump": [94],
  "mdi": [94],
  "exercise": [95, 23, 27],
  "sport": [95, 23],
  "hormone": [96, 31],
  "cortisol": [96, 45],
  "autoimmune": [97],
  "thyroid": [97],
  "coeliac": [97],
  "celiac": [97],
  "clinical trial": [98],
  "research": [99],
  "future": [100],
  "cure": [100],

  // Dietary / cultural
  "ramadan": [73],
  "fasting": [73],
  "kosher": [73],
  "shabbat": [73],
  "halal": [73],
  "bernstein": [73],
  "low carb": [73],
  "pregnancy": [48],
  "menstrual": [48],
  "period": [48],
  "adhd": [38],
  "stimulant": [38],
};

// All 100 topic titles with their module group
const TOPIC_TITLES: Record<number, { title: string; group: string }> = {
  // Module A — Diagnosis & First Steps
  1: { title: "What is Type 1 Diabetes? (age 0-5 parent version)", group: "A" },
  2: { title: "What is Type 1 Diabetes? (age 6-10 child version)", group: "A" },
  3: { title: "What is Type 1 Diabetes? (age 11-15 teen version)", group: "A" },
  4: { title: "Your first injection — what to expect (parent guide)", group: "A" },
  5: { title: "Your first injection — what to expect (teen guide)", group: "A" },
  6: { title: "Understanding blood glucose numbers", group: "A" },
  7: { title: "Hypo vs Hyper — knowing the difference and what to do", group: "A" },
  8: { title: "The first night home — a parent's survival guide", group: "A" },
  9: { title: "Telling school about your child's diagnosis", group: "A" },
  10: { title: "Telling friends — scripts for kids and teens", group: "A" },

  // Module B — Living with T1D: Ages 0-5
  11: { title: "Insulin dosing for infants and toddlers", group: "B" },
  12: { title: "Breastfeeding and Type 1 Diabetes", group: "B" },
  13: { title: "Weaning and carb awareness for babies", group: "B" },
  14: { title: "Daycare and diabetes — preparing carers", group: "B" },
  15: { title: "Toddler tantrums vs hypo behaviour — how to tell the difference", group: "B" },
  16: { title: "Sick days for under-5s", group: "B" },
  17: { title: "Growth spurts and changing insulin needs", group: "B" },
  18: { title: "Teething, sleep regression, and blood sugars", group: "B" },
  19: { title: "The overnight check routine", group: "B" },
  20: { title: "Emergency glucagon for small children", group: "B" },

  // Module C — School-Age
  21: { title: "Packing the school diabetes kit", group: "C" },
  22: { title: "School lunch carb counting", group: "C" },
  23: { title: "PE, sport, and exercise at school", group: "C" },
  24: { title: "Birthday parties and special occasions", group: "C" },
  25: { title: "Sleepovers with Type 1", group: "C" },
  26: { title: "After-school snacks and activity lows", group: "C" },
  27: { title: "Swimming, cycling, and active play", group: "C" },
  28: { title: "The school nurse relationship", group: "C" },
  29: { title: "Field trips and school camps", group: "C" },
  30: { title: "Explaining T1D to classmates", group: "C" },

  // Module D — Pre-teen
  31: { title: "Puberty and insulin resistance", group: "D" },
  32: { title: "Learning to self-inject", group: "D" },
  33: { title: "Home alone with diabetes", group: "D" },
  34: { title: "Pre-teen emotional health — diabetes burnout starts here", group: "D" },
  35: { title: "Social media and diabetes misinformation", group: "D" },
  36: { title: "Transitioning to secondary school with T1D", group: "D" },
  37: { title: "Growth spurts in pre-teens — adjusting doses (conceptual)", group: "D" },
  38: { title: "Gaming, screen time, and forgetting to check", group: "D" },
  39: { title: "Pocket carbs — being prepared anywhere", group: "D" },
  40: { title: "Why me? — answering the hardest question", group: "D" },

  // Module E — Teens & Young Adults
  41: { title: "Driving and Type 1 Diabetes", group: "E" },
  42: { title: "Alcohol and Type 1", group: "E" },
  43: { title: "Dating and disclosure", group: "E" },
  44: { title: "University and college life with T1D", group: "E" },
  45: { title: "Exam stress and glucose volatility", group: "E" },
  46: { title: "First job and workplace rights", group: "E" },
  47: { title: "Teen mental health and T1D", group: "E" },
  48: { title: "Contraception, menstrual cycles, and glucose", group: "E" },
  49: { title: "What happens when you forget insulin", group: "E" },
  50: { title: "Transition from paediatric to adult care", group: "E" },

  // Module F — The IOB Hunter: Insulin Science
  51: { title: "What is Insulin On Board and why does it matter?", group: "F" },
  52: { title: "Basal vs Bolus — the two pillars", group: "F" },
  53: { title: "Insulin stacking explained", group: "F" },
  54: { title: "The IOB overlap window — visualising risk", group: "F" },
  55: { title: "Rapid-acting vs short-acting insulin compared", group: "F" },
  56: { title: "Long-acting insulin profiles (Tresiba, Levemir, Lantus)", group: "F" },
  57: { title: "The quiet tail — why IOB never truly hits zero", group: "F" },
  58: { title: "What-if scenarios — modelling missed or extra doses", group: "F" },
  59: { title: "Dawn phenomenon — the 4am mystery explained", group: "F" },
  60: { title: "Injection sites and absorption variability", group: "F" },

  // Module G — Nutrition & Carbs
  61: { title: "Carb counting basics", group: "G" },
  62: { title: "Protein and fat — the slow glucose risers", group: "G" },
  63: { title: "Glycaemic index and why it matters", group: "G" },
  64: { title: "Meal timing and pre-bolus strategies", group: "G" },
  65: { title: "Eating out and restaurant carb guessing", group: "G" },
  66: { title: "Fast food survival guide", group: "G" },
  67: { title: "Healthy snacking with T1D", group: "G" },
  68: { title: "Fibre and its effect on glucose absorption", group: "G" },
  69: { title: "Hydration, water, and dehydration risks", group: "G" },
  70: { title: "Cooking with your child — making carb counting fun", group: "G" },

  // Module H — Emergencies & Sick Days
  71: { title: "Severe hypoglycaemia — what it looks like and what to do", group: "H" },
  72: { title: "DKA warning signs", group: "H" },
  73: { title: "Gastroenteritis and T1D — The Gastroenteritis Crisis Protocol", group: "H" },
  74: { title: "Fever, infection, and insulin resistance", group: "H" },
  75: { title: "Surgery and hospital stays", group: "H" },
  76: { title: "Travelling with Type 1 Diabetes", group: "H" },
  77: { title: "Ketone testing — when, why, and what the numbers mean", group: "H" },
  78: { title: "Night-time hypos — prevention and response", group: "H" },
  79: { title: "Seizures from severe hypos", group: "H" },
  80: { title: "Creating your emergency action plan", group: "H" },

  // Module I — Emotional & Family
  81: { title: "Diabetes burnout", group: "I" },
  82: { title: "Caregiver fatigue — you can't pour from an empty cup", group: "I" },
  83: { title: "Siblings and jealousy — when diabetes gets all the attention", group: "I" },
  84: { title: "Anxiety and obsessive checking", group: "I" },
  85: { title: "Grief after diagnosis", group: "I" },
  86: { title: "Building a support network", group: "I" },
  87: { title: "Getting the most from your endocrinologist appointment", group: "I" },
  88: { title: "Legal rights, school accommodations, and 504 plans", group: "I" },
  89: { title: "Cost, insurance, and financial help", group: "I" },
  90: { title: "Hope and resilience — stories of strength", group: "I" },

  // Module J — Clinical Concepts & Tech
  91: { title: "Understanding your HbA1c", group: "J" },
  92: { title: "Time in Range vs HbA1c", group: "J" },
  93: { title: "CGM basics — Dexcom, Libre, and others", group: "J" },
  94: { title: "Pump vs MDI — choosing what works", group: "J" },
  95: { title: "Exercise physiology and T1D", group: "J" },
  96: { title: "Hormones, cortisol, and stress", group: "J" },
  97: { title: "Autoimmune friends — thyroid, coeliac, and more", group: "J" },
  98: { title: "Clinical trials and T1D", group: "J" },
  99: { title: "Research frontiers — what scientists are working on", group: "J" },
  100: { title: "The future of T1D management", group: "J" },
};

export function matchTopics(message: string): TopicMatch[] {
  const lower = message.toLowerCase();
  const scores: Record<number, number> = {};

  for (const [keyword, topicIds] of Object.entries(TOPIC_KEYWORDS)) {
    if (lower.includes(keyword)) {
      const keywordWeight = keyword.split(" ").length; // multi-word keywords score higher
      for (const id of topicIds) {
        scores[id] = (scores[id] || 0) + keywordWeight;
      }
    }
  }

  // Normalize scores to 0-1 confidence
  const maxScore = Math.max(...Object.values(scores), 1);

  return Object.entries(scores)
    .map(([id, score]) => {
      const numId = parseInt(id);
      const topic = TOPIC_TITLES[numId];
      if (!topic) return null;
      return {
        id: numId,
        title: topic.title,
        confidence: Math.min(score / maxScore, 1),
        group: topic.group,
      };
    })
    .filter((m): m is TopicMatch => m !== null && m.confidence >= 0.6)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);
}
