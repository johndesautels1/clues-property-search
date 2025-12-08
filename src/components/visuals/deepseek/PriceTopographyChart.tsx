import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { ChartProperty } from '@/lib/visualsDataMapper';

interface PriceTopographyChartProps {
  properties: ChartProperty[];
}

export default function PriceTopographyChart({ properties }: PriceTopographyChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || properties.length === 0) return;

    // Clear previous chart
    d3.select(containerRef.current).selectAll('*').remove();

    const width = 500;
    const height = 320;

    const svg = d3
      .select(containerRef.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    // Property colors
    const colors = ['#3b82f6', '#10b981', '#8b5cf6'];

    // Generate simulated topography data
    const gridSize = 40;
    const data: Array<{ x: number; y: number; value: number }> = [];

    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        let value = 0;

        properties.slice(0, 3).forEach((property, idx) => {
          const dx = (x / gridSize - idx / (properties.length - 1) * 0.8 - 0.1) * 2;
          const dy = (y / gridSize - 0.5) * 2;
          const distance = Math.sqrt(dx * dx + dy * dy);

          const peakHeight = (property.listingPrice || 0) / 3000000;
          value += peakHeight * Math.exp(-distance * 3);
        });

        data.push({
          x: (x / gridSize) * width,
          y: (y / gridSize) * height,
          value: value * 100,
        });
      }
    }

    // Create color scale
    const colorScale = d3
      .scaleSequential()
      .domain([0, d3.max(data, (d) => d.value)!])
      .interpolator(d3.interpolateBlues);

    // Draw contour lines using density estimation
    const contourGenerator = d3
      .contourDensity<{ x: number; y: number; value: number }>()
      .x((d) => d.x)
      .y((d) => d.y)
      .size([width, height])
      .bandwidth(15)
      .thresholds(15);

    const contours = contourGenerator(data);

    svg
      .selectAll('path')
      .data(contours)
      .enter()
      .append('path')
      .attr('d', d3.geoPath())
      .attr('fill', (d: any) => colorScale(d.value))
      .attr('stroke', '#1e293b')
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.8);

    // Add property markers
    properties.slice(0, 3).forEach((property, idx) => {
      const x = (idx / (properties.length - 1) * 0.8 + 0.1) * width;
      const y = height / 2;

      // Marker
      svg
        .append('circle')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', 8)
        .attr('fill', colors[idx])
        .attr('stroke', 'white')
        .attr('stroke-width', 2);

      // Label
      svg
        .append('text')
        .attr('x', x)
        .attr('y', y - 15)
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .attr('font-weight', '600')
        .attr('fill', colors[idx])
        .text(property.address?.split(' ')[0] || `Prop ${idx + 1}`);
    });

    // Title
    svg
      .append('text')
      .attr('x', 10)
      .attr('y', 20)
      .attr('font-size', '14px')
      .attr('font-weight', '600')
      .attr('fill', '#e2e8f0')
      .text('Value Density Topography');
  }, [properties]);

  return <div ref={containerRef} className="w-full h-[320px]"></div>;
}
