# Section W (Market Performance) Scoring Rules
**Created:** 2026-01-03
**Status:** APPROVED FOR IMPLEMENTATION

---

## Section W Weight: 6.0%

**Rationale:** Based on existing Section M (Market & Investment) at 8%, Section W focuses on real-time market metrics. A 6% weight balances importance without overwhelming core property metrics.

**Weight Adjustment Required:** Current weights sum to ~103% (documented bug). After adding Section W at 6%, total will be ~109%. Normalization will be applied in smart-score-calculator.ts.

---

## Field Scoring Rules

### Perspective: BUYER-CENTRIC
These scores assume the user is a BUYER evaluating properties. High market interest (views) can indicate desirable properties but also competition.

| Field # | Key | Normalization | Logic | Score Range |
|---------|-----|---------------|-------|-------------|
| 169 | zillow_views | HIGHER_BETTER | More views = market validation | 0-100 relative |
| 170 | redfin_views | HIGHER_BETTER | More views = market validation | 0-100 relative |
| 171 | homes_views | HIGHER_BETTER | More views = market validation | 0-100 relative |
| 172 | realtor_views | HIGHER_BETTER | More views = market validation | 0-100 relative |
| 173 | total_views | HIGHER_BETTER | Sum of 169-172, normalized | 0-100 relative |
| 174 | saves_favorites | HIGHER_BETTER | More saves = desirability | 0-100 relative |
| 175 | market_type | ENUM_RANK | Buyer>Balanced>Seller (buyer benefits from buyer's market) | 100/50/25 |
| 176 | avg_sale_to_list_percent | LOWER_BETTER | Below 100% = buyer leverage | 0-100 (97-103% = neutral) |
| 177 | avg_days_to_pending | HIGHER_BETTER* | More time = less competition for buyer | 0-100 relative |
| 178 | multiple_offers_likelihood | ENUM_RANK | Unlikely>Sometimes>Likely (buyer avoids bidding wars) | 100/60/20 |
| 179 | appreciation_percent | HIGHER_BETTER | Property value growth | 0-100 relative |
| 180 | price_trend | ENUM_RANK | Stable>Falling>Rising (buyer benefits from stable/falling) | 80/100/40 |
| 181 | rent_zestimate | HIGHER_BETTER | Investment potential / offset cost | 0-100 relative |

---

## Detailed Scoring Logic

### Fields 169-173: Portal Views (HIGHER_BETTER)
```
Score = ((value - min) / (max - min)) * 100
```
- Compared RELATIVE to the other 2 properties in comparison
- More views indicates market validation and desirability
- If all values equal: score = 50

### Field 174: Saves/Favorites (HIGHER_BETTER)
```
Score = ((value - min) / (max - min)) * 100
```
- Indicates how many buyers have saved the property
- Higher = more desirable to other buyers

### Field 175: Market Type (ENUM_RANK)
```typescript
const MARKET_TYPE_SCORES = {
  "Buyer's Market": 100,    // Best for buyers
  "Balanced Market": 50,    // Neutral
  "Seller's Market": 25,    // Worst for buyers (competitive)
};
```

### Field 176: Avg Sale-to-List Percent (RANGE_BASED)
```typescript
// Optimal for buyer: sale prices below list
if (value <= 95) return 100;        // Great buyer leverage
if (value <= 97) return 85;         // Good buyer leverage
if (value <= 100) return 70;        // Balanced
if (value <= 102) return 50;        // Slight seller advantage
if (value <= 105) return 30;        // Seller's market
return 15;                          // Extreme seller's market
```

### Field 177: Avg Days to Pending (HIGHER_BETTER for buyer)
```
Score = ((value - min) / (max - min)) * 100
```
- More days = less urgency/competition for buyer
- Faster = more competitive market (worse for buyer)

### Field 178: Multiple Offers Likelihood (ENUM_RANK)
```typescript
const MULTIPLE_OFFERS_SCORES = {
  "Unlikely": 100,        // Best for buyers - no bidding wars
  "Sometimes": 60,        // Moderate risk
  "Likely": 20,           // High competition - worst for buyers
};
```

### Field 179: Appreciation Percent (HIGHER_BETTER)
```
Score = ((value - min) / (max - min)) * 100
```
- Higher appreciation = better investment
- Negative appreciation penalized

### Field 180: Price Trend (ENUM_RANK)
```typescript
const PRICE_TREND_SCORES = {
  "Falling": 100,         // Best for buyers (prices decreasing)
  "Stable": 80,           // Good for buyers (predictable)
  "Rising": 40,           // Worst for buyers (increasing costs)
};
```

### Field 181: Rent Zestimate (HIGHER_BETTER)
```
Score = ((value - min) / (max - min)) * 100
```
- Higher rent potential = better investment metric
- Can offset mortgage costs if buyer rents

---

## Data Sources

| Field | Source | API/Scrape |
|-------|--------|------------|
| 169 zillow_views | Zillow | Scrape |
| 170 redfin_views | Redfin | Scrape |
| 171 homes_views | Homes.com | Scrape |
| 172 realtor_views | Realtor.com | Scrape |
| 173 total_views | CALCULATED | Sum of 169-172 |
| 174 saves_favorites | Portal aggregate | Scrape |
| 175 market_type | Redfin Market Data | API |
| 176 avg_sale_to_list_percent | Redfin | API |
| 177 avg_days_to_pending | Redfin | API |
| 178 multiple_offers_likelihood | Redfin | API |
| 179 appreciation_percent | CALCULATED | (current - last_sale) / last_sale * 100 |
| 180 price_trend | Redfin | API |
| 181 rent_zestimate | Zillow | API |

---

## Integration Notes

1. **Add to SCOREABLE_FIELDS** in `src/lib/smart-score-calculator.ts`
2. **Add normalizers** to `src/lib/normalizations/remaining-sections.ts`
3. **Add weight** to INDUSTRY_WEIGHTS: `'W': 6.0`
4. **Update LLM prompts** to include Section W scoring rules

---

**Document Status:** Ready for implementation
