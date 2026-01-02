/**
 * Multi-Select Field Component with Feature Verification
 * Displays array/multiselect field values as individual chips with verification UI
 * Used for fields like community_features, interior_features, appliances, etc.
 */

import { useState } from 'react';
import { Check, X } from 'lucide-react';

interface MultiSelectFieldProps {
  label: string;
  value: string | string[] | null | undefined;
  fieldKey?: string;
  // Admin metadata
  confidence?: string;
  sources?: string[]; // Primary sources (MLS, Google, APIs, etc.)
  llmSources?: string[]; // LLM-specific sources
  hasConflict?: boolean;
  isAdmin?: boolean;
}

export const MultiSelectField = ({
  label,
  value,
  fieldKey,
  confidence,
  sources,
  llmSources,
  hasConflict,
  isAdmin = false,
}: MultiSelectFieldProps) => {
  // Parse value into array
  const features: string[] = (() => {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(Boolean);
    if (typeof value === 'string') {
      // Split by comma, semicolon, or pipe and trim
      return value
        .split(/[,;|]/)
        .map(f => f.trim())
        .filter(Boolean);
    }
    return [];
  })();

  // State to track verification status for each feature
  const [verificationState, setVerificationState] = useState<Record<string, 'verified' | 'rejected' | null>>(
    () => {
      const initial: Record<string, 'verified' | 'rejected' | null> = {};
      features.forEach(f => (initial[f] = null));
      return initial;
    }
  );

  const handleVerification = (feature: string, status: 'verified' | 'rejected') => {
    setVerificationState(prev => ({
      ...prev,
      [feature]: prev[feature] === status ? null : status, // Toggle
    }));
  };

  if (features.length === 0) {
    return (
      <div className="py-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">{label}</span>
          <span className="text-sm text-gray-500">Not available</span>
        </div>
      </div>
    );
  }

  // Determine data source badge color
  let sourceBadgeColor = 'text-gray-500';
  let sourceBadgeText = '';

  if (isAdmin) {
    const primarySource = (llmSources && llmSources.length > 0) ? llmSources[0] : (sources && sources.length > 0) ? sources[0] : '';

    if (confidence === 'High') {
      sourceBadgeColor = 'text-emerald-400';
      sourceBadgeText = primarySource || 'High Confidence';
    } else if (confidence === 'Medium') {
      sourceBadgeColor = 'text-yellow-400';
      sourceBadgeText = 'Medium Confidence';
    } else if (hasConflict) {
      sourceBadgeColor = 'text-orange-400';
      sourceBadgeText = 'Conflict Detected';
    } else if (primarySource) {
      sourceBadgeColor = 'text-blue-400';
      sourceBadgeText = primarySource;
    }
  }

  return (
    <div className="py-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-300">{label}</span>
        {isAdmin && sourceBadgeText && (
          <span className={`text-xs ${sourceBadgeColor}`}>{sourceBadgeText}</span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {features.map((feature, idx) => {
          const status = verificationState[feature];

          // Base styles
          let chipStyles = 'group relative inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 border';

          // Status-based styling
          if (status === 'verified') {
            chipStyles += ' bg-emerald-500/20 border-emerald-500/50 text-emerald-300';
          } else if (status === 'rejected') {
            chipStyles += ' bg-red-500/20 border-red-500/50 text-red-300 line-through opacity-60';
          } else {
            chipStyles += ' bg-white/5 border-white/10 text-white hover:border-blue-400/50 hover:bg-blue-500/10';
          }

          return (
            <div key={`${fieldKey}-${idx}`} className={chipStyles}>
              {/* Feature text */}
              <span>{feature}</span>

              {/* Verification buttons (show on hover or if status is set) */}
              <div className={`flex items-center gap-1 ml-1 ${status ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                <button
                  onClick={() => handleVerification(feature, 'verified')}
                  className={`p-1 rounded transition-colors ${
                    status === 'verified'
                      ? 'bg-emerald-500 text-white'
                      : 'hover:bg-blue-500 hover:text-white text-gray-400'
                  }`}
                  title="Verify this feature"
                  aria-label={`Verify ${feature}`}
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleVerification(feature, 'rejected')}
                  className={`p-1 rounded transition-colors ${
                    status === 'rejected'
                      ? 'bg-red-500 text-white'
                      : 'hover:bg-red-500 hover:text-white text-gray-400'
                  }`}
                  title="Reject this feature"
                  aria-label={`Reject ${feature}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary of verified/rejected */}
      {(Object.values(verificationState).some(v => v === 'verified') ||
        Object.values(verificationState).some(v => v === 'rejected')) && (
        <div className="mt-3 pt-3 border-t border-white/5 text-xs text-gray-400">
          <span className="text-emerald-400">
            {Object.values(verificationState).filter(v => v === 'verified').length} verified
          </span>
          {' • '}
          <span className="text-red-400">
            {Object.values(verificationState).filter(v => v === 'rejected').length} rejected
          </span>
        </div>
      )}
    </div>
  );
};
