import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { ChartProperty } from '@/lib/visualsDataMapper';
import {
  calculateWeightedScore,
  findBestProperty,
  getScoreResult,
  getPropertyColor,
  PROPERTY_COLORS,
} from '@/lib/cluesSmartScoring';

interface MarketRadarChartProps {
  properties: ChartProperty[];
}

export default function MarketRadarChart({ properties }: MarketRadarChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const winnerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || properties.length === 0) return;

    // Clear previous chart
    d3.select(containerRef.current).selectAll('*').remove();

    // Render Smart Score Badge in header
    const smartScoreBadge = document.getElementById('radar-smart-score');
    if (smartScoreBadge) {
      // We'll update this with the actual best score after calculation
      smartScoreBadge.innerHTML = '';
    }

    const width = 600;
    const height = 700; // Increased to accommodate legend
    const margin = { top: 80, right: 80, bottom: 120, left: 80 }; // Increased bottom margin
    const radius = Math.min(width, height) / 2 - Math.max(margin.top, margin.right, margin.bottom, margin.left);

    const svg = d3
      .select(containerRef.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('style', 'max-width: 100%; height: auto;')
      .append('g')
      .attr('transform', `translate(${width / 2},${300})`);

    // Metrics for radar
    const metrics = [
      { key: 'valueRatio', label: 'Value/Price', normalize: true, isCalculated: true }, // Market value to price ratio (higher = better deal)
      { key: 'bedrooms', label: 'Beds', normalize: true },
      { key: 'bathrooms', label: 'Baths', normalize: true },
      { key: 'livingSqft', label: 'SqFt', normalize: true },
      { key: 'lotSizeSqft', label: 'Lot', normalize: true },
      { key: 'yearBuilt', label: 'Age', normalize: true, convertToAge: true, lowerIsBetter: true }, // Newer = better
    ];

    // Calculate normalized values
    const normalizedData = properties.slice(0, 3).map((property) => {
      const values = metrics.map((metric) => {
        // Calculate value-to-price ratio
        if (metric.key === 'valueRatio') {
          const marketValue = property.marketValueEstimate || property.listingPrice || 0;
          const listingPrice = property.listingPrice || 1; // Avoid division by zero
          return marketValue / listingPrice; // Ratio > 1.0 = underpriced, < 1.0 = overpriced
        }

        let value = property[metric.key as keyof ChartProperty] as number || 0;
        if (metric.convertToAge) {
          value = 2024 - value; // Convert year to age
        }
        return value;
      });

      // Get min and max for each metric across all properties
      const minMaxValues = metrics.map((metric) => {
        const allValues = properties.map((p) => {
          // Calculate value-to-price ratio
          if (metric.key === 'valueRatio') {
            const marketValue = p.marketValueEstimate || p.listingPrice || 0;
            const listingPrice = p.listingPrice || 1;
            return marketValue / listingPrice;
          }

          let val = p[metric.key as keyof ChartProperty] as number || 0;
          if (metric.convertToAge) {
            val = 2024 - val;
          }
          return val;
        });
        return { min: Math.min(...allValues), max: Math.max(...allValues) };
      });

      // Normalize to 0-1 scale
      const normalized = values.map((v, i) => {
        const { min, max } = minMaxValues[i];
        if (max === min) return 0.5; // All equal = 50%

        if (metrics[i].lowerIsBetter) {
          // Lower is better: min value gets 1.0, max value gets 0.0
          return (max - v) / (max - min);
        } else {
          // Higher is better: max value gets 1.0, min value gets 0.0
          return (v - min) / (max - min);
        }
      });

      return { property, values, normalized };
    });

    // Draw radar grid
    const levels = 5;
    const angleSlice = (Math.PI * 2) / metrics.length;

    for (let level = 0; level < levels; level++) {
      const levelFactor = radius * ((level + 1) / levels);

      // Grid circles
      svg
        .append('circle')
        .attr('r', levelFactor)
        .attr('fill', 'none')
        .attr('stroke', '#475569')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '4,4');

      // Grid value labels
      svg
        .append('text')
        .attr('x', 4)
        .attr('y', -levelFactor)
        .attr('dy', '0.4em')
        .attr('font-size', '11px')
        .attr('fill', '#94a3b8')
        .attr('font-weight', '600')
        .text(`${((level + 1) * 20)}%`);
    }

    // Draw axes
    metrics.forEach((metric, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      // Axis line
      svg
        .append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', x)
        .attr('y2', y)
        .attr('stroke', '#64748b')
        .attr('stroke-width', 2);

      // Label background for readability
      const labelX = Math.cos(angle) * (radius + 40);
      const labelY = Math.sin(angle) * (radius + 40);

      svg
        .append('rect')
        .attr('x', labelX - 42)
        .attr('y', labelY - 12)
        .attr('width', 84)
        .attr('height', 24)
        .attr('rx', 4)
        .attr('fill', '#1e293b')
        .attr('stroke', '#3b82f6')
        .attr('stroke-width', 1.5);

      // Label text
      svg
        .append('text')
        .attr('x', labelX)
        .attr('y', labelY)
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .attr('font-size', '14px')
        .attr('font-weight', '700')
        .attr('fill', '#e2e8f0')
        .text(metric.label);
    });

    // Property colors - matching global scheme
    // 1821 Hillcrest = Green, 1947 Oakwood = Lavender, 725 Live Oak = Pink
    const colors = [PROPERTY_COLORS.property1, PROPERTY_COLORS.property2, PROPERTY_COLORS.property3];

    // Calculate CLUES-Smart scores (0-100) for each property
    const propertyScores = normalizedData.map((data) => {
      // Average the normalized values (equally weighted for now)
      const avg = data.normalized.reduce((sum, val) => sum + val, 0) / data.normalized.length;
      return avg * 100; // Convert to 0-100 scale
    });

    // Draw property radars
    normalizedData.forEach((data, idx) => {
      const lineGenerator = d3
        .lineRadial<number>()
        .radius((d) => d * radius)
        .angle((d, i) => angleSlice * i - Math.PI / 2)
        .curve(d3.curveLinearClosed);

      // Area
      svg
        .append('path')
        .datum(data.normalized)
        .attr('d', lineGenerator)
        .attr('fill', colors[idx])
        .attr('fill-opacity', 0.1)
        .attr('stroke', colors[idx])
        .attr('stroke-width', 2);

      // Data points with tooltips and value labels
      data.normalized.forEach((value, i) => {
        const angle = angleSlice * i - Math.PI / 2;
        const x = Math.cos(angle) * value * radius;
        const y = Math.sin(angle) * value * radius;
        const actualValue = data.values[i];
        const metric = metrics[i];

        // Format the actual value
        let displayValue = actualValue.toLocaleString();
        if (metric.key === 'valueRatio') {
          displayValue = `${actualValue.toFixed(3)}x`; // Show as ratio (e.g., 0.982x or 1.005x)
        } else if (metric.key === 'listingPrice') {
          displayValue = `$${(actualValue / 1000).toFixed(0)}k`;
        } else if (metric.key === 'yearBuilt') {
          displayValue = `${actualValue}y old`; // actualValue is already converted to age
        } else if (metric.key === 'livingSqft' || metric.key === 'lotSizeSqft') {
          displayValue = `${(actualValue / 1000).toFixed(1)}k sqft`;
        } else if (metric.key === 'bedrooms' || metric.key === 'bathrooms') {
          displayValue = actualValue.toString();
        }

        // Circle
        const circle = svg
          .append('circle')
          .attr('cx', x)
          .attr('cy', y)
          .attr('r', 6)
          .attr('fill', colors[idx])
          .attr('stroke', 'white')
          .attr('stroke-width', 2)
          .style('cursor', 'pointer');

        // Tooltip group
        const tooltip = svg
          .append('g')
          .attr('opacity', 0)
          .attr('pointer-events', 'none');

        tooltip
          .append('rect')
          .attr('x', x - 50)
          .attr('y', y - 35)
          .attr('width', 100)
          .attr('height', 28)
          .attr('rx', 6)
          .attr('fill', '#1e293b')
          .attr('stroke', colors[idx])
          .attr('stroke-width', 2);

        tooltip
          .append('text')
          .attr('x', x)
          .attr('y', y - 18)
          .attr('text-anchor', 'middle')
          .attr('font-size', '13px')
          .attr('font-weight', '700')
          .attr('fill', '#e2e8f0')
          .text(displayValue);

        // Hover events
        circle
          .on('mouseover', function() {
            d3.select(this)
              .transition()
              .duration(200)
              .attr('r', 9)
              .attr('stroke-width', 3);
            tooltip.transition().duration(200).attr('opacity', 1);
          })
          .on('mouseout', function() {
            d3.select(this)
              .transition()
              .duration(200)
              .attr('r', 6)
              .attr('stroke-width', 2);
            tooltip.transition().duration(200).attr('opacity', 0);
          });
      });
    });

    // Find the winner
    const best = findBestProperty(properties.slice(0, 3), propertyScores);

    // Display Smart Score Badge in header
    if (best && smartScoreBadge) {
      const scoreResult = getScoreResult(best.score);
      smartScoreBadge.innerHTML = `
        <div style="display: flex; align-items: center; gap: 6px; padding: 6px 12px; background: #1e293b; border: 1px solid #334155; border-radius: 9999px; box-shadow: 0 1px 3px rgba(0,0,0,0.3);">
          <span style="font-size: 14px;">🧠</span>
          <span style="font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">Smart</span>
          <span style="font-size: 13px; font-weight: 700; color: ${scoreResult.color};">${scoreResult.score}</span>
        </div>
      `;
    }

    // Display winner in DOM
    if (winnerRef.current && best) {
      const scoreResult = getScoreResult(best.score);
      winnerRef.current.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px; padding: 12px 20px; background: ${scoreResult.color}20; border: 2px solid ${scoreResult.color}; border-radius: 12px;">
          <span style="font-size: 24px;">🏆</span>
          <div>
            <div style="font-size: 14px; font-weight: 700; color: #e2e8f0;">
              Winner: ${best.property.address?.split(',')[0] || `Property ${best.index + 1}`}
            </div>
            <div style="font-size: 12px; color: #94a3b8;">
              CLUES-Smart Score: <span style="color: ${scoreResult.color}; font-weight: 700;">${scoreResult.score}/100</span> (${scoreResult.label})
            </div>
          </div>
        </div>
      `;
    }

    // Legend - positioned at bottom center with scores
    const legend = svg
      .append('g')
      .attr('transform', `translate(${-270}, ${radius + 60})`);

    normalizedData.forEach((data, idx) => {
      const score = Math.round(propertyScores[idx]);
      const scoreResult = getScoreResult(score);
      const g = legend.append('g').attr('transform', `translate(${idx * 180}, 0)`);

      g.append('rect')
        .attr('width', 16)
        .attr('height', 16)
        .attr('rx', 3)
        .attr('fill', colors[idx])
        .attr('stroke', '#fff')
        .attr('stroke-width', 2);

      g.append('text')
        .attr('x', 24)
        .attr('y', 8)
        .attr('font-size', '13px')
        .attr('font-weight', '700')
        .attr('fill', '#e2e8f0')
        .text(data.property.address?.split(',')[0] || `Property ${idx + 1}`);

      // Score below name
      g.append('text')
        .attr('x', 24)
        .attr('y', 22)
        .attr('font-size', '11px')
        .attr('font-weight', '600')
        .attr('fill', scoreResult.color)
        .text(`${score}/100`);
    });
  }, [properties]);

  return (
    <div className="w-full">
      <div ref={winnerRef} className="mb-4 flex justify-center"></div>
      <div ref={containerRef} className="w-full flex justify-center items-center" style={{ minHeight: '800px' }}></div>
    </div>
  );
}
