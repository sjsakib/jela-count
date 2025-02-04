import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { DistrictFeature, GeoJSONData } from '../types/district';
import html2canvas from 'html2canvas-pro';
import { districtsData } from '../data/districts';

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

  // Add this constant near the top of the component
  const isCompactMode = visitedDistricts.size > 20;

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
    setGeoData(districtsData);
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
      .attr(
        'class',
        d => `district cursor-pointer ${visitedDistricts.has(d.id) ? 'visited' : ''}`
      )
      .attr('fill', d => (visitedDistricts.has(d.id) ? '#4CAF50' : '#e5e7eb'))
      .attr('stroke', '#fff')
      .attr('stroke-width', '0.5')
      .on('click', (_, d) => {
        onDistrictClick(d.id);
        setPopover(prev => ({ ...prev, visible: false }));
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
  // Shared function to generate image
  const generateImage = async () => {
    const shareButton = document.querySelector('[data-share-button]');
    const downloadButton = document.querySelector('[data-download-button]');
    const watermark = document.querySelector('[data-watermark]');

    try {
      // Hide share button and show watermark
      if (shareButton) shareButton.classList.add('hidden');
      if (downloadButton) downloadButton.classList.add('hidden');
      if (watermark) watermark.classList.remove('hidden');

      // Get the target element
      const targetElement = containerRef.current?.parentElement?.parentElement;
      if (!targetElement) return null;

      // Generate canvas
      const canvas = await html2canvas(targetElement, {
        useCORS: true,
        logging: false,
        scale: 3,
      });

      // Create blob
      const blob = await new Promise<Blob>(resolve => {
        canvas.toBlob(blob => resolve(blob!), 'image/png');
      });

      return new File([blob], 'bangladesh-districts.png', { type: 'image/png' });
    } catch (error) {
      console.error('Error generating image:', error);
      return null;
    } finally {
      // Restore UI state
      if (shareButton) shareButton.classList.remove('hidden');
      if (downloadButton) downloadButton.classList.remove('hidden');
      if (watermark) watermark.classList.add('hidden');
    }
  };

  const handleShareClick = async () => {
    const file = await generateImage();
    if (!file) return;

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
      } catch (error) {
        console.error('Share failed:', error);
      }
    }
  };

  const canShare = !!navigator.share && !!navigator.canShare;

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
        <div className={`mt-6 ${isCompactMode ? '' : 'p-4 bg-gray-50'} rounded-lg`}>
          <div
            className={`flex flex-wrap justify-center ${
              isCompactMode ? 'gap-0' : 'gap-2'
            }`}
          >
            {visitedOrder
              .filter(id => visitedDistricts.has(id))
              .map(id => {
                const district = geoData?.features.find(d => d.id === id);
                return district ? (
                  <div
                    key={district.id}
                    className={`text-emerald-700 border border-emerald-200 shadow-sm ${
                      isCompactMode
                        ? 'text-xs px-1 py-0.5'
                        : 'text-sm px-3 py-1 bg-emerald-50 rounded-full'
                    }`}
                  >
                    {district.properties.ADM2_EN}
                  </div>
                ) : null;
              })}
          </div>
        </div>
      )}

      {/* Share/Save Buttons */}
      <div className='flex justify-center gap-2'>
        {canShare && (
          <button
            onClick={handleShareClick}
            data-share-button
            className='px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 cursor-pointer'
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='h-5 w-5'
              viewBox='0 0 20 20'
              fill='currentColor'
            >
              <path d='M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z' />
            </svg>
          </button>
        )}
        <button
          data-download-button
          onClick={async () => {
            const file = await generateImage();
            if (!file) return;

            const link = document.createElement('a');
            link.href = URL.createObjectURL(file);
            link.download = file.name;
            link.click();
            URL.revokeObjectURL(link.href);
          }}
          className='px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 cursor-pointer'
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            className='h-5 w-5'
            viewBox='0 0 20 20'
            fill='currentColor'
          >
            <path
              fillRule='evenodd'
              d='M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z'
              clipRule='evenodd'
            />
          </svg>
        </button>
      </div>
    </div>
  );
};
