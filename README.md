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
| `npm run lint` | Run ESLint checks for TypeScript/React code |
| `npm run lint:fix` | Auto-fix lint issues where possible |
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

## License

MIT - John E. Desautels & Associates
