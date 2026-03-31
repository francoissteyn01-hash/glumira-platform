import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Activity, BarChart3, Syringe, UtensilsCrossed, ArrowRight, AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";

/**
 * GluMira™ Dashboard — Overview Page
 * Shows summary widgets for glucose, insulin, IOB, and meals
 */
export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const profileQuery = trpc.patient.getProfile.useQuery();
  const profile = profileQuery.data;

  const firstName = profile?.firstName || user?.name?.split(" ")[0] || "there";

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl md:text-3xl text-primary">
          Welcome back, {firstName}
        </h1>
        <p className="text-muted-foreground mt-1">
          The science of insulin, made visible — powered by IOB Hunter™
        </p>
      </div>

      {/* Setup Prompt (if no profile) */}
      {!profile && !profileQuery.isLoading && (
        <Card className="p-6 border-2 border-dashed border-secondary/40 bg-secondary/5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-secondary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-primary mb-1">Complete Your Profile</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Set up your patient profile to unlock glucose tracking, insulin logging, and IOB analysis.
              </p>
              <Button
                onClick={() => setLocation("/dashboard/profile")}
                className="glum-btn-primary"
              >
                Set Up Profile
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Glucose Status */}
        <Card
          className="p-5 cursor-pointer hover:border-secondary/50 transition-colors group"
          onClick={() => setLocation("/dashboard/glucose")}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-sm text-muted-foreground">Glucose Tracking</p>
          <p className="text-lg font-bold text-primary mt-1">
            {profile ? "View Readings" : "Not Set Up"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Log and visualize glucose trends
          </p>
        </Card>

        {/* Insulin Status */}
        <Card
          className="p-5 cursor-pointer hover:border-secondary/50 transition-colors group"
          onClick={() => setLocation("/dashboard/insulin")}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
              <Syringe className="w-5 h-5 text-secondary" />
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-sm text-muted-foreground">Insulin Doses</p>
          <p className="text-lg font-bold text-primary mt-1">
            {profile ? "View Doses" : "Not Set Up"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Track bolus and basal doses
          </p>
        </Card>

        {/* IOB Analysis */}
        <Card
          className="p-5 cursor-pointer hover:border-secondary/50 transition-colors group"
          onClick={() => setLocation("/dashboard/iob")}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-accent" />
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-sm text-muted-foreground">IOB Analysis</p>
          <p className="text-lg font-bold text-primary mt-1">
            Walsh Bilinear
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Insulin on-board decay curves
          </p>
        </Card>

        {/* Meals */}
        <Card
          className="p-5 cursor-pointer hover:border-secondary/50 transition-colors group"
          onClick={() => setLocation("/dashboard/meals")}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-green-600" />
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-sm text-muted-foreground">Meal Regimes</p>
          <p className="text-lg font-bold text-primary mt-1">
            20 Profiles
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Culturally-aware meal patterns
          </p>
        </Card>
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* IOB Engine Info */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-secondary" />
            </div>
            <h3 className="text-lg font-bold text-primary">IOB Hunter™ Engine v7.0</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">
                Walsh bilinear DIA decay curve (not linear or exponential)
              </p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">
                U-100, U-200, U-500 concentration support with biological unit conversion
              </p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">
                Insulin stacking risk analysis (recent, moderate, elderly IOB)
              </p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">
                Bolus, basal, and correction IOB separation
              </p>
            </div>
          </div>
        </Card>

        {/* Meal Regimes Info */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <UtensilsCrossed className="w-4 h-4 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-primary">Meal Intelligence</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">
                20 culturally-aware meal regime profiles
              </p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">
                Ramadan, Yom Kippur, and religious fasting support
              </p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">
                Pediatric, pregnancy, elderly, and athletic profiles
              </p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">
                Custom hypo/hyper thresholds per regime
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Medical Disclaimer */}
      <p className="glum-disclaimer">
        GluMira™ is an educational platform, educational platform. Always consult your registered diabetes care team.

      </p>
    </div>
  );
}
