import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { ChartProperty } from '@/lib/visualsDataMapper';

interface ComparativeAnalysisMatrixProps {
  properties: ChartProperty[];
}

export default function ComparativeAnalysisMatrix({ properties }: ComparativeAnalysisMatrixProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || properties.length === 0) return;

    // Clear previous chart
    d3.select(containerRef.current).selectAll('*').remove();

    const width = 800;
    const height = 400;

    const svg = d3
      .select(containerRef.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    // Property colors
    const colors = ['#3b82f6', '#10b981', '#8b5cf6'];

    const props = properties.slice(0, 3);
    const cellSize = 100;
    const margin = 60;

    // Draw property headers
    props.forEach((property, i) => {
      // Column header
      svg
        .append('text')
        .attr('x', margin + cellSize * (i + 1))
        .attr('y', margin - 10)
        .attr('text-anchor', 'middle')
        .attr('font-weight', '600')
        .attr('fill', colors[i])
        .text(property.address?.split(',')[0] || `Property ${i + 1}`);

      // Row header
      svg
        .append('text')
        .attr('x', margin - 10)
        .attr('y', margin + cellSize * (i + 1) - cellSize / 2)
        .attr('text-anchor', 'end')
        .attr('dominant-baseline', 'middle')
        .attr('font-weight', '600')
        .attr('fill', colors[i])
        .text(property.address?.split(',')[0] || `Property ${i + 1}`);

      // Property color indicator
      svg
        .append('circle')
        .attr('cx', margin - 20)
        .attr('cy', margin + cellSize * (i + 1) - cellSize / 2)
        .attr('r', 6)
        .attr('fill', colors[i]);
    });

    // Draw comparison cells
    for (let i = 0; i < props.length; i++) {
      for (let j = 0; j < props.length; j++) {
        if (i === j) {
          // Diagonal - show property metrics
          const metricsBox = svg
            .append('g')
            .attr(
              'transform',
              `translate(${margin + cellSize * (j + 1) - cellSize / 2}, ${margin + cellSize * (i + 1) - cellSize / 2})`
            );

          const metrics = [
            { label: 'Price', value: `$${((props[i].listingPrice || 0) / 1000).toFixed(0)}K` },
            { label: 'SqFt', value: `${props[i].livingSqft || 0}` },
            { label: 'Beds', value: `${props[i].bedrooms || 0}` },
          ];

          metrics.forEach((metric, idx) => {
            metricsBox
              .append('text')
              .attr('x', 0)
              .attr('y', idx * 16 - 16)
              .attr('text-anchor', 'middle')
              .attr('font-size', '11px')
              .attr('fill', '#94a3b8')
              .text(`${metric.label}: ${metric.value}`);
          });
        } else {
          // Comparison cell
          const cellX = margin + cellSize * (j + 1) - cellSize / 2;
          const cellY = margin + cellSize * (i + 1) - cellSize / 2;

          // Calculate comparison metrics
          const prop1 = props[i];
          const prop2 = props[j];

          const price1 = prop1.listingPrice || 0;
          const price2 = prop2.listingPrice || 0;
          const priceDiff = price2 !== 0 ? ((price1 - price2) / price2) * 100 : 0;

          // Draw comparison circle
          const radius = Math.min(Math.abs(priceDiff) / 5, 30);

          svg
            .append('circle')
            .attr('cx', cellX)
            .attr('cy', cellY)
            .attr('r', radius)
            .attr('fill', priceDiff > 0 ? colors[i] : colors[j])
            .attr('fill-opacity', 0.2)
            .attr('stroke', priceDiff > 0 ? colors[i] : colors[j])
            .attr('stroke-width', 2);

          // Add comparison text
          svg
            .append('text')
            .attr('x', cellX)
            .attr('y', cellY)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('font-size', '12px')
            .attr('font-weight', '600')
            .attr('fill', priceDiff > 0 ? colors[i] : colors[j])
            .text(`${priceDiff > 0 ? '+' : ''}${priceDiff.toFixed(1)}%`);
        }
      }
    }

    // Draw grid lines
    for (let i = 0; i <= props.length + 1; i++) {
      // Vertical lines
      svg
        .append('line')
        .attr('x1', margin + cellSize * i)
        .attr('y1', margin)
        .attr('x2', margin + cellSize * i)
        .attr('y2', margin + cellSize * (props.length + 1))
        .attr('stroke', '#334155')
        .attr('stroke-width', 1);

      // Horizontal lines
      svg
        .append('line')
        .attr('x1', margin)
        .attr('y1', margin + cellSize * i)
        .attr('x2', margin + cellSize * (props.length + 1))
        .attr('y2', margin + cellSize * i)
        .attr('stroke', '#334155')
        .attr('stroke-width', 1);
    }
  }, [properties]);

  return <div ref={containerRef} className="w-full h-[400px] overflow-x-auto"></div>;
}
