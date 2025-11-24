/**
 * CLUES Property Dashboard - Property Search Form
 * 110-field form with address autocomplete
 * Sources visible to admin only
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ChevronDown,
  ChevronRight,
  Check,
  Info,
  Loader2,
} from 'lucide-react';
import { useIsAdmin } from '@/store/authStore';
import {
  FIELD_DEFINITIONS,
  FIELD_GROUPS,
  DATA_SOURCES,
  type DataSource,
  type FieldDefinition,
} from '@/types/property-schema';

interface FieldValue {
  value: string | number | boolean | string[];
  source: DataSource;
}

interface PropertySearchFormProps {
  onSubmit: (data: Record<string, FieldValue>) => void;
  initialData?: Record<string, FieldValue>;
}

export default function PropertySearchForm({ onSubmit, initialData }: PropertySearchFormProps) {
  const isAdmin = useIsAdmin();
  const [formData, setFormData] = useState<Record<string, FieldValue>>({});
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['A', 'B', 'C']); // First 3 groups expanded by default
  const [isSearching, setIsSearching] = useState(false);
  const [addressInput, setAddressInput] = useState('');

  // Initialize form data
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const expandAllGroups = () => {
    setExpandedGroups(FIELD_GROUPS.map(g => g.id));
  };

  const collapseAllGroups = () => {
    setExpandedGroups([]);
  };

  const updateField = (key: string, value: string | number | boolean | string[], source?: DataSource) => {
    setFormData(prev => ({
      ...prev,
      [key]: {
        value,
        source: source || prev[key]?.source || 'Manual Entry',
      },
    }));
  };

  const updateFieldSource = (key: string, source: DataSource) => {
    setFormData(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        source,
      },
    }));
  };

  const handleAddressSearch = async () => {
    if (!addressInput.trim()) return;

    setIsSearching(true);

    // Simulate API call for address lookup
    // In production, this would call Google Places API, Zillow API, etc.
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Auto-populate some fields based on address
    // This is mock data - real implementation would fetch from APIs
    const mockData: Record<string, FieldValue> = {
      'addressIdentity.fullAddress': { value: addressInput, source: 'Manual Entry' },
      // More fields would be auto-populated from API responses
    };

    setFormData(prev => ({ ...prev, ...mockData }));
    setIsSearching(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const renderField = (field: FieldDefinition) => {
    const fieldValue = formData[field.key];
    const value = fieldValue?.value ?? '';
    const source = fieldValue?.source ?? 'Manual Entry';

    return (
      <div key={field.id} className="grid grid-cols-12 gap-2 items-start py-2 border-b border-white/5">
        {/* Field Number */}
        <div className="col-span-1 text-xs text-gray-500 font-mono pt-2">
          #{field.id}
        </div>

        {/* Field Label & Input */}
        <div className="col-span-6 md:col-span-5">
          <label className="block text-sm text-gray-300 mb-1">
            {field.label}
            {field.required && <span className="text-red-400 ml-1">*</span>}
            {field.helpText && (
              <span className="ml-1 text-gray-500 cursor-help" title={field.helpText}>
                <Info className="w-3 h-3 inline" />
              </span>
            )}
          </label>
          {renderFieldInput(field, value, (val) => updateField(field.key, val))}
        </div>

        {/* Source Selector - Admin Only */}
        {isAdmin && (
          <div className="col-span-5 md:col-span-6">
            <label className="block text-xs text-gray-500 mb-1">Source</label>
            <select
              value={source}
              onChange={(e) => updateFieldSource(field.key, e.target.value as DataSource)}
              className="w-full bg-quantum-dark/50 border border-white/10 rounded-lg px-2 py-2 text-sm text-gray-300 focus:border-quantum-cyan focus:outline-none"
            >
              {DATA_SOURCES.map(src => (
                <option key={src} value={src}>{src}</option>
              ))}
            </select>
          </div>
        )}
      </div>
    );
  };

  const renderFieldInput = (
    field: FieldDefinition,
    value: string | number | boolean | string[],
    onChange: (val: string | number | boolean | string[]) => void
  ) => {
    const baseClass = "w-full bg-quantum-dark/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-quantum-cyan focus:outline-none transition-colors";

    switch (field.type) {
      case 'boolean':
        return (
          <div className="flex items-center gap-4 py-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={value === true}
                onChange={() => onChange(true)}
                className="text-quantum-cyan focus:ring-quantum-cyan"
              />
              <span className="text-sm text-gray-300">Yes</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={value === false}
                onChange={() => onChange(false)}
                className="text-quantum-cyan focus:ring-quantum-cyan"
              />
              <span className="text-sm text-gray-300">No</span>
            </label>
          </div>
        );

      case 'select':
        return (
          <select
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            className={baseClass}
          >
            <option value="">Select...</option>
            {field.options?.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );

      case 'multiselect':
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div className="flex flex-wrap gap-2 py-1">
            {field.options?.map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  const newValues = selectedValues.includes(opt)
                    ? selectedValues.filter(v => v !== opt)
                    : [...selectedValues, opt];
                  onChange(newValues);
                }}
                className={`px-2 py-1 text-xs rounded-lg border transition-colors ${
                  selectedValues.includes(opt)
                    ? 'bg-quantum-cyan/20 border-quantum-cyan text-quantum-cyan'
                    : 'border-white/10 text-gray-400 hover:border-white/20'
                }`}
              >
                {selectedValues.includes(opt) && <Check className="w-3 h-3 inline mr-1" />}
                {opt}
              </button>
            ))}
          </div>
        );

      case 'number':
      case 'currency':
      case 'percentage':
        return (
          <div className="relative">
            {field.type === 'currency' && (
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            )}
            <input
              type="number"
              value={value as number || ''}
              onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
              placeholder={field.placeholder}
              className={`${baseClass} ${field.type === 'currency' ? 'pl-7' : ''}`}
            />
            {field.type === 'percentage' && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
            )}
          </div>
        );

      case 'date':
        return (
          <input
            type="date"
            value={value as string || ''}
            onChange={(e) => onChange(e.target.value)}
            className={baseClass}
          />
        );

      default:
        return (
          <input
            type="text"
            value={value as string || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className={baseClass}
          />
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Address Search Bar */}
      <div className="glass-card p-4">
        <label className="block text-sm text-gray-400 mb-2">
          Quick Address Search
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              placeholder="Enter address to auto-populate fields..."
              className="w-full bg-quantum-dark border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:border-quantum-cyan focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={handleAddressSearch}
            disabled={isSearching}
            className="px-6 py-3 bg-gradient-to-r from-quantum-cyan to-quantum-blue text-quantum-black font-semibold rounded-xl hover:shadow-lg hover:shadow-quantum-cyan/30 transition-all disabled:opacity-50"
          >
            {isSearching ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Search'
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Auto-populates data from MLS, Zillow, County Records, and more
        </p>
      </div>

      {/* Expand/Collapse Controls */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">
          All 110 Property Fields
        </h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={expandAllGroups}
            className="text-xs text-quantum-cyan hover:underline"
          >
            Expand All
          </button>
          <span className="text-gray-600">|</span>
          <button
            type="button"
            onClick={collapseAllGroups}
            className="text-xs text-gray-400 hover:underline"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Field Groups */}
      <div className="space-y-2">
        {FIELD_GROUPS.map((group) => {
          const groupFields = FIELD_DEFINITIONS.filter(f => group.fields.includes(f.id));
          const isExpanded = expandedGroups.includes(group.id);
          const filledCount = groupFields.filter(f => {
            const val = formData[f.key]?.value;
            return val !== undefined && val !== '' && val !== null;
          }).length;

          return (
            <div key={group.id} className="glass-card overflow-hidden">
              {/* Group Header */}
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-quantum-cyan" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  )}
                  <span className="text-xs font-mono text-gray-500 bg-white/5 px-2 py-0.5 rounded">
                    {group.id}
                  </span>
                  <span className="font-semibold text-white">{group.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">
                    {filledCount}/{groupFields.length} fields
                  </span>
                  <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-quantum-cyan to-quantum-purple rounded-full transition-all"
                      style={{ width: `${(filledCount / groupFields.length) * 100}%` }}
                    />
                  </div>
                </div>
              </button>

              {/* Group Fields */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-white/10"
                  >
                    <div className="p-4 space-y-1">
                      {/* Header row for admin */}
                      {isAdmin && (
                        <div className="grid grid-cols-12 gap-2 text-xs text-gray-500 pb-2 border-b border-white/10">
                          <div className="col-span-1">#</div>
                          <div className="col-span-5">Field</div>
                          <div className="col-span-6">Data Source (Admin Only)</div>
                        </div>
                      )}
                      {groupFields.map(renderField)}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Submit Button */}
      <div className="sticky bottom-4 glass-card p-4 flex justify-between items-center">
        <div className="text-sm text-gray-400">
          {Object.keys(formData).filter(k => {
            const val = formData[k]?.value;
            return val !== undefined && val !== '' && val !== null;
          }).length} / 110 fields completed
        </div>
        <button
          type="submit"
          className="px-8 py-3 bg-gradient-to-r from-quantum-cyan to-quantum-purple text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-quantum-purple/30 transition-all"
        >
          Save Property
        </button>
      </div>
    </form>
  );
}
