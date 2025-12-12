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
      const winnerName = data.properties[winnerId].shortName;

      // Winner badge
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

      // Draw helixes
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

        ctx.save();
        ctx.fillStyle = propertyColor;
        ctx.font = '11px Share Tech Mono';
        ctx.textAlign = 'center';
        ctx.fillText(`TOTAL: ${totalScore}`, offsetX, baseStartY - 30);
        ctx.font = 'bold 12px Share Tech Mono';
        ctx.fillText(propNames[pIdx], offsetX, baseStartY - 10);
        ctx.restore();

        for (let i = 0; i < 6; i++) {
          const y = baseStartY + 40 + i * 70;
          const r = 27;
          const featureScore = dataset[i];
          const featureLabel = labelsFull[i];

          ctx.save();
          ctx.fillStyle = 'rgba(255,255,255,0.6)';
          ctx.font = '9px Share Tech Mono';
          ctx.textAlign = 'right';
          ctx.fillText(featureLabel.toUpperCase(), offsetX - 55, y + 3);
          ctx.restore();

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
  }, [data, paused1, winnerId, labelsFull]);

  // CHART 2: ORBITAL GRAVITY - COMPLETE
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
        canvas.height = 600;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    let time = 0;
    let animationId: number;

    function animate() {
      if (!paused2) time += 0.015;
      const w = canvas!.width;
      const h = canvas!.height;
      ctx.clearRect(0, 0, w, h);

      const centerX = w / 2;
      const centerY = h / 2;

      // Sun (center)
      ctx.save();
      ctx.fillStyle = '#FDB813';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(253, 184, 19, 0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Sun glow
      const gradient = ctx.createRadialGradient(centerX, centerY, 30, centerX, centerY, 60);
      gradient.addColorStop(0, 'rgba(253, 184, 19, 0.3)');
      gradient.addColorStop(1, 'rgba(253, 184, 19, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 60, 0, Math.PI * 2);
      ctx.fill();

      // Sun label
      ctx.fillStyle = '#000';
      ctx.font = 'bold 10px Share Tech Mono';
      ctx.textAlign = 'center';
      ctx.fillText('100', centerX, centerY + 3);
      ctx.restore();

      // Planets (3 properties)
      const propData = [
        { id: 'p1' as const, score: data.totalScores.p1, color: data.properties.p1.color, name: data.properties.p1.shortName },
        { id: 'p2' as const, score: data.totalScores.p2, color: data.properties.p2.color, name: data.properties.p2.shortName },
        { id: 'p3' as const, score: data.totalScores.p3, color: data.properties.p3.color, name: data.properties.p3.shortName }
      ];

      propData.forEach((prop, idx) => {
        const tier = getScoreTier(prop.score);
        const orbitRadius = 100 + (100 - prop.score) * 1.5; // Higher score = closer to sun
        const angleOffset = (idx * 120) * Math.PI / 180;
        const angle = time + angleOffset;

        const planetX = centerX + Math.cos(angle) * orbitRadius;
        const planetY = centerY + Math.sin(angle) * orbitRadius;
        const planetSize = 12 + (prop.score / 100) * 8; // Bigger = higher score

        // Orbit path
        ctx.save();
        ctx.strokeStyle = `${prop.color}40`;
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(centerX, centerY, orbitRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // Planet
        ctx.save();
        ctx.fillStyle = tier.color;
        ctx.beginPath();
        ctx.arc(planetX, planetY, planetSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = prop.color;
        ctx.lineWidth = 3;
        ctx.stroke();

        // Planet label
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.font = 'bold 9px Share Tech Mono';
        ctx.textAlign = 'center';
        ctx.fillText(String(prop.score), planetX, planetY + 3);

        // Property name
        ctx.fillStyle = prop.color;
        ctx.font = 'bold 11px Share Tech Mono';
        ctx.fillText(prop.name, planetX, planetY + planetSize + 15);
        ctx.restore();
      });

      // Legend
      ctx.save();
      ctx.font = 'bold 10px Share Tech Mono';
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.textAlign = 'center';
      const legendY = h - 60;
      ctx.fillText('GRAVITATIONAL PULL: Higher scores orbit closer to 100', w/2, legendY);
      ctx.font = '9px Share Tech Mono';
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillText('Planet size & color = composite exterior quality score', w/2, legendY + 15);
      ctx.restore();

      // Winner badge
      const winnerScore = data.totalScores[winnerId];
      const winnerTier = getScoreTier(winnerScore);
      const winnerName = data.properties[winnerId].shortName;

      ctx.save();
      ctx.textAlign = 'left';
      ctx.fillStyle = winnerTier.color;
      ctx.strokeStyle = winnerTier.color;
      ctx.lineWidth = 2;
      const badgeX = 20;
      const badgeY = 25;
      ctx.strokeRect(badgeX, badgeY - 15, 120, 30);
      ctx.globalAlpha = 0.2;
      ctx.fillRect(badgeX, badgeY - 15, 120, 30);
      ctx.globalAlpha = 1;
      ctx.font = 'bold 11px Share Tech Mono';
      ctx.textAlign = 'center';
      ctx.fillText(`${winnerTier.emoji} WINNER`, badgeX + 60, badgeY);
      ctx.font = 'bold 14px Share Tech Mono';
      ctx.fillText(winnerName, badgeX + 60, badgeY + 14);
      ctx.restore();

      animationId = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [data, paused2, winnerId]);

  // CHART 3: ISO-LAYER STACK - COMPLETE
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
        canvas.height = 650;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    let time = 0;
    let animationId: number;

    // Isometric projection helper
    function isoProject(x: number, y: number, z: number): [number, number] {
      const isoX = (x - y) * Math.cos(Math.PI / 6);
      const isoY = (x + y) * Math.sin(Math.PI / 6) - z;
      return [isoX, isoY];
    }

    function animate() {
      if (!paused3) time += 0.01;
      const w = canvas!.width;
      const h = canvas!.height;
      ctx.clearRect(0, 0, w, h);

      const centerX = w / 2;
      const baseY = h - 100;
      const layerHeight = 50;

      // Draw all 6 factors as isometric layers
      const propData = [
        { id: 'p1' as const, scores: data.qualityScores.p1, color: data.properties.p1.color, name: data.properties.p1.shortName },
        { id: 'p2' as const, scores: data.qualityScores.p2, color: data.properties.p2.color, name: data.properties.p2.shortName },
        { id: 'p3' as const, scores: data.qualityScores.p3, color: data.properties.p3.color, name: data.properties.p3.shortName }
      ];

      const layerSpacing = 180;

      propData.forEach((prop, pIdx) => {
        const offsetX = centerX + (pIdx - 1) * layerSpacing;

        // Property label
        ctx.save();
        ctx.fillStyle = prop.color;
        ctx.font = 'bold 13px Share Tech Mono';
        ctx.textAlign = 'center';
        ctx.fillText(prop.name, offsetX, 30);
        ctx.font = '10px Share Tech Mono';
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fillText(`Total: ${data.totalScores[prop.id]}`, offsetX, 45);
        ctx.restore();

        // Draw layers from bottom to top
        for (let i = 5; i >= 0; i--) {
          const score = prop.scores[i];
          const tier = getScoreTier(score);
          const z = (5 - i) * layerHeight + Math.sin(time + i) * 5;
          const layerWidth = 100 + (score / 100) * 60; // Wider = higher score
          const layerDepth = 40;

          // Calculate corners
          const [x1, y1] = isoProject(-layerWidth/2, -layerDepth/2, z);
          const [x2, y2] = isoProject(layerWidth/2, -layerDepth/2, z);
          const [x3, y3] = isoProject(layerWidth/2, layerDepth/2, z);
          const [x4, y4] = isoProject(-layerWidth/2, layerDepth/2, z);

          // Top face
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(offsetX + x1, baseY + y1);
          ctx.lineTo(offsetX + x2, baseY + y2);
          ctx.lineTo(offsetX + x3, baseY + y3);
          ctx.lineTo(offsetX + x4, baseY + y4);
          ctx.closePath();
          ctx.fillStyle = tier.color;
          ctx.globalAlpha = 0.7;
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.strokeStyle = prop.color;
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.restore();

          // Right face
          ctx.save();
          const [x2b, y2b] = isoProject(layerWidth/2, -layerDepth/2, z - layerHeight);
          const [x3b, y3b] = isoProject(layerWidth/2, layerDepth/2, z - layerHeight);
          ctx.beginPath();
          ctx.moveTo(offsetX + x2, baseY + y2);
          ctx.lineTo(offsetX + x3, baseY + y3);
          ctx.lineTo(offsetX + x3b, baseY + y3b);
          ctx.lineTo(offsetX + x2b, baseY + y2b);
          ctx.closePath();
          ctx.fillStyle = tier.color;
          ctx.globalAlpha = 0.4;
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.strokeStyle = prop.color;
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.restore();

          // Label
          ctx.save();
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 9px Share Tech Mono';
          ctx.textAlign = 'center';
          ctx.fillText(String(score), offsetX + x1 - 20, baseY + y1 + 4);
          ctx.font = '8px Share Tech Mono';
          ctx.fillStyle = 'rgba(255,255,255,0.6)';
          ctx.fillText(labels[i], offsetX + x1 - 20, baseY + y1 + 13);
          ctx.restore();
        }
      });

      // Legend
      ctx.save();
      ctx.font = 'bold 10px Share Tech Mono';
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.textAlign = 'center';
      const legendY = h - 40;
      ctx.fillText('ISO-LAYERS: Each layer = quality factor • Width = score magnitude • Height = stack position', w/2, legendY);
      ctx.restore();

      animationId = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [data, paused3, labels]);

  // CHART 6: AMENITY RADIAL - COMPLETE
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
        canvas.height = 600;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    let time = 0;
    let animationId: number;

    function animate() {
      if (!paused6) time += 0.02;
      const w = canvas!.width;
      const h = canvas!.height;
      ctx.clearRect(0, 0, w, h);

      const centerX = w / 2;
      const centerY = h / 2;
      const maxRadius = Math.min(w, h) * 0.35;

      // Draw 8 amenities in radial pattern
      const amenityLabels = data.amenities.labelsFull;
      const propData = [
        { id: 'p1' as const, values: data.amenities.p1, color: data.properties.p1.color, name: data.properties.p1.shortName },
        { id: 'p2' as const, values: data.amenities.p2, color: data.properties.p2.color, name: data.properties.p2.shortName },
        { id: 'p3' as const, values: data.amenities.p3, color: data.properties.p3.color, name: data.properties.p3.shortName }
      ];

      // Rings for each property
      propData.forEach((prop, pIdx) => {
        const ringRadius = maxRadius * (0.4 + pIdx * 0.25);
        const rotation = time + (pIdx * Math.PI / 3);

        // Ring circle
        ctx.save();
        ctx.strokeStyle = `${prop.color}60`;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // Amenity dots
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2 + rotation;
          const dotX = centerX + Math.cos(angle) * ringRadius;
          const dotY = centerY + Math.sin(angle) * ringRadius;
          const hasAmenity = prop.values[i] === 1;

          ctx.save();
          ctx.beginPath();
          ctx.arc(dotX, dotY, hasAmenity ? 10 : 5, 0, Math.PI * 2);
          ctx.fillStyle = hasAmenity ? prop.color : 'rgba(100,100,100,0.3)';
          ctx.fill();
          ctx.strokeStyle = prop.color;
          ctx.lineWidth = hasAmenity ? 2 : 1;
          ctx.stroke();

          // Checkmark for owned amenities
          if (hasAmenity) {
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(dotX - 4, dotY);
            ctx.lineTo(dotX - 1, dotY + 3);
            ctx.lineTo(dotX + 4, dotY - 3);
            ctx.stroke();
          }
          ctx.restore();

          // Labels (only on outermost ring)
          if (pIdx === 2 && i < amenityLabels.length) {
            const labelRadius = maxRadius * 1.25;
            const labelX = centerX + Math.cos(angle) * labelRadius;
            const labelY = centerY + Math.sin(angle) * labelRadius;

            ctx.save();
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.font = '9px Share Tech Mono';
            ctx.textAlign = 'center';
            ctx.fillText(amenityLabels[i].toUpperCase(), labelX, labelY);
            ctx.restore();
          }
        }

        // Ring label
        const labelAngle = rotation;
        const labelX = centerX + Math.cos(labelAngle) * (ringRadius + 30);
        const labelY = centerY + Math.sin(labelAngle) * (ringRadius + 30);
        ctx.save();
        ctx.fillStyle = prop.color;
        ctx.font = 'bold 11px Share Tech Mono';
        ctx.textAlign = 'center';
        ctx.fillText(prop.name, labelX, labelY);
        ctx.font = '9px Share Tech Mono';
        ctx.fillText(`${data.amenityCounts[prop.id]}/8`, labelX, labelY + 12);
        ctx.restore();
      });

      // Center label
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = 'bold 12px Share Tech Mono';
      ctx.textAlign = 'center';
      ctx.fillText('EXTERIOR', centerX, centerY - 5);
      ctx.fillText('AMENITIES', centerX, centerY + 10);
      ctx.restore();

      // Legend
      ctx.save();
      ctx.font = 'bold 10px Share Tech Mono';
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.textAlign = 'center';
      const legendY = h - 40;
      ctx.fillText('RADIAL VIEW: Filled dots = amenity present • Empty dots = not included • 8 binary features', w/2, legendY);
      ctx.restore();

      animationId = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [data, paused6]);

  // CHART 9: CONNECTION WEB - COMPLETE
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
        canvas.height = 600;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    let time = 0;
    let animationId: number;

    function animate() {
      if (!paused9) time += 0.02;
      const w = canvas!.width;
      const h = canvas!.height;
      ctx.clearRect(0, 0, w, h);

      const centerX = w / 2;
      const centerY = h / 2;

      // Property nodes positions (triangle formation)
      const nodeRadius = Math.min(w, h) * 0.3;
      const propNodes = [
        {
          id: 'p1' as const,
          x: centerX + Math.cos(-Math.PI / 2) * nodeRadius,
          y: centerY + Math.sin(-Math.PI / 2) * nodeRadius,
          color: data.properties.p1.color,
          name: data.properties.p1.shortName,
          score: data.totalScores.p1,
          amenities: data.amenities.p1,
          count: data.amenityCounts.p1
        },
        {
          id: 'p2' as const,
          x: centerX + Math.cos(-Math.PI / 2 + (2 * Math.PI / 3)) * nodeRadius,
          y: centerY + Math.sin(-Math.PI / 2 + (2 * Math.PI / 3)) * nodeRadius,
          color: data.properties.p2.color,
          name: data.properties.p2.shortName,
          score: data.totalScores.p2,
          amenities: data.amenities.p2,
          count: data.amenityCounts.p2
        },
        {
          id: 'p3' as const,
          x: centerX + Math.cos(-Math.PI / 2 + (4 * Math.PI / 3)) * nodeRadius,
          y: centerY + Math.sin(-Math.PI / 2 + (4 * Math.PI / 3)) * nodeRadius,
          color: data.properties.p3.color,
          name: data.properties.p3.shortName,
          score: data.totalScores.p3,
          amenities: data.amenities.p3,
          count: data.amenityCounts.p3
        }
      ];

      // Amenity nodes in center (8 amenities)
      const amenityLabels = data.amenities.labels;
      const amenityRadius = 50;
      const amenityNodes = amenityLabels.map((label, i) => ({
        label,
        x: centerX + Math.cos((i / 8) * Math.PI * 2 + time * 0.5) * amenityRadius,
        y: centerY + Math.sin((i / 8) * Math.PI * 2 + time * 0.5) * amenityRadius
      }));

      // Draw connections (property to owned amenities)
      ctx.save();
      propNodes.forEach((prop) => {
        prop.amenities.forEach((hasAmenity, amenityIdx) => {
          if (hasAmenity === 1) {
            const amenity = amenityNodes[amenityIdx];

            // Pulsing connection
            const pulsePhase = (time + amenityIdx * 0.5) % 2;
            const alpha = 0.2 + Math.sin(pulsePhase * Math.PI) * 0.3;

            ctx.strokeStyle = prop.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(prop.x, prop.y);
            ctx.lineTo(amenity.x, amenity.y);
            ctx.stroke();
          }
        });
      });
      ctx.restore();

      // Draw amenity nodes
      amenityNodes.forEach((amenity, idx) => {
        const ownedBy = propNodes.filter(p => p.amenities[idx] === 1).length;

        ctx.save();
        ctx.beginPath();
        ctx.arc(amenity.x, amenity.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = ownedBy > 0 ? 'rgba(255,255,255,0.6)' : 'rgba(100,100,100,0.3)';
        ctx.fill();
        ctx.strokeStyle = ownedBy > 0 ? 'rgba(255,255,255,0.9)' : 'rgba(150,150,150,0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Label
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.font = '8px Share Tech Mono';
        ctx.textAlign = 'center';
        ctx.fillText(amenity.label, amenity.x, amenity.y + 18);
        ctx.restore();
      });

      // Draw property nodes
      propNodes.forEach((prop) => {
        const tier = getScoreTier(prop.score);
        const nodeSize = 30 + (prop.score / 100) * 15;
        const pulse = Math.sin(time * 2) * 2;

        ctx.save();

        // Glow
        const gradient = ctx.createRadialGradient(prop.x, prop.y, nodeSize, prop.x, prop.y, nodeSize + 20);
        gradient.addColorStop(0, `${prop.color}40`);
        gradient.addColorStop(1, `${prop.color}00`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(prop.x, prop.y, nodeSize + 20 + pulse, 0, Math.PI * 2);
        ctx.fill();

        // Node
        ctx.beginPath();
        ctx.arc(prop.x, prop.y, nodeSize, 0, Math.PI * 2);
        ctx.fillStyle = tier.color;
        ctx.globalAlpha = 0.8;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = prop.color;
        ctx.lineWidth = 4;
        ctx.stroke();

        // Score
        ctx.fillStyle = '#000';
        ctx.font = 'bold 14px Share Tech Mono';
        ctx.textAlign = 'center';
        ctx.fillText(String(prop.score), prop.x, prop.y - 3);

        // Count
        ctx.font = '9px Share Tech Mono';
        ctx.fillText(`${prop.count}/8`, prop.x, prop.y + 10);

        // Name
        ctx.fillStyle = prop.color;
        ctx.font = 'bold 12px Share Tech Mono';
        ctx.fillText(prop.name, prop.x, prop.y + nodeSize + 20);
        ctx.restore();
      });

      // Center label
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = 'bold 10px Share Tech Mono';
      ctx.textAlign = 'center';
      ctx.fillText('AMENITY', centerX, centerY - 5);
      ctx.fillText('NETWORK', centerX, centerY + 8);
      ctx.restore();

      // Legend
      ctx.save();
      ctx.font = 'bold 10px Share Tech Mono';
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.textAlign = 'center';
      const legendY = h - 40;
      ctx.fillText('CONNECTION WEB: Lines = ownership • Pulsing = active feature • Node size = quality score', w/2, legendY);
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
        <div className="p-4 bg-black/20 border-t border-white/5">
          <p className="text-[10px] text-gray-400 font-mono leading-relaxed">
            <span className="text-cyan-400 font-bold">HOW TO READ:</span> Ring color = property identity • Fill color = CLUES-SMART tier • Icon = feature type • Total score = average of 6 factors
          </p>
        </div>
      </motion.div>

      {/* Chart 2: Orbital Gravity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 backdrop-blur-xl border border-white/10 overflow-hidden"
      >
        <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
          <span className="text-xs font-mono text-gray-500">Chart 7-2</span>
          <button
            onClick={() => setPaused2(!paused2)}
            className="px-3 py-1 rounded bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/30 transition-all text-xs font-mono"
          >
            {paused2 ? '▶ Play' : '⏸ Pause'}
          </button>
        </div>
        <div className="pt-16 pb-2 text-center">
          <h3 className="text-base font-bold text-white font-mono tracking-wider">ORBITAL GRAVITY</h3>
          <p className="text-xs text-gray-400 font-mono mt-1">Composite Quality Score • Gravitational Pull Visualization</p>
        </div>
        <canvas ref={canvas2Ref} className="w-full" style={{ display: 'block' }} />
        <div className="p-4 bg-black/20 border-t border-white/5">
          <p className="text-[10px] text-gray-400 font-mono leading-relaxed">
            <span className="text-cyan-400 font-bold">HOW TO READ:</span> Higher scores orbit closer to 100 (sun) • Planet size = score magnitude • Planet fill = SMART tier • Ring color = property
          </p>
        </div>
      </motion.div>

      {/* Chart 3: ISO-Layer Stack */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 backdrop-blur-xl border border-white/10 overflow-hidden"
      >
        <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
          <span className="text-xs font-mono text-gray-500">Chart 7-3</span>
          <button
            onClick={() => setPaused3(!paused3)}
            className="px-3 py-1 rounded bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/30 transition-all text-xs font-mono"
          >
            {paused3 ? '▶ Play' : '⏸ Pause'}
          </button>
        </div>
        <div className="pt-16 pb-2 text-center">
          <h3 className="text-base font-bold text-white font-mono tracking-wider">ISO-LAYER STACK</h3>
          <p className="text-xs text-gray-400 font-mono mt-1">6 Quality Factors • Isometric Topographic View</p>
        </div>
        <canvas ref={canvas3Ref} className="w-full" style={{ display: 'block' }} />
        <div className="p-4 bg-black/20 border-t border-white/5">
          <p className="text-[10px] text-gray-400 font-mono leading-relaxed">
            <span className="text-cyan-400 font-bold">HOW TO READ:</span> Each layer = 1 quality factor • Layer width = score (wider = higher) • Layer fill = SMART tier • Border = property color
          </p>
        </div>
      </motion.div>

      {/* Chart 6: Amenity Radial */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="relative rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 backdrop-blur-xl border border-white/10 overflow-hidden"
      >
        <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
          <span className="text-xs font-mono text-gray-500">Chart 7-6</span>
          <button
            onClick={() => setPaused6(!paused6)}
            className="px-3 py-1 rounded bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/30 transition-all text-xs font-mono"
          >
            {paused6 ? '▶ Play' : '⏸ Pause'}
          </button>
        </div>
        <div className="pt-16 pb-2 text-center">
          <h3 className="text-base font-bold text-white font-mono tracking-wider">AMENITY RADIAL</h3>
          <p className="text-xs text-gray-400 font-mono mt-1">8 Binary Features • Rotating Ring Visualization</p>
        </div>
        <canvas ref={canvas6Ref} className="w-full" style={{ display: 'block' }} />
        <div className="p-4 bg-black/20 border-t border-white/5">
          <p className="text-[10px] text-gray-400 font-mono leading-relaxed">
            <span className="text-cyan-400 font-bold">HOW TO READ:</span> Filled dots with ✓ = amenity present • Small empty dots = not included • 3 rotating rings = 3 properties • Counts shown per property
          </p>
        </div>
      </motion.div>

      {/* Chart 9: Connection Web */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="relative rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 backdrop-blur-xl border border-white/10 overflow-hidden"
      >
        <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
          <span className="text-xs font-mono text-gray-500">Chart 7-9</span>
          <button
            onClick={() => setPaused9(!paused9)}
            className="px-3 py-1 rounded bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/30 transition-all text-xs font-mono"
          >
            {paused9 ? '▶ Play' : '⏸ Pause'}
          </button>
        </div>
        <div className="pt-16 pb-2 text-center">
          <h3 className="text-base font-bold text-white font-mono tracking-wider">CONNECTION WEB</h3>
          <p className="text-xs text-gray-400 font-mono mt-1">Amenity Network • Property Ownership Graph</p>
        </div>
        <canvas ref={canvas9Ref} className="w-full" style={{ display: 'block' }} />
        <div className="p-4 bg-black/20 border-t border-white/5">
          <p className="text-[10px] text-gray-400 font-mono leading-relaxed">
            <span className="text-cyan-400 font-bold">HOW TO READ:</span> Property nodes (large) = composite score • Amenity nodes (center, small) = 8 features • Pulsing lines = ownership connections • Node size = quality score
          </p>
        </div>
      </motion.div>
    </div>
  );
}
