# PLAN: Repurpose Field #3 from MLS Secondary to New Construction Y/N

## OBJECTIVE
Change Field #3 from `mls_secondary` to `new_construction_yn` (Yes/No boolean)

## SOURCE: Stellar MLS provides `NewConstructionYN`
- Already mapped in `parse-mls-pdf.ts:466`: `'New Construction': 'new_construction_yn'`
- Already mapped in `bridge-field-mapper.ts:1238`: `property.NewConstructionYN`

## FILES TO MODIFY (22 locations found)

### 1. SOURCE OF TRUTH
- `src/types/fields-schema.ts:44` - Change field definition

### 2. API LAYER
- `api/property/retry-llm.ts:145` - Field type mapping
- `api/property/stellar-mls.ts:85` - Comment reference
- `api/property/search.ts:220` - Field type mapping
- `api/property/search.ts:922` - Property path mapping
- `api/property/search.ts:2668` - LLM prompt field list
- `api/property/search.ts:2766` - LLM prompt field list
- `api/property/search.ts:2927` - LLM prompt field list
- `api/property/search.ts:4294` - Field reference

### 3. TYPE DEFINITIONS
- `src/types/property.ts:32` - Interface field
- `src/types/olivia-enhanced.ts:28` - Olivia interface

### 4. OLIVIA/BRAIN
- `src/api/olivia-brain-enhanced.ts:53` - Field extraction
- `src/api/olivia-brain-enhanced.ts:342` - addField call
- `src/api/olivia-math-engine.ts:341` - Field weight
- `src/api/olivia-math-engine.ts:755` - Display template
- `src/api/olivia-math-engine.ts:1005` - Field metadata

### 5. NORMALIZATION/MAPPING
- `src/lib/field-normalizer.ts:116` - Field mapping config
- `src/lib/field-normalizer.ts:381` - Alias mapping
- `src/lib/field-normalizer.ts:650` - Empty field init
- `src/lib/field-map-flat-to-numbered.ts:24` - Flat to numbered map
- `src/lib/field-mapping.ts:33` - CSV export mapping

### 6. VALIDATION
- `src/llm/validation/cmaSchemas.ts:118` - Schema validation

## CHANGES SUMMARY
| Old Value | New Value |
|-----------|-----------|
| `mls_secondary` | `new_construction_yn` |
| `MLS Secondary` | `New Construction` |
| `mlsSecondary` | `newConstructionYN` |
| type: `text` | type: `boolean` |

## EXECUTION ORDER
1. fields-schema.ts (SOURCE OF TRUTH)
2. property.ts (TypeScript interface)
3. field-normalizer.ts (mapping)
4. All other files

## STATUS: READY TO EXECUTE
