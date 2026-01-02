# Bridge Interactive / Stellar MLS - Available Unmapped Fields

**Last Updated:** 2026-01-02
**Source:** Bridge Interactive RESO Web API (Stellar MLS - Florida)

## Currently Unmapped High-Value Fields

These fields are available from Stellar MLS via Bridge API but are NOT yet mapped to the 168-field schema. Consider adding them if valuable for your use case.

---

### 📊 PRICING & MARKET DATA

| Bridge API Field | Description | Value | Recommended Action |
|------------------|-------------|-------|-------------------|
| `OriginalListPrice` | Original listing price before changes | Currency | Consider for price history tracking |
| `PreviousListPrice` | Previous listing price | Currency | Useful for price reduction analysis |
| `ListPricePerSquareFoot` | MLS-calculated price/sqft | Currency | Redundant with Field 11 calculation |
| `NetTaxes` | Net annual property taxes | Currency | More accurate than gross taxes? |
| `TaxLotNumber` | Tax lot number | Text | Additional parcel identifier |

---

### 🏠 PROPERTY DETAILS

| Bridge API Field | Description | Value | Recommended Action |
|------------------|-------------|-------|-------------------|
| `AboveGradeFinishedArea` | Above-grade finished sq ft | Number | Useful for multi-level properties |
| `BelowGradeFinishedArea` | Below-grade finished sq ft (basement) | Number | Rare in FL, but useful |
| `GrossLivingArea` | Total living area | Number | May duplicate Field 21 |
| `LotSizeSource` | Source of lot size measurement | Text | Data quality indicator |
| `YearBuiltDetails` | Detailed year built info | Text | Additional context |
| `YearBuiltSource` | Source of year built | Text | Data quality indicator |

---

### 🛁 BATHROOMS & ROOMS

| Bridge API Field | Description | Value | Recommended Action |
|------------------|-------------|-------|-------------------|
| `BathroomsTotalDecimal` | Total bathrooms (decimal) | Number | More precise than whole numbers |
| `ThreeQuarterBathrooms` | 3/4 bathrooms (toilet, sink, shower) | Number | Missing from current schema |
| `BedroomsAboveGrade` | Bedrooms above grade | Number | Useful for multi-level |
| `BedroomsBelowGrade` | Bedrooms below grade | Number | Basement bedrooms |
| `RoomsTotal` | Total number of rooms | Number | Additional property metric |
| `LivingRoomDimensions` | Living room size | Text | Detail for room sizes |
| `MasterBedroomDimensions` | Master bedroom size | Text | Detail for room sizes |

---

### 🏗️ CONSTRUCTION & STRUCTURE

| Bridge API Field | Description | Value | Recommended Action |
|------------------|-------------|-------|-------------------|
| `ArchitecturalStyle` | Architectural style | Text | Aesthetic info |
| `BuildingName` | Building/complex name | Text | Duplicate of Field 146? |
| `ConstructionMaterials` | Construction materials list | Array | More detail than Field 41 |
| `Roof` | Roof material (array) | Array | More detail than Field 39 |
| `WindowFeatures` | Window types/features | Array | Additional detail |
| `DoorFeatures` | Door features | Array | Security/aesthetics |
| `Flooring` | Flooring materials (array) | Array | More detail than Field 49 |
| `InteriorFeatures` | All interior features | Array | Comprehensive list |
| `ExteriorFeatures` | All exterior features | Array | Comprehensive list |

---

### 🌡️ HEATING & COOLING

| Bridge API Field | Description | Value | Recommended Action |
|------------------|-------------|-------|-------------------|
| `Cooling` | Cooling system details | Array | More detail than Field 45 |
| `CoolingYN` | Has cooling? | Boolean | Validation field |
| `Heating` | Heating system details | Array | More detail than Field 45 |
| `HeatingYN` | Has heating? | Boolean | Validation field |

---

### 💧 UTILITIES

| Bridge API Field | Description | Value | Recommended Action |
|------------------|-------------|-------|-------------------|
| `WaterSource` | Water source type | Array | Municipal vs well |
| `Sewer` | Sewer type | Array | Septic vs municipal |
| `UtilitiesAvailable` | All utilities available | Array | Comprehensive utilities list |

---

### 🚗 PARKING & GARAGE

| Bridge API Field | Description | Value | Recommended Action |
|------------------|-------------|-------|-------------------|
| `GarageYN` | Has garage? | Boolean | Already inferred |
| `GarageSpaces` | Garage spaces | Number | Duplicate Field 28 |
| `AttachedGarageYN` | Garage attached? | Boolean | Field 141 covers this |
| `ParkingTotal` | Total parking | Number | Field 29 covers this |
| `OpenParkingSpaces` | Open parking spaces | Number | Additional parking detail |
| `CoveredSpaces` | Covered parking spaces | Number | Additional parking detail |

---

### 🏊 AMENITIES

| Bridge API Field | Description | Value | Recommended Action |
|------------------|-------------|-------|-------------------|
| `PoolFeatures` | Pool features/equipment | Array | More detail than Field 55 |
| `PoolPrivateYN` | Pool is private? | Boolean | Condo/shared pool |
| `SpaYN` | Has spa/hot tub? | Boolean | Additional amenity |
| `SpaFeatures` | Spa features | Array | Amenity detail |
| `PatioAndPorchFeatures` | Patio/porch details | Array | More detail than Field 56 |
| `SecurityFeatures` | Security system details | Array | Security info |
| `FireplaceFeatures` | Fireplace details | Array | More than just count |

---

### 🏢 ASSOCIATION & COMMUNITY

| Bridge API Field | Description | Value | Recommended Action |
|------------------|-------------|-------|-------------------|
| `AssociationFee` | Association fee | Currency | Duplicate Field 31 |
| `AssociationFeeFrequency` | Fee frequency | Text | Used in Field 31 conversion |
| `AssociationFee2` | Secondary association fee | Currency | Some have 2 HOAs! |
| `AssociationFee2Frequency` | Secondary fee frequency | Text | Frequency for 2nd HOA |
| `AssociationName` | Association name | Text | Duplicate Field 32 |
| `AssociationName2` | Secondary association name | Text | 2nd HOA name |
| `CommunityFeatures` | Community amenities | Array | Already in Field 166 |
| `AssociationAmenities` | HOA amenities | Array | Additional amenity detail |

---

### 📅 DATES & LISTING INFO

| Bridge API Field | Description | Value | Recommended Action |
|------------------|-------------|-------|-------------------|
| `OnMarketDate` | Date property went on market | Date | Market timing analysis |
| `OffMarketDate` | Date property went off market | Date | Sale tracking |
| `ModificationTimestamp` | Last listing modification | DateTime | Freshness indicator |
| `StatusChangeTimestamp` | Status last changed | DateTime | Status tracking |
| `ContractStatusChangeDate` | Contract status change | Date | Transaction tracking |
| `WithdrawnDate` | Date listing withdrawn | Date | Listing history |
| `CumulativeDaysOnMarket` | Total days on market | Number | Market analysis |
| `DaysOnMarket` | Current days on market | Number | Marketing metric |

---

### 💰 FINANCIAL & TERMS

| Bridge API Field | Description | Value | Recommended Action |
|------------------|-------------|-------|-------------------|
| `BuyerFinancing` | Accepted financing types | Array | Buyer info |
| `Financing` | Financing terms | Array | Already in Field 102 |
| `SpecialListingConditions` | Special conditions | Array | Already extracted |
| `Concessions` | Seller concessions | Text | Negotiation info |
| `Disclosures` | Property disclosures | Array | Legal info |

---

### 📝 LISTING & AGENT

| Bridge API Field | Description | Value | Recommended Action |
|------------------|-------------|-------|-------------------|
| `ListAgentFullName` | Listing agent name | Text | Agent tracking |
| `ListAgentEmail` | Listing agent email | Email | Contact info |
| `ListAgentDirectPhone` | Agent phone | Phone | Contact info |
| `ListOfficeName` | Listing office | Text | Office tracking |
| `ListOfficePhone` | Office phone | Phone | Contact info |
| `CoListAgentFullName` | Co-listing agent | Text | Multiple agents |
| `ShowingInstructions` | How to show property | Text | Showing process |
| `ShowingContactName` | Showing contact | Text | Contact info |
| `ShowingContactPhone` | Showing contact phone | Phone | Contact info |

---

### 🏆 SPECIAL DESIGNATIONS

| Bridge API Field | Description | Value | Recommended Action |
|------------------|-------------|-------|-------------------|
| `NewConstructionYN` | Is new construction? | Boolean | Important designation |
| `ShortSale` | Is short sale? | Boolean | Sale type |
| `REOPropertyYN` | Is REO/foreclosure? | Boolean | Sale type |
| `BankOwned` | Is bank-owned? | Boolean | Sale type |

---

### 🌊 WATERFRONT (Enhanced)

| Bridge API Field | Description | Value | Recommended Action |
|------------------|-------------|-------|-------------------|
| `Waterfront Features` | Waterfront amenities | Array | More than Y/N |
| `BodyOfWaterName` | Name of water body | Text | Already in Field 159 |
| `WaterfrontYN` | Has waterfront? | Boolean | Already in Field 155 |
| `DockType` | Dock type | Array | Waterfront detail |
| `DockDimensions` | Dock size | Text | Boating info |
| `LiftCapacity` | Boat lift capacity | Text | Boating amenity |

---

### 🔧 CONDITION & REPAIRS

| Bridge API Field | Description | Value | Recommended Action |
|------------------|-------------|-------|-------------------|
| `PropertyCondition` | Overall condition | Text | Important metric |
| `DamageInspection` | Damage inspection details | Text | Condition info |
| `Repairs` | Required repairs | Text | Buyer consideration |

---

### 📏 LOT & LAND

| Bridge API Field | Description | Value | Recommended Action |
|------------------|-------------|-------|-------------------|
| `LotDimensions` | Lot dimensions | Text | More than just sq ft |
| `LotSizeDimensions` | Lot size dimensions | Text | Shape/layout |
| `Topography` | Lot topography | Array | Already in Field 132 |
| `Vegetation` | Vegetation type | Array | Already in Field 132 |
| `LotFeatures` | Lot features | Array | Already in Field 132 |
| `FrontageType` | Frontage type | Array | Lot characteristic |
| `FrontageLength` | Frontage length | Number | Lot measurement |

---

### 📷 MEDIA

| Bridge API Field | Description | Value | Recommended Action |
|------------------|-------------|-------|-------------------|
| `Media` | All property media URLs | Array | Photos already handled |
| `VirtualTourURLUnbranded` | Virtual tour URL | URL | 3D tour link |
| `VideoURL` | Video URL | URL | Video tour |

---

## Recommendations for Schema Enhancement

### High Priority - Add These Fields

1. **Three-Quarter Bathrooms** → New Field 19.5?
2. **Property Condition** → New field for overall condition rating
3. **New Construction Y/N** → Important designation
4. **Days on Market** → Market analysis metric
5. **Above/Below Grade Areas** → Multi-level property details

### Medium Priority - Consider Adding

1. **HOA Fee #2** → Properties with multiple HOAs
2. **Spa/Hot Tub Y/N** → Amenity tracking
3. **Security Features** → Safety amenity
4. **Lot Dimensions** → More detailed lot info
5. **Seller Concessions** → Financial negotiations

### Low Priority - Nice to Have

1. **Agent contact info** → If building agent directory
2. **Showing instructions** → If building showing scheduler
3. **Virtual tour URLs** → Enhanced media experience

---

## Implementation Notes

**To add any of these fields:**

1. Add to `src/types/fields-schema.ts` - ALL_FIELDS array
2. Add mapping in `src/lib/bridge-field-mapper.ts`
3. Add to API conversion in `api/property/search.ts`
4. Add UI mapping in `src/lib/field-normalizer.ts`
5. Update PropertyDetail.tsx to display the field

**Current field count:** 168
**Recommended additions:** 5-10 high-priority fields
**Maximum schema capacity:** ~200 fields before UX suffers
