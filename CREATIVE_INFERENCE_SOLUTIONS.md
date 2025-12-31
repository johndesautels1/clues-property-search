# Creative Inference Solutions
## Fields That Can Be Inferred from Existing Data

**Pattern:** Instead of asking LLMs to guess, derive from reliable data sources.

---

## CATEGORY A: INFER FROM PROPERTY TYPE

### Field 27: Stories
**Current Problem:** 50% NULL
**Solution:** Infer from property type and keywords

| Property Type | MLS Keywords | Inference Rule | Confidence |
|---------------|--------------|----------------|------------|
| "Single Family" | "ranch", "one story", "single level" | Stories = 1 | High |
| "Single Family" | "two story", "2 story", "split level" | Stories = 2 | High |
| "Townhouse" | No "tri-level" or "3 story" | Stories = 2 | Medium |
| "Condo" | field_144 (Floor Number) exists | Stories = 1 (unit is single-level) | Medium |

**Code:**
```typescript
function inferStories(propertyType: string, mlsRemarks: string, floorNumber?: number): number | null {
  const text = mlsRemarks.toLowerCase();

  // Explicit mentions
  if (/\b(ranch|one[- ]story|single[- ]level|one[- ]level)\b/.test(text)) return 1;
  if (/\b(two[- ]story|2[- ]story|split[- ]level)\b/.test(text)) return 2;
  if (/\b(three[- ]story|3[- ]story|tri[- ]level)\b/.test(text)) return 3;

  // Infer from property type
  if (propertyType?.toLowerCase().includes('ranch')) return 1;
  if (propertyType?.toLowerCase().includes('townhouse')) return 2; // Most townhomes are 2-story
  if (floorNumber !== undefined) return 1; // Condo units are typically single-level

  return null; // Don't guess
}
```

---

### Field 144-148: Building Details (5 fields)
**Current Problem:** 90% NULL for single-family homes
**Solution:** Return NULL for single-family, only attempt for condos/townhomes

| Field | Single-Family Rule | Condo/Townhome Rule |
|-------|-------------------|---------------------|
| 144 (Floor Number) | Always NULL | Extract from MLS or address (Unit 205 = Floor 2) |
| 145 (Building Total Floors) | Always NULL | Extract from MLS or estimate (High-rise > 10) |
| 146 (Building Name/Number) | Always NULL | Extract from address or MLS |
| 147 (Building Elevator Y/N) | Always NULL | Yes if Floor > 2 or MLS mentions |
| 148 (Floors in Unit) | Always NULL | Extract from MLS or assume 1 |

**Code:**
```typescript
function shouldPopulateBuildingFields(propertyType: string): boolean {
  const condoTypes = ['condo', 'condominium', 'townhouse', 'townhome', 'apartment'];
  return condoTypes.some(type => propertyType?.toLowerCase().includes(type));
}

function inferFloorNumber(address: string): number | null {
  // Extract from unit number: "Unit 305" = Floor 3
  const unitMatch = address.match(/unit\s*(\d{2,3})/i);
  if (unitMatch) {
    const unitNum = unitMatch[1];
    return parseInt(unitNum.charAt(0));
  }
  return null;
}
```

---

## CATEGORY B: INFER FROM MLS FEATURES ARRAY

### Field 44: Garage Type
**Current Problem:** 75% NULL, Gemini hallucinating
**Solution:** Extract from MLS parking features array

**MLS Feature Values to Check:**
- `"Attached Garage"` → "Attached"
- `"Detached Garage"` → "Detached"
- `"Carport"` → "Carport"
- `"Built-in Garage"` → "Attached Built-in"
- `"Garage"` + no qualifier → "Attached" (default assumption)

**Code:**
```typescript
function inferGarageType(parkingFeatures: string[], garageSpaces?: number): string | null {
  if (!parkingFeatures || parkingFeatures.length === 0) {
    // If garageSpaces > 0 but no features, assume attached (most common)
    return garageSpaces && garageSpaces > 0 ? "Attached" : null;
  }

  const features = parkingFeatures.map(f => f.toLowerCase());

  if (features.some(f => f.includes('attached'))) return "Attached";
  if (features.some(f => f.includes('detached'))) return "Detached";
  if (features.some(f => f.includes('carport'))) return "Carport";
  if (features.some(f => f.includes('built-in'))) return "Attached Built-in";
  if (features.some(f => f.includes('garage'))) return "Attached"; // Default

  return null;
}
```

---

### Field 53: Fireplace Count
**Current Problem:** 75% NULL, Opus hallucinating
**Solution:** Count from MLS interior features or use fireplace_yn

**Logic:**
1. If `field_52 (fireplace_yn) = "No"` → Count = 0
2. If MLS has `FireplacesTotal` field → Use that
3. If MLS interior features includes "Multiple Fireplaces" → Count = 2
4. If `fireplace_yn = "Yes"` → Count = 1 (default assumption)

**Code:**
```typescript
function inferFireplaceCount(
  fireplaceYn: string,
  mlsFireplaceTotal?: number,
  interiorFeatures?: string[]
): number | null {
  if (fireplaceYn === "No") return 0;
  if (mlsFireplaceTotal !== undefined) return mlsFireplaceTotal;

  if (interiorFeatures) {
    const features = interiorFeatures.join(' ').toLowerCase();
    if (features.includes('multiple fireplace')) return 2;
    if (features.includes('dual fireplace')) return 2;
    if (features.includes('two fireplace')) return 2;
  }

  if (fireplaceYn === "Yes") return 1; // Safe default

  return null;
}
```

---

## CATEGORY C: INFER FROM GEOGRAPHIC DATA

### Field 124: Hurricane Risk
**Current Problem:** Generic "High" for all FL properties
**Solution:** Calculate from distance to coast

| Distance from Coast | Hurricane Risk | Confidence |
|---------------------|----------------|------------|
| 0-5 miles | Extreme | High |
| 5-15 miles | High | High |
| 15-30 miles | Moderate | Medium |
| 30+ miles | Low | Medium |
| Non-coastal state | Minimal | High |

**Code:**
```typescript
function inferHurricaneRisk(state: string, distanceToCoast: number): string {
  const hurricaneStates = ['FL', 'LA', 'TX', 'MS', 'AL', 'NC', 'SC', 'GA'];

  if (!hurricaneStates.includes(state)) return "Minimal";

  if (distanceToCoast <= 5) return "Extreme";
  if (distanceToCoast <= 15) return "High";
  if (distanceToCoast <= 30) return "Moderate";
  return "Low";
}
```

---

### Field 128: Sea Level Rise Risk
**Current Problem:** Generic responses
**Solution:** Calculate from elevation + distance to coast

| Elevation | Distance to Coast | Risk Level | Confidence |
|-----------|-------------------|------------|------------|
| 0-5 ft | 0-1 mile | Extreme | High |
| 0-5 ft | 1-5 miles | High | High |
| 6-10 ft | 0-5 miles | Moderate | Medium |
| 10+ ft | Any | Low | Medium |
| > 50 miles from coast | Any | Minimal | High |

**Code:**
```typescript
function inferSeaLevelRisk(elevation: number, distanceToCoast: number): string {
  if (distanceToCoast > 50) return "Minimal";

  if (elevation <= 5) {
    if (distanceToCoast <= 1) return "Extreme";
    if (distanceToCoast <= 5) return "High";
    return "Moderate";
  }

  if (elevation <= 10 && distanceToCoast <= 5) return "Moderate";

  return "Low";
}
```

---

## CATEGORY D: INFER FROM AGE/LOCATION

### Field 137: Age Restrictions
**Current Problem:** 100% unreliable generic responses
**Solution:** Extract from neighborhood name + HOA name

**Keywords Indicating 55+ Community:**
- Neighborhood/HOA name contains: "55+", "55 plus", "active adult", "senior", "retirement", "villa", "del webb", "sun city"

**Code:**
```typescript
function inferAgeRestrictions(
  neighborhoodName?: string,
  hoaName?: string,
  mlsRemarks?: string
): string | null {
  const text = [neighborhoodName, hoaName, mlsRemarks].join(' ').toLowerCase();

  const seniorKeywords = [
    '55+', '55 plus', '55-plus',
    'active adult', 'senior living', 'retirement community',
    'del webb', 'sun city', 'kings point', 'century village'
  ];

  if (seniorKeywords.some(kw => text.includes(kw))) {
    return "55+ Age Restricted Community";
  }

  // Don't return "No restrictions" - let it be NULL if unknown
  return null;
}
```

---

## CATEGORY E: INFER FROM FLOOD ZONE

### Field 120: Flood Risk Level (Verify from FEMA Zone)
**Current Problem:** Already working, but can add confidence scoring
**Solution:** Deterministic mapping from FEMA Zone

| FEMA Zone | Risk Level | Flood Insurance Required? |
|-----------|------------|---------------------------|
| X (unshaded) | Minimal | No |
| X (shaded) | Low to Moderate | No (but recommended) |
| A, AE, AO, AH | High Risk (SFHA) | Yes (required) |
| V, VE | Extreme (Coastal) | Yes (required, higher rates) |

**Already implemented correctly** ✅

---

## CATEGORY F: INFER FROM RENTAL/INVESTMENT DATA

### Field 82: Commute to City Center
**Current Problem:** 100% unreliable estimates
**Solution:** Use Google Distance Matrix to defined downtown locations

**Define City Centers by Metro:**
| Metro Area | Downtown Lat/Lng | Address |
|------------|------------------|---------|
| Tampa Bay | 27.9506, -82.4572 | Downtown Tampa |
| St. Petersburg | 27.7676, -82.6403 | Downtown St. Pete |
| Clearwater | 27.9659, -82.8001 | Downtown Clearwater |

**Code:**
```typescript
async function calculateCommuteToCenter(
  propertyAddress: string,
  propertyLat: number,
  propertyLng: number
): Promise<string | null> {
  // Determine closest city center
  const tampaCenterLat = 27.9506;
  const tampaCenterLng = -82.4572;

  // Calculate distance and use Google Distance Matrix for drive time
  const driveTime = await getGoogleDriveTime(
    {lat: propertyLat, lng: propertyLng},
    {lat: tampaCenterLat, lng: tampaCenterLng}
  );

  return `${driveTime} mins to Downtown Tampa`;
}
```

---

## CATEGORY G: SMART HOME FEATURES (Field 134)

**Current Problem:** 100% suspicious, LLMs copy-pasting
**Solution:** ONLY extract if explicitly in MLS features array

**MLS Interior Features to Check:**
- `"Smart Thermostat"` → Include
- `"Smart Home"` → Include (but note vague)
- `"Home Automation"` → Include
- `"Security System"` → Include
- `"Video Doorbell"` → Include

**Rule:** If NOT in MLS features array → Return NULL

**Code:**
```typescript
function extractSmartFeatures(interiorFeatures?: string[]): string | null {
  if (!interiorFeatures || interiorFeatures.length === 0) return null;

  const smartKeywords = [
    'smart thermostat', 'smart home', 'home automation',
    'security system', 'video doorbell', 'smart lock',
    'nest', 'ring', 'alexa', 'smart lighting'
  ];

  const found = interiorFeatures.filter(feature =>
    smartKeywords.some(kw => feature.toLowerCase().includes(kw))
  );

  return found.length > 0 ? found.join(', ') : null;
}
```

---

## IMPLEMENTATION SUMMARY

| Inference Type | Fields Affected | Expected Improvement |
|----------------|-----------------|----------------------|
| Property Type Logic | 27, 144-148 | 90% NULL → 30% NULL |
| MLS Features Parsing | 44, 53, 134 | 75% hallucinated → 90% accurate |
| Geographic Calculations | 124, 128 | 100% generic → 95% accurate |
| Neighborhood Analysis | 137 | 100% unreliable → 80% accurate |
| Distance Matrix API | 82 | 100% estimated → 95% accurate |

**Overall Impact:** Convert 15-20 fields from NULL/hallucinated to inferred with Medium-High confidence.

---

## NEXT STEPS

1. Implement inference functions in `src/lib/infer-fields.ts`
2. Call inference engine BEFORE LLM extraction
3. Mark inferred fields with `source: "Backend Inference"` and `confidence: "Medium"`
4. Log inference success rate for monitoring
5. User can see "Inferred from [X]" in field tooltips
