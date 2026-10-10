import React from 'react';
import { GalleryPhoto } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PhotoGallerySectionProps {
  photos: GalleryPhoto[];
  onOpenCPanel?: () => void;
  isAdminLoggedIn?: boolean;
}

export default function PhotoGallerySection({ photos = [] }: PhotoGallerySectionProps) {
  const [currentIndex, setCurrentIndex] = React.useState<number>(0);
  const [isHovered, setIsHovered] = React.useState<boolean>(false);
  const [touchStart, setTouchStart] = React.useState<number | null>(null);

  // Auto-play sliding interval - smooth and gentle
  React.useEffect(() => {
    if (!photos || photos.length <= 1 || isHovered) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % photos.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [photos, isHovered]);

  const handlePrev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!photos || photos.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!photos || photos.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  };

  // Touch swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    setTouchStart(null);
  };

  if (!photos || photos.length === 0) {
    return null;
  }

  return (
    <section 
      id="photo-gallery-banner" 
      className="w-full relative select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pristine Clean Photo Carousel Container - Full width cover edge-to-edge */}
      <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-black shadow-2xl border-2 border-[#d97706]/40">
        <div className="relative w-full h-[260px] sm:h-[400px] md:h-[500px] lg:h-[560px] xl:h-[600px] flex items-center justify-center overflow-hidden">
          
          {/* Main Pure Crystal Clear Photos with Smooth Cross-Fade / Slide Transitions - Full Cover */}
          {photos.map((photo, index) => (
            <div
              key={`slide-${photo.id}`}
              className={`absolute inset-0 w-full h-full transition-all duration-1000 ease-in-out ${
                index === currentIndex
                  ? 'opacity-100 scale-100 z-10 pointer-events-auto'
                  : 'opacity-0 scale-105 z-0 pointer-events-none'
              }`}
            >
              <img
                src={photo.url}
                alt=""
                className="w-full h-full object-cover object-center select-none pointer-events-none"
                referrerPolicy="no-referrer"
                loading={index === 0 ? 'eager' : 'lazy'}
              />
            </div>
          ))}

          {/* Smooth Subtle Navigation Arrows */}
          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                className="absolute left-2.5 sm:left-4 top-1/2 -translate-y-1/2 z-30 h-9 w-9 sm:h-11 sm:w-11 rounded-full bg-black/40 hover:bg-[#d97706] text-white border border-white/20 backdrop-blur-sm flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg cursor-pointer opacity-70 hover:opacity-100"
                aria-label="পূর্ববর্তী ছবি"
              >
                <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="absolute right-2.5 sm:right-4 top-1/2 -translate-y-1/2 z-30 h-9 w-9 sm:h-11 sm:w-11 rounded-full bg-black/40 hover:bg-[#d97706] text-white border border-white/20 backdrop-blur-sm flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg cursor-pointer opacity-70 hover:opacity-100"
                aria-label="পরবর্তী ছবি"
              >
                <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </>
          )}

          {/* Minimal Subtle Bottom Progress Dots */}
          {photos.length > 1 && (
            <div className="absolute bottom-3 inset-x-0 z-30 flex items-center justify-center gap-1.5 pointer-events-auto">
              <div className="bg-black/30 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-white/10">
                {photos.map((_, idx) => (
                  <button
                    key={`dot-${idx}`}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`transition-all duration-300 rounded-full cursor-pointer ${
                      currentIndex === idx
                        ? 'w-6 h-2 bg-[#f59e0b] shadow-sm'
                        : 'w-2 h-2 bg-white/40 hover:bg-white/80'
                    }`}
                    aria-label={`ছবি ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
