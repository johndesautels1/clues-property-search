import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { ChartProperty } from '@/lib/visualsDataMapper';

interface MarketRadarChartProps {
  properties: ChartProperty[];
}

export default function MarketRadarChart({ properties }: MarketRadarChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || properties.length === 0) return;

    // Clear previous chart
    d3.select(containerRef.current).selectAll('*').remove();

    const width = 500;
    const height = 320;
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const radius = Math.min(width, height) / 2 - 40;

    const svg = d3
      .select(containerRef.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    // Metrics for radar
    const metrics = [
      { key: 'listingPrice', label: 'Price', normalize: true },
      { key: 'bedrooms', label: 'Beds', normalize: true },
      { key: 'bathrooms', label: 'Baths', normalize: true },
      { key: 'livingSqft', label: 'SqFt', normalize: true },
      { key: 'lotSizeSqft', label: 'Lot', normalize: true },
      { key: 'yearBuilt', label: 'Age', normalize: true, invert: true },
    ];

    // Calculate normalized values
    const normalizedData = properties.slice(0, 3).map((property) => {
      const values = metrics.map((metric) => {
        let value = property[metric.key as keyof ChartProperty] as number || 0;
        if (metric.key === 'yearBuilt' && metric.invert) {
          value = 2024 - value; // Convert year to age
        }
        return value;
      });

      // Normalize to 0-1 scale
      const maxValues = metrics.map((metric, i) =>
        Math.max(
          ...properties.map((p) => {
            let val = p[metric.key as keyof ChartProperty] as number || 0;
            if (metric.key === 'yearBuilt' && metric.invert) {
              val = 2024 - val;
            }
            return val;
          })
        )
      );

      const normalized = values.map((v, i) => (maxValues[i] > 0 ? v / maxValues[i] : 0));
      return { property, values, normalized };
    });

    // Draw radar grid
    const levels = 5;
    const angleSlice = (Math.PI * 2) / metrics.length;

    for (let level = 0; level < levels; level++) {
      const levelFactor = radius * ((level + 1) / levels);

      svg
        .append('circle')
        .attr('r', levelFactor)
        .attr('fill', 'none')
        .attr('stroke', '#334155')
        .attr('stroke-width', 1);
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
        .attr('stroke', '#475569')
        .attr('stroke-width', 1);

      // Label
      svg
        .append('text')
        .attr('x', Math.cos(angle) * (radius + 25))
        .attr('y', Math.sin(angle) * (radius + 25))
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .attr('font-size', '12px')
        .attr('fill', '#94a3b8')
        .text(metric.label);
    });

    // Property colors
    const colors = ['#3b82f6', '#10b981', '#8b5cf6'];

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

      // Data points
      data.normalized.forEach((value, i) => {
        const angle = angleSlice * i - Math.PI / 2;
        const x = Math.cos(angle) * value * radius;
        const y = Math.sin(angle) * value * radius;

        svg
          .append('circle')
          .attr('cx', x)
          .attr('cy', y)
          .attr('r', 4)
          .attr('fill', colors[idx])
          .attr('stroke', 'white')
          .attr('stroke-width', 1);
      });
    });

    // Legend
    const legend = svg
      .append('g')
      .attr('transform', `translate(${-width / 2 + 20}, ${-height / 2 + 20})`);

    normalizedData.forEach((data, idx) => {
      const g = legend.append('g').attr('transform', `translate(0, ${idx * 20})`);

      g.append('rect')
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', colors[idx]);

      g.append('text')
        .attr('x', 18)
        .attr('y', 10)
        .attr('font-size', '12px')
        .attr('fill', '#e2e8f0')
        .text(data.property.address?.split(',')[0] || `Property ${idx + 1}`);
    });
  }, [properties]);

  return <div ref={containerRef} className="w-full h-[320px]"></div>;
}
