/**
 * GluMira V7 — Autism + T1D Module
 * Mobile-first, no images. Scandinavian Minimalist.
 * Honours the current sensory mode from SensoryContext.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import SensoryModeSelector from "@/components/SensoryModeSelector";
import SimplifiedLogger from "@/components/SimplifiedLogger";
import VisualSchedule from "@/components/VisualSchedule";
import InjectionTracker from "@/components/InjectionTracker";
import HypoTreatmentFinder from "@/components/HypoTreatmentFinder";
import MeltdownProtocol from "@/components/MeltdownProtocol";
import { EDUCATION_TOPICS } from "@/data/education-topics";

interface SectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function Section({ title, subtitle, children, defaultOpen = false }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
        aria-expanded={open}
      >
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">{title}</h2>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        <span className="text-[var(--accent-teal)] text-lg font-bold ml-3">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </section>
  );
}

export default function AutismModule() {
  const autismTopics = EDUCATION_TOPICS.filter((t) => t.group === "K");

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-gray-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-sm text-[var(--text-primary)]/60 hover:text-[var(--text-primary)]">
            &larr; Back
          </Link>
          <h1 className="text-lg font-semibold tracking-tight">Autism + T1D</h1>
          <div className="w-12" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="text-center pb-2">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Autism + T1D</h2>
          <p className="text-sm text-gray-500 mt-1">
            Tools for managing Type 1 Diabetes with sensory awareness
          </p>
        </div>

        <Section title="Sensory Mode" subtitle="Choose how the app looks and feels" defaultOpen>
          <SensoryModeSelector />
        </Section>

        <Section title="Quick Log" subtitle="One tap. One question at a time.">
          <SimplifiedLogger />
        </Section>

        <Section title="Visual Schedule" subtitle="Predictable daily routine">
          <VisualSchedule />
        </Section>

        <Section title="Injection Tracker" subtitle="Log sites, tolerance, and what helped">
          <InjectionTracker />
        </Section>

        <Section title="Hypo Treatment Finder" subtitle="Sensory-aware fast carbs">
          <HypoTreatmentFinder />
        </Section>

        <Section title="Meltdown Protocol" subtitle="Glucose-first, 6 numbered steps">
          <MeltdownProtocol />
        </Section>

        <Section title="Learn more" subtitle="Education topics 101-110">
          <ul className="space-y-2">
            {autismTopics.map((t) => (
              <li key={t.id}>
                <Link
                  to={`/education/${t.id}`}
                  className="block rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm hover:border-[var(--accent-teal)]/60"
                >
                  <span className="font-medium text-[var(--text-primary)]">{t.id}. {t.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>

        <footer className="text-xs text-gray-400 text-center pb-8 pt-4 space-y-1">
          <p>This module provides educational information only and is not medical advice.</p>
          <p>Always consult your endocrinologist, psychologist, and occupational therapist.</p>
          <p>GluMira is not a substitute for professional healthcare.</p>
        </footer>
      </main>
    </div>
  );
}
