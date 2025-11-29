# CLUES Property Dashboard

110-Field Real Estate Intelligence Platform built for the CLUES Quantum Master App.

## Features

- **110-Field Property Schema** - Complete property data with confidence tracking
- **Multi-LLM Scraping** - Claude, GPT, Grok, Gemini support with hybrid mode
- **5D Glassmorphic UI** - Ultra-modern mobile-first design
- **Standalone + Nested** - Works independently or embedded in CLUES Quantum
- **PostgreSQL Backend** - Full database with Prisma ORM
- **Mobile Ready** - Capacitor configured for iOS/Android

## Quick Start

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Start development server
npm run dev
```

## Environment Setup

Copy `.env.example` to `.env.local` and configure.

### API Keys We Have (Configured in Vercel)

| API | Env Variable | Status |
|-----|--------------|--------|
| **Google Maps** | `GOOGLE_MAPS_API_KEY` | HAVE |
| **WalkScore** | `WALKSCORE_API_KEY` | HAVE |
| **AirNow** | `AIRNOW_API_KEY` | HAVE |
| **FBI Crime** | `FBI_CRIME_API_KEY` | HAVE |
| **SchoolDigger** | `SCHOOLDIGGER_APP_ID` | HAVE |
| **SchoolDigger** | `SCHOOLDIGGER_API_KEY` | HAVE |
| **Weather.com** | `WEATHER_API_KEY` | HAVE |
| **Anthropic** | `ANTHROPIC_API_KEY` | HAVE |
| **OpenAI** | `OPENAI_API_KEY` | HAVE |
| **Perplexity** | `PERPLEXITY_API_KEY` | HAVE |
| **Google AI** | `GOOGLE_AI_API_KEY` | HAVE |
| **xAI** | `XAI_API_KEY` | HAVE |
| **HowLoud** | `HOWLOUD_API_KEY` | HAVE |

### Free APIs (No Key Needed)

| API | Notes |
|-----|-------|
| **FEMA Flood** | Public ArcGIS endpoint |
| **Open-Meteo** | Weather fallback |
| **FL Local Crime** | ArcGIS public data (7 counties) |

### APIs We Still Need

| API | Env Variable | Purpose |
|-----|--------------|---------|
| **HUD FMR** | `HUD_API_KEY` | NEED | Free - register at huduser.gov |
| **AirDNA** | `AIRDNA_API_KEY` | NEED | STR rental estimates |


### Data Sources That Need Code Fixes

| Source | Issue | Priority |
|--------|-------|----------|
| Zillow Scraper | Anti-bot blocking likely | HIGH |
| Redfin Scraper | Anti-bot blocking likely | HIGH |
| Realtor.com Scraper | May work via autocomplete API | MEDIUM |
| HowLoud API | Endpoint may require partnership | LOW |
| FCC Broadband | Endpoint URL needs verification | LOW |

```bash
# All configured in Vercel
DATABASE_URL="postgresql://..."
ANTHROPIC_API_KEY="..."
OPENAI_API_KEY="..."
PERPLEXITY_API_KEY="..."
GOOGLE_AI_API_KEY="..."
XAI_API_KEY="..."
GOOGLE_MAPS_API_KEY="..."
WALKSCORE_API_KEY="..."
AIRNOW_API_KEY="..."
FBI_CRIME_API_KEY="..."
SCHOOLDIGGER_APP_ID="..."
SCHOOLDIGGER_API_KEY="..."
WEATHER_API_KEY="..."
HOWLOUD_API_KEY="..."
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:studio` | Open Prisma Studio |
| `npm run cap:sync` | Sync with Capacitor |
| `npm run cap:android` | Open Android Studio |

## Architecture

```
app/
├── src/
│   ├── components/     # UI components
│   │   ├── ui/         # Base components
│   │   ├── property/   # Property-specific
│   │   └── layout/     # Layout components
│   ├── pages/          # Route pages
│   ├── hooks/          # Custom hooks
│   ├── lib/            # Utilities, bridge
│   ├── api/            # API clients
│   ├── store/          # Zustand store
│   ├── types/          # TypeScript types
│   └── styles/         # Global CSS
├── prisma/             # Database schema
└── public/             # Static assets
```

## CLUES Integration

The dashboard can run:

1. **Standalone** - Full independent app
2. **Nested in CLUES Quantum** - Embedded via iframe with bridge communication

The `clues-bridge.ts` module handles parent-child communication:

```typescript
import { useCluesBridge } from '@/lib/clues-bridge';

function MyComponent() {
  const { isNested, syncProperty } = useCluesBridge();

  // Sync property to parent app
  syncProperty('property-123', propertyData);
}
```

## Mobile Build

```bash
# Build web assets
npm run build

# Sync with native projects
npx cap sync

# Open in Android Studio
npx cap open android

# Or run directly
npx cap run android
```

## Deployment

### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Environment Variables on Vercel

Add secrets in Vercel dashboard:
- `database_url`
- `anthropic_api_key`
- `openai_api_key`

---

## CLUES Brand Color System

### Two Distinct Color Systems

To avoid confusion between "this property is green" vs "this score is good (green)", we use two separate color palettes:

#### 1. INDEX COLORS (5-tier rating scale for scored metrics)

Used for crime, safety, risk, quality scores, school ratings, etc.

| Score Range | Color | Hex | Meaning |
|-------------|-------|-----|---------|
| 0-20 | RED | `#EF4444` | Bad/Poor |
| 21-40 | ORANGE | `#F97316` | Fairly Bad |
| 41-60 | YELLOW | `#EAB308` | Neutral |
| 61-80 | BLUE | `#3B82F6` | Fairly Good |
| 81-100 | GREEN | `#22C55E` | Good/Excellent |

#### 2. PROPERTY COLORS (for identifying comparison properties)

Used to distinguish Property 1, Property 2, Property 3 in comparison views.

| Property | Color | Hex | Name |
|----------|-------|-----|------|
| P1 | Emerald | `#10B981` | Distinct from index green |
| P2 | Cyan | `#00D9FF` | Distinct from index blue |
| P3 | Purple | `#A855F7` | Not in index at all |

### Color System Usage

```typescript
import { getIndexColor, getPropertyColor, INDEX_COLORS, PROPERTY_COLORS } from '@/components/perplexity/chartColors';

// Get color for a score (0-100)
const color = getIndexColor(85); // Returns GREEN object
const hexColor = getIndexColor(85).hex; // "#22C55E"

// Get color for a property by index
const propColor = getPropertyColor(0); // Returns P1 (Emerald)
```

---

## Score Normalization System

### The Problem

Different APIs and data sources use different scales and conventions:
- Some use 0-100 where 100 = best (Walk Score)
- Some use 0-100 where 100 = worst (some crime indexes)
- Some use 1-10 (GreatSchools, Flood Factor)
- Some use categorical (FEMA flood zones: X, AE, VE)
- Some use measurements (AQI: 0-500, Noise: 30-90 dB)

### The Solution

All external scores are normalized to CLUES 0-100 scale where **HIGHER = BETTER**.

### Verified Metric Mappings

#### HIGHER = GOOD (No Inversion Needed)

| Metric | Source | Native Scale | Notes |
|--------|--------|--------------|-------|
| **Walk Score** | walkscore.com | 0-100 | 90-100 = "Walker's Paradise" |
| **Transit Score** | walkscore.com | 0-100 | 90-100 = "Excellent Transit" |
| **Bike Score** | walkscore.com | 0-100 | 90-100 = "Biker's Paradise" |
| **HowLoud Soundscore** | howloud.com | 50-100 | 100 = QUIET, 50 = Loud |
| **GreatSchools Rating** | greatschools.org | 1-10 | 10 = Best school |
| **NeighborhoodScout Crime** | neighborhoodscout.com | 0-100 | 100 = SAFEST |

#### HIGHER = BAD (Needs Inversion)

| Metric | Source | Native Scale | CLUES Conversion |
|--------|--------|--------------|------------------|
| **AQI** | EPA/AirNow | 0-500 | 0-50=95, 51-100=75, 101-150=55, 151-200=35, 201-300=15, 301+=5 |
| **First Street Flood Factor** | firststreet.org | 1-10 | 1=Minimal->100, 10=Extreme->10 |
| **Noise Level (dB)** | Various | 30-90 dB | 30dB->100, 90dB->0 |

#### CATEGORICAL (Needs Conversion)

| Metric | Categories | CLUES Score |
|--------|-----------|-------------|
| **FEMA Flood Zone** | X (unshaded) | 95 |
| | X (shaded) / B | 70 |
| | A / AE / AH / AO | 35 |
| | V / VE | 15 |
| | D (undetermined) | 50 |
| **Risk Levels** | NONE / MINIMAL | 95 |
| | LOW | 80 |
| | MODERATE | 55 |
| | HIGH | 30 |
| | SEVERE / EXTREME | 10 |

#### CONTEXT-DEPENDENT (Not pure good/bad)

| Metric | Notes |
|--------|-------|
| **Cap Rate** | Higher = more return BUT more risk. Not simple good/bad. |
| **HOA Fees** | Depends on amenities. High fee != bad if justified. |
| **Property Tax Rate** | Regional context matters. |

### Score Normalization Usage

```typescript
import {
  normalizeWalkScore,
  normalizeAQI,
  normalizeFloodFactor,
  normalizeFEMAFloodZone,
  normalizeSchoolRating,
  normalizeScore // Master function
} from '@/utils/scoreNormalization';

// Individual functions
const walkClues = normalizeWalkScore(85);        // -> 85 (no change)
const aqiClues = normalizeAQI(75);               // -> 75 (moderate)
const floodClues = normalizeFloodFactor(8);      // -> 22 (high risk -> low score)
const schoolClues = normalizeSchoolRating(9);    // -> 90

// Master function with type
const score = normalizeScore(75, 'aqi');         // -> 75
const score2 = normalizeScore('AE', 'femaFloodZone'); // -> 35
```

### Official Data Sources

- Walk Score: https://www.walkscore.com/methodology.shtml
- HowLoud Soundscore: https://howloud.com/soundscore/
- EPA AQI: https://www.airnow.gov/aqi/aqi-basics/
- NeighborhoodScout Crime: https://help.neighborhoodscout.com/support/solutions/articles/25000001997
- FEMA Flood Zones: https://www.fema.gov/about/glossary/flood-zones
- GreatSchools: https://www.greatschools.org/gk/about/ratings/
- First Street Flood Factor: https://help.firststreet.org/hc/en-us/articles/360047585694
- Cap Rates: https://www.jpmorgan.com/insights/real-estate/commercial-term-lending/cap-rates-explained

---

## Chart Categories (48 Charts in Perplexity Analytics)

| Category | Name | Charts |
|----------|------|--------|
| A | Address & Identity | Pin Cluster Orbs, Identity Matrix, Geo Density Heat |
| B | Pricing & Value | Value Gap Funnel, Price/Sqft Violin, Triple Gauge |
| C | Property Basics | Room Sunburst, Space Efficiency Scatter, Layout Bars |
| D | HOA & Taxes | Cost Donut, HOA Heatmap, Tax Scatter |
| E | Structure & Systems | Systems Radar, Age Condition Trend, Replacement Bars |
| F | Interior Features | Amenity Heatmap, Finish Index Bar, Interior Uplift |
| G | Exterior Features | Feature Matrix, Curb Appeal Radar, Outdoor ROI Bubbles |
| H | Permits & Renovations | Renovation Timeline, Value Add Bars, Compliance Gauge |
| I | Assigned Schools | School Tripod, Family Score Radial, School Tier Heatmap |
| J | Location Scores | Excellence Spider, 9-Gauge Cluster, Location Yield Scatter |
| K | Distances & Amenities | Commute Compass, Access Tiles, Proximity Price Scatter |
| L | Safety & Crime | Crime Gauge Trio, Safety Yield Scatter, Crime Heat Row |
| M | Market & Investment | ROI Highway, Cap Appreciation Bubbles, Market Pulse Timeline |
| N | Utilities & Connectivity | Utility Spectrum Donut, Connectivity Luxury Scatter, Utility Expense Bars |
| O | Environment & Risk | Risk Constellation, Risk Reward Matrix, Environment Gauges |
| P | Additional Features | Feature Mosaic, Premium Index Bar, Feature Uplift Violin |

---

## Important Rules for AI/LLM Development

1. **Always use INDEX colors for scored metrics** (crime, safety, schools, risk, etc.)
2. **Always use PROPERTY colors for identifying properties** (P1, P2, P3 comparison)
3. **Never mix the two color systems** - this causes user confusion
4. **Always normalize external scores** using `scoreNormalization.ts`
5. **Verify the native scale** before normalizing any new metric
6. **Higher CLUES score = Better** - always ensure this is true after normalization

---

## License

MIT - John E. Desautels & Associates
