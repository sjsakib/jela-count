import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { DistrictFeature, GeoJSONData } from '../types/district';
import html2canvas from 'html2canvas-pro';

interface BangladeshMapProps {
  onDistrictClick: (districtId: string) => void;
  visitedDistricts: Set<string>;
  visitedOrder?: string[];
}
export const BangladeshMap = ({
  onDistrictClick,
  visitedDistricts,
  visitedOrder = [],
}: BangladeshMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [geoData, setGeoData] = useState<GeoJSONData | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [popover, setPopover] = useState<{
    x: number;
    y: number;
    name: string;
    visible: boolean;
  }>({ x: 0, y: 0, name: '', visible: false });

  // Calculate progress
  const progress = geoData
    ? Math.round((visitedDistricts.size / geoData.features.length) * 100)
    : 0;

  // Add resize observer
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(entries => {
      const { width } = entries[0].contentRect;
      setDimensions({ width, height: width * 1.25 });
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    // Load Bangladesh GeoJSON data
    fetch('/bangladesh-districts.json')
      .then(response => response.json())
      .then(data => setGeoData(data));
  }, []);

  useEffect(() => {
    if (!geoData || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const { width, height } = dimensions;

    // Clear previous content
    svg.selectAll('*').remove();

    // Create projection
    const projection = d3.geoMercator().fitSize([width, height], geoData);

    // Create path generator
    const path = d3.geoPath().projection(projection);

    // Draw districts
    const districts = svg
      .selectAll('path')
      .data(geoData.features)
      .enter()
      .append('path')
      .attr('d', path)
      .attr('class', d => `district ${visitedDistricts.has(d.id) ? 'visited' : ''}`)
      .attr('fill', d => (visitedDistricts.has(d.id) ? '#4CAF50' : '#e5e7eb'))
      .attr('stroke', '#fff')
      .attr('stroke-width', '0.5')
      .on('click', (_, d) => {
        onDistrictClick(d.id);
        setPopover(prev => ({ ...prev, visible: false }));
      });

    // Add hover effects
    districts
      .on('mouseover', function (this: SVGPathElement, _, d: DistrictFeature) {
        d3.select(this).attr('fill', visitedDistricts.has(d.id) ? '#45a049' : '#d1d5db');
      })
      .on('mouseout', function (this: SVGPathElement, _, d: DistrictFeature) {
        d3.select(this).attr('fill', visitedDistricts.has(d.id) ? '#4CAF50' : '#e5e7eb');
      });

    // Replace the text labels and hover effects with popover
    districts
      .on(
        'mouseover',
        function (this: SVGPathElement, event: MouseEvent, d: DistrictFeature) {
          d3.select(this).attr(
            'fill',
            visitedDistricts.has(d.id) ? '#45a049' : '#d1d5db'
          );
          const [x, y] = d3.pointer(event, containerRef.current);
          setPopover({
            x,
            y,
            name: d.properties.ADM2_EN,
            visible: true,
          });
        }
      )
      .on('mouseout', function (this: SVGPathElement, _, d: DistrictFeature) {
        d3.select(this).attr('fill', visitedDistricts.has(d.id) ? '#4CAF50' : '#e5e7eb');
        setPopover(prev => ({ ...prev, visible: false }));
      });

    // Add checkmark icons for visited districts (on top of labels)
    if (visitedDistricts.size > 0) {
      geoData.features.forEach(feature => {
        if (visitedDistricts.has(feature.id)) {
          const centroid = path.centroid(feature);
          svg
            .append('text')
            .attr('x', centroid[0])
            .attr('y', centroid[1])
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('class', 'text-white text-sm cursor-pointer')
            .text('✓')
            .on('click', () => {
              onDistrictClick(feature.id);
              setPopover(prev => ({ ...prev, visible: false }));
            });
        }
      });
    }
  }, [geoData, visitedDistricts, onDistrictClick, dimensions]);

  // Updated function to handle sharing
  const handleShareClick = async () => {
    try {
      // Hide the share button temporarily
      const shareButton = document.querySelector('[data-share-button]');
      const watermark = document.querySelector('[data-watermark]');
      if (shareButton) {
        shareButton.classList.add('hidden');
      }
      // Show watermark
      if (watermark) {
        watermark.classList.remove('hidden');
      }

      // Get the target element (the entire container)
      const targetElement = containerRef.current?.parentElement?.parentElement;
      if (!targetElement) return;

      // Create a canvas element with the full content
      const canvas = await html2canvas(targetElement, {
        useCORS: true,
        logging: false,
        scale: 3, // Increase quality
      });

      // Show the share button again and hide watermark
      if (shareButton) {
        shareButton.classList.remove('hidden');
      }
      if (watermark) {
        watermark.classList.add('hidden');
      }

      // Convert canvas to blob
      const blob = await new Promise<Blob>(resolve => {
        canvas.toBlob(blob => {
          resolve(blob!);
        }, 'image/png');
      });

      // Create file object
      const file = new File([blob], 'bangladesh-districts.png', {
        type: 'image/png',
      });

      // Try Web Share API first if supported
      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        try {
          await navigator.share({
            title: 'My Visited Districts in Bangladesh',
            text: `I've visited ${visitedDistricts.size} districts in Bangladesh (${progress}%)!\n\nCount yours at: ${window.location.href}`,
            files: [file],
          });
          return;
        } catch (error) {
          // User cancelled or share failed - fall through to download method
          console.log('Share failed:', error);
        }
      }

      // Fall back to download method
      const link = document.createElement('a');
      link.href = URL.createObjectURL(file);
      link.download = file.name;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Error generating screenshot:', error);
      // Ensure share button is visible even if there's an error
      const shareButton = document.querySelector('[data-share-button]');
      if (shareButton) {
        shareButton.classList.remove('invisible');
      }
    }
  };

  return (
    <div className='space-y-4 bg-white rounded-lg'>
      {/* Map Container */}
      <div ref={containerRef} className='relative w-full max-w-[600px] mx-auto'>
        {/* Watermark - hidden by default */}
        <div
          data-watermark
          className='hidden absolute bottom-2 left-1/2 transform -translate-x-1/2 text-gray-400 text-sm opacity-50'
        >
          zillacounter.pages.dev
        </div>
        {/* Circular Progress Indicator */}
        <div className='absolute right-[20%] w-24 h-24'>
          <div className='relative w-full h-full'>
            <svg className='w-full h-full transform -rotate-90'>
              <circle
                className='text-gray-200'
                strokeWidth='8'
                stroke='currentColor'
                fill='transparent'
                r='40'
                cx='48'
                cy='48'
              />
              <circle
                className='text-green-500'
                strokeWidth='8'
                strokeLinecap='round'
                stroke='currentColor'
                fill='transparent'
                r='40'
                cx='48'
                cy='48'
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - progress / 100)}`}
              />
            </svg>
            <div className='absolute inset-0 flex flex-col items-center justify-center'>
              <span className='text-lg font-semibold text-gray-700'>{progress}%</span>
              <span className='text-xs text-gray-500'>
                {visitedDistricts.size}/{geoData?.features.length || 0}
              </span>
            </div>
          </div>
        </div>

        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          preserveAspectRatio='xMidYMid meet'
          className='w-full h-auto'
        />
        {/* Add popover */}
        {popover.visible && (
          <div
            className='bg-white absolute text-gray-800 px-2 py-1 rounded-full shadow-xl text-xs pointer-events-none border border-gray-100'
            style={{
              left: popover.x,
              top: popover.y - 50,
              transform: 'translateX(-50%)',
            }}
          >
            {popover.name}
          </div>
        )}
      </div>

      {/* Visited Districts List */}
      {visitedDistricts.size > 0 && (
        <div className='mt-6 p-4 bg-gray-50 rounded-lg'>
          <div className='flex flex-wrap justify-center gap-2'>
            {visitedOrder
              .filter(id => visitedDistricts.has(id))
              .map(id => {
                const district = geoData?.features.find(d => d.id === id);
                return district ? (
                  <div
                    key={district.id}
                    className='px-3 py-1 text-sm text-emerald-700 bg-emerald-50 rounded-full border border-emerald-200 shadow-sm'
                  >
                    {district.properties.ADM2_EN}
                  </div>
                ) : null;
              })}
          </div>
        </div>
      )}

      {/* Share Button */}
      <div className='flex justify-center'>
        <button
          onClick={handleShareClick}
          data-share-button
          className='px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
        >
          Share
        </button>
      </div>
    </div>
  );
};
