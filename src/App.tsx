import { useCallback, useState } from 'react';
import { BangladeshMap } from './components/BangladeshMap';

function App() {
  const [visitedDistricts, setVisitedDistricts] = useState<Set<string>>(new Set());
  const [visitedOrder, setVisitedOrder] = useState<string[]>([]);

  const handleDistrictClick = useCallback((districtId: string) => {
    setVisitedDistricts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(districtId)) {
        newSet.delete(districtId);
        setVisitedOrder(prev => prev.filter(id => id !== districtId));
      } else {
        newSet.add(districtId);
        setVisitedOrder(prev => [...prev, districtId]);
      }
      return newSet;
    });
  }, []);

  return (
    <div className='min-h-screen bg-gray-100 py-8'>
      <div className='container mx-auto px-4'>
        <div className='bg-white rounded-lg shadow-lg p-6'>
          <BangladeshMap
            onDistrictClick={handleDistrictClick}
            visitedDistricts={visitedDistricts}
            visitedOrder={visitedOrder}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
