'use client';

import { useEffect, useState } from 'react';
import { ListingCard } from './ListingCard';
import { listingsAPI } from '@/lib/listings';

export function ListingGrid() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const data = await listingsAPI.getAll();
        setListings(data);
      } catch (error) {
        console.error('Error fetching listings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (listings.length === 0) {
    return <div className="text-center py-8">No listings found.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {listings.map((listing: any) => (
        <ListingCard 
          key={listing._id} 
          id={listing._id}
          title={listing.title}
          image={listing.images?.[0]?.url || 'https://via.placeholder.com/400x300'}
          price={listing.pricePerNight}
          rating={listing.rating || 4.5}
          reviews={listing.reviewCount || 0}
        />
      ))}
    </div>
  );
}
