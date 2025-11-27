# CLUES Property Dashboard - Replit Project

## Overview
110-Field Real Estate Intelligence Platform built with React, TypeScript, Vite, and PostgreSQL. This is a mobile-first property data collection and analysis dashboard with AI-powered web scraping capabilities.

## Project Type
- **Framework**: Vite + React + TypeScript
- **UI Library**: Tailwind CSS with custom glassmorphic design
- **Database**: PostgreSQL (via Prisma ORM)
- **Mobile**: Capacitor-ready for iOS/Android builds
- **LLM Integration**: Multi-LLM support (Claude, GPT, Grok, Gemini)

## Quick Start
The project is pre-configured to run in Replit. The dev server starts automatically on port 5000.

### Development
- **Run Command**: `npm run dev` (configured in workflow)
- **Port**: 5000 (frontend)
- **Host**: 0.0.0.0 (allows Replit proxy)

### Scripts
- `npm run dev` - Start development server (Vite)
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Project Structure
```
├── src/
│   ├── components/      # React components (UI, layout, property)
│   ├── pages/          # Route pages (Dashboard, PropertyList, etc.)
│   ├── lib/            # Utilities and CLUES bridge integration
│   ├── store/          # Zustand state management
│   ├── types/          # TypeScript type definitions (110-field schema)
│   ├── api/            # API client utilities
│   └── styles/         # Global CSS and Tailwind
├── api/                # Backend API endpoints (Vercel serverless)
│   └── property/       # Property scraping and enrichment APIs
├── prisma/             # Database schema (110-field property model)
├── public/             # Static assets
└── index.html          # Entry HTML file
```

## Key Features

### 110-Field Property Schema
Complete property data collection with confidence tracking for each field:
- **Address & Listing** (Fields 1-7): MLS data, pricing, status
- **Property Details** (Fields 8-30): Bedrooms, bathrooms, sqft, financials
- **Structural** (Fields 31-50): Roof, HVAC, pool, renovations
- **Location** (Fields 51-75): Schools, walkability, crime, distances
- **Financial** (Fields 76-90): Taxes, rental estimates, market data
- **Utilities & Environment** (Fields 91-110): Utilities, flood zones, air quality

### Multi-LLM Web Scraping
- Supports Claude (Anthropic), GPT (OpenAI), Grok (xAI), Gemini (Google)
- Hybrid mode for cross-validation
- Confidence scoring system
- Source attribution for each data point

### UI Design
- 5D glassmorphic effects with neon accents
- Mobile-first responsive design
- Dark theme optimized for property viewing
- Quantum-inspired animations with Framer Motion

## Database Setup
This project uses PostgreSQL with Prisma ORM. To set up the database:

1. Create a PostgreSQL database in Replit (use the database tools)
2. Set the `DATABASE_URL` environment variable
3. Run Prisma migrations:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

## Environment Variables
Required environment variables (see `.env.example`):

### Database (Required)
- `DATABASE_URL` - PostgreSQL connection string

### LLM APIs (At least one required for scraping)
- `ANTHROPIC_API_KEY` - Claude API key
- `OPENAI_API_KEY` - GPT API key
- `GROK_API_KEY` - Grok/xAI API key
- `GEMINI_API_KEY` - Google Gemini API key

### Optional APIs
See README.md for complete list of supported APIs (Google Maps, WalkScore, FBI Crime, etc.)

## Deployment
Configured for Replit static deployment:
- **Build**: `npm run build`
- **Output Directory**: `dist/`
- **Type**: Static (SPA)

The app can also be deployed to:
- Vercel (pre-configured with `vercel.json`) - Recommended for full API support
- Any static hosting (Netlify, Cloudflare Pages, etc.)

**Important**: The `/api` directory contains Vercel serverless functions that are NOT available in Replit's dev server by default. For full functionality:
1. Deploy the API endpoints to Vercel separately, or
2. Configure a Vite proxy to a running backend, or
3. Use the app in frontend-only mode (some features will be unavailable)

## CLUES Quantum Integration
This dashboard can run standalone or be embedded in the CLUES Quantum Master App. The `clues-bridge.ts` module handles parent-child iframe communication for property data synchronization.

## Recent Changes
- **2025-11-27 (Latest)**: Comprehensive API & schema consistency fixes
  - **Removed Invalid Field References in API**: Fixed scrapers.ts and free-apis.ts which were setting non-existent `city`, `state`, `zip` fields - 110-field schema only has composite `1_full_address`
  - **TypeScript Fixes**: Fixed LSP errors in free-apis.ts with proper CarrierData interface typing
  - **Shared LLM Constants for API**: Created `api/property/llm-constants.ts` to mirror frontend constants - API endpoints now import from shared source
  - **Safe Address Parsing**: Added null guards in AddProperty.tsx to prevent crashes when `1_full_address` is undefined
  - **Fixed Misleading Comments**: Corrected cascade order comments in search.ts and search-stream.ts
  
- **2025-11-27 (Earlier)**: Codebase audit and critical bug fixes
  - **Removed Invalid Field References**: Fixed `fields['city']`, `fields['state']`, `fields['zip']` which don't exist in 110-field schema - now parses from `1_full_address`
  - **UI Cascade Text Corrected**: Changed from wrong "Opus → GPT → Grok" to correct "Perplexity → Grok → Claude Opus → GPT → Claude Sonnet → Gemini"
  - **CSV Enrichment Fixed**: Now uses full 6-engine cascade instead of just 2 engines
  - **Imported LLM Constants**: AddProperty.tsx now uses unified constants from `src/lib/llm-constants.ts`
  
- **2025-11-27 (Earlier)**: Fixed critical data consistency and hallucination issues
  - **Field Mapping**: Fixed AddProperty API scrape misalignment (was using fields 6→7 instead of 7→7)
  - **LLM Cascade Fix**: Fixed null blocking issue - LLMs can now cascade properly to fill empty fields
  - **Nested Structure**: Added automatic flat→nested transformation so PropertyDetail pages display consistently
  - **Unified LLM Order**: Created `src/lib/llm-constants.ts` with single source of truth
    - Order: Perplexity → Grok → Claude Opus → GPT → Claude Sonnet → Gemini
    - All pages (AddProperty, Dashboard, API) now use same reliable cascade
  - **Anti-Hallucination Layers**:
    1. Web-search LLMs first (Perplexity/Grok verify real data)
    2. Proper cascade order (reliable models first, fallbacks last)
    3. Range validation (prices, coordinates, years must be realistic)
    4. Confidence scoring (High=verified, Medium=LLM, Low=potential hallucination)
    5. Conflict detection (shows when LLMs disagree)
    6. Source attribution (track every data point's origin)

## Deploying to Vercel

Your environment variables are already configured in Vercel. To deploy this app:

1. **Deploy the API endpoints:**
   ```bash
   vercel --prod
   ```
   This deploys both the frontend and the `/api` serverless functions with your configured env vars.

2. **Update frontend config:**
   In production, Vite will serve from your Vercel domain. No additional configuration needed—the API calls will work automatically with all 110-field mapping and LLM validation.

3. **For local development in Replit:**
   - Frontend runs on port 5000 with `npm run dev`
   - Full 110-field UI is functional for manual data entry
   - API endpoints won't work locally (they need Vercel) but frontend-only features are fully available
   - Deploy to Vercel to test full LLM-powered data enrichment

## Notes
- The project includes API endpoints in the `/api` directory designed for Vercel serverless functions
- Capacitor is configured for mobile builds (iOS/Android) but not required for web deployment
- The app includes extensive documentation files for field mapping, data collection workflows, and integration guides
