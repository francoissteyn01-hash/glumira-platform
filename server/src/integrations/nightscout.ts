/**
 * GluMira™ V7 — Nightscout Integration
 * Fetches glucose entries and treatments from a Nightscout instance.
 */

export interface NightscoutConfig {
  baseUrl: string;
  apiSecret: string;
}

export interface GlucoseReading {
  time: string;
  value: number; // mmol/L
  trend: string;
}

export interface Treatment {
  time: string;
  eventType: string;
  insulin?: number;
  carbs?: number;
  notes?: string;
}

function headers(config: NightscoutConfig): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (config.apiSecret) h["api-secret"] = config.apiSecret;
  return h;
}

function normaliseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

/** Fetch glucose entries from Nightscout */
export async function fetchEntries(
  config: NightscoutConfig,
  from: Date,
  to: Date
): Promise<GlucoseReading[]> {
  const base = normaliseUrl(config.baseUrl);
  const params = new URLSearchParams({
    "find[dateString][$gte]": from.toISOString(),
    "find[dateString][$lte]": to.toISOString(),
    count: "1000",
  });

  const res = await fetch(`${base}/api/v1/entries.json?${params}`, { headers: headers(config) });
  if (!res.ok) throw new Error(`Nightscout entries fetch failed: ${res.status}`);
  const data = await res.json();

  return (data as any[]).map((entry) => ({
    time: entry.dateString ?? new Date(entry.date ?? entry.mills).toISOString(),
    value: entry.sgv != null ? entry.sgv / 18.0182 : entry.mbg ?? 0, // convert mg/dL → mmol/L
    trend: entry.direction ?? "NONE",
  }));
}

/** Fetch treatments (insulin, carbs) from Nightscout */
export async function fetchTreatments(
  config: NightscoutConfig,
  from: Date,
  to: Date
): Promise<Treatment[]> {
  const base = normaliseUrl(config.baseUrl);
  const params = new URLSearchParams({
    "find[created_at][$gte]": from.toISOString(),
    "find[created_at][$lte]": to.toISOString(),
    count: "500",
  });

  const res = await fetch(`${base}/api/v1/treatments.json?${params}`, { headers: headers(config) });
  if (!res.ok) throw new Error(`Nightscout treatments fetch failed: ${res.status}`);
  const data = await res.json();

  return (data as any[]).map((t) => ({
    time: t.created_at ?? new Date(t.mills).toISOString(),
    eventType: mapEventType(t.eventType ?? ""),
    insulin: t.insulin ?? undefined,
    carbs: t.carbs ?? undefined,
    notes: t.notes ?? undefined,
  }));
}

/** Map Nightscout treatment types to GluMira event types */
function mapEventType(nsType: string): string {
  const map: Record<string, string> = {
    "Correction Bolus": "correction",
    "Meal Bolus": "meal_bolus",
    "Snack Bolus": "snack",
    "Combo Bolus": "meal_bolus",
    "Temp Basal": "basal",
    "Site Change": "other",
    "Sensor Start": "other",
    "BG Check": "glucose",
    "Carb Correction": "low_intervention",
    "Exercise": "exercise",
  };
  return map[nsType] ?? "other";
}

/** Dedup readings by timestamp (keep latest) */
export function dedup<T extends { time: string }>(existing: T[], incoming: T[]): T[] {
  const seen = new Set(existing.map((r) => r.time));
  const merged = [...existing];
  for (const item of incoming) {
    if (!seen.has(item.time)) {
      merged.push(item);
      seen.add(item.time);
    }
  }
  return merged.sort((a, b) => b.time.localeCompare(a.time));
}
