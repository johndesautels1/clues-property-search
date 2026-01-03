# Florida Zip Code Logic - Beach vs Inland

**Created:** 2025-12-27
**Purpose:** Define location-based scoring adjustments for SMART Score system
**Implementation:** `src/lib/florida-location-logic.ts`

---

## 🏖️ BEACH ZIP CODES (82 total)

Properties within 0-3 miles of beach. Higher prices, waterfront premiums, elevated hurricane/flood concerns.

### Southwest Florida - Sarasota/Siesta Key (7 zips)
- **34235** - Siesta Key
- **34236** - Osprey Beach
- **34217** - Bradenton Beach
- **34228** - Longboat Key
- **34242** - Sarasota Beach Areas
- **34209** - Anna Maria Island
- **34216** - Anna Maria

### St. Pete/Clearwater/Treasure Island (9 zips)
- **33706** - St. Pete Beach
- **33767** - Clearwater Beach
- **33785** - Indian Rocks Beach
- **33774** - Largo Beach Areas
- **33770** - Seminole Beach Areas
- **33786** - Belleair Beach
- **33708** - St. Petersburg Waterfront
- **33715** - Madeira Beach
- **33708** - Treasure Island

### Miami Beach/South Beach (7 zips)
- **33139** - South Beach
- **33140** - Miami Beach North
- **33141** - Miami Beach Mid
- **33154** - Bal Harbour
- **33109** - Fisher Island
- **33160** - Sunny Isles Beach
- **33179** - Aventura Waterfront

### Northeast Florida - St. Augustine/Ponte Vedra (4 zips)
- **32034** - Ponte Vedra Beach
- **32080** - St. Augustine Beach
- **32082** - Ponte Vedra
- **32084** - St. Augustine Beaches

### Daytona Beach Area (5 zips)
- **32176** - Ormond Beach
- **32174** - Ormond-by-the-Sea
- **32169** - New Smyrna Beach
- **32118** - Daytona Beach
- **32127** - Port Orange Beach

### Southeast Florida - Hollywood/Dania/Hallandale (6 zips)
- **33004** - Dania Beach
- **33019** - Hollywood Beach
- **33009** - Hallandale Beach
- **33308** - Fort Lauderdale Beach
- **33062** - Pompano Beach

### Northwest Florida - Panhandle/Destin/30A (6 zips)
- **32561** - Gulf Breeze
- **32459** - Destin
- **32550** - Fort Walton Beach
- **32461** - Miramar Beach
- **32413** - Panama City Beach
- **32408** - Panama City Waterfront

### Naples/Marco Island (5 zips)
- **34102** - Naples Beach/Old Naples
- **34108** - Naples Park Shore
- **34110** - Naples North Beach
- **34145** - Marco Island
- **34134** - Bonita Beach

### Palm Beach/Delray Beach (4 zips)
- **33480** - Palm Beach
- **33483** - Delray Beach
- **33462** - Ocean Ridge
- **33435** - Boynton Beach Oceanfront

### Space Coast - Cocoa Beach/Melbourne Beach (4 zips)
- **32931** - Cocoa Beach
- **32937** - Satellite Beach
- **32951** - Indian Harbour Beach
- **32963** - Vero Beach

### Tampa Bay Beaches (2 zips)
- **33760** - Clearwater
- **33755** - Clearwater Beach Area

### Florida Keys (5 zips)
- **33040** - Key Largo
- **33036** - Islamorada
- **33050** - Marathon
- **33040** - Key West
- **33051** - Key Colony Beach

---

## 🏙️ INLAND ZIP CODES (100+ total)

Properties >5 miles from beach. Lower prices, school/crime focus, less flood/hurricane concern.

### Tampa Inland (9 zips)
- **33606** - South Tampa (Hyde Park)
- **33609** - Bayshore/Palma Ceia
- **33611** - MacDill Area
- **33618** - Carrollwood
- **33629** - Westshore
- **33614** - Town 'n' Country
- **33615** - Westchase
- **33625** - New Tampa
- **33647** - USF Area

### Orlando Metro (10 zips)
- **32801** - Downtown Orlando
- **32803** - Lake Eola/Thornton Park
- **32804** - College Park
- **32806** - Azalea Park
- **32807** - Pine Hills
- **32808** - Metro West
- **32810** - Pine Hills North
- **32812** - East Orlando
- **32819** - Dr. Phillips
- **32835** - Windermere

### Fort Lauderdale Inland (6 zips)
- **33301** - Downtown Fort Lauderdale
- **33311** - Lauderdale Lakes
- **33312** - Plantation
- **33321** - Plantation North
- **33313** - Sunrise
- **33351** - Sunrise East

### Miami Inland (14 zips)
- **33101** - Downtown Miami
- **33125** - West Miami
- **33126** - Miami International Airport
- **33127** - Allapattah
- **33130** - Coconut Grove Inland
- **33133** - Coral Gables
- **33134** - Coral Gables West
- **33143** - South Miami
- **33155** - Kendall
- **33156** - Pinecrest
- **33165** - West Kendall
- **33175** - Fontainebleau
- **33186** - Kendall West

### Seminole County - Orlando Suburbs (6 zips)
- **32789** - Winter Park
- **32792** - Winter Park North
- **32765** - Oviedo
- **32779** - Longwood
- **32746** - Lake Mary
- **32714** - Altamonte Springs

### Broward County Inland (5 zips)
- **33324** - Plantation West
- **33326** - Weston
- **33328** - Southwest Ranches
- **33330** - Davie
- **33331** - Weston North

### Palm Beach County Inland (6 zips)
- **33401** - West Palm Beach
- **33409** - West Palm Beach West
- **33411** - Royal Palm Beach
- **33414** - Wellington
- **33458** - Jupiter Inland
- **33478** - Jupiter Farms

### Jacksonville Inland (5 zips)
- **32202** - Downtown Jacksonville
- **32210** - Riverside
- **32244** - Mandarin
- **32256** - Baymeadows
- **32257** - Deerwood

### Sarasota/Bradenton Inland (5 zips)
- **34231** - Sarasota Inland
- **34232** - Sarasota South Inland
- **34233** - Lakewood Ranch
- **34240** - Sarasota East
- **34243** - Lakewood Ranch North

### Naples Inland (4 zips)
- **34103** - Naples North Inland
- **34104** - Naples East
- **34105** - Naples Vineyards
- **34113** - Naples North Naples

### Tallahassee - State Capital (5 zips)
- **32301** - Downtown Tallahassee
- **32303** - Northeast Tallahassee
- **32308** - Eastside
- **32309** - Midtown
- **32312** - Killearn

### Gainesville - University Town (5 zips)
- **32601** - Downtown Gainesville
- **32605** - University of Florida
- **32606** - Northwest Gainesville
- **32607** - Southwest Gainesville
- **32608** - Newberry Road Area

---

## 🎯 SCORING IMPACT

### Beach Areas Prioritize:
- ✅ Waterfront access (1.5x multiplier)
- ✅ Pool amenity (1.2x multiplier)
- ✅ Flood zone rating (1.3x multiplier)
- ✅ Hurricane protection (1.3x multiplier)
- ✅ Distance to beach (1.5x multiplier)
- ❌ School ratings (0.9x multiplier) - Less family-oriented
- ❌ Walk score (0.8x multiplier) - Car culture

### Inland Areas Prioritize:
- ✅ School quality (1.2x multiplier)
- ✅ Walk score (1.1x multiplier)
- ✅ Crime statistics (1.0x multiplier)
- ❌ Waterfront access (0.8x multiplier)
- ❌ Distance to beach (0.5x multiplier)
- ❌ Pool amenity (1.0x multiplier) - Standard, not premium

---

## 📊 COUNTY TIERS

### Tier 1 - Premium Counties (Score: 95-100)
- **St. Johns** (100) - Ponte Vedra, St. Augustine
- **Collier** (100) - Naples, Marco Island
- **Monroe** (100) - Key West, Florida Keys
- **Martin** (95) - Stuart, Jensen Beach
- **Palm Beach** (100) - Palm Beach, Wellington, Boca Raton

### Tier 2 - Desirable Counties (Score: 80-88)
- **Sarasota** (88) - Sarasota, Siesta Key, Longboat Key
- **Pinellas** (85) - St. Pete, Clearwater, Treasure Island
- **Lee** (82) - Fort Myers, Sanibel, Captiva
- **Broward** (80) - Fort Lauderdale, Hollywood, Pompano
- **Manatee** (80) - Bradenton, Anna Maria

### Tier 3 - Good Counties (Score: 68-95)
- **Seminole** (95) - Altamonte, Oviedo, Lake Mary
- **Orange** (72) - Orlando, Winter Park
- **Hillsborough** (70) - Tampa, Brandon
- **Volusia** (68) - Daytona, Ormond Beach
- **Duval** (68) - Jacksonville

---

## 🔧 USAGE EXAMPLES

### TypeScript/JavaScript
```typescript
import { getLocationType, getLocationMultiplier, isBeachZipCode } from '@/lib/florida-location-logic';

// Check location type
const locationType = getLocationType('34235'); // 'beach'
const isBeach = isBeachZipCode('34235'); // true

// Apply location-specific multipliers
const poolMultiplier = getLocationMultiplier('34235', 'pool'); // 1.2
const schoolMultiplier = getLocationMultiplier('34235', 'school'); // 0.9

// Use in scoring
const basePoolScore = 100;
const adjustedScore = basePoolScore * poolMultiplier; // 120 → capped at 100
```

### In LLM Prompts
```
IF property.zipCode IN [34235, 34236, 34217, ...beach zips]:
  location_type = "beach"
  Apply beach-specific thresholds for Field 11 (Price Per Sqft)
ELSE:
  location_type = "inland"
  Apply inland-specific thresholds
```

---

## ⚠️ DEFAULT BEHAVIOR

**If zip code NOT found in either list:**
- Default to **INLAND** scoring
- This is conservative - inland thresholds are less aggressive
- Prevents over-scoring unknown areas

**Valid Florida Zip Range:** 32000-34999
- Any zip outside this range is flagged as invalid

---

**END OF FLORIDA ZIP CODE LOGIC**

**Maintained By:** CLUES Development Team
**Last Updated:** 2025-12-27
**Version:** 1.0.0
