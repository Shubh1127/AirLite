'use client';

import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: Array<{ url: string; filename: string }>;
  currentIndex: number;
  onNavigate: (index: number) => void;
  title: string;
}

export function ImageViewerModal({
  isOpen,
  onClose,
  images,
  currentIndex,
  onNavigate,
  title,
}: ImageViewerModalProps) {
  if (!isOpen || !images || images.length === 0) return null;

  const currentImage = images[currentIndex];
  
  // Extract room type from filename or use generic description
  const getImageDescription = (filename: string, index: number) => {
    const name = filename.toLowerCase();
    if (name.includes('bedroom') || name.includes('bed')) return 'Bedroom';
    if (name.includes('living') || name.includes('lounge')) return 'Living Room';
    if (name.includes('kitchen')) return 'Kitchen';
    if (name.includes('bathroom') || name.includes('bath')) return 'Bathroom';
    if (name.includes('balcony') || name.includes('terrace')) return 'Balcony/Terrace';
    if (name.includes('exterior') || name.includes('outside')) return 'Exterior View';
    return `Photo ${index + 1}`;
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      onNavigate(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      onNavigate(currentIndex + 1);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 rounded-full hover:bg-white/10 transition"
      >
        <X className="w-8 h-8" />
      </button>

      {/* Navigation Buttons */}
      {currentIndex > 0 && (
        <button
          onClick={handlePrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 p-3 rounded-full hover:bg-white/10 transition"
        >
          <ChevronLeft className="w-10 h-10" />
        </button>
      )}

      {currentIndex < images.length - 1 && (
        <button
          onClick={handleNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 p-3 rounded-full hover:bg-white/10 transition"
        >
          <ChevronRight className="w-10 h-10" />
        </button>
      )}

      {/* Content Container */}
      <div className="w-full h-full max-w-7xl mx-auto p-8 flex items-center gap-8">
        {/* Left Side - Image Details */}
        <div className="w-1/4 text-white space-y-4">
          <div>
            <h3 className="text-2xl font-semibold mb-2">
              {getImageDescription(currentImage.filename, currentIndex)}
            </h3>
            <p className="text-gray-300 text-sm mb-4">{title}</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-400">
              Photo {currentIndex + 1} of {images.length}
            </p>
          </div>

          {/* Thumbnail Preview */}
          <div className="mt-8">
            <p className="text-sm text-gray-400 mb-3">All photos</p>
            <div className="grid grid-cols-3 gap-2 max-h-96 overflow-y-auto pr-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => onNavigate(idx)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition ${
                    idx === currentIndex
                      ? 'border-white'
                      : 'border-transparent hover:border-gray-400'
                  }`}
                >
                  <img
                    src={img.url}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Large Image */}
        <div className="flex-1 h-full flex items-center justify-center">
          <img
            src={currentImage.url}
            alt={getImageDescription(currentImage.filename, currentIndex)}
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      </div>
    </div>
  );
}
