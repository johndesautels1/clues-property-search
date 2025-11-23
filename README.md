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

Copy `.env.example` to `.env.local` and configure:

```bash
# Required: Database
DATABASE_URL="postgresql://..."

# Required: At least one LLM API key
ANTHROPIC_API_KEY="sk-ant-..."
OPENAI_API_KEY="sk-..."
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

## License

MIT - John E. Desautels & Associates
