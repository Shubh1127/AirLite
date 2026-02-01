'use client';

import Link from 'next/link';

interface ListingCardProps {
  id: number;
  title: string;
  image: string;
  price: number;
  rating: number;
  reviews: number;
}

export function ListingCard({ id, title, image, price, rating, reviews }: ListingCardProps) {
  return (
    <Link href={`/listings/${id}`}>
      <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition cursor-pointer">
        <div className="relative h-48 overflow-hidden bg-gray-200">
          <img src={image} alt={title} className="w-full h-full object-cover hover:scale-110 transition" />
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-lg truncate">{title}</h3>
          <div className="flex items-center justify-between mt-2">
            <span className="text-yellow-500">★ {rating}</span>
            <span className="text-gray-600 text-sm">({reviews})</span>
          </div>
          <p className="text-lg font-bold mt-3">${price}/night</p>
        </div>
      </div>
    </Link>
  );
}
