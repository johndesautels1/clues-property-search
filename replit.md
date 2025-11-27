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
- **2025-11-27**: Imported from GitHub and configured for Replit
  - Updated Vite config to use port 5000 with 0.0.0.0 host
  - Configured workflow for automatic dev server startup
  - Configured deployment for static hosting (builds to dist/)
  - All dependencies installed and verified working
  - Updated documentation to clarify API endpoint requirements
  - Fixed LLM integration with anti-hallucination validation layer
  - Added data sanitization for all LLM responses to ensure type-safe data

## Deploying to Vercel

Your environment variables are already configured in Vercel. To deploy this app:

1. **Deploy the API endpoints:**
   ```bash
   vercel --prod
   ```
   This deploys both the frontend and the `/api` serverless functions with your configured env vars.

2. **Update frontend config:**
   In production, Vite will serve from your Vercel domain. No additional configuration needed—the API calls will work automatically.

3. **For local development in Replit:**
   - Frontend runs on port 5000 with `npm run dev`
   - API endpoints won't work locally (they need Vercel)
   - Test frontend features only, or deploy to Vercel to test full functionality

## Notes
- The project includes API endpoints in the `/api` directory designed for Vercel serverless functions
- Capacitor is configured for mobile builds (iOS/Android) but not required for web deployment
- The app includes extensive documentation files for field mapping, data collection workflows, and integration guides
