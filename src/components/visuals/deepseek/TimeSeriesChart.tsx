import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { ChartProperty } from '@/lib/visualsDataMapper';

interface TimeSeriesChartProps {
  properties: ChartProperty[];
}

export default function TimeSeriesChart({ properties }: TimeSeriesChartProps) {
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

    // Prepare timeline data - simulate historical prices
    const allDates: Date[] = [];
    const propertyTimelines = properties.slice(0, 3).map((property, idx) => {
      const listingPrice = property.listingPrice || 0;
      const lastSalePrice = property.lastSalePrice || listingPrice * 0.85;
      const lastSaleDate = property.lastSaleDate ? new Date(property.lastSaleDate) : new Date(2022, 0, 1);
      const currentDate = new Date();

      // Generate price history points
      const priceHistory = [
        { date: lastSaleDate, price: lastSalePrice, event: 'Last Sale' },
        {
          date: new Date(lastSaleDate.getTime() + 180 * 24 * 60 * 60 * 1000),
          price: lastSalePrice * 1.03,
          event: 'Appraisal',
        },
        {
          date: new Date(lastSaleDate.getTime() + 365 * 24 * 60 * 60 * 1000),
          price: lastSalePrice * 1.08,
          event: 'Market Adjustment',
        },
        { date: currentDate, price: listingPrice, event: 'Current Listing' },
      ];

      priceHistory.forEach((point) => allDates.push(point.date));

      return {
        property,
        priceHistory,
        color: colors[idx],
      };
    });

    const minDate = d3.min(allDates)!;
    const maxDate = d3.max(allDates) || new Date();

    // Create scales
    const xScale = d3.scaleTime().domain([minDate, maxDate]).range([0, innerWidth]);

    const maxPrice = d3.max(propertyTimelines, (pt) => d3.max(pt.priceHistory, (h) => h.price))!;

    const yScale = d3
      .scaleLinear()
      .domain([0, maxPrice * 1.1])
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
      .call(d3.axisBottom(xScale).ticks(5))
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
    propertyTimelines.forEach((timeline) => {
      const line = d3
        .line<{ date: Date; price: number }>()
        .x((d) => xScale(d.date))
        .y((d) => yScale(d.price))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(timeline.priceHistory)
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', timeline.color)
        .attr('stroke-width', 2);

      // Draw points
      timeline.priceHistory.forEach((point) => {
        g.append('circle')
          .attr('cx', xScale(point.date))
          .attr('cy', yScale(point.price))
          .attr('r', 4)
          .attr('fill', timeline.color)
          .attr('stroke', 'white')
          .attr('stroke-width', 2);
      });

      // Add current price marker
      g.append('circle')
        .attr('cx', xScale(new Date()))
        .attr('cy', yScale(timeline.property.listingPrice || 0))
        .attr('r', 6)
        .attr('fill', timeline.color)
        .attr('stroke', 'white')
        .attr('stroke-width', 2)
        .style('filter', 'drop-shadow(0 0 4px rgba(0,0,0,0.2))');
    });

    // Legend
    const legend = g.append('g').attr('transform', `translate(${innerWidth - 100}, 10)`);

    propertyTimelines.forEach((timeline, idx) => {
      const g2 = legend.append('g').attr('transform', `translate(0, ${idx * 20})`);

      g2.append('rect').attr('width', 12).attr('height', 12).attr('fill', timeline.color);

      g2.append('text')
        .attr('x', 18)
        .attr('y', 10)
        .attr('font-size', '11px')
        .attr('fill', '#e2e8f0')
        .text(timeline.property.address?.split(',')[0] || `Property ${idx + 1}`);
    });
  }, [properties]);

  return <div ref={containerRef} className="w-full h-[320px]"></div>;
}
