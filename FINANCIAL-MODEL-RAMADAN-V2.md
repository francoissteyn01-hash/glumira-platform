# GluMira™ V7 — Sustainable Founder-Funded Model
## Ramadan Entry Point + Capped Free Tier

**Version:** 2.0  
**Date:** 2026-04-14  
**Status:** Founder-Funded Roadmap (Keep Day Job)  
**Objective:** Revenue model where **founder keeps day job**, GluMira generates side income from Day 1

---

## KEY CONSTRAINT: NO BANKRUPTCY

**Founder keeps day job.** GluMira runs as a side project. All development is unpaid (founder time). Revenue flows directly to infrastructure costs; profitability is secondary to sustainability.

**Math principle:** Cost per user must be < revenue per user, even at small scale.

---

## THE MARKET OPPORTUNITY: RAMADAN T1D

### Why Ramadan?

- **50 million Muslims with T1D fast during Ramadan** every year (IDF 2025)
- **43% of T1D patients in Muslim-majority regions attempt Ramadan despite medical risk** (Almalki et al.)
- **Most are underserved:** No CGM, no pump, old insulin regimens
- **Acute pain point:** Hyperglycemia spikes after Iftar/Suhoor (51.2% at 2h post-Iftar)
- **Seasonal urgency:** Every Ramadan = marketing event built into calendar
- **Language barrier:** Few tools in Arabic, Persian, Urdu, Malay

### Market Size

| Region | T1D Population | % Who Fast | Addressable |
|--------|---|---|---|
| **Saudi Arabia** | 223,000 | 43% | 95,890 |
| **Egypt** | 192,000 | 43% | 82,560 |
| **UAE** | ~40,000 (est) | 43% | 17,200 |
| **Indonesia** | ~150,000 (est) | 43% | 64,500 |
| **EMRO Total** | ~1.2M | 43% | **~516,000** |

**Conservative TAM:** 100,000–150,000 Ramadan-specific users globally (in Year 1)

---

## UPDATED PRICING TIERS

### The Funnel: Ramadan → Pro → AI

| Tier | Price | Access | Target | Ramadan Feature |
|------|-------|--------|--------|---|
| **Free (Ramadan-only)** | $0/month | 14-day trial, capped 500 slots | Beta testers, patients | Fasting glucose monitoring, Iftar/Suhoor timing tool |
| **Pro** | $49.99/month | Post-trial, or Nightscout owners | Clinicians, engaged patients | All Free + Nightscout CGM live sync |
| **AI** | $99.99/month | Post-trial, premium | Dexcom/Libre users, researchers | Live Dexcom integration + predictive hypo/hyper alerts |

### Why This Works

**Free tier (capped at 500):**
- Solves the scarcity problem: slots fill up, users feel urgency to convert
- Ramadan is time-bounded (30 days); most free users naturally leave after Ramadan ends
- No long-term subsidy burden
- Generates testimonials ("I used GluMira for Ramadan and didn't have a hypo episode")

**Pro tier (Nightscout power users):**
- Nightscout users are **already engaged, already paying for pumps/CGM**
- They understand APIs, data sync, and will pay for peace of mind
- Nightscout community is tight-knit and vocal → word-of-mouth conversion

**AI tier (Dexcom live):**
- Dexcom Share + Clarity users are **actively paying consumers** ($500–1500/year for devices)
- Real-time predictive alerts ("You'll go low in 15 minutes during Iftar, adjust now") = must-have
- Higher AOV = higher margin per user

---

## FINANCIAL MODEL: YEAR 1 (Keep Day Job)

### Operating Costs

#### Fixed (Minimal)
```
Founder salary:        $0 (you keep day job)
Office/utilities:      $0 (work from home)
Infrastructure/admin:  ~$100/month for hosting, domain, monitoring
                       = $1,200/year

TOTAL FIXED: $1,200/year
```

#### Variable (Per Active User)

| Service | Cost/User/Year |
|---------|---|
| Supabase PostgreSQL | $0.80 |
| Dexcom API (Pro/AI only) | $0.40 (Pro/AI = 10% of users) |
| OpenAI (AI tier only) | $2.50 (AI = 2% of users) |
| Nightscout bridge | $0.15 |
| Stripe (2.9% + $0.30 per transaction) | $1.50 (Pro/AI only) |
| CloudFlare/CDN | $0.05 |
| S3 storage | $0.20 |
| Monitoring/logging | $0.05 |
| **Total per user** | **$5.65/year** |

---

## SCENARIO A: Conservative Year 1 (Bootstrap)

### Assumptions
- Free users: 500 (capped, Ramadan-only cohort)
- Pro users: 40 (8% of free → paid conversion)
- AI users: 5 (12.5% of Pro → AI conversion)
- Average session length: 30 days (Ramadan duration)

### Revenue
```
Pro users: 40 × $49.99 × 12 months    = $23,988
AI users:  5 × $99.99 × 12 months     = $5,999

TOTAL REVENUE YEAR 1: $29,987
```

### Costs
```
Fixed:     $1,200
Variable:  545 users × $5.65/year     = $3,079

TOTAL COSTS YEAR 1: $4,279
```

### **PROFIT YEAR 1: $25,708**

**You now have $25K to reinvest or pocket. Game-changer.**

---

## SCENARIO B: Moderate Year 1 (Active Marketing)

### Assumptions
- Free users: 2,000 (expanded beyond Ramadan, year-round)
- Pro users: 180 (9% conversion)
- AI users: 20 (11% of Pro → AI)
- Clinic tier (new): 2 group practices at $299/month

### Revenue
```
Pro users:   180 × $49.99 × 12  = $107,964
AI users:    20 × $99.99 × 12   = $23,988
Clinic:      2 × $299 × 12      = $7,176

TOTAL REVENUE YEAR 1: $139,128
```

### Costs
```
Fixed:      $1,200
Variable:   2,200 users × $5.65  = $12,430

TOTAL COSTS YEAR 1: $13,630
```

### **PROFIT YEAR 1: $125,398**

**You have $125K in year-one profit. Invest in:**
- 1 contractor dev ($20K)
- Marketing/outreach ($40K)
- Clinic tier expansion ($30K)
- Seed runway ($35K reserve)

---

## SCENARIO C: Aggressive Year 1 (Ramadan viral + regional outreach)

### Assumptions
- Free users: 5,000 (viral in MENA region during Ramadan)
- Pro users: 500 (10% conversion)
- AI users: 75 (15% of Pro → AI)
- Clinic tier: 8 groups
- Regional expansion: Arabic/Urdu localization drives adoption

### Revenue
```
Pro users:   500 × $49.99 × 12   = $299,940
AI users:    75 × $99.99 × 12    = $89,991
Clinic:      8 × $299 × 12       = $28,704

TOTAL REVENUE YEAR 1: $418,635
```

### Costs
```
Fixed:      $1,200
Variable:   5,575 users × $5.65  = $31,499

TOTAL COSTS YEAR 1: $32,699
```

### **PROFIT YEAR 1: $385,936**

**You have $386K year-one profit. Now you can:**
- Hire 2 full-time devs ($60K)
- Regional partnerships (Nightscout Arabia, IslamicMed, etc.) ($50K)
- Series Seed fundraise ($100K) to accelerate
- Keep $176K as operating reserve

---

## THE CONVERSION FUNNEL: FROM RAMADAN TO STICKY PAID USERS

```
Ramadan Free Cohort (500 → 5,000):
  ↓
  [During Ramadan]
  "I stayed safe without hypos for 30 days"
  Testimonial → word-of-mouth in communities
  ↓
  [Post-Ramadan]
  "I want to keep using this for my Nightscout"
  → Upgrade to Pro ($49.99/month)
  ↓
  [Month 3+]
  "I need real-time Dexcom alerts, not just history"
  → Upgrade to AI ($99.99/month)
  ↓
  [Clinicians join]
  "I have 5 patients asking about this"
  → Clinic tier ($299/month per group)
```

**Key insight:** Ramadan is your **product launch event**. Every Ramadan, you get a natural marketing wave.

---

## YEAR 2 & BEYOND: Sustainable Growth

### Year 2 Projections (Conservative)

**Active users grow 3x (retention + new markets):**
- Free (seasonal): 8,000 (Ramadan + non-Muslim markets)
- Pro: 1,200 (12% conversion from Free)
- AI: 240 (20% conversion from Pro)
- Clinic: 20 groups

```
Revenue:  (1,200 × $599.88) + (240 × $1,199.88) + (20 × $3,588)
        = $719,856 + $287,972 + $71,760
        = $1,079,588

Costs:    $1,200 (fixed) + 9,440 × $5.65 (variable)
        = $1,200 + $53,336
        = $54,536

PROFIT: $1,025,052
```

**At this scale, you can:**
- Hire a small team (3–4 devs, 1 product manager)
- Consider seed/Series A fundraising
- Expand to other chronic conditions (T2D, gestational diabetes)
- Open regional offices (Dubai, Cairo, Jakarta)

---

## AVOIDING THE BANKRUPTCY TRAP

### Rule 1: Variable Costs Must Stay Low
- Use Supabase free tier as long as possible (no custom infra)
- Negotiate Dexcom API volume pricing at scale ($0.40 → $0.20)
- Open-source as much as possible (no proprietary cloud)

### Rule 2: Revenue Must Be Immediate
- Free tier is gated (500 slots) → drives Pro conversion velocity
- Ramadan urgency → 30-day trial window → converts or churn
- No subsidizing free users = all growth is profitable

### Rule 3: Founder Sustainability
- You keep your day job = all GluMira revenue is profit/reinvestment
- No pressure to raise VC (keep equity, keep control)
- Scale on your timeline, not investor's timeline

### Rule 4: Seasonal Tailwinds
- Ramadan (annual) + other health observances (Lent, Yom Kippur, etc.)
- Off-season → focus on product, partnerships, localization
- Each season = new marketing push, new cohort

---

## STRATEGIC PIVOTS (IF NEEDED)

### If Ramadan Conversion is Lower Than 8%
- Pivot to **Enterprise Clinic sales** (higher AOV)
- Target pediatric diabetes camps (seasonal)
- License data to research institutions

### If Pro Adoption Is Slow
- Drop Pro to $29.99/month (lower friction)
- Bundle with Nightscout plugins (co-marketing)
- Offer annual discount: $499/year vs. $600 monthly

### If AI Tier Doesn't Take Off
- Fold AI features into Pro at higher price ($69.99)
- Position as "optional AI add-on" for Pro users

---

## FINANCIAL SUMMARY TABLE

| Metric | Conservative | Moderate | Aggressive |
|--------|---|---|---|
| **Free Users** | 500 | 2,000 | 5,000 |
| **Pro Users** | 40 | 180 | 500 |
| **AI Users** | 5 | 20 | 75 |
| **Revenue Y1** | $30K | $139K | $419K |
| **Costs Y1** | $4.3K | $13.6K | $32.7K |
| **Profit Y1** | **$25.7K** | **$125.4K** | **$385.9K** |
| **Founder Salary** | $0 | $0 | $0 |
| **Reinvestment Budget** | $25K | $80K | $250K |

---

## 90-DAY ACTION PLAN (April–June 2026)

### Month 1: Build Ramadan MVP
- [ ] Finish Dashboard V2 with Iftar/Suhoor time calculator
- [ ] Add "Fasting glucose trend" view (stripped-down version of Pro)
- [ ] Localize to Arabic (hire translator, ~$2K)
- [ ] Set up Clinic tier infrastructure (Stripe, billing)

### Month 2: Beta Launch (500 slots)
- [ ] Announce to Nightscout community (Reddit, forum, Discord)
- [ ] Post on T1D Facebook groups (JDRF, ADA, regional)
- [ ] Reach out to 10 endocrinologists for testimonials
- [ ] Start collecting Ramadan cohort data (for research)

### Month 3: Convert & Expand
- [ ] Track free → Pro conversion rate
- [ ] Onboard 10 Clinic beta sites
- [ ] Plan Year 2 (other locales, other observances)

---

## RAMADAN MARKETING ANGLES

1. **"Safe Fasting for Type 1"** — the only tool built specifically for Ramadan T1D
2. **"Arabic + Urdu + Malay"** — culturally aware, not English-first
3. **"Research-backed dosing"** — cite IDF-DAR guidelines, Plank PK data
4. **"Clinician-approved"** — testimonials from endos in UAE, Saudi, Egypt
5. **"Seasonal, not forever"** — psychological permission to try ("just for Ramadan")

---

## THE PLAY: CAPTURE BEFORE OTHERS NOTICE

Ramadan 2026 is **in 6 weeks** (ends April 19). If you launch Ramadan MVP by mid-April, you capture the **tail end of this year's cohort** + generate word-of-mouth for **next year's Ramadan (2027, March 31–April 29)**.

By then, you'll have:
- Proof of product-market fit (testimonials, conversion data)
- Regional partnerships (Nightscout Arab communities)
- A year of retention data to present to investors
- $100K+ in profit to self-fund growth

**Competitive advantage:** You're the ONLY tool purpose-built for Ramadan T1D. By next Ramadan, there will be imitators. Move now.

---

## NEXT STEPS

1. **Confirm:** Are you all-in on Ramadan pivot?
2. **Design:** Should Ramadan MVP be a separate app or integrated into main dashboard?
3. **Localization:** Who will handle Arabic/Urdu/Malay copy + cultural sensitivity review?
4. **Partnerships:** Should we reach out to Nightscout Arab community now or after MVP?

---

**Framework locked. Ready to build.**
