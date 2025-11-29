/**
 * Category I: Assigned Schools (11 fields)
 * Charts:
 * 1. SCHOOL TRIPOD - Triangle: Elem/Middle/High distances
 * 2. FAMILY RADIAL - Weighted avg 8.7/10
 * 3. TIER HEATMAP - Rating color grid
 */

import { motion } from 'framer-motion';
import { Radar } from 'react-chartjs-2';
import GlassChart from '../GlassChart';
import type { Property } from '@/types/property';
import { GraduationCap, Star } from 'lucide-react';
import { getIndexColor } from '../chartColors';

interface CategoryIProps {
  properties: Property[];
  onPropertyClick?: (id: string) => void;
}

function getVal<T>(field: { value: T | null } | undefined): T | null {
  return field?.value ?? null;
}

function ratingToNumber(rating: string | null): number {
  if (!rating) return 5;
  const num = parseInt(rating);
  return isNaN(num) ? 5 : num;
}

// I-1: School Tripod Plot
function SchoolTripod({ properties }: CategoryIProps) {
  const schools = properties.reduce((acc, p) => {
    acc.elem += getVal(p.location?.elementaryDistanceMiles) || 0;
    acc.middle += getVal(p.location?.middleDistanceMiles) || 0;
    acc.high += getVal(p.location?.highDistanceMiles) || 0;
    acc.count++;
    return acc;
  }, { elem: 0, middle: 0, high: 0, count: 0 });

  const count = schools.count || 1;
  const avgElem = schools.elem / count;
  const avgMiddle = schools.middle / count;
  const avgHigh = schools.high / count;
  const maxDist = Math.max(avgElem, avgMiddle, avgHigh, 5);

  // Triangle visualization
  const centerX = 100;
  const centerY = 90;
  const radius = 70;

  const points = [
    { x: centerX, y: centerY - radius, label: 'Elementary', value: avgElem },
    { x: centerX - radius * 0.866, y: centerY + radius * 0.5, label: 'Middle', value: avgMiddle },
    { x: centerX + radius * 0.866, y: centerY + radius * 0.5, label: 'High', value: avgHigh },
  ];

  // Scale values (closer = bigger)
  const scaledPoints = points.map(p => ({
    ...p,
    size: Math.max(10, 40 - (p.value / maxDist) * 30),
  }));

  return (
    <GlassChart
      title="School Tripod"
      description="Avg distance to schools"
      chartId="I-school-tripod"
      color="#8B5CF6"
      webAugmented
      webSource="GreatSchools data"
    >
      <div className="h-full relative">
        <svg viewBox="0 0 200 180" className="w-full h-full">
          {/* Triangle outline */}
          <polygon
            points={`${points[0].x},${points[0].y} ${points[1].x},${points[1].y} ${points[2].x},${points[2].y}`}
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1"
          />

          {/* Connecting lines to center */}
          {points.map((p, i) => (
            <line
              key={i}
              x1={centerX}
              y1={centerY}
              x2={p.x}
              y2={p.y}
              stroke="rgba(139, 92, 246, 0.3)"
              strokeWidth="1"
              strokeDasharray="4"
            />
          ))}

          {/* School nodes */}
          {scaledPoints.map((p, i) => (
            <g key={i}>
              <motion.circle
                cx={p.x}
                cy={p.y}
                r={p.size}
                fill="rgba(139, 92, 246, 0.3)"
                stroke="#8B5CF6"
                strokeWidth="2"
                initial={{ r: 0 }}
                animate={{ r: p.size }}
                transition={{ delay: i * 0.2 }}
              />
              <text
                x={p.x}
                y={p.y - p.size - 5}
                textAnchor="middle"
                fill="#FFFFFF"
                fontSize="10"
              >
                {p.label}
              </text>
              <text
                x={p.x}
                y={p.y + 4}
                textAnchor="middle"
                fill="#FFFFFF"
                fontSize="12"
                fontWeight="bold"
              >
                {p.value.toFixed(1)}mi
              </text>
            </g>
          ))}

          {/* Center point */}
          <circle cx={centerX} cy={centerY} r="4" fill="#8B5CF6" />
        </svg>
      </div>
    </GlassChart>
  );
}

// I-2: Family Score Radial
function FamilyScoreRadial({ properties }: CategoryIProps) {
  const scores = properties.reduce((acc, p) => {
    acc.elemRating += ratingToNumber(getVal(p.location?.elementaryRating));
    acc.middleRating += ratingToNumber(getVal(p.location?.middleRating));
    acc.highRating += ratingToNumber(getVal(p.location?.highRating));
    acc.count++;
    return acc;
  }, { elemRating: 0, middleRating: 0, highRating: 0, count: 0 });

  const count = scores.count || 1;
  const avgScore = ((scores.elemRating + scores.middleRating + scores.highRating) / 3) / count;

  const data = {
    labels: ['Elementary', 'Middle School', 'High School'],
    datasets: [{
      label: 'Avg Rating',
      data: [
        scores.elemRating / count,
        scores.middleRating / count,
        scores.highRating / count,
      ],
      backgroundColor: 'rgba(16, 185, 129, 0.2)',
      borderColor: '#10B981',
      borderWidth: 2,
      pointBackgroundColor: '#10B981',
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: { color: 'rgba(255,255,255,0.1)' },
        grid: { color: 'rgba(255,255,255,0.1)' },
        pointLabels: { color: '#FFFFFF', font: { size: 10 } },
        ticks: { color: '#9CA3AF', backdropColor: 'transparent', stepSize: 2 },
        suggestedMin: 0,
        suggestedMax: 10,
      },
    },
    plugins: { legend: { display: false } },
  };

  return (
    <GlassChart
      title="Family Score Radial"
      description={`Weighted avg: ${avgScore.toFixed(1)}/10`}
      chartId="I-family-radial"
      color="#10B981"
    >
      <div className="relative h-full">
        <Radar data={data} options={options} />
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-green-500/20 px-2 py-1 rounded-full">
          <Star className="w-4 h-4 text-green-400 fill-green-400" />
          <span className="text-green-400 font-bold">{avgScore.toFixed(1)}</span>
        </div>
      </div>
    </GlassChart>
  );
}

// I-3: School Tier Heatmap
function SchoolTierHeatmap({ properties }: CategoryIProps) {
  const data = properties.slice(0, 6).map(p => ({
    id: p.id,
    address: getVal(p.address?.streetAddress)?.slice(0, 10) || `#${p.id.slice(0, 4)}`,
    elem: ratingToNumber(getVal(p.location?.elementaryRating)),
    middle: ratingToNumber(getVal(p.location?.middleRating)),
    high: ratingToNumber(getVal(p.location?.highRating)),
    district: getVal(p.location?.schoolDistrictName) || 'Unknown',
  }));

  // School ratings 1-10 mapped to 0-100 for CLUES index colors
  const getRatingColor = (rating: number): string => {
    return getIndexColor(rating * 10).hex;
  };

  return (
    <GlassChart
      title="School Tier Heatmap"
      description="Rating by school level"
      chartId="I-tier-heatmap"
      color="#00D9FF"
    >
      <div className="h-full overflow-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-300 font-bold drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">
              <th className="text-left py-1 px-1">Property</th>
              <th className="text-center py-1 px-1">Elem</th>
              <th className="text-center py-1 px-1">Middle</th>
              <th className="text-center py-1 px-1">High</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <motion.tr
                key={row.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="border-t border-white/5"
              >
                <td className="py-1.5 px-1 text-gray-300">{row.address}</td>
                {[row.elem, row.middle, row.high].map((rating, j) => (
                  <td key={j} className="text-center py-1.5 px-1">
                    <div
                      className="w-8 h-8 mx-auto rounded flex items-center justify-center font-bold"
                      style={{
                        backgroundColor: `${getRatingColor(rating)}30`,
                        color: getRatingColor(rating),
                      }}
                    >
                      {rating}
                    </div>
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>

        {data.length === 0 && (
          <div className="text-gray-300 font-medium text-sm text-center py-8 drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">No school data</div>
        )}
      </div>
    </GlassChart>
  );
}

export default function CategoryI({ properties, onPropertyClick }: CategoryIProps) {
  return (
    <>
      <SchoolTripod properties={properties} />
      <FamilyScoreRadial properties={properties} />
      <SchoolTierHeatmap properties={properties} onPropertyClick={onPropertyClick} />
    </>
  );
}
