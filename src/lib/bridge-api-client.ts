/**
 * Bridge Interactive API Client
 * RESO Web API integration for MLS property data
 * Documentation: https://www.bridgeinteractive.com/developers/bridge-api/
 */

// Bridge API timeout - matches STELLAR_MLS_TIMEOUT in search.ts
const BRIDGE_API_TIMEOUT = 15000; // 15 seconds for Bridge API calls

export interface BridgeAPIConfig {
  clientId?: string;
  clientSecret?: string;
  serverToken?: string; // Pre-generated server token (recommended)
  baseUrl: string;
  dataSystem: string;
}

export interface BridgeAuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  expiresAt: number; // Timestamp when token expires
}

export interface BridgePropertySearchParams {
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  mlsNumber?: string;
  minPrice?: number;
  maxPrice?: number;
  minBeds?: number;
  maxBeds?: number;
  minBaths?: number;
  maxBaths?: number;
  propertyType?: string;
  status?: string;
  latitude?: number;
  longitude?: number;
  radiusMiles?: number;
  top?: number; // Limit results
  skip?: number; // Pagination offset
}

export interface BridgePropertyResponse {
  '@odata.context': string;
  '@odata.count'?: number;
  value: BridgeProperty[];
}

export interface BridgeProperty {
  // Core Identity
  ListingKey?: string;
  ListingId?: string;
  ListingKeyNumeric?: number;

  // Address
  UnparsedAddress?: string;
  StreetNumber?: string;
  StreetName?: string;
  StreetSuffix?: string;
  UnitNumber?: string;
  City?: string;
  StateOrProvince?: string;
  PostalCode?: string;
  County?: string;

  // Pricing
  ListPrice?: number;
  OriginalListPrice?: number;
  PreviousListPrice?: number;
  ClosePrice?: number;
  ListPricePerSquareFoot?: number;  // MLS-calculated price per sqft (LP/SqFt)

  // Property Details
  BedroomsTotal?: number;
  BathroomsFull?: number;
  BathroomsHalf?: number;
  BathroomsTotalInteger?: number; // Deprecated - use BathroomsTotalDecimal instead
  BathroomsTotalDecimal?: number; // FIXED 2026-01-12: Preferred - includes half baths (2.5, 3.5, etc.)
  LivingArea?: number;
  BuildingAreaTotal?: number;
  LotSizeAcres?: number;
  LotSizeSquareFeet?: number;
  YearBuilt?: number;
  PropertyType?: string;
  PropertySubType?: string;
  PropertyCondition?: string;
  ArchitecturalStyle?: string[];  // e.g., ["Ranch", "Mediterranean", "Colonial", "Contemporary"]
  Stories?: number;
  StoriesTotal?: number;
  Levels?: string[]; // e.g., ["One"], ["Two"] - text representation of floors

  // Parking & Garage
  GarageSpaces?: number;
  GarageType?: string;
  ParkingTotal?: number;
  CarportSpaces?: number;
  CarportYN?: boolean;
  AttachedGarageYN?: boolean;
  ParkingFeatures?: string[];
  AssignedParkingSpaces?: number;

  // Status & Dates
  StandardStatus?: string;
  MlsStatus?: string;
  ListingContractDate?: string;
  OnMarketDate?: string;
  CloseDate?: string;
  DaysOnMarket?: number;
  CumulativeDaysOnMarket?: number;

  // HOA & Fees
  AssociationYN?: boolean;
  AssociationFee?: number;
  AssociationFeeFrequency?: string;
  AssociationName?: string;
  AssociationFeeIncludes?: string[];

  // Taxes
  TaxAnnualAmount?: number;
  TaxYear?: number;
  TaxAssessedValue?: number;
  ParcelNumber?: string;

  // Legal & Compliance
  LegalDescription?: string;
  Ownership?: string;
  HomesteadYN?: boolean;
  CDDYN?: boolean;
  CDDAnnualFee?: number;
  BuyerFinancingYN?: boolean;

  // Financing
  Financing?: string[];  // e.g., ["Cash", "Conventional", "FHA", "VA"]
  FinancingAvailable?: string[];  // Stellar MLS field name: "Financing Avail"
  FinancingProposed?: string[];

  // Structure & Systems
  RoofType?: string[];
  Roof?: string | string[];  // Can be string or array
  RoofMaterial?: string[];   // Alternative RESO field name
  RoofYear?: number;
  YearRoofInstalled?: number;
  PermitRoof?: string;
  PermitHVAC?: string;
  PermitAdditions?: string;
  ExteriorFeatures?: string[];
  ConstructionMaterials?: string[];
  ExteriorConstruction?: string[];  // Stellar MLS field name for exterior materials
  Exterior?: string[];  // Alternative field name
  FoundationType?: string[];
  FoundationDetails?: string;
  Foundation?: string | string[];  // Alternative field name
  Heating?: string[];
  Cooling?: string[];
  CoolingYN?: boolean;

  // Interior Features
  InteriorFeatures?: string[];
  AdditionalRooms?: string[];  // e.g., ["Den/Library/Office", "Interior In-Law Suite w/No Private Entry"]
  Flooring?: string[];
  Appliances?: string[];
  FireplacesTotal?: number;
  FireplaceYN?: boolean;
  LaundryFeatures?: string[];
  WaterHeaterType?: string;
  WaterHeaterFeatures?: string[];
  AccessibilityFeatures?: string[];
  MasterBedroomLevel?: string;  // Primary bedroom location: "Main", "Upper", "Lower" - Field 53

  // Exterior Features
  PoolPrivateYN?: boolean;
  PoolFeatures?: string[];
  PatioAndPorchFeatures?: string[];
  Fencing?: string[];
  LotFeatures?: string[];
  View?: string[];
  GreenEnergyGeneration?: string[];

  // Location
  Latitude?: number;
  Longitude?: number;
  Directions?: string;
  DirectionFaces?: string;
  Elevation?: number;

  // Schools
  ElementarySchool?: string;
  MiddleOrJuniorSchool?: string;
  HighSchool?: string;
  SchoolDistrict?: string;

  // Building Details
  UnitFloor?: number;
  BuildingFloors?: number;
  BuildingName?: string;
  BuildingNumber?: string;
  ElevatorYN?: boolean;
  FloorsInUnit?: number;

  // Community
  CommunityFeatures?: string[];
  SubdivisionName?: string;

  // Waterfront
  WaterfrontYN?: boolean;
  WaterfrontFeatures?: string[];
  WaterBodyName?: string;
  WaterfrontFeet?: number;
  WaterAccessYN?: boolean;
  WaterViewYN?: boolean;
  CanalFrontage?: number;  // Alternative field name for waterfront feet

  // Environmental
  FloodZone?: string;

  // Leasing
  LeaseConsideredYN?: boolean;
  PetsAllowed?: string[];
  MinimumLeaseType?: string;
  LeaseTerm?: string;
  LeaseRestrictionsYN?: boolean;
  PetSizeLimit?: string;
  MaxPetWeight?: number;
  PetRestrictions?: string;  // Full pet restrictions text from MLS
  AssociationApprovalRequiredYN?: boolean;  // HOA approval required for buyers - Field 165

  // Age & Senior Community
  HousingForOlderPersonsYN?: boolean;  // 55+ community (Housing for Older Per)
  SeniorCommunityYN?: boolean;  // Alternative field name

  // Spa/Hot Tub
  SpaYN?: boolean;
  SpaFeatures?: string[];

  // Dock
  DockYN?: boolean;
  DockType?: string[];
  DockDescription?: string;

  // Furnished
  FurnishedYN?: boolean;
  Furnishings?: string;

  // Window Features
  WindowFeatures?: string[];

  // Additional
  Remarks?: string;
  PublicRemarks?: string;
  PrivateRemarks?: string;

  // Media & Photos
  Media?: Array<{
    MediaURL?: string;
    Order?: number;
    MediaCategory?: string;
    ShortDescription?: string;
    PreferredPhotoYN?: boolean;
    MediaModificationTimestamp?: string;
  }>;

  // Many more RESO fields available...
  [key: string]: any;
}

/**
 * Bridge Interactive API Client Class
 */
export class BridgeAPIClient {
  private config: BridgeAPIConfig;
  private token: BridgeAuthToken | null = null;

  constructor(config: BridgeAPIConfig) {
    this.config = config;
  }

  /**
   * Authenticate and get access token
   */
  private async authenticate(): Promise<BridgeAuthToken> {
    // If using pre-generated server token, return it directly
    if (this.config.serverToken) {
      console.log('[Bridge API] Using pre-generated server token');
      return {
        access_token: this.config.serverToken,
        token_type: 'Bearer',
        expires_in: 999999999, // Server tokens don't expire
        expiresAt: Date.now() + 999999999000,
      };
    }

    // Check if we have a valid cached token
    if (this.token && this.token.expiresAt > Date.now()) {
      return this.token;
    }

    console.log('[Bridge API] Authenticating with Client ID/Secret...');
    console.log('[Bridge API] Base URL:', this.config.baseUrl);
    console.log('[Bridge API] Data System:', this.config.dataSystem);
    console.log('[Bridge API] Client ID:', this.config.clientId ? `${this.config.clientId.substring(0, 8)}...` : 'MISSING');
    console.log('[Bridge API] Client Secret:', this.config.clientSecret ? 'Present (length: ' + this.config.clientSecret.length + ')' : 'MISSING');

    // Bridge API requires data system in auth URL: /api/v2/{dataSystem}/OData/authenticate
    const authUrl = `${this.config.baseUrl}/${this.config.dataSystem}/OData/authenticate`;
    const credentials = `${this.config.clientId}:${this.config.clientSecret}`;
    const base64Credentials = Buffer.from(credentials).toString('base64');

    console.log('[Bridge API] Auth URL:', authUrl);
    console.log('[Bridge API] Credentials length:', credentials.length);

    // Create AbortController for 15s timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), BRIDGE_API_TIMEOUT);

    try {
      console.log('[Bridge API] Attempting authentication with Basic Auth (15s timeout)...');
      const response = await fetch(authUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${base64Credentials}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      console.log('[Bridge API] Auth response status:', response.status, response.statusText);
      console.log('[Bridge API] Auth response headers:', JSON.stringify(Object.fromEntries(response.headers.entries())));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Bridge API] Auth failed - Response:', errorText);
        throw new Error(`Authentication failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      // Store token with expiration time
      this.token = {
        access_token: data.access_token,
        token_type: data.token_type || 'Bearer',
        expires_in: data.expires_in || 3600,
        expiresAt: Date.now() + ((data.expires_in || 3600) * 1000) - 60000, // Refresh 1 min early
      };

      console.log('[Bridge API] Authentication successful');
      return this.token;
    } catch (error) {
      console.error('[Bridge API] Authentication error:', error);
      throw error;
    }
  }

  /**
   * Build OData query string from search parameters
   */
  private buildODataQuery(params: BridgePropertySearchParams): string {
    const filters: string[] = [];

    console.log('[Bridge API] buildODataQuery received params:', JSON.stringify(params, null, 2));

    // Address search - try BOTH UnparsedAddress AND structured fields
    if (params.address) {
      const escapedAddress = params.address.replace(/'/g, "''");

      // Try to parse street number and name
      const streetMatch = params.address.match(/^(\d+)\s+(.+)$/);
      if (streetMatch) {
        const [, streetNumber, streetName] = streetMatch;
        const escapedNumber = streetNumber.replace(/'/g, "''");

        // Extract just the street name base without suffix (e.g., "111th" from "111th Ln")
        const streetNameBase = streetName.replace(/\s+(Ln|Lane|St|Street|Dr|Drive|Ave|Avenue|Rd|Road|Blvd|Boulevard|Ct|Court|Cir|Circle|Way|Pl|Place|Ter|Terrace)$/i, '').trim();
        const escapedNameBase = streetNameBase.replace(/'/g, "''");
        const escapedName = streetName.replace(/'/g, "''");

        // Search with multiple strategies:
        // 1. UnparsedAddress contains full address
        // 2. StreetNumber + StreetName exact
        // 3. StreetNumber + just the street base (e.g., "111th" without "Ln")
        filters.push(`(contains(tolower(UnparsedAddress), tolower('${escapedAddress}')) or ` +
          `(StreetNumber eq '${escapedNumber}' and contains(tolower(StreetName), tolower('${escapedName}'))) or ` +
          `(StreetNumber eq '${escapedNumber}' and contains(tolower(StreetName), tolower('${escapedNameBase}'))))`);
      } else {
        // Fallback to UnparsedAddress only if we can't parse street number
        filters.push(`contains(tolower(UnparsedAddress), tolower('${escapedAddress}'))`);
      }
    }

    // City filter - exact match (case-insensitive)
    if (params.city) {
      const escapedCity = params.city.replace(/'/g, "''");
      filters.push(`tolower(City) eq tolower('${escapedCity}')`);
    }

    // State filter - exact match
    if (params.state) {
      const escapedState = params.state.replace(/'/g, "''");
      filters.push(`StateOrProvince eq '${escapedState}'`);
    }

    // ZIP code filter - exact match
    if (params.zipCode) {
      console.log('[Bridge API] Adding PostalCode filter:', params.zipCode);
      filters.push(`PostalCode eq '${params.zipCode}'`);
    } else {
      console.log('[Bridge API] ⚠️ params.zipCode is undefined/null/empty');
    }
    // MLS Number filter - try BOTH ListingId AND ListingKey (bridge-field-mapper uses ListingId || ListingKey)
    if (params.mlsNumber) {
      const escapedMls = params.mlsNumber.replace(/'/g, "''");
      console.log('[Bridge API] 🔍 Searching for MLS#:', escapedMls);
      // Try both fields - Stellar MLS may use either ListingId or ListingKey
      filters.push(`(ListingId eq '${escapedMls}' or ListingKey eq '${escapedMls}')`);
    }

    // Price range
    if (params.minPrice !== undefined) {
      filters.push(`ListPrice ge ${params.minPrice}`);
    }
    if (params.maxPrice !== undefined) {
      filters.push(`ListPrice le ${params.maxPrice}`);
    }

    // Beds/Baths
    if (params.minBeds !== undefined) {
      filters.push(`BedroomsTotal ge ${params.minBeds}`);
    }
    if (params.maxBeds !== undefined) {
      filters.push(`BedroomsTotal le ${params.maxBeds}`);
    }
    if (params.minBaths !== undefined) {
      // FIXED 2026-01-12: Use BathroomsTotalDecimal for consistency with field 20 mapping
      filters.push(`BathroomsTotalDecimal ge ${params.minBaths}`);
    }
    if (params.maxBaths !== undefined) {
      // FIXED 2026-01-12: Use BathroomsTotalDecimal for consistency with field 20 mapping
      filters.push(`BathroomsTotalDecimal le ${params.maxBaths}`);
    }

    // Property type
    if (params.propertyType) {
      const escapedType = params.propertyType.replace(/'/g, "''");
      filters.push(`PropertyType eq '${escapedType}'`);
    }

    // Status - REMOVED FILTER: Don't filter by status in query
    // Instead, we'll get ALL listings and filter client-side to prefer most recent Active
    // This prevents missing listings due to status value variations (Active vs Active-Contingent, etc.)
    // The client-side filter happens in getPropertyByAddress()
    if (params.status) {
      // Only apply status filter if EXPLICITLY requested by caller
      const escapedStatus = params.status.replace(/'/g, "''");
      filters.push(`StandardStatus eq '${escapedStatus}'`);
    }

    // Geographic search (radius)
    if (params.latitude && params.longitude && params.radiusMiles) {
      const point = `POINT(${params.longitude} ${params.latitude})`;
      filters.push(`geo.distance(Coordinates, geography'${point}') le ${params.radiusMiles}`);
    }

    // Build query string
    const queryParts: string[] = [];

    if (filters.length > 0) {
      queryParts.push(`$filter=${filters.join(' and ')}`);
    }

    // CRITICAL: Sort by most recent listing date FIRST
    // This ensures if multiple listings exist for same address, we get the CURRENT one
    queryParts.push('$orderby=ListingContractDate desc');

    if (params.top) {
      queryParts.push(`$top=${params.top}`);
    }

    if (params.skip) {
      queryParts.push(`$skip=${params.skip}`);
    }

    // Always request count
    queryParts.push('$count=true');

    // IMPORTANT: Request Media (photos) to be included in response
    queryParts.push('$expand=Media');

    return queryParts.join('&');
  }

  /**
   * Search for properties
   */
  async searchProperties(params: BridgePropertySearchParams): Promise<BridgePropertyResponse> {
    const token = await this.authenticate();

    const query = this.buildODataQuery(params);
    const url = `${this.config.baseUrl}/OData/${this.config.dataSystem}/Property?${query}`;

    console.log('[Bridge API] Searching properties:', url);

    // Create AbortController for 15s timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), BRIDGE_API_TIMEOUT);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `${token.token_type} ${token.access_token}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Property search failed: ${response.status} - ${errorText}`);
      }

      const data: BridgePropertyResponse = await response.json();
      console.log(`[Bridge API] Found ${data.value.length} properties`);
      console.log('[Bridge API] Response @odata.count:', data['@odata.count']);
      console.log('[Bridge API] Response @odata.context:', data['@odata.context']);

      // DEBUG: Check if Media is actually in the response from $expand=Media
      if (data.value.length > 0) {
        const firstProperty = data.value[0];
        console.log('[Bridge API] 🔍 MEDIA DEBUG - First property Media check:', {
          hasMedia: !!firstProperty.Media,
          mediaType: typeof firstProperty.Media,
          isArray: Array.isArray(firstProperty.Media),
          length: firstProperty.Media?.length || 0,
          ListingKey: firstProperty.ListingKey || firstProperty.ListingId,
        });
        if (firstProperty.Media && Array.isArray(firstProperty.Media) && firstProperty.Media.length > 0) {
          console.log('[Bridge API] 📸 Media[0] sample:', firstProperty.Media[0]);
        } else {
          console.log('[Bridge API] ⚠️ Media is EMPTY in $expand response despite properties having photos in MLS!');
        }
      }

      if (data.value.length === 0) {
        console.log('[Bridge API] NO PROPERTIES FOUND - This could mean:');
        console.log('  1. Property not in approved feed type (check IDX/VOW restrictions)');
        console.log('  2. Search query not matching any records');
        console.log('  3. Data access not fully provisioned yet');
        console.log('[Bridge API] Try this test query in Bridge API Explorer:');
        console.log(`  ${this.config.baseUrl}/OData/${this.config.dataSystem}/Property?$top=5`);
      }

      return data;
    } catch (error) {
      console.error('[Bridge API] Search error:', error);
      throw error;
    }
  }

  /**
   * Get property by MLS number
   */
  async getPropertyByMLS(mlsNumber: string): Promise<BridgeProperty | null> {
    const response = await this.searchProperties({
      mlsNumber,
      top: 1,
    });

    return response.value.length > 0 ? response.value[0] : null;
  }

  /**
   * Helper: Select best listing from multiple results AND merge historical sale data
   * Prefer: Active > Pending > Closed (for current listing data)
   * BUT ALSO: Extract historical sale data from most recent Closed/Sold listing
   *
   * CRITICAL: This ensures we get BOTH:
   * - Current listing price/MLS# from Active listing
   * - Last sale price/date from previous Closed listing
   */
  private selectBestListing(properties: BridgeProperty[]): BridgeProperty | null {
    if (properties.length === 0) return null;
    if (properties.length === 1) return properties[0];

    console.log(`[Bridge API] 🔍 Selecting best from ${properties.length} listings...`);

    // Define status priority (lower = better)
    const statusPriority: Record<string, number> = {
      'Active': 1,
      'Active-Contingent': 2,
      'Active-Under Contract': 3,
      'Pending': 4,
      'Closed': 5,
      'Sold': 6,
      'Canceled': 7,
      'Expired': 8,
    };

    const getStatusPriority = (status: string | undefined): number => {
      if (!status) return 99;
      // Check exact match first
      if (statusPriority[status]) return statusPriority[status];
      // Check partial match (e.g., "Active" in "Active-Open")
      const lowerStatus = status.toLowerCase();
      if (lowerStatus.includes('active')) return 1;
      if (lowerStatus.includes('pending')) return 4;
      if (lowerStatus.includes('closed') || lowerStatus.includes('sold')) return 5;
      return 99;
    };

    // Sort by: 1) Status priority, 2) Most recent listing date
    const sorted = [...properties].sort((a, b) => {
      const aPriority = getStatusPriority(a.StandardStatus || a.MlsStatus);
      const bPriority = getStatusPriority(b.StandardStatus || b.MlsStatus);

      if (aPriority !== bPriority) {
        return aPriority - bPriority; // Lower priority number = better
      }

      // Same status - prefer most recent listing date
      const aDate = new Date(a.ListingContractDate || a.OnMarketDate || '1900-01-01');
      const bDate = new Date(b.ListingContractDate || b.OnMarketDate || '1900-01-01');
      return bDate.getTime() - aDate.getTime(); // Most recent first
    });

    const best = sorted[0];
    console.log(`[Bridge API] ✅ Selected primary listing: MLS# ${best.ListingId}, Status: ${best.StandardStatus || best.MlsStatus}, Date: ${best.ListingContractDate || best.OnMarketDate}`);

    // CRITICAL: Merge historical sale data from most recent Closed/Sold listing
    // This ensures field 13_last_sale_date and 14_last_sale_price are populated
    const closedListings = sorted.filter(p => {
      const status = (p.StandardStatus || p.MlsStatus || '').toLowerCase();
      return status.includes('closed') || status.includes('sold');
    });

    if (closedListings.length > 0) {
      // Sort closed listings by CloseDate (most recent first)
      const sortedClosed = closedListings.sort((a, b) => {
        const aDate = new Date(a.CloseDate || '1900-01-01');
        const bDate = new Date(b.CloseDate || '1900-01-01');
        return bDate.getTime() - aDate.getTime();
      });

      const mostRecentSale = sortedClosed[0];

      // If the primary (Active) listing doesn't have CloseDate/ClosePrice, merge from Closed listing
      if (!best.CloseDate && mostRecentSale.CloseDate) {
        best.CloseDate = mostRecentSale.CloseDate;
        console.log(`[Bridge API] 📝 Merged CloseDate from MLS# ${mostRecentSale.ListingId}: ${mostRecentSale.CloseDate}`);
      }
      if (!best.ClosePrice && mostRecentSale.ClosePrice) {
        best.ClosePrice = mostRecentSale.ClosePrice;
        console.log(`[Bridge API] 📝 Merged ClosePrice from MLS# ${mostRecentSale.ListingId}: $${mostRecentSale.ClosePrice?.toLocaleString()}`);
      }
    }

    // CRITICAL: Use YearBuilt from OLDEST listing (most reliable)
    // Newer listings may have incorrect/updated year built values
    // The listing closest to construction date has most accurate data
    if (sorted.length > 1) {
      // Sort by listing date (oldest first) to find original listing
      const sortedByAge = [...sorted].sort((a, b) => {
        const aDate = new Date(a.ListingContractDate || a.OnMarketDate || a.CloseDate || '2999-01-01');
        const bDate = new Date(b.ListingContractDate || b.OnMarketDate || b.CloseDate || '2999-01-01');
        return aDate.getTime() - bDate.getTime();
      });

      const oldestListing = sortedByAge[0];

      // If oldest listing has YearBuilt and it's different from current
      if (oldestListing.YearBuilt &&
          best.YearBuilt &&
          oldestListing.YearBuilt !== best.YearBuilt) {
        console.warn(`[Bridge API] ⚠️ YearBuilt conflict: Active listing shows ${best.YearBuilt}, oldest listing (MLS# ${oldestListing.ListingId}) shows ${oldestListing.YearBuilt}`);
        console.log(`[Bridge API] 📝 Using YearBuilt from oldest listing: ${oldestListing.YearBuilt} (more reliable)`);
        best.YearBuilt = oldestListing.YearBuilt;
      }
    }

    if (sorted.length > 1) {
      console.log(`[Bridge API] 📋 Other listings found:`);
      sorted.slice(1).forEach((prop, idx) => {
        console.log(`   ${idx + 2}. MLS# ${prop.ListingId}, Status: ${prop.StandardStatus || prop.MlsStatus}, Date: ${prop.ListingContractDate || prop.OnMarketDate}`);
      });
    }

    return best;
  }

  /**
   * Extract unit number from address string
   * Returns { baseAddress, unitNumber } or null if no unit found
   */
  private extractUnitNumber(address: string): { baseAddress: string; unitNumber: string } | null {
    const unitPatterns = [
      { pattern: /^(.+?)\s+(?:apt|apartment)\s*#?(\d+[a-z]?)$/i, type: 'apt' },
      { pattern: /^(.+?)\s+(?:unit|ste|suite)\s*#?(\d+[a-z]?)$/i, type: 'unit' },
      { pattern: /^(.+?)\s+#(\d+[a-z]?)$/i, type: 'hash' },
      { pattern: /^(.+?),?\s+(?:apt|apartment)\s*#?(\d+[a-z]?)$/i, type: 'apt_comma' },
      { pattern: /^(.+?),?\s+(?:unit|ste|suite)\s*#?(\d+[a-z]?)$/i, type: 'unit_comma' },
    ];

    for (const { pattern, type } of unitPatterns) {
      const match = address.match(pattern);
      if (match) {
        const baseAddress = match[1].trim();
        const unitNumber = match[2].trim();
        console.log(`[Bridge API] 🏢 Extracted unit ${unitNumber} from address (type: ${type})`);
        console.log(`[Bridge API]    Base: "${baseAddress}"`);
        console.log(`[Bridge API]    Unit: "${unitNumber}"`);
        return { baseAddress, unitNumber };
      }
    }

    return null;
  }

  /**
   * Filter listings to match unit number
   * Compares against UnitNumber field and UnparsedAddress
   */
  private filterByUnitNumber(listings: BridgeProperty[], unitNumber: string): BridgeProperty[] {
    const unitLower = unitNumber.toLowerCase();

    const matches = listings.filter(prop => {
      // Check UnitNumber field (exact match)
      if (prop.UnitNumber) {
        const propUnit = prop.UnitNumber.toLowerCase().replace(/[^a-z0-9]/g, '');
        const searchUnit = unitLower.replace(/[^a-z0-9]/g, '');
        if (propUnit === searchUnit) {
          console.log(`[Bridge API] ✅ Unit match via UnitNumber field: ${prop.UnitNumber}`);
          return true;
        }
      }

      // Check UnparsedAddress (contains unit pattern)
      if (prop.UnparsedAddress) {
        const addr = prop.UnparsedAddress.toLowerCase();
        const patterns = [
          new RegExp(`\\b(?:apt|apartment|unit|ste|suite|#)\\s*#?${unitLower}\\b`, 'i'),
          new RegExp(`\\b${unitLower}$`, 'i'), // Unit at end
        ];

        for (const pattern of patterns) {
          if (pattern.test(addr)) {
            console.log(`[Bridge API] ✅ Unit match via UnparsedAddress: ${prop.UnparsedAddress}`);
            return true;
          }
        }
      }

      return false;
    });

    console.log(`[Bridge API] 🔍 Filtered ${listings.length} listings to ${matches.length} matching unit ${unitNumber}`);
    return matches;
  }

  /**
   * Get property by address with fallback strategies
   * Tries multiple search variations to handle different MLS formats
   * CRITICAL: Filters by unit number if present, returns most recent Active listing
   */
  async getPropertyByAddress(address: string, city?: string, state?: string, zipCode?: string): Promise<BridgeProperty | null> {
    console.log('[Bridge API] Smart search - trying multiple strategies for:', address);

    // Extract unit number if present
    const unitInfo = this.extractUnitNumber(address);
    const baseAddress = unitInfo?.baseAddress || address;
    const unitNumber = unitInfo?.unitNumber;

    if (unitNumber) {
      console.log(`[Bridge API] 🏢 Searching for unit ${unitNumber} in building at ${baseAddress}`);
    }

    // Strategy 1: Try FULL address as-is (handles "Apt 106", "#106", "Unit 106" etc)
    console.log('[Bridge API] Strategy 1: Full address');
    let response = await this.searchProperties({
      address,
      city,
      state,
      zipCode,
      top: 20, // Get more results for multi-unit buildings
    });

    if (response.value.length > 0) {
      console.log(`[Bridge API] ✅ Found ${response.value.length} listing(s) with full address`);

      // Filter by unit number if specified
      let filtered = response.value;
      if (unitNumber) {
        filtered = this.filterByUnitNumber(response.value, unitNumber);
        if (filtered.length > 0) {
          console.log(`[Bridge API] 🎯 Returning unit-filtered result (${filtered.length} matches)`);
          return this.selectBestListing(filtered);
        }
        console.log(`[Bridge API] ⚠️ No exact unit match found, continuing search...`);
      } else {
        return this.selectBestListing(filtered);
      }
    }

    // Strategy 2: Search with base address (without unit number)
    if (unitNumber && baseAddress !== address) {
      console.log(`[Bridge API] Strategy 2: Base address without unit - "${baseAddress}"`);
      response = await this.searchProperties({
        address: baseAddress,
        city,
        state,
        zipCode,
        top: 20,
      });

      if (response.value.length > 0) {
        console.log(`[Bridge API] ✅ Found ${response.value.length} listing(s) at base address`);

        // Filter by unit number
        const filtered = this.filterByUnitNumber(response.value, unitNumber);
        if (filtered.length > 0) {
          console.log(`[Bridge API] 🎯 Returning unit-filtered result (${filtered.length} matches)`);
          return this.selectBestListing(filtered);
        }

        console.log(`[Bridge API] ⚠️ Found building but no unit ${unitNumber} - may be wrong unit!`);
        console.log(`[Bridge API] Available units:`);
        response.value.forEach(prop => {
          const unit = prop.UnitNumber || 'unknown';
          const addr = prop.UnparsedAddress || 'no address';
          console.log(`[Bridge API]    - Unit ${unit}: ${addr}`);
        });
      }
    }

    // Strategy 3: Try with just street number and name (no directional suffix variations)
    // e.g., "10399 Paradise Blvd" could be stored as "10399 Paradise Boulevard"
    const streetMatch = baseAddress.match(/^(\d+)\s+(.+?)$/i);
    if (streetMatch) {
      const [, number, street] = streetMatch;
      const baseStreet = `${number} ${street.split(' ').slice(0, 2).join(' ')}`; // Just number + first 2 words
      console.log(`[Bridge API] Strategy 3: Base street - "${baseStreet}"`);
      response = await this.searchProperties({
        address: baseStreet,
        city,
        state,
        zipCode,
        top: 20,
      });

      if (response.value.length > 0) {
        console.log(`[Bridge API] ✅ Found ${response.value.length} matches with base street`);

        // Filter by unit if specified
        if (unitNumber) {
          const filtered = this.filterByUnitNumber(response.value, unitNumber);
          if (filtered.length > 0) {
            console.log(`[Bridge API] 🎯 Returning unit-filtered result`);
            return this.selectBestListing(filtered);
          }
        } else {
          return this.selectBestListing(response.value);
        }
      }
    }

    // Strategy 4: Last resort - search ONLY by zip code + street number (most lenient)
    // This handles cases where StreetName is stored in a completely different format
    const numberMatch = baseAddress.match(/^(\d+)/);
    if (numberMatch && zipCode) {
      const streetNumber = numberMatch[1];
      console.log(`[Bridge API] Strategy 4: Zip + street number only - ${zipCode} / ${streetNumber}`);

      // Build a manual query that ONLY requires zip + street number
      const query = `PostalCode eq '${zipCode}' and StreetNumber eq '${streetNumber}'`;
      const url = `${this.config.baseUrl}/OData/${this.config.dataSystem}/Property?$filter=${query}&$top=20&$count=true&$expand=Media`;

      console.log('[Bridge API] Lenient search URL:', url);

      const token = await this.authenticate();

      // Create AbortController for 15s timeout
      const lenientController = new AbortController();
      const lenientTimeoutId = setTimeout(() => lenientController.abort(), BRIDGE_API_TIMEOUT);

      const lenientResponse = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token.access_token}`,
          'Accept': 'application/json',
        },
        signal: lenientController.signal,
      });
      clearTimeout(lenientTimeoutId);

      if (lenientResponse.ok) {
        const data = await lenientResponse.json();
        if (data.value && data.value.length > 0) {
          console.log(`[Bridge API] ✅ Found ${data.value.length} matches with lenient search (zip + number only)`);

          // Filter by unit if specified
          if (unitNumber) {
            const filtered = this.filterByUnitNumber(data.value, unitNumber);
            if (filtered.length > 0) {
              console.log(`[Bridge API] 🎯 Returning unit-filtered result`);
              return this.selectBestListing(filtered);
            }
            console.log(`[Bridge API] ⚠️ Found building at ${streetNumber} but no unit ${unitNumber}`);
          } else {
            return this.selectBestListing(data.value);
          }
        }
      }
    }

    console.log('[Bridge API] ❌ No matches found with any strategy');
    if (unitNumber) {
      console.log(`[Bridge API] 💡 TIP: Unit ${unitNumber} may not be listed in MLS or may be a different listing`);
    }
    return null;
  }

  /**
   * Fetch Media (photos) for a specific property
   * Uses ListingKey to fetch photos separately
   */
  async getPropertyMedia(listingKey: string): Promise<Array<{MediaURL?: string; Order?: number; PreferredPhotoYN?: boolean}>> {
    try {
      console.log(`[Bridge API] Fetching Media for ListingKey: ${listingKey}`);

      const authToken = await this.authenticate();
      const url = `${this.config.baseUrl}/OData/${this.config.dataSystem}/Property('${listingKey}')/Media`;

      console.log(`[Bridge API] Media URL: ${url}`);

      // Create AbortController for 15s timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), BRIDGE_API_TIMEOUT);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${authToken.access_token}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        // BUG #13 FIX: Enhanced error logging for Media API failures
        const errorText = await response.text();
        console.error(`[Bug #13 Debug] Media API HTTP ${response.status}: ${response.statusText}`);
        console.error(`[Bug #13 Debug] Error body:`, errorText);
        console.error(`[Bug #13 Debug] Request URL:`, url);
        console.error(`[Bug #13 Debug] ListingKey used:`, listingKey);
        return [];
      }

      const data = await response.json();
      console.log(`[Bridge API] Media response:`, JSON.stringify(data, null, 2));

      // Handle both array response and OData response with value array
      const mediaArray = Array.isArray(data) ? data : (data.value || []);
      console.log(`[Bridge API] ✅ Found ${mediaArray.length} photos for property`);

      return mediaArray;
    } catch (error) {
      console.error('[Bridge API] Error fetching Media:', error);
      return [];
    }
  }
}

/**
 * Create Bridge API client from environment variables
 */
export function createBridgeAPIClient(): BridgeAPIClient {
  console.log('[Bridge API Client] Creating client...');
  console.log('[Bridge API Client] Checking environment variables...');
  console.log('[Bridge API Client] BRIDGE_SERVER_TOKEN:', process.env.BRIDGE_SERVER_TOKEN ? 'SET (recommended)' : 'NOT SET');
  console.log('[Bridge API Client] BRIDGE_CLIENT_ID:', process.env.BRIDGE_CLIENT_ID ? 'SET' : 'MISSING');
  console.log('[Bridge API Client] BRIDGE_CLIENT_SECRET:', process.env.BRIDGE_CLIENT_SECRET ? 'SET' : 'MISSING');
  console.log('[Bridge API Client] BRIDGE_API_BASE_URL:', process.env.BRIDGE_API_BASE_URL || 'using default');
  console.log('[Bridge API Client] BRIDGE_DATA_SYSTEM:', process.env.BRIDGE_DATA_SYSTEM || 'using default');

  const config: BridgeAPIConfig = {
    serverToken: process.env.BRIDGE_SERVER_TOKEN,
    clientId: process.env.BRIDGE_CLIENT_ID,
    clientSecret: process.env.BRIDGE_CLIENT_SECRET,
    baseUrl: process.env.BRIDGE_API_BASE_URL || 'https://api.bridgedataoutput.com/api/v2',
    dataSystem: process.env.BRIDGE_DATA_SYSTEM || 'stellar',
  };

  // Either server token OR client credentials must be provided
  if (!config.serverToken && (!config.clientId || !config.clientSecret)) {
    const error = 'Bridge API credentials not configured. Set either BRIDGE_SERVER_TOKEN (recommended) or both BRIDGE_CLIENT_ID and BRIDGE_CLIENT_SECRET.';
    console.error('[Bridge API Client] ERROR:', error);
    throw new Error(error);
  }

  console.log('[Bridge API Client] Client created successfully');
  console.log('[Bridge API Client] Using:', config.serverToken ? 'Server Token (direct)' : 'Client ID/Secret (will authenticate)');
  return new BridgeAPIClient(config);
}
