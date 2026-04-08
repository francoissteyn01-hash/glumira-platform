/**
 * GluMira™ V7 — Block 43: Environmental Impact Analysis Engine
 * Analyses how environmental conditions (temperature, humidity, altitude,
 * travel / timezone shifts) affect insulin sensitivity, absorption, and storage.
 */

/* ── Types ────────────────────────────────────────────── */

export interface EnvironmentalFactors {
  temperature?: number;           // Celsius
  humidity?: number;              // %
  altitude?: number;              // metres above sea level
  timezone?: string;
  travelDirection?: "east" | "west" | "none";
  timeZoneShift?: number;         // hours shifted
  season?: "spring" | "summer" | "autumn" | "winter";
  uvIndex?: number;
}

export interface EnvironmentalImpact {
  insulinSensitivityChange: string;
  insulinStorageWarning: string | null;
  absorptionNote: string;
  hydrationWarning: string | null;
  activityAdjustment: string;
  educationalNote: string;
}

/* ── Heat ─────────────────────────────────────────────── */

export function getHeatImpact(tempCelsius: number): string {
  if (tempCelsius >= 40) {
    return (
      "Extreme heat (≥40 °C): Insulin absorption is significantly accelerated due to " +
      "increased peripheral blood flow. Risk of severe hypoglycaemia is elevated. " +
      "Insulin in pens or pumps may degrade rapidly — check for cloudiness or particles. " +
      "Reduce bolus doses by 10-20 % and monitor BG every 1-2 hours."
    );
  }
  if (tempCelsius >= 35) {
    return (
      "Very warm (35-39 °C): Increased subcutaneous blood flow accelerates insulin " +
      "absorption. Hypo risk rises, especially during or after physical activity. " +
      "Consider reducing bolus by 10 % and increasing BG monitoring frequency."
    );
  }
  if (tempCelsius >= 30) {
    return (
      "Warm (30-34 °C): Mild increase in insulin absorption speed expected. " +
      "Stay hydrated — dehydration concentrates blood glucose and can mask hypos. " +
      "Monitor BG more frequently during outdoor activity."
    );
  }
  return "Temperature is within a comfortable range for insulin absorption.";
}

/* ── Cold ─────────────────────────────────────────────── */

export function getColdImpact(tempCelsius: number): string {
  if (tempCelsius <= -10) {
    return (
      "Extreme cold (≤ -10 °C): High risk of insulin crystallisation and pump tubing " +
      "occlusion. Insulin absorption is markedly reduced due to peripheral vasoconstriction. " +
      "Keep insulin close to the body under clothing. Expect delayed bolus action — " +
      "avoid stacking corrections."
    );
  }
  if (tempCelsius <= 0) {
    return (
      "Freezing (0 to -10 °C): Insulin may crystallise if exposed; keep pens/pump " +
      "insulated against the body. Reduced peripheral blood flow slows subcutaneous " +
      "absorption. Bolus onset may be delayed by 15-30 minutes."
    );
  }
  if (tempCelsius <= 5) {
    return (
      "Cold (1-5 °C): Peripheral vasoconstriction can slow insulin absorption. " +
      "Injection sites on extremities (arms, thighs) are most affected. " +
      "Consider abdominal injection sites for more consistent absorption. " +
      "Store insulin pens in an inside pocket to prevent cooling."
    );
  }
  return "Temperature is within a comfortable range for insulin absorption.";
}

/* ── Altitude ─────────────────────────────────────────── */

export function getAltitudeImpact(metres: number): string {
  if (metres >= 3500) {
    return (
      "Very high altitude (≥3 500 m): Insulin sensitivity may increase 20-30 %. " +
      "Acute mountain sickness and its stress hormones can paradoxically raise BG. " +
      "Dehydration risk is severe — fluid needs increase by 1-1.5 L/day. " +
      "Pump users: check for air bubbles caused by reduced atmospheric pressure. " +
      "Reduce basal by 10-20 % once acclimatised, but monitor closely during ascent."
    );
  }
  if (metres >= 2500) {
    return (
      "High altitude (2 500-3 499 m): Insulin sensitivity typically increases 10-20 %. " +
      "Increased respiratory rate and energy expenditure raise glucose utilisation. " +
      "Dehydration risk is significant — drink at least 0.5 L extra per day. " +
      "Consider a 10 % basal reduction and more frequent BG checks."
    );
  }
  if (metres >= 1500) {
    return (
      "Moderate altitude (1 500-2 499 m): Slight increase in insulin sensitivity possible. " +
      "Stay well hydrated and monitor BG if engaging in physical activity. " +
      "No routine dose adjustment needed for most people."
    );
  }
  return "At or near sea level — no altitude-related insulin adjustments expected.";
}

/* ── Travel / timezone ────────────────────────────────── */

export function getTravelImpact(
  direction: "east" | "west" | "none",
  hoursShifted: number,
): string {
  if (direction === "none" || hoursShifted === 0) {
    return "No timezone change — maintain your usual basal and bolus schedule.";
  }

  const abs = Math.abs(hoursShifted);

  if (direction === "east") {
    // Day becomes shorter
    if (abs <= 3) {
      return (
        `Travelling east by ${abs} h: Your day shortens slightly. ` +
        "Shift meal and basal times forward by 1 h per day until aligned. " +
        "You may need slightly less total basal insulin on the travel day."
      );
    }
    return (
      `Travelling east by ${abs} h: Your day is significantly shorter. ` +
      `Reduce the travel-day basal dose by roughly ${Math.round((abs / 24) * 100)} % ` +
      "(proportional to lost hours). Shift meal and injection times progressively — " +
      "adjust by 2-3 h per day. Set alarms for the first 2-3 days. " +
      "Monitor BG every 4-6 hours until your schedule stabilises."
    );
  }

  // West — day becomes longer
  if (abs <= 3) {
    return (
      `Travelling west by ${abs} h: Your day lengthens slightly. ` +
      "You may need an extra snack or small supplementary basal dose. " +
      "Shift schedule back by 1 h per day."
    );
  }
  return (
    `Travelling west by ${abs} h: Your day is significantly longer. ` +
    `You may need roughly ${Math.round((abs / 24) * 100)} % extra basal insulin ` +
    "to cover the additional waking hours. Take an extra meal/snack and bolus " +
    "accordingly. Shift schedule back by 2-3 h per day and monitor every 4-6 hours."
  );
}

/* ── Insulin storage guidance ─────────────────────────── */

export function getInsulinStorageGuidance(tempCelsius: number): string {
  if (tempCelsius < 0) {
    return (
      "DANGER: Insulin must NEVER be frozen. Frozen insulin is permanently damaged — " +
      "crystals destroy the protein structure. Discard any insulin that has been frozen. " +
      "Current temperature is below 0 °C; keep all insulin insulated against the body."
    );
  }
  if (tempCelsius < 2) {
    return (
      "WARNING: Temperature is close to freezing. Unopened insulin should be stored " +
      "at 2-8 °C (standard refrigerator). Ensure your fridge is not set too cold. " +
      "In-use insulin should be kept at room temperature (below 25 °C)."
    );
  }
  if (tempCelsius <= 8) {
    return (
      "Temperature is in the ideal refrigerated storage range (2-8 °C). " +
      "Unopened vials and pens can be stored here until their expiry date. " +
      "Once opened/in-use, insulin can be kept at room temperature (below 25 °C) " +
      "for up to 28 days (check manufacturer guidelines for your specific insulin)."
    );
  }
  if (tempCelsius <= 25) {
    return (
      "Temperature is within the safe room-temperature range for in-use insulin " +
      "(below 25 °C). In-use pens/vials are fine at this temperature for up to 28 days. " +
      "Unopened insulin should still be refrigerated at 2-8 °C."
    );
  }
  if (tempCelsius <= 30) {
    return (
      "WARNING: Temperature exceeds the recommended 25 °C room-temperature limit. " +
      "Insulin degradation accelerates above 25 °C. Use a cooling case or insulated bag. " +
      "In-use insulin may last only 14 days instead of 28 at these temperatures."
    );
  }
  if (tempCelsius <= 40) {
    return (
      "DANGER: Temperature is well above safe storage limits. Insulin will degrade " +
      "significantly. Use an active cooling solution (cool pack, Frio wallet, or " +
      "portable cooler). Inspect insulin before each injection — discard if cloudy, " +
      "discoloured, or containing particles."
    );
  }
  return (
    "CRITICAL: Extreme heat (>40 °C) will rapidly destroy insulin. Insulin left " +
    "in a hot car or direct sunlight can be rendered useless within 1-2 hours. " +
    "Use active refrigeration immediately. Do NOT use insulin that has been exposed " +
    "to these temperatures."
  );
}

/* ── Composite analysis ───────────────────────────────── */

export function analyzeEnvironmentalImpact(
  factors: EnvironmentalFactors,
): EnvironmentalImpact {
  const {
    temperature,
    humidity,
    altitude,
    travelDirection = "none",
    timeZoneShift = 0,
    season,
    uvIndex,
  } = factors;

  /* ---- sensitivity ---- */
  const sensitivityParts: string[] = [];
  if (temperature !== undefined) {
    if (temperature >= 30) sensitivityParts.push("Heat may increase sensitivity by 10-20 %.");
    if (temperature <= 5) sensitivityParts.push("Cold may decrease sensitivity by 10-15 %.");
  }
  if (altitude !== undefined && altitude >= 2500) {
    sensitivityParts.push("High altitude may increase sensitivity by 10-30 %.");
  }
  if (season === "summer") {
    sensitivityParts.push("Summer months are generally associated with increased insulin sensitivity.");
  } else if (season === "winter") {
    sensitivityParts.push("Winter months may slightly reduce insulin sensitivity for some individuals.");
  }
  const insulinSensitivityChange =
    sensitivityParts.length > 0
      ? sensitivityParts.join(" ")
      : "No significant sensitivity changes expected based on current conditions.";

  /* ---- storage warning ---- */
  let insulinStorageWarning: string | null = null;
  if (temperature !== undefined) {
    if (temperature > 25 || temperature < 2) {
      insulinStorageWarning = getInsulinStorageGuidance(temperature);
    }
  }

  /* ---- absorption ---- */
  const absorptionParts: string[] = [];
  if (temperature !== undefined) {
    if (temperature >= 30) absorptionParts.push(getHeatImpact(temperature));
    else if (temperature <= 5) absorptionParts.push(getColdImpact(temperature));
  }
  if (humidity !== undefined && humidity >= 80) {
    absorptionParts.push(
      "High humidity (≥80 %) can compound heat effects and impair sweat evaporation, " +
      "increasing skin temperature at injection sites and further accelerating absorption."
    );
  }
  const absorptionNote =
    absorptionParts.length > 0
      ? absorptionParts.join(" ")
      : "Absorption patterns should be normal under these conditions.";

  /* ---- hydration ---- */
  let hydrationWarning: string | null = null;
  if (temperature !== undefined && temperature >= 30) {
    hydrationWarning =
      "Increase fluid intake by at least 0.5 L above your usual amount. " +
      "Dehydration concentrates blood glucose and impairs insulin delivery.";
  }
  if (altitude !== undefined && altitude >= 2500) {
    const altMsg =
      "Altitude-related dehydration: increase water intake by 0.5-1.5 L/day. " +
      "Dry air at altitude increases insensible fluid losses.";
    hydrationWarning = hydrationWarning ? `${hydrationWarning} ${altMsg}` : altMsg;
  }
  if (humidity !== undefined && humidity >= 80 && temperature !== undefined && temperature >= 28) {
    const humMsg =
      "High humidity reduces sweat evaporation — risk of overheating. " +
      "Drink electrolyte-containing fluids if active for more than 30 minutes.";
    hydrationWarning = hydrationWarning ? `${hydrationWarning} ${humMsg}` : humMsg;
  }

  /* ---- activity adjustment ---- */
  const activityParts: string[] = [];
  if (temperature !== undefined && temperature >= 30) {
    activityParts.push(
      "Reduce exercise intensity by 20-30 % in heat. Schedule activity for cooler " +
      "parts of the day (early morning or evening)."
    );
  }
  if (temperature !== undefined && temperature <= 5) {
    activityParts.push(
      "Cold-weather exercise burns more energy (shivering thermogenesis). " +
      "Consider a pre-exercise snack of 10-15 g carbs. Warm up indoors before heading out."
    );
  }
  if (altitude !== undefined && altitude >= 2500) {
    activityParts.push(
      "Reduce exercise intensity at altitude — VO₂ max drops ~3 % per 300 m above 1 500 m. " +
      "Allow 2-3 days of acclimatisation before strenuous activity."
    );
  }
  if (uvIndex !== undefined && uvIndex >= 6) {
    activityParts.push(
      `UV index is ${uvIndex} (high). Sunburn triggers a stress response that raises BG. ` +
      "Apply sunscreen and limit prolonged direct sun exposure."
    );
  }
  const activityAdjustment =
    activityParts.length > 0
      ? activityParts.join(" ")
      : "No specific activity adjustments needed for current conditions.";

  /* ---- educational note ---- */
  const educationalParts: string[] = [];
  if (travelDirection !== "none" && timeZoneShift > 0) {
    educationalParts.push(getTravelImpact(travelDirection, timeZoneShift));
  }
  educationalParts.push(
    "Environmental factors interact with each other — for example, high altitude " +
    "combined with cold and low humidity has compounding effects on insulin needs. " +
    "Always discuss significant environmental changes with your diabetes team before travel."
  );
  const educationalNote = educationalParts.join(" ");

  return {
    insulinSensitivityChange,
    insulinStorageWarning,
    absorptionNote,
    hydrationWarning,
    activityAdjustment,
    educationalNote,
  };
}
