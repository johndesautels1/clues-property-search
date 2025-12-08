import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { ChartProperty } from '@/lib/visualsDataMapper';

interface ValueMomentumChartProps {
  properties: ChartProperty[];
}

export default function ValueMomentumChart({ properties }: ValueMomentumChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || properties.length === 0) return;

    // Clear previous chart
    d3.select(containerRef.current).selectAll('*').remove();

    const width = 500;
    const height = 320;
    const margin = { top: 20, right: 30, bottom: 40, left: 60 };

    const svg = d3
      .select(containerRef.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Property colors
    const colors = ['#3b82f6', '#10b981', '#8b5cf6'];

    // Prepare data points - using available price fields
    const dataPoints: any[] = [];
    properties.slice(0, 3).forEach((property, idx) => {
      const listing = property.listingPrice || 0;
      const marketEstimate = property.marketValueEstimate || listing * 0.95;
      const assessed = property.assessedValue || listing * 0.9;
      const lastSale = property.lastSalePrice || listing * 0.85;

      dataPoints.push(
        { property, type: 'Last Sale', value: lastSale, color: colors[idx], opacity: 0.7 },
        { property, type: 'Assessed', value: assessed, color: colors[idx], opacity: 0.8 },
        { property, type: 'Market Est', value: marketEstimate, color: colors[idx], opacity: 0.9 },
        { property, type: 'Listing', value: listing, color: colors[idx], opacity: 1 }
      );
    });

    // Create scales
    const xScale = d3
      .scalePoint()
      .domain(['Last Sale', 'Assessed', 'Market Est', 'Listing'])
      .range([0, innerWidth])
      .padding(0.5);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(dataPoints, (d) => d.value)! * 1.1])
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
      .attr('fill', '#94a3b8');

    g.append('g')
      .call(
        d3.axisLeft(yScale).tickFormat((d) => {
          const val = d.valueOf();
          if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
          if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
          return `$${val}`;
        })
      )
      .selectAll('text')
      .attr('font-size', '12px')
      .attr('fill', '#94a3b8');

    // Draw lines for each property
    properties.slice(0, 3).forEach((property, idx) => {
      const propertyPoints = dataPoints.filter((d) => d.property.id === property.id);

      const line = d3
        .line<any>()
        .x((d) => xScale(d.type)!)
        .y((d) => yScale(d.value));

      g.append('path')
        .datum(propertyPoints)
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', colors[idx])
        .attr('stroke-width', 2)
        .attr('opacity', 0.3);

      // Draw points
      propertyPoints.forEach((point) => {
        g.append('circle')
          .attr('cx', xScale(point.type)!)
          .attr('cy', yScale(point.value))
          .attr('r', 5)
          .attr('fill', point.color)
          .attr('opacity', point.opacity)
          .attr('stroke', 'white')
          .attr('stroke-width', 2);
      });
    });

    // Legend
    const legend = g.append('g').attr('transform', `translate(${innerWidth - 100}, 10)`);

    properties.slice(0, 3).forEach((property, idx) => {
      const g2 = legend.append('g').attr('transform', `translate(0, ${idx * 20})`);

      g2.append('rect').attr('width', 12).attr('height', 12).attr('fill', colors[idx]);

      g2.append('text')
        .attr('x', 18)
        .attr('y', 10)
        .attr('font-size', '11px')
        .attr('fill', '#e2e8f0')
        .text(property.address?.split(',')[0] || `Property ${idx + 1}`);
    });
  }, [properties]);

  return <div ref={containerRef} className="w-full h-[320px]"></div>;
}
