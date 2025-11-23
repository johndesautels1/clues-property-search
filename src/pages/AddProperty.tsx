/**
 * CLUES Property Dashboard - Add Property Page
 * LLM-powered property scraping interface
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Sparkles,
  Globe,
  CheckCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react';

type ScrapeStatus = 'idle' | 'searching' | 'scraping' | 'enriching' | 'complete' | 'error';

export default function AddProperty() {
  const [address, setAddress] = useState('');
  const [url, setUrl] = useState('');
  const [inputMode, setInputMode] = useState<'address' | 'url'>('address');
  const [status, setStatus] = useState<ScrapeStatus>('idle');
  const [progress, setProgress] = useState(0);

  const handleScrape = async () => {
    if (!address && !url) return;

    setStatus('searching');
    setProgress(10);

    // Simulate scraping process
    setTimeout(() => {
      setStatus('scraping');
      setProgress(30);
    }, 1500);

    setTimeout(() => {
      setStatus('enriching');
      setProgress(60);
    }, 3000);

    setTimeout(() => {
      setStatus('complete');
      setProgress(100);
    }, 5000);
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'searching':
        return 'Finding property listings...';
      case 'scraping':
        return 'Extracting 110 fields with AI...';
      case 'enriching':
        return 'Enriching with Walk Score, Crime, Schools...';
      case 'complete':
        return 'Property data complete!';
      case 'error':
        return 'Error scraping property';
      default:
        return '';
    }
  };

  return (
    <motion.div
      className="px-4 py-6 md:px-8 md:py-10 max-w-2xl mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="font-orbitron text-2xl md:text-3xl font-bold text-gradient-quantum mb-2">
          Add Property
        </h1>
        <p className="text-gray-400">
          AI-powered 110-field data extraction
        </p>
      </div>

      {/* Input Mode Tabs */}
      <div className="flex rounded-xl overflow-hidden border border-white/10 mb-6">
        <button
          onClick={() => setInputMode('address')}
          className={`flex-1 py-3 text-sm font-semibold transition-colors ${
            inputMode === 'address'
              ? 'bg-quantum-cyan/20 text-quantum-cyan'
              : 'text-gray-500 hover:text-white'
          }`}
        >
          By Address
        </button>
        <button
          onClick={() => setInputMode('url')}
          className={`flex-1 py-3 text-sm font-semibold transition-colors ${
            inputMode === 'url'
              ? 'bg-quantum-cyan/20 text-quantum-cyan'
              : 'text-gray-500 hover:text-white'
          }`}
        >
          By URL
        </button>
      </div>

      {/* Input Form */}
      <div className="glass-card p-6 mb-6">
        {inputMode === 'address' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Property Address
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="280 41st Ave, St Pete Beach, FL 33706"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="input-glass pl-12"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Listing URL
              </label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="url"
                  placeholder="https://www.zillow.com/homedetails/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="input-glass pl-12"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Supports: Zillow, Redfin, Trulia, Realtor.com, Compass, homes.com
            </p>
          </div>
        )}

        {/* LLM Selection */}
        <div className="mt-6">
          <label className="block text-sm text-gray-400 mb-2">
            AI Engine
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['Auto', 'Claude', 'GPT', 'Hybrid'].map((engine) => (
              <button
                key={engine}
                className={`p-3 rounded-xl border transition-colors ${
                  engine === 'Auto'
                    ? 'border-quantum-cyan bg-quantum-cyan/10 text-quantum-cyan'
                    : 'border-white/10 text-gray-400 hover:border-white/20'
                }`}
              >
                <span className="text-sm font-semibold">{engine}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Scrape Button */}
        <button
          onClick={handleScrape}
          disabled={status !== 'idle' && status !== 'complete' && status !== 'error'}
          className="btn-quantum w-full mt-6"
        >
          {status === 'idle' || status === 'complete' || status === 'error' ? (
            <>
              <Sparkles className="w-5 h-5" />
              Extract Property Data
            </>
          ) : (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          )}
        </button>
      </div>

      {/* Progress Display */}
      {status !== 'idle' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-5d p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold text-white">
              {getStatusMessage()}
            </span>
            {status === 'complete' ? (
              <CheckCircle className="w-6 h-6 text-quantum-green" />
            ) : status === 'error' ? (
              <AlertCircle className="w-6 h-6 text-quantum-red" />
            ) : (
              <Loader2 className="w-6 h-6 text-quantum-cyan animate-spin" />
            )}
          </div>

          <div className="progress-quantum h-2 mb-4">
            <motion.div
              className="progress-quantum-fill"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          {/* Field Categories Progress */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className={`w-4 h-4 ${progress >= 20 ? 'text-quantum-green' : 'text-gray-600'}`} />
              <span className={progress >= 20 ? 'text-white' : 'text-gray-500'}>
                Core Property Data (Fields 1-30)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className={`w-4 h-4 ${progress >= 40 ? 'text-quantum-green' : 'text-gray-600'}`} />
              <span className={progress >= 40 ? 'text-white' : 'text-gray-500'}>
                Structural Details (Fields 31-50)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className={`w-4 h-4 ${progress >= 60 ? 'text-quantum-green' : 'text-gray-600'}`} />
              <span className={progress >= 60 ? 'text-white' : 'text-gray-500'}>
                Location & Schools (Fields 51-75)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className={`w-4 h-4 ${progress >= 80 ? 'text-quantum-green' : 'text-gray-600'}`} />
              <span className={progress >= 80 ? 'text-white' : 'text-gray-500'}>
                Financial Data (Fields 76-90)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className={`w-4 h-4 ${progress >= 100 ? 'text-quantum-green' : 'text-gray-600'}`} />
              <span className={progress >= 100 ? 'text-white' : 'text-gray-500'}>
                Utilities & Environment (Fields 91-110)
              </span>
            </div>
          </div>

          {status === 'complete' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 pt-4 border-t border-white/10"
            >
              <div className="flex gap-4">
                <button className="btn-quantum flex-1">
                  View Property
                </button>
                <button
                  onClick={() => {
                    setStatus('idle');
                    setProgress(0);
                    setAddress('');
                    setUrl('');
                  }}
                  className="btn-glass flex-1"
                >
                  Add Another
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
