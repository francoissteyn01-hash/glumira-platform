export interface ThyroidProfile {
  condition: "hypothyroid" | "hyperthyroid" | "hashimotos" | "euthyroid";
  tshLevel: number;
  t4Level?: number;
  onMedication: boolean;
}

export function calculateThyroidInsulinImpact(tshLevel: number, currentISF: number): {
  adjustedISF: number;
  change: number;
  direction: string;
} {
  // Normal TSH: 0.4-4.0
  if (tshLevel >= 0.4 && tshLevel <= 4.0) {
    return { adjustedISF: currentISF, change: 0, direction: "none" };
  }

  if (tshLevel > 4.0) {
    // Hypothyroid: insulin resistance increases → ISF decreases (need more insulin)
    const factor = 1 - Math.min((tshLevel - 4.0) / 20, 0.3); // max 30% reduction
    const adjusted = Math.round(currentISF * factor * 10) / 10;
    return { adjustedISF: adjusted, change: Math.round((1 - factor) * 100), direction: "decreased" };
  }

  // Hyperthyroid: insulin sensitivity increases → ISF increases (need less insulin)
  const factor = 1 + Math.min((0.4 - tshLevel) / 0.4, 0.25); // max 25% increase
  const adjusted = Math.round(currentISF * factor * 10) / 10;
  return { adjustedISF: adjusted, change: Math.round((factor - 1) * 100), direction: "increased" };
}

export function assessHashimotoOverlap(
  hasAntibodies: boolean,
  t1dDurationYears: number
): { riskLevel: string; message: string } {
  if (!hasAntibodies) {
    return { riskLevel: "standard", message: "No thyroid antibodies detected. Continue routine screening." };
  }
  if (t1dDurationYears < 5) {
    return {
      riskLevel: "elevated",
      message: "Hashimoto's antibodies present with recent T1D diagnosis. Dual autoimmune activity — closer monitoring recommended.",
    };
  }
  return {
    riskLevel: "watch",
    message: "Hashimoto's antibodies present. Both conditions share autoimmune origins. Annual antibody review recommended.",
  };
}

export interface MonitoringItem {
  test: string;
  dueDate: string;
  priority: "high" | "medium" | "low";
}

export function generateThyroidMonitoringPlan(
  lastTshDate: string,
  isOnMedication: boolean,
  isDoseChanging: boolean
): MonitoringItem[] {
  const last = new Date(lastTshDate);
  const items: MonitoringItem[] = [];

  const tshInterval = isDoseChanging ? 6 : isOnMedication ? 12 : 24; // weeks
  const nextTsh = new Date(last);
  nextTsh.setDate(nextTsh.getDate() + tshInterval * 7);
  items.push({ test: "TSH + Free T4", dueDate: nextTsh.toISOString().split("T")[0], priority: "high" });

  const nextA1c = new Date();
  nextA1c.setMonth(nextA1c.getMonth() + 3);
  items.push({ test: "HbA1c", dueDate: nextA1c.toISOString().split("T")[0], priority: "high" });

  const nextAntibody = new Date(last);
  nextAntibody.setFullYear(nextAntibody.getFullYear() + 1);
  items.push({ test: "Thyroid antibodies (TPO)", dueDate: nextAntibody.toISOString().split("T")[0], priority: "medium" });

  return items.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}
