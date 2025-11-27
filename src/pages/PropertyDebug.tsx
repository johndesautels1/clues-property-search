/**
 * Debug page to show actual property data structure
 */

import { useParams } from 'react-router-dom';
import { usePropertyStore } from '@/store/propertyStore';

export default function PropertyDebug() {
  const { id } = useParams();
  const { getPropertyById, getFullPropertyById } = usePropertyStore();

  const property = id ? getPropertyById(id) : undefined;
  const fullProperty = id ? getFullPropertyById(id) : undefined;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Property Data Debug</h1>

      <div className="glass-card p-6 mb-6">
        <h2 className="text-xl font-bold text-quantum-cyan mb-4">PropertyCard (Basic)</h2>
        <pre className="bg-black/50 p-4 rounded text-xs text-gray-300 overflow-auto">
          {JSON.stringify(property, null, 2)}
        </pre>
      </div>

      <div className="glass-card p-6">
        <h2 className="text-xl font-bold text-quantum-cyan mb-4">Full Property (138 fields)</h2>
        <pre className="bg-black/50 p-4 rounded text-xs text-gray-300 overflow-auto max-h-[600px]">
          {JSON.stringify(fullProperty, null, 2)}
        </pre>
      </div>

      {!fullProperty && (
        <div className="glass-card p-6 mt-6 border-2 border-red-500">
          <h3 className="text-xl font-bold text-red-500 mb-2">NO FULL PROPERTY DATA FOUND!</h3>
          <p className="text-gray-300">
            This property only has basic PropertyCard data. The full 138-field Property object is missing.
          </p>
        </div>
      )}
    </div>
  );
}
