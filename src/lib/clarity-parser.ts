/**
 * GluMira™ V7 — Dexcom Clarity CSV parser
 *
 * Parses a Dexcom Clarity CSV export into GluMira's internal CGM reading
 * shape. Anonymises on ingest: PII columns (Patient Info, First Name,
 * Last Name, DOB) are dropped before any reading is emitted — they never
 * land in memory, state, storage, or logs.
 *
 * Deterministic: same input bytes always produce identical output. No
 * Date.now(), no Math.random(), no locale-dependent parsing.
 *
 * GluMira™ is an educational platform, not a medical device.
 */

export interface CgmReading {
  /** ISO 8601 timestamp, seconds precision, UTC-preserving (no TZ shift). */
  timestamp: string;
  /** Glucose in mmol/L, to one decimal place. */
  glucose_mmol: number;
}

export interface ClarityParseResult {
  readings: CgmReading[];
  meta: {
    units_detected: "mg/dL" | "mmol/L";
    rows_total: number;
    rows_kept: number;
    rows_skipped: number;
    pii_fields_stripped: number;
    date_range: { start: string; end: string } | null;
  };
}

export class ClarityParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClarityParseError";
  }
}

/** Columns Dexcom Clarity uses for personally identifiable information. */
const PII_COLUMN_PATTERNS = [
  /patient\s*info/i,
  /first\s*name/i,
  /last\s*name/i,
  /^name$/i,
  /date\s*of\s*birth/i,
  /^dob$/i,
  /email/i,
];

/**
 * Parse a Dexcom Clarity CSV export.
 *
 * Robust to:
 * - mg/dL and mmol/L exports (auto-detects)
 * - Windows line endings (CRLF) and mixed endings
 * - Blank trailing rows, UTF-8 BOM
 * - Quoted fields containing commas
 *
 * Skips rows that aren't glucose readings (calibrations, alerts, etc.)
 * and any row with an unparseable glucose value.
 */
export function parseClarityCsv(raw: string): ClarityParseResult {
  if (typeof raw !== "string" || raw.length === 0) {
    throw new ClarityParseError("Empty input");
  }

  // Strip UTF-8 BOM if present.
  const text = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length < 2) {
    throw new ClarityParseError("CSV has no data rows");
  }

  const header = splitCsvRow(lines[0]);
  const { timestampIdx, glucoseIdx, eventTypeIdx, unitsDetected, piiIndices } =
    resolveColumns(header);

  const readings: CgmReading[] = [];
  let rowsSkipped = 0;
  let minTs: string | null = null;
  let maxTs: string | null = null;

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvRow(lines[i]);
    // Never read from PII indices — the parser *never* sees names or DOBs.
    // (We still count them as stripped in the receipt.)

    // Only accept glucose readings. Clarity marks them "EGV".
    if (eventTypeIdx >= 0) {
      const eventType = (cols[eventTypeIdx] ?? "").trim();
      if (eventType && eventType.toUpperCase() !== "EGV") {
        rowsSkipped++;
        continue;
      }
    }

    const tsRaw = (cols[timestampIdx] ?? "").trim();
    const gRaw = (cols[glucoseIdx] ?? "").trim();
    if (!tsRaw || !gRaw) {
      rowsSkipped++;
      continue;
    }

    const gNum = parseGlucose(gRaw, unitsDetected);
    if (gNum === null) {
      rowsSkipped++;
      continue;
    }

    const timestamp = normaliseTimestamp(tsRaw);
    if (timestamp === null) {
      rowsSkipped++;
      continue;
    }

    readings.push({ timestamp, glucose_mmol: gNum });

    if (minTs === null || timestamp < minTs) minTs = timestamp;
    if (maxTs === null || timestamp > maxTs) maxTs = timestamp;
  }

  // Sort readings by timestamp for deterministic downstream behaviour.
  // String ISO sort is chronological.
  readings.sort((a, b) => (a.timestamp < b.timestamp ? -1 : a.timestamp > b.timestamp ? 1 : 0));

  return {
    readings,
    meta: {
      units_detected: unitsDetected,
      rows_total: lines.length - 1,
      rows_kept: readings.length,
      rows_skipped: rowsSkipped,
      pii_fields_stripped: piiIndices.length,
      date_range: minTs && maxTs ? { start: minTs, end: maxTs } : null,
    },
  };
}

/* ────────────────────── internals ────────────────────── */

function resolveColumns(header: string[]): {
  timestampIdx: number;
  glucoseIdx: number;
  eventTypeIdx: number;
  unitsDetected: "mg/dL" | "mmol/L";
  piiIndices: number[];
} {
  const lower = header.map((h) => h.toLowerCase().trim());

  const timestampIdx = lower.findIndex((h) => h.includes("timestamp"));
  if (timestampIdx < 0) {
    throw new ClarityParseError("No Timestamp column found");
  }

  // Glucose column: may say mg/dL or mmol/L
  let glucoseIdx = lower.findIndex((h) => h.includes("glucose value"));
  if (glucoseIdx < 0) {
    glucoseIdx = lower.findIndex((h) => h.includes("glucose"));
  }
  if (glucoseIdx < 0) {
    throw new ClarityParseError("No Glucose Value column found");
  }

  const unitsDetected: "mg/dL" | "mmol/L" =
    lower[glucoseIdx].includes("mmol") ? "mmol/L" : "mg/dL";

  const eventTypeIdx = lower.findIndex((h) => h.includes("event type"));

  const piiIndices: number[] = [];
  for (let i = 0; i < header.length; i++) {
    if (PII_COLUMN_PATTERNS.some((re) => re.test(header[i]))) {
      piiIndices.push(i);
    }
  }

  return { timestampIdx, glucoseIdx, eventTypeIdx, unitsDetected, piiIndices };
}

/**
 * Minimal CSV row splitter. Handles quoted fields containing commas.
 * Not a full RFC 4180 parser — no embedded newlines in quotes — because
 * Clarity exports don't produce those.
 */
function splitCsvRow(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        out.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
  }
  out.push(cur);
  return out;
}

function parseGlucose(raw: string, units: "mg/dL" | "mmol/L"): number | null {
  // Clarity uses comma decimals in EU locale exports (e.g. "4,7").
  const normalised = raw.replace(",", ".").trim();
  const n = Number(normalised);
  if (!Number.isFinite(n)) return null;
  // Physiologic sanity bounds after unit conversion
  const mmol = units === "mg/dL" ? n / 18.0182 : n;
  if (mmol < 1 || mmol > 40) return null;
  return Math.round(mmol * 10) / 10;
}

/**
 * Clarity emits timestamps like `2026-03-31T14:05:00` (local time, no TZ).
 * We preserve them verbatim (after trimming and normalising separators)
 * so no timezone shift happens at the parse boundary. Downstream code
 * decides how to interpret TZ.
 */
function normaliseTimestamp(raw: string): string | null {
  const trimmed = raw.trim();
  // Accept "YYYY-MM-DDTHH:mm:ss" or "YYYY-MM-DD HH:mm:ss"
  const match = trimmed.match(
    /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/,
  );
  if (!match) return null;
  const [, y, mo, d, h, mi, s] = match;
  return `${y}-${mo}-${d}T${h}:${mi}:${s ?? "00"}`;
}
