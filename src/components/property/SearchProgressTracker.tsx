/**
 * CLUES Property Dashboard - Space Age Search Progress Tracker
 * Real-time visualization of all API and LLM data sources
 */

import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe,
  Database,
  Brain,
  Cloud,
  MapPin,
  Shield,
  Wind,
  Volume2,
  Sun,
  School,
  Car,
  AlertTriangle,
  Wifi,
  CheckCircle,
  XCircle,
  Loader2,
  Zap,
} from 'lucide-react';

export type SourceStatus = 'pending' | 'searching' | 'complete' | 'error' | 'skipped';

export interface SourceProgress {
  id: string;
  name: string;
  type: 'scraper' | 'free-api' | 'llm';
  status: SourceStatus;
  fieldsFound: number;
  icon: string;
  color: string;
  error?: string;
}

interface SearchProgressTrackerProps {
  sources: SourceProgress[];
  isSearching: boolean;
  totalFieldsFound: number;
  completionPercentage: number;
}

const iconMap: Record<string, React.ReactNode> = {
  globe: <Globe className="w-4 h-4 sm:w-5 sm:h-5" />,
  database: <Database className="w-4 h-4 sm:w-5 sm:h-5" />,
  brain: <Brain className="w-4 h-4 sm:w-5 sm:h-5" />,
  cloud: <Cloud className="w-4 h-4 sm:w-5 sm:h-5" />,
  mappin: <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />,
  shield: <Shield className="w-4 h-4 sm:w-5 sm:h-5" />,
  wind: <Wind className="w-4 h-4 sm:w-5 sm:h-5" />,
  volume: <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />,
  sun: <Sun className="w-4 h-4 sm:w-5 sm:h-5" />,
  school: <School className="w-4 h-4 sm:w-5 sm:h-5" />,
  car: <Car className="w-4 h-4 sm:w-5 sm:h-5" />,
  alert: <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />,
  wifi: <Wifi className="w-4 h-4 sm:w-5 sm:h-5" />,
  zap: <Zap className="w-4 h-4 sm:w-5 sm:h-5" />,
};

const colorMap: Record<string, string> = {
  cyan: 'from-cyan-500 to-cyan-400',
  blue: 'from-blue-500 to-blue-400',
  purple: 'from-purple-500 to-purple-400',
  green: 'from-green-500 to-green-400',
  orange: 'from-orange-500 to-orange-400',
  red: 'from-red-500 to-red-400',
  yellow: 'from-yellow-500 to-yellow-400',
  pink: 'from-pink-500 to-pink-400',
  indigo: 'from-indigo-500 to-indigo-400',
};

const bgColorMap: Record<string, string> = {
  cyan: 'bg-cyan-500/20 border-cyan-500/50',
  blue: 'bg-blue-500/20 border-blue-500/50',
  purple: 'bg-purple-500/20 border-purple-500/50',
  green: 'bg-green-500/20 border-green-500/50',
  orange: 'bg-orange-500/20 border-orange-500/50',
  red: 'bg-red-500/20 border-red-500/50',
  yellow: 'bg-yellow-500/20 border-yellow-500/50',
  pink: 'bg-pink-500/20 border-pink-500/50',
  indigo: 'bg-indigo-500/20 border-indigo-500/50',
};

const textColorMap: Record<string, string> = {
  cyan: 'text-cyan-400',
  blue: 'text-blue-400',
  purple: 'text-purple-400',
  green: 'text-green-400',
  orange: 'text-orange-400',
  red: 'text-red-400',
  yellow: 'text-yellow-400',
  pink: 'text-pink-400',
  indigo: 'text-indigo-400',
};

export const DEFAULT_SOURCES: SourceProgress[] = [
  // Tier 1: Scrapers (Most Reliable)
  { id: 'realtor', name: 'Realtor.com', type: 'scraper', status: 'pending', fieldsFound: 0, icon: 'globe', color: 'cyan' },
  { id: 'zillow', name: 'Zillow', type: 'scraper', status: 'pending', fieldsFound: 0, icon: 'globe', color: 'blue' },
  { id: 'redfin', name: 'Redfin', type: 'scraper', status: 'pending', fieldsFound: 0, icon: 'globe', color: 'red' },

  // Tier 2: Google APIs
  { id: 'google-geocode', name: 'Google Geocode', type: 'free-api', status: 'pending', fieldsFound: 0, icon: 'mappin', color: 'blue' },
  { id: 'google-places', name: 'Google Places', type: 'free-api', status: 'pending', fieldsFound: 0, icon: 'mappin', color: 'blue' },

  // Tier 3: Reliable Free APIs
  { id: 'walkscore', name: 'WalkScore', type: 'free-api', status: 'pending', fieldsFound: 0, icon: 'car', color: 'green' },
  { id: 'fema', name: 'FEMA Flood', type: 'free-api', status: 'pending', fieldsFound: 0, icon: 'shield', color: 'yellow' },
  { id: 'schooldigger', name: 'SchoolDigger', type: 'free-api', status: 'pending', fieldsFound: 0, icon: 'school', color: 'purple' },
  { id: 'airdna', name: 'AirDNA', type: 'free-api', status: 'pending', fieldsFound: 0, icon: 'database', color: 'pink' },

  // Tier 4: Other Free APIs
  { id: 'airnow', name: 'AirNow', type: 'free-api', status: 'pending', fieldsFound: 0, icon: 'wind', color: 'green' },
  { id: 'howloud', name: 'HowLoud', type: 'free-api', status: 'pending', fieldsFound: 0, icon: 'volume', color: 'purple' },
  { id: 'weather', name: 'Weather', type: 'free-api', status: 'pending', fieldsFound: 0, icon: 'sun', color: 'orange' },
  { id: 'broadband', name: 'Broadband', type: 'free-api', status: 'pending', fieldsFound: 0, icon: 'wifi', color: 'indigo' },
  { id: 'crime', name: 'Crime', type: 'free-api', status: 'pending', fieldsFound: 0, icon: 'alert', color: 'red' },

  // Tier 5: LLMs (Last Resort - Hallucination Risk)
  { id: 'perplexity', name: 'Perplexity', type: 'llm', status: 'pending', fieldsFound: 0, icon: 'zap', color: 'cyan' },
  { id: 'grok', name: 'Grok', type: 'llm', status: 'pending', fieldsFound: 0, icon: 'brain', color: 'blue' },
  { id: 'claude-opus', name: 'Claude Opus', type: 'llm', status: 'pending', fieldsFound: 0, icon: 'brain', color: 'orange' },
  { id: 'gpt', name: 'GPT-4o', type: 'llm', status: 'pending', fieldsFound: 0, icon: 'brain', color: 'green' },
  { id: 'claude-sonnet', name: 'Claude Sonnet', type: 'llm', status: 'pending', fieldsFound: 0, icon: 'brain', color: 'orange' },
  { id: 'gemini', name: 'Gemini', type: 'llm', status: 'pending', fieldsFound: 0, icon: 'brain', color: 'purple' },
];

export default function SearchProgressTracker({
  sources,
  isSearching,
  totalFieldsFound,
  completionPercentage,
}: SearchProgressTrackerProps) {
  const scrapers = sources.filter(s => s.type === 'scraper');
  const freeApis = sources.filter(s => s.type === 'free-api');
  const llms = sources.filter(s => s.type === 'llm');

  const renderSourceCard = (source: SourceProgress, index: number) => {
    const isActive = source.status === 'searching';
    const isComplete = source.status === 'complete';
    const isError = source.status === 'error';
    const isSkipped = source.status === 'skipped';
    const isPending = source.status === 'pending';

    return (
      <motion.div
        key={source.id}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.05 }}
        className={`relative p-2 sm:p-3 rounded-lg sm:rounded-xl border transition-all duration-300 ${
          isActive
            ? `${bgColorMap[source.color]} animate-pulse shadow-lg shadow-${source.color}-500/20`
            : isComplete
            ? 'bg-green-500/10 border-green-500/30'
            : isError
            ? 'bg-red-500/10 border-red-500/30'
            : isSkipped
            ? 'bg-gray-500/10 border-gray-500/30 opacity-50'
            : 'bg-white/5 border-white/10'
        }`}
      >
        {/* Scanning animation overlay */}
        {isActive && (
          <motion.div
            className={`absolute inset-0 rounded-xl bg-gradient-to-r ${colorMap[source.color]} opacity-20`}
            animate={{
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}

        <div className="relative flex items-center gap-2 sm:gap-3">
          {/* Icon */}
          <div
            className={`p-1.5 sm:p-2 rounded-md sm:rounded-lg ${
              isActive
                ? `bg-gradient-to-br ${colorMap[source.color]} text-white`
                : isComplete
                ? 'bg-green-500/20 text-green-400'
                : isError
                ? 'bg-red-500/20 text-red-400'
                : `bg-white/10 ${textColorMap[source.color]}`
            }`}
          >
            {isActive ? (
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
            ) : isComplete ? (
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : isError ? (
              <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              iconMap[source.icon] || <Database className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </div>

          {/* Name and Status */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 sm:gap-2">
              <span className={`text-xs sm:text-sm font-medium truncate ${
                isActive ? 'text-white' : isComplete ? 'text-green-400' : isError ? 'text-red-400' : 'text-gray-300'
              }`}>
                {source.name}
              </span>
              {isActive && (
                <motion.span
                  className={`text-[10px] sm:text-xs hidden sm:inline ${textColorMap[source.color]}`}
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  Searching...
                </motion.span>
              )}
            </div>
            <div className="text-[10px] sm:text-xs text-gray-500">
              {isComplete && source.fieldsFound > 0 && (
                <span className="text-green-400">{source.fieldsFound} fields</span>
              )}
              {isComplete && source.fieldsFound === 0 && (
                <span className="text-gray-400">No data</span>
              )}
              {isError && (
                <span className="text-red-400 truncate">{source.error || 'Failed'}</span>
              )}
              {isSkipped && (
                <span className="text-gray-500">Skipped</span>
              )}
              {isPending && (
                <span className="text-gray-500">Waiting...</span>
              )}
            </div>
          </div>

          {/* Field count badge */}
          {isComplete && source.fieldsFound > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-green-500/20 text-green-400 text-[10px] sm:text-xs font-bold rounded-full flex-shrink-0"
            >
              +{source.fieldsFound}
            </motion.div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header with total progress - mobile optimized */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
          <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-quantum-cyan" />
          Data Source Progress
        </h3>
        <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <div className="text-left sm:text-right">
            <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-quantum-cyan to-quantum-green bg-clip-text text-transparent">
              {totalFieldsFound}
            </div>
            <div className="text-xs text-gray-500">fields found</div>
          </div>
          <div className="w-16 h-16 sm:w-20 sm:h-20 relative flex-shrink-0">
            {/* Circular progress */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="3"
              />
              <motion.path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="url(#progressGradient)"
                strokeWidth="3"
                strokeLinecap="round"
                initial={{ strokeDasharray: '0 100' }}
                animate={{ strokeDasharray: `${completionPercentage} 100` }}
                transition={{ duration: 0.5 }}
              />
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00D9FF" />
                  <stop offset="100%" stopColor="#00FF88" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-white">{completionPercentage}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scrapers Section */}
      {scrapers.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Web Scrapers
          </h4>
          <div className="grid grid-cols-1 gap-2">
            {scrapers.map((source, idx) => renderSourceCard(source, idx))}
          </div>
        </div>
      )}

      {/* Free APIs Section */}
      {freeApis.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Database className="w-4 h-4" />
            Free APIs
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {freeApis.map((source, idx) => renderSourceCard(source, idx + scrapers.length))}
          </div>
        </div>
      )}

      {/* LLMs Section */}
      {llms.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Brain className="w-4 h-4" />
            AI Language Models
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {llms.map((source, idx) => renderSourceCard(source, idx + scrapers.length + freeApis.length))}
          </div>
        </div>
      )}

      {/* Active search indicator */}
      {isSearching && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center gap-2 py-4"
        >
          <motion.div
            className="w-2 h-2 bg-quantum-cyan rounded-full"
            animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0 }}
          />
          <motion.div
            className="w-2 h-2 bg-quantum-purple rounded-full"
            animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
          />
          <motion.div
            className="w-2 h-2 bg-quantum-green rounded-full"
            animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
          />
          <span className="text-sm text-gray-400 ml-2">Searching data sources...</span>
        </motion.div>
      )}
    </motion.div>
  );
}
