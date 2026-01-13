export type SourceType = 'mls' | 'free-api' | 'llm';
export type SourceStatus = 'pending' | 'searching' | 'complete' | 'error' | 'skipped';

export interface DataSource {
  id: string;
  name: string;
  type: SourceType;
  tier: 1 | 2 | 3 | 4 | 5;
  icon: string;
  color: string;
  enabled: boolean;
  description?: string;
}

export const DATA_SOURCES: DataSource[] = [
  // Tier 1: MLS (Authoritative - via Bridge Interactive API)
  {
    id: 'stellar-mls',
    name: 'Stellar MLS',
    type: 'mls',
    tier: 1,
    icon: 'database',
    color: 'yellow',
    enabled: true,
    description: 'Authoritative MLS data via Bridge Interactive RESO API'
  },

  // Tier 2: Google APIs
  { 
    id: 'google-geocode', 
    name: 'Google Geocode', 
    type: 'free-api', 
    tier: 2, 
    icon: 'mappin', 
    color: 'blue',
    enabled: true,
    description: 'Coordinates and address verification'
  },
  {
    id: 'google-places',
    name: 'Google Places',
    type: 'free-api',
    tier: 2,
    icon: 'mappin',
    color: 'blue',
    enabled: true,
    description: 'Nearby places and POIs'
  },
  {
    id: 'google-distance',
    name: 'Google Distance',
    type: 'free-api',
    tier: 2,
    icon: 'car',
    color: 'blue',
    enabled: true,
    description: 'Commute times and distances'
  },
  {
    id: 'google-streetview',
    name: 'Google Street View',
    type: 'free-api',
    tier: 2,
    icon: 'camera',
    color: 'blue',
    enabled: true,
    description: 'Property front photo fallback'
  },
  {
    id: 'fcc-broadband',
    name: 'FCC Broadband',
    type: 'free-api',
    tier: 2,
    icon: 'wifi',
    color: 'cyan',
    enabled: true,
    description: 'Internet provider and speed data'
  },
  // DISABLED: Redfin API autocomplete not working
  // {
  //   id: 'redfin',
  //   name: 'Redfin',
  //   type: 'free-api',
  //   tier: 2,
  //   icon: 'home',
  //   color: 'red',
  //   enabled: false,
  //   description: 'Redfin property estimates and details (DISABLED - API issue)'
  // },

  // Tier 3: Paid/Free APIs ("Hard Truth")
  { 
    id: 'walkscore', 
    name: 'WalkScore', 
    type: 'free-api', 
    tier: 2,  // FIXED: Was 3, now 2 
    icon: 'car', 
    color: 'green',
    enabled: true,
    description: 'Walk, transit, and bike scores'
  },
  { 
    id: 'schooldigger', 
    name: 'SchoolDigger', 
    type: 'free-api', 
    tier: 2,  // FIXED: Was 3, now 2 
    icon: 'school', 
    color: 'purple',
    enabled: true,
    description: 'School ratings and nearby schools'
  },
  { 
    id: 'fema', 
    name: 'FEMA Flood', 
    type: 'free-api', 
    tier: 2,  // FIXED: Was 3, now 2 
    icon: 'shield', 
    color: 'yellow',
    enabled: true,
    description: 'Flood zone data'
  },
  { 
    id: 'airnow', 
    name: 'AirNow', 
    type: 'free-api', 
    tier: 2,  // FIXED: Was 3, now 2 
    icon: 'wind', 
    color: 'green',
    enabled: true,
    description: 'Air quality index'
  },
  { 
    id: 'howloud', 
    name: 'HowLoud', 
    type: 'free-api', 
    tier: 2,  // FIXED: Was 3, now 2 
    icon: 'volume', 
    color: 'purple',
    enabled: true,
    description: 'Noise levels'
  },
  {
    id: 'weather',
    name: 'Weather',
    type: 'free-api',
    tier: 2,  // FIXED: Was 3, now 2
    icon: 'sun',
    color: 'orange',
    enabled: true,
    description: 'Climate data'
  },
  {
    id: 'crime',
    name: 'FBI Crime',
    type: 'free-api',
    tier: 2,  // FIXED: Was 3, now 2
    icon: 'alert',
    color: 'red',
    enabled: true,
    description: 'Crime statistics'
  },
  {
    id: 'internal',
    name: 'INTERNAL',
    type: 'free-api',
    tier: 2,  // FIXED: Was 3, now 2
    icon: 'cpu',
    color: 'gray',
    enabled: true,
    description: 'Backend calculations'
  },
  {
    id: 'census',
    name: 'U.S. Census',
    type: 'free-api',
    tier: 2,  // FIXED: Was 3, now 2
    icon: 'database',
    color: 'indigo',
    enabled: true,
    description: 'Vacancy rate and housing data'
  },
  {
    id: 'noaa-climate',
    name: 'NOAA Climate',
    type: 'free-api',
    tier: 2,  // FIXED: Was 3, now 2
    icon: 'cloud',
    color: 'blue',
    enabled: true,
    description: 'Climate risk assessment'
  },
  {
    id: 'noaa-storm',
    name: 'NOAA Storm Events',
    type: 'free-api',
    tier: 2,  // FIXED: Was 3, now 2
    icon: 'wind',
    color: 'orange',
    enabled: true,
    description: 'Hurricane and tornado risk'
  },
  {
    id: 'noaa-sealevel',
    name: 'NOAA Sea Level',
    type: 'free-api',
    tier: 2,  // FIXED: Was 3, now 2
    icon: 'waves',
    color: 'cyan',
    enabled: true,
    description: 'Sea level rise risk'
  },
  {
    id: 'usgs-elevation',
    name: 'USGS Elevation',
    type: 'free-api',
    tier: 2,  // FIXED: Was 3, now 2
    icon: 'mountain',
    color: 'brown',
    enabled: true,
    description: 'Elevation above sea level'
  },
  {
    id: 'usgs-earthquake',
    name: 'USGS Earthquake',
    type: 'free-api',
    tier: 2,  // FIXED: Was 3, now 2
    icon: 'activity',
    color: 'red',
    enabled: true,
    description: 'Earthquake risk assessment'
  },
  {
    id: 'epa-frs',
    name: 'EPA FRS',
    type: 'free-api',
    tier: 2,  // FIXED: Was 3, now 2
    icon: 'alert-triangle',
    color: 'orange',
    enabled: true,
    description: 'Superfund site proximity'
  },
  {
    id: 'epa-radon',
    name: 'EPA Radon',
    type: 'free-api',
    tier: 2,  // FIXED: Was 3, now 2
    icon: 'radiation',
    color: 'yellow',
    enabled: true,
    description: 'Radon risk zones'
  },

  // Tier 3: Tavily Web Search - ADDED 2026-01-12
  {
    id: 'tavily',
    name: 'Tavily',
    type: 'free-api',
    tier: 3,
    icon: 'search',
    color: 'teal',
    enabled: true,
    description: 'Targeted web searches for AVMs, schools, crime'
  },

  // Tier 4: Web-Search LLMs - UPDATED 2026-01-12
  {
    id: 'perplexity',
    name: 'Perplexity',
    type: 'llm',
    tier: 4,
    icon: 'zap',
    color: 'cyan',
    enabled: true,
    description: 'Web-grounded AI (most reliable)'
  },

  // Tier 5: Claude Opus (Deep reasoning, NO web search - LAST)
  {
    id: 'grok',
    name: 'Grok',
    type: 'llm',
    tier: 4,  // FIXED: Was 5, now 4
    icon: 'brain',
    color: 'blue',
    enabled: true,
    description: 'xAI with web access'
  },
  {
    id: 'claude-opus',
    name: 'Claude Opus',
    type: 'llm',
    tier: 5,
    icon: 'brain',
    color: 'orange',
    enabled: true,
    description: 'Anthropic flagship'
  },
  {
    id: 'gpt',
    name: 'GPT-4o',
    type: 'llm',
    tier: 4,  // FIXED: Was 5, now 4
    icon: 'brain',
    color: 'green',
    enabled: true,
    description: 'OpenAI flagship'
  },
  {
    id: 'claude-sonnet',
    name: 'Claude Sonnet',
    type: 'llm',
    tier: 4,  // FIXED: Was 5, now 4
    icon: 'brain',
    color: 'pink',
    enabled: true,
    description: 'Anthropic balanced'
  },
  // NOTE: Gemini REMOVED from auto-cascade (2026-01-13) - available via on-demand button on PropertyDetail
  // {
  //   id: 'gemini',
  //   name: 'Gemini',
  //   type: 'llm',
  //   tier: 4,
  //   icon: 'brain',
  //   color: 'purple',
  //   enabled: false,  // DISABLED - on-demand only via button
  //   description: 'Google AI (on-demand only)'
  // },
];

export function getSourceById(id: string): DataSource | undefined {
  return DATA_SOURCES.find(s => s.id === id);
}

export function getSourceName(id: string): string {
  return getSourceById(id)?.name || id;
}

export function getSourcesByType(type: SourceType): DataSource[] {
  return DATA_SOURCES.filter(s => s.type === type);
}

export function getSourcesByTier(tier: 1 | 2 | 3 | 4): DataSource[] {
  return DATA_SOURCES.filter(s => s.tier === tier);
}

export function getEnabledSources(): DataSource[] {
  return DATA_SOURCES.filter(s => s.enabled);
}

export function getMlsSources(): DataSource[] {
  return DATA_SOURCES.filter(s => s.type === 'mls');
}

export function getApiSources(): DataSource[] {
  return DATA_SOURCES.filter(s => s.type === 'free-api');
}

export function getLlmSources(): DataSource[] {
  return DATA_SOURCES.filter(s => s.type === 'llm');
}

export function getLlmOrder(): string[] {
  return getLlmSources().map(s => s.id);
}

export interface SourceProgress {
  id: string;
  name: string;
  type: SourceType;
  status: SourceStatus;
  fieldsFound: number;
  icon: string;
  color: string;
  error?: string;
}

export function initializeSourceProgress(): SourceProgress[] {
  return DATA_SOURCES.map(source => ({
    id: source.id,
    name: source.name,
    type: source.type,
    status: 'pending' as SourceStatus,
    fieldsFound: 0,
    icon: source.icon,
    color: source.color,
  }));
}

export interface CascadeStatus {
  llm: string;
  status: 'pending' | 'running' | 'complete' | 'error' | 'skipped';
  fieldsFound?: number;
}

export function initializeCascadeStatus(): CascadeStatus[] {
  return DATA_SOURCES.map(source => ({
    llm: source.name,
    status: 'pending' as const,
  }));
}

export function initializeLlmCascadeStatus(): CascadeStatus[] {
  return getLlmSources().map(source => ({
    llm: source.name,
    status: 'pending' as const,
  }));
}

export function initializeAllSourcesStatus(): CascadeStatus[] {
  return DATA_SOURCES.map(source => ({
    llm: source.name,
    status: 'pending' as const,
  }));
}
