export interface EducationTopic {
  id: number;
  group: string;
  groupTitle: string;
  groupDescription: string;
  title: string;
  ageRange: string;
  audience: string;
  status: "available" | "coming_soon";
}

export const EDUCATION_TOPICS: EducationTopic[] = [
  // GROUP A: NEW DIAGNOSIS — PAEDIATRIC (1-10)
  { id: 1, group: "A", groupTitle: "New Diagnosis — Paediatric", groupDescription: "Just Diagnosed — The First 30 Days", title: "What is Type 1 Diabetes? (age 0-5 parent version)", ageRange: "0-5", audience: "parent", status: "available" },
  { id: 2, group: "A", groupTitle: "New Diagnosis — Paediatric", groupDescription: "Just Diagnosed — The First 30 Days", title: "What is Type 1 Diabetes? (age 6-10 child version)", ageRange: "6-10", audience: "child", status: "available" },
  { id: 3, group: "A", groupTitle: "New Diagnosis — Paediatric", groupDescription: "Just Diagnosed — The First 30 Days", title: "What is Type 1 Diabetes? (age 11-15 teen version)", ageRange: "11-15", audience: "teen", status: "available" },
  { id: 4, group: "A", groupTitle: "New Diagnosis — Paediatric", groupDescription: "Just Diagnosed — The First 30 Days", title: "Your first injection — what to expect (parent guide)", ageRange: "all", audience: "parent", status: "available" },
  { id: 5, group: "A", groupTitle: "New Diagnosis — Paediatric", groupDescription: "Just Diagnosed — The First 30 Days", title: "Your first injection — what to expect (teen guide)", ageRange: "13-18", audience: "teen", status: "available" },
  { id: 6, group: "A", groupTitle: "New Diagnosis — Paediatric", groupDescription: "Just Diagnosed — The First 30 Days", title: "Understanding blood glucose numbers — what they mean and why they change", ageRange: "all", audience: "all", status: "available" },
  { id: 7, group: "A", groupTitle: "New Diagnosis — Paediatric", groupDescription: "Just Diagnosed — The First 30 Days", title: "Hypo vs Hyper — knowing the difference and what to do", ageRange: "all", audience: "all", status: "available" },
  { id: 8, group: "A", groupTitle: "New Diagnosis — Paediatric", groupDescription: "Just Diagnosed — The First 30 Days", title: "The first night home — a parent's survival guide", ageRange: "all", audience: "parent", status: "available" },
  { id: 9, group: "A", groupTitle: "New Diagnosis — Paediatric", groupDescription: "Just Diagnosed — The First 30 Days", title: "Telling school about your child's diagnosis", ageRange: "5-18", audience: "parent", status: "available" },
  { id: 10, group: "A", groupTitle: "New Diagnosis — Paediatric", groupDescription: "Just Diagnosed — The First 30 Days", title: "Telling friends — scripts for kids and teens at every age", ageRange: "5-18", audience: "child", status: "available" },

  // GROUP B: DAILY MANAGEMENT — PAEDIATRIC 0-5 (11-20)
  { id: 11, group: "B", groupTitle: "Daily Management — Paediatric 0-5", groupDescription: "Tiny Humans, Big Responsibility", title: "Insulin dosing for infants and toddlers (0.25U precision)", ageRange: "0-5", audience: "parent", status: "available" },
  { id: 12, group: "B", groupTitle: "Daily Management — Paediatric 0-5", groupDescription: "Tiny Humans, Big Responsibility", title: "Breastfeeding and Type 1 — timing feeds around insulin", ageRange: "0-2", audience: "parent", status: "available" },
  { id: 13, group: "B", groupTitle: "Daily Management — Paediatric 0-5", groupDescription: "Tiny Humans, Big Responsibility", title: "Weaning onto solids — carb counting for baby food", ageRange: "0-2", audience: "parent", status: "available" },
  { id: 14, group: "B", groupTitle: "Daily Management — Paediatric 0-5", groupDescription: "Tiny Humans, Big Responsibility", title: "Managing T1D at daycare/crèche — what staff need to know", ageRange: "0-5", audience: "parent", status: "available" },
  { id: 15, group: "B", groupTitle: "Daily Management — Paediatric 0-5", groupDescription: "Tiny Humans, Big Responsibility", title: "Toddler tantrums and glucose — the hidden connection", ageRange: "2-5", audience: "parent", status: "available" },
  { id: 16, group: "B", groupTitle: "Daily Management — Paediatric 0-5", groupDescription: "Tiny Humans, Big Responsibility", title: "Sick days for under-5s — when to panic, when to watch, when to go to hospital", ageRange: "0-5", audience: "parent", status: "available" },
  { id: 17, group: "B", groupTitle: "Daily Management — Paediatric 0-5", groupDescription: "Tiny Humans, Big Responsibility", title: "Growth spurts and insulin — why doses change without warning", ageRange: "0-5", audience: "parent", status: "available" },
  { id: 18, group: "B", groupTitle: "Daily Management — Paediatric 0-5", groupDescription: "Tiny Humans, Big Responsibility", title: "Teething, sleep regression, and blood sugar chaos", ageRange: "0-3", audience: "parent", status: "available" },
  { id: 19, group: "B", groupTitle: "Daily Management — Paediatric 0-5", groupDescription: "Tiny Humans, Big Responsibility", title: "The overnight check routine — how to survive without losing your mind", ageRange: "0-5", audience: "parent", status: "available" },
  { id: 20, group: "B", groupTitle: "Daily Management — Paediatric 0-5", groupDescription: "Tiny Humans, Big Responsibility", title: "Emergency glucagon for small children — practice before you need it", ageRange: "0-5", audience: "parent", status: "available" },

  // GROUP C: DAILY MANAGEMENT — PAEDIATRIC 5-10 (21-30)
  { id: 21, group: "C", groupTitle: "Daily Management — Paediatric 5-10", groupDescription: "School Years Survival", title: "Packing the school diabetes kit — the complete checklist", ageRange: "5-10", audience: "parent", status: "available" },
  { id: 22, group: "C", groupTitle: "Daily Management — Paediatric 5-10", groupDescription: "School Years Survival", title: "School lunch carb counting — common SA/UK/US school meals", ageRange: "5-10", audience: "parent", status: "available" },
  { id: 23, group: "C", groupTitle: "Daily Management — Paediatric 5-10", groupDescription: "School Years Survival", title: "PE and sports day — pre-exercise, during, and post-exercise management", ageRange: "5-10", audience: "parent", status: "available" },
  { id: 24, group: "C", groupTitle: "Daily Management — Paediatric 5-10", groupDescription: "School Years Survival", title: "Birthday parties — the cake-insulin-timing equation", ageRange: "5-10", audience: "parent", status: "available" },
  { id: 25, group: "C", groupTitle: "Daily Management — Paediatric 5-10", groupDescription: "School Years Survival", title: "Sleepovers — how to prepare the host family", ageRange: "5-10", audience: "parent", status: "available" },
  { id: 26, group: "C", groupTitle: "Daily Management — Paediatric 5-10", groupDescription: "School Years Survival", title: "After-school snack protocols — bridging the gap to dinner", ageRange: "5-10", audience: "parent", status: "available" },
  { id: 27, group: "C", groupTitle: "Daily Management — Paediatric 5-10", groupDescription: "School Years Survival", title: "Swimming and water activities — glucose drops faster than you think", ageRange: "5-10", audience: "all", status: "available" },
  { id: 28, group: "C", groupTitle: "Daily Management — Paediatric 5-10", groupDescription: "School Years Survival", title: "The school nurse relationship — what to insist on", ageRange: "5-10", audience: "parent", status: "available" },
  { id: 29, group: "C", groupTitle: "Daily Management — Paediatric 5-10", groupDescription: "School Years Survival", title: "Field trips and school camps — extended absence planning", ageRange: "5-10", audience: "parent", status: "available" },
  { id: 30, group: "C", groupTitle: "Daily Management — Paediatric 5-10", groupDescription: "School Years Survival", title: "Explaining T1D to classmates — age-appropriate scripts", ageRange: "5-10", audience: "child", status: "available" },

  // GROUP D: DAILY MANAGEMENT — PAEDIATRIC 10-13 (31-40)
  { id: 31, group: "D", groupTitle: "Daily Management — Pre-Teen 10-13", groupDescription: "Pre-Teen Independence", title: "Puberty and insulin resistance — the hormone rollercoaster", ageRange: "10-13", audience: "all", status: "available" },
  { id: 32, group: "D", groupTitle: "Daily Management — Pre-Teen 10-13", groupDescription: "Pre-Teen Independence", title: "Teaching your child to self-inject — readiness signs and technique", ageRange: "10-13", audience: "parent", status: "available" },
  { id: 33, group: "D", groupTitle: "Daily Management — Pre-Teen 10-13", groupDescription: "Pre-Teen Independence", title: "First time managing T1D alone (home alone protocols)", ageRange: "10-13", audience: "all", status: "available" },
  { id: 34, group: "D", groupTitle: "Daily Management — Pre-Teen 10-13", groupDescription: "Pre-Teen Independence", title: "Pre-teen emotional health — diabetes burnout starts here", ageRange: "10-13", audience: "all", status: "available" },
  { id: 35, group: "D", groupTitle: "Daily Management — Pre-Teen 10-13", groupDescription: "Pre-Teen Independence", title: "Social media and T1D — what your child sees online", ageRange: "10-13", audience: "parent", status: "available" },
  { id: 36, group: "D", groupTitle: "Daily Management — Pre-Teen 10-13", groupDescription: "Pre-Teen Independence", title: "Transition to secondary school — new routines, new risks", ageRange: "10-13", audience: "all", status: "available" },
  { id: 37, group: "D", groupTitle: "Daily Management — Pre-Teen 10-13", groupDescription: "Pre-Teen Independence", title: "Growth spurt identification — when to adjust doses", ageRange: "10-13", audience: "parent", status: "available" },
  { id: 38, group: "D", groupTitle: "Daily Management — Pre-Teen 10-13", groupDescription: "Pre-Teen Independence", title: "Gaming sessions and glucose — sedentary days need different plans", ageRange: "10-13", audience: "teen", status: "available" },
  { id: 39, group: "D", groupTitle: "Daily Management — Pre-Teen 10-13", groupDescription: "Pre-Teen Independence", title: "Pocket carbs — teaching self-rescue", ageRange: "10-13", audience: "child", status: "available" },
  { id: 40, group: "D", groupTitle: "Daily Management — Pre-Teen 10-13", groupDescription: "Pre-Teen Independence", title: "\"Why me?\" — answering the hardest question", ageRange: "10-13", audience: "all", status: "available" },

  // GROUP E: DAILY MANAGEMENT — TEEN 13-18 (41-50)
  { id: 41, group: "E", groupTitle: "Daily Management — Teen 13-18", groupDescription: "Independence Without Chaos", title: "Driving with T1D — the rules, the risks, the preparation", ageRange: "16-18", audience: "teen", status: "available" },
  { id: 42, group: "E", groupTitle: "Daily Management — Teen 13-18", groupDescription: "Independence Without Chaos", title: "Alcohol and Type 1 — the honest truth teens need to hear", ageRange: "16-18", audience: "teen", status: "available" },
  { id: 43, group: "E", groupTitle: "Daily Management — Teen 13-18", groupDescription: "Independence Without Chaos", title: "Dating and disclosure — when and how to tell someone", ageRange: "13-18", audience: "teen", status: "available" },
  { id: 44, group: "E", groupTitle: "Daily Management — Teen 13-18", groupDescription: "Independence Without Chaos", title: "University/college preparation — self-management away from home", ageRange: "16-18", audience: "teen", status: "available" },
  { id: 45, group: "E", groupTitle: "Daily Management — Teen 13-18", groupDescription: "Independence Without Chaos", title: "Exam stress and glucose — cortisol is not your friend", ageRange: "13-18", audience: "teen", status: "available" },
  { id: 46, group: "E", groupTitle: "Daily Management — Teen 13-18", groupDescription: "Independence Without Chaos", title: "Part-time jobs — managing T1D at work", ageRange: "15-18", audience: "teen", status: "available" },
  { id: 47, group: "E", groupTitle: "Daily Management — Teen 13-18", groupDescription: "Independence Without Chaos", title: "Teen mental health and T1D — depression, anxiety, eating disorders", ageRange: "13-18", audience: "all", status: "available" },
  { id: 48, group: "E", groupTitle: "Daily Management — Teen 13-18", groupDescription: "Independence Without Chaos", title: "Contraception and T1D — what every teen girl needs to know", ageRange: "15-18", audience: "teen", status: "available" },
  { id: 49, group: "E", groupTitle: "Daily Management — Teen 13-18", groupDescription: "Independence Without Chaos", title: "\"I forgot my insulin\" — damage control and prevention", ageRange: "13-18", audience: "teen", status: "available" },
  { id: 50, group: "E", groupTitle: "Daily Management — Teen 13-18", groupDescription: "Independence Without Chaos", title: "Transitioning from paediatric to adult diabetes care", ageRange: "16-18", audience: "all", status: "available" },

  // GROUP F: INSULIN SCIENCE — IOB Hunter™ (51-60)
  { id: 51, group: "F", groupTitle: "Insulin Science — IOB Hunter™", groupDescription: "Understanding What's Happening Inside", title: "What is Insulin On Board and why does it matter?", ageRange: "all", audience: "all", status: "available" },
  { id: 52, group: "F", groupTitle: "Insulin Science — IOB Hunter™", groupDescription: "Understanding What's Happening Inside", title: "Basal vs Bolus — the two jobs insulin does", ageRange: "all", audience: "all", status: "available" },
  { id: 53, group: "F", groupTitle: "Insulin Science — IOB Hunter™", groupDescription: "Understanding What's Happening Inside", title: "Insulin stacking explained — why 2+2 doesn't equal 4", ageRange: "all", audience: "all", status: "available" },
  { id: 54, group: "F", groupTitle: "Insulin Science — IOB Hunter™", groupDescription: "Understanding What's Happening Inside", title: "The danger window — when overlapping doses create risk", ageRange: "all", audience: "all", status: "available" },
  { id: 55, group: "F", groupTitle: "Insulin Science — IOB Hunter™", groupDescription: "Understanding What's Happening Inside", title: "Rapid-acting vs short-acting — Fiasp, NovoRapid, Actrapid compared", ageRange: "all", audience: "all", status: "available" },
  { id: 56, group: "F", groupTitle: "Insulin Science — IOB Hunter™", groupDescription: "Understanding What's Happening Inside", title: "Long-acting insulin profiles — Tresiba vs Levemir vs Lantus", ageRange: "all", audience: "all", status: "available" },
  { id: 57, group: "F", groupTitle: "Insulin Science — IOB Hunter™", groupDescription: "Understanding What's Happening Inside", title: "The quiet tail — why insulin is still working hours later", ageRange: "all", audience: "all", status: "available" },
  { id: 58, group: "F", groupTitle: "Insulin Science — IOB Hunter™", groupDescription: "Understanding What's Happening Inside", title: "What-if scenarios — using IOB Hunter™ to learn, not guess", ageRange: "all", audience: "all", status: "available" },
  { id: 59, group: "F", groupTitle: "Insulin Science — IOB Hunter™", groupDescription: "Understanding What's Happening Inside", title: "Dawn phenomenon — the 4am mystery explained", ageRange: "all", audience: "all", status: "available" },
  { id: 60, group: "F", groupTitle: "Insulin Science — IOB Hunter™", groupDescription: "Understanding What's Happening Inside", title: "Injection site rotation — how absorption changes everything", ageRange: "all", audience: "all", status: "available" },

  // GROUP G: NUTRITION & MEAL MANAGEMENT (61-70)
  { id: 61, group: "G", groupTitle: "Nutrition & Meal Management", groupDescription: "Food Is Not The Enemy", title: "Carb counting basics — the skill that changes everything", ageRange: "all", audience: "all", status: "available" },
  { id: 62, group: "G", groupTitle: "Nutrition & Meal Management", groupDescription: "Food Is Not The Enemy", title: "Protein and fat — the slow glucose release most people ignore", ageRange: "all", audience: "all", status: "available" },
  { id: 63, group: "G", groupTitle: "Nutrition & Meal Management", groupDescription: "Food Is Not The Enemy", title: "Glycaemic Index for T1D — which carbs hit fastest", ageRange: "all", audience: "all", status: "available" },
  { id: 64, group: "G", groupTitle: "Nutrition & Meal Management", groupDescription: "Food Is Not The Enemy", title: "Meal timing and insulin timing — the 15-minute rule", ageRange: "all", audience: "all", status: "available" },
  { id: 65, group: "G", groupTitle: "Nutrition & Meal Management", groupDescription: "Food Is Not The Enemy", title: "Restaurant eating — how to estimate when you can't weigh", ageRange: "all", audience: "all", status: "available" },
  { id: 66, group: "G", groupTitle: "Nutrition & Meal Management", groupDescription: "Food Is Not The Enemy", title: "Fast food survival guide — the actual carb counts", ageRange: "all", audience: "all", status: "available" },
  { id: 67, group: "G", groupTitle: "Nutrition & Meal Management", groupDescription: "Food Is Not The Enemy", title: "Snacking strategies — planned vs panic snacking", ageRange: "all", audience: "all", status: "available" },
  { id: 68, group: "G", groupTitle: "Nutrition & Meal Management", groupDescription: "Food Is Not The Enemy", title: "Fibre and T1D — the glucose buffer most people miss", ageRange: "all", audience: "all", status: "available" },
  { id: 69, group: "G", groupTitle: "Nutrition & Meal Management", groupDescription: "Food Is Not The Enemy", title: "Hydration and glucose — dehydration makes everything worse", ageRange: "all", audience: "all", status: "available" },
  { id: 70, group: "G", groupTitle: "Nutrition & Meal Management", groupDescription: "Food Is Not The Enemy", title: "Cooking skills for T1D teens — independence starts in the kitchen", ageRange: "13-18", audience: "teen", status: "available" },

  // GROUP H: EMERGENCIES & SICK DAYS (71-80)
  { id: 71, group: "H", groupTitle: "Emergencies & Sick Days", groupDescription: "When Things Go Wrong", title: "Severe hypoglycaemia — what it looks like and what to do", ageRange: "all", audience: "all", status: "available" },
  { id: 72, group: "H", groupTitle: "Emergencies & Sick Days", groupDescription: "When Things Go Wrong", title: "DKA warning signs — the emergency you must never miss", ageRange: "all", audience: "all", status: "available" },
  { id: 73, group: "H", groupTitle: "Emergencies & Sick Days", groupDescription: "When Things Go Wrong", title: "Gastroenteritis and T1D — the vomiting + insulin crisis (The Anouk Scenario)", ageRange: "all", audience: "all", status: "available" },
  { id: 74, group: "H", groupTitle: "Emergencies & Sick Days", groupDescription: "When Things Go Wrong", title: "Fever and infection — why glucose goes haywire when you're sick", ageRange: "all", audience: "all", status: "available" },
  { id: 75, group: "H", groupTitle: "Emergencies & Sick Days", groupDescription: "When Things Go Wrong", title: "Surgery preparation — fasting protocols with active insulin", ageRange: "all", audience: "all", status: "available" },
  { id: 76, group: "H", groupTitle: "Emergencies & Sick Days", groupDescription: "When Things Go Wrong", title: "Travel emergencies — what to do when you're far from home", ageRange: "all", audience: "all", status: "available" },
  { id: 77, group: "H", groupTitle: "Emergencies & Sick Days", groupDescription: "When Things Go Wrong", title: "Ketone testing — when, why, and what the numbers mean", ageRange: "all", audience: "all", status: "available" },
  { id: 78, group: "H", groupTitle: "Emergencies & Sick Days", groupDescription: "When Things Go Wrong", title: "Night-time hypos — prevention and response", ageRange: "all", audience: "all", status: "available" },
  { id: 79, group: "H", groupTitle: "Emergencies & Sick Days", groupDescription: "When Things Go Wrong", title: "Seizures from severe hypos — what every caregiver must know", ageRange: "all", audience: "parent", status: "available" },
  { id: 80, group: "H", groupTitle: "Emergencies & Sick Days", groupDescription: "When Things Go Wrong", title: "Creating your emergency action plan — the document that saves lives", ageRange: "all", audience: "all", status: "available" },

  // GROUP I: EMOTIONAL & PSYCHOSOCIAL (81-90)
  { id: 81, group: "I", groupTitle: "Emotional & Psychosocial", groupDescription: "The Part Nobody Talks About", title: "Diabetes burnout — recognising it before it becomes dangerous", ageRange: "all", audience: "all", status: "available" },
  { id: 82, group: "I", groupTitle: "Emotional & Psychosocial", groupDescription: "The Part Nobody Talks About", title: "Caregiver fatigue — you can't pour from an empty cup", ageRange: "all", audience: "parent", status: "available" },
  { id: 83, group: "I", groupTitle: "Emotional & Psychosocial", groupDescription: "The Part Nobody Talks About", title: "Siblings without T1D — the invisible impact on the family", ageRange: "all", audience: "parent", status: "available" },
  { id: 84, group: "I", groupTitle: "Emotional & Psychosocial", groupDescription: "The Part Nobody Talks About", title: "Anxiety and glucose checking — when vigilance becomes harmful", ageRange: "all", audience: "all", status: "available" },
  { id: 85, group: "I", groupTitle: "Emotional & Psychosocial", groupDescription: "The Part Nobody Talks About", title: "Grief after diagnosis — it's real and it's valid", ageRange: "all", audience: "all", status: "available" },
  { id: 86, group: "I", groupTitle: "Emotional & Psychosocial", groupDescription: "The Part Nobody Talks About", title: "Building a support network — who to call at 3am", ageRange: "all", audience: "all", status: "available" },
  { id: 87, group: "I", groupTitle: "Emotional & Psychosocial", groupDescription: "The Part Nobody Talks About", title: "Relationship with your endo — how to be heard in a 15-minute appointment", ageRange: "all", audience: "all", status: "available" },
  { id: 88, group: "I", groupTitle: "Emotional & Psychosocial", groupDescription: "The Part Nobody Talks About", title: "Advocacy at school — knowing your child's legal rights", ageRange: "5-18", audience: "parent", status: "available" },
  { id: 89, group: "I", groupTitle: "Emotional & Psychosocial", groupDescription: "The Part Nobody Talks About", title: "Financial burden of T1D — resources and assistance programmes", ageRange: "all", audience: "all", status: "available" },
  { id: 90, group: "I", groupTitle: "Emotional & Psychosocial", groupDescription: "The Part Nobody Talks About", title: "Hope and resilience — families who are thriving (anonymised stories)", ageRange: "all", audience: "all", status: "available" },

  // GROUP J: ADVANCED & CLINICAL (91-100)
  { id: 91, group: "J", groupTitle: "Advanced & Clinical", groupDescription: "Going Deeper", title: "Understanding your HbA1c — what it measures and its limits", ageRange: "all", audience: "all", status: "available" },
  { id: 92, group: "J", groupTitle: "Advanced & Clinical", groupDescription: "Going Deeper", title: "Time in Range vs HbA1c — the modern metric explained", ageRange: "all", audience: "all", status: "available" },
  { id: 93, group: "J", groupTitle: "Advanced & Clinical", groupDescription: "Going Deeper", title: "CGM basics — what it tells you and what it doesn't", ageRange: "all", audience: "all", status: "available" },
  { id: 94, group: "J", groupTitle: "Advanced & Clinical", groupDescription: "Going Deeper", title: "Insulin pump vs MDI — the honest comparison", ageRange: "all", audience: "all", status: "available" },
  { id: 95, group: "J", groupTitle: "Advanced & Clinical", groupDescription: "Going Deeper", title: "Exercise physiology and T1D — why muscles eat glucose", ageRange: "all", audience: "all", status: "available" },
  { id: 96, group: "J", groupTitle: "Advanced & Clinical", groupDescription: "Going Deeper", title: "Hormones and insulin — cortisol, adrenaline, growth hormone", ageRange: "all", audience: "all", status: "available" },
  { id: 97, group: "J", groupTitle: "Advanced & Clinical", groupDescription: "Going Deeper", title: "Autoimmune cluster — thyroid, coeliac, T1D connections", ageRange: "all", audience: "all", status: "available" },
  { id: 98, group: "J", groupTitle: "Advanced & Clinical", groupDescription: "Going Deeper", title: "Clinical trials — what they are and whether to participate", ageRange: "all", audience: "all", status: "available" },
  { id: 99, group: "J", groupTitle: "Advanced & Clinical", groupDescription: "Going Deeper", title: "Reading research papers — how to evaluate T1D studies", ageRange: "all", audience: "clinician", status: "available" },
  { id: 100, group: "J", groupTitle: "Advanced & Clinical", groupDescription: "Going Deeper", title: "The future of T1D management — what's coming in the next 5 years", ageRange: "all", audience: "all", status: "available" },
];

export const GROUPS = [...new Set(EDUCATION_TOPICS.map(t => t.group))].map(g => {
  const first = EDUCATION_TOPICS.find(t => t.group === g)!;
  return { id: g, title: first.groupTitle, description: first.groupDescription, count: EDUCATION_TOPICS.filter(t => t.group === g).length };
});
