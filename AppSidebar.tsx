/**
 * GluMira V7 — Hypo treatment catalogue (Autism + T1D module)
 * Sensory-aware fast-acting carbohydrate options.
 */

export interface HypoTreatment {
  name: string;
  carbsPerServing: number;
  texture: "liquid" | "gel" | "chalky" | "crunchy" | "smooth" | "chewy";
  taste: string;
  temperature: "cold" | "room" | "any";
  chewingRequired: boolean;
  portableScore: number; // 1-5
  sensoryNotes: string;
}

export const HYPO_TREATMENTS: HypoTreatment[] = [
  {
    name: "Apple juice box",
    carbsPerServing: 15,
    texture: "liquid",
    taste: "sweet-tart",
    temperature: "any",
    chewingRequired: false,
    portableScore: 5,
    sensoryNotes: "No chewing. No strong smell. Predictable sweet taste. Straw gives controlled sips. Good for sensory-avoidant children.",
  },
  {
    name: "Chocolate milk",
    carbsPerServing: 12,
    texture: "liquid",
    taste: "sweet, cocoa",
    temperature: "cold",
    chewingRequired: false,
    portableScore: 3,
    sensoryNotes: "Cold creamy liquid — often comforting and familiar. Note: fat slows absorption slightly, still effective.",
  },
  {
    name: "Dried mango strips",
    carbsPerServing: 8,
    texture: "chewy",
    taste: "intense fruity",
    temperature: "room",
    chewingRequired: true,
    portableScore: 5,
    sensoryNotes: "Sustained chew — regulating. Natural, no additives. Intense flavour may be too much for some.",
  },
  {
    name: "Fruit leather/roll-up",
    carbsPerServing: 10,
    texture: "chewy",
    taste: "fruity",
    temperature: "room",
    chewingRequired: true,
    portableScore: 5,
    sensoryNotes: "Chewy sustained texture — can be regulating for chew-seekers. No loud sounds. Sticky on fingers.",
  },
  {
    name: "Glucose gel tube",
    carbsPerServing: 15,
    texture: "gel",
    taste: "very sweet, artificial",
    temperature: "room",
    chewingRequired: false,
    portableScore: 5,
    sensoryNotes: "Thick sticky texture — can be aversive for texture-sensitive individuals. Very sweet. No chewing required.",
  },
  {
    name: "Glucose tablets (Dextro)",
    carbsPerServing: 4,
    texture: "chalky",
    taste: "mildly sweet",
    temperature: "room",
    chewingRequired: true,
    portableScore: 5,
    sensoryNotes: "Dry chalky texture — often refused by texture-sensitive individuals. Chewing required. Loud crunch sound.",
  },
  {
    name: "Honey sachet",
    carbsPerServing: 17,
    texture: "smooth",
    taste: "sweet, floral",
    temperature: "any",
    chewingRequired: false,
    portableScore: 5,
    sensoryNotes: "Smooth consistent texture. Strong distinct flavour. Natural — good for those who avoid artificial tastes.",
  },
  {
    name: "Jelly babies",
    carbsPerServing: 5,
    texture: "chewy",
    taste: "sweet, fruity",
    temperature: "room",
    chewingRequired: true,
    portableScore: 5,
    sensoryNotes: "Soft chewy texture. Mild sweetness. Small size for controlled portions. Often well tolerated.",
  },
  {
    name: "Lucozade/Glucoade",
    carbsPerServing: 17,
    texture: "liquid",
    taste: "sweet, tangy, fizzy",
    temperature: "cold",
    chewingRequired: false,
    portableScore: 4,
    sensoryNotes: "Carbonation can be aversive or stimulating. Strong taste. Loud bottle-opening sound possible.",
  },
  {
    name: "Skittles",
    carbsPerServing: 1,
    texture: "crunchy",
    taste: "fruity, bright",
    temperature: "room",
    chewingRequired: true,
    portableScore: 5,
    sensoryNotes: "Hard shell then chewy centre — mixed texture can overwhelm. Strong artificial flavours. Bright colours may distract or comfort.",
  },
  {
    name: "Smooth fruit puree pouch",
    carbsPerServing: 12,
    texture: "smooth",
    taste: "mild fruity",
    temperature: "room",
    chewingRequired: false,
    portableScore: 5,
    sensoryNotes: "Perfectly smooth, predictable texture. No lumps. Controlled squeeze delivery. Excellent for texture-avoidant.",
  },
  {
    name: "Yoghurt drink",
    carbsPerServing: 14,
    texture: "liquid",
    taste: "creamy, mild",
    temperature: "cold",
    chewingRequired: false,
    portableScore: 4,
    sensoryNotes: "Cold temperature can be calming or aversive. Mild taste. No chewing. Familiar everyday food.",
  },
];
