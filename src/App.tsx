import { useState } from 'react';
import { BangladeshMap } from './components/BangladeshMap';

function App() {
  const [visitedDistricts, setVisitedDistricts] = useState<Set<string>>(new Set());

  const handleDistrictClick = (districtId: string) => {
    setVisitedDistricts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(districtId)) {
        newSet.delete(districtId);
      } else {
        newSet.add(districtId);
      }
      return newSet;
    });
  };

  return (
    <div className='min-h-screen bg-gray-100 py-8'>
      <div className='container mx-auto px-4'>
        <div className='bg-white rounded-lg shadow-lg p-6'>
          <BangladeshMap
            onDistrictClick={handleDistrictClick}
            visitedDistricts={visitedDistricts}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
