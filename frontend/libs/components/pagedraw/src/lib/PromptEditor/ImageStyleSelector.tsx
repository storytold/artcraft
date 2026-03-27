import React, { useRef } from 'react';
import { ImageStyleSelectorProps } from './types';

const ImageStyleSelector: React.FC<ImageStyleSelectorProps> = ({ onImageSelect }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onImageSelect(files[0]);
      // Reset input value so the same file can be selected again
      e.target.value = '';
    }
  };
  
  return (
    <>
      <input 
        type="file" 
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />
    </>
  );
};

export default ImageStyleSelector;