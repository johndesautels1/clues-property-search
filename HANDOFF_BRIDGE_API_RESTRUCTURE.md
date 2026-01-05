# HANDOFF: Bridge/Stellar MLS + API + LLM Restructure

**Date:** 2025-01-05
**Conversation ID:** Field-31-Refactor-Session
**Commit:** 9faeeaa - feat(fees): Refactor Field 31 with subfields + fee-normalizer module

---

## WHAT WAS COMPLETED THIS SESSION

### Field 31 Refactor (Association Fees)
- Renamed `hoa_fee_annual` → `association_fee` (annualized total)
- Added subfields 31A-31F for granular fee handling
- Created `fee-normalizer.ts` module with bidirectional monthly/annual conversion
- Unified condo fee keys (31C/31D) across all 6 core files
- Wired `applyFieldAliases()` for backward compatibility

### Subfield Mappings Added
| Subfield | Parent | Purpose |
|----------|--------|---------|
| 4A_special_sale_type | 4 | REO/Short Sale/Auction |
| 26A_arch_style | 26 | Architectural Style |
| 26B_attached_yn | 26 | Property Attached |
| 31A-31F | 31 | Fee breakdown (HOA/Condo monthly/annual) |
| 132B_other_structures | 132 | Sheds/Outbuildings |
| 167C_furnished_yn | 167 | Furnished boolean |

---

## WHAT NEEDS RESTRUCTURING

### 1. Bridge/Stellar MLS Data Flow

**Current State:**
```
Bridge API → bridge-field-mapper.ts → Arbitration → Property Object
PDF Upload → parse-mls-pdf.ts → Field Mapping → Property Object
```

**Problems:**
- Two separate mapping paths with potential inconsistencies
- Fee handling was duplicated (now fixed with fee-normalizer.ts)
- No central validation layer before arbitration

**Recommended Restructure:**
```
┌─────────────────────────────────────────────────────────────────┐
│                    DATA INGESTION LAYER                         │
├─────────────────────────────────────────────────────────────────┤
│  Bridge API          │  PDF Upload         │  Manual Entry      │
│  ↓                   │  ↓                  │  ↓                 │
│  bridge-api-client   │  parse-mls-pdf.ts   │  form-handler.ts   │
└──────────┬───────────┴─────────┬───────────┴─────────┬──────────┘
           │                     │                     │
           ▼                     ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                 UNIFIED FIELD MAPPER                            │
│  - Single source of truth for field mappings                    │
│  - Calls fee-normalizer.ts for all fee fields                   │
│  - Applies field aliases (applyFieldAliases)                    │
│  - Validates against fields-schema.ts                           │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ARBITRATION PIPELINE                         │
│  - Source priority: Stellar MLS > APIs > LLMs                   │
│  - Conflict resolution                                          │
│  - Confidence scoring                                           │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PROPERTY OBJECT                              │
│  - 181 fields + subfields                                       │
│  - Ready for UI/Olivia/Ask Olivia                               │
└─────────────────────────────────────────────────────────────────┘
```

### 2. API Hierarchy Needs Work

**Current Files:**
- `api/property/search.ts` - Main search endpoint (MASSIVE ~5000+ lines)
- `api/property/bridge-mls.ts` - Bridge MLS direct queries
- `api/property/free-apis.ts` - External APIs (WalkScore, FEMA, etc.)
- `src/lib/bridge-api-client.ts` - Bridge API client
- `src/lib/bridge-field-mapper.ts` - Bridge field mapping

**Problems:**
- `search.ts` is monolithic and hard to maintain
- API call order/priority not clearly defined
- Timeout handling scattered across files
- No centralized error handling

**Recommended Restructure:**
```
api/
├── property/
│   ├── search.ts              # Slim orchestrator only
│   ├── sources/
│   │   ├── stellar-mls.ts     # Tier 1: Stellar MLS via Bridge
│   │   ├── google-apis.ts     # Tier 2: Google (Geocode, Places)
│   │   ├── free-apis.ts       # Tier 3: Free APIs (WalkScore, FEMA, etc.)
│   │   └── llm-enrichment.ts  # Tier 4: LLM cascade
│   ├── validation/
│   │   ├── field-validator.ts # Type/range validation
│   │   └── schema-validator.ts # Schema compliance
│   └── utils/
│       ├── timeout-wrapper.ts # Unified timeout handling
│       └── error-handler.ts   # Centralized error handling
```

### 3. LLM Cascade Needs Work

**Current State:**
- LLM order: Perplexity → Sonnet → GPT → Opus → Gemini → Grok
- Each LLM has different prompts scattered in search.ts
- No clear handoff when one LLM fails

**Problems:**
- Prompts not versioned or centralized
- Field-specific prompts (e.g., Field 48 interior_condition) embedded inline
- No A/B testing capability
- Token costs not tracked per field

**Recommended Restructure:**
```
src/
├── services/
│   └── llm/
│       ├── cascade-controller.ts  # Manages LLM order/fallback
│       ├── prompts/
│       │   ├── field-48-interior-condition.ts
│       │   ├── field-59-renovations.ts
│       │   ├── market-analysis.ts
│       │   └── ...
│       ├── providers/
│       │   ├── perplexity.ts
│       │   ├── anthropic.ts
│       │   ├── openai.ts
│       │   ├── google.ts
│       │   └── xai.ts
│       └── utils/
│           ├── token-tracker.ts
│           └── response-parser.ts
```

---

## PRIORITY ORDER FOR NEXT SESSION

### P0 (Critical)
1. **Split search.ts** - Extract source handlers into separate files
2. **Create unified field mapper** - Single entry point for all data sources

### P1 (High)
3. **Centralize LLM prompts** - Move all prompts to versioned files
4. **Add field validation layer** - Validate before arbitration

### P2 (Medium)
5. **Token cost tracking** - Track LLM costs per field
6. **A/B testing framework** - Compare LLM responses

### P3 (Nice to Have)
7. **Caching layer** - Cache API responses
8. **Rate limiting** - Prevent API abuse

---

## FILES TO REVIEW BEFORE NEXT SESSION

| File | Lines | Purpose | Status |
|------|-------|---------|--------|
| `api/property/search.ts` | ~5000+ | Main search - needs splitting | NEEDS WORK |
| `api/property/arbitration.ts` | ~500 | Conflict resolution | OK |
| `src/lib/bridge-field-mapper.ts` | ~1300 | Bridge mapping | UPDATED |
| `src/lib/fee-normalizer.ts` | ~130 | Fee conversion | NEW |
| `api/property/free-apis.ts` | ~1500 | External APIs | OK |

---

## CONVERSATION CONTEXT TO RESTORE

When starting the next session, paste this context:

```
We completed the Field 31 refactor with subfields 31A-31F. The fee-normalizer.ts
module handles bidirectional monthly/annual conversion. All 6 core files are
synchronized.

Next task: Restructure the Bridge/Stellar MLS + API + LLM hierarchy as outlined
in HANDOFF_BRIDGE_API_RESTRUCTURE.md. Priority is:
1. Split search.ts into smaller source-specific files
2. Create unified field mapper for all data sources
3. Centralize LLM prompts into versioned files

The 181-field schema is stable. DO NOT change core field numbers.
Subfields (4A, 26A, 26B, 31A-31F, 132B, 167C) extend existing fields.
```

---

## GIT STATUS

**Last Commit:** 9faeeaa
**Branch:** main
**Pushed:** Yes
**All 6 core files committed and verified**

---

*Document created: 2025-01-05*
