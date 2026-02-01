'use client';
import React from 'react';
import { ListingGrid } from '@/components/listings/ListingGrid';
import { Search, Minus, Plus, Heart, Loader2 } from 'lucide-react';
import Link from 'next/link';

import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { listingsAPI } from '@/lib/listings';

interface Listing {
  _id: string;
  title: string;
  location: string;
  country?: string;
  category:string,
  pricePerNight: number;
  images?: { url: string; filename: string }[];
  rating?: number;
  reviewCount?: number;
  geometry?: {
    type: string;
    coordinates: [number, number];
  };
}
export default function Home() {
  const [date, setDate] = useState<Date>();
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isGuestsOpen, setIsGuestsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<'where' | 'when' | 'who' | null>(null);
  const [guests, setGuests] = useState({
    adults: 0,
    children: 0,
    infants: 0,
    pets: 0,
  });
  const [listings, setListings] = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyListings, setNearbyListings] = useState<Listing[]>([]);

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  };

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.log('Error getting location:', error);
          // Set default location (Delhi, India) if permission denied
          setUserLocation({ lat: 28.6139, lng: 77.2090 });
        }
      );
    } else {
      // Set default location if geolocation not supported
      setUserLocation({ lat: 28.6139, lng: 77.2090 });
    }
  }, []);

  // Fetch all listings on component mount
  useEffect(() => {
    const fetchAllListings = async () => {
      setLoadingListings(true);
      try {
        const data = await listingsAPI.getAll();
        setListings(data);
      } catch (err) {
        console.error('Error fetching listings:', err);
      } finally {
        setLoadingListings(false);
      }
    };

    fetchAllListings();
  }, []);

  // Filter nearby listings when user location and listings are available
  useEffect(() => {
    if (userLocation && listings.length > 0) {
      const nearby = listings.filter((listing) => {
        if (listing.geometry?.coordinates) {
          const [lng, lat] = listing.geometry.coordinates;
          const distance = calculateDistance(userLocation.lat, userLocation.lng, lat, lng);
          return distance <= 600; // 600km radius
        }
        return false;
      });
      setNearbyListings(nearby);
    }
  }, [userLocation, listings]);

  const updateGuests = (type: keyof typeof guests, increment: boolean) => {
    setGuests((prev) => ({
      ...prev,
      [type]: increment ? prev[type] + 1 : Math.max(0, prev[type] - 1),
    }));
  };

  const totalGuests = guests.adults + guests.children + guests.infants;
  const guestText = totalGuests === 0 ? 'Add guests' : `${totalGuests} guest${totalGuests > 1 ? 's' : ''}${guests.pets > 0 ? `, ${guests.pets} pet${guests.pets > 1 ? 's' : ''}` : ''}`;

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      {/* Search Bar */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-4xl mx-auto px-4 py-6 ">
          <div className="relative flex items-center gap-4 bg-gray-300 border border-neutral-200 rounded-full shadow-lg p-2">
            {/* Animated Background */}
            <div 
              className={`absolute top-2 bottom-2 bg-white rounded-full shadow-md transition-all duration-500 ease-in-out ${
                activeSection === 'where' 
                  ? 'left-2 w-[calc(33.333%-8px)]' 
                  : activeSection === 'when' 
                  ? 'left-[calc(33.333%+8px)] w-[calc(33.333%-8px)]' 
                  : activeSection === 'who' 
                  ? 'left-[calc(66.666%+8px)] w-[calc(33.333%-8px)]' 
                  : 'hidden'
              }`}
            />

            {/* Where Section */}
            <div 
              className={`flex-1 px-6 py-3 border-r border-neutral-200 rounded-full cursor-pointer relative z-10 transition-all duration-300`}
              onClick={() => setActiveSection('where')}
            >
              <div className="text-xs text-neutral-500 font-medium mb-1">Where</div>
              <input
                type="text"
                placeholder="Search destinations"
                className="w-full text-sm outline-none font-medium text-neutral-900 bg-transparent"
                onFocus={() => setActiveSection('where')}
              />
            </div>

            {/* When Section */}
            <Popover open={isDatePickerOpen} onOpenChange={(open) => {
              setIsDatePickerOpen(open);
              if (open) setActiveSection('when');
              else if (activeSection === 'when') setActiveSection(null);
            }}>
              <PopoverTrigger asChild>
                <div 
                  className={`flex-1 px-6 py-3 border-r border-neutral-200 cursor-pointer rounded-full relative z-10 transition-all duration-300`}
                  onClick={() => setActiveSection('when')}
                >
                  <div className="text-xs text-neutral-800 font-medium mb-1">When</div>
                  <div className={`w-full text-sm font-medium ${date ? 'text-neutral-900' : 'text-neutral-500'}`}>
                    {date ? format(date, 'PPP') : 'Add dates'}
                  </div>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => {
                    setDate(newDate);
                    setIsDatePickerOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {/* Who Section */}
            <Popover open={isGuestsOpen} onOpenChange={(open) => {
              setIsGuestsOpen(open);
              if (open) setActiveSection('who');
              else if (activeSection === 'who') setActiveSection(null);
            }}>
              <PopoverTrigger asChild>
                <div 
                  className={`flex-1 px-6 py-3 cursor-pointer rounded-full relative z-10 transition-all duration-300`}
                  onClick={() => setActiveSection('who')}
                >
                  <div className="text-xs text-neutral-500 font-medium mb-1">Who</div>
                  <div className={`w-full text-sm font-medium ${totalGuests === 0 ? 'text-neutral-500' : 'text-neutral-900'}`}>
                    {guestText}
                  </div>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-96 p-6" align="end">
                <div className="space-y-6">
                  {/* Adults */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">Adults</div>
                      <div className="text-sm text-neutral-600">Ages 13 or above</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateGuests('adults', false)}
                        disabled={guests.adults === 0}
                        className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center hover:border-neutral-900 disabled:opacity-25 disabled:cursor-not-allowed transition"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-medium">{guests.adults}</span>
                      <button
                        onClick={() => updateGuests('adults', true)}
                        className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center hover:border-neutral-900 transition"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Children */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">Children</div>
                      <div className="text-sm text-neutral-600">Ages 2–12</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateGuests('children', false)}
                        disabled={guests.children === 0}
                        className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center hover:border-neutral-900 disabled:opacity-25 disabled:cursor-not-allowed transition"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-medium">{guests.children}</span>
                      <button
                        onClick={() => updateGuests('children', true)}
                        className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center hover:border-neutral-900 transition"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Infants */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">Infants</div>
                      <div className="text-sm text-neutral-600">Under 2</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateGuests('infants', false)}
                        disabled={guests.infants === 0}
                        className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center hover:border-neutral-900 disabled:opacity-25 disabled:cursor-not-allowed transition"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-medium">{guests.infants}</span>
                      <button
                        onClick={() => updateGuests('infants', true)}
                        className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center hover:border-neutral-900 transition"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Pets */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">Pets</div>
                      <a href="#" className="text-sm text-neutral-600 underline">Bringing a service animal?</a>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateGuests('pets', false)}
                        disabled={guests.pets === 0}
                        className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center hover:border-neutral-900 disabled:opacity-25 disabled:cursor-not-allowed transition"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-medium">{guests.pets}</span>
                      <button
                        onClick={() => updateGuests('pets', true)}
                        className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center hover:border-neutral-900 transition"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Search Button */}
            <button className="bg-rose-500 hover:bg-rose-600 text-white rounded-full p-3 flex-shrink-0 transition relative z-10">
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

       {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        

        {/* Listings Section */}
        {loadingListings ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-neutral-600 mr-2" />
            <span className="text-neutral-600">Loading listings...</span>
          </div>
        ) : listings.length > 0 ? (
          <section>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-neutral-900">
                   Places to stay
                  {/* Lisitngs you'll be loved ({listings.length}) */}
                </h2>
                <span className="text-neutral-600">→</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {listings.map((listing) => (
                <ListingCardComponent key={listing._id} listing={listing} />
              ))}
            </div>
          </section>
        ) : (
          <div className="text-center py-12">
            <p className="text-neutral-600 text-lg">No listings available.</p>
          </div>
        )}
        {/* Nearby Listings Section */}
        {!loadingListings && nearbyListings.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-neutral-900">
                  Listings near you ({nearbyListings.length})
                </h2>
                <span className="text-neutral-600">→</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {nearbyListings.slice(0, 8).map((listing) => (
                <ListingCardComponent key={listing._id} listing={listing} />
              ))}
            </div>
          </section>
        )}
      </main>
    </main>
  );
}
function ListingCardComponent({ listing }: { listing: Listing }) {
  const [isFavorite, setIsFavorite] = React.useState(false);

  return (
    <Link href={`/listings/${listing._id}`} className="block">
      <div className="rounded-2xl overflow-hidden group hover:shadow-lg transition-shadow flex-shrink-0 w-full">
        <div className="relative h-64 bg-neutral-200 overflow-hidden">
          {/* Image */}
          <img
            src={listing.images?.[0]?.url || 'https://via.placeholder.com/400x300'}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {/* Guest Favorite Badge */}
          {listing.rating && listing.rating >= 4.5 && (
            <div className="absolute top-4 left-4 bg-white rounded-full px-3 py-1 text-xs font-semibold text-neutral-900 shadow-md">
              Guest favourite
            </div>
          )}
          {/* Heart Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsFavorite(!isFavorite);
            }}
            className="absolute top-4 right-4 bg-white/80 hover:bg-white rounded-full p-2 transition-all"
          >
            <Heart
              className={`w-5 h-5 transition-colors ${
                isFavorite ? 'fill-rose-500 text-rose-500' : 'text-neutral-600'
              }`}
            />
          </button>
        </div>

      {/* Listing Details */}
      <div className="p-4 flex flex-col justify-center bg-white">
        <h3 className="text-sm font-semibold text-neutral-900 mb-1">{listing.category} in {listing.country}</h3>
        {/* <p className="text-xs text-neutral-600 mb-3">{listing.location}, {listing.country || 'India'}</p> */}

        <div className="flex items-baseline gap-1 mb-2">
          <span className="text-sm font-semibold text-gray-600">₹{listing.pricePerNight.toLocaleString()}</span>
          <span className="text-xs font-semibold text-gray-600">per night</span>
          <span className='border-3 w-1 h-1 rounded-[50%]'></span>
          {listing.rating && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-neutral-900 font-medium">★ {listing.rating.toFixed(2)}</span>
            {/* {listing.reviewCount && <span className="text-xs text-neutral-600">({listing.reviewCount} reviews)</span>} */}
          </div>
        )}
        </div>

        
      </div>
    </div>
    </Link>
  );
}

