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
  LotSizeAcres?: number;
  LotSizeSquareFeet?: number;
  YearBuilt?: number;
  PropertyType?: string;
  PropertySubType?: string;
  Stories?: number;

  // Parking & Garage
  GarageSpaces?: number;
  ParkingTotal?: number;
  CarportSpaces?: number;

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

  // Taxes
  TaxAnnualAmount?: number;
  TaxYear?: number;
  ParcelNumber?: string;

  // Structure & Systems
  RoofType?: string[];
  ExteriorFeatures?: string[];
  ConstructionMaterials?: string[];
  FoundationType?: string[];
  Heating?: string[];
  Cooling?: string[];

  // Interior Features
  InteriorFeatures?: string[];
  Flooring?: string[];
  Appliances?: string[];
  FireplacesTotal?: number;
  FireplaceYN?: boolean;
  LaundryFeatures?: string[];

  // Exterior Features
  PoolPrivateYN?: boolean;
  PoolFeatures?: string[];
  PatioAndPorchFeatures?: string[];
  Fencing?: string[];

  // Location
  Latitude?: number;
  Longitude?: number;
  Directions?: string;

  // Schools
  ElementarySchool?: string;
  MiddleOrJuniorSchool?: string;
  HighSchool?: string;
  SchoolDistrict?: string;

  // Community
  CommunityFeatures?: string[];

  // Waterfront
  WaterfrontYN?: boolean;
  WaterfrontFeatures?: string[];
  WaterBodyName?: string;

  // Environmental
  FloodZone?: string;

  // Leasing
  LeaseConsideredYN?: boolean;
  PetsAllowed?: string[];

  // Additional
  Remarks?: string;
  PublicRemarks?: string;
  PrivateRemarks?: string;

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

    // Address search
    if (params.address) {
      filters.push(`contains(UnparsedAddress, '${params.address}')`);
    }
    if (params.city) {
      filters.push(`City eq '${params.city}'`);
    }
    if (params.state) {
      filters.push(`StateOrProvince eq '${params.state}'`);
    }
    if (params.zipCode) {
      filters.push(`PostalCode eq '${params.zipCode}'`);
    }
    if (params.mlsNumber) {
      filters.push(`ListingId eq '${params.mlsNumber}'`);
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
      filters.push(`PropertyType eq '${params.propertyType}'`);
    }

    // Status
    if (params.status) {
      filters.push(`StandardStatus eq '${params.status}'`);
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

    if (params.top) {
      queryParts.push(`$top=${params.top}`);
    }

    if (params.skip) {
      queryParts.push(`$skip=${params.skip}`);
    }

    // Always request count
    queryParts.push('$count=true');

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
   * Get property by address
   */
  async getPropertyByAddress(address: string, city?: string, state?: string): Promise<BridgeProperty | null> {
    const response = await this.searchProperties({
      address,
      city,
      state,
      top: 1,
    });

    return response.value.length > 0 ? response.value[0] : null;
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
