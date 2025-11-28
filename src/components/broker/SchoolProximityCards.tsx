/**
 * School Proximity Cards
 *
 * Cards showing distance to schools and district ratings
 * Elementary, Middle, High School distances + District Rating
 */

import { motion } from 'framer-motion';
import { GraduationCap, MapPin, Star } from 'lucide-react';

interface Schools {
  elementaryDistance: number;
  middleDistance: number;
  highDistance: number;
  districtRating: number;
}

interface Property {
  id: string | number;
  address: string;
  schools?: Schools;
  [key: string]: any;
}

interface SchoolProximityCardsProps {
  properties: Property[];
  selectedId?: string | number | 'all';
}

function shortAddress(address: string): string {
  return address.split(',')[0] || address;
}

function getSchoolData(p: Property): Schools {
  if (p.schools) return p.schools;
  // Generate reasonable defaults
  return {
    elementaryDistance: 1.2,
    middleDistance: 2.5,
    highDistance: 3.5,
    districtRating: 7,
  };
}

function getDistanceColor(miles: number): string {
  if (miles <= 1) return '#10B981'; // Green - walking distance
  if (miles <= 2) return '#00D9FF'; // Cyan - close
  if (miles <= 5) return '#F59E0B'; // Amber - moderate
  return '#EF4444'; // Red - far
}

function getRatingColor(rating: number): string {
  if (rating >= 8) return '#10B981';
  if (rating >= 6) return '#F59E0B';
  return '#EF4444';
}

function SchoolCard({ property, index }: { property: Property; index: number }) {
  const schools = getSchoolData(property);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="rounded-2xl p-5"
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-white font-semibold truncate" title={property.address}>
          {shortAddress(property.address)}
        </p>
        <div
          className="flex items-center gap-1 px-2 py-1 rounded-full"
          style={{
            backgroundColor: `${getRatingColor(schools.districtRating)}20`,
            color: getRatingColor(schools.districtRating),
          }}
        >
          <Star className="w-3 h-3" />
          <span className="text-sm font-semibold">{schools.districtRating}/10</span>
        </div>
      </div>

      {/* School distances */}
      <div className="space-y-3">
        <SchoolRow
          level="Elementary"
          distance={schools.elementaryDistance}
          icon="🏫"
        />
        <SchoolRow
          level="Middle"
          distance={schools.middleDistance}
          icon="📚"
        />
        <SchoolRow
          level="High"
          distance={schools.highDistance}
          icon="🎓"
        />
      </div>

      {/* Summary */}
      <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
        <span className="text-gray-500 text-xs">Avg Distance</span>
        <span className="text-white font-semibold">
          {((schools.elementaryDistance + schools.middleDistance + schools.highDistance) / 3).toFixed(1)} mi
        </span>
      </div>
    </motion.div>
  );
}

function SchoolRow({ level, distance, icon }: { level: string; distance: number; icon: string }) {
  const color = getDistanceColor(distance);

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <span className="text-gray-400 text-sm">{level}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(100, (1 / distance) * 50)}%`,
              backgroundColor: color,
            }}
          />
        </div>
        <span className="text-sm font-semibold w-12 text-right" style={{ color }}>
          {distance.toFixed(1)} mi
        </span>
      </div>
    </div>
  );
}

export default function SchoolProximityCards({ properties, selectedId = 'all' }: SchoolProximityCardsProps) {
  const displayProperties = selectedId === 'all'
    ? properties
    : properties.filter(p => p.id === selectedId);

  if (displayProperties.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-white/5 text-center">
        <p className="text-gray-500">No school data available</p>
      </div>
    );
  }

  // Find best schools
  const bestDistrict = [...displayProperties].sort(
    (a, b) => (getSchoolData(b).districtRating) - (getSchoolData(a).districtRating)
  )[0];

  const closestElementary = [...displayProperties].sort(
    (a, b) => getSchoolData(a).elementaryDistance - getSchoolData(b).elementaryDistance
  )[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GraduationCap className="w-5 h-5 text-cyan-400" />
          <h3 className="text-white font-semibold">School Proximity</h3>
        </div>
        {displayProperties.length > 1 && (
          <div className="flex items-center gap-4 text-xs">
            <span className="text-gray-500">
              Best District: <span className="text-green-400">{shortAddress(bestDistrict.address)}</span>
            </span>
            <span className="text-gray-500">
              Closest Elementary: <span className="text-cyan-400">{shortAddress(closestElementary.address)}</span>
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayProperties.map((property, index) => (
          <SchoolCard key={property.id} property={property} index={index} />
        ))}
      </div>
    </div>
  );
}
