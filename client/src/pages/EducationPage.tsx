/**
 * GluMira™ V7 — client/src/pages/EducationPage.tsx
 * 10-module Mira Education curriculum with 3 age bands
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { DISCLAIMER } from "../lib/constants";

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
  { id: "what-happened", icon: "🏥", title: "What Just Happened", summary: "Understanding a new diabetes diagnosis.", band1: "Your body is still amazing. One small part inside you needs a bit of help now. That's why the doctors are here — to teach you and your family how to help it. You didn't do anything wrong, and you can still do everything you love.", band2: "Inside your body, there's a part called the pancreas. It used to make something called insulin all by itself. Now it needs help, so we give your body insulin from the outside. It's not a punishment — it's just how your body works now.", band3: "Type 1 diabetes is an autoimmune condition. Your immune system accidentally attacked the insulin-producing cells in your pancreas. It's not caused by eating sugar or anything you did. It's nobody's fault." },
  { id: "what-is-insulin", icon: "💉", title: "What Is Insulin", summary: "How insulin works — the key that opens the door.", band1: "Insulin is like a tiny helper that opens doors in your body so the energy from food can get in.", band2: "Think of insulin as a key. When you eat, your food turns into glucose (energy). Insulin is the key that lets glucose into your cells.", band3: "Insulin is a hormone produced by beta cells in the pancreas. It allows glucose to move from blood into cells. Different types work at different speeds." },
  { id: "what-is-glucose", icon: "🩸", title: "What Is a Glucose Number", summary: "Readings are information, not grades.", band1: "The number on your meter is just information — like a weather report for your body. High or low doesn't mean good or bad.", band2: "Your glucose number tells you how much sugar is in your blood right now. There's no such thing as a 'bad' number — every number is useful information.", band3: "Blood glucose is measured in mmol/L or mg/dL. Your target range is typically 4-10 mmol/L (70-180 mg/dL). A reading outside range is data, not failure." },
  { id: "what-is-hypo", icon: "⬇️", title: "What Is a Hypo", summary: "Recognising and treating low blood sugar.", band1: "Sometimes your energy drops too low. You might feel shaky or sweaty. Tell a grown-up right away and they'll give you something sweet.", band2: "A hypo happens when glucose drops below about 4 mmol/L. The fix: eat 15g of fast sugar, wait 15 minutes, check again.", band3: "Hypoglycemia occurs below 3.9 mmol/L (70 mg/dL). Treatment follows the 15-15 rule. Severe hypos require glucagon." },
  { id: "what-is-hyper", icon: "⬆️", title: "What Is a Hyper", summary: "Understanding high blood sugar.", band1: "Sometimes there's too much sugar energy. You might feel very thirsty. Drink water and let your grown-ups know.", band2: "A hyper means glucose is too high — usually above 10 mmol/L. Drink water and follow your correction plan.", band3: "Persistent highs above 14 mmol/L with nausea or fruity breath may indicate DKA — a medical emergency. Check ketones immediately." },
  { id: "food-and-carbs", icon: "🍽️", title: "Food and Carbs", summary: "How food affects glucose without fear.", band1: "Food is fuel! Some foods have more energy. Your grown-ups count these to help with insulin. You can eat all the foods you love.", band2: "Carbohydrates are the main food type that raises glucose. Counting carbs helps you match your insulin dose. No food is 'bad'.", band3: "Carb counting is key. Learning to estimate carbs helps calculate bolus doses using your ICR. There's no food you 'can't have'." },
  { id: "devices-and-tools", icon: "📱", title: "Devices and Tools", summary: "Meters, CGMs, pens, and pumps.", band1: "You have cool gadgets! A tiny sensor watches your glucose. An insulin pen gives your body what it needs. These are your helpers.", band2: "A CGM checks glucose every few minutes. Insulin pens let you dial your dose. Pumps deliver insulin all day. None are punishments — they're powerful tools.", band3: "Key devices: glucose meters, CGMs (Dexcom G7, Libre), insulin pens, and pumps (CSII). Each has benefits and limitations." },
  { id: "at-school", icon: "🏫", title: "At School", summary: "Your rights and care plans at school.", band1: "Your teachers know about your diabetes. You can check glucose and have snacks whenever you need to.", band2: "You have the right to manage diabetes at school — check glucose in class, eat snacks, use the bathroom, and carry your hypo kit.", band3: "A School Care Plan outlines your medical needs, emergency protocols, and daily management. Schools must make reasonable accommodations." },
  { id: "feelings", icon: "💭", title: "Feelings About Diabetes", summary: "Emotional wellbeing matters.", band1: "Sometimes diabetes makes you feel grumpy or sad. That's completely normal. Talking about it helps.", band2: "It's normal to feel frustrated. Diabetes burnout is real, and it's okay to ask for support.", band3: "Diabetes distress affects up to 40% of young people with T1D. Psychological support should be part of your care plan." },
  { id: "not-alone", icon: "🤝", title: "You Are Not Alone", summary: "Community and the future.", band1: "So many kids are just like you! You are part of a brave, strong community.", band2: "Millions of children live with T1D. Finding your community makes a huge difference.", band3: "Over 1.2 million children globally live with T1D. Research into better treatments is advancing rapidly. You are part of a global community." },
];

export default function EducationPage() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [ageBand, setAgeBand] = useState<1 | 2 | 3>(2);

  const bandLabels = { 1: "Ages 0-4 (Caregiver)", 2: "Ages 5-8", 3: "Ages 9-12" };
  const getContent = (m: Module) => ageBand === 1 ? m.band1 : ageBand === 2 ? m.band2 : m.band3;

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa", padding: 24 }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", color: "#1a2a5e", fontSize: 28, marginBottom: 4 }}>Education Centre</h1>
        <p style={{ color: "#718096", fontSize: 14, marginBottom: 16 }}>10 core modules. Tap to expand. Completing modules earns badges.</p>

        {/* Age Band Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 13, color: "#718096" }}>Age Band:</span>
          {([1, 2, 3] as const).map(b => (
            <button key={b} onClick={() => setAgeBand(b)} style={{ padding: "4px 14px", borderRadius: 20, fontSize: 12, fontWeight: 500, border: `1px solid ${ageBand === b ? "#2ab5c1" : "#d1d5db"}`, background: ageBand === b ? "#2ab5c1" : "#fff", color: ageBand === b ? "#fff" : "#4a5568", cursor: "pointer" }}>
              {b === 1 ? "0-4" : b === 2 ? "5-8" : "9-12"}
            </button>
          ))}
          <span style={{ fontSize: 12, color: "#a0aec0", marginLeft: 8 }}>{bandLabels[ageBand]}</span>
        </div>

        <div style={{ background: "#fffbeb", border: "1px solid #fbbf24", borderRadius: 12, padding: "10px 16px", marginBottom: 20 }}>
          <p style={{ fontSize: 11, color: "#92400e" }}>{DISCLAIMER}</p>
        </div>

        {/* Module Links */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <Link to="/modules/pregnancy" style={linkPill}>🤱 Pregnancy Module</Link>
          <Link to="/modules/paediatric" style={linkPill}>👶 Paediatric Module</Link>
          <Link to="/modules/school-care" style={linkPill}>🏫 School Care Plan</Link>
          <Link to="/modules/menstrual" style={linkPill}>🌿 Menstrual Cycle</Link>
        </div>

        {/* Modules */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {MODULES.map((mod, idx) => {
            const isOpen = activeId === mod.id;
            return (
              <div key={mod.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, overflow: "hidden" }}>
                <button onClick={() => setActiveId(isOpen ? null : mod.id)} style={{ width: "100%", textAlign: "left", padding: 16, border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 24 }}>{mod.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 600, color: "#1a2a5e", fontSize: 15 }}>
                        <span style={{ color: "#2ab5c1", fontSize: 13, marginRight: 8 }}>{String(idx + 1).padStart(2, "0")}</span>
                        {mod.title}
                      </span>
                      <span style={{ color: "#a0aec0", fontSize: 14 }}>{isOpen ? "−" : "+"}</span>
                    </div>
                    <p style={{ color: "#718096", fontSize: 12, margin: "4px 0 0" }}>{mod.summary}</p>
                  </div>
                </button>
                {isOpen && (
                  <div style={{ padding: "0 16px 16px", borderTop: "1px solid #f1f5f9" }}>
                    <p style={{ fontSize: 14, color: "#4a5568", lineHeight: 1.7, marginTop: 12 }}>{getContent(mod)}</p>
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

const linkPill: React.CSSProperties = { padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 500, border: "1px solid #e2e8f0", background: "#fff", color: "#1a2a5e", textDecoration: "none" };
