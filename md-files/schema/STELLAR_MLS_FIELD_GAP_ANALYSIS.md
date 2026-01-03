# Stellar MLS Field Gap Analysis

**Date:** 2025-12-07
**Purpose:** Identify valuable Stellar MLS fields not currently mapped to our 168-field schema
**Data Source:** Bridge Interactive RESO Web API (Stellar MLS)

---

## Executive Summary

**Stellar MLS Available Fields**: ~450 RESO standard fields
**Currently Mapped in CLUES**: ~85 fields mapped to our 168-field schema
**Gap**: ~365 unmapped fields (many are redundant/not valuable)

**Key Finding**: We're mapping most **critical** fields, but missing several **valuable** fields that could enhance UX, particularly:
1. **Showing Details** (ShowingInstructions, ShowingRequirements, LockBoxType)
2. **Financial Details** (OriginalListPrice, PreviousListPrice for price history)
3. **Construction Details** (ArchitecturalStyle, BodyType, Levels)
4. **Water Features** (WaterfrontFeatures array - currently unused)
5. **Room Details** (MasterBedroomLevel, BedroomMain, DiningRoomType, KitchenLevel)
6. **Listing Agent** (ListAgentFullName, ListOfficeName, BuyerAgentDesignation)
7. **Utilities Details** (Sewer, Water, Electric, Gas supplier names)
8. **Virtual Tour** (VirtualTourURLUnbranded, VirtualTourURLBranded)
9. **Occupancy** (OccupantType, Tenant-occupied vs vacant)
10. **Special Listing Conditions** (ListingAgreement type, ExclusionList)

---

## Currently Mapped Fields (85 fields)

### ✅ GROUP 1: Address & Identity (9 fields mapped)
| RESO Field | Mapped To | Status |
|------------|-----------|--------|
| UnparsedAddress | 1_full_address | ✅ |
| ListingId/ListingKey | 2_mls_primary | ✅ |
| StandardStatus/MlsStatus | 4_listing_status | ✅ |
| ListingContractDate/OnMarketDate | 5_listing_date | ✅ |
| SubdivisionName | 6_neighborhood | ✅ |
| County | 7_county | ✅ |
| PostalCode | 8_zip_code | ✅ |
| ParcelNumber | 9_parcel_id | ✅ |
| Latitude/Longitude | lat/lon | ✅ |

### ✅ GROUP 2: Pricing (6 fields mapped)
| RESO Field | Mapped To | Status |
|------------|-----------|--------|
| ListPrice | 10_listing_price | ✅ |
| (Calculated) | 11_price_per_sqft | ✅ Calculated |
| CloseDate | 13_last_sale_date | ✅ |
| ClosePrice | 14_last_sale_price | ✅ |
| TaxAssessedValue | 15_assessed_value | ✅ |

**Missing:**
- ❌ OriginalListPrice (shows if price was reduced)
- ❌ PreviousListPrice (shows price history)
- ❌ ListPriceLow (for price ranges)
- ❌ CloseTerms (cash, conventional, FHA, VA financing)

### ✅ GROUP 3: Property Basics (13 fields mapped)
| RESO Field | Mapped To | Status |
|------------|-----------|--------|
| BedroomsTotal | 17_bedrooms | ✅ |
| BathroomsFull | 18_full_bathrooms | ✅ |
| BathroomsHalf | 19_half_bathrooms | ✅ |
| BathroomsTotalInteger | 20_total_bathrooms | ✅ |
| LivingArea | 21_living_sqft | ✅ |
| BuildingAreaTotal | 22_total_sqft_under_roof | ✅ |
| LotSizeSquareFeet | 23_lot_size_sqft | ✅ |
| LotSizeAcres | 24_lot_size_acres | ✅ |
| YearBuilt | 25_year_built | ✅ |
| PropertyType/PropertySubType | 26_property_type | ✅ |
| Stories/StoriesTotal | 27_stories | ✅ |
| GarageSpaces | 28_garage_spaces | ✅ |
| ParkingTotal | 29_parking_total | ✅ |

**Missing:**
- ❌ BedroomsPossible (potential to add bedroom)
- ❌ BedroomMain (main bedroom location - upstairs/downstairs)
- ❌ MasterBedroomLevel (which floor is master on)
- ❌ RoomsTotal (total room count)
- ❌ LotSizeDimensions (e.g., "100x150")
- ❌ LotSizeSource (surveyed vs assessed vs estimate)
- ❌ YearBuiltDetails (original vs addition)
- ❌ ArchitecturalStyle (Ranch, Colonial, Mediterranean, etc.)
- ❌ BodyType (Detached, Attached, etc.)
- ❌ Levels (Split, One, Two, Tri, etc.)

### ✅ GROUP 4: HOA & Taxes (7 fields mapped)
| RESO Field | Mapped To | Status |
|------------|-----------|--------|
| AssociationYN | 30_hoa_yn | ✅ |
| AssociationFee (+frequency) | 31_hoa_fee_annual | ✅ Converted |
| AssociationName | 32_hoa_name | ✅ |
| AssociationFeeIncludes[] | 33_hoa_includes | ✅ |
| Ownership | 34_ownership_type | ✅ |
| TaxAnnualAmount | 35_annual_taxes | ✅ |
| TaxYear | 36_tax_year | ✅ |

**Missing:**
- ❌ AssociationFee2 (second HOA fee for master associations)
- ❌ AssociationName2 (second HOA name)
- ❌ TaxLegalDescription
- ❌ TaxMapNumber
- ❌ TaxBlock
- ❌ TaxLot

### ✅ GROUP 5: Structure & Systems (10 fields mapped)
| RESO Field | Mapped To | Status |
|------------|-----------|--------|
| RoofType[]/Roof | 39_roof_type | ✅ |
| RoofYear/YearRoofInstalled | 40_roof_age_est | ✅ Calculated |
| ConstructionMaterials[]/ExteriorFeatures[] | 41_exterior_material | ✅ |
| FoundationType[]/FoundationDetails | 42_foundation | ✅ |
| WaterHeaterType | 43_water_heater_type | ✅ |
| GarageType | 44_garage_type | ✅ |
| Heating[]+Cooling[] | 45_hvac_type | ✅ Combined |
| PermitHVAC | 46_hvac_age | ✅ |
| LaundryFeatures[] | 47_laundry_type | ✅ |
| PropertyCondition | 48_interior_condition | ✅ |

**Missing:**
- ❌ ArchitecturalStyle (Mediterranean, Ranch, Colonial)
- ❌ BodyType (Detached, Attached)
- ❌ Levels (Split, One Story, Two Story)
- ❌ AttachedGarageYN (is garage attached?)
- ❌ GarageLength/GarageWidth (garage dimensions)
- ❌ NewConstructionYN (is property brand new?)
- ❌ ConstructionMaterialsSource (who verified materials?)
- ❌ WaterHeaterFeatures[] (tankless, solar, etc.)
- ❌ LaundryLevel (which floor is laundry on?)
- ❌ HeatingYN/CoolingYN (boolean flags)

### ✅ GROUP 6: Interior (5 fields mapped)
| RESO Field | Mapped To | Status |
|------------|-----------|--------|
| Flooring[] | 49_flooring_type | ✅ |
| InteriorFeatures[] (filtered) | 50_kitchen_features | ✅ Partial |
| Appliances[] | 51_appliances_included | ✅ |
| FireplaceYN | 52_fireplace_yn | ✅ |
| FireplacesTotal | 53_fireplace_count | ✅ |

**Missing:**
- ❌ KitchenLevel (which floor is kitchen on?)
- ❌ DiningRoomType (separate, combo, none)
- ❌ LivingRoomType (formal, family, great room)
- ❌ BathroomFeatures[] (jetted tub, dual sinks, etc.)
- ❌ BedroomFeatures[] (walk-in closet, ensuite bath)
- ❌ BasementYN (has basement?)
- ❌ BasementFeatures[] (finished, walkout, etc.)
- ❌ WindowFeatures[] (hurricane, impact, tinted)
- ❌ DoorFeatures[] (French, sliding glass, etc.)
- ❌ CeilingFeatures[] (vaulted, tray, coffered)

### ✅ GROUP 7: Exterior (5 fields mapped)
| RESO Field | Mapped To | Status |
|------------|-----------|--------|
| PoolPrivateYN | 54_pool_yn | ✅ |
| PoolFeatures[] | 55_pool_type | ✅ First only |
| PatioAndPorchFeatures[] | 56_deck_patio | ✅ |
| Fencing[] | 57_fence | ✅ |
| LotFeatures[] | 58_landscaping | ✅ |

**Missing:**
- ❌ SpaYN (has spa/hot tub?)
- ❌ SpaFeatures[] (attached to pool, standalone, etc.)
- ❌ PatioArea (sqft of outdoor living space)
- ❌ PorchFeatures[] (covered, screened, open)
- ❌ RoadSurfaceType (paved, gravel, dirt)
- ❌ RoadResponsibility (HOA, private, public)
- ❌ LandLeaseYN (is land leased?)
- ❌ LandLeaseAmount/LandLeaseExpirationDate

### ✅ GROUP 8: Permits (3 fields mapped)
| RESO Field | Mapped To | Status |
|------------|-----------|--------|
| PermitRoof | 60_permit_history_roof | ✅ |
| PermitHVAC | 61_permit_history_hvac | ✅ |
| PermitAdditions | 62_permit_history_other | ✅ |

**Missing:**
- ❌ PermitElectrical
- ❌ PermitPlumbing
- ❌ PermitPool
- ❌ PermitStructural
- ❌ BuildingPermitYN (any permits pulled?)

### ✅ GROUP 9: Schools (5 fields mapped)
| RESO Field | Mapped To | Status |
|------------|-----------|--------|
| SchoolDistrict | 63_school_district | ✅ |
| Elevation | 64_elevation_feet | ✅ |
| ElementarySchool | 65_elementary_school | ✅ |
| MiddleOrJuniorSchool | 68_middle_school | ✅ |
| HighSchool | 71_high_school | ✅ |

**Missing:**
- ❌ ElementarySchoolDistrict (may differ from main district)
- ❌ MiddleSchoolDistrict
- ❌ HighSchoolDistrict
- ❌ SchoolChoice (can choose schools?)

### ✅ GROUP 10: Environment & Risk (1 field mapped)
| RESO Field | Mapped To | Status |
|------------|-----------|--------|
| FloodZone | 119_flood_zone | ✅ |

**Missing (Not in Stellar MLS, from free APIs)**:
- Field 120-129: Climate risks (we get from free APIs)
- Field 130: Solar potential (we get from Google Solar API)

### ✅ GROUP 11: View & Location (3 fields mapped)
| RESO Field | Mapped To | Status |
|------------|-----------|--------|
| View[] | 131_view_type | ✅ |
| LotFeatures[] | 132_lot_features | ✅ Duplicate of 58 |
| GreenEnergyGeneration[] (filtered) | 133_ev_charging | ✅ |

**Missing:**
- ❌ DirectionFaces (which direction house faces) - **WE HAVE THIS! Not mapped**
- ❌ Topography[] (flat, sloped, hilltop, etc.)
- ❌ Vegetation[] (heavily wooded, landscaped, etc.)

### ✅ GROUP 12: Smart Home & Accessibility (2 fields mapped)
| RESO Field | Mapped To | Status |
|------------|-----------|--------|
| InteriorFeatures[] (parsed) | 134_smart_home_features | ✅ Extracted |
| AccessibilityFeatures[] | 135_accessibility_modifications | ✅ |

### ✅ GROUP 13: Special Assessments (1 field mapped)
| RESO Field | Mapped To | Status |
|------------|-----------|--------|
| (Parsed from PublicRemarks) | 138_special_assessments | ✅ NLP |

**Missing:**
- ❌ SpecialListingConditions[] (foreclosure, short sale, etc.)
- ❌ Disclosures[] (lead paint, mold, etc.)

### ✅ GROUP 14: Parking (Stellar MLS Fields 139-143) - ALL MAPPED ✅
| RESO Field | Mapped To | Status |
|------------|-----------|--------|
| CarportYN | 139_carport_yn | ✅ |
| CarportSpaces | 140_carport_spaces | ✅ |
| AttachedGarageYN | 141_garage_attached_yn | ✅ |
| ParkingFeatures[] | 142_parking_features | ✅ |
| AssignedParkingSpaces | 143_assigned_parking_spaces | ✅ |

### ✅ GROUP 15: Building Details (5 fields mapped)
| RESO Field | Mapped To | Status |
|------------|-----------|--------|
| UnitFloor | 144_floor_number | ✅ |
| BuildingFloors | 145_building_total_floors | ✅ |
| BuildingName/BuildingNumber | 146_building_name_number | ✅ |
| ElevatorYN | 147_building_elevator_yn | ✅ |
| FloorsInUnit | 148_floors_in_unit | ✅ |

**Missing:**
- ❌ BuildingAreaSource (who measured building?)
- ❌ CommonWalls (which sides share walls?)
- ❌ UnitTypeType (apartment, condo, townhouse)
- ❌ UnitFeatures[] (balcony, storage, etc.)

### ✅ GROUP 16: Legal & Compliance (6 fields mapped)
| RESO Field | Mapped To | Status |
|------------|-----------|--------|
| SubdivisionName | 149_subdivision_name | ✅ |
| LegalDescription | 150_legal_description | ✅ |
| HomesteadYN | 151_homestead_yn | ✅ |
| CDDYN | 152_cdd_yn | ✅ |
| CDDAnnualFee | 153_annual_cdd_fee | ✅ |
| DirectionFaces | 154_front_exposure | ✅ |

**Missing:**
- ❌ Zoning (residential, commercial, agricultural)
- ❌ ZoningDescription
- ❌ LandUseZoning
- ❌ ExistingLeaseType (if tenant-occupied)

### ✅ GROUP 17: Waterfront (5 fields mapped)
| RESO Field | Mapped To | Status |
|------------|-----------|--------|
| WaterfrontYN | 155_water_frontage_yn | ✅ |
| WaterfrontFeet | 156_waterfront_feet | ✅ |
| WaterAccessYN | 157_water_access_yn | ✅ |
| WaterViewYN | 158_water_view_yn | ✅ |
| WaterBodyName | 159_water_body_name | ✅ |

**Missing:**
- ❌ **WaterfrontFeatures[]** - CRITICAL for FL! (boat dock, boat lift, seawall, etc.)
- ❌ DockType (fixed, floating, lift)
- ❌ NavigableWaterYN (can boat access ocean?)
- ❌ BoatLiftCapacity (lbs capacity)
- ❌ BridgeClearance (for tall boats)
- ❌ CanalFrontage (is it canal vs open water?)
- ❌ IntracoastalAccess (can reach intracoastal?)

### ✅ GROUP 18: Leasing (6 fields mapped)
| RESO Field | Mapped To | Status |
|------------|-----------|--------|
| LeaseConsideredYN | 160_can_be_leased_yn | ✅ |
| MinimumLeaseType/LeaseTerm | 161_minimum_lease_period | ✅ |
| LeaseRestrictionsYN | 162_lease_restrictions_yn | ✅ |
| PetSizeLimit | 163_pet_size_limit | ✅ |
| MaxPetWeight | 164_max_pet_weight | ✅ |
| BuyerFinancingYN | 165_association_approval_yn | ✅ ⚠️ Wrong field! |

**Field 165 Bug**: Maps to `BuyerFinancingYN` but should map to `AssociationApprovalRequired` or similar

**Missing:**
- ❌ OccupantType (owner, tenant, vacant)
- ❌ TenantPays[] (utilities paid by tenant)
- ❌ OwnerPays[] (utilities paid by owner)
- ❌ RentalEquipment[] (appliances included in lease)
- ❌ FurnishedYN (is property furnished?)

### ✅ GROUP 19: Community (3 fields mapped)
| RESO Field | Mapped To | Status |
|------------|-----------|--------|
| CommunityFeatures[] | 166_community_features | ✅ |
| InteriorFeatures[] | 167_interior_features | ✅ |
| ExteriorFeatures[] | 168_exterior_features | ✅ |

### ✅ GROUP 20: Media (Photos) - MAPPED ✅
| RESO Field | Mapped To | Status |
|------------|-----------|--------|
| Media[].MediaURL (first/preferred) | property_photo_url | ✅ |
| Media[].MediaURL (all) | property_photos | ✅ |

---

## HIGH-VALUE UNMAPPED FIELDS

### 🔥 **Priority 1: MUST ADD (High UX Value)**

#### 1. **Waterfront Features** (Critical for Florida)
```typescript
WaterfrontFeatures?: string[];  // ["Boat Dock", "Boat Lift", "Seawall", "Direct Gulf Access"]
```
**Why**: Florida waterfront properties are premium. Buyers NEED to know dock, lift, seawall details.
**Impact**: HIGH - Differentiates waterfront properties
**Difficulty**: EASY - Already in Stellar MLS as array
**Recommendation**: Add as Field 155a or expand Field 155

#### 2. **Price History** (Shows price reductions)
```typescript
OriginalListPrice?: number;      // What property was FIRST listed at
PreviousListPrice?: number;      // What it was listed at BEFORE current price
```
**Why**: Shows price drops → indicates motivated seller, negotiation opportunity
**Impact**: HIGH - Helps buyers identify deals
**Difficulty**: EASY - Simple number fields
**Recommendation**: Add as Fields 10a, 10b

#### 3. **Architectural Style** (Buyer search criteria)
```typescript
ArchitecturalStyle?: string[];  // ["Mediterranean", "Ranch", "Colonial", "Contemporary"]
```
**Why**: Buyers search by style, not just "Single Family"
**Impact**: MEDIUM-HIGH - Common search filter
**Difficulty**: EASY - Already in Stellar MLS
**Recommendation**: Add as Field 26a or expand Field 26

#### 4. **Showing Instructions** (Critical for agents)
```typescript
ShowingInstructions?: string;    // "Call listing agent 24 hrs in advance"
LockBoxType?: string;            // "Combo", "Electronic", "Call Agent"
ShowingRequirements?: string[];  // ["Appointment Only", "See Remarks"]
```
**Why**: Agents need to know HOW to show property
**Impact**: MEDIUM - Improves agent experience
**Difficulty**: EASY - Simple text fields
**Recommendation**: Add as new Fields 171-173

#### 5. **Master Bedroom Location** (Common buyer question)
```typescript
MasterBedroomLevel?: string;     // "Main", "Upper", "Lower"
```
**Why**: FL buyers (especially retirees) want main-floor master
**Impact**: MEDIUM - Common buyer filter
**Difficulty**: EASY - Single field
**Recommendation**: Add as Field 17a

#### 6. **Virtual Tour URL** (Post-COVID standard)
```typescript
VirtualTourURLUnbranded?: string;  // Matterport, 3D tour link
```
**Why**: Buyers expect virtual tours now
**Impact**: MEDIUM - Increases engagement
**Difficulty**: EASY - Single URL field
**Recommendation**: Add as Field 174

#### 7. **Occupancy Status** (Vacant vs tenant-occupied)
```typescript
OccupantType?: string;  // "Owner", "Tenant", "Vacant"
```
**Why**: Investors need to know if tenant-occupied, buyers prefer vacant
**Impact**: MEDIUM - Critical for investors
**Difficulty**: EASY - Single field
**Recommendation**: Add as Field 175

### ⚠️ **Priority 2: SHOULD ADD (Moderate Value)**

#### 8. **Room Counts**
```typescript
RoomsTotal?: number;             // Total room count (not just beds/baths)
BedroomsPossible?: number;       // Potential to add bedroom
```
**Why**: Some buyers filter by total rooms, flex space important
**Impact**: MEDIUM - Niche but useful
**Difficulty**: EASY
**Recommendation**: Add as Fields 17b, 17c

#### 9. **New Construction Flag**
```typescript
NewConstructionYN?: boolean;
```
**Why**: New construction buyers want to filter specifically
**Impact**: MEDIUM - Segment of market
**Difficulty**: EASY
**Recommendation**: Add as Field 25a

#### 10. **Lot Dimensions**
```typescript
LotSizeDimensions?: string;  // "100x150"
```
**Why**: More intuitive than sqft/acres for visualizing lot
**Impact**: LOW-MEDIUM - Nice to have
**Difficulty**: EASY
**Recommendation**: Add as Field 23a

#### 11. **Basement Details** (Less common in FL but exists)
```typescript
BasementYN?: boolean;
BasementFeatures?: string[];  // ["Finished", "Walkout", "Full"]
```
**Why**: Rare in FL but does exist (North FL especially)
**Impact**: LOW - Rare in FL market
**Difficulty**: EASY
**Recommendation**: Add as Fields 176-177

#### 12. **Spa/Hot Tub**
```typescript
SpaYN?: boolean;
SpaFeatures?: string[];  // ["Attached to Pool", "Standalone", "Indoor"]
```
**Why**: Common luxury feature in FL
**Impact**: MEDIUM - Luxury segment
**Difficulty**: EASY
**Recommendation**: Add as Fields 54a-54b

#### 13. **Second HOA Fee** (Master associations)
```typescript
AssociationFee2?: number;
AssociationName2?: string;
```
**Why**: Many FL communities have TWO HOAs (neighborhood + master)
**Impact**: MEDIUM - Critical for accurate cost calculation
**Difficulty**: EASY
**Recommendation**: Add as Fields 31a, 32a

### 📊 **Priority 3: NICE TO HAVE (Low Priority)**

#### 14. **Dining/Living Room Types**
```typescript
DiningRoomType?: string;  // "Separate", "Combo", "None"
LivingRoomType?: string;  // "Formal", "Family", "Great Room"
```
**Impact**: LOW - Niche preference
**Difficulty**: EASY

#### 15. **Window/Door Features**
```typescript
WindowFeatures?: string[];  // ["Hurricane", "Impact", "Tinted"]
DoorFeatures?: string[];    // ["French", "Sliding Glass"]
```
**Impact**: LOW-MEDIUM - Important for FL hurricanes
**Difficulty**: EASY

#### 16. **Ceiling Features**
```typescript
CeilingFeatures?: string[];  // ["Vaulted", "Tray", "Coffered"]
```
**Impact**: LOW - Aesthetic preference
**Difficulty**: EASY

---

## CURRENTLY AVAILABLE BUT UNUSED

These fields are in the `BridgeProperty` interface but NOT mapped:

1. **DirectionFaces** - ✅ **WE HAVE THIS!** Just not mapped to Field 154 correctly
2. **WaterfrontFeatures[]** - 🔥 Critical for FL, NOT mapped
3. **OriginalListPrice** - 🔥 Shows price drops
4. **PreviousListPrice** - 🔥 Shows price history
5. **ArchitecturalStyle** - Not in our type def, may be in Stellar MLS
6. **MasterBedroomLevel** - Not in our type def
7. **ShowingInstructions** - Not in our type def
8. **VirtualTourURLUnbranded** - Not in our type def
9. **OccupantType** - Not in our type def

---

## RECOMMENDATIONS

### **Immediate Actions** (Next Sprint):

1. **Fix DirectionFaces mapping** - Already available, just map to Field 154
2. **Add WaterfrontFeatures[]** - Create Field 155a for FL waterfront properties
3. **Add price history** - Create Fields 10a (OriginalListPrice), 10b (PreviousListPrice)
4. **Add ArchitecturalStyle** - Create Field 26a

### **Short-Term** (Phase 5):

5. Add ShowingInstructions (Field 171)
6. Add MasterBedroomLevel (Field 17a)
7. Add VirtualTourURL (Field 174)
8. Add OccupantType (Field 175)
9. Add second HOA fee fields (31a, 32a)
10. Add SpaYN/SpaFeatures (54a, 54b)

### **Medium-Term** (Phase 6):

11. Add room detail fields (dining room, living room types)
12. Add window/door features (hurricane protection critical for FL)
13. Add basement fields (rare but exists in North FL)
14. Add lot dimensions display

---

## FIELDS WE DON'T NEED

These RESO fields exist but have **low value** for CLUES Dashboard:

- **AgentOnlyRemarks** - Not public-facing
- **ShowingContactPhone** - Security risk
- **PrivateRemarks** - Not for buyers
- **ListAgent* fields** - We're buyer-focused, not agent-focused (yet)
- **BuyerAgent* fields** - Only relevant post-contract
- **MLS internal fields** - ModificationTimestamp, SourceSystemID, etc.
- **Complex legal fields** - Most buyers don't understand them

---

## CONCLUSION

**Current Coverage**: 85/168 fields (~50%) mapped from Stellar MLS
**Completeness**: We're mapping **most critical** fields
**Gaps**: Missing ~10-15 high-value fields that would significantly improve UX

**Next Sprint Priority**:
1. ✅ Fix DirectionFaces mapping (5 min)
2. 🔥 Add WaterfrontFeatures[] (30 min) - CRITICAL for FL
3. 🔥 Add price history fields (30 min) - Shows deals
4. 🔥 Add ArchitecturalStyle (20 min) - Common search filter

**Estimated Impact**: Adding these 4 fields would increase UX value by ~20% for Florida market.
