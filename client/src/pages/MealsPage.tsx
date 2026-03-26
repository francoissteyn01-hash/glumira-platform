import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { UtensilsCrossed, Search, Clock, AlertTriangle } from "lucide-react";
import { useState, useMemo } from "react";

/**
 * GluMira™ Meals Page
 * Browse 20 culturally-aware meal regimes and log meals
 */
export default function MealsPage() {
  const profileQuery = trpc.patient.getProfile.useQuery();
  const profile = profileQuery.data;
  const regimesQuery = trpc.meals.getRegimes.useQuery();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredRegimes = useMemo(() => {
    if (!regimesQuery.data) return [];
    let regimes = regimesQuery.data;
    if (selectedCategory !== "all") {
      regimes = regimes.filter((r: any) => r.category === selectedCategory);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      regimes = regimes.filter((r: any) =>
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        (r.culturalNotes && r.culturalNotes.toLowerCase().includes(q))
      );
    }
    return regimes;
  }, [regimesQuery.data, searchQuery, selectedCategory]);

  const categories = useMemo((): string[] => {
    if (!regimesQuery.data) return [];
    const cats = new Set<string>(regimesQuery.data.map((r: any) => r.category as string));
    return Array.from(cats).sort();
  }, [regimesQuery.data]);

  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      standard: "bg-blue-100 text-blue-800",
      pediatric: "bg-purple-100 text-purple-800",
      pregnancy: "bg-pink-100 text-pink-800",
      elderly: "bg-gray-100 text-gray-800",
      "shift-work": "bg-indigo-100 text-indigo-800",
      "religious-fasting": "bg-amber-100 text-amber-800",
      athletic: "bg-green-100 text-green-800",
      "low-carb": "bg-teal-100 text-teal-800",
      cultural: "bg-orange-100 text-orange-800",
    };
    return colors[cat] || "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl text-primary">Meal Regimes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          20 culturally-aware meal profiles with hypo thresholds and timing patterns
        </p>
      </div>

      <Tabs defaultValue="browse" className="w-full">
        <TabsList>
          <TabsTrigger value="browse">Browse Regimes</TabsTrigger>
          <TabsTrigger value="active">Active Regime</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4 mt-4">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search regimes (e.g. Ramadan, pediatric, low-carb)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="glum-input pl-9"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedCategory === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory("all")}
              >
                All
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                  className="capitalize"
                >
                  {cat.replace("-", " ")}
                </Button>
              ))}
            </div>
          </div>

          {/* Regime Cards */}
          {regimesQuery.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="p-6 animate-pulse">
                  <div className="h-6 bg-muted rounded w-3/4 mb-3" />
                  <div className="h-4 bg-muted rounded w-full mb-2" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRegimes.map((regime: any) => (
                <Card key={regime.id} className="p-6 hover:border-secondary/50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-primary">{regime.name}</h3>
                      <Badge className={`mt-1 ${getCategoryColor(regime.category)}`}>
                        {regime.category.replace("-", " ")}
                      </Badge>
                    </div>
                    {regime.fasting && (
                      <Badge variant="outline" className="border-amber-300 text-amber-700">
                        <Clock className="w-3 h-3 mr-1" />
                        Fasting
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground mb-4">{regime.description}</p>

                  {/* Thresholds */}
                  <div className="flex gap-4 mb-3">
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-red-500" />
                      <span className="text-xs text-muted-foreground">
                        Hypo: <span className="font-data font-semibold text-red-600">{regime.hypoThreshold} mg/dL</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                      <span className="text-xs text-muted-foreground">
                        Hyper: <span className="font-data font-semibold text-amber-600">{regime.hyperThreshold} mg/dL</span>
                      </span>
                    </div>
                  </div>

                  {/* Meal Slots */}
                  <div className="space-y-2">
                    {regime.meals.slice(0, 4).map((meal: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-xs p-2 bg-muted/20 rounded">
                        <span className="font-medium">{meal.name}</span>
                        <span className="text-muted-foreground">
                          {meal.timeWindow.start}–{meal.timeWindow.end} · {meal.carbRange.min}–{meal.carbRange.max}g
                        </span>
                      </div>
                    ))}
                    {regime.meals.length > 4 && (
                      <p className="text-xs text-muted-foreground text-center">
                        +{regime.meals.length - 4} more meals
                      </p>
                    )}
                  </div>

                  {regime.culturalNotes && (
                    <p className="text-xs text-muted-foreground italic mt-3 border-t border-border pt-3">
                      {regime.culturalNotes}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          )}

          {filteredRegimes.length === 0 && !regimesQuery.isLoading && (
            <Card className="p-8 text-center">
              <UtensilsCrossed className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-bold text-primary mb-2">No Regimes Found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or filter criteria.
              </p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="active" className="mt-4">
          <Card className="p-8 text-center">
            <UtensilsCrossed className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-bold text-primary mb-2">
              {profile ? "No Active Regime" : "Profile Required"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {profile
                ? "Browse the regimes tab and select one to activate for your profile."
                : "Set up your patient profile first to activate a meal regime."}
            </p>
          </Card>
        </TabsContent>
      </Tabs>

      <p className="glum-disclaimer">
        GluMira™ is an educational platform, not a medical device. Always consult your registered diabetes care team.
      </p>
    </div>
  );
}
