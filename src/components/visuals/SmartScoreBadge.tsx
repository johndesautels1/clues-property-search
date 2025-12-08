/**
 * CLUES-Smart Score Badge Component
 * Reusable 🧠 Smart score widget for all 175 charts
 * Displays in upper right corner of each chart card
 */

import { getScoreResult } from '@/lib/cluesSmartScoring';

interface SmartScoreBadgeProps {
  score: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
}

export default function SmartScoreBadge({ score, size = 'md' }: SmartScoreBadgeProps) {
  const scoreResult = getScoreResult(score);

  const sizes = {
    sm: {
      padding: '4px 10px',
      emojiSize: '12px',
      labelSize: '10px',
      scoreSize: '11px',
    },
    md: {
      padding: '6px 12px',
      emojiSize: '14px',
      labelSize: '11px',
      scoreSize: '13px',
    },
    lg: {
      padding: '8px 16px',
      emojiSize: '16px',
      labelSize: '12px',
      scoreSize: '15px',
    },
  };

  const sizeConfig = sizes[size];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: sizeConfig.padding,
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '9999px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }}
    >
      <span style={{ fontSize: sizeConfig.emojiSize }} role="img" aria-label="Smart score">
        🧠
      </span>
      <span
        style={{
          fontSize: sizeConfig.labelSize,
          fontWeight: 600,
          color: '#94a3b8',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        Smart
      </span>
      <span
        style={{
          fontSize: sizeConfig.scoreSize,
          fontWeight: 700,
          color: scoreResult.color,
        }}
      >
        {scoreResult.score}
      </span>
    </div>
  );
}
