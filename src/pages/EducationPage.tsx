import { useState } from "react";
import { DISCLAIMER } from "@/lib/constants";

interface Module {
  id: string;
  icon: string;
  title: string;
  summary: string;
  band1: string;
  band2: string;
  band3: string;
}

const MODULES: Module[] = [
  {
    id: "what-happened",
    icon: "🏥",
    title: "What Just Happened",
    summary: "Understanding a new diabetes diagnosis — what it means, what it doesn't mean, and what happens next.",
    band1: "Your body is still amazing. One small part inside you needs a bit of help now. That's why the doctors are here — to teach you and your family how to help it. You didn't do anything wrong, and you can still do everything you love.",
    band2: "Inside your body, there's a part called the pancreas. It used to make something called insulin all by itself. Now it needs help, so we give your body insulin from the outside. It's not a punishment — it's just how your body works now. Lots of kids have this, and they're doing great.",
    band3: "Type 1 diabetes is an autoimmune condition. Your immune system — which normally fights germs — accidentally attacked the insulin-producing cells in your pancreas. It's not caused by eating sugar, being overweight, or anything you did. It's nobody's fault. You'll learn to manage it, and we'll help you every step of the way.",
  },
  {
    id: "what-is-insulin",
    icon: "💉",
    title: "What Is Insulin",
    summary: "How insulin works in your body — the key that opens the door for glucose to enter your cells.",
    band1: "Insulin is like a tiny helper that opens doors in your body so the energy from food can get in. Everyone needs insulin — your body just needs it from the outside now.",
    band2: "Think of insulin as a key. When you eat, your food turns into glucose (energy). But glucose can't get into your cells without a key. Insulin is that key. Your body used to make its own keys, and now you get them through an injection or pump.",
    band3: "Insulin is a hormone produced by beta cells in the pancreas. It allows glucose — your body's main fuel — to move from your blood into your cells. Without insulin, glucose stays in your blood and your cells can't access energy. You replace the insulin your body no longer makes through injections or an insulin pump. Different types of insulin work at different speeds.",
  },
  {
    id: "what-is-glucose",
    icon: "🩸",
    title: "What Is a Glucose Number",
    summary: "Glucose readings are information, not grades. Understanding what the numbers mean and why they change.",
    band1: "The number on your meter is just information — like a weather report for your body. It tells your grown-ups how to help you. High or low doesn't mean good or bad. It just means your body needs something different right now.",
    band2: "When you check your glucose, you get a number. That number tells you how much sugar is in your blood right now. It goes up after eating and down when insulin is working. There's no such thing as a 'bad' number — every number is useful information that helps you make decisions.",
    band3: "Blood glucose is measured in mmol/L or mg/dL. Your target range is set by your diabetes team — typically 4-10 mmol/L (70-180 mg/dL). Numbers naturally fluctuate throughout the day based on food, activity, stress, hormones, and insulin timing. A reading outside of range is data, not failure. It tells you what adjustment to consider next.",
  },
  {
    id: "what-is-hypo",
    icon: "⬇️",
    title: "What Is a Hypo",
    summary: "Recognising and treating low blood sugar — the 15-15 rule and when to ask for help.",
    band1: "Sometimes your body's energy drops too low. You might feel shaky, sweaty, or a bit funny. That's called a hypo. Tell a grown-up right away, and they'll give you something sweet to fix it. You'll feel better soon.",
    band2: "A hypo (hypoglycemia) happens when your glucose drops below about 4 mmol/L (70 mg/dL). You might feel shaky, sweaty, hungry, confused, or dizzy. The fix is simple: eat or drink 15 grams of fast sugar (like juice or glucose tablets), wait 15 minutes, then check again. Always tell an adult if you feel low.",
    band3: "Hypoglycemia occurs when blood glucose falls below 3.9 mmol/L (70 mg/dL). Symptoms include shakiness, sweating, hunger, confusion, irritability, and difficulty concentrating. Treatment follows the 15-15 rule: consume 15g of fast-acting carbohydrates, wait 15 minutes, recheck. If still low, repeat. Severe hypos (loss of consciousness, seizure) require glucagon — make sure people around you know where it is and how to use it.",
  },
  {
    id: "what-is-hyper",
    icon: "⬆️",
    title: "What Is a Hyper",
    summary: "Understanding high blood sugar — why it happens, how it feels, and what to do about it.",
    band1: "Sometimes your body has too much sugar energy floating around. You might feel very thirsty or need to go to the bathroom a lot. Your grown-ups will help fix it. Drink some water and let them know.",
    band2: "A hyper (hyperglycemia) means your glucose is too high — usually above 10 mmol/L (180 mg/dL). You might feel thirsty, tired, or need to go to the bathroom a lot. It can happen if you eat more carbs than expected, miss insulin, or are sick. Drink water and follow your correction plan.",
    band3: "Hyperglycemia is blood glucose above your target range. Common causes include insufficient insulin, extra carbohydrates, illness, stress, or hormonal changes. Symptoms include thirst, frequent urination, fatigue, and blurry vision. Persistent highs above 14 mmol/L (250 mg/dL) with symptoms like nausea or fruity breath may indicate diabetic ketoacidosis (DKA) — a medical emergency. Check ketones and contact your team immediately.",
  },
  {
    id: "food-and-carbs",
    icon: "🍽️",
    title: "Food and Carbs",
    summary: "Understanding carbohydrates — how food affects glucose without creating fear or restriction.",
    band1: "Food is fuel! Some foods have more energy that makes your glucose go up — things like bread, fruit, and pasta. Your grown-ups count these foods to help work out the right amount of insulin. You can eat all the foods you love.",
    band2: "Carbohydrates (carbs) are the main type of food that raises your glucose. They're in bread, rice, pasta, fruit, milk, and sweets. Counting carbs helps you match your insulin dose to what you eat. It's not about 'good' or 'bad' foods — it's about knowing what's in your food so you can manage your glucose.",
    band3: "Carbohydrate counting is a key skill in diabetes management. Carbs are found in grains, fruits, dairy, starchy vegetables, and sugars. Protein and fat have smaller, slower effects on glucose. Learning to estimate carbs helps you calculate accurate bolus doses using your insulin-to-carb ratio (ICR). There's no food you 'can't have' — you just need to account for it with insulin.",
  },
  {
    id: "devices-and-tools",
    icon: "📱",
    title: "Devices and Tools",
    summary: "Glucose meters, CGMs, insulin pens, and pumps — what they do and why they help.",
    band1: "You have some cool gadgets to help you! A tiny sensor can sit on your arm to watch your glucose. An insulin pen or pump gives your body the insulin it needs. These tools are your helpers — they make everything easier.",
    band2: "There are different tools to help manage diabetes. A glucose meter uses a tiny drop of blood to check your level. A CGM (continuous glucose monitor) is a small sensor worn on your body that checks glucose every few minutes — no finger pricks needed most of the time! Insulin pens let you dial and inject your dose. Insulin pumps deliver tiny amounts of insulin throughout the day. None of these are punishments — they're powerful tools.",
    band3: "Key devices include: Blood Glucose Meters (fingerstick testing), CGMs like Dexcom G7 or Libre (continuous interstitial glucose monitoring with trend arrows and alarms), Insulin Pens (disposable or reusable with dial-a-dose), and Insulin Pumps (CSII — continuous subcutaneous insulin infusion with programmable basal rates). Each has benefits and limitations. Your diabetes team will help you choose what works best for your life.",
  },
  {
    id: "at-school",
    icon: "🏫",
    title: "At School",
    summary: "Your rights at school, care plans, and how to feel confident managing diabetes in the classroom.",
    band1: "School is great! Your teachers know about your diabetes and will help you. You can check your glucose and have snacks whenever you need to. It's okay to tell your friends if you want to, and it's okay not to. Your body, your choice.",
    band2: "You have the right to manage your diabetes at school. This means you can check your glucose in class, eat snacks when needed, use the bathroom without asking, and have your hypo kit nearby. Your parents and diabetes team will create a School Care Plan that tells teachers exactly what to do. You're allowed to carry glucose tablets and your phone (for CGM) at all times.",
    band3: "A Diabetes School Care Plan is a formal document outlining your medical needs, emergency protocols, and daily management requirements. It includes your glucose targets, hypo/hyper treatment steps, meal and insulin timing, and emergency contact details. Schools are legally required to make reasonable accommodations. You should know your plan, advocate for yourself when needed, and educate trusted friends so they can help in emergencies.",
  },
  {
    id: "feelings",
    icon: "💭",
    title: "Feelings About Diabetes",
    summary: "It's okay to feel frustrated, sad, or angry. Emotional wellbeing is part of diabetes management.",
    band1: "Sometimes diabetes makes you feel grumpy, sad, or frustrated. That's completely normal. Everyone feels like that sometimes. Talking about it helps — you can tell your family, your teacher, or even Mira. You're doing an amazing job.",
    band2: "Living with diabetes can be tough emotionally. It's normal to feel frustrated when your numbers aren't in range, annoyed at having to check and inject, or different from your friends. These feelings are valid. Talking to someone — a parent, counselor, or diabetes peer — really helps. Diabetes burnout is real, and it's okay to ask for support.",
    band3: "Diabetes distress affects up to 40% of young people with T1D. It can manifest as anxiety about glucose levels, resentment about daily management tasks, fear of hypoglycemia, or feeling overwhelmed. This is not a character flaw — it's a natural response to living with a demanding condition. If you're feeling burned out, talk to your diabetes team about it. Psychological support should be part of your care plan.",
  },
  {
    id: "not-alone",
    icon: "🤝",
    title: "You Are Not Alone",
    summary: "Community, identity, and the future — connecting with others who understand.",
    band1: "There are so many kids just like you! All around the world, children are managing diabetes and doing incredible things — playing sports, going on adventures, making art, and having fun. You are part of a brave, strong community.",
    band2: "Millions of children and teenagers around the world live with Type 1 diabetes. There are camps, groups, online communities, and events where you can meet others who understand exactly what you go through. You're not the only one counting carbs or checking glucose. Finding your community can make a huge difference.",
    band3: "There are over 1.2 million children and adolescents living with T1D globally. Organizations like JDRF, Beyond Type 1, and Diabetes South Africa offer support, advocacy, and community connection. Research into better treatments, artificial pancreas systems, and potential cures is advancing rapidly. Your experience matters — and sharing it helps others. You are part of a global community that is changing how diabetes is understood and managed.",
  },
];

export default function EducationPage() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [ageBand, setAgeBand] = useState<1 | 2 | 3>(2);

  const bandLabel = ageBand === 1 ? "Ages 0-4 (Caregiver reads)" : ageBand === 2 ? "Ages 5-8" : "Ages 9-12";
  const getContent = (mod: Module) => ageBand === 1 ? mod.band1 : ageBand === 2 ? mod.band2 : mod.band3;

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Education Centre</h1>
          <p className="text-sm text-gray-300 mt-1">
            10 core modules. Tap to expand. Completing modules earns badges.
          </p>
        </div>

        {/* Age Band Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Age Band:</span>
          {([1, 2, 3] as const).map(b => (
            <button
              key={b}
              onClick={() => setAgeBand(b)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                ageBand === b
                  ? "bg-brand-500 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {b === 1 ? "0-4" : b === 2 ? "5-8" : "9-12"}
            </button>
          ))}
          <span className="text-xs text-gray-500 ml-2">{bandLabel}</span>
        </div>

        <div className="rounded-lg bg-amber-950/40 border border-amber-800 px-4 py-3">
          <p className="text-xs text-amber-400">{DISCLAIMER}</p>
        </div>

        <div className="space-y-3">
          {MODULES.map((mod, idx) => {
            const isOpen = activeId === mod.id;
            return (
              <div key={mod.id} className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
                <button
                  onClick={() => setActiveId(isOpen ? null : mod.id)}
                  className="w-full text-left p-5 hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{mod.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-white">
                          <span className="text-brand-500 text-sm mr-2">{String(idx + 1).padStart(2, "0")}</span>
                          {mod.title}
                        </p>
                        <span className="text-xs text-gray-400">{isOpen ? "−" : "+"}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{mod.summary}</p>
                    </div>
                  </div>
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 border-t border-gray-800">
                    <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                      {getContent(mod)}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
