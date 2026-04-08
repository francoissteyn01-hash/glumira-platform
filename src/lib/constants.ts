export const APP_NAME    = "GluMira™";
export const APP_VERSION = "7.0.0";
export const DISCLAIMER  = "GluMira™ is an educational platform and does not constitute medical advice. Always consult your healthcare team before making changes to your diabetes management.";

export const NAV_LINKS = [
  { label: "Badges",         href: "/badges"         },
  { label: "Beta Program",   href: "/beta"           },
  { label: "Bolus Advisor",  href: "/bolus-advisor"  },
  { label: "Community",      href: "/community"      },
  { label: "Dashboard",      href: "/dashboard"      },
  { label: "Education",      href: "/education"      },
  { label: "FAQ",            href: "/faq"            },
  { label: "Glucose Chart",  href: "/glucose/chart"  },
  { label: "Glucose Log",    href: "/glucose"        },
  { label: "Injection Sites", href: "/injection-sites" },
  { label: "Insulin Log",   href: "/insulin"         },
  { label: "Meal Log",      href: "/log"             },
  { label: "Meal Plan",     href: "/meals/plan"      },
  { label: "Mira AI",       href: "/mira"            },
  { label: "Prediction",    href: "/prediction"      },
  { label: "Profile",       href: "/profile"         },
  { label: "Settings",      href: "/settings"        },
  { label: "Streak",        href: "/streak"          },
] as const;

export const MODULE_LINKS = [
  { label: "ADHD",                href: "/modules/adhd"                 },
  { label: "Autism + T1D",        href: "/modules/autism"               },
  { label: "Bernstein",           href: "/modules/bernstein"            },
  { label: "Carnivore",           href: "/modules/carnivore"            },
  { label: "DASH",                href: "/modules/dash"                 },
  { label: "Full Carb (Standard)", href: "/modules/full-carb"           },
  { label: "Gluten-Free (GFD)",   href: "/modules/gluten-free"          },
  { label: "Halal",               href: "/modules/halal"                },
  { label: "High Protein",        href: "/modules/high-protein"         },
  { label: "Intermittent Fasting", href: "/modules/intermittent-fasting" },
  { label: "Keto (Ketogenic)",    href: "/modules/keto"                 },
  { label: "Kosher",              href: "/modules/kosher"               },
  { label: "Low Carb",            href: "/modules/low-carb"             },
  { label: "Low GI",              href: "/modules/low-gi"               },
  { label: "Mediterranean",       href: "/modules/mediterranean"        },
  { label: "Menstrual Cycle",     href: "/modules/menstrual"            },
  { label: "Mixed / Balanced",    href: "/modules/mixed-balanced"       },
  { label: "Paediatric",          href: "/modules/paediatric"           },
  { label: "Paleo",               href: "/modules/paleo"                },
  { label: "Plant-Based",         href: "/modules/plant-based"          },
  { label: "Pregnancy",           href: "/modules/pregnancy"            },
  { label: "Ramadan",             href: "/modules/ramadan"              },
  { label: "School Care Plan",    href: "/modules/school-care"          },
  { label: "Sick Day",            href: "/modules/sick-day"             },
  { label: "Thyroid",             href: "/modules/thyroid"              },
  { label: "Vegetarian",          href: "/modules/vegetarian"           },
  { label: "Zone",                href: "/modules/zone"                 },
] as const;

export const PORTAL_LINKS = [
  { label: "Clinician Portal",    href: "/clinician"     },
  { label: "Researcher Portal",   href: "/researcher"    },
  { label: "Organisation Portal", href: "/organisation"  },
  { label: "Clinical Report",     href: "/clinical-report" },
  { label: "Grant Evidence",      href: "/grant-evidence" },
  { label: "ISPAD Compliance",    href: "/ispad"          },
  { label: "Investor Dashboard",  href: "/investors"      },
  { label: "API Documentation",   href: "/api-docs"       },
] as const;

export const AUDIT_LINKS = [
  { label: "Performance Audit",    href: "/audit/performance"    },
  { label: "Accessibility Audit",  href: "/audit/accessibility"  },
] as const;

export const BADGE_TIERS = ["bronze", "silver", "gold", "platinum"] as const;
export type BadgeTier = typeof BADGE_TIERS[number];

export const EDUCATION_MODULES = [
  { id: "carbs",      title: "Carbohydrate Counting",  slug: "carbs"      },
  { id: "basics",     title: "Diabetes Basics",        slug: "basics"     },
  { id: "hormones",   title: "Hormones & Glucose",     slug: "hormones"   },
  { id: "iob",        title: "Insulin on Board (IOB)", slug: "iob"        },
  { id: "nightscout", title: "Nightscout & CGM",       slug: "nightscout" },
  { id: "sick-days",  title: "Sick Day Management",    slug: "sick-days"  },
] as const;

export const FAQ_ITEMS = [
  { q: "Can I share access with my caregiver?", a: "Yes. Caregiver sharing is available on Pro and Clinic plans." },
  { q: "Does GluMira™ connect to my CGM?",   a: "GluMira™ can read data from Nightscout. Direct CGM integration is on the roadmap." },
  { q: "How do I earn badges?",              a: "Badges are awarded for completing education modules, logging consistently, and hitting personal milestones." },
  { q: "Is GluMira™ a medical device?",      a: "No. GluMira™ is an educational platform. It does not provide medical advice or replace your healthcare team." },
  { q: "Is my data secure?",                 a: "Yes. All data is encrypted in transit and at rest using Supabase with row-level security." },
  { q: "What is Mira?",                      a: "Mira is GluMira™'s AI education assistant powered by Claude. She answers questions about diabetes management." },
] as const;
