# CLUES Property Dashboard - Replit Project

### Overview
A mobile-first, 110-field real estate intelligence platform built with React, TypeScript, Vite, and PostgreSQL. Its purpose is to collect and analyze property data from tiered sources including Google APIs, paid/free APIs, and a multi-LLM cascade with robust validation. The project aims to provide comprehensive property insights with confidence scoring and source attribution for each data point, designed for both standalone use and integration with the CLUES Quantum Master App.

### User Preferences
- I prefer simple language.
- I like functional programming.
- I want iterative development.
- Ask before making major changes.
- I prefer detailed explanations.
- Do not make changes to the folder Z.
- Do not make changes to the file Y.

### System Architecture
The project utilizes a Vite + React + TypeScript frontend with Tailwind CSS for styling, featuring a custom 5D glassmorphic design with neon accents, mobile-first responsiveness, a dark theme, and quantum-inspired animations via Framer Motion. Data is managed using Zustand for state and persisted in a PostgreSQL database via Prisma ORM, adhering to a comprehensive 110-field property schema. The system supports multi-LLM integration (Claude, GPT, Grok, Gemini) for data enrichment and validation. A tiered data source architecture is implemented, prioritizing Stellar MLS (future), then Google APIs, various paid/free APIs (e.g., WalkScore, SchoolDigger), and finally a multi-LLM cascade with confidence scoring, conflict detection, and validation gates. The backend API endpoints are designed as Vercel serverless functions, enabling property scraping and enrichment. The system includes a `clues-bridge.ts` module for integration with the CLUES Quantum Master App via iframe communication.

### External Dependencies
- **Database**: PostgreSQL (via Prisma ORM)
- **LLM APIs**: Anthropic (Claude), OpenAI (GPT), Grok/xAI, Google (Gemini)
- **Mapping/Location APIs**: Google APIs (Geocode, Places)
- **Property Data APIs**: WalkScore, SchoolDigger, FEMA, AirNow, HowLoud, Weather, FBI Crime
- **Deployment Platforms**: Vercel (for serverless functions), Capacitor (for iOS/Android builds)

### Recent Changes

#### 2025-11-27 (Latest): Complete Validation Metadata Pipeline
**End-to-end validation flow from API arbitration to PropertyDetail UI**:
- **API Layer (api/property/arbitration.ts)**:
  - `addField()` now sets `validationStatus = 'passed'` when fields pass validation gate
  - `getResult()` applies `validationStatus = 'warning'` and `validationMessage` to single-source LLM fields
- **API Response (api/property/search.ts)**:
  - Updated field conversion to preserve `validationStatus` and `validationMessage` from FieldValue
  - Also preserves `llmSources` for source tracking
- **Frontend Types (src/types/property.ts)**:
  - Extended `DataField<T>` interface with `validationStatus` and `validationMessage` properties
- **Field Normalizer (src/lib/field-normalizer.ts)**:
  - Updated `FlatFieldData` interface to accept validation fields from API
  - Updated `createDataField()` function to accept and return validation metadata
  - Updated `normalizeToProperty()` to pass validation fields through pipeline
- **UI Layer (src/pages/PropertyDetail.tsx)**:
  - Updated `DataFieldInput` interface with validation properties
  - Updated `renderDataField()` helper to map validation status to DataField component props
  - DataField component receives `validationStatus`, `validationMessage`, `singleSourceWarning` props
- **Validation Visual Indicators**:
  - Fields with `validationStatus: 'failed'` display faint red highlight
  - Fields with `validationStatus: 'warning'` (single-source LLM) display orange highlight
  - Fields with `validationStatus: 'passed'` display normal (green confidence indicators)
  - Priority hierarchy: validation failure > single-source > conflicts > missing > low confidence

#### 2025-11-27 (Earlier): Arbitration Service Integration
- Created `api/property/arbitration.ts` with tier-based arbitration
- Replaced `mergeFields` with `createArbitrationPipeline()` in search endpoints
- All tier sources use `addFieldsFromSource()` for consistent field handling
- LLM quorum voting (2+ LLMs agree = higher confidence)
- Single-source hallucination detection
- Validation gates (price 1K-100M, year 1700-future, coords, bathroom math, scores 0-100)
- Full audit trail tracking with sources, confidence, and conflicts

### Project Structure
```
├── src/
│   ├── components/      # React components (UI, layout, property)
│   ├── pages/          # Route pages (Dashboard, PropertyList, etc.)
│   ├── lib/            # Utilities and CLUES bridge integration
│   ├── store/          # Zustand state management
│   ├── types/          # TypeScript type definitions (110-field schema)
│   └── styles/         # Global CSS and Tailwind
├── api/                # Backend API endpoints (Vercel serverless)
│   └── property/       # Property scraping and enrichment APIs
├── prisma/             # Database schema (110-field property model)
└── public/             # Static assets
```
