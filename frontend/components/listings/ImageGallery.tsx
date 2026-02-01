'use client';

import { useState } from 'react';
import { ImageViewerModal } from './ImageViewerModal';

interface ImageGalleryProps {
  images: Array<{ url: string; filename: string }>;
  title: string;
}

export function ImageGallery({ images, title }: ImageGalleryProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Get first 5 images or create placeholders
  const mainImage = images?.[0] || null;
  const sideImages = images?.slice(1, 5) || [];
  
  // Fill remaining slots with placeholders
  const totalSlots = 4;
  const placeholders = totalSlots - sideImages.length;

  const handleImageClick = (index: number) => {
    setCurrentImageIndex(index);
    setIsModalOpen(true);
  };

  const handleShowAllPhotos = () => {
    setCurrentImageIndex(0);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="grid grid-cols-4 grid-rows-2 gap-2 h-96 mb-8 rounded-xl overflow-hidden relative">
        {/* Main large image - left side, spans 2 cols and 2 rows */}
        <div className="col-span-2 row-span-2 cursor-pointer" onClick={() => handleImageClick(0)}>
          {mainImage ? (
            <img
              src={mainImage.url}
              alt={title}
              className="w-full h-full object-cover hover:brightness-90 transition"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex flex-col items-center justify-center">
              <img src="/image.png" alt="Logo" className="w-16 h-16 mb-2 opacity-50" />
              <span className="text-gray-500 text-sm">No image available</span>
            </div>
          )}
        </div>

        {/* Side images - right side, 4 smaller images */}
        {sideImages.map((img, idx) => (
          <div 
            key={idx} 
            className="relative cursor-pointer" 
            onClick={() => handleImageClick(idx + 1)}
          >
            <img
              src={img.url}
              alt={`${title} ${idx + 2}`}
              className="w-full h-full object-cover hover:brightness-90 transition"
            />
          </div>
        ))}

        {/* Placeholder images if not enough images */}
        {Array.from({ length: placeholders }).map((_, idx) => (
          <div key={`placeholder-${idx}`} className="bg-gray-200 flex flex-col items-center justify-center">
            <img src="/image.png" alt="Logo" className="w-12 h-12 mb-1 opacity-50" />
            <span className="text-gray-400 text-xs">No more images</span>
          </div>
        ))}

        {/* Show all photos button */}
        {/* {images && images.length > 0 && (
          <button 
            onClick={handleShowAllPhotos}
            className="absolute bottom-4 right-4 bg-white border border-gray-800 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50"
          >
            <span className="flex items-center gap-2">
              <span>⊞</span> Show all photos
            </span>
          </button>
        )} */}
      </div>

      {/* Image Viewer Modal */}
      <ImageViewerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        images={images || []}
        currentIndex={currentImageIndex}
        onNavigate={setCurrentImageIndex}
        title={title}
      />
    </>
  );
}
