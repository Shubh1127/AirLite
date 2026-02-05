'use client';

import { motion } from 'framer-motion';

export function ListingCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-shrink-0 w-full"
    >
      <div className="group flex-shrink-0 w-full">
        {/* Image Skeleton */}
        <div className="relative aspect-square bg-neutral-200 overflow-hidden rounded-xl mb-3 animate-pulse" />

        {/* Details Skeleton */}
        <div className="flex flex-col justify-center space-y-3">
          {/* Category & Country Skeleton */}
          <div className="space-y-2">
            <div className="h-3 bg-neutral-200 rounded-md w-3/4 animate-pulse" />
          </div>

          {/* Price & Rating Skeleton */}
          <div className="flex items-baseline gap-2">
            <div className="h-4 bg-neutral-200 rounded-md w-1/2 animate-pulse" />
            <div className="h-4 bg-neutral-200 rounded-md w-1/4 animate-pulse" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function SectionTitleSkeleton() {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-2">
        <div className="h-8 bg-neutral-200 rounded-md w-48 animate-pulse" />
      </div>
    </div>
  );
}

export function ListingsGridSkeleton({ count = 4, withTitle = true }: { count?: number; withTitle?: boolean }) {
  return (
    <section>
      {withTitle && <SectionTitleSkeleton />}
      <div className="overflow-x-auto scrollbar-hide lg:overflow-x-visible pb-4 -mx-4 px-4">
        <div className="flex lg:grid gap-4 lg:gap-6 lg:grid-cols-4">
          {Array.from({ length: count }).map((_, index) => (
            <div
              key={index}
              className="flex-shrink-0 w-[45%] sm:w-[48%] lg:w-auto"
            >
              <ListingCardSkeleton />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ReservePanelSkeleton() {
  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 26, stiffness: 260 }}
      className="fixed inset-x-0 bottom-0 bg-white z-50 rounded-t-2xl max-h-[95vh] overflow-y-auto lg:hidden"
    >
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-neutral-200 px-5 py-4 flex items-center justify-between z-10">
        <div className="h-6 bg-neutral-200 rounded-md w-40 animate-pulse" />
      </div>

      {/* Content */}
      <div className="p-5 pb-32 space-y-6">
        {/* Listing Card */}
        <div className="border border-neutral-200 rounded-lg overflow-hidden">
          <div className="relative h-40 bg-neutral-200 animate-pulse" />
          <div className="p-4 space-y-3">
            <div className="h-5 bg-neutral-200 rounded-md w-3/4 animate-pulse" />
            <div className="h-4 bg-neutral-200 rounded-md w-1/2 animate-pulse" />
            <div className="h-4 bg-neutral-200 rounded-md w-1/3 animate-pulse" />
          </div>
        </div>

        {/* Trip Details */}
        <div className="space-y-4">
          <div>
            <div className="h-4 bg-neutral-200 rounded-md w-24 mb-2 animate-pulse" />
            <div className="h-6 bg-neutral-200 rounded-md w-1/2 animate-pulse" />
          </div>
          <div>
            <div className="h-4 bg-neutral-200 rounded-md w-24 mb-2 animate-pulse" />
            <div className="h-6 bg-neutral-200 rounded-md w-1/2 animate-pulse" />
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="border-t border-neutral-200 pt-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-4 bg-neutral-200 rounded-md w-32 animate-pulse" />
            <div className="h-4 bg-neutral-200 rounded-md w-20 animate-pulse" />
          </div>
          <div className="flex items-center justify-between">
            <div className="h-4 bg-neutral-200 rounded-md w-28 animate-pulse" />
            <div className="h-4 bg-neutral-200 rounded-md w-20 animate-pulse" />
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-neutral-200">
            <div className="h-5 bg-neutral-200 rounded-md w-24 animate-pulse" />
            <div className="h-5 bg-neutral-200 rounded-md w-24 animate-pulse" />
          </div>
        </div>

        {/* Button */}
        <div className="h-12 bg-neutral-200 rounded-lg animate-pulse" />
      </div>
    </motion.div>
  );
}

export function ListingDetailSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="lg:hidden -mt-3 border border-t rounded-t-2xl bg-white px-5 pt-6 pb-24 relative z-10"
    >
      {/* Title */}
      <div className="h-7 bg-neutral-200 rounded-md w-3/4 mb-3 animate-pulse" />
      
      {/* Subtitle */}
      <div className="h-4 bg-neutral-200 rounded-md w-full mb-3 animate-pulse" />

      {/* Property Details */}
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-neutral-200 rounded-md w-2/3 animate-pulse" />
      </div>

      {/* Rating */}
      <div className="h-5 bg-neutral-200 rounded-md w-1/3 mb-6 animate-pulse border-b border-neutral-200 pb-6" />

      {/* Host Section */}
      <div className="flex items-center gap-4 mb-6 pb-6 border-b border-neutral-200">
        <div className="w-12 h-12 bg-neutral-200 rounded-full animate-pulse flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-neutral-200 rounded-md w-2/3 animate-pulse" />
          <div className="h-3 bg-neutral-200 rounded-md w-1/2 animate-pulse" />
        </div>
      </div>

      {/* Features Section */}
      <div className="space-y-6 mb-6 pb-6 border-b border-neutral-200">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-start gap-4">
            <div className="w-6 h-6 bg-neutral-200 rounded animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-neutral-200 rounded-md w-1/2 animate-pulse" />
              <div className="h-3 bg-neutral-200 rounded-md w-full animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      {/* Amenities Section */}
      <div className="mb-6">
        <div className="h-6 bg-neutral-200 rounded-md w-32 mb-4 animate-pulse" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-5 h-5 bg-neutral-200 rounded animate-pulse" />
              <div className="h-3 bg-neutral-200 rounded-md w-24 animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mb-6">
        <div className="h-6 bg-neutral-200 rounded-md w-32 mb-4 animate-pulse" />
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="border-b border-neutral-200 pb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-neutral-200 rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-neutral-200 rounded-md w-1/2 animate-pulse" />
                  <div className="h-3 bg-neutral-200 rounded-md w-1/3 animate-pulse" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-neutral-200 rounded-md w-full animate-pulse" />
                <div className="h-3 bg-neutral-200 rounded-md w-5/6 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
