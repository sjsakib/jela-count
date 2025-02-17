import { useCallback, useState, useEffect } from 'react';
import { BangladeshMap } from './components/BangladeshMap';

// Storage keys
const VISITED_DISTRICTS_KEY = 'visitedDistricts';
const VISITED_ORDER_KEY = 'visitedOrder';

function App() {
  const [visitedDistricts, setVisitedDistricts] = useState<Set<string>>(() => {
    // Load initial state from localStorage
    const saved = localStorage.getItem(VISITED_DISTRICTS_KEY);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const [visitedOrder, setVisitedOrder] = useState<string[]>(() => {
    // Load initial order from localStorage
    const saved = localStorage.getItem(VISITED_ORDER_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(VISITED_DISTRICTS_KEY, JSON.stringify([...visitedDistricts]));
    localStorage.setItem(VISITED_ORDER_KEY, JSON.stringify(visitedOrder));
  }, [visitedDistricts, visitedOrder]);

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
        <div className='flex justify-center mt-12'>
          <a
            href='https://github.com/sjsakib/zillacounter'
            target='_blank'
            rel='noopener noreferrer'
            className='text-sm text-gray-600 hover:text-blue-800 hover:underline transition-colors duration-200 flex items-center gap-1'
            aria-label='Visit the zillacounter GitHub repository'
          >
            <svg
              height='14'
              viewBox='0 0 16 16'
              width='14'
              className='fill-current'
              aria-hidden='true'
            >
              <path
                fillRule='evenodd'
                d='M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z'
              ></path>
            </svg>
            sjsakib/zillacounter
          </a>
        </div>
      </div>
    </div>
  );
}

export default App;
