/**
 * Exterior Features Canvas Charts - COMPLETE IMPLEMENTATION
 * 5 animated D3-style charts using HTML5 Canvas + React
 *
 * ALL CODE FROM CLUES-Analytics-Enhanced-Exterior-Features (1).html
 * NO STRIPPING - COMPLETE FEATURE SET
 *
 * Charts:
 * 1. Helix Analysis - Rotating DNA helix with detailed icons
 * 2. Orbital Gravity - Planets orbiting showing composite scores
 * 3. ISO-Layer Stack - Isometric topographic layers
 * 6. Amenity Radial - Rotating rings with binary features
 * 9. Connection Web - Network visualization with pulsing
 */

import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { ExteriorChartsData } from '@/lib/exteriorFeaturesMapper';

interface ExteriorChartsCanvasProps {
  data: ExteriorChartsData;
}

// Utility: Get SMART tier for score (0-100)
function getScoreTier(score: number) {
  if (score >= 81) return { tier: 'EXCELLENT', color: '#4CAF50', emoji: '🟢' };
  if (score >= 61) return { tier: 'GOOD', color: '#2196F3', emoji: '🔵' };
  if (score >= 41) return { tier: 'AVERAGE', color: '#EAB308', emoji: '🟡' };
  if (score >= 21) return { tier: 'FAIR', color: '#FF9800', emoji: '🟠' };
  return { tier: 'POOR', color: '#FF4444', emoji: '🔴' };
}

export default function ExteriorChartsCanvas({ data }: ExteriorChartsCanvasProps) {
  const canvas1Ref = useRef<HTMLCanvasElement>(null);
  const canvas2Ref = useRef<HTMLCanvasElement>(null);
  const canvas3Ref = useRef<HTMLCanvasElement>(null);
  const canvas6Ref = useRef<HTMLCanvasElement>(null);
  const canvas9Ref = useRef<HTMLCanvasElement>(null);

  const [paused1, setPaused1] = useState(false);
  const [paused2, setPaused2] = useState(false);
  const [paused3, setPaused3] = useState(false);
  const [paused6, setPaused6] = useState(false);
  const [paused9, setPaused9] = useState(false);

  const labels = ['CURB', 'LNDSCP', 'DESIGN', 'DECK', 'POOL', 'FENCE'];
  const labelsFull = ['Curb Appeal', 'Landscaping', 'Design', 'Deck', 'Pool', 'Fence'];

  // Find winner
  const scores = [data.totalScores.p1, data.totalScores.p2, data.totalScores.p3];
  const maxScore = Math.max(...scores);
  const winnerIdx = scores.indexOf(maxScore);
  const winnerId = ['p1', 'p2', 'p3'][winnerIdx] as 'p1' | 'p2' | 'p3';

  // CHART 1: HELIX ANALYSIS - COMPLETE
  useEffect(() => {
    const canvas = canvas1Ref.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;
    const ctx: CanvasRenderingContext2D = context;

    const resize = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = 700;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    // Enable crisp, high-quality text rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

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

    // COMPLETE ICON DRAWING - ALL FEATURES FROM HTML
    function drawFeatureIcon(ctx: CanvasRenderingContext2D, x: number, y: number, featureName: string, iconColor: string) {
      ctx.save();
      ctx.strokeStyle = iconColor;
      ctx.fillStyle = iconColor;

      switch(featureName.toUpperCase()) {
        case 'CURB APPEAL':
          ctx.lineWidth = 2;
          // Roof
          ctx.beginPath();
          ctx.moveTo(x - 15, y - 8);
          ctx.lineTo(x, y - 16);
          ctx.lineTo(x + 15, y - 8);
          ctx.closePath();
          ctx.stroke();
          ctx.globalAlpha = 0.3;
          ctx.fill();
          ctx.globalAlpha = 1;
          // House body
          ctx.strokeRect(x - 12, y - 8, 24, 18);
          ctx.globalAlpha = 0.2;
          ctx.fillRect(x - 12, y - 8, 24, 18);
          ctx.globalAlpha = 1;
          // Door
          ctx.fillRect(x - 3, y + 3, 6, 7);
          // Windows
          ctx.strokeRect(x - 10, y - 2, 5, 5);
          ctx.strokeRect(x + 5, y - 2, 5, 5);
          // Window panes
          ctx.globalAlpha = 0.5;
          ctx.beginPath();
          ctx.moveTo(x - 7.5, y - 2);
          ctx.lineTo(x - 7.5, y + 3);
          ctx.moveTo(x - 10, y + 0.5);
          ctx.lineTo(x - 5, y + 0.5);
          ctx.moveTo(x + 7.5, y - 2);
          ctx.lineTo(x + 7.5, y + 3);
          ctx.moveTo(x + 5, y + 0.5);
          ctx.lineTo(x + 10, y + 0.5);
          ctx.stroke();
          ctx.globalAlpha = 1;
          // Sidewalk
          ctx.globalAlpha = 0.3;
          ctx.fillRect(x - 2, y + 10, 4, 8);
          ctx.globalAlpha = 1;
          // Shrubs
          ctx.beginPath();
          ctx.arc(x - 14, y + 8, 3, 0, Math.PI * 2);
          ctx.arc(x + 14, y + 8, 3, 0, Math.PI * 2);
          ctx.globalAlpha = 0.4;
          ctx.fill();
          ctx.globalAlpha = 1;
          break;

        case 'LANDSCAPING':
          ctx.lineWidth = 1.5;
          // Grass base
          ctx.globalAlpha = 0.2;
          ctx.fillRect(x - 18, y + 8, 36, 10);
          ctx.globalAlpha = 1;
          // Tree 1
          ctx.fillRect(x - 12, y + 8, 2, 8);
          ctx.beginPath();
          ctx.arc(x - 11, y + 3, 6, 0, Math.PI * 2);
          ctx.globalAlpha = 0.5;
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.stroke();
          // Bush
          ctx.beginPath();
          ctx.arc(x - 3, y + 12, 4, 0, Math.PI * 2);
          ctx.arc(x + 1, y + 11, 4, 0, Math.PI * 2);
          ctx.globalAlpha = 0.5;
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.stroke();
          // Flowers
          ctx.lineWidth = 1;
          for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(x + 8 + i * 3, y + 14, 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
          // Tree 2
          ctx.lineWidth = 1.5;
          ctx.fillRect(x + 10, y + 6, 2, 10);
          ctx.beginPath();
          ctx.arc(x + 11, y, 7, 0, Math.PI * 2);
          ctx.globalAlpha = 0.5;
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.stroke();
          break;

        case 'DESIGN':
          ctx.lineWidth = 2;
          // Modern house
          ctx.strokeRect(x - 14, y - 2, 28, 14);
          ctx.globalAlpha = 0.2;
          ctx.fillRect(x - 14, y - 2, 28, 14);
          ctx.globalAlpha = 1;
          // Flat roof section
          ctx.strokeRect(x - 8, y - 12, 16, 10);
          ctx.globalAlpha = 0.15;
          ctx.fillRect(x - 8, y - 12, 16, 10);
          ctx.globalAlpha = 1;
          // Windows
          ctx.globalAlpha = 0.6;
          ctx.fillRect(x - 12, y + 2, 8, 8);
          ctx.fillRect(x + 4, y + 2, 8, 8);
          ctx.globalAlpha = 1;
          ctx.strokeRect(x - 12, y + 2, 8, 8);
          ctx.strokeRect(x + 4, y + 2, 8, 8);
          // Accent lines
          ctx.lineWidth = 1;
          ctx.globalAlpha = 0.5;
          ctx.beginPath();
          ctx.moveTo(x - 14, y + 6);
          ctx.lineTo(x + 14, y + 6);
          ctx.stroke();
          ctx.globalAlpha = 1;
          break;

        case 'DECK':
          ctx.lineWidth = 2;
          // Deck floor
          ctx.beginPath();
          ctx.moveTo(x - 16, y + 10);
          ctx.lineTo(x - 12, y - 8);
          ctx.lineTo(x + 12, y - 8);
          ctx.lineTo(x + 16, y + 10);
          ctx.closePath();
          ctx.globalAlpha = 0.3;
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.stroke();
          // Deck boards
          ctx.lineWidth = 1;
          ctx.globalAlpha = 0.4;
          for (let i = -6; i <= 8; i += 3) {
            ctx.beginPath();
            ctx.moveTo(x - 14, y + i);
            ctx.lineTo(x + 14, y + i);
            ctx.stroke();
          }
          ctx.globalAlpha = 1;
          // Railing posts
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x - 12, y - 8);
          ctx.lineTo(x - 12, y - 15);
          ctx.moveTo(x, y - 8);
          ctx.lineTo(x, y - 15);
          ctx.moveTo(x + 12, y - 8);
          ctx.lineTo(x + 12, y - 15);
          ctx.stroke();
          // Top railing
          ctx.beginPath();
          ctx.moveTo(x - 12, y - 15);
          ctx.lineTo(x + 12, y - 15);
          ctx.stroke();
          break;

        case 'POOL':
          ctx.lineWidth = 2;
          // Pool shape
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(x - 16, y - 10, 32, 20, 4);
          } else {
            ctx.rect(x - 16, y - 10, 32, 20);
          }
          ctx.globalAlpha = 0.4;
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.stroke();
          // Water ripples
          ctx.lineWidth = 1;
          ctx.globalAlpha = 0.5;
          ctx.beginPath();
          ctx.ellipse(x - 6, y - 3, 5 + Math.sin(time * 2) * 0.5, 3, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.ellipse(x + 4, y + 2, 4 + Math.cos(time * 2 + 1) * 0.5, 2.5, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
          // Pool ladder
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x + 12, y - 8);
          ctx.lineTo(x + 12, y + 8);
          ctx.moveTo(x + 15, y - 8);
          ctx.lineTo(x + 15, y + 8);
          ctx.moveTo(x + 12, y - 4);
          ctx.lineTo(x + 15, y - 4);
          ctx.moveTo(x + 12, y);
          ctx.lineTo(x + 15, y);
          ctx.moveTo(x + 12, y + 4);
          ctx.lineTo(x + 15, y + 4);
          ctx.stroke();
          break;

        case 'FENCE':
          ctx.lineWidth = 2;
          // Fence posts
          const postPositions = [-14, -7, 0, 7, 14];
          postPositions.forEach((pos, idx) => {
            const height = 18 + (idx === 2 ? 4 : 0);
            ctx.fillRect(x + pos - 1.5, y - height + 10, 3, height);
            // Post cap
            ctx.beginPath();
            ctx.moveTo(x + pos - 3, y - height + 10);
            ctx.lineTo(x + pos, y - height + 6);
            ctx.lineTo(x + pos + 3, y - height + 10);
            ctx.closePath();
            ctx.fill();
          });
          // Horizontal rails
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.5;
          ctx.beginPath();
          ctx.moveTo(x - 16, y - 6);
          ctx.lineTo(x + 16, y - 6);
          ctx.moveTo(x - 16, y + 2);
          ctx.lineTo(x + 16, y + 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
          // Vertical slats
          ctx.lineWidth = 1;
          ctx.globalAlpha = 0.4;
          for (let i = -12; i <= 12; i += 3) {
            if (!postPositions.includes(i)) {
              ctx.beginPath();
              ctx.moveTo(x + i, y - 14);
              ctx.lineTo(x + i, y + 8);
              ctx.stroke();
            }
          }
          ctx.globalAlpha = 1;
          break;
      }
      ctx.restore();
    }

    // Draw hexagon
    function drawHex(x: number, y: number, r: number, propertyColor: string, featureScore: number, label: string) {
      const tier = getScoreTier(featureScore);
      const fillColor = tier.color;
      const iconColor = getContrastColor(fillColor);
      const xOff = Math.sin(time + y * 0.01) * 20;

      // Connecting line
      ctx.beginPath();
      ctx.moveTo(x + xOff, y - 20);
      ctx.lineTo(x - xOff, y + 20);
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Hexagon
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i * 60 - 30) * Math.PI / 180;
        ctx.lineTo(x + xOff + r * Math.cos(angle), y + r * Math.sin(angle));
      }
      ctx.closePath();
      ctx.fillStyle = fillColor;
      ctx.globalAlpha = 0.5;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = propertyColor;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Icon
      drawFeatureIcon(ctx, x + xOff, y, label, iconColor);
    }

    function animate() {
      if (!paused1) time += 0.02;
      const w = canvas!.width;
      const h = canvas!.height;
      ctx.clearRect(0, 0, w, h);

      const winnerScore = data.totalScores[winnerId];
      const winnerTier = getScoreTier(winnerScore);
      const winnerName = data.properties[winnerId].name; // FULL address, no abbreviations

      // TITLE: CHART 7-1 (top left)
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 13px Inter, Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('CHART 7-1', 20, 20);

      // Winner badge
      ctx.save();
      ctx.textAlign = 'center';
      ctx.fillStyle = winnerTier.color;
      ctx.strokeStyle = winnerTier.color;
      ctx.lineWidth = 2;
      const badgeY = 25;
      ctx.strokeRect(w/2 - 120, badgeY - 22.5, 240, 45);
      ctx.globalAlpha = 0.2;
      ctx.fillRect(w/2 - 120, badgeY - 22.5, 240, 45);
      ctx.globalAlpha = 1;
      ctx.font = 'bold 14px Inter, Arial, sans-serif';
      ctx.fillText(`${winnerTier.emoji} WINNER`, w/2, badgeY);
      ctx.font = 'bold 18px Inter, Arial, sans-serif';
      ctx.fillText(winnerName, w/2, badgeY + 14);
      ctx.restore();

      // Brain widget
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
      ctx.font = 'bold 18px Inter, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(winnerScore), brainX, brainY - 2);
      ctx.font = 'bold 11px Inter, Arial, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('/100', brainX, brainY + 10);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 13px Inter, Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('SMART', brainX + 25, brainY + 4);
      ctx.restore();

      // Draw helixes
      const propData = [data.qualityScores.p1, data.qualityScores.p2, data.qualityScores.p3];
      const propColors = [data.properties.p1.color, data.properties.p2.color, data.properties.p3.color];
      const propNames = [data.properties.p1.name, data.properties.p2.name, data.properties.p3.name]; // FULL addresses
      const propIds = ['p1', 'p2', 'p3'] as const;
      const baseStartY = 100;

      propData.forEach((dataset, pIdx) => {
        const propertyColor = propColors[pIdx];
        const offsetX = [w/6, w/2, 5*w/6][pIdx];
        const propId = propIds[pIdx];
        const totalScore = data.totalScores[propId];

        ctx.save();
        ctx.fillStyle = propertyColor;
        ctx.font = 'bold 13px Inter, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`TOTAL: ${totalScore}`, offsetX, baseStartY - 30);
        ctx.font = 'bold 14px Inter, Arial, sans-serif';
        ctx.fillText(propNames[pIdx], offsetX, baseStartY - 10);
        ctx.restore();

        for (let i = 0; i < 6; i++) {
          const y = baseStartY + 40 + i * 70;
          const r = 27;
          const featureScore = dataset[i];
          const featureLabel = labelsFull[i];

          ctx.save();
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 11px Inter, Arial, sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText(featureLabel.toUpperCase(), offsetX - 55, y + 3);
          ctx.restore();

          drawHex(offsetX, y, r, propertyColor, featureScore, featureLabel);
        }
      });

      // CALCULATION BREAKDOWN (h-86) - Moved DOWN 144px (1.5 inches)
      ctx.save();
      const calcY = h - 86;
      ctx.font = 'bold 13px Inter, Arial, sans-serif';
      ctx.fillStyle = '#FFEB3B';
      ctx.textAlign = 'left';
      ctx.fillText('TOTAL SCORE CALCULATION:', 40, calcY);

      ctx.font = 'bold 11px Inter, Arial, sans-serif';
      const calcLineY = calcY + 16;

      // Property 1
      ctx.fillStyle = propColors[0];
      ctx.fillText(`${propNames[0]}: (${propData[0].join(' + ')}) ÷ 6 = ${data.totalScores.p1}`, 40, calcLineY);

      // Property 2
      ctx.fillStyle = propColors[1];
      ctx.fillText(`${propNames[1]}: (${propData[1].join(' + ')}) ÷ 6 = ${data.totalScores.p2}`, 40, calcLineY + 14);

      // Property 3
      ctx.fillStyle = propColors[2];
      ctx.fillText(`${propNames[2]}: (${propData[2].join(' + ')}) ÷ 6 = ${data.totalScores.p3}`, 40, calcLineY + 28);
      ctx.restore();

      // CLUES-SMART SCORE LEGEND (h-119) - CENTERED
      ctx.save();
      const smartLegendY = h - 119;

      // Title on separate line above the tier boxes
      ctx.font = 'bold 13px Inter, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('CLUES-SMART SCORE TIERS:', w / 2, smartLegendY - 20);

      const tierSpacing = 114; // Increased by 4px for more space between tiers
      const totalTierWidth = tierSpacing * 4 + 100; // Approximate width of all 5 tiers
      const startX = (w - totalTierWidth) / 2;

      // Tier 1: Excellent (Green)
      ctx.fillStyle = '#4CAF50';
      ctx.fillRect(startX, smartLegendY - 12, 14, 14);
      ctx.font = 'bold 11px Inter, Arial, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'left';
      ctx.fillText('81-100 EXCELLENT', startX + 18, smartLegendY);

      // Tier 2: Good (Blue)
      ctx.fillStyle = '#2196F3';
      ctx.fillRect(startX + tierSpacing, smartLegendY - 12, 14, 14);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('61-80 GOOD', startX + tierSpacing + 18, smartLegendY);

      // Tier 3: Average (Amber)
      ctx.fillStyle = '#EAB308';
      ctx.fillRect(startX + tierSpacing * 2, smartLegendY - 12, 14, 14);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('41-60 AVERAGE', startX + tierSpacing * 2 + 18, smartLegendY);

      // Tier 4: Fair (Orange)
      ctx.fillStyle = '#FF9800';
      ctx.fillRect(startX + tierSpacing * 3, smartLegendY - 12, 14, 14);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('21-40 FAIR', startX + tierSpacing * 3 + 18, smartLegendY);

      // Tier 5: Poor (Red)
      ctx.fillStyle = '#FF4444';
      ctx.fillRect(startX + tierSpacing * 4, smartLegendY - 12, 14, 14);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('0-20 POOR', startX + tierSpacing * 4 + 18, smartLegendY);
      ctx.restore();

      // DETAILED EXPLANATION (h-89) - CENTERED
      ctx.save();
      const explanationY = h - 89;
      ctx.font = 'bold 13px Inter, Arial, sans-serif';
      ctx.fillStyle = '#00E5FF';
      ctx.textAlign = 'center';
      ctx.fillText('HOW TO READ THIS CHART:', w / 2, explanationY);

      ctx.font = 'bold 10px Inter, Arial, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      const lineSpacing = 14;
      let currentY = explanationY + 16;

      ctx.fillText('• RING COLOR (outer border) = Property identity (Green=Hillcrest, Purple=Oakwood, Pink=LiveOak)', w / 2, currentY);
      currentY += lineSpacing;

      ctx.fillText('• FILL COLOR (interior) = CLUES-SMART tier based on individual feature score (see color legend above)', w / 2, currentY);
      currentY += lineSpacing;

      ctx.fillText('• ICON = High-contrast widget showing feature type (automatically adjusted for maximum readability)', w / 2, currentY);
      currentY += lineSpacing;

      ctx.fillText('• TOTAL SCORE = Average of all 6 exterior features (Curb Appeal, Landscaping, Design, Deck, Pool, Fence)', w / 2, currentY);
      ctx.restore();

      animationId = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [data, paused1, winnerId, labelsFull]);

  // CHART 2: ORBITAL GRAVITY - Composite Score Analysis - IDENTICAL TO HTML
  useEffect(() => {
    const canvas = canvas2Ref.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;
    const ctx: CanvasRenderingContext2D = context;

    const resize = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = 700;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    let angle = 0;
    let animationId: number;

    function animate() {
      if (!paused2) angle += 0.008;
      const w = canvas!.width;
      const h = canvas!.height;
      ctx.clearRect(0, 0, w, h);

      // TITLE: CHART 7-2 (top left)
      ctx.save();
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 10px Share Tech Mono';
      ctx.textAlign = 'left';
      ctx.fillText('CHART 7-2', 20, 20);
      ctx.restore();

      // WINNER BADGE at top center
      const winnerScore = data.totalScores[winnerId];
      const winnerTier = getScoreTier(winnerScore);
      const winnerName = data.properties[winnerId].name;

      ctx.save();
      ctx.textAlign = 'center';
      ctx.fillStyle = winnerTier.color;
      ctx.strokeStyle = winnerTier.color;
      ctx.lineWidth = 2;

      const badgeY = 25;
      ctx.strokeRect(w/2 - 120, badgeY - 22.5, 240, 45);
      ctx.globalAlpha = 0.2;
      ctx.fillRect(w/2 - 120, badgeY - 22.5, 240, 45);
      ctx.globalAlpha = 1;

      ctx.font = 'bold 12px Share Tech Mono';
      ctx.fillText(`${winnerTier.emoji} WINNER`, w/2, badgeY);
      ctx.font = 'bold 16px Share Tech Mono';
      ctx.fillText(winnerName, w/2, badgeY + 14);
      ctx.restore();

      // BRAIN WIDGET in upper right with /100
      ctx.save();
      const brainX = w - 80;
      const brainY = 78;

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

      // ORBITAL GRAVITY VISUALIZATION
      // 3 property centers arranged horizontally
      const centerSpacing = w / 3;
      const centerY = h / 2;

      const propData = [
        { id: 'p1' as const, dataset: data.qualityScores.p1, color: data.properties.p1.color, name: data.properties.p1.name, total: data.totalScores.p1 },
        { id: 'p2' as const, dataset: data.qualityScores.p2, color: data.properties.p2.color, name: data.properties.p2.name, total: data.totalScores.p2 },
        { id: 'p3' as const, dataset: data.qualityScores.p3, color: data.properties.p3.color, name: data.properties.p3.name, total: data.totalScores.p3 }
      ];

      propData.forEach((prop, pIdx) => {
        const centerX = centerSpacing * (pIdx + 0.5);

        // Draw property center (gravity well) - SIZE PROPORTIONAL TO SCORE
        ctx.save();

        // Planet size based on score: higher score = bigger planet
        const planetSize = 25 + (prop.total * 0.25);

        ctx.beginPath();
        ctx.arc(centerX, centerY, planetSize, 0, Math.PI * 2);
        ctx.fillStyle = prop.color;
        ctx.globalAlpha = 0.8;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = prop.color;
        ctx.lineWidth = 3;
        ctx.stroke();

        // Property label at center - larger font
        ctx.fillStyle = '#000';
        ctx.font = 'bold 11px Share Tech Mono';
        ctx.textAlign = 'center';
        ctx.fillText(prop.name, centerX, centerY + 4);
        ctx.restore();

        // Property name and total above
        ctx.save();
        ctx.fillStyle = prop.color;
        ctx.font = 'bold 14px Share Tech Mono';
        ctx.textAlign = 'center';
        ctx.fillText(prop.name, centerX, 100);
        ctx.font = '12px Share Tech Mono';
        ctx.fillText(`TOTAL: ${prop.total}`, centerX, 120);
        ctx.restore();

        // Draw orbiting features
        prop.dataset.forEach((val, featureIdx) => {
          const tier = getScoreTier(val);
          const fillColor = tier.color;

          // Orbit radius: high scores orbit close, low scores orbit far
          const baseRadius = 180 - (val * 1.3);

          // Each feature has different orbital speed
          const orbitAngle = angle * (0.5 + featureIdx * 0.15) + (pIdx * Math.PI * 2 / 3);

          const x = centerX + Math.cos(orbitAngle) * baseRadius;
          const y = centerY + Math.sin(orbitAngle) * baseRadius;

          // Orb size proportional to score
          const orbSize = 5 + (val * 0.15);

          // Draw orb with two-color system
          ctx.save();

          // Fill with SMART tier color
          ctx.beginPath();
          ctx.arc(x, y, orbSize, 0, Math.PI * 2);
          ctx.fillStyle = fillColor;
          ctx.globalAlpha = 0.7;
          ctx.fill();
          ctx.globalAlpha = 1;

          // Ring with property color
          ctx.strokeStyle = prop.color;
          ctx.lineWidth = 2;
          ctx.stroke();

          // Feature label on rightmost property only
          if (pIdx === 2 && featureIdx === 0) {
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.font = '8px Share Tech Mono';
            ctx.textAlign = 'left';
            ctx.fillText(`${labels[featureIdx]}: ${val}`, x + orbSize + 5, y + 3);
          }

          ctx.restore();

          // Draw faint orbit path
          ctx.save();
          ctx.beginPath();
          ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
          ctx.strokeStyle = prop.color;
          ctx.globalAlpha = 0.1;
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.restore();
        });
      });

      // CALCULATION BREAKDOWN
      ctx.save();
      const calcY = h - 230;
      ctx.font = 'bold 9px Share Tech Mono';
      ctx.fillStyle = 'rgba(0, 243, 255, 0.9)';
      ctx.textAlign = 'left';
      ctx.fillText('TOTAL SCORE CALCULATION:', 40, calcY);

      ctx.font = '8px Share Tech Mono';
      const calcLineSpacing = 12;
      let calcCurrentY = calcY + 14;

      // Property 1 calculation
      ctx.fillStyle = data.properties.p1.color;
      ctx.fillText(`${data.properties.p1.name}: (${data.qualityScores.p1.join(' + ')}) ÷ 6 = ${data.totalScores.p1}`, 40, calcCurrentY);
      calcCurrentY += calcLineSpacing;

      // Property 2 calculation
      ctx.fillStyle = data.properties.p2.color;
      ctx.fillText(`${data.properties.p2.name}: (${data.qualityScores.p2.join(' + ')}) ÷ 6 = ${data.totalScores.p2}`, 40, calcCurrentY);
      calcCurrentY += calcLineSpacing;

      // Property 3 calculation
      ctx.fillStyle = data.properties.p3.color;
      ctx.fillText(`${data.properties.p3.name}: (${data.qualityScores.p3.join(' + ')}) ÷ 6 = ${data.totalScores.p3}`, 40, calcCurrentY);
      ctx.restore();

      // PROPERTY LEGEND - FULL addresses with wider spacing
      ctx.save();
      ctx.font = 'bold 13px Inter, Arial, sans-serif';
      ctx.textAlign = 'left';
      const propertyLegendY = h - 145;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('PROPERTIES:', 40, propertyLegendY);

      ctx.font = 'bold 12px Inter, Arial, sans-serif';
      ctx.fillStyle = data.properties.p1.color;
      ctx.fillText(`█ ${data.properties.p1.name}`, 150, propertyLegendY);
      ctx.fillStyle = data.properties.p2.color;
      ctx.fillText(`█ ${data.properties.p2.name}`, 150 + (w - 300) / 2, propertyLegendY);
      ctx.fillStyle = data.properties.p3.color;
      ctx.fillText(`█ ${data.properties.p3.name}`, w - 350, propertyLegendY);
      ctx.restore();

      // CLUES-SMART SCORE LEGEND
      ctx.save();
      const smartLegendY = h - 119;
      ctx.font = 'bold 10px Share Tech Mono';
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillText('CLUES-SMART SCORE TIERS:', 40, smartLegendY);

      const tierSpacing = 110;
      const startX = 230;

      // Tier 1: Excellent (Green)
      ctx.fillStyle = '#4CAF50';
      ctx.fillRect(startX, smartLegendY - 10, 12, 12);
      ctx.font = '9px Share Tech Mono';
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillText('81-100 EXCELLENT', startX + 16, smartLegendY);

      // Tier 2: Good (Blue)
      ctx.fillStyle = '#2196F3';
      ctx.fillRect(startX + tierSpacing, smartLegendY - 10, 12, 12);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillText('61-80 GOOD', startX + tierSpacing + 16, smartLegendY);

      // Tier 3: Average (Amber)
      ctx.fillStyle = '#EAB308';
      ctx.fillRect(startX + tierSpacing * 2, smartLegendY - 10, 12, 12);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillText('41-60 AVERAGE', startX + tierSpacing * 2 + 16, smartLegendY);

      // Tier 4: Fair (Orange)
      ctx.fillStyle = '#FF9800';
      ctx.fillRect(startX + tierSpacing * 3, smartLegendY - 10, 12, 12);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillText('21-40 FAIR', startX + tierSpacing * 3 + 16, smartLegendY);

      // Tier 5: Poor (Red)
      ctx.fillStyle = '#FF4444';
      ctx.fillRect(startX + tierSpacing * 4, smartLegendY - 10, 12, 12);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillText('0-20 POOR', startX + tierSpacing * 4 + 16, smartLegendY);
      ctx.restore();

      // DETAILED EXPLANATION
      ctx.save();
      const explanationY = h - 89;
      ctx.font = 'bold 9px Share Tech Mono';
      ctx.fillStyle = 'rgba(0, 243, 255, 0.9)';
      ctx.textAlign = 'left';
      ctx.fillText('HOW TO READ THIS CHART:', 40, explanationY);

      ctx.font = '8px Share Tech Mono';
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      const lineSpacing = 11;
      let currentY = explanationY + 12;

      ctx.fillText('• GRAVITY WELL (center dot) = Property identity. Planet size proportional to total score (bigger = higher score).', 40, currentY);
      currentY += lineSpacing;

      ctx.fillText('• ORBIT DISTANCE = Feature score (closer orbit = higher score, farther = lower score). High scores are "attracted" more.', 40, currentY);
      currentY += lineSpacing;

      ctx.fillText('• ORB COLORS: Ring = Property color, Fill = CLUES-SMART tier. Orb size = Score magnitude.', 40, currentY);
      currentY += lineSpacing;

      ctx.fillText('• CLUSTERING = Overall quality. Tight cluster around big planet = strong property, loose orbits around small planet = weak.', 40, currentY);

      ctx.restore();

      // EXAMPLE SUB-CALCULATION (centered in footer)
      ctx.save();
      const exampleY = h - 24;
      ctx.font = 'bold 9px Share Tech Mono';
      ctx.fillStyle = 'rgba(255, 215, 0, 0.9)';
      ctx.textAlign = 'center';
      ctx.fillText('EXAMPLE: HOW FEATURE SCORES ARE CALCULATED', w/2, exampleY);

      ctx.font = '8px Share Tech Mono';
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      const exLineSpacing = 11;
      let exCurrentY = exampleY + 12;

      ctx.fillText('Design Score (88) = (Architecture: 90 + Condition: 85 + Floor Plan: 90 + Integration: 87) ÷ 4 = 88', w/2, exCurrentY);
      exCurrentY += exLineSpacing;

      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '7px Share Tech Mono';
      ctx.fillText('In production: Each of the 6 exterior features shown is calculated from 3-5 underlying sub-factors with actual property data', w/2, exCurrentY);
      ctx.restore();

      animationId = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [data, paused2, winnerId, labels]);

  // CHART 3: ISO-LAYER STACK - Layered Factor Comparison - IDENTICAL TO HTML
  useEffect(() => {
    const canvas = canvas3Ref.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;
    const ctx: CanvasRenderingContext2D = context;

    const resize = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = 700;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    let time = 0;
    let animationId: number;

    // Isometric projection function
    function iso(x: number, y: number, z: number) {
      const w = canvas!.width;
      const h = canvas!.height;
      return {
        x: (x - y) * Math.cos(0.5236) + w/2,
        y: (x + y) * Math.sin(0.5236) - z + h/2
      };
    }

    function animate() {
      if (!paused3) time += 0.02;
      const w = canvas!.width;
      const h = canvas!.height;
      ctx.clearRect(0, 0, w, h);

      // TITLE: CHART 7-3 (top left)
      ctx.save();
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 10px Share Tech Mono';
      ctx.textAlign = 'left';
      ctx.fillText('CHART 7-3', 20, 20);
      ctx.restore();

      // WINNER BADGE at top center
      const winnerScore = data.totalScores[winnerId];
      const winnerTier = getScoreTier(winnerScore);
      const winnerName = data.properties[winnerId].name;

      ctx.save();
      ctx.textAlign = 'center';
      ctx.fillStyle = winnerTier.color;
      ctx.strokeStyle = winnerTier.color;
      ctx.lineWidth = 2;

      const badgeY = 25;
      ctx.strokeRect(w/2 - 120, badgeY - 22.5, 240, 45);
      ctx.globalAlpha = 0.2;
      ctx.fillRect(w/2 - 120, badgeY - 22.5, 240, 45);
      ctx.globalAlpha = 1;

      ctx.font = 'bold 12px Share Tech Mono';
      ctx.fillText(`${winnerTier.emoji} WINNER`, w/2, badgeY);
      ctx.font = 'bold 16px Share Tech Mono';
      ctx.fillText(winnerName, w/2, badgeY + 14);
      ctx.restore();

      // BRAIN WIDGET in upper right with /100
      ctx.save();
      const brainX = w - 80;
      const brainY = 78;

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

      // Floating animation
      const float = Math.sin(time) * 8;

      // Draw 3 layered stacks (one per property)
      const columnWidth = w / 3;

      // Calculate rankings for plate sizing
      const propertyRanks = [
        { id: 'p1' as const, score: data.totalScores.p1, index: 0 },
        { id: 'p2' as const, score: data.totalScores.p2, index: 1 },
        { id: 'p3' as const, score: data.totalScores.p3, index: 2 }
      ].sort((a, b) => b.score - a.score);

      const plateSizes: Record<string, number> = {};
      plateSizes[propertyRanks[0].id] = 70;  // Winner - largest
      plateSizes[propertyRanks[1].id] = 60;  // Runner-up - medium
      plateSizes[propertyRanks[2].id] = 50;  // Third - smallest

      const propData = [
        { id: 'p1' as const, dataset: data.qualityScores.p1, color: data.properties.p1.color, name: data.properties.p1.name, total: data.totalScores.p1 },
        { id: 'p2' as const, dataset: data.qualityScores.p2, color: data.properties.p2.color, name: data.properties.p2.name, total: data.totalScores.p2 },
        { id: 'p3' as const, dataset: data.qualityScores.p3, color: data.properties.p3.color, name: data.properties.p3.name, total: data.totalScores.p3 }
      ];

      propData.forEach((prop, pIdx) => {
        const baseX = columnWidth * pIdx - w/2 + columnWidth/2;

        // Stack height offset based on score (higher score = higher base position)
        const heightOffset = (prop.total - 30) * 1.5 - 144;

        // Property name and total score above stack
        ctx.save();
        ctx.fillStyle = prop.color;
        ctx.font = 'bold 14px Share Tech Mono';
        ctx.textAlign = 'center';

        // Move HILLCREST and LIVEOAK up 0.5 inches (48px), keep OAKWOOD at lower height
        const nameY = (pIdx === 0 || pIdx === 2) ? 90 : 138;
        const totalY = (pIdx === 0 || pIdx === 2) ? 110 : 158;

        ctx.fillText(prop.name, columnWidth * (pIdx + 0.5), nameY);

        ctx.font = '12px Share Tech Mono';
        ctx.fillText(`TOTAL: ${prop.total}`, columnWidth * (pIdx + 0.5), totalY);
        ctx.restore();

        // Draw layers from bottom (Fence) to top (Curb Appeal)
        const layersReversed = labels.slice().reverse();  // Reverse so bottom layer is first
        const valsReversed = prop.dataset.slice().reverse();
        const plateSize = plateSizes[prop.id];  // Get size based on ranking

        layersReversed.forEach((label, i) => {
          const z = i * 40 + float + heightOffset;  // Add height offset based on score
          const size = plateSize;  // Use ranking-based plate size
          const val = valsReversed[i];
          const tier = getScoreTier(val);
          const fillColor = tier.color;

          // Calculate 4 corners of isometric plate
          const p1 = iso(baseX - size, -size, z);
          const p2 = iso(baseX + size, -size, z);
          const p3 = iso(baseX + size, size, z);
          const p4 = iso(baseX - size, size, z);

          // Draw filled plate with SMART tier color
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.lineTo(p3.x, p3.y);
          ctx.lineTo(p4.x, p4.y);
          ctx.closePath();

          ctx.fillStyle = fillColor;
          ctx.globalAlpha = 0.6;
          ctx.fill();
          ctx.globalAlpha = 1;

          // Draw rim with property color
          ctx.strokeStyle = prop.color;
          ctx.lineWidth = 2;
          ctx.stroke();

          // Label with feature name and score (only on rightmost stack)
          // Labels float parallel to plate edge at p2 corner
          if (pIdx === 2) {
            ctx.fillStyle = '#fff';
            ctx.font = '9px Share Tech Mono';
            ctx.textAlign = 'left';
            ctx.fillText(`${label}: ${val}`, p2.x + 10, p2.y);
          }
        });
      });

      // CALCULATION BREAKDOWN - Show how totals were derived
      ctx.save();
      const calcY = h - 230;  // Position above property legend
      ctx.font = 'bold 9px Share Tech Mono';
      ctx.fillStyle = 'rgba(0, 243, 255, 0.9)';
      ctx.textAlign = 'left';
      ctx.fillText('TOTAL SCORE CALCULATION:', 40, calcY);

      ctx.font = '8px Share Tech Mono';
      const calcLineSpacing = 12;
      let calcCurrentY = calcY + 14;

      // Property 1 calculation
      ctx.fillStyle = data.properties.p1.color;
      const p1Vals = data.qualityScores.p1.join(' + ');
      ctx.fillText(`${data.properties.p1.name}: (${p1Vals}) ÷ 6 = ${data.totalScores.p1}`, 40, calcCurrentY);
      calcCurrentY += calcLineSpacing;

      // Property 2 calculation
      ctx.fillStyle = data.properties.p2.color;
      const p2Vals = data.qualityScores.p2.join(' + ');
      ctx.fillText(`${data.properties.p2.name}: (${p2Vals}) ÷ 6 = ${data.totalScores.p2}`, 40, calcCurrentY);
      calcCurrentY += calcLineSpacing;

      // Property 3 calculation
      ctx.fillStyle = data.properties.p3.color;
      const p3Vals = data.qualityScores.p3.join(' + ');
      ctx.fillText(`${data.properties.p3.name}: (${p3Vals}) ÷ 6 = ${data.totalScores.p3}`, 40, calcCurrentY);
      ctx.restore();

      // EXAMPLE SUB-CALCULATION (centered in footer)
      ctx.save();
      const exampleY = h - 24;
      ctx.font = 'bold 9px Share Tech Mono';
      ctx.fillStyle = 'rgba(255, 215, 0, 0.9)';
      ctx.textAlign = 'center';
      ctx.fillText('EXAMPLE: HOW FEATURE SCORES ARE CALCULATED', w/2, exampleY);

      ctx.font = '8px Share Tech Mono';
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      const exLineSpacing = 11;
      let exCurrentY = exampleY + 12;

      ctx.fillText('Design Score (88) = (Architecture: 90 + Condition: 85 + Floor Plan: 90 + Integration: 87) ÷ 4 = 88', w/2, exCurrentY);
      exCurrentY += exLineSpacing;

      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '7px Share Tech Mono';
      ctx.fillText('In production: Each of the 6 exterior features shown is calculated from 3-5 underlying sub-factors with actual property data', w/2, exCurrentY);
      ctx.restore();

      // PROPERTY LEGEND - FULL addresses with wider spacing
      ctx.save();
      ctx.font = 'bold 13px Inter, Arial, sans-serif';
      ctx.textAlign = 'left';
      const propertyLegendY = h - 145;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('PROPERTIES:', 40, propertyLegendY);

      ctx.font = 'bold 12px Inter, Arial, sans-serif';
      ctx.fillStyle = data.properties.p1.color;
      ctx.fillText(`█ ${data.properties.p1.name}`, 150, propertyLegendY);
      ctx.fillStyle = data.properties.p2.color;
      ctx.fillText(`█ ${data.properties.p2.name}`, 150 + (w - 300) / 2, propertyLegendY);
      ctx.fillStyle = data.properties.p3.color;
      ctx.fillText(`█ ${data.properties.p3.name}`, w - 350, propertyLegendY);
      ctx.restore();

      // CLUES-SMART SCORE LEGEND
      ctx.save();
      const smartLegendY = h - 119;
      ctx.font = 'bold 10px Share Tech Mono';
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillText('CLUES-SMART SCORE TIERS:', 40, smartLegendY);

      const tierSpacing = 110;
      const startX = 230;

      // Tier 1: Excellent (Green)
      ctx.fillStyle = '#4CAF50';
      ctx.fillRect(startX, smartLegendY - 10, 12, 12);
      ctx.font = '9px Share Tech Mono';
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillText('81-100 EXCELLENT', startX + 16, smartLegendY);

      // Tier 2: Good (Blue)
      ctx.fillStyle = '#2196F3';
      ctx.fillRect(startX + tierSpacing, smartLegendY - 10, 12, 12);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillText('61-80 GOOD', startX + tierSpacing + 16, smartLegendY);

      // Tier 3: Average (Amber)
      ctx.fillStyle = '#EAB308';
      ctx.fillRect(startX + tierSpacing * 2, smartLegendY - 10, 12, 12);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillText('41-60 AVERAGE', startX + tierSpacing * 2 + 16, smartLegendY);

      // Tier 4: Fair (Orange)
      ctx.fillStyle = '#FF9800';
      ctx.fillRect(startX + tierSpacing * 3, smartLegendY - 10, 12, 12);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillText('21-40 FAIR', startX + tierSpacing * 3 + 16, smartLegendY);

      // Tier 5: Poor (Red)
      ctx.fillStyle = '#FF4444';
      ctx.fillRect(startX + tierSpacing * 4, smartLegendY - 10, 12, 12);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillText('0-20 POOR', startX + tierSpacing * 4 + 16, smartLegendY);
      ctx.restore();

      // DETAILED EXPLANATION
      ctx.save();
      const explanationY = h - 89;
      ctx.font = 'bold 9px Share Tech Mono';
      ctx.fillStyle = 'rgba(0, 243, 255, 0.9)';
      ctx.textAlign = 'left';
      ctx.fillText('HOW TO READ THIS CHART:', 40, explanationY);

      ctx.font = '8px Share Tech Mono';
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      const lineSpacing = 11;
      let currentY = explanationY + 12;

      ctx.fillText(`• RIM COLOR (outer border) = Property identity (Green=${data.properties.p1.name}, Purple=${data.properties.p2.name}, Pink=${data.properties.p3.name})`, 40, currentY);
      currentY += lineSpacing;

      ctx.fillText('• FILL COLOR (interior) = CLUES-SMART tier based on individual feature score (see color legend above)', 40, currentY);
      currentY += lineSpacing;

      ctx.fillText('• STACK HEIGHT = Total property score (higher score = taller stack). PLATE SIZE = Ranking (1st=largest, 2nd=medium, 3rd=smallest)', 40, currentY);
      currentY += lineSpacing;

      ctx.fillText('• LAYER POSITION = Feature type (bottom=Fence, top=Curb Appeal). Amenity labels float parallel to plate edges.', 40, currentY);

      ctx.restore();

      animationId = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [data, paused3, labels, winnerId]);

  // CHART 6: AMENITY RADIAL - Binary Features (Redesigned) - IDENTICAL TO HTML
  useEffect(() => {
    const canvas = canvas6Ref.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;
    const ctx: CanvasRenderingContext2D = context;

    const resize = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = 700;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    let rot1 = 0, rot2 = 0, rot3 = 0; // Separate rotation for each ring
    let animationId: number;

    // Find winner by amenity count
    const amenityCounts = {
      p1: data.amenityCounts.p1,
      p2: data.amenityCounts.p2,
      p3: data.amenityCounts.p3
    };
    const amenityPercentages = {
      p1: Math.round((data.amenityCounts.p1 / 8) * 100),
      p2: Math.round((data.amenityCounts.p2 / 8) * 100),
      p3: Math.round((data.amenityCounts.p3 / 8) * 100)
    };
    const amenityWinnerId = (Object.entries(amenityCounts).sort((a, b) => b[1] - a[1])[0][0]) as 'p1' | 'p2' | 'p3';
    const winnerCount = amenityCounts[amenityWinnerId];
    const winnerPct = amenityPercentages[amenityWinnerId];

    function animate() {
      if (!paused6) {
        // Different rotation speeds: faster for inner (more amenities), slower for outer (fewer)
        // All speeds reduced by 50% for smoother viewing
        rot1 -= 0.01;   // Fastest - inner ring
        rot2 -= 0.0075; // Medium - middle ring
        rot3 -= 0.005;  // Slowest - outer ring
      }
      const w = canvas!.width;
      const h = canvas!.height;
      ctx.clearRect(0, 0, w, h);
      const cx = w/2, cy = h/2;

      // CHART TITLE - Top left, gold
      ctx.fillStyle = '#d4af37';
      ctx.font = 'bold 10px Share Tech Mono';
      ctx.textAlign = 'left';
      ctx.fillText('CHART 7-6', 20, 47);

      // WINNER BADGE - Top left below CHART 7-6
      ctx.save();
      ctx.textAlign = 'left';
      ctx.fillStyle = data.properties[amenityWinnerId].color;
      ctx.strokeStyle = data.properties[amenityWinnerId].color;
      ctx.lineWidth = 2;

      const badgeX = 20;
      const badgeY = 70;
      ctx.strokeRect(badgeX, badgeY - 22.5, 240, 45);
      ctx.globalAlpha = 0.2;
      ctx.fillRect(badgeX, badgeY - 22.5, 240, 45);
      ctx.globalAlpha = 1;

      ctx.font = 'bold 12px Share Tech Mono';
      ctx.textAlign = 'center';
      ctx.fillText('🏆 WINNER', badgeX + 120, badgeY);
      ctx.font = 'bold 16px Share Tech Mono';
      ctx.fillText(data.properties[amenityWinnerId].name, badgeX + 120, badgeY + 14);
      ctx.restore();

      // BRAIN WIDGET - Upper right with amenity percentage
      ctx.save();
      const brainX = w - 80;
      const brainY = 78;

      ctx.strokeStyle = data.properties[amenityWinnerId].color;
      ctx.fillStyle = data.properties[amenityWinnerId].color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(brainX, brainY, 20, 0, Math.PI * 2);
      ctx.globalAlpha = 0.2;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.stroke();

      ctx.fillStyle = data.properties[amenityWinnerId].color;
      ctx.font = 'bold 16px Share Tech Mono';
      ctx.textAlign = 'center';
      ctx.fillText(String(winnerPct), brainX, brainY + 5);

      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.font = 'bold 9px Share Tech Mono';
      ctx.textAlign = 'left';
      ctx.fillText('/100', brainX + 26, brainY - 5);
      ctx.font = 'bold 8px Share Tech Mono';
      ctx.fillText('SMART', brainX + 21, brainY + 10);
      ctx.restore();

      // SUBTITLE - below winner badge
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.font = '11px Share Tech Mono';
      ctx.textAlign = 'center';
      ctx.fillText('AMENITY OWNERSHIP COMPARISON', w/2, 144);

      // Draw radial segments - Sort properties by amenity count
      // More amenities = inner ring (closer) + faster rotation
      // Fewer amenities = outer ring (farther) + slower rotation
      const propertyData = [
        { id: 'p1' as const, data: data.amenities.p1, count: data.amenityCounts.p1, color: data.properties.p1.color },
        { id: 'p2' as const, data: data.amenities.p2, count: data.amenityCounts.p2, color: data.properties.p2.color },
        { id: 'p3' as const, data: data.amenities.p3, count: data.amenityCounts.p3, color: data.properties.p3.color }
      ].sort((a, b) => b.count - a.count); // Sort descending by amenity count

      const rotations = [rot1, rot2, rot3]; // Fastest to slowest

      propertyData.forEach((prop, ringIdx) => {
        const d = prop.data;
        const col = prop.color;
        const baseR = 100 + (ringIdx * 50); // Rings at 100, 150, 200 (inner to outer)
        const rotation = rotations[ringIdx];

        for (let i = 0; i < 8; i++) {
          const startA = (i * (Math.PI*2/8)) + rotation;
          const endA = startA + (Math.PI*2/8) - 0.08;
          const hasAmenity = d[i];

          if (hasAmenity === 1) {
            // FILLED segment - property HAS this amenity
            ctx.beginPath();
            ctx.arc(cx, cy, baseR, startA, endA);
            ctx.strokeStyle = col;
            ctx.lineWidth = 30;
            ctx.lineCap = 'butt';
            ctx.stroke();

            // Glow effect
            ctx.shadowBlur = 8;
            ctx.shadowColor = col;
            ctx.stroke();
            ctx.shadowBlur = 0;
          } else {
            // EMPTY segment - property LACKS this amenity
            ctx.beginPath();
            ctx.arc(cx, cy, baseR, startA, endA);
            ctx.strokeStyle = col;
            ctx.lineWidth = 2;
            ctx.lineCap = 'butt';
            ctx.globalAlpha = 0.2;
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
      });

      // Draw amenity labels around outer ring (rotating with fastest inner ring)
      ctx.save();
      ctx.font = 'bold 9px Share Tech Mono';
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 8; i++) {
        const angle = (i * (Math.PI*2/8)) + rot1 + (Math.PI*2/16); // Center of segment, using fastest rotation
        const labelR = 260;
        const x = cx + Math.cos(angle) * labelR;
        const y = cy + Math.sin(angle) * labelR;

        ctx.textAlign = 'center';
        ctx.fillText(data.amenities.labels[i], x, y);
      }
      ctx.restore();

      // AMENITY OWNERSHIP COUNT
      ctx.save();
      ctx.fillStyle = '#d4af37';
      ctx.font = 'bold 11px Share Tech Mono';
      ctx.textAlign = 'left';
      ctx.fillText('AMENITY OWNERSHIP COUNT (Out of 8 Total Amenities)', 40, h - 212);

      ctx.font = '10px Share Tech Mono';
      ctx.fillStyle = data.properties.p1.color;
      ctx.fillText(`${data.properties.p1.name}: ${amenityCounts.p1} amenities owned ÷ 8 total = ${amenityPercentages.p1}% ownership`, 40, h - 197);
      ctx.fillStyle = data.properties.p2.color;
      ctx.fillText(`${data.properties.p2.name}: ${amenityCounts.p2} amenities owned ÷ 8 total = ${amenityPercentages.p2}% ownership`, 40, h - 182);
      ctx.fillStyle = data.properties.p3.color;
      ctx.fillText(`${data.properties.p3.name}: ${amenityCounts.p3} amenities owned ÷ 8 total = ${amenityPercentages.p3}% ownership`, 40, h - 167);
      ctx.restore();

      // PROPERTY LEGEND - FULL addresses with wider spacing
      ctx.save();
      ctx.font = 'bold 13px Inter, Arial, sans-serif';
      ctx.textAlign = 'left';
      const propertyLegendY = h - 145;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('PROPERTIES:', 40, propertyLegendY);

      ctx.font = 'bold 12px Inter, Arial, sans-serif';
      ctx.fillStyle = data.properties.p1.color;
      ctx.fillText(`█ ${data.properties.p1.name}`, 150, propertyLegendY);
      ctx.fillStyle = data.properties.p2.color;
      ctx.fillText(`█ ${data.properties.p2.name}`, 150 + (w - 300) / 2, propertyLegendY);
      ctx.fillStyle = data.properties.p3.color;
      ctx.fillText(`█ ${data.properties.p3.name}`, w - 350, propertyLegendY);
      ctx.restore();

      // AMENITY STATUS LEGEND
      ctx.save();
      ctx.font = '10px Share Tech Mono';
      ctx.textAlign = 'left';
      const statusX = 40;

      // Solid segment example
      ctx.strokeStyle = '#4CAF50';
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.moveTo(statusX, h - 119);
      ctx.lineTo(statusX + 20, h - 119);
      ctx.stroke();
      ctx.shadowBlur = 4;
      ctx.shadowColor = '#4CAF50';
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillText('HAS AMENITY', statusX + 25, h - 115);

      // Empty segment example
      ctx.strokeStyle = '#FF9800';
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.2;
      ctx.beginPath();
      ctx.moveTo(statusX + 140, h - 119);
      ctx.lineTo(statusX + 160, h - 119);
      ctx.stroke();
      ctx.globalAlpha = 1;

      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillText('LACKS AMENITY', statusX + 165, h - 115);
      ctx.restore();

      // EXPLANATION
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '9px Share Tech Mono';
      ctx.textAlign = 'left';
      const explainX = w - 520;
      ctx.fillText('• Inner ring = most amenities + fastest rotation, outer ring = fewest amenities + slowest', explainX, h - 89);
      ctx.fillText('• Solid thick segments show amenities the property HAS', explainX, h - 78);
      ctx.fillText('• Thin transparent segments show amenities the property LACKS', explainX, h - 67);
      ctx.fillText('• Ring speed reflects completeness: more complete package = tighter orbit + faster spin', explainX, h - 56);
      ctx.restore();

      // EXAMPLE SUB-CALCULATION
      ctx.save();
      ctx.fillStyle = '#d4af37';
      ctx.font = 'bold 9px Share Tech Mono';
      ctx.textAlign = 'center';
      ctx.fillText('EXAMPLE AMENITY CALCULATION', w/2, h - 24);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '9px Share Tech Mono';
      ctx.fillText(`${data.properties.p1.name} % = (${amenityCounts.p1} amenities owned ÷ 8 total amenities) × 100 = ${amenityPercentages.p1}%`, w/2, h - 12);
      ctx.restore();

      animationId = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [data, paused6]);

  // CHART 9: CONNECTION WEB - IDENTICAL TO HTML
  useEffect(() => {
    const canvas = canvas9Ref.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;
    const ctx: CanvasRenderingContext2D = context;

    const resize = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = 700;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    let pulse = 0;
    let animationId: number;

    // Find winner by amenity count
    const amenityCounts = {
      p1: data.amenityCounts.p1,
      p2: data.amenityCounts.p2,
      p3: data.amenityCounts.p3
    };
    const amenityPercentages = {
      p1: Math.round((data.amenityCounts.p1 / 8) * 100),
      p2: Math.round((data.amenityCounts.p2 / 8) * 100),
      p3: Math.round((data.amenityCounts.p3 / 8) * 100)
    };
    const amenityWinnerId = (Object.entries(amenityCounts).sort((a, b) => b[1] - a[1])[0][0]) as 'p1' | 'p2' | 'p3';
    const winnerCount = amenityCounts[amenityWinnerId];
    const winnerPct = amenityPercentages[amenityWinnerId];

    function animate() {
      if (!paused9) pulse += 0.03;
      const w = canvas!.width;
      const h = canvas!.height;
      ctx.clearRect(0, 0, w, h);

      // CHART TITLE - Top left, gold
      ctx.fillStyle = '#d4af37';
      ctx.font = 'bold 10px Share Tech Mono';
      ctx.textAlign = 'left';
      ctx.fillText('CHART 7-9', 20, 47);

      // WINNER BADGE - Top left below CHART 7-9
      ctx.save();
      ctx.textAlign = 'left';
      ctx.fillStyle = data.properties[amenityWinnerId].color;
      ctx.strokeStyle = data.properties[amenityWinnerId].color;
      ctx.lineWidth = 2;

      const badgeX = 20;
      const badgeY = 70;
      ctx.strokeRect(badgeX, badgeY - 22.5, 240, 45);
      ctx.globalAlpha = 0.2;
      ctx.fillRect(badgeX, badgeY - 22.5, 240, 45);
      ctx.globalAlpha = 1;

      ctx.font = 'bold 12px Share Tech Mono';
      ctx.textAlign = 'center';
      ctx.fillText('🏆 WINNER', badgeX + 120, badgeY);
      ctx.font = 'bold 16px Share Tech Mono';
      ctx.fillText(data.properties[amenityWinnerId].name, badgeX + 120, badgeY + 14);
      ctx.restore();

      // BRAIN WIDGET - Upper right with connection count
      ctx.save();
      const brainX = w - 80;
      const brainY = 78;

      ctx.strokeStyle = data.properties[amenityWinnerId].color;
      ctx.fillStyle = data.properties[amenityWinnerId].color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(brainX, brainY, 20, 0, Math.PI * 2);
      ctx.globalAlpha = 0.2;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.stroke();

      ctx.fillStyle = data.properties[amenityWinnerId].color;
      ctx.font = 'bold 16px Share Tech Mono';
      ctx.textAlign = 'center';
      ctx.fillText(String(winnerPct), brainX, brainY + 5);

      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.font = 'bold 9px Share Tech Mono';
      ctx.textAlign = 'left';
      ctx.fillText('/100', brainX + 26, brainY - 5);
      ctx.font = 'bold 8px Share Tech Mono';
      ctx.fillText('SMART', brainX + 21, brainY + 10);
      ctx.restore();

      // SUBTITLE - below winner badge
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.font = '11px Share Tech Mono';
      ctx.textAlign = 'center';
      ctx.fillText('AMENITY CONNECTION WEB', w/2, 117);

      // Draw 3 property clusters horizontally
      const baseCY = h/2 + 7;
      const clusterSpacing = 300;
      const circleRadius = 80;

      // Calculate winner and loser for vertical positioning
      const propIds = ['p1', 'p2', 'p3'] as const;
      const counts = propIds.map(id => amenityCounts[id]);
      const maxCount = Math.max(...counts);
      const minCount = Math.min(...counts);

      const propDataForClusters = [
        { id: 'p1' as const, amenities: data.amenities.p1, color: data.properties.p1.color, name: data.properties.p1.name },
        { id: 'p2' as const, amenities: data.amenities.p2, color: data.properties.p2.color, name: data.properties.p2.name },
        { id: 'p3' as const, amenities: data.amenities.p3, color: data.properties.p3.color, name: data.properties.p3.name }
      ];

      propDataForClusters.forEach((d, pIdx) => {
        const col = d.color;
        const cx = (w/4) + (pIdx * clusterSpacing) - 77;

        // Dynamic Y position: winner UP, loser DOWN
        const propCount = amenityCounts[d.id];
        let cyOffset = 0;
        if (propCount === maxCount && maxCount !== minCount) {
          cyOffset = -25;  // Winner floats UP
        } else if (propCount === minCount && maxCount !== minCount) {
          cyOffset = 20;   // Loser sinks DOWN
        }
        const cy = baseCY + cyOffset;

        // Calculate which amenities this property has
        const hasAmenities = [];
        for (let i = 0; i < 8; i++) {
          if (d.amenities[i] === 1) {
            hasAmenities.push(i);
          }
        }

        // Draw property name above
        ctx.save();
        ctx.fillStyle = col;
        ctx.font = 'bold 12px Share Tech Mono';
        ctx.textAlign = 'center';
        ctx.fillText(d.name, cx, cy - circleRadius - 51);
        ctx.font = '10px Share Tech Mono';
        ctx.fillText(`${amenityCounts[d.id]}/8`, cx, cy - circleRadius - 39);
        ctx.restore();

        // Draw connection lines ONLY between amenities the property HAS
        ctx.save();
        ctx.strokeStyle = col;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.4 + (Math.sin(pulse) * 0.2);

        for (let i = 0; i < hasAmenities.length; i++) {
          for (let j = i+1; j < hasAmenities.length; j++) {
            const idx1 = hasAmenities[i];
            const idx2 = hasAmenities[j];

            const angle1 = (idx1 / 8) * Math.PI * 2 - Math.PI/2;
            const angle2 = (idx2 / 8) * Math.PI * 2 - Math.PI/2;

            const x1 = cx + Math.cos(angle1) * circleRadius;
            const y1 = cy + Math.sin(angle1) * circleRadius;
            const x2 = cx + Math.cos(angle2) * circleRadius;
            const y2 = cy + Math.sin(angle2) * circleRadius;

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
          }
        }
        ctx.restore();

        // Draw amenity points around circle
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2 - Math.PI/2;
          const x = cx + Math.cos(angle) * circleRadius;
          const y = cy + Math.sin(angle) * circleRadius;

          ctx.beginPath();
          if (d.amenities[i] === 1) {
            // Property HAS this amenity - filled glowing dot with INTENSE glow
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fillStyle = col;
            ctx.fill();
            ctx.shadowBlur = 20;
            ctx.shadowColor = col;
            ctx.fill();
            // Second glow layer for extra intensity
            ctx.shadowBlur = 12;
            ctx.fill();
            ctx.shadowBlur = 0;
          } else {
            // Property LACKS this amenity - empty dot
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.strokeStyle = col;
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.2;
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }

        // Draw amenity labels around circle (on ALL clusters now, BOLD)
        ctx.save();
        ctx.font = 'bold 9px Share Tech Mono';
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2 - Math.PI/2;
          const labelR = circleRadius + 25;
          const x = cx + Math.cos(angle) * labelR;
          const y = cy + Math.sin(angle) * labelR;

          ctx.textAlign = 'center';
          ctx.fillText(data.amenities.labels[i], x, y + 3);
        }
        ctx.restore();
      });

      // CONNECTION COUNT CALCULATION
      ctx.save();
      ctx.fillStyle = '#d4af37';
      ctx.font = 'bold 11px Share Tech Mono';
      ctx.textAlign = 'left';
      ctx.fillText('CONNECTION COUNT CALCULATION', 40, h - 230);

      // Calculate connection counts (n choose 2 = n*(n-1)/2)
      const connections = {
        p1: (amenityCounts.p1 * (amenityCounts.p1 - 1)) / 2,
        p2: (amenityCounts.p2 * (amenityCounts.p2 - 1)) / 2,
        p3: (amenityCounts.p3 * (amenityCounts.p3 - 1)) / 2
      };

      ctx.font = '10px Share Tech Mono';
      ctx.fillStyle = data.properties.p1.color;
      ctx.fillText(`${data.properties.p1.name}: ${amenityCounts.p1} amenities = ${connections.p1} connections`, 40, h - 215);
      ctx.fillStyle = data.properties.p2.color;
      ctx.fillText(`${data.properties.p2.name}: ${amenityCounts.p2} amenities = ${connections.p2} connections`, 40, h - 200);
      ctx.fillStyle = data.properties.p3.color;
      ctx.fillText(`${data.properties.p3.name}: ${amenityCounts.p3} amenities = ${connections.p3} connections`, 40, h - 185);
      ctx.restore();

      // SMART SCORE CALCULATION
      ctx.save();
      ctx.fillStyle = '#d4af37';
      ctx.font = 'bold 11px Share Tech Mono';
      ctx.textAlign = 'left';
      ctx.fillText('SMART SCORE CALCULATION (Out of 8 Total Amenities)', 40, h - 160);

      ctx.font = '10px Share Tech Mono';
      ctx.fillStyle = data.properties.p1.color;
      ctx.fillText(`${data.properties.p1.name}: ${amenityCounts.p1} amenities ÷ 8 total = ${amenityPercentages.p1}% SMART Score`, 40, h - 145);
      ctx.fillStyle = data.properties.p2.color;
      ctx.fillText(`${data.properties.p2.name}: ${amenityCounts.p2} amenities ÷ 8 total = ${amenityPercentages.p2}% SMART Score`, 40, h - 130);
      ctx.fillStyle = data.properties.p3.color;
      ctx.fillText(`${data.properties.p3.name}: ${amenityCounts.p3} amenities ÷ 8 total = ${amenityPercentages.p3}% SMART Score`, 40, h - 115);
      ctx.restore();

      // PROPERTY LEGEND - FULL addresses with wider spacing
      ctx.save();
      ctx.font = 'bold 13px Inter, Arial, sans-serif';
      ctx.textAlign = 'left';
      const propertyLegendY = h - 95;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('PROPERTIES:', 40, propertyLegendY);

      ctx.font = 'bold 12px Inter, Arial, sans-serif';
      ctx.fillStyle = data.properties.p1.color;
      ctx.fillText(`█ ${data.properties.p1.name}`, 150, propertyLegendY);
      ctx.fillStyle = data.properties.p2.color;
      ctx.fillText(`█ ${data.properties.p2.name}`, 150 + (w - 300) / 2, propertyLegendY);
      ctx.fillStyle = data.properties.p3.color;
      ctx.fillText(`█ ${data.properties.p3.name}`, w - 350, propertyLegendY);
      ctx.restore();

      // DOT STATUS LEGEND
      ctx.save();
      ctx.font = '10px Share Tech Mono';
      ctx.textAlign = 'left';
      const statusX = 40;

      // Filled dot example
      ctx.beginPath();
      ctx.arc(statusX + 5, h - 69, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#4CAF50';
      ctx.fill();
      ctx.shadowBlur = 6;
      ctx.shadowColor = '#4CAF50';
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillText('HAS AMENITY', statusX + 15, h - 65);

      // Empty dot example
      ctx.beginPath();
      ctx.arc(statusX + 145, h - 69, 3, 0, Math.PI * 2);
      ctx.strokeStyle = '#FF9800';
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.2;
      ctx.stroke();
      ctx.globalAlpha = 1;

      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillText('LACKS AMENITY', statusX + 155, h - 65);
      ctx.restore();

      // EXPLANATION
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '9px Share Tech Mono';
      ctx.textAlign = 'left';
      ctx.fillText('• Each cluster = one property with 8 amenity positions arranged in circle', 40, h - 39);
      ctx.fillText('• Lines connect ONLY amenities the property owns (more lines = more complete package)', 40, h - 28);
      ctx.fillText('• Dense web pattern = comprehensive amenity coverage, sparse pattern = limited amenities', 40, h - 17);
      ctx.fillText('• Pulsing effect highlights connection strength and network completeness', 40, h - 6);
      ctx.restore();

      animationId = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [data, paused9]);

  return (
    <div className="space-y-8">
      {/* Chart 1: Helix */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 backdrop-blur-xl border border-white/10 overflow-hidden"
      >
        <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
          <span className="text-xs font-mono text-gray-500">Chart 7-1</span>
          <button
            onClick={() => setPaused1(!paused1)}
            className="px-3 py-1 rounded bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/30 transition-all text-xs font-mono"
          >
            {paused1 ? '▶ Play' : '⏸ Pause'}
          </button>
        </div>
        <div className="pt-16 pb-2 text-center">
          <h3 className="text-base font-bold text-white font-mono tracking-wider">HELIX ANALYSIS</h3>
          <p className="text-xs text-gray-400 font-mono mt-1">6 Exterior Quality Factors • Rotating DNA Structure</p>
        </div>
        <canvas ref={canvas1Ref} className="w-full" style={{ display: 'block' }} />
      </motion.div>

      {/* Chart 2: Orbital Gravity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 backdrop-blur-xl border border-white/10 overflow-hidden"
      >
        <div className="absolute top-4 right-4 z-10 flex items-center gap-3">
          <button
            onClick={() => setPaused2(!paused2)}
            className="px-3 py-1 rounded bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/30 transition-all text-xs font-mono"
          >
            {paused2 ? '▶ Play' : '⏸ Pause'}
          </button>
        </div>
        <canvas ref={canvas2Ref} className="w-full" style={{ display: 'block' }} />
      </motion.div>

      {/* Chart 3: ISO-Layer Stack */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 backdrop-blur-xl border border-white/10 overflow-hidden"
      >
        <div className="absolute top-4 right-4 z-10 flex items-center gap-3">
          <button
            onClick={() => setPaused3(!paused3)}
            className="px-3 py-1 rounded bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/30 transition-all text-xs font-mono"
          >
            {paused3 ? '▶ Play' : '⏸ Pause'}
          </button>
        </div>
        <canvas ref={canvas3Ref} className="w-full" style={{ display: 'block' }} />
      </motion.div>

      {/* Chart 6: Amenity Radial */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="relative rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 backdrop-blur-xl border border-white/10 overflow-hidden"
      >
        <div className="absolute top-4 right-4 z-10 flex items-center gap-3">
          <button
            onClick={() => setPaused6(!paused6)}
            className="px-3 py-1 rounded bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/30 transition-all text-xs font-mono"
          >
            {paused6 ? '▶ Play' : '⏸ Pause'}
          </button>
        </div>
        <canvas ref={canvas6Ref} className="w-full" style={{ display: 'block' }} />
      </motion.div>

      {/* Chart 9: Connection Web */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="relative rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 backdrop-blur-xl border border-white/10 overflow-hidden"
      >
        <div className="absolute top-4 right-4 z-10 flex items-center gap-3">
          <button
            onClick={() => setPaused9(!paused9)}
            className="px-3 py-1 rounded bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/30 transition-all text-xs font-mono"
          >
            {paused9 ? '▶ Play' : '⏸ Pause'}
          </button>
        </div>
        <canvas ref={canvas9Ref} className="w-full" style={{ display: 'block' }} />
      </motion.div>
    </div>
  );
}
