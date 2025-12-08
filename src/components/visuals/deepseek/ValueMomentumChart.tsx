import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { ChartProperty } from '@/lib/visualsDataMapper';
import {
  PROPERTY_COLORS,
  getScoreResult,
  findBestProperty,
} from '@/lib/cluesSmartScoring';

interface ValueMomentumChartProps {
  properties: ChartProperty[];
}

export default function ValueMomentumChart({ properties }: ValueMomentumChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const winnerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || properties.length === 0) return;

    // VERIFICATION: Log incoming data from 168-field schema
    console.log('🔍 ValueMomentumChart - Data Verification:');
    properties.slice(0, 3).forEach((prop, idx) => {
      console.log(`\n📊 Property ${idx + 1}: ${prop.address}`);
      console.log(`  Field 10 (listing_price): $${prop.listingPrice?.toLocaleString() || 'N/A'}`);
      console.log(`  Field 12 (market_value_estimate): $${prop.marketValueEstimate?.toLocaleString() || 'N/A'}`);
      console.log(`  Field 13 (last_sale_date): ${prop.lastSaleDate || 'N/A'}`);
      console.log(`  Field 14 (last_sale_price): $${prop.lastSalePrice?.toLocaleString() || 'N/A'}`);
      console.log(`  Field 15 (assessed_value): $${prop.assessedValue?.toLocaleString() || 'N/A'}`);
    });

    // Clear previous chart
    d3.select(containerRef.current).selectAll('*').remove();

    // Render Smart Score Badge in header
    const smartScoreBadge = document.getElementById('momentum-smart-score');
    if (smartScoreBadge) {
      smartScoreBadge.innerHTML = '';
    }

    const width = 800;
    const height = 500;
    const margin = { top: 30, right: 180, bottom: 100, left: 80 };

    const svg = d3
      .select(containerRef.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('style', 'max-width: 100%; height: auto;');

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Correct property colors
    const colors = [PROPERTY_COLORS.property1, PROPERTY_COLORS.property2, PROPERTY_COLORS.property3];

    // Prepare data points - ONLY use real data, NO FAKE FALLBACKS
    const dataPoints: any[] = [];
    properties.slice(0, 3).forEach((property, idx) => {
      const lastSaleDate = property.lastSaleDate || 'Unknown';
      const lastSalePrice = property.lastSalePrice;
      const assessedValue = property.assessedValue;
      const marketEstimate = property.marketValueEstimate;
      const listingPrice = property.listingPrice;

      // Only add points with real data
      if (lastSalePrice) {
        dataPoints.push({
          property,
          label: `Last Sale\n${lastSaleDate}`,
          sortOrder: 0,
          value: lastSalePrice,
          color: colors[idx]
        });
      }
      if (assessedValue) {
        dataPoints.push({
          property,
          label: 'Assessed\nValue',
          sortOrder: 1,
          value: assessedValue,
          color: colors[idx]
        });
      }
      if (marketEstimate) {
        dataPoints.push({
          property,
          label: 'Market\nEstimate',
          sortOrder: 2,
          value: marketEstimate,
          color: colors[idx]
        });
      }
      if (listingPrice) {
        dataPoints.push({
          property,
          label: 'Current\nListing',
          sortOrder: 3,
          value: listingPrice,
          color: colors[idx]
        });
      }
    });

    if (dataPoints.length === 0) return; // No data to display

    // Get unique labels in order
    const labels = Array.from(new Set(dataPoints.map(d => d.label))).sort((a, b) => {
      const aOrder = dataPoints.find(d => d.label === a)?.sortOrder || 0;
      const bOrder = dataPoints.find(d => d.label === b)?.sortOrder || 0;
      return aOrder - bOrder;
    });

    // Create scales with TIGHT Y-axis range (+/- 100k from min/max)
    const minValue = d3.min(dataPoints, (d) => d.value)!;
    const maxValue = d3.max(dataPoints, (d) => d.value)!;
    const yMin = Math.max(0, minValue - 100000); // Don't go below 0
    const yMax = maxValue + 100000;

    const xScale = d3
      .scalePoint()
      .domain(labels)
      .range([0, innerWidth])
      .padding(0.5);

    const yScale = d3
      .scaleLinear()
      .domain([yMin, yMax])
      .range([innerHeight, 0]);

    // Add grid
    g.append('g')
      .attr('class', 'grid')
      .call(
        d3
          .axisLeft(yScale)
          .tickSize(-innerWidth)
          .tickFormat(() => '')
      )
      .selectAll('line')
      .attr('stroke', '#334155')
      .attr('stroke-width', 1);

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .attr('font-size', '12px')
      .attr('fill', '#ffffff')
      .attr('font-weight', '700')
      .style('text-anchor', 'middle')
      .call(wrap, 80); // Wrap long labels

    g.append('g')
      .call(
        d3.axisLeft(yScale).tickFormat((d) => {
          const val = d.valueOf();
          if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
          if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
          return `$${val}`;
        })
      )
      .selectAll('text')
      .attr('font-size', '13px')
      .attr('fill', '#e2e8f0')
      .attr('font-weight', '600');

    // Draw lines for each property
    properties.slice(0, 3).forEach((property, idx) => {
      const propertyPoints = dataPoints.filter((d) => d.property.id === property.id);
      if (propertyPoints.length === 0) return;

      // Sort points by sortOrder
      propertyPoints.sort((a, b) => a.sortOrder - b.sortOrder);

      const line = d3
        .line<any>()
        .x((d) => xScale(d.label)!)
        .y((d) => yScale(d.value));

      g.append('path')
        .datum(propertyPoints)
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', colors[idx])
        .attr('stroke-width', 3)
        .attr('opacity', 0.8);

      // Draw points with tooltips
      propertyPoints.forEach((point) => {
        const circle = g.append('circle')
          .attr('cx', xScale(point.label)!)
          .attr('cy', yScale(point.value))
          .attr('r', 6)
          .attr('fill', point.color)
          .attr('stroke', 'white')
          .attr('stroke-width', 2)
          .style('cursor', 'pointer');

        // Tooltip
        const tooltip = g.append('g').attr('opacity', 0).attr('pointer-events', 'none');

        tooltip.append('rect')
          .attr('x', xScale(point.label)! - 50)
          .attr('y', yScale(point.value) - 40)
          .attr('width', 100)
          .attr('height', 30)
          .attr('rx', 6)
          .attr('fill', '#1e293b')
          .attr('stroke', point.color)
          .attr('stroke-width', 2);

        tooltip.append('text')
          .attr('x', xScale(point.label)!)
          .attr('y', yScale(point.value) - 22)
          .attr('text-anchor', 'middle')
          .attr('font-size', '14px')
          .attr('font-weight', '700')
          .attr('fill', '#e2e8f0')
          .text(`$${(point.value / 1000).toFixed(0)}k`);

        circle
          .on('mouseover', () => {
            d3.select(circle.node()).transition().duration(200).attr('r', 9);
            tooltip.transition().duration(200).attr('opacity', 1);
          })
          .on('mouseout', () => {
            d3.select(circle.node()).transition().duration(200).attr('r', 6);
            tooltip.transition().duration(200).attr('opacity', 0);
          });
      });
    });

    // Legend - Right side
    const legend = g.append('g').attr('transform', `translate(${innerWidth + 20}, 10)`);

    properties.slice(0, 3).forEach((property, idx) => {
      const g2 = legend.append('g').attr('transform', `translate(0, ${idx * 24})`);

      g2.append('rect').attr('width', 14).attr('height', 14).attr('rx', 2).attr('fill', colors[idx]);

      g2.append('text')
        .attr('x', 20)
        .attr('y', 11)
        .attr('font-size', '13px')
        .attr('font-weight', '600')
        .attr('fill', '#e2e8f0')
        .text(property.address?.split(',')[0] || `Property ${idx + 1}`);
    });

    // Calculate CLUES-Smart Scores (0-100 scale) - MOMENTUM-SPECIFIC METRICS
    console.log('\n🧠 Smart Score Calculation (5-Tier System):');
    const propertyScores = properties.slice(0, 3).map((property, idx) => {
      const lastSale = property.lastSalePrice || 0;
      const assessed = property.assessedValue || 0;
      const marketEst = property.marketValueEstimate || 0;
      const listing = property.listingPrice || 0;

      console.log(`\n📊 Property ${idx + 1}: ${property.address?.split(',')[0]}`);

      if (listing === 0) {
        console.log('  ⚠️ No listing price - defaulting to 50 (Yellow/Average)');
        return 50; // No data = average
      }

      // Metric 1: Appreciation from last sale (higher = better)
      const appreciation = lastSale > 0 ? ((listing - lastSale) / lastSale) * 100 : 0;
      console.log(`  📈 Metric 1 - Appreciation: ${appreciation.toFixed(2)}%`);

      // Metric 2: Listing vs Market Estimate (closer to 1.0 = better, underpriced is good)
      const vsMarket = marketEst > 0 ? marketEst / listing : 1;
      console.log(`  📊 Metric 2 - Market/Listing Ratio: ${vsMarket.toFixed(3)}`);

      // Metric 3: Listing vs Assessed (closer to 1.0 = better)
      const vsAssessed = assessed > 0 ? assessed / listing : 1;
      console.log(`  📊 Metric 3 - Assessed/Listing Ratio: ${vsAssessed.toFixed(3)}`);

      // 5-TIER SCALE NORMALIZATION (matching 5 color bands)
      // -20% or worse = 0 (Red), -10% = 25 (Orange), 0% = 50 (Yellow), +10% = 75 (Blue), +20% or better = 100 (Green)

      // Appreciation Score: Map to 5 tiers
      let appreciationScore = 50; // Default: 0% = Yellow
      if (appreciation <= -20) appreciationScore = 0;        // -20% or worse = Red
      else if (appreciation <= -10) appreciationScore = 25;  // -10% = Orange
      else if (appreciation <= 0) appreciationScore = 50;    // 0% = Yellow
      else if (appreciation <= 10) appreciationScore = 75;   // +10% = Blue
      else appreciationScore = 100;                          // +20% or better = Green
      console.log(`     → Score: ${appreciationScore} (50% weight)`);

      // Market Score: Convert ratio to percentage difference
      const marketDiff = (vsMarket - 1) * 100; // e.g., 1.1 = +10%, 0.9 = -10%
      let marketScore = 50;
      if (marketDiff <= -20) marketScore = 0;
      else if (marketDiff <= -10) marketScore = 25;
      else if (marketDiff <= 0) marketScore = 50;
      else if (marketDiff <= 10) marketScore = 75;
      else marketScore = 100;
      console.log(`     → Score: ${marketScore} (30% weight)`);

      // Assessed Score: Same logic
      const assessedDiff = (vsAssessed - 1) * 100;
      let assessedScore = 50;
      if (assessedDiff <= -20) assessedScore = 0;
      else if (assessedDiff <= -10) assessedScore = 25;
      else if (assessedDiff <= 0) assessedScore = 50;
      else if (assessedDiff <= 10) assessedScore = 75;
      else assessedScore = 100;
      console.log(`     → Score: ${assessedScore} (20% weight)`);

      // Weighted average: appreciation 50%, market 30%, assessed 20%
      const score = (appreciationScore * 0.5) + (marketScore * 0.3) + (assessedScore * 0.2);
      console.log(`  🎯 Final Weighted Score: ${score.toFixed(1)}/100`);
      return score;
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

    // Wrap text function
    function wrap(text: any, width: number) {
      text.each(function() {
        const text = d3.select(this);
        const words = text.text().split(/\n/);
        text.text(null);
        words.forEach((word: string, i: number) => {
          text.append('tspan')
            .attr('x', 0)
            .attr('dy', i === 0 ? 0 : 12)
            .text(word);
        });
      });
    }
  }, [properties]);

  return (
    <div className="w-full">
      <div ref={winnerRef} className="mb-4 flex justify-center"></div>
      <div ref={containerRef} className="w-full flex justify-center items-center" style={{ minHeight: '500px' }}></div>
    </div>
  );
}
