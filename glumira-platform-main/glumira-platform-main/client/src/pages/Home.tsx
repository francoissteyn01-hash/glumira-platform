import { Button } from "@/components/ui/button";
import { Activity, BarChart3, Brain, MessageCircle, Syringe, UtensilsCrossed, Shield, ArrowRight, X, Check, Mail } from "lucide-react";
import { useState, useCallback } from "react";

/**
 * GluMira™ V7 Landing Page — Standalone
 * No tRPC / no backend dependency — works as a static site on Netlify
 * Supabase waitlist integration via REST API
 */

const SUPABASE_URL = "https://jxkdtvwlzhdgzhkbilbf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4a2R0dndsemhkZ3poa2JpbGJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5OTE2NzksImV4cCI6MjA4OTU2NzY3OX0.ka74Ohcq8r3HhlZcEWaqRU15FR6TdlkwuGLdGLrnyfc";

type ModalState = "closed" | "form" | "success" | "error";

function WaitlistModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("patient");
  const [state, setState] = useState<ModalState>("form");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    setErrorMsg("");
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/beta_participants`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "Prefer": "return=minimal",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          name: name.trim() || null,
          status: "pending",
          cohort: "wave_a",
          notes: `Role: ${role}. Source: landing-page.`,
        }),
      });
      if (res.ok || res.status === 201) {
        setState("success");
      } else {
        const text = await res.text();
        if (text.includes("duplicate") || text.includes("unique")) {
          setState("success"); // Already registered = success
        } else {
          setErrorMsg("Something went wrong. Please try again or email info@glumira.ai");
          setState("error");
        }
      }
    } catch {
      setErrorMsg("Connection error. Please try again or email info@glumira.ai");
      setState("error");
    } finally {
      setSubmitting(false);
    }
  }, [email, name, role]);

  const handleClose = () => {
    setState("form");
    setEmail("");
    setName("");
    setErrorMsg("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={handleClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-background rounded-2xl shadow-2xl max-w-md w-full p-8 border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={handleClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-5 h-5" />
        </button>

        {state === "success" ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-primary mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
              You're on the list!
            </h3>
            <p className="text-muted-foreground mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              We'll notify you when GluMira™ beta access is ready.
            </p>
            <p className="text-sm text-muted-foreground" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Check your inbox for a confirmation email.
            </p>
            <Button className="mt-6 glum-btn-primary" onClick={handleClose}>
              Done
            </Button>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-2xl font-bold text-primary" style={{ fontFamily: "'Playfair Display', serif" }}>
                Join the Beta
              </h3>
              <p className="text-sm text-muted-foreground mt-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Get early access to GluMira™ — free during beta testing.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Email address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-colors"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Full name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name (optional)"
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-colors"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  I am a...
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-colors"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  <option value="patient">Patient / Caregiver</option>
                  <option value="clinician">Clinician / Healthcare Provider</option>
                  <option value="educator">Diabetes Educator</option>
                  <option value="researcher">Researcher</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {state === "error" && (
                <p className="text-sm text-red-500" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  {errorMsg}
                </p>
              )}

              <Button
                type="submit"
                className="w-full glum-btn-primary text-base py-3"
                disabled={submitting || !email}
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                    Joining...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Join Beta Waitlist
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Free during beta. No credit card required.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const [showWaitlist, setShowWaitlist] = useState(false);

  const openWaitlist = useCallback(() => setShowWaitlist(true), []);
  const closeWaitlist = useCallback(() => setShowWaitlist(false), []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Waitlist Modal */}
      <WaitlistModal isOpen={showWaitlist} onClose={closeWaitlist} />

      {/* Navigation */}
      <nav className="border-b border-border sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm" style={{ fontFamily: "'Playfair Display', serif" }}>G</span>
            </div>
            <div>
              <span className="text-lg font-bold text-primary" style={{ fontFamily: "'Playfair Display', serif" }}>GluMira™</span>
              <span className="text-xs text-muted-foreground ml-2 hidden sm:inline">v7.0</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild className="hidden sm:inline-flex">
              <a href="#features">Features</a>
            </Button>
            <Button className="glum-btn-primary" onClick={openWaitlist}>
              Get Started Free
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #f8fafd 0%, #eef6f7 40%, #f0f9fa 100%)' }}>
        <div className="absolute inset-0 opacity-60" style={{ backgroundImage: 'url(/glumira-hero-bg.png)', backgroundSize: 'cover', backgroundPosition: 'center bottom' }}></div>
        <div className="container mx-auto px-4 relative z-10 py-10 md:py-16">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/15 text-secondary text-sm font-medium mb-8">
                <Activity className="w-4 h-4" />
                Powered by IOB Hunter™ Engine v7.0
              </div>
              <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight" style={{ color: '#1a2a5e', fontFamily: "'Playfair Display', serif" }}>
                Have you ever wondered what your insulin is actually doing between injections?
              </h1>
              <p className="text-lg md:text-xl mb-4 max-w-xl" style={{ fontFamily: "'DM Sans', sans-serif", color: 'rgba(26,42,94,0.75)' }}>
                GluMira™ makes it visible. An educational insulin analytics platform using the
                Walsh bilinear DIA decay curve — not linear, not exponential.
              </p>
              <p className="text-base font-medium mb-10 italic" style={{ fontFamily: "'DM Sans', sans-serif", color: '#1a9ba6' }}>
                The science of insulin, made visible
              </p>
              <div className="flex gap-4 flex-wrap">
                <Button size="lg" className="glum-btn-primary text-base px-8" onClick={openWaitlist}>
                  Try GluMira™ Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button size="lg" variant="outline" className="text-base px-8 border-primary/30 text-primary hover:bg-primary/5" asChild>
                  <a href="#features">Explore Features</a>
                </Button>
              </div>
            </div>
            <div className="flex justify-center">
              <img
                src="/hero_owl_v1.png"
                alt="GluMira™ Owl — The science of insulin, made visible"
                className="w-full max-w-md md:max-w-lg drop-shadow-2xl"
                style={{ filter: 'drop-shadow(0 0 40px rgba(42, 181, 193, 0.35)) drop-shadow(0 0 80px rgba(26, 42, 94, 0.15))' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-28 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl text-primary mb-4">
              Built for Diabetes Education
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Every feature is designed to help patients and clinicians understand insulin behavior
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="p-8 rounded-xl border border-border bg-background hover:border-secondary/50 transition-all hover:shadow-lg group">
              <div className="w-14 h-14 rounded-xl bg-secondary/10 flex items-center justify-center mb-6 group-hover:bg-secondary/20 transition-colors">
                <Activity className="w-7 h-7 text-secondary" />
              </div>
              <h3 className="text-xl text-primary mb-3">IOB Hunter™ Engine</h3>
              <p className="text-sm text-muted-foreground leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Walsh bilinear DIA decay curve with U-100, U-200, U-500 concentration support.
                Separates bolus, basal, and correction IOB with stacking risk analysis.
              </p>
            </div>

            <div className="p-8 rounded-xl border border-border bg-background hover:border-secondary/50 transition-all hover:shadow-lg group">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <BarChart3 className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl text-primary mb-3">Glucose Trends</h3>
              <p className="text-sm text-muted-foreground leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Interactive glucose trend charts with target range overlays, time-in-range statistics,
                and CGM/fingerstick/manual reading support.
              </p>
            </div>

            <div className="p-8 rounded-xl border border-border bg-background hover:border-secondary/50 transition-all hover:shadow-lg group">
              <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center mb-6 group-hover:bg-green-200 transition-colors">
                <UtensilsCrossed className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-xl text-primary mb-3">20 Meal Regimes</h3>
              <p className="text-sm text-muted-foreground leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Culturally-aware profiles including Ramadan, Yom Kippur, pediatric, pregnancy,
                elderly, athletic, and low-carb patterns with custom thresholds.
              </p>
            </div>

            <div className="p-8 rounded-xl border border-border bg-background hover:border-secondary/50 transition-all hover:shadow-lg group">
              <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-6 group-hover:bg-accent/20 transition-colors">
                <Syringe className="w-7 h-7 text-accent" />
              </div>
              <h3 className="text-xl text-primary mb-3">Insulin Logging</h3>
              <p className="text-sm text-muted-foreground leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Track bolus, basal, and correction doses with daily totals, dose history,
                and biological unit conversion for all concentrations.
              </p>
            </div>

            <div className="p-8 rounded-xl border border-border bg-background hover:border-secondary/50 transition-all hover:shadow-lg group">
              <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center mb-6 group-hover:bg-purple-200 transition-colors">
                <MessageCircle className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-xl text-primary mb-3">Smart Chat</h3>
              <p className="text-sm text-muted-foreground leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Predictive text interface with real-time typo correction using Levenshtein distance
                and educational diabetes insights.
              </p>
            </div>

            <div className="p-8 rounded-xl border border-border bg-background hover:border-secondary/50 transition-all hover:shadow-lg group">
              <div className="w-14 h-14 rounded-xl bg-red-100 flex items-center justify-center mb-6 group-hover:bg-red-200 transition-colors">
                <Shield className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="text-xl text-primary mb-3">Clinical Security</h3>
              <p className="text-sm text-muted-foreground leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                HIPAA-aligned audit logging, encrypted patient data, rate limiting,
                and WCAG 2.1 AA accessibility compliance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Product Tiers Section */}
      <section id="pricing" className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl text-primary mb-4">
              Choose Your Plan
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Start free during beta. Upgrade when you need more.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Tier */}
            <div className="p-8 rounded-xl border-2 border-secondary bg-background relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <span className="bg-secondary text-secondary-foreground px-4 py-1.5 rounded-full text-xs font-bold">
                  Beta
                </span>
              </div>
              <h3 className="text-xl text-primary mb-2">GluMira™ Free</h3>
              <p className="text-sm text-muted-foreground mb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>Powered by IOB Hunter™</p>
              <div className="text-4xl font-bold text-primary mb-6" style={{ fontFamily: "'JetBrains Mono', monospace" }}>$0</div>
              <ul className="space-y-3 mb-8 text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                <li className="flex gap-2"><span className="text-secondary font-bold">✓</span><span>IOB Hunter™ Walsh bilinear engine</span></li>
                <li className="flex gap-2"><span className="text-secondary font-bold">✓</span><span>20 meal regime profiles</span></li>
                <li className="flex gap-2"><span className="text-secondary font-bold">✓</span><span>Glucose tracking & visualization</span></li>
                <li className="flex gap-2"><span className="text-secondary font-bold">✓</span><span>Insulin dose logging</span></li>
                <li className="flex gap-2"><span className="text-secondary font-bold">✓</span><span>School care plan generator</span></li>
                <li className="flex gap-2"><span className="text-secondary font-bold">✓</span><span>1 patient profile</span></li>
              </ul>
              <Button className="w-full glum-btn-primary" onClick={openWaitlist}>
                Get Started Free
              </Button>
            </div>

            {/* Pro Tier */}
            <div className="p-8 rounded-xl border-2 border-primary bg-background relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <span className="bg-accent text-accent-foreground px-4 py-1.5 rounded-full text-xs font-bold">
                  Coming Soon
                </span>
              </div>
              <h3 className="text-xl text-primary mb-2">GluMira™ Pro</h3>
              <p className="text-sm text-muted-foreground mb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>Powered by IOB Hunter™</p>
              <div className="text-4xl font-bold text-primary mb-6" style={{ fontFamily: "'JetBrains Mono', monospace" }}>$9.99<span className="text-sm font-normal">/mo</span></div>
              <ul className="space-y-3 mb-8 text-sm opacity-60" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                <li className="flex gap-2"><span className="text-secondary font-bold">✓</span><span>Everything in Free</span></li>
                <li className="flex gap-2"><span className="text-secondary font-bold">✓</span><span>Pregnancy module</span></li>
                <li className="flex gap-2"><span className="text-secondary font-bold">✓</span><span>Advanced reporting & export</span></li>
                <li className="flex gap-2"><span className="text-secondary font-bold">✓</span><span>Multi-day pattern analysis</span></li>
                <li className="flex gap-2"><span className="text-secondary font-bold">✓</span><span>Unlimited patient profiles</span></li>
                <li className="flex gap-2"><span className="text-secondary font-bold">✓</span><span>Regional PPP pricing available</span></li>
              </ul>
              <Button className="w-full" disabled variant="outline">Coming Soon</Button>
            </div>

            {/* AI Tier */}
            <div className="p-8 rounded-xl border-2 border-primary bg-background relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <span className="bg-accent text-accent-foreground px-4 py-1.5 rounded-full text-xs font-bold">
                  Coming Soon
                </span>
              </div>
              <h3 className="text-xl text-primary mb-2">GluMira™ AI</h3>
              <p className="text-sm text-muted-foreground mb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>Powered by IOB Hunter™</p>
              <div className="text-4xl font-bold text-primary mb-6" style={{ fontFamily: "'JetBrains Mono', monospace" }}>$19.99<span className="text-sm font-normal">/mo</span></div>
              <ul className="space-y-3 mb-8 text-sm opacity-60" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                <li className="flex gap-2"><span className="text-secondary font-bold">✓</span><span>Everything in Pro</span></li>
                <li className="flex gap-2"><span className="text-secondary font-bold">✓</span><span>AI pattern recognition</span></li>
                <li className="flex gap-2"><span className="text-secondary font-bold">✓</span><span>Predictive insulin suggestions</span></li>
                <li className="flex gap-2"><span className="text-secondary font-bold">✓</span><span>Clinical team sharing</span></li>
                <li className="flex gap-2"><span className="text-secondary font-bold">✓</span><span>ADHD, Thyroid, Gastroparesis modules</span></li>
                <li className="flex gap-2"><span className="text-secondary font-bold">✓</span><span>Ramadan fasting module</span></li>
              </ul>
              <Button className="w-full" disabled variant="outline">Coming Soon</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section id="about" className="py-20 md:py-28 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #f8fafd 0%, #eef6f7 50%, #f0f9fa 100%)' }}>
        <div className="absolute inset-0 opacity-50" style={{ backgroundImage: 'url(/glumira-mission-bg.png)', backgroundSize: 'cover', backgroundPosition: 'center top' }}></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl mb-6" style={{ color: '#1a2a5e', fontFamily: "'Playfair Display', serif" }}>
            The Science of Insulin, Made Visible
          </h2>
          <p className="text-lg max-w-2xl mx-auto mb-4" style={{ fontFamily: "'DM Sans', sans-serif", color: 'rgba(26,42,94,0.75)' }}>
            GluMira™ was born from a simple question: why can’t patients see what their insulin is doing?
            We believe that understanding insulin behavior is the first step to better diabetes management.
          </p>
          <p className="text-base mb-8" style={{ fontFamily: "'DM Sans', sans-serif", color: 'rgba(26,42,94,0.55)' }}>
            Contact: <a href="mailto:info@glumira.ai" className="underline text-secondary hover:text-primary transition-colors">info@glumira.ai</a>
          </p>
          <Button size="lg" className="glum-btn-primary font-semibold px-8" onClick={openWaitlist}>
            Start Your Free Account
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="container mx-auto px-4 py-10">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-xs" style={{ fontFamily: "'Playfair Display', serif" }}>G</span>
                </div>
                <span className="font-bold text-primary" style={{ fontFamily: "'Playfair Display', serif" }}>GluMira™</span>
              </div>
              <p className="text-sm text-muted-foreground" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Educational insulin analytics powered by IOB Hunter™ v7.0
              </p>
            </div>
            <div>
              <h4 className="font-bold text-primary mb-4 text-sm">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                <li><a href="#features" className="hover:text-primary transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-primary transition-colors">Pricing</a></li>
                <li><button onClick={openWaitlist} className="hover:text-primary transition-colors text-left">Join Beta</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-primary mb-4 text-sm">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                <li><a href="#about" className="hover:text-primary transition-colors">About</a></li>
                <li><a href="mailto:info@glumira.ai" className="hover:text-primary transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-primary mb-4 text-sm">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                <li><a href="#disclaimer" className="hover:text-primary transition-colors">Medical Disclaimer</a></li>
              </ul>
            </div>
          </div>
          <div id="disclaimer" className="border-t border-border pt-8">
            <p className="glum-disclaimer">
              GluMira™ is an educational platform. It does not provide medical advice or dosing recommendations.
              Always consult your registered diabetes care team.
            </p>
            <p className="text-xs text-muted-foreground text-center mt-3" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              &copy; 2026 GluMira™. All rights reserved. Powered by IOB Hunter™ v7.0.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
