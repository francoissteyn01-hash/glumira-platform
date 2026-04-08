// GluMira™ V7 — Mira Stories: Chapters 2 & 3
// Block 63: Chapter 2 — "The 2AM Watch" (Caregiver Rough Patch Support)
// Block 64: Chapter 3 — "The Other Side of the Desk" (Clinician Insight)

export interface StoryScene {
  id: string;
  title: string;
  narrator: "mira" | "character" | "system";
  text: string;
  mood: "calm" | "concerned" | "hopeful" | "educational" | "empowering" | "warm";
  animationHint: string;
  duration: number;
}

export interface StoryChapter {
  id: string;
  title: string;
  subtitle: string;
  targetAudience: string;
  scenes: StoryScene[];
}

// ---------------------------------------------------------------------------
// Chapter 2 — "The 2AM Watch"
// ---------------------------------------------------------------------------

const chapter2: StoryChapter = {
  id: "ch2-the-2am-watch",
  title: "The 2AM Watch",
  subtitle: "A story for caregivers in the hardest hours",
  targetAudience: "caregiver",
  scenes: [
    {
      id: "ch2-s01-the-alarm",
      title: "The Alarm",
      narrator: "character",
      text: "It's 2:14 AM. The CGM alarm cuts through the dark — that sharp double-beep you know too well. Your body is already moving before your mind catches up. You're exhausted. You were exhausted three hours ago.",
      mood: "concerned",
      animationHint: "gentle_shake",
      duration: 8,
    },
    {
      id: "ch2-s02-the-check",
      title: "The Check",
      narrator: "character",
      text: "You reach for the phone on the nightstand. The screen glows harsh against the darkness. 3.2 mmol/L. Falling. Your heart races the way it always does, even though you've seen this number before. Below range. Below safe.",
      mood: "concerned",
      animationHint: "pulse_glow",
      duration: 8,
    },
    {
      id: "ch2-s03-the-response",
      title: "The Response",
      narrator: "character",
      text: "You know what to do. You've done it dozens of times. Juice box from the bedside stash. 15 grams of fast-acting carbohydrate. You sit on the edge of your child's bed, hold the straw steady, and wait. Fifteen minutes. The rule of 15.",
      mood: "calm",
      animationHint: "fade_in",
      duration: 8,
    },
    {
      id: "ch2-s04-mira-speaks",
      title: "Mira Speaks",
      narrator: "mira",
      text: "You responded perfectly. Fast-acting glucose, measured amount, no panic overcorrection. That's textbook management — and you did it half-asleep at two in the morning. Most people couldn't do that wide awake.",
      mood: "warm",
      animationHint: "warm_glow",
      duration: 8,
    },
    {
      id: "ch2-s05-the-wait",
      title: "The Wait",
      narrator: "character",
      text: "The longest 15 minutes of the day happen in the dark. You sit watching the number on the screen, willing it upward. The house is silent except for your child's breathing. You refresh. 3.2 still. You refresh again. 3.4. Is that real? You wait.",
      mood: "concerned",
      animationHint: "pulse_glow",
      duration: 8,
    },
    {
      id: "ch2-s06-the-rise",
      title: "The Rise",
      narrator: "character",
      text: "4.1... 4.8... 5.3. The line on the graph tilts upward, gently, steadily. You exhale — a breath you didn't know you were holding. The arrow changes from down to flat. Flat is beautiful at 2:30 in the morning.",
      mood: "hopeful",
      animationHint: "chart_draw",
      duration: 7,
    },
    {
      id: "ch2-s07-understanding-why",
      title: "Understanding Why",
      narrator: "mira",
      text: "Overnight lows often happen when basal insulin peaks while the body is fasting and growth hormones shift. It's a timing pattern, not a failure. The insulin your child needs during the day doesn't always match what their body needs at 2 AM. That mismatch isn't your fault — it's physiology.",
      mood: "educational",
      animationHint: "data_reveal",
      duration: 12,
    },
    {
      id: "ch2-s08-the-pattern",
      title: "The Pattern",
      narrator: "mira",
      text: "This is the third time this week the alarm has gone off at the same hour. Between 1:45 and 2:30, glucose drops below 3.5. That's not random — that's a pattern. And it's exactly the kind of pattern your endo team should see at your next visit.",
      mood: "educational",
      animationHint: "data_reveal",
      duration: 10,
    },
    {
      id: "ch2-s09-you-are-not-alone",
      title: "You Are Not Alone",
      narrator: "mira",
      text: "4.7 million parents worldwide are managing Type 1 diabetes overnight, right now, in this same darkness. Some are treating lows. Some are watching highs drift down. All of them are doing what you're doing — choosing their child's safety over their own sleep. You are part of something bigger than one bad night.",
      mood: "empowering",
      animationHint: "warm_glow",
      duration: 10,
    },
    {
      id: "ch2-s10-the-tool",
      title: "The Tool",
      narrator: "mira",
      text: "GluMira's IOB Hunter can show you the basal pressure map — a visual overlay of when insulin activity is highest relative to glucose trends. It may reveal why 2 AM keeps showing up. Not to replace your care team's judgment, but to give them a clearer picture when you walk in.",
      mood: "educational",
      animationHint: "data_reveal",
      duration: 12,
    },
    {
      id: "ch2-s11-permission-to-rest",
      title: "Permission to Rest",
      narrator: "mira",
      text: "You did everything right tonight. The low was caught, treated, and resolved. The data is captured — every point, every trend, every timestamp. Tomorrow, review it with fresh eyes and with your care team. But right now? You've earned rest.",
      mood: "warm",
      animationHint: "warm_glow",
      duration: 8,
    },
    {
      id: "ch2-s12-morning-light",
      title: "Morning Light",
      narrator: "character",
      text: "Dawn breaks through the curtains. Your child sleeps peacefully, arm draped over a stuffed bear. The glucose line on the screen is steady — 6.2 mmol/L, flat arrow, green range. You made it through another night. And tomorrow night, you'll be ready again.",
      mood: "hopeful",
      animationHint: "sunrise",
      duration: 8,
    },
  ],
};

// ---------------------------------------------------------------------------
// Chapter 3 — "The Other Side of the Desk"
// ---------------------------------------------------------------------------

const chapter3: StoryChapter = {
  id: "ch3-the-other-side-of-the-desk",
  title: "The Other Side of the Desk",
  subtitle: "What happens between appointments",
  targetAudience: "clinician",
  scenes: [
    {
      id: "ch3-s01-the-appointment",
      title: "The Appointment",
      narrator: "character",
      text: "Fifteen minutes. That's what the schedule gives you. The family walks in — parent with a folder, teenager with earbuds still in, and 90 days of CGM data crammed into a printout that's already dog-eared. You smile. You've got this. But fifteen minutes.",
      mood: "calm",
      animationHint: "fade_in",
      duration: 8,
    },
    {
      id: "ch3-s02-the-gap",
      title: "The Gap",
      narrator: "character",
      text: "Between this visit and the last, 2,160 hours passed. 2,160 hours of carb counting, correction boluses, site changes, sick days, growth spurts, school lunches, and sleepovers. 2,160 hours of decisions made without you. And now you have fifteen minutes to understand what happened.",
      mood: "educational",
      animationHint: "slide_up",
      duration: 10,
    },
    {
      id: "ch3-s03-what-they-dont-tell-you",
      title: "What They Don't Tell You",
      narrator: "character",
      text: "The parent doesn't mention the 3 AM saves — the ones that left them sleepless for a week. They don't want to seem like they can't handle it. The teen doesn't say they skipped boluses at school because their friends were watching. They shrug and say \"fine\" when you ask how things are going.",
      mood: "concerned",
      animationHint: "fade_in",
      duration: 10,
    },
    {
      id: "ch3-s04-the-data-problem",
      title: "The Data Problem",
      narrator: "character",
      text: "You open the glucose download on your screen. Numbers. Hundreds of them. Trend lines stacked on trend lines. Ambulatory glucose profiles. Time in range percentages. You know the story is in here somewhere — but where? Which cluster matters? Which spike is a one-off and which is a pattern?",
      mood: "concerned",
      animationHint: "data_reveal",
      duration: 10,
    },
    {
      id: "ch3-s05-miras-offer",
      title: "Mira's Offer",
      narrator: "mira",
      text: "What if the data told you the story? Not just what happened, but when it happened, how often it repeated, and what was happening around it. Not a diagnosis — a narrative. The kind of narrative that turns a wall of numbers into a conversation you can have in fifteen minutes.",
      mood: "educational",
      animationHint: "warm_glow",
      duration: 10,
    },
    {
      id: "ch3-s06-pattern-not-noise",
      title: "Pattern, Not Noise",
      narrator: "mira",
      text: "Three consecutive Tuesday afternoon lows. All between 14:30 and 15:45. All post-PE class. The basal rate was fighting an exercise-driven insulin sensitivity window that lasted longer than the activity itself. That's not noise — that's a pattern with a physiological explanation.",
      mood: "educational",
      animationHint: "chart_draw",
      duration: 12,
    },
    {
      id: "ch3-s07-the-stacking-signal",
      title: "The Stacking Signal",
      narrator: "mira",
      text: "Morning corrections stacking on breakfast boluses. The insulin-on-board map shows overlap pressure from 08:00 to 10:30 every weekday — active insulin from the breakfast dose hasn't cleared before the correction fires. The result: a predictable late-morning low that looks random until you map the IOB curve.",
      mood: "educational",
      animationHint: "data_reveal",
      duration: 12,
    },
    {
      id: "ch3-s08-the-conversation-starter",
      title: "The Conversation Starter",
      narrator: "mira",
      text: "GluMira doesn't tell you what to prescribe. It doesn't adjust doses or override protocols. It shows you what to ask about. 'I notice Tuesday afternoons are consistently low — what happens on Tuesdays?' That's a question that opens a door. The family fills in the rest.",
      mood: "empowering",
      animationHint: "slide_up",
      duration: 10,
    },
    {
      id: "ch3-s09-the-report",
      title: "The Report",
      narrator: "character",
      text: "A two-page clinical summary arrives before the visit. Pattern flags ranked by frequency and severity. A basal density map overlaid with glucose trends. An IOB timeline showing stacking windows. Discussion points — not instructions. Everything you need to make those fifteen minutes count.",
      mood: "calm",
      animationHint: "data_reveal",
      duration: 10,
    },
    {
      id: "ch3-s10-clinician-respectful",
      title: "Clinician-Respectful",
      narrator: "mira",
      text: "We never cross the line. Every insight is educational, rooted in published pharmacology and physiological principles. Pattern-focused, not prescriptive. Your clinical judgment drives the treatment plan — we just make sure the patterns are visible before you walk into the room.",
      mood: "warm",
      animationHint: "warm_glow",
      duration: 10,
    },
    {
      id: "ch3-s11-the-family-hears-you",
      title: "The Family Hears You",
      narrator: "character",
      text: "When you explain the pattern they've been living through — the 2 AM lows, the Tuesday crashes, the morning stacking — something shifts. The parent's shoulders drop. The teen looks up. They feel seen. You didn't just read their numbers. You understood their story. That changes everything.",
      mood: "empowering",
      animationHint: "warm_glow",
      duration: 8,
    },
    {
      id: "ch3-s12-better-conversations",
      title: "Better Conversations",
      narrator: "character",
      text: "Fifteen minutes is still fifteen minutes. The schedule hasn't changed. But now those minutes are focused on the right patterns, the right questions, and the right next steps. The family leaves with a plan they understand. You move to the next chart knowing you made those minutes matter.",
      mood: "hopeful",
      animationHint: "sunrise",
      duration: 8,
    },
  ],
};

// ---------------------------------------------------------------------------
// Chapter 1 placeholder (content lives in a separate onboarding flow)
// ---------------------------------------------------------------------------

const chapter1Placeholder: StoryChapter = {
  id: "ch1-meeting-mira",
  title: "Meeting Mira",
  subtitle: "Your guide to understanding glucose",
  targetAudience: "all",
  scenes: [
    {
      id: "ch1-s01-placeholder",
      title: "Welcome",
      narrator: "mira",
      text: "Hi, I'm Mira — your companion for understanding glucose patterns. Chapter 1 content is delivered through the interactive onboarding flow.",
      mood: "warm",
      animationHint: "fade_in",
      duration: 6,
    },
  ],
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const caregiverStory: StoryChapter = chapter2;
export const clinicianStory: StoryChapter = chapter3;

export function getAllStoryChapters(): StoryChapter[] {
  return [chapter1Placeholder, chapter2, chapter3];
}

export function getStoryChapterById(id: string): StoryChapter | undefined {
  return getAllStoryChapters().find((ch) => ch.id === id);
}

export function getStoryChapterByAudience(audience: string): StoryChapter[] {
  return getAllStoryChapters().filter(
    (ch) => ch.targetAudience === audience || ch.targetAudience === "all"
  );
}
