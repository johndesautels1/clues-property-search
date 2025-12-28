/**
 * Bridge Interactive API Client
 * RESO Web API integration for MLS property data
 * Documentation: https://www.bridgeinteractive.com/developers/bridge-api/
 */

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
  City?: string;
  StateOrProvince?: string;
  PostalCode?: string;
  County?: string;

  // Pricing
  ListPrice?: number;
  OriginalListPrice?: number;
  PreviousListPrice?: number;
  ClosePrice?: number;

  // Property Details
  BedroomsTotal?: number;
  BathroomsFull?: number;
  BathroomsHalf?: number;
  BathroomsTotalInteger?: number;
  LivingArea?: number;
  BuildingAreaTotal?: number;
  LotSizeAcres?: number;
  LotSizeSquareFeet?: number;
  YearBuilt?: number;
  PropertyType?: string;
  PropertySubType?: string;
  PropertyCondition?: string;
  Stories?: number;
  StoriesTotal?: number;

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

  // Structure & Systems
  RoofType?: string[];
  Roof?: string;
  RoofYear?: number;
  YearRoofInstalled?: number;
  PermitRoof?: string;
  PermitHVAC?: string;
  PermitAdditions?: string;
  ExteriorFeatures?: string[];
  ConstructionMaterials?: string[];
  FoundationType?: string[];
  FoundationDetails?: string;
  Heating?: string[];
  Cooling?: string[];
  CoolingYN?: boolean;

  // Interior Features
  InteriorFeatures?: string[];
  Flooring?: string[];
  Appliances?: string[];
  FireplacesTotal?: number;
  FireplaceYN?: boolean;
  LaundryFeatures?: string[];
  WaterHeaterType?: string;
  WaterHeaterFeatures?: string[];
  AccessibilityFeatures?: string[];

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

    try {
      console.log('[Bridge API] Attempting authentication with Basic Auth...');
      const response = await fetch(authUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${base64Credentials}`,
          'Content-Type': 'application/json',
        },
      });

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
    if (params.mlsNumber) {
      const escapedMls = params.mlsNumber.replace(/'/g, "''");
      filters.push(`ListingId eq '${escapedMls}'`);
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
      filters.push(`BathroomsTotalInteger ge ${params.minBaths}`);
    }
    if (params.maxBaths !== undefined) {
      filters.push(`BathroomsTotalInteger le ${params.maxBaths}`);
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

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `${token.token_type} ${token.access_token}`,
          'Content-Type': 'application/json',
        },
      });

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
   * Helper: Select best listing from multiple results
   * Prefer: Active > Pending > Closed
   * Then: Most recent listing date
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
    console.log(`[Bridge API] ✅ Selected: MLS# ${best.ListingId}, Status: ${best.StandardStatus || best.MlsStatus}, Date: ${best.ListingContractDate || best.OnMarketDate}`);

    if (sorted.length > 1) {
      console.log(`[Bridge API] 📋 Other listings found:`);
      sorted.slice(1).forEach((prop, idx) => {
        console.log(`   ${idx + 2}. MLS# ${prop.ListingId}, Status: ${prop.StandardStatus || prop.MlsStatus}, Date: ${prop.ListingContractDate || prop.OnMarketDate}`);
      });
    }

    return best;
  }

  /**
   * Get property by address with fallback strategies
   * Tries multiple search variations to handle different MLS formats
   * CRITICAL: Returns most recent Active listing if multiple listings exist
   */
  async getPropertyByAddress(address: string, city?: string, state?: string, zipCode?: string): Promise<BridgeProperty | null> {
    console.log('[Bridge API] Smart search - trying multiple strategies for:', address);

    // Strategy 1: Try FULL address as-is (handles "Apt 106", "#106", "Unit 106" etc)
    console.log('[Bridge API] Strategy 1: Full address');
    let response = await this.searchProperties({
      address,
      city,
      state,
      zipCode,
      top: 10, // Get multiple to handle properties with multiple listings (Active + Closed)
    });

    if (response.value.length > 0) {
      console.log(`[Bridge API] ✅ Found ${response.value.length} listing(s) with full address`);
      return this.selectBestListing(response.value);
    }

    // Strategy 2: Try without unit/apt number (strip common patterns)
    const unitPatterns = [
      / apt \d+$/i,
      / apartment \d+$/i,
      / unit \d+$/i,
      / #\d+$/i,
      / suite \d+$/i,
      / ste \d+$/i,
    ];

    for (const pattern of unitPatterns) {
      if (pattern.test(address)) {
        const baseAddress = address.replace(pattern, '').trim();
        console.log(`[Bridge API] Strategy 2: Without unit - "${baseAddress}"`);
        response = await this.searchProperties({
          address: baseAddress,
          city,
          state,
          zipCode,
          top: 10,
        });

        if (response.value.length > 0) {
          console.log(`[Bridge API] ✅ Found ${response.value.length} listing(s) without unit number`);
          return this.selectBestListing(response.value);
        }
        break; // Only try one unit pattern
      }
    }

    // Strategy 3: Try with just street number and name (no directional suffix variations)
    // e.g., "10399 Paradise Blvd" could be stored as "10399 Paradise Boulevard"
    const streetMatch = address.match(/^(\d+)\s+(.+?)(?:\s+(?:apt|unit|#|suite|ste).+)?$/i);
    if (streetMatch) {
      const [, number, street] = streetMatch;
      const baseStreet = `${number} ${street.split(' ').slice(0, 2).join(' ')}`; // Just number + first 2 words
      console.log(`[Bridge API] Strategy 3: Base street - "${baseStreet}"`);
      response = await this.searchProperties({
        address: baseStreet,
        city,
        state,
        zipCode,
        top: 10,
      });

      if (response.value.length > 0) {
        console.log(`[Bridge API] ✅ Found ${response.value.length} matches with base street`);
        return this.selectBestListing(response.value);
      }
    }

    // Strategy 4: Last resort - search ONLY by zip code + street number (most lenient)
    // This handles cases where StreetName is stored in a completely different format
    const numberMatch = address.match(/^(\d+)/);
    if (numberMatch && zipCode) {
      const streetNumber = numberMatch[1];
      console.log(`[Bridge API] Strategy 4: Zip + street number only - ${zipCode} / ${streetNumber}`);

      // Build a manual query that ONLY requires zip + street number
      const query = `PostalCode eq '${zipCode}' and StreetNumber eq '${streetNumber}'`;
      const url = `${this.config.baseUrl}/OData/${this.config.dataSystem}/Property?$filter=${query}&$top=10&$count=true&$expand=Media`;

      console.log('[Bridge API] Lenient search URL:', url);

      const token = await this.authenticate();
      const lenientResponse = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token.access_token}`,
          'Accept': 'application/json',
        },
      });

      if (lenientResponse.ok) {
        const data = await lenientResponse.json();
        if (data.value && data.value.length > 0) {
          console.log(`[Bridge API] ✅ Found ${data.value.length} matches with lenient search (zip + number only)`);
          return this.selectBestListing(data.value);
        }
      }
    }

    console.log('[Bridge API] ❌ No matches found with any strategy');
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

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${authToken.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.log(`[Bridge API] Media fetch failed: ${response.status} ${response.statusText}`);
        return [];
      }

      const data = await response.json();
      console.log(`[Bridge API] Media response:`, data);

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
