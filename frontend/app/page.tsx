"use client";
import React from "react";
import { ListingGrid } from "@/components/listings/ListingGrid";
import { ListingsGridSkeleton } from "@/components/listings/ListingSkeleton";
import {
  Search,
  Minus,
  Plus,
  Heart,
  Loader2,
  X,
  ChevronDown,
  MapPin,
  MessageCircle,
  User,
  Home as HomeIcon,
} from "lucide-react";
import Link from "next/link";

import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { listingsAPI } from "@/lib/listings";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import { wishlistAPI } from "@/lib/wishlist";

interface Listing {
  _id: string;
  title: string;
  location: string;
  country?: string;
  category: string;
  pricePerNight: number;
  images?: { url: string; filename: string }[];
  rating?: number;
  reviewCount?: number;
  geometry?: {
    type: string;
    coordinates: [number, number];
  };
}

const imagesForSuggestion = {
  image1:
    "https://a0.muscache.com/im/pictures/airbnb-platform-assets/AirbnbPlatformAssets-hawaii-autosuggest-destination-icons-1/original/1f9cf4a3-3653-4a28-992d-efcbbf5fd2ba.png",
  image2:
    "https://a0.muscache.com/im/pictures/airbnb-platform-assets/AirbnbPlatformAssets-hawaii-autosuggest-destination-icons-2/original/55937af0-ba1d-4119-8715-3b3146c3d0e8.png",
  image3:
    "https://a0.muscache.com/im/pictures/airbnb-platform-assets/AirbnbPlatformAssets-hawaii-autosuggest-destination-icons-3/original/1a5f5f6e-1d2e-4f6a-8e2-5f6d7bb0e4b2.png",
  image4:
    "https://a0.muscache.com/im/pictures/airbnb-platform-assets/AirbnbPlatformAssets-hawaii-autosuggest-destination-icons-4/original/3e2f4d8e-5f6a-4d3b-9c3-2c4d5e6f7a8b.png",
};
export default function Home() {
  const [date, setDate] = useState<Date>();
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isGuestsOpen, setIsGuestsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<
    "where" | "when" | "who" | null
  >(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchResults, setSearchResults] = useState<Listing[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [mobileSearchStep, setMobileSearchStep] = useState<
    "where" | "when" | "who"
  >("where");
  const [guests, setGuests] = useState({
    adults: 0,
    children: 0,
    infants: 0,
    pets: 0,
  });
  const [listings, setListings] = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [nearbyListings, setNearbyListings] = useState<Listing[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number => {
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

  const { user, isAuthenticated } = useAuthStore();

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
          console.log("Error getting location:", error);
          // Set default location (Delhi, India) if permission denied
          setUserLocation({ lat: 28.6139, lng: 77.209 });
        },
      );
    } else {
      // Set default location if geolocation not supported
      setUserLocation({ lat: 28.6139, lng: 77.209 });
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
        console.error("Error fetching listings:", err);
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
          const distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            lat,
            lng,
          );
          return distance <= 600; // 600km radius
        }
        return false;
      });
      setNearbyListings(nearby);
    }
  }, [userLocation, listings]);

  // Fetch user's wishlist
  const { token } = useAuthStore();
  useEffect(() => {
    const fetchWishlist = async () => {
      if (isAuthenticated && token) {
        try {
          const wishlistData = await wishlistAPI.getWishlist(token);
          const ids =
            wishlistData.listings?.map((listing: any) => listing._id) || [];
          setWishlistIds(ids);
        } catch (error) {
          console.error("Error fetching wishlist:", error);
        }
      }
    };

    fetchWishlist();
  }, [isAuthenticated, token]);

  // Debounce search input for suggestions
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 300);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  const getLocalSuggestions = (query: string) => {
    if (!query) return [];
    const lowerQuery = query.toLowerCase();
    const suggestionSet = new Set<string>();

    listings.forEach((listing) => {
      [listing.location, listing.country].filter(Boolean).forEach((value) => {
        const text = value!.toLowerCase();
        if (text.includes(lowerQuery)) {
          suggestionSet.add(value!);
        }
      });
    });

    return Array.from(suggestionSet).slice(0, 8);
  };

  useEffect(() => {
    let isActive = true;

    const fetchSuggestions = async () => {
      if (!debouncedQuery) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      try {
        const data = await listingsAPI.suggestions(debouncedQuery);
        if (!isActive) return;
        const apiSuggestions = Array.isArray(data?.suggestions)
          ? data.suggestions
          : [];
        const localFallback =
          apiSuggestions.length === 0
            ? getLocalSuggestions(debouncedQuery)
            : [];
        setSuggestions(
          apiSuggestions.length > 0 ? apiSuggestions : localFallback,
        );
        setShowSuggestions(true);
      } catch (error) {
        if (!isActive) return;
        console.error("Error fetching suggestions:", error);
        setSuggestions(getLocalSuggestions(debouncedQuery));
        setShowSuggestions(true);
      }
    };

    fetchSuggestions();

    return () => {
      isActive = false;
    };
  }, [debouncedQuery]);

  const updateGuests = (type: keyof typeof guests, increment: boolean) => {
    setGuests((prev) => ({
      ...prev,
      [type]: increment ? prev[type] + 1 : Math.max(0, prev[type] - 1),
    }));
  };

  const totalGuests = guests.adults + guests.children + guests.infants;
  const guestText =
    totalGuests === 0
      ? "Add guests"
      : `${totalGuests} guest${totalGuests > 1 ? "s" : ""}${guests.pets > 0 ? `, ${guests.pets} pet${guests.pets > 1 ? "s" : ""}` : ""}`;
  const isSearchReady =
    Boolean(searchQuery.trim()) && Boolean(date) && totalGuests > 0;

  const handleSearch = () => {
    const query = searchQuery.trim().toLowerCase();
    let results = listings;

    if (query) {
      results = listings.filter((listing) => {
        const haystack = [
          listing.title,
          listing.location,
          listing.country,
          listing.category,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return haystack.includes(query);
      });
    }

    setSearchResults(results);
    setHasSearched(true);
    setActiveSection(null);
    setIsDatePickerOpen(false);
    setIsGuestsOpen(false);
  };

  const handleWishlistToggle = async (
    listingId: string,
    isInWishlist: boolean,
  ) => {
    if (!isAuthenticated || !token) {
      // Optionally redirect to login
      return;
    }

    try {
      if (isInWishlist) {
        // Remove from wishlist
        await wishlistAPI.removeFromWishlist(listingId, token);
        setWishlistIds((prev) => prev.filter((id) => id !== listingId));
      } else {
        // Add to wishlist
        await wishlistAPI.addToWishlist(listingId, token);
        setWishlistIds((prev) => [...prev, listingId]);
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error);
    }
  };

  const displayedListings = hasSearched ? searchResults : listings;

  return (
    <main className="min-h-screen bg-white pb-20 lg:pb-0">
      {/* Mobile Search Button - Shows on mobile only, hidden when modal is open */}
      {!isMobileSearchOpen && (
        <div className="lg:hidden bg-white  border-neutral-200">
          <div className="px-4 py-4">
            <button
              onClick={() => setIsMobileSearchOpen(true)}
              className="w-full flex justify-center font-semibold items-center gap-3 px-4 py-5 bg-white border border-neutral-300 rounded-full shadow-md hover:shadow-lg transition-shadow"
            >
              <Search className="w-4 h-4 text-neutral-600" />
              <span className="text-sm text-center font-medium text-black">
                Start your search
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Mobile Search Modal */}
      <AnimatePresence>
        {isMobileSearchOpen && (
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 bg-white z-50 lg:hidden overflow-y-auto flex flex-col"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-neutral-200 px-4 py-3 flex items-center gap-3">
              <button
                onClick={() => {
                  setIsMobileSearchOpen(false);
                  setMobileSearchStep("where");
                }}
                className="p-2 hover:bg-neutral-100 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-semibold">
                {mobileSearchStep === "where" && "Where?"}
                {mobileSearchStep === "when" && "When?"}
                {mobileSearchStep === "who" && "Who?"}
              </h2>
            </div>

            {/* Search Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Step 1: Where */}
              {mobileSearchStep === "where" && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-3"
                >
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search destinations"
                      className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      autoFocus
                    />
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  </div>

                  {/* Suggested destinations */}
                  {showSuggestions && suggestions.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      className="space-y-2"
                    >
                      <p className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">
                        Suggested destinations
                      </p>
                      <div className="space-y-3">
                        {suggestions.map((suggestion, index) => (
                          <motion.button
                            key={suggestion}
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => {
                              setSearchQuery(suggestion);
                              setShowSuggestions(false);
                            }}
                            className="w-full flex items-start gap-4 p-3 hover:bg-neutral-50 rounded-lg transition text-left"
                          >
                            <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <img
                                className="w-12 h-12"
                                src={
                                  Object.values(imagesForSuggestion)[index % 4]
                                }
                                alt={suggestion}
                              />
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-neutral-900">
                                {suggestion}
                              </div>
                              <div className="text-sm text-neutral-500">
                                Popular destination
                              </div>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* Step 2: When */}
              {mobileSearchStep === "when" && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-lg font-semibold mb-4">
                      Select your dates
                    </h3>
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(newDate) => {
                        setDate(newDate);
                      }}
                      className="w-full"
                    />
                  </div>

                  {date && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-4 bg-neutral-50 rounded-lg"
                    >
                      <div className="text-sm text-neutral-600">
                        Selected date:
                      </div>
                      <div className="text-lg font-semibold text-neutral-900">
                        {format(date, "PPP")}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* Step 3: Who */}
              {mobileSearchStep === "who" && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Adults */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">Adults</div>
                      <div className="text-sm text-neutral-600">
                        Ages 13 or above
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateGuests("adults", false)}
                        disabled={guests.adults === 0}
                        className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center hover:border-neutral-900 disabled:opacity-25 disabled:cursor-not-allowed transition"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-medium">
                        {guests.adults}
                      </span>
                      <button
                        onClick={() => updateGuests("adults", true)}
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
                        onClick={() => updateGuests("children", false)}
                        disabled={guests.children === 0}
                        className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center hover:border-neutral-900 disabled:opacity-25 disabled:cursor-not-allowed transition"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-medium">
                        {guests.children}
                      </span>
                      <button
                        onClick={() => updateGuests("children", true)}
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
                        onClick={() => updateGuests("infants", false)}
                        disabled={guests.infants === 0}
                        className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center hover:border-neutral-900 disabled:opacity-25 disabled:cursor-not-allowed transition"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-medium">
                        {guests.infants}
                      </span>
                      <button
                        onClick={() => updateGuests("infants", true)}
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
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateGuests("pets", false)}
                        disabled={guests.pets === 0}
                        className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center hover:border-neutral-900 disabled:opacity-25 disabled:cursor-not-allowed transition"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-medium">
                        {guests.pets}
                      </span>
                      <button
                        onClick={() => updateGuests("pets", true)}
                        className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center hover:border-neutral-900 transition"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Footer with dynamic actions */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="sticky bottom-0 bg-white border-t border-neutral-200 p-4 space-y-2"
            >
              <div className="flex items-center gap-2">
                {mobileSearchStep === "where" && searchQuery.trim() && (
                  <>
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setDate(undefined);
                        setGuests({
                          adults: 0,
                          children: 0,
                          infants: 0,
                          pets: 0,
                        });
                        setMobileSearchStep("where");
                      }}
                      className="flex-1 text-sm font-semibold py-3 rounded-lg border border-neutral-300 hover:bg-neutral-50 transition"
                    >
                      Clear all
                    </button>
                    <button
                      onClick={() => setMobileSearchStep("when")}
                      className="flex-1 bg-neutral-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-neutral-800 transition"
                    >
                      Next
                    </button>
                  </>
                )}

                {mobileSearchStep === "when" && date && (
                  <>
                    <button
                      onClick={() => setMobileSearchStep("where")}
                      className="flex-1 text-sm font-semibold py-3 rounded-lg border border-neutral-300 hover:bg-neutral-50 transition"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setMobileSearchStep("who")}
                      className="flex-1 bg-neutral-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-neutral-800 transition"
                    >
                      Next
                    </button>
                  </>
                )}

                {mobileSearchStep === "when" && !date && (
                  <>
                    <button
                      onClick={() => setMobileSearchStep("where")}
                      className="flex-1 text-sm font-semibold py-3 rounded-lg border border-neutral-300 hover:bg-neutral-50 transition"
                    >
                      Back
                    </button>
                    <button
                      disabled
                      className="flex-1 bg-neutral-300 text-neutral-600 px-6 py-3 rounded-lg font-semibold cursor-not-allowed"
                    >
                      Next
                    </button>
                  </>
                )}

                {mobileSearchStep === "who" && totalGuests > 0 && (
                  <>
                    <button
                      onClick={() => setMobileSearchStep("when")}
                      className="flex-1 text-sm font-semibold py-3 rounded-lg border border-neutral-300 hover:bg-neutral-50 transition"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => {
                        handleSearch();
                        setIsMobileSearchOpen(false);
                        setMobileSearchStep("where");
                      }}
                      className="flex-1 bg-rose-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-rose-600 transition flex items-center justify-center gap-2"
                    >
                      <Search className="w-5 h-5" />
                      Search
                    </button>
                  </>
                )}

                {mobileSearchStep === "who" && totalGuests === 0 && (
                  <>
                    <button
                      onClick={() => setMobileSearchStep("when")}
                      className="flex-1 text-sm font-semibold py-3 rounded-lg border border-neutral-300 hover:bg-neutral-50 transition"
                    >
                      Back
                    </button>
                    <button
                      disabled
                      className="flex-1 bg-neutral-300 text-neutral-600 px-6 py-3 rounded-lg font-semibold cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Search className="w-5 h-5" />
                      Search
                    </button>
                  </>
                )}
              </div>

              {/* Always show in Where step or when we need Clear All */}
              {mobileSearchStep === "where" && !searchQuery.trim() && (
                <button
                  onClick={() => {
                    setIsMobileSearchOpen(false);
                    setMobileSearchStep("where");
                  }}
                  className="w-full text-sm font-semibold py-3 rounded-lg text-neutral-600 hover:bg-neutral-50 transition"
                >
                  Cancel
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Search Bar - Hidden on mobile */}
      <div className="hidden lg:block bg-white border-b border-neutral-200">
        <div className="max-w-4xl mx-auto px-4 py-6 ">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 bg-gray-300 border border-neutral-200 rounded-full shadow-lg p-2 min-w-0">
              {/* Animated Background */}
              <div
                className={`absolute inset-2 bg-white rounded-full shadow-md transition-transform duration-500 ease-in-out ${
                  activeSection ? "opacity-100" : "opacity-0"
                }`}
                style={{
                  width: "calc(33.333% - 0.5rem)",
                  transform:
                    activeSection === "where"
                      ? "translateX(0%)"
                      : activeSection === "when"
                        ? "translateX(100%)"
                        : activeSection === "who"
                          ? "translateX(200%)"
                          : "translateX(0%)",
                }}
              />

              <div className="relative z-10 grid grid-cols-3">
                {/* Where Section */}
                <div
                  className="relative px-6 py-3 border-r border-neutral-200 rounded-full cursor-pointer transition-all duration-300"
                  onClick={() => setActiveSection("where")}
                >
                  <div className="text-xs text-neutral-500 font-medium mb-1">
                    Where
                  </div>
                  <input
                    type="text"
                    placeholder="Search destinations"
                    className="w-full text-sm outline-none font-medium text-neutral-900 bg-transparent"
                    onFocus={() => {
                      setActiveSection("where");
                      if (suggestions.length > 0) setShowSuggestions(true);
                    }}
                    onBlur={() => {
                      setTimeout(() => setShowSuggestions(false), 150);
                    }}
                    value={searchQuery}
                    onChange={(event) => {
                      setSearchQuery(event.target.value);
                      setShowSuggestions(true);
                    }}
                  />
                  {showSuggestions && searchQuery.trim().length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-2 w-full bg-white border border-neutral-200 rounded-2xl shadow-lg overflow-hidden z-20">
                      <ul className="py-2">
                        {suggestions.length > 0 ? (
                          suggestions.map((suggestion) => (
                            <li
                              key={suggestion}
                              className="px-4 py-2 w-full text-sm text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                              onMouseDown={(event) => {
                                event.preventDefault();
                                setSearchQuery(suggestion);
                                setShowSuggestions(false);
                              }}
                            >
                              {suggestion}
                            </li>
                          ))
                        ) : (
                          <li className="px-4 py-2 text-sm text-neutral-500">
                            No listings found.
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>

                {/* When Section */}
                <Popover
                  open={isDatePickerOpen}
                  onOpenChange={(open) => {
                    setIsDatePickerOpen(open);
                    if (open) setActiveSection("when");
                  }}
                >
                  <PopoverTrigger asChild>
                    <div
                      className="px-6 py-3 border-r border-neutral-200 cursor-pointer rounded-full transition-all duration-300"
                      onClick={() => setActiveSection("when")}
                    >
                      <div className="text-xs text-neutral-800 font-medium mb-1">
                        When
                      </div>
                      <div
                        className={`w-full text-sm font-medium ${date ? "text-neutral-900" : "text-neutral-500"}`}
                      >
                        {date ? format(date, "PPP") : "Add dates"}
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
                <Popover
                  open={isGuestsOpen}
                  onOpenChange={(open) => {
                    setIsGuestsOpen(open);
                    if (open) setActiveSection("who");
                  }}
                >
                  <PopoverTrigger asChild>
                    <div
                      className="px-4 py-3 cursor-pointer rounded-full transition-all duration-300 flex items-center justify-between gap-3"
                      onClick={() => setActiveSection("who")}
                    >
                      <div className="min-w-0">
                        <div className="text-xs text-neutral-500 font-medium mb-1">
                          Who
                        </div>
                        <div
                          className={`w-full text-sm font-medium ${totalGuests === 0 ? "text-neutral-500" : "text-neutral-900"}`}
                        >
                          {guestText}
                        </div>
                      </div>
                      <button
                        className="bg-rose-500 cursor-pointer px-4 flex items-center gap-2 hover:bg-rose-600 text-white rounded-full p-3 flex-shrink-0 transition"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleSearch();
                        }}
                      >
                        <span
                          className={`text-sm  font-semibold overflow-hidden transition-all duration-300 ${
                            isSearchReady
                              ? "max-w-[60px] opacity-100"
                              : "max-w-0 opacity-0"
                          }`}
                        >
                          Search
                        </span>
                        <Search className="w-5 h-5" />
                      </button>
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-96 p-6" align="end">
                    <div className="space-y-6">
                      {/* Adults */}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">Adults</div>
                          <div className="text-sm text-neutral-600">
                            Ages 13 or above
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => updateGuests("adults", false)}
                            disabled={guests.adults === 0}
                            className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center hover:border-neutral-900 disabled:opacity-25 disabled:cursor-not-allowed transition"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-medium">
                            {guests.adults}
                          </span>
                          <button
                            onClick={() => updateGuests("adults", true)}
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
                          <div className="text-sm text-neutral-600">
                            Ages 2–12
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => updateGuests("children", false)}
                            disabled={guests.children === 0}
                            className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center hover:border-neutral-900 disabled:opacity-25 disabled:cursor-not-allowed transition"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-medium">
                            {guests.children}
                          </span>
                          <button
                            onClick={() => updateGuests("children", true)}
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
                          <div className="text-sm text-neutral-600">
                            Under 2
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => updateGuests("infants", false)}
                            disabled={guests.infants === 0}
                            className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center hover:border-neutral-900 disabled:opacity-25 disabled:cursor-not-allowed transition"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-medium">
                            {guests.infants}
                          </span>
                          <button
                            onClick={() => updateGuests("infants", true)}
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
                          <a
                            href="#"
                            className="text-sm text-neutral-600 underline"
                          >
                            Bringing a service animal?
                          </a>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => updateGuests("pets", false)}
                            disabled={guests.pets === 0}
                            className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center hover:border-neutral-900 disabled:opacity-25 disabled:cursor-not-allowed transition"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-medium">
                            {guests.pets}
                          </span>
                          <button
                            onClick={() => updateGuests("pets", true)}
                            className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center hover:border-neutral-900 transition"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Listings Section */}
        {loadingListings ? (
          <>
            <ListingsGridSkeleton count={4} withTitle={true} />
            <section className="mt-16">
              <ListingsGridSkeleton count={4} withTitle={true} />
            </section>
          </>
        ) : displayedListings.length > 0 ? (
          <section>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-neutral-900">
                  {hasSearched ? "Search results" : "Popular Homes"}
                  {/* Lisitngs you'll be loved ({listings.length}) */}
                </h2>
                {/* <span className="text-neutral-600">→</span> */}
              </div>
            </div>

            <div className="overflow-x-auto scrollbar-hide lg:overflow-x-visible pb-4 -mx-4 px-4">
              <div className="flex lg:grid gap-4 lg:gap-6 lg:grid-cols-4">
                {displayedListings.map((listing) => (
                  <div
                    key={listing._id}
                    className="flex-shrink-0 w-[45%] sm:w-[48%] lg:w-auto"
                  >
                    <ListingCardComponent
                      listing={listing}
                      checkInDate={date}
                      wishlistIds={wishlistIds}
                      onWishlistToggle={handleWishlistToggle}
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : (
          <div className="text-center py-12">
            <p className="text-neutral-600 text-lg">
              {hasSearched ? "No listings found." : "No listings available."}
            </p>
          </div>
        )}
        {/* Nearby Listings Section */}
        {!loadingListings && !hasSearched && nearbyListings.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-neutral-900">
                  Listings near you
                  {/* ({nearbyListings.length}) */}
                </h2>
                {/* <span className="text-neutral-600">→</span> */}
              </div>
            </div>

            <div className="overflow-x-auto scrollbar-hide lg:overflow-x-visible pb-4 -mx-4 px-4">
              <div className="flex lg:grid gap-4 lg:gap-6 lg:grid-cols-4">
                {nearbyListings.slice(0, 8).map((listing) => (
                  <div
                    key={listing._id}
                    className="flex-shrink-0 w-[45%] sm:w-[48%] lg:w-auto"
                  >
                    <ListingCardComponent
                      listing={listing}
                      checkInDate={date}
                      wishlistIds={wishlistIds}
                      onWishlistToggle={handleWishlistToggle}
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

    </main>
  );
}
function ListingCardComponent({
  listing,
  checkInDate,
  wishlistIds,
  onWishlistToggle,
}: {
  listing: Listing;
  checkInDate?: Date;
  wishlistIds: string[];
  onWishlistToggle: (listingId: string, isInWishlist: boolean) => void;
}) {
  const isFavorite = wishlistIds.includes(listing._id);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsLoading(true);
    try {
      await onWishlistToggle(listing._id, isFavorite);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Link
      href={`/listings/${listing._id}${checkInDate ? `?checkIn=${checkInDate.toISOString()}` : ""}`}
      className="block"
    >
      <div className="group flex-shrink-0 w-full">
        <div className="relative aspect-square bg-neutral-200 overflow-hidden rounded-xl mb-3">
          {/* Image */}
          <img
            src={
              listing.images?.[0]?.url || "https://via.placeholder.com/400x300"
            }
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {/* Guest Favorite Badge */}
          {listing.rating && listing.rating >= 4.5 && (
            <div className="absolute top-3 left-3 bg-white rounded-full px-2 py-1 text-[11px] sm:text-xs font-semibold text-neutral-900 shadow-md">
              Guest favourite
            </div>
          )}
          {/* Heart Button */}
          <button
            onClick={handleWishlistToggle}
            disabled={isLoading}
            className="absolute top-3 right-3 bg-white/80 hover:bg-white rounded-full p-2 transition-all disabled:opacity-50"
          >
            <Heart
              className={`w-3 h-3 sm:w-5 sm:h-5 transition-colors ${
                isFavorite ? "fill-rose-500 text-rose-500" : "text-neutral-600"
              }`}
            />
          </button>
        </div>

        {/* Listing Details */}
        <div className="flex flex-col justify-center">
          <h3 className="text-sm font-semibold text-neutral-900 mb-1">
            {listing.category} in {listing.country}
          </h3>
          {/* <p className="text-xs text-neutral-600 mb-3">{listing.location}, {listing.country || 'India'}</p> */}

          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-sm font-semibold text-gray-600">
              ₹{listing.pricePerNight.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-gray-600">
              per night
            </span>
            <span className="border-3 w-1 h-1 rounded-[50%]"></span>
            {listing.rating && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-neutral-900 font-medium">
                  ★ {listing.rating.toFixed(2)}
                </span>
                {/* {listing.reviewCount && <span className="text-xs text-neutral-600">({listing.reviewCount} reviews)</span>} */}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
