import type { ChartProperty } from '@/lib/visualsDataMapper';

interface CategoryProps {
  properties: ChartProperty[];
}

export default function Category06({ properties }: CategoryProps) {
  return (
    <div className="text-white text-center py-20">
      <div className="text-xl font-semibold mb-2">Coming Soon</div>
      <div className="text-gray-400 text-sm">This category is under construction</div>
      <div className="text-gray-500 text-xs mt-2">{properties.length} properties loaded</div>
    </div>
  );
}
