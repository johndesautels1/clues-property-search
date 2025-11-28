/**
 * Property Selector
 *
 * Toggle between viewing individual properties or comparing all
 * Chip-style selection with "All Properties" option
 */

import { motion } from 'framer-motion';
import { Home, GitCompare } from 'lucide-react';

interface Property {
  id: string | number;
  address: string;
  listPrice: number;
  [key: string]: any;
}

interface PropertySelectorProps {
  properties: Property[];
  selectedId: string | number | 'all';
  onSelect: (id: string | number | 'all') => void;
}

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  return `$${(value / 1000).toFixed(0)}K`;
}

function shortAddress(address: string): string {
  return address.split(',')[0] || address;
}

export default function PropertySelector({ properties, selectedId, onSelect }: PropertySelectorProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 p-4 rounded-2xl"
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <span className="text-gray-500 text-sm mr-2">View:</span>

      {/* All Properties Option */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onSelect('all')}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
          selectedId === 'all'
            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
            : 'bg-white/5 text-gray-400 border border-transparent hover:bg-white/10'
        }`}
      >
        <GitCompare className="w-4 h-4" />
        <span className="font-medium">Compare All ({properties.length})</span>
      </motion.button>

      {/* Individual Property Options */}
      {properties.map((property, index) => (
        <motion.button
          key={property.id}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect(property.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            selectedId === property.id
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
              : 'bg-white/5 text-gray-400 border border-transparent hover:bg-white/10'
          }`}
        >
          <Home className="w-4 h-4" />
          <div className="text-left">
            <span className="font-medium block text-sm">{shortAddress(property.address)}</span>
            <span className="text-xs opacity-70">{formatCurrency(property.listPrice)}</span>
          </div>
        </motion.button>
      ))}
    </div>
  );
}
