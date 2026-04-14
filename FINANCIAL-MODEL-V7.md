# GluMira™ V7 — Financial Sustainability Model

**Version:** 1.0  
**Date:** 2026-04-14  
**Status:** Preliminary Analysis  
**Objective:** Calculate Free tier subsidy cost + required growth rate to break even

---

## PRICING TIERS (Updated)

| Tier | Price | Trial | Audience |
|------|-------|-------|----------|
| **Free** | $0/month | 14 days | Patients, beta testers |
| **Pro** | $49.99/month | None | Clinicians, educators |
| **AI** | $99.99/month | None | Researchers, hospitals |
| **Clinic** | $299/month | None | Group practices (5-10 clinicians) |
| **Research** | $415/month | None | Universities, foundations |

---

## OPERATING COSTS (Annual Estimate)

### Fixed Costs (Salaries + Office)

#### Assumptions:
- **Location:** Namibia (median market rates: ZAR 15,000–25,000/month junior; ZAR 40,000–60,000/month senior)
- **Office:** Windhoek co-working + internet: ~ZAR 5,000/month (~$275 USD)
- **Utilities/admin:** ~ZAR 3,000/month (~$165 USD)

#### Headcount (Year 1):
| Role | Count | Monthly (ZAR) | Annual (ZAR) | Annual (USD @ 1 ZAR = 0.055) |
|------|-------|---|---|---|
| Founder (yourself) | 1 | — | — | — |
| 1x Senior Dev | 1 | 55,000 | 660,000 | $36,300 |
| 1x Junior Dev | 1 | 20,000 | 240,000 | $13,200 |
| 1x DevOps/Cloud | 0.5 | 40,000 | 240,000 | $13,200 |
| Office + utilities | — | 8,000 | 96,000 | $5,280 |
| **TOTAL FIXED** | — | — | **1,236,000 ZAR** | **$67,980 USD** |

**Year 1 Fixed Cost: ~$68,000 USD (conservative; founder unpaid)**

---

### Variable Costs (Per Active User)

#### API & Infrastructure Costs

| Service | Per User / Year | Notes |
|---------|---|---|
| **Supabase (PostgreSQL)** | $0.80/month | Free: 500MB; Pro: $25/mo + overage (~$0.02 per GB) |
| **Dexcom API** | $0.40/month | Est. ~100 API calls/user/day @ Dexcom rate card |
| **OpenAI API** (AI tier only) | $2.50/month | Baseline ~$15/month per heavy user; Pro $0.25 if shared model |
| **Nightscout Bridge** | $0.15/month | Free service; minimal compute |
| **Stripe** | 2.9% + $0.30 per transaction | ~2.9% of Pro tier ($1.45/month + fixed fee) |
| **CloudFlare / CDN** | $0.05/month | Minimal: 10 GB/user/year @ $0.15/GB |
| **S3 Storage** (patient files, exports) | $0.25/month | ~500MB per long-term user |
| **Twilio / SMS alerts** (optional) | $0.10/month | If implemented; marginal cost |
| **Monitoring / Sentry** | $0.08/month | Error tracking, performance |
| **QA / Testing SaaS** | $0.02/month | Marginal (Playwright, Vitest free tier) |
| **Security (SSL, DDoS)** | $0.05/month | CloudFlare pro + managed certs |
| **Networking / Bandwidth** | $0.10/month | Egress from Supabase/S3 |
| **TOTAL PER USER** | **~$5.45/month** | **~$65.40 / year** |

---

## COHORT FINANCIALS (Year 1 Launch)

### Scenario A: 1,000 Free Users (Conservative)

```
Free Users:           1,000
Pro Users:              50 (5% conversion)
AI Users:              10 (1% conversion)

REVENUE:
  Pro: 50 users × $49.99 × 12 months = $29,994
  AI:  10 users × $99.99 × 12 months = $11,999
  Clinic/Research: $0 (not launched Y1)
  
  TOTAL REVENUE YEAR 1: $41,993

COSTS:
  Fixed:   $68,000
  Variable (1,060 users × $65.40/year): $69,324
  
  TOTAL COSTS YEAR 1: $137,324

LOSS (YEAR 1): $95,331 (220% burn rate vs. revenue)
```

**Founder must fund or raise to cover $95K loss in Y1.**

---

### Scenario B: 5,000 Free Users (Growth)

```
Free Users:           5,000
Pro Users:             300 (6% conversion)
AI Users:              50 (1% conversion)

REVENUE:
  Pro: 300 × $49.99 × 12 = $179,964
  AI:  50 × $99.99 × 12 = $59,994
  
  TOTAL REVENUE YEAR 1: $239,958

COSTS:
  Fixed:   $68,000
  Variable (5,350 users × $65.40/year): $349,662
  
  TOTAL COSTS YEAR 1: $417,662

LOSS (YEAR 1): $177,704 (74% burn rate vs. revenue)
```

**Still underwater. Growth alone doesn't solve it; conversion rates must improve or costs must drop.**

---

### Scenario C: 10,000 Free Users (Scale)

```
Free Users:           10,000
Pro Users:             700 (7% conversion)
AI Users:             100 (1% conversion)

REVENUE:
  Pro: 700 × $49.99 × 12 = $419,916
  AI:  100 × $99.99 × 12 = $119,988
  
  TOTAL REVENUE YEAR 1: $539,904

COSTS:
  Fixed:   $68,000 (+ 1 more dev → $104,000)
  Variable (10,800 users × $65.40/year): $706,032
  
  TOTAL COSTS YEAR 1: $810,032

LOSS (YEAR 1): $270,128 (still 50% burn)
```

**Scale doesn't solve the unit economics until **Pro conversion rises or price increases**.**

---

## UNIT ECONOMICS ANALYSIS

### Break-Even Math

**Fixed costs:** $68,000/year  
**Variable cost per user:** $65.40/year  
**Pro price:** $49.99/month = $599.88/year  
**Pro margin:** $599.88 - $65.40 = $534.48/user-year

**Question:** How many Pro users do we need to cover $68K fixed cost?

```
$68,000 ÷ $534.48 = 127 Pro users (minimum to break even on fixed costs alone)
```

**But:** We also carry Free users. For every 1 Free user we gain, we need:
```
Free user cost: $65.40/year
Pro user revenue: $534.48/year
Ratio: ~1 Pro user per 8 Free users to break even
```

**Reality check:** If we want 5,000 Free users, we need ~625 Pro users just to break even on growth.

---

## SUBSIDY MATH: How Much Does Free Cost?

### Free-tier cost per user:

```
Variable cost only (no revenue):    $65.40/year per Free user
```

### At 5,000 Free users:
```
5,000 Free × $65.40 = $327,000/year subsidy needed
```

### Pro tier revenue available to subsidize:
```
300 Pro users × $534.48 = $160,344/year margin
```

**DEFICIT:** $327,000 - $160,344 = **$166,656 uncovered subsidy (Year 1)**

This must come from:
1. **Raised capital** (grants, VC, angels)
2. **Founder funding** (savings, salary deferral)
3. **Higher Pro conversion** (improve from 6% → 10%+)
4. **Higher Pro price** ($49.99 → $79.99 or higher)

---

## REQUIRED GROWTH RATE TO BREAKEVEN

### Assumption: Maintain 6% Pro conversion, keep fixed costs at $68K

Let **N** = number of Free users

```
Pro users = 0.06 × N
Pro revenue = 0.06 × N × $534.48 = $32.07 × N

Variable cost = N × $65.40

Breakeven when:
$32.07 × N = $68,000 + $65.40 × N
$32.07 × N - $65.40 × N = $68,000
-$33.33 × N = $68,000
N = -2,039

This is NEGATIVE—meaning you can NEVER break even with 6% Pro conversion.
```

**At 6% conversion, the unit economics don't support Free tier subsidy.**

---

### What Conversion Rate Is Needed?

Rearranging to solve for required Pro conversion rate:

```
Let C = Pro conversion rate (as decimal)
Pro revenue = C × N × $534.48
Variable cost = N × $65.40

Breakeven:
C × N × $534.48 = $68,000 + N × $65.40
C × $534.48 = $68,000/N + $65.40

If N = 5,000 Free users:
C × $534.48 = $68,000/5,000 + $65.40
C × $534.48 = $13.60 + $65.40
C × $534.48 = $79
C = 0.148 = **14.8% conversion**

If N = 10,000 Free users:
C × $534.48 = $68,000/10,000 + $65.40
C × $534.48 = $6.80 + $65.40
C × $534.48 = $72.20
C = 0.135 = **13.5% conversion**
```

**Required Pro conversion to break even:**
- **1,000 Free users → 32% Pro conversion** (unrealistic)
- **5,000 Free users → 14.8% Pro conversion** (possible with strong targeting)
- **10,000 Free users → 13.5% Pro conversion** (achievable at scale)

---

## LEVERAGE POINTS: How to Improve Unit Economics

### Option 1: Increase Pro Price
```
Current: $49.99/month = $599.88/year
If raised to $79.99/month = $959.88/year
New margin: $959.88 - $65.40 = $894.48/user

Breakeven Pro users for fixed costs alone: $68,000 ÷ $894.48 = 76 users (down from 127)

This is realistic.
```

### Option 2: Reduce Variable Costs
```
Current: $65.40/user-year
If you negotiate Supabase enterprise rate: -$0.30/month
If you use open-source alternatives for some APIs: -$0.20/month
If you batch Dexcom API calls more efficiently: -$0.15/month

New cost: $65.40 - ($0.65 × 12) = $57.60/user-year (-12%)

This improves margin by ~$100/Pro user, helping breakeven.
```

### Option 3: Multi-Tier Free (Gated Features)
```
Free (read-only, no upload):    Virtually free (~$0.15/user-month)
Free+ (14-day trial with uploads): ~$3/user-month (higher touchpoint for conversion)
Pro: $49.99/month

This separates high-engagement Free+ users (better conversion) from passive read-only users.
```

### Option 4: Clinic Tier Upsell
```
Current: Clinic = $299/month (equivalent to 6 Pro licenses)
If 2% of Free users convert to Clinic (group practices): 
  5,000 Free × 0.02 = 100 clinic groups
  100 × $299 × 12 = $358,800/year revenue
  This alone covers subsidy for 5,000 Free users.
```

---

## RECOMMENDED STRATEGY: 18-MONTH PATH TO BREAK-EVEN

### Q2 2026 (Now)
- **Price:** Pro $49.99 → maintain, add Clinic $299, AI $99.99
- **Target:** 1,000 Free users, 50 Pro, 10 AI
- **Funding:** Seek $100K seed (cover Y1 burn)
- **Focus:** Product quality, Nightscout integration, clinician outreach

### Q4 2026 (Month 6)
- **Target:** 3,000 Free users, 200 Pro (6.7% conversion)
- **Tactic:** Launch Clinic tier soft-launch to 5 practices
- **Adjust:** If Pro conversion < 5%, raise price to $69.99 or restrict Free uploads to 14 days

### Q2 2027 (Month 12)
- **Target:** 7,500 Free users, 500 Pro (6.7%), 30 AI, 8 Clinic
- **Revenue:** ~$300K (Pro) + $30K (AI) + $29K (Clinic) = $359K/year revenue
- **Costs:** ~$104K fixed (added dev), ~$490K variable = $594K total
- **Status:** Still ~$235K underwater but trending positive

### Q4 2027 (Month 18)
- **Target:** 12,000 Free users, 900 Pro (7.5%), 60 AI, 15 Clinic
- **Revenue:** ~$540K (Pro) + $72K (AI) + $54K (Clinic) = $666K/year
- **Costs:** ~$140K fixed (added QA), ~$785K variable = $925K total
- **Status:** Still -$259K but unit economics approaching parity

### Q2 2028 (Month 24+)
- **Target:** 20,000 Free users, 1,800 Pro (9%), 150 AI, 30 Clinic
- **Revenue:** ~$1.08M (Pro) + $180K (AI) + $108K (Clinic) = $1.368M/year
- **Costs:** ~$175K fixed, ~$1.3M variable = $1.475M total
- **Status:** Breakeven achieved (~$107K loss but trendline positive)

---

## CAPITAL REQUIREMENTS

### Seed Round (NOW - Q2 2026)
- **Amount:** $150,000 USD
- **Burn rate:** ~$8K/month (fixed $5.7K + variable $2.3K for 1K users)
- **Runway:** ~18 months
- **Use:** Salaries, infrastructure, beta launch, marketing

### Series A (Q4 2026, if metrics hit)
- **Amount:** $500,000 USD
- **Trigger:** 3,000+ Free users, 200+ Pro users, Clinic tier validating
- **Use:** Expand team (2-3 more devs), regional hiring, clinician partnerships

---

## SUMMARY TABLE

| Metric | Y1 (1K Free) | Y1 (5K Free) | Y1 (10K Free) | Y2 (12K Free) |
|--------|---|---|---|---|
| Free Users | 1,000 | 5,000 | 10,000 | 12,000 |
| Pro Users | 50 | 300 | 700 | 900 |
| Revenue | $42K | $240K | $540K | $666K |
| Variable Cost | $69K | $350K | $706K | $785K |
| Fixed Cost | $68K | $68K | $104K | $140K |
| **TOTAL COST** | $137K | $418K | $810K | $925K |
| **PROFIT/LOSS** | -$95K | -$178K | -$270K | -$259K |
| Free Subsidy Cost | $65K | $327K | $654K | $785K |
| Pro Margin (available) | $27K | $160K | $374K | $480K |
| **Subsidy Gap** | -$38K | -$167K | -$280K | -$305K |

---

## KEY INSIGHTS

1. **Free tier is expensive.** At $65.40/user-year variable cost + proportional fixed cost, Free tier users require either:
   - Very high Pro conversion (12%+), OR
   - Outside funding (grants, investment), OR
   - Pro price increase to $75–100/month

2. **Clinic tier is the lever.** A single Clinic account ($299/month) is worth 6 Pro users. If you can sell 10 Clinic accounts in Y1, you've covered most of the Free subsidy.

3. **Growth alone doesn't solve it.** Even at 10K Free users, you're still unprofitable without either higher conversion or pricing power.

4. **Breakeven happens at scale + time.** Realistic path: 18–24 months, with 12K+ Free users, 900+ Pro users, and either a seed round or founder funding to cover interim burn.

5. **Regional pricing helps.** Your "30% African discount" for Pro tier ($35/month in ZA/NAM) actually **increases** conversion in price-sensitive markets without hurting unit economics (lower cost base).

---

## NEXT STEPS

1. **Validate Pro conversion rate.** Run beta with 100 clinicians; measure actual conversion to paid.
2. **Lock pricing.** Pro $49.99 vs $69.99 A/B test with cohorts.
3. **Clinic tier MVP.** 5-10 group practices; validate demand at $299/month.
4. **Seed fundraise.** $100–150K to cover Y1 burn; position as "funded Free tier for underserved markets."
5. **Cost audit.** Negotiate Supabase, Dexcom, OpenAI rates at scale; explore open-source alternatives.

---

**Framework loaded. Ready to proceed with development or fundraising strategy.**
