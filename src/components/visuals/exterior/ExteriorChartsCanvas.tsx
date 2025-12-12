/**
 * Exterior Features Canvas Charts
 * 5 animated D3-style charts using HTML5 Canvas + React
 *
 * Charts:
 * 1. Helix Analysis - Rotating DNA helix showing 6 quality scores
 * 2. Orbital Gravity - Planets orbiting showing composite scores
 * 3. ISO-Layer Stack - Topographic stacked area chart
 * 6. Amenity Radial - Binary features in quantum cloud
 * 9. Connection Web - Amenity ownership network
 *
 * Uses React hooks (useRef + useEffect) to manage canvas animations
 * All animation code extracted from CLUES-Analytics-Enhanced-Exterior-Features.html
 */

import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { ExteriorChartsData } from '@/lib/exteriorFeaturesMapper';

interface ExteriorChartsCanvasProps {
  data: ExteriorChartsData;
}

// Utility: Get SMART tier for score (0-100)
function getScoreTier(score: number) {
  if (score >= 81) return {
    tier: 'EXCELLENT',
    color: '#4CAF50',
    emoji: '🟢'
  };
  if (score >= 61) return {
    tier: 'GOOD',
    color: '#2196F3',
    emoji: '🔵'
  };
  if (score >= 41) return {
    tier: 'AVERAGE',
    color: '#EAB308',
    emoji: '🟡'
  };
  if (score >= 21) return {
    tier: 'FAIR',
    color: '#FF9800',
    emoji: '🟠'
  };
  return {
    tier: 'POOR',
    color: '#FF4444',
    emoji: '🔴'
  };
}

export default function ExteriorChartsCanvas({ data }: ExteriorChartsCanvasProps) {
  // Canvas refs for all 5 charts
  const canvas1Ref = useRef<HTMLCanvasElement>(null);
  const canvas2Ref = useRef<HTMLCanvasElement>(null);
  const canvas3Ref = useRef<HTMLCanvasElement>(null);
  const canvas6Ref = useRef<HTMLCanvasElement>(null);
  const canvas9Ref = useRef<HTMLCanvasElement>(null);

  // Pause states for each chart
  const [paused1, setPaused1] = useState(false);
  const [paused2, setPaused2] = useState(false);
  const [paused3, setPaused3] = useState(false);
  const [paused6, setPaused6] = useState(false);
  const [paused9, setPaused9] = useState(false);

  // Chart 1: Helix Analysis
  useEffect(() => {
    const canvas = canvas1Ref.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    // Non-null assertion since we've checked above
    const ctx: CanvasRenderingContext2D = context;

    // Set canvas size (responsive)
    const resize = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = 700; // Fixed height for helix
      }
    };
    resize();
    window.addEventListener('resize', resize);

    let time = 0;
    let animationId: number;

    // Get high contrast color for icons
    function getContrastColor(bgColor: string): string {
      const colorMap: Record<string, number[]> = {
        '#4CAF50': [76, 175, 80],
        '#2196F3': [33, 150, 243],
        '#EAB308': [234, 179, 8],
        '#FF9800': [255, 152, 0],
        '#FF4444': [255, 68, 68]
      };

      const rgb = colorMap[bgColor] || [128, 128, 128];
      const luminance = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
      return luminance > 0.5 ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)';
    }

    // Draw feature icons (simplified versions - full versions are in the HTML)
    function drawFeatureIcon(ctx: CanvasRenderingContext2D, x: number, y: number, featureName: string, iconColor: string) {
      ctx.save();
      ctx.strokeStyle = iconColor;
      ctx.fillStyle = iconColor;
      ctx.lineWidth = 2;
      ctx.font = 'bold 14px Share Tech Mono';
      ctx.textAlign = 'center';

      // Simplified icon rendering - just show emoji for now
      const icons: Record<string, string> = {
        'Curb Appeal': '🏠',
        'Landscaping': '🌳',
        'Design': '🏛️',
        'Deck': '🪑',
        'Pool': '🏊',
        'Fence': '🏘️'
      };

      ctx.fillText(icons[featureName] || '•', x, y + 5);
      ctx.restore();
    }

    // Draw hexagon with property color ring + SMART tier fill
    function drawHex(x: number, y: number, r: number, propertyColor: string, featureScore: number, label: string) {
      const tier = getScoreTier(featureScore);
      const fillColor = tier.color;
      const iconColor = getContrastColor(fillColor);

      // Helix animation
      const xOff = Math.sin(time + y * 0.01) * 20;

      // Draw connecting helix line
      ctx.beginPath();
      ctx.moveTo(x + xOff, y - 20);
      ctx.lineTo(x - xOff, y + 20);
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw hexagon
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i * 60 - 30) * Math.PI / 180;
        ctx.lineTo(x + xOff + r * Math.cos(angle), y + r * Math.sin(angle));
      }
      ctx.closePath();

      // Fill with SMART tier color
      ctx.fillStyle = fillColor;
      ctx.globalAlpha = 0.5;
      ctx.fill();
      ctx.globalAlpha = 1;

      // Ring with property color
      ctx.strokeStyle = propertyColor;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw icon
      drawFeatureIcon(ctx, x + xOff, y, label, iconColor);
    }

    // Animation loop
    function animate() {
      if (!paused1) time += 0.02;

      // Canvas and ctx are guaranteed to exist here
      const w = canvas!.width;
      const h = canvas!.height;
      ctx.clearRect(0, 0, w, h);

      // Find winner
      const scores = [data.totalScores.p1, data.totalScores.p2, data.totalScores.p3];
      const maxScore = Math.max(...scores);
      const winnerIdx = scores.indexOf(maxScore);
      const winnerId = ['p1', 'p2', 'p3'][winnerIdx];
      const winnerScore = maxScore;
      const winnerTier = getScoreTier(winnerScore);
      const winnerName = data.properties[winnerId as 'p1' | 'p2' | 'p3'].shortName;

      // Winner badge at top center
      ctx.save();
      ctx.textAlign = 'center';
      ctx.fillStyle = winnerTier.color;
      ctx.strokeStyle = winnerTier.color;
      ctx.lineWidth = 2;

      const badgeY = 25;
      ctx.strokeRect(w/2 - 60, badgeY - 15, 120, 30);
      ctx.globalAlpha = 0.2;
      ctx.fillRect(w/2 - 60, badgeY - 15, 120, 30);
      ctx.globalAlpha = 1;

      ctx.font = 'bold 12px Share Tech Mono';
      ctx.fillText(`${winnerTier.emoji} WINNER`, w/2, badgeY);
      ctx.font = 'bold 16px Share Tech Mono';
      ctx.fillText(winnerName, w/2, badgeY + 14);
      ctx.restore();

      // Brain widget (SMART score) in upper right
      ctx.save();
      const brainX = w - 80;
      const brainY = 30;

      ctx.strokeStyle = winnerTier.color;
      ctx.fillStyle = winnerTier.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(brainX, brainY, 20, 0, Math.PI * 2);
      ctx.globalAlpha = 0.2;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.stroke();

      ctx.fillStyle = winnerTier.color;
      ctx.font = 'bold 16px Share Tech Mono';
      ctx.textAlign = 'center';
      ctx.fillText(String(winnerScore), brainX, brainY - 2);

      ctx.font = '9px Share Tech Mono';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText('/100', brainX, brainY + 10);

      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.font = 'bold 11px Share Tech Mono';
      ctx.textAlign = 'left';
      ctx.fillText('SMART', brainX + 25, brainY + 4);
      ctx.restore();

      // Draw helixes for each property
      const labels = ['Curb Appeal', 'Landscaping', 'Design', 'Deck', 'Pool', 'Fence'];
      const propData = [data.qualityScores.p1, data.qualityScores.p2, data.qualityScores.p3];
      const propColors = [data.properties.p1.color, data.properties.p2.color, data.properties.p3.color];
      const propNames = [data.properties.p1.shortName, data.properties.p2.shortName, data.properties.p3.shortName];
      const propIds = ['p1', 'p2', 'p3'] as const;

      const baseStartY = 100;
      propData.forEach((dataset, pIdx) => {
        const propertyColor = propColors[pIdx];
        const offsetX = [w/6, w/2, 5*w/6][pIdx];
        const propId = propIds[pIdx];
        const totalScore = data.totalScores[propId];

        // Property header
        ctx.save();
        ctx.fillStyle = propertyColor;
        ctx.font = '11px Share Tech Mono';
        ctx.textAlign = 'center';
        ctx.fillText(`TOTAL: ${totalScore}`, offsetX, baseStartY - 30);
        ctx.font = 'bold 12px Share Tech Mono';
        ctx.fillText(propNames[pIdx], offsetX, baseStartY - 10);
        ctx.restore();

        // Draw 6 features
        for (let i = 0; i < 6; i++) {
          const y = baseStartY + 40 + i * 70;
          const r = 27;
          const featureScore = dataset[i];
          const featureLabel = labels[i];

          // Feature label
          ctx.save();
          ctx.fillStyle = 'rgba(255,255,255,0.6)';
          ctx.font = '9px Share Tech Mono';
          ctx.textAlign = 'right';
          ctx.fillText(featureLabel.toUpperCase(), offsetX - 55, y + 3);
          ctx.restore();

          // Draw helix
          drawHex(offsetX, y, r, propertyColor, featureScore, featureLabel);
        }
      });

      // Property legend
      ctx.save();
      ctx.font = 'bold 10px Share Tech Mono';
      ctx.textAlign = 'center';
      const legendY = h - 80;

      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillText('PROPERTIES:', w/2 - 180, legendY);

      ctx.font = '10px Share Tech Mono';
      ctx.fillStyle = propColors[0];
      ctx.fillText(`█ ${propNames[0]}`, w/2 - 90, legendY);
      ctx.fillStyle = propColors[1];
      ctx.fillText(`█ ${propNames[1]}`, w/2, legendY);
      ctx.fillStyle = propColors[2];
      ctx.fillText(`█ ${propNames[2]}`, w/2 + 90, legendY);
      ctx.restore();

      animationId = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [data, paused1]);

  // TODO: Charts 2, 3, 6, 9 will follow same pattern
  // For now, placeholder canvases

  return (
    <div className="space-y-8">
      {/* Chart 1: Helix Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 backdrop-blur-xl border border-white/10 overflow-hidden"
      >
        {/* Header */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
          <span className="text-xs font-mono text-gray-500">Chart 7-1</span>
          <button
            onClick={() => setPaused1(!paused1)}
            className="px-3 py-1 rounded bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/30 transition-all text-xs font-mono"
          >
            {paused1 ? '▶ Play' : '⏸ Pause'}
          </button>
        </div>

        {/* Title below header */}
        <div className="pt-16 pb-2 text-center">
          <h3 className="text-base font-bold text-white font-mono tracking-wider">HELIX ANALYSIS</h3>
          <p className="text-xs text-gray-400 font-mono mt-1">6 Exterior Quality Factors • Rotating DNA Structure</p>
        </div>

        {/* Canvas */}
        <canvas
          ref={canvas1Ref}
          className="w-full"
          style={{ display: 'block' }}
        />

        {/* Explanation */}
        <div className="p-4 bg-black/20 border-t border-white/5">
          <p className="text-[10px] text-gray-400 font-mono leading-relaxed">
            <span className="text-cyan-400 font-bold">HOW TO READ:</span> Ring color = property identity • Fill color = CLUES-SMART tier (see legend) • Icon = feature type • Total score = average of 6 factors
          </p>
        </div>
      </motion.div>

      {/* Charts 2, 3, 6, 9 - Placeholders for now */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { id: 2, title: 'ORBITAL GRAVITY', desc: 'Composite Score Analysis' },
          { id: 3, title: 'ISO-LAYER STACK', desc: 'Layered Factor Comparison' },
          { id: 6, title: 'AMENITY RADIAL', desc: 'Binary Features Analysis' },
          { id: 9, title: 'CONNECTION WEB', desc: 'Amenity Ownership Network' }
        ].map((chart) => (
          <motion.div
            key={chart.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: chart.id * 0.1 }}
            className="relative rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 backdrop-blur-xl border border-white/10 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-gray-500">Chart 7-{chart.id}</span>
            </div>
            <h3 className="text-sm font-bold text-white font-mono tracking-wider mb-1">{chart.title}</h3>
            <p className="text-xs text-gray-400 font-mono mb-4">{chart.desc}</p>
            <canvas
              ref={chart.id === 2 ? canvas2Ref : chart.id === 3 ? canvas3Ref : chart.id === 6 ? canvas6Ref : canvas9Ref}
              width={600}
              height={400}
              className="w-full rounded-lg bg-black/20"
            />
            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
              <p className="text-xs text-yellow-200 font-mono">🚧 Chart animation implementation in progress</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
