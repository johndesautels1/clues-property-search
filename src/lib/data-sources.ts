export type SourceType = 'mls' | 'free-api' | 'llm';
export type SourceStatus = 'pending' | 'searching' | 'complete' | 'error' | 'skipped';

export interface DataSource {
  id: string;
  name: string;
  type: SourceType;
  tier: 1 | 2 | 3 | 4;
  icon: string;
  color: string;
  enabled: boolean;
  description?: string;
}

export const DATA_SOURCES: DataSource[] = [
  // Tier 1: MLS (Authoritative - awaiting eKey)
  { 
    id: 'stellar-mls', 
    name: 'Stellar MLS', 
    type: 'mls', 
    tier: 1, 
    icon: 'database', 
    color: 'yellow',
    enabled: false,
    description: 'Authoritative MLS data (awaiting eKey)'
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

  // Tier 3: Paid/Free APIs ("Hard Truth")
  { 
    id: 'walkscore', 
    name: 'WalkScore', 
    type: 'free-api', 
    tier: 3, 
    icon: 'car', 
    color: 'green',
    enabled: true,
    description: 'Walk, transit, and bike scores'
  },
  { 
    id: 'schooldigger', 
    name: 'SchoolDigger', 
    type: 'free-api', 
    tier: 3, 
    icon: 'school', 
    color: 'purple',
    enabled: true,
    description: 'School ratings and nearby schools'
  },
  { 
    id: 'fema', 
    name: 'FEMA Flood', 
    type: 'free-api', 
    tier: 3, 
    icon: 'shield', 
    color: 'yellow',
    enabled: true,
    description: 'Flood zone data'
  },
  { 
    id: 'airnow', 
    name: 'AirNow', 
    type: 'free-api', 
    tier: 3, 
    icon: 'wind', 
    color: 'green',
    enabled: true,
    description: 'Air quality index'
  },
  { 
    id: 'howloud', 
    name: 'HowLoud', 
    type: 'free-api', 
    tier: 3, 
    icon: 'volume', 
    color: 'purple',
    enabled: true,
    description: 'Noise levels'
  },
  { 
    id: 'weather', 
    name: 'Weather', 
    type: 'free-api', 
    tier: 3, 
    icon: 'sun', 
    color: 'orange',
    enabled: true,
    description: 'Climate data'
  },
  { 
    id: 'crime', 
    name: 'FBI Crime', 
    type: 'free-api', 
    tier: 3, 
    icon: 'alert', 
    color: 'red',
    enabled: true,
    description: 'Crime statistics'
  },

  // Tier 4: LLMs (Fallback - with validation)
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
  { 
    id: 'grok', 
    name: 'Grok', 
    type: 'llm', 
    tier: 4, 
    icon: 'brain', 
    color: 'blue',
    enabled: true,
    description: 'xAI with web access'
  },
  { 
    id: 'claude-opus', 
    name: 'Claude Opus', 
    type: 'llm', 
    tier: 4, 
    icon: 'brain', 
    color: 'orange',
    enabled: true,
    description: 'Anthropic flagship'
  },
  { 
    id: 'gpt', 
    name: 'GPT-4o', 
    type: 'llm', 
    tier: 4, 
    icon: 'brain', 
    color: 'green',
    enabled: true,
    description: 'OpenAI flagship'
  },
  { 
    id: 'claude-sonnet', 
    name: 'Claude Sonnet', 
    type: 'llm', 
    tier: 4, 
    icon: 'brain', 
    color: 'pink',
    enabled: true,
    description: 'Anthropic balanced'
  },
  { 
    id: 'gemini', 
    name: 'Gemini', 
    type: 'llm', 
    tier: 4, 
    icon: 'brain', 
    color: 'purple',
    enabled: true,
    description: 'Google AI'
  },
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
