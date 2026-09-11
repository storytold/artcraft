import React, { useState, useRef } from 'react';
import { X } from 'lucide-react';
import { ImagePreviewProps } from './types';

const ImagePreview: React.FC<ImagePreviewProps> = ({ image, onUpdate, onRemove }) => {
  const [showControls, setShowControls] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  const handleWeightChange = (clientY: number) => {
    if (sliderRef.current) {
      const rect = sliderRef.current.getBoundingClientRect();
      const height = rect.height;
      const relativeY = clientY - rect.top;
      // Calculate inverse value (1.0 at top, 0.0 at bottom)
      const value = Math.max(0, Math.min(1, 1 - (relativeY / height)));
      onUpdate(image.id, { weight: parseFloat(value.toFixed(1)) });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    handleWeightChange(e.clientY);
    
    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      handleWeightChange(e.clientY);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  return (
    <div 
      className="relative h-20 w-20 rounded-md overflow-hidden group"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => !isDragging && setShowControls(false)}
    >
      <img 
        src={image.url} 
        alt="Style reference" 
        className="w-full h-full object-cover"
      />
      
      {showControls && (
        <>
          <button 
            className="absolute top-1 right-1 bg-black bg-opacity-50 rounded-full p-0.5 text-white hover:bg-opacity-70 transition-colors"
            onClick={() => onRemove(image.id)}
          >
            <X size={16} />
          </button>
          
          <div 
            ref={sliderRef}
            className="absolute inset-0 bg-gradient-to-b from-transparent to-black bg-opacity-40 cursor-ns-resize"
            onMouseDown={handleMouseDown}
          >
            <div 
              className="absolute left-0 right-0 h-0.5 bg-white" 
              style={{ bottom: `${image.weight * 100}%` }}
            />
            <div className="absolute bottom-1 right-1 text-xs font-medium text-white">
              {image.weight.toFixed(1)}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ImagePreview;