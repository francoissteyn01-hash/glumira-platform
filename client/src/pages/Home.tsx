import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { Activity, BarChart3, Brain, MessageCircle, Syringe, UtensilsCrossed, Shield, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

/**
 * GluMira™ V7 Landing Page
 * Soft Editorial design system: Navy primary, Teal accents, Amber highlights
 * Powered by IOB Hunter™
 */

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const loginUrl = getLoginUrl();
  const [, setLocation] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-foreground">Loading GluMira™...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
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
            {isAuthenticated ? (
              <Button className="glum-btn-primary" onClick={() => setLocation("/dashboard")}>
                Open Dashboard
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <>
                <Button variant="outline" asChild className="hidden sm:inline-flex">
                  <a href="#features">Features</a>
                </Button>
                <Button className="glum-btn-primary" asChild>
                  <a href={loginUrl} target="_blank" rel="noopener noreferrer">
                    Get Started Free
                  </a>
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f1b3d 0%, #1a2a5e 40%, #1a3a5e 100%)' }}>
        {/* Background wave image */}
        <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'url(/glumira-hero-bg.png)', backgroundSize: 'cover', backgroundPosition: 'center bottom' }}></div>
        <div className="container mx-auto px-4 relative z-10 py-10 md:py-16">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left: Text */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/20 text-secondary text-sm font-medium mb-8">
                <Activity className="w-4 h-4" />
                Powered by IOB Hunter™ Engine v7.0
              </div>
              <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight" style={{ color: 'white', fontFamily: "'Playfair Display', serif" }}>
                Have you ever wondered what your insulin is actually doing between injections?
              </h1>
              <p className="text-lg md:text-xl mb-4 max-w-xl" style={{ fontFamily: "'DM Sans', sans-serif", color: 'rgba(255,255,255,0.85)' }}>
                GluMira™ makes it visible. An educational insulin analytics platform using the
                Walsh bilinear DIA decay curve — not linear, not exponential.
              </p>
              <p className="text-base font-medium mb-10 italic" style={{ fontFamily: "'DM Sans', sans-serif", color: '#2ab5c1' }}>
                The science of insulin, made visible
              </p>
              <div className="flex gap-4 flex-wrap">
                {isAuthenticated ? (
                  <Button size="lg" className="glum-btn-primary text-base px-8" onClick={() => setLocation("/dashboard")}>
                    Open Dashboard
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                ) : (
                  <>
                    <Button size="lg" className="glum-btn-primary text-base px-8" asChild>
                      <a href={loginUrl} target="_blank" rel="noopener noreferrer">
                        Try GluMira™ Free
                      </a>
                    </Button>
                    <Button size="lg" variant="outline" className="text-base px-8 border-white/30 text-white hover:bg-white/10" asChild>
                      <a href="#features">Explore Features</a>
                    </Button>
                  </>
                )}
              </div>
            </div>
            {/* Right: Owl Hero Image */}
            <div className="flex justify-center">
              <img
                src="/glumira-hero-owl.png"
                alt="GluMira™ Owl — The science of insulin, made visible"
                className="w-full max-w-xs md:max-w-sm drop-shadow-2xl"
                style={{ filter: 'drop-shadow(0 0 40px rgba(42, 181, 193, 0.3))' }}
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
            {/* IOB Engine */}
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

            {/* Glucose Visualization */}
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

            {/* Meal Regimes */}
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

            {/* Insulin Tracking */}
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

            {/* Smart Chat */}
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

            {/* Security */}
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
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl text-primary mb-4">
              Choose Your Plan
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Start free during beta. Upgrade when you need more.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
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
              {isAuthenticated ? (
                <Button className="w-full glum-btn-primary" onClick={() => setLocation("/dashboard")}>
                  Open Dashboard
                </Button>
              ) : (
                <Button className="w-full glum-btn-primary" asChild>
                  <a href={loginUrl} target="_blank" rel="noopener noreferrer">Get Started Free</a>
                </Button>
              )}
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
      <section className="py-20 md:py-28 section-navy">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl mb-6" style={{ color: 'white', fontFamily: "'Playfair Display', serif" }}>
            The Science of Insulin, Made Visible
          </h2>
          <p className="text-lg max-w-2xl mx-auto mb-8 opacity-80" style={{ fontFamily: "'DM Sans', sans-serif", color: 'rgba(255,255,255,0.85)' }}>
            GluMira™ was born from a simple question: why can't patients see what their insulin is doing?
            We believe that understanding insulin behavior is the first step to better diabetes management.
          </p>
          <p className="text-base opacity-60 mb-8" style={{ fontFamily: "'DM Sans', sans-serif", color: 'rgba(255,255,255,0.7)' }}>
            Contact: info@glumira.ai
          </p>
          {!isAuthenticated && (
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold px-8" asChild>
              <a href={loginUrl} target="_blank" rel="noopener noreferrer">
                Start Your Free Account
                <ArrowRight className="w-5 h-5 ml-2" />
              </a>
            </Button>
          )}
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
                <li><a href="#" className="hover:text-primary transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">API Reference</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-primary mb-4 text-sm">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                <li><a href="#" className="hover:text-primary transition-colors">About</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
                <li><a href="mailto:info@glumira.ai" className="hover:text-primary transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-primary mb-4 text-sm">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Medical Disclaimer</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8">
            <p className="glum-disclaimer">
              GluMira™ is an educational platform, educational platform. It does not provide medical advice or dosing recommendations.
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
