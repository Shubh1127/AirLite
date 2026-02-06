"use client";

import { api } from "@/lib/api";
import { listingsAPI } from "@/lib/listings";
import { wishlistAPI } from "@/lib/wishlist";
import { useAuthStore } from "@/store/authStore";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import {
  Heart,
  Share2,
  Star,
  MapPin,
  Users,
  Bed,
  Bath,
  Wifi,
  Car,
  Home,
  Tv,
  Wind,
  Shield,
  Check,
  Tag,
  Calendar as CalendarIcon,
  ChevronDown,
  X,
  Utensils,
  Waves,
  Trees,
  Snowflake,
  Flame,
  Building,
  Dumbbell,
  Coffee,
  Mountain,
  Sparkles,
  CheckCircle,
  Search,
  MessageCircle,
  DollarSign,
  Minus,
  Plus,
  ChevronUp,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";
import { ImageGallery } from "@/components/listings/ImageGallery";
import { ReservePanelSkeleton, ListingDetailSkeleton } from "@/components/listings/ListingSkeleton";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

export default function ListingDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params.id as string;
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkInDate, setCheckInDate] = useState<Date | undefined>(() => {
    const checkInParam = searchParams.get('checkIn');
    return checkInParam ? new Date(checkInParam) : undefined;
  });
  const [checkOutDate, setCheckOutDate] = useState<Date | undefined>();
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [pets, setPets] = useState(0);
  const [showGuestsDropdown, setShowGuestsDropdown] = useState(false);
  const [bigImage, setBigImage] = useState<string | null>(null);
  const [showCheckInCalendar, setShowCheckInCalendar] = useState(false);
  const [showCheckOutCalendar, setShowCheckOutCalendar] = useState(false);
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showReservePanel, setShowReservePanel] = useState(false);
  const [showChangeGuests, setShowChangeGuests] = useState(false);
  const [showChangeDates, setShowChangeDates] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isLoadingWishlist, setIsLoadingWishlist] = useState(false);
  const mapContainerMobile = useRef<HTMLDivElement>(null);
  const mapContainerDesktop = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);

  const { isAuthenticated, token } = useAuthStore();

  // Calculate total guests
  const totalGuests = adults + children;

  // Amenities icon mapping
  const amenityIcons: { [key: string]: any } = {
    wifi: Wifi,
    kitchen: Utensils,
    parking: Car,
    tv: Tv,
    pool: Waves,
    "hot tub": Waves,
    heating: Flame,
    "air conditioning": Snowflake,
    beachfront: Trees,
    washer: Wind,
    dryer: Wind,
    elevator: Building,
    gym: Dumbbell,
    patio: Home,
    "bbq grill": Flame,
    fireplace: Flame,
    "mountain view": Mountain,
    sauna: Flame,
    concierge: Users,
    "chef's kitchen": Utensils,
    garden: Trees,
    "fire pit": Flame,
    "wildlife viewing": Trees,
    "hiking trails": Mountain,
  };

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true);
        const data = await listingsAPI.getById(id);
        setListing(data);
      } catch (error) {
        console.error("Error fetching listing:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchListing();
    }
  }, [id]);

  // Fetch wishlist status
  useEffect(() => {
    const checkWishlistStatus = async () => {
      if (!isAuthenticated || !token || !id) return;

      try {
        setIsLoadingWishlist(true);
        const wishlistData = await wishlistAPI.getWishlist(token);
        const inWishlist = wishlistData.listings?.some((listing: any) => listing._id === id);
        setIsInWishlist(inWishlist || false);
      } catch (error) {
        console.error("Error checking wishlist status:", error);
      } finally {
        setIsLoadingWishlist(false);
      }
    };

    checkWishlistStatus();
  }, [isAuthenticated, token, id]);

  // Toggle wishlist
  const handleWishlistToggle = async () => {
    if (!isAuthenticated || !token) {
      router.push("/auth/login");
      return;
    }

    try {
      setIsLoadingWishlist(true);
      if (isInWishlist) {
        await wishlistAPI.removeFromWishlist(id, token);
      } else {
        await wishlistAPI.addToWishlist(id, token);
      }
      setIsInWishlist(!isInWishlist);
    } catch (error) {
      console.error("Error toggling wishlist:", error);
    } finally {
      setIsLoadingWishlist(false);
    }
  };

  // Initialize Mapbox map
  useEffect(() => {
    if (!listing || !listing.geometry || map.current) return;

    // Determine which container is visible
    const isMobile = window.innerWidth < 1024;
    const activeContainer = isMobile ? mapContainerMobile.current : mapContainerDesktop.current;
    
    if (!activeContainer) return;

    const loadMapbox = async () => {
      try {
        // Dynamically import mapbox-gl
        const mapboxgl = (await import("mapbox-gl")).default;

        // Set access token - use a fallback public token if mapboxToken is not available
        const token = listing.mapboxToken || process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        if (!token) {
          console.warn("Mapbox token not found");
          return;
        }

        mapboxgl.accessToken = token;

        // Add CSS if not already added
        if (!document.querySelector('link[href*="mapbox-gl"]')) {
          const link = document.createElement("link");
          link.href = "https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.css";
          link.rel = "stylesheet";
          document.head.appendChild(link);
        }

        const coordinates = listing.geometry.coordinates;

        if (!coordinates || coordinates.length < 2) {
          console.warn("Invalid coordinates");
          return;
        }

        // Ensure the container has dimensions
        if (activeContainer) {
          activeContainer.style.width = '100%';
          activeContainer.style.height = activeContainer.style.height || '320px';
        }

        map.current = new mapboxgl.Map({
          container: activeContainer!,
          style: "mapbox://styles/mapbox/streets-v12",
          center: [coordinates[0], coordinates[1]],
          zoom: 12,
          trackResize: true,
        });

        // Add marker
        new mapboxgl.Marker({ color: "#FF385C" })
          .setLngLat([coordinates[0], coordinates[1]])
          .addTo(map.current);

        // Add navigation controls
        map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

        console.log("Map loaded successfully on", isMobile ? "mobile" : "desktop");
      } catch (error) {
        console.error("Error loading map:", error);
      }
    };

    loadMapbox();

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [listing]);

  console.log(listing);

  // Calculate total nights and price
  const calculateNights = () => {
    if (checkInDate && checkOutDate) {
      const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    return 0;
  };

  const totalNights = calculateNights();
  const totalPrice = listing ? listing.pricePerNight * totalNights : 0;
  const serviceFee = totalPrice * 0.14; // 14% service fee
  const totalWithFees = totalPrice + serviceFee;

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen bg-white"
      >
        {/* Desktop Skeleton */}
        <div className="hidden lg:block max-w-6xl mx-auto px-12 pb-12">
          <div className="h-96 bg-neutral-200 rounded-2xl mb-8 animate-pulse" />
          <div className="space-y-6">
            <div className="h-8 bg-neutral-200 rounded-md w-2/3 animate-pulse" />
            <div className="h-4 bg-neutral-200 rounded-md w-1/2 animate-pulse" />
            <div className="h-4 bg-neutral-200 rounded-md w-1/3 animate-pulse" />
          </div>
        </div>

        {/* Mobile Skeleton */}
        <ListingDetailSkeleton />
      </motion.div>
    );
  }

 if (!listing) {
  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-6">
      <div className="max-w-xl w-full text-center bg-white rounded-2xl p-10 shadow-[0_10px_30px_rgba(0,0,0,0.1)]">
        {/* Icon */}
        <div className="text-6xl mb-4">🏡</div>

        {/* Title */}
        <h1 className="text-3xl font-bold mb-3">
          Listing not found
        </h1>

        {/* Description */}
        <p className="text-gray-600 mb-8">
          The place you’re looking for may have been removed, expired,
          or the link might be incorrect.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold bg-black text-white hover:bg-gray-800 transition"
          >
            Back to Home
          </Link>

          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold border border-gray-300 hover:bg-gray-50 transition"
          >
            Browse listings
          </Link>
        </div>
      </div>
    </div>
  );
}


  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-white"
    >
      {/* Mobile Back Button with Actions */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-transparent z-20 px-4 py-3 flex items-center justify-between">
        <button onClick={() => router.back()} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md">
            <Share2 className="w-5 h-5" />
          </button>
          <button 
            onClick={handleWishlistToggle}
            disabled={isLoadingWishlist}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition disabled:opacity-50"
          >
            <Heart 
              className={`w-5 h-5 transition-colors ${
                isInWishlist ? 'fill-rose-500 text-rose-500' : 'text-gray-600'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Mobile Image Gallery - Horizontal Scroll */}
      <div className="lg:hidden relative ">
        <div 
          className="overflow-x-auto scrollbar-hide snap-x snap-mandatory"
          onScroll={(e) => {
            const scrollLeft = e.currentTarget.scrollLeft;
            const itemWidth = e.currentTarget.offsetWidth;
            const index = Math.round(scrollLeft / itemWidth);
            setCurrentImageIndex(index);
          }}
        >
          <div className="flex">
            {listing.images?.map((image: any, index: number) => (
              <div key={index} className="flex-shrink-0 w-full snap-center">
                <img
                  src={image.url || image}
                  alt={`${listing.title} - ${index + 1}`}
                  className="w-full h-80 object-cover"
                />
              </div>
            ))}
          </div>
        </div>
        {/* Image Counter */}
        <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1.5 rounded-lg text-sm font-medium">
          {currentImageIndex + 1} / {listing.images?.length || 0}
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block max-w-6xl mx-auto px-12 py-6">
        {/* Desktop Back Button */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="p-2 hover:bg-neutral-100 rounded-full transition border border-neutral-200">
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Title and Action Buttons */}
        <div className="mb-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold mb-2">{listing.title}</h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 underline text-sm hover:bg-neutral-50 px-3 py-2 rounded-lg">
              <Share2 className="w-4 h-4" /> Share
            </button>
            <button 
              onClick={handleWishlistToggle}
              disabled={isLoadingWishlist}
              className="flex items-center gap-2 underline text-sm hover:bg-neutral-50 px-3 py-2 rounded-lg disabled:opacity-50 transition"
            >
              <Heart 
                className={`w-4 h-4 transition-colors ${
                  isInWishlist ? 'fill-rose-500 text-rose-500' : 'text-gray-600'
                }`}
              /> 
              {isInWishlist ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>

        {/* Desktop Image Gallery */}
        <ImageGallery images={listing.images} title={listing.title} />
      </div>

      {/* Mobile Content */}
      {loading ? (
        <ListingDetailSkeleton />
      ) : (
      <div className="lg:hidden -mt-3 border border-t rounded-t-2xl bg-white px-5 pt-6 pb-24 relative z-10">
        {/* Title */}
        <h1 className="text-2xl font-bold mb-2">{listing.title}</h1>
        
        {/* Subtitle */}
        <p className="text-neutral-600 mb-3">
          {listing.category && `${listing.category.charAt(0).toUpperCase() + listing.category.slice(1)} in `}
          {listing.location}, {listing.country || 'India'}
        </p>

        {/* Property Details */}
        <div className="flex items-center text-neutral-700 text-sm mb-4">
          <span>{listing.maxGuests} {listing.maxGuests === 1 ? 'guest' : 'guests'}</span>
          <span className="mx-1">·</span>
          <span>{listing.bedrooms} {listing.bedrooms === 1 ? 'bedroom' : 'bedrooms'}</span>
          <span className="mx-1">·</span>
          <span>{listing.beds} {listing.beds === 1 ? 'bed' : 'beds'}</span>
          <span className="mx-1">·</span>
          <span>{listing.bathrooms} {listing.bathrooms === 1 ? 'bathroom' : 'bathrooms'}</span>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-6 pb-6 border-b border-neutral-200">
          <Star className="w-4 h-4 fill-black" />
          <span className="font-semibold">{listing.rating?.toFixed(1) || '5.0'}</span>
          <span className="mx-1">·</span>

          <span className="underline font-medium">{listing.reviewCount || 3} reviews</span>
        </div>

        {/* Host Section */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-neutral-200 rounded-lg lg:rounded-none px-4 lg:px-0 py-4 lg:py-0 bg-neutral-50 lg:bg-transparent">
          <div className="relative">
            <img
              src={listing.hostDetails?.avatar?.url || "https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png"}
              alt="Host"
              className="w-12 h-12 rounded-full"
            />
            {listing.hostDetails?.hostStats?.isSuperhost && (
              <div className="absolute -bottom-1 -right-1 bg-rose-500 rounded-full p-1">
                <Star className="w-3 h-3 fill-white text-white" />
              </div>
            )}
          </div>
          <div>
            <h3 className="font-semibold">
              Hosted by {listing.hostDetails?.fullName || listing.hostDetails?.firstName || "Host"}
            </h3>
            <p className="text-sm text-neutral-500">
              {listing.hostDetails?.hostStats?.yearsAsHost || 5} years hosting
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-6 mb-6 pb-6 border-b border-neutral-200 rounded-lg lg:rounded-none px-4 lg:px-0 py-4 lg:py-0 bg-neutral-50 lg:bg-transparent">
          {/* Self check-in */}
          <div className="flex items-start gap-4">
            <div className="w-6 h-6 flex-shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Self check-in</h4>
              <p className="text-sm text-neutral-600">You can check in with the building staff.</p>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-start gap-4">
            <MapPin className="w-6 h-6 flex-shrink-0" />
            <div>
              <h4 className="font-semibold mb-1">Unbeatable location</h4>
              <p className="text-sm text-neutral-600">100% of recent guests gave the location a 5-star rating.</p>
            </div>
          </div>
        </div>

        {/* Add dates section */}
        <div className="mb-6">
          <h3 className="font-semibold text-lg mb-2">Add dates for prices</h3>
          <div className="flex items-center gap-1 mb-4">
            <Star className="w-4 h-4 fill-black" />
            <span className="font-semibold">{listing.rating?.toFixed(1) || '5.0'}</span>
          </div>
        </div>

        {/* Amenities Section */}
        {listing.amenities && listing.amenities.length > 0 && (
          <div className="mb-8 pb-8 border-b border-neutral-200">
            <h3 className="text-xl font-semibold mb-6">What this place offers</h3>
            <div className="space-y-4">
              {listing.amenities.slice(0, 5).map((amenity: string, index: number) => {
                const IconComponent = amenityIcons[amenity.toLowerCase()] || Home;
                return (
                  <div key={index} className="flex items-center gap-3">
                    <IconComponent className="w-5 h-5 text-neutral-600" />
                    <span className="capitalize text-neutral-700">{amenity}</span>
                  </div>
                );
              })}
            </div>
            {listing.amenities.length > 5 && (
              <button 
                onClick={() => setShowAllAmenities(true)}
                className="mt-6 w-full border border-neutral-300 rounded-lg py-3 font-semibold text-neutral-700 hover:bg-neutral-50">
                Show all {listing.amenities.length} amenities
              </button>
            )}
          </div>
        )}

        {/* Reviews Section */}
        {listing.reviews && listing.reviews.length > 0 && (
          <div className="mb-8 pb-8 border-b border-neutral-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold">Reviews</h3>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 fill-black" />
                  <span className="font-semibold">{listing.rating?.toFixed(1) || '5.0'}</span>
                  <span className="text-neutral-600">· {listing.reviewCount || 0} reviews</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {listing.reviews.slice(0, 3).map((review: any, index: number) => {
                const timeAgo = review.createdAt
                  ? formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })
                  : "Recently";

                return (
                  <div key={review._id || index} className="pb-6 border-b border-neutral-200 last:border-0">
                    <div className="flex items-center gap-3 mb-3">
                      <img
                        src={
                          review.author?.avatar?.url ||
                          "https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png"
                        }
                        alt="Reviewer"
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <h4 className="font-semibold text-sm">
                          {review.author?.firstName || "Guest"}
                        </h4>
                        <p className="text-xs text-neutral-500">{timeAgo}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < Math.floor(review.rating)
                              ? "fill-black"
                              : "fill-none stroke-black"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-neutral-700">{review.comment}</p>
                  </div>
                );
              })}
            </div>

            {listing.reviews.length > 3 && (
              <button onClick={() => setShowAllReviews(true)} className="mt-6 w-full border border-neutral-300 rounded-lg py-3 font-semibold text-neutral-700 hover:bg-neutral-50">
                Show all {listing.reviewCount || listing.reviews.length} reviews
              </button>
            )}
          </div>
        )}
        {/* Where you'll be */}
        <div className="mb-8 pb-8 border-b border-neutral-200">
          <h3 className="text-xl font-semibold mb-4">Where you'll be</h3>
          <p className="text-neutral-700 mb-4">
            {listing.location}, {listing.country || 'India'}
          </p>
          <div
            ref={mapContainerMobile}
            className="w-full h-80 bg-neutral-200 rounded-lg overflow-hidden mb-4"
            style={{ minHeight: '320px' }}
          />
          <p className="text-xs text-neutral-600">
            Exact location provided after booking
          </p>
        </div>

        {/* Meet your host */}
        <div className="mb-8 pb-8 border-b border-neutral-200">
          <h3 className="text-xl font-semibold mb-6">Meet your host</h3>
          <div className="flex items-start gap-4 mb-6">
            <div className="relative">
              {listing.hostDetails?.avatar?.url ? (
                <img
                  src={listing.hostDetails.avatar.url}
                  alt="Host"
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-neutral-300 flex items-center justify-center text-white text-2xl font-bold">
                  {listing.hostDetails?.firstName
                    ? listing.hostDetails.firstName.charAt(0).toUpperCase()
                    : "H"}
                </div>
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-lg">
                {listing.hostDetails?.fullName || listing.hostDetails?.firstName || "Host"}
              </h4>
              {listing.hostDetails?.hostStats?.isSuperhost && (
                <p className="text-sm text-neutral-600 mb-2">Superhost</p>
              )}
              <p className="text-sm text-neutral-600">
                {listing.hostDetails?.hostStats?.yearsAsHost || 5} years hosting
              </p>
            </div>
          </div>
          <p className="text-sm text-neutral-700 mb-6">
            {listing.hostDetails?.hostProfile?.about ||
              "A passionate host committed to providing great experiences."}
          </p>
          <button className="w-full bg-neutral-100 text-neutral-900 px-6 py-3 rounded-lg font-semibold hover:bg-neutral-200">
            Message host
          </button>
        </div>

        {/* Things to know */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-6">Things to know</h3>
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <span>📅</span> Cancellation policy
              </h4>
              <p className="text-sm text-neutral-700">
                {listing.cancellationPolicy?.description || "See host's cancellation policy for details."}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <span>🔍</span> House rules
              </h4>
              <p className="text-sm text-neutral-700">
                {listing.houseRules && listing.houseRules.length > 0
                  ? listing.houseRules.join(", ")
                  : "No specific house rules listed."}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <span>🛡️</span> Safety & property
              </h4>
              <p className="text-sm text-neutral-700">
                This property has a carbon monoxide detector and a fire extinguisher.
              </p>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Mobile Fixed Bottom Button */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-5 py-4 flex items-center justify-between z-30">
        <div>
          {checkInDate && checkOutDate ? (
            <>
              <p className="text-sm text-neutral-600">
                {format(checkInDate, 'MMM d')} - {format(checkOutDate, 'MMM d')}
              </p>
              <p className="text-sm font-semibold">
                ₹{(listing.pricePerNight * calculateNights()).toLocaleString()} total
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-neutral-600">Add dates for prices</p>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-black" />
                <span className="text-sm font-semibold">{listing.rating?.toFixed(1) || '5.0'}</span>
              </div>
            </>
          )}
        </div>
        {checkInDate && checkOutDate ? (
          <button
            onClick={() => setShowReservePanel(true)}
            className="bg-rose-500 hover:bg-rose-600 text-white px-8 py-3 rounded-lg font-semibold transition"
          >
            Reserve
          </button>
        ) : (
          <button
            onClick={() => setShowDatePicker(true)}
            className="bg-rose-500 hover:bg-rose-600 text-white px-8 py-3 rounded-lg font-semibold transition"
          >
            Check availability
          </button>
        )}
      </div>

      {/* Desktop Content - Keep existing layout */}
      <div className="hidden lg:block max-w-6xl mx-auto px-12 pb-12">
        <div className="pb-8 border-b flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold mb-2">
              Entire rental unit in {listing.location},{" "}
              {listing.country || "India"}
            </h2>
            <div className="flex items-center gap-1 text-black">
              <span>{listing.maxGuests} guests</span>·
              <span>{listing.bedrooms} bedroom</span>·
              <span>{listing.beds} bed</span>·
              <span>{listing.bathrooms} bathroom</span>
            </div>
          </div>
          <div className="">
            <h1
              className="flex w-max  text-[14px] py-5 items-center gap-2 bg-white 
              rounded-xl 
             
              shadow-[6px_8px_20px_rgba(0.7,0.08,0.08,0.1)] p-3 px-12 font-semibold"
            >
              <span>
                <Tag className="text-rose-500" size={20} />
              </span>{" "}
              Prices include all fees
            </h1>
          </div>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        {/* Left Section - Scrollable */}
        <div className="lg:col-span-2">
          {/* Room Details */}
         

          {/* Guest Favorite Badge */}
          {listing.rating >= 4.8 && (
            <div className=" flex justify-between py-8 border-b">
              <div className="flex items-center gap-4 mb-4">
                <div className="text-4xl">🏆</div>
                <div>
                  <h3 className="font-semibold">Guest favourite</h3>
                  <p className="text-sm text-gray-600">
                    One of the most loved homes on Airbnb, according to guests
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <div className="text-xl font-bold">
                    {listing.rating?.toFixed(2) || "4.93"}
                  </div>
                  <div className="flex items-center">
                    <Star className="w-3 h-3 fill-black" />
                    <Star className="w-3 h-3 fill-black" />
                    <Star className="w-3 h-3 fill-black" />
                    <Star className="w-3 h-3 fill-black" />
                    <Star className="w-3 h-3 fill-black" />
                  </div>
                </div>
                <div className="text-center border-l pl-8">
                  <div className="text-xl font-bold">
                    {listing.reviewCount || 72}
                  </div>
                  <div className="text-sm text-gray-600">Reviews</div>
                </div>
              </div>
            </div>
          )}

          {/* Host Info */}
          <div className="py-8 border-b">
            <div className="flex items-center gap-4">
              <div className="relative border-1 rounded-full ">
                <img
                  src={
                    listing.hostDetails?.avatar?.url ||
                    "https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png"
                  }
                  alt="Host"
                  className="w-12 h-12 rounded-full"
                />

                {listing.hostDetails?.hostStats?.isSuperhost && (
                  <div className="absolute -bottom-1 -right-1 bg-rose-500 rounded-full p-1">
                    <Star className="w-3 h-3 fill-white text-white" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-semibold">
                  Hosted by{" "}
                  {listing.hostDetails?.fullName ||
                    listing.hostDetails?.firstName ||
                    "Host"}
                </h3>
                <p className="text-sm font-semibold text-gray-500">
                  {listing.hostDetails?.hostStats?.isSuperhost
                    ? "Superhost"
                    : "Host"}{" "}
                  · {listing.hostDetails?.hostStats?.yearsAsHost || 0} years
                  hosting
                </p>
              </div>
            </div>
          </div>

          {/* Location Features */}
          <div className="py-8 border-b space-y-6">
            <div className="flex flex-col gap-12">
              {listing.locationFeatures.map((feature: any, index: number) => {
                const IconComponent =
                  amenityIcons[feature.icon.toLowerCase()] || Home;
                return (
                  <div key={index} className="flex items-center gap-4">
                    <IconComponent className="w-6 h-6" />
                    <div>
                      <h4 className="font-semibold">{feature.title}</h4>
                      <p className="text-sm text-gray-600">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div className="py-8 border-b">
            <p className="text-gray-700 leading-relaxed">
              {listing.description ||
                "Enjoy a memorable visit when you stay in this unique place. Herne Lodge is a 200 years old estate, with a main colonial building and a newly renovated wing housing this apartment. The apartment commands a panoramic view of the inner Himalayan range, and overlook the Yamuna-Aghlad river valley. The snow clad Bandar Poonchh range is also visible in the distance, behind well known peaks like the Nag Tibba. This kind of panoramic view is very rare in our region."}
            </p>
          </div>

          {/* Where you'll sleep */}
          <div className="py-8 border-b">
            <h3 className="text-xl font-semibold mb-6">Where you'll sleep</h3>
            <div className="border rounded-xl p-6">
              <Bed className="w-8 h-8 mb-4" />
              <h4 className="font-semibold">Bedroom</h4>
              <p className="text-sm text-gray-600">1 double bed</p>
            </div>
          </div>

          {/* What this place offers */}
          <div className="py-8 border-b">
            <h3 className="text-xl font-semibold mb-6">
              What this place offers
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {listing.amenities
                ?.slice(0, 6)
                .map((amenity: string, index: number) => {
                  const IconComponent =
                    amenityIcons[amenity.toLowerCase()] || Home;
                  return (
                    <div key={index} className="flex items-center gap-4">
                      <IconComponent className="w-6 h-6" />
                      <span className="capitalize">{amenity}</span>
                    </div>
                  );
                })}
            </div>
            {listing.amenities && listing.amenities.length > 6 && (
              <button
                onClick={() => setShowAllAmenities(true)}
                className="mt-6 cursor-pointer border border-gray-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50"
              >
                Show all {listing.amenities.length} amenities
              </button>
            )}
          </div>

          {/* Accessibility features */}
          <div className="py-8 border-b">
            <h3 className="text-xl font-semibold mb-2">
              Accessibility features
            </h3>
            <p className="text-sm text-gray-600">
              This info was provided by the Host and reviewed by Airbnb.
            </p>
          </div>
        </div>

        {/* Right Section - Sticky Price Card */}
        <div className="lg:col-span-1 mt-5">
          <div className="border border-gray-300 rounded-xl p-6 shadow-lg sticky top-24">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl font-semibold">
                  ₹{listing.pricePerNight?.toLocaleString()}
                </span>
                <span className="text-gray-600">/night</span>
              </div>
              <div className="flex items-center gap-2 text-sm mb-1">
                <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                <span>Prices include all fees</span>
              </div>
            </div>

            <div className="border border-gray-400 rounded-lg mb-4">
              <div className="grid grid-cols-2 border-b border-gray-400">
                {/* Check-in */}
                <Popover
                  open={showCheckInCalendar}
                  onOpenChange={setShowCheckInCalendar}
                >
                  <PopoverTrigger asChild>
                    <button className="text-left p-3 border-r border-gray-400 hover:bg-gray-50">
                      <div className="text-xs font-semibold mb-1">CHECK-IN</div>
                      <div className="text-sm">
                        {checkInDate
                          ? format(checkInDate, "MM/dd/yyyy")
                          : "Add date"}
                      </div>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={checkInDate}
                      onSelect={(date) => {
                        setCheckInDate(date);
                        setShowCheckInCalendar(false);
                        if (date && checkOutDate && date >= checkOutDate) {
                          setCheckOutDate(undefined);
                        }
                      }}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                {/* Check-out */}
                <Popover
                  open={showCheckOutCalendar}
                  onOpenChange={setShowCheckOutCalendar}
                >
                  <PopoverTrigger asChild>
                    <button className="text-left p-3 hover:bg-gray-50">
                      <div className="text-xs font-semibold mb-1">CHECKOUT</div>
                      <div className="text-sm">
                        {checkOutDate
                          ? format(checkOutDate, "MM/dd/yyyy")
                          : "Add date"}
                      </div>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={checkOutDate}
                      onSelect={(date) => {
                        setCheckOutDate(date);
                        setShowCheckOutCalendar(false);
                      }}
                      disabled={(date) => !checkInDate || date <= checkInDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Guests Dropdown */}
              <Popover
                open={showGuestsDropdown}
                onOpenChange={setShowGuestsDropdown}
              >
                <PopoverTrigger asChild>
                  <button className="p-3 hover:bg-gray-50 rounded-b-lg w-full text-left">
                    <div className="text-xs font-semibold mb-1">GUESTS</div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">
                        {totalGuests} {totalGuests === 1 ? "guest" : "guests"}
                        {infants > 0 &&
                          `, ${infants} ${infants === 1 ? "infant" : "infants"}`}
                        {pets > 0 && `, ${pets} ${pets === 1 ? "pet" : "pets"}`}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${showGuestsDropdown ? "rotate-180" : ""}`}
                      />
                    </div>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-96 p-0" align="start">
                  <div className="p-6">
                    {/* Adults */}
                    <div className="flex items-center justify-between py-4 border-b">
                      <div>
                        <div className="font-semibold">Adults</div>
                        <div className="text-sm text-gray-600">Age 13+</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setAdults(Math.max(1, adults - 1))}
                          disabled={adults <= 1}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-900 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-300"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center">{adults}</span>
                        <button
                          onClick={() =>
                            setAdults(
                              Math.min(
                                listing.maxGuests - children,
                                adults + 1,
                              ),
                            )
                          }
                          disabled={totalGuests >= listing.maxGuests}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-900 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-300"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Children */}
                    <div className="flex items-center justify-between py-4 border-b">
                      <div>
                        <div className="font-semibold">Children</div>
                        <div className="text-sm text-gray-600">Ages 2–12</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setChildren(Math.max(0, children - 1))}
                          disabled={children <= 0}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-900 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-300"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center">{children}</span>
                        <button
                          onClick={() =>
                            setChildren(
                              Math.min(
                                listing.maxGuests - adults,
                                children + 1,
                              ),
                            )
                          }
                          disabled={totalGuests >= listing.maxGuests}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-900 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-300"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Infants */}
                    <div className="flex items-center justify-between py-4 border-b">
                      <div>
                        <div className="font-semibold">Infants</div>
                        <div className="text-sm text-gray-600">Under 2</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setInfants(Math.max(0, infants - 1))}
                          disabled={infants <= 0}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-900 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-300"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center">{infants}</span>
                        <button
                          onClick={() => setInfants(infants + 1)}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-900"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Pets */}
                    <div className="flex items-center justify-between py-4 border-b">
                      <div>
                        <div className="font-semibold">Pets</div>
                        <div className="text-sm text-gray-600 underline">
                          Bringing a service animal?
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setPets(Math.max(0, pets - 1))}
                          disabled={pets <= 0}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-900 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-300"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center">{pets}</span>
                        <button
                          onClick={() => setPets(pets + 1)}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-900"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Info Text */}
                    <p className="text-sm text-gray-600 mt-4 mb-6">
                      This place has a maximum of {listing.maxGuests} guests,
                      not including infants. Pets aren't allowed.
                    </p>

                    {/* Close Button */}
                    <button
                      onClick={() => setShowGuestsDropdown(false)}
                      className="text-sm font-semibold underline"
                    >
                      Close
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <Link
              href={`/listings/${id}/reserve?checkIn=${checkInDate?.toISOString()}&checkOut=${checkOutDate?.toISOString()}&adults=${adults}&children=${children}&infants=${infants}&pets=${pets}`}
            >
              <button
                disabled={!checkInDate || !checkOutDate}
                className="w-full bg-gradient-to-r from-rose-500 to-pink-600 text-white py-3 rounded-lg font-semibold text-lg hover:from-rose-600 hover:to-pink-700 mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reserve
              </button>
            </Link>

            <p className="text-center text-sm text-gray-600 mb-4">
              You won't be charged yet
            </p>

            {totalNights > 0 && (
              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="underline">
                    ₹{listing.pricePerNight?.toLocaleString()} × {totalNights}{" "}
                    {totalNights === 1 ? "night" : "nights"}
                  </span>
                  <span>₹{totalPrice?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="underline">Service fee</span>
                  <span>₹{listing.serviceFee?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-semibold pt-2 border-t">
                  <span>Total</span>
                  <span>₹{totalWithFees?.toLocaleString()}</span>
                </div>
              </div>
            )}

            <div className="mt-6 text-center">
              <button className="text-sm text-gray-600 underline flex items-center gap-2 mx-auto">
                <span>🚩</span> Report this listing
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Full Width Sections */}
      {/* Reviews Section */}
      <div className="mt-12 pt-12 border-t hidden lg:block">
        {/* Guest Favourite Header */}
        <div className="text-center mb-12">
          <div className="flex items-up justify-center gap-4 mb-4">
            <div className="text-4xl">
              <img
                className="h-25 w-25"
                src={
                  "https://a0.muscache.com/im/pictures/airbnb-platform-assets/AirbnbPlatformAssets-GuestFavorite/original/78b7687c-5acf-4ef8-a5ea-eda732ae3b2f.png?im_w=240"
                }
              />
            </div>
            <h1 className="text-6xl font-bold">
              {listing.rating?.toFixed(2) || "4.93"}
            </h1>
            <div className="text-4xl">
              <img
                className="h-25 w-25"
                src={
                  "https://a0.muscache.com/im/pictures/airbnb-platform-assets/AirbnbPlatformAssets-GuestFavorite/original/b4005b30-79ff-4287-860c-67829ecd7412.png?im_w=240"
                }
              />
            </div>
          </div>
          {listing.rating >= 4.8 && (
            <div>
              <h2 className="text-2xl font-semibold mb-2">Guest favourite</h2>
              <p className="text-gray-600">
                This home is a guest favourite based on ratings, reviews and
                reliability
              </p>
            </div>
          )}
        </div>

        {/* Rating Breakdown Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-8 mb-12">
          {/* Overall Rating with Bar Chart */}
          <div className="lg:col-span-2">
            <h3 className="font-semibold mb-4">Overall rating</h3>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center gap-2">
                  <span className="text-sm w-4">{rating}</span>
                  <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-black rounded-full"
                      style={{
                        width:
                          rating === 5 ? "95%" : rating === 4 ? "5%" : "0%",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Ratings */}
          <div className="lg:col-span-5 grid grid-cols-2 md:grid-cols-3 gap-6">
            <div className="border-l pl-6">
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-5 h-5" />
                <span className="text-sm font-semibold">Cleanliness</span>
              </div>
              <div className="text-2xl font-semibold">
                {listing.ratingsBreakdown?.cleanliness || "-"}
              </div>
            </div>
            <div className="border-l pl-6">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-semibold">Accuracy</span>
              </div>
              <div className="text-2xl font-semibold">
                {listing.ratingsBreakdown?.accuracy || "-"}
              </div>
            </div>
            <div className="border-l pl-6">
              <div className="flex items-center gap-3 mb-2">
                <Search className="w-5 h-5" />
                <span className="text-sm font-semibold">Check-in</span>
              </div>
              <div className="text-2xl font-semibold">
                {listing.ratingsBreakdown?.checkIn || "-"}
              </div>
            </div>
            <div className="border-l pl-6">
              <div className="flex items-center gap-3 mb-2">
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm font-semibold">Communication</span>
              </div>
              <div className="text-2xl font-semibold">
                {listing.ratingsBreakdown?.communication || "-"}
              </div>
            </div>
            <div className="border-l pl-6">
              <div className="flex items-center gap-3 mb-2">
                <MapPin className="w-5 h-5" />
                <span className="text-sm font-semibold">Location</span>
              </div>
              <div className="text-2xl font-semibold">
                {listing.ratingsBreakdown?.location || "-"}
              </div>
            </div>
            <div className="border-l pl-6">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-5 h-5" />
                <span className="text-sm font-semibold">Value</span>
              </div>
              <div className="text-2xl font-semibold">
                {listing.ratingsBreakdown?.value || "-"}
              </div>
            </div>
          </div>
        </div>

        {/* Review Tags */}
        <div className="flex flex-wrap gap-3 mb-8">
          <span className="px-4 py-2 border rounded-full text-sm">
            Great hospitality
          </span>
          <span className="px-4 py-2 border rounded-full text-sm">
            Great view
          </span>
          <span className="px-4 py-2 border rounded-full text-sm">
            Quiet area
          </span>
          <span className="px-4 py-2 border rounded-full text-sm">Clean</span>
          <span className="px-4 py-2 border rounded-full text-sm">
            Surrounded by nature
          </span>
          <span className="px-4 py-2 border rounded-full text-sm">
            Near attractions
          </span>
        </div>

        {/* Individual Reviews */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {listing.reviews && listing.reviews.length > 0 ? (
            listing.reviews.slice(0, 6).map((review: any, index: number) => {
              const memberSince = review.author?.createdAt
                ? new Date(review.author.createdAt).getFullYear()
                : new Date().getFullYear();
              const yearsSince = new Date().getFullYear() - memberSince;
              const timeAgo = review.createdAt
                ? formatDistanceToNow(new Date(review.createdAt), {
                    addSuffix: true,
                  })
                : "Recently";

              return (
                <div key={review._id || index}>
                  <div className="flex items-center gap-4 mb-3">
                    <img
                      src={
                        review.author?.avatar?.url ||
                        "https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png"
                      }
                      alt="Reviewer"
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <h4 className="font-semibold">
                        {review.author?.firstName || "Anonymous"}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {yearsSince > 0
                          ? `${yearsSince} ${yearsSince === 1 ? "year" : "years"} on Airbnb`
                          : "New to Airbnb"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < Math.floor(review.rating)
                            ? "fill-black"
                            : "fill-none stroke-black"
                        }`}
                      />
                    ))}
                    <span className="text-sm text-gray-600">· {timeAgo}</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    {review.comment?.length > 150
                      ? `${review.comment.substring(0, 150)}...`
                      : review.comment}
                  </p>
                  {review.comment?.length > 150 && (
                    <button className="text-sm font-semibold underline mt-2">
                      Show more
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <div className="col-span-2 text-center py-8 text-gray-500">
              No reviews yet. Be the first to review!
            </div>
          )}
        </div>

        {listing.reviews && listing.reviews.length > 4 && !showAllReviews && (
          <button
            onClick={() => setShowAllReviews(true)}
            className="mt-8 border border-gray-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50"
          >
            Show all {listing.reviewCount || 72} reviews
          </button>
        )}
      </div>

      {/* Where you'll be */}
      <div className="mt-12 pt-12 border-t">
        <h2 className="text-2xl font-semibold mb-4">Where you'll be</h2>
        <p className="text-gray-700 mb-6">
          {listing.location}, {listing.country}
        </p>
        <div
          ref={mapContainerDesktop}
          className="w-full h-96 bg-gray-200 rounded-lg overflow-hidden"
          style={{ minHeight: '400px' }}
        />
        <p className="text-sm text-gray-600 mt-4">
          Exact location provided after booking
        </p>
      </div>

      {/* Meet your host */}
      <div className="mt-12 pt-12 border-t">
        <h2 className="text-2xl font-semibold mb-8">Meet your host</h2>
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-10">
          {/* Left column: host card + quick info */}
          <div>
            <div className=" flex items-start justify-center gap-12 bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.08)] p-4">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  {
                    listing.hostDetails?.avatar?.url ? (
                      <img src={listing.hostDetails.avatar.url}/>
                    ) :(
                      <div className="rounded-full w-20 h-20 bg-gray-400 flex items-center justify-center text-white text-4xl font-bold">
                        {listing.hostDetails?.firstName
                          ? listing.hostDetails.firstName.charAt(0).toUpperCase()
                          : "H"}
                      </div>
                    )
                  }
                  
                </div>
                <div>
                  <h3 className="text-2xl font-bold">
                    {listing.hostDetails?.fullName ||
                      listing.hostDetails?.firstName ||
                      "Host"}
                  </h3>
                  {listing.hostDetails?.hostStats?.isSuperhost && (
                    <div className="text-[12px] font-semibold text-center text-gray-600">Superhost</div>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-4  text-center">
                <div>
                  <div className="text-xl font-bold">
                    {listing.hostDetails?.hostStats?.totalReviews || 0}
                  </div>
                  <div className="text-[10px] text-gray-600">Reviews</div>
                  
                </div>
                <hr/>
                <div>
                  <div className="text-xl font-bold">
                    {listing.hostDetails?.hostStats?.averageRating
                      ? `${listing.hostDetails.hostStats.averageRating.toFixed(2)}★`
                      : "N/A"}
                  </div>
                  <div className="text-[10px] text-gray-600">Rating</div>
                </div>
                <hr/>
                <div>
                  <div className="text-xl font-bold">
                    {listing.hostDetails?.hostStats?.yearsAsHost || 0}
                  </div>
                  <div className="text-[10px] text-gray-600">Years hosting</div>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3 text-sm text-gray-700">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-4 h-4" />
                <span>
                  {listing.hostDetails?.hostProfile?.languages?.length
                    ? `Speaks ${listing.hostDetails.hostProfile.languages.map((lang: any) => lang.language).join(", ")}`
                    : "Speaks English"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4" />
                <span>
                  Lives in {listing.location}, {listing.country || "India"}
                </span>
              </div>
            </div>
          </div>

          {/* Right column: host details */}
          <div>
            {listing.hostDetails?.hostStats?.isSuperhost && (
              <>
                <h4 className="text-xl font-semibold mb-2">
                  {listing.hostDetails?.firstName || "This host"} is a
                  Superhost
                </h4>
                <p className="text-sm text-gray-700 mb-6">
                  Superhosts are experienced, highly rated hosts who are
                  committed to providing great stays for guests.
                </p>
              </>
            )}

            <h4 className="font-semibold mb-4">Host details</h4>

            <div className="space-y-2 text-sm mb-6">
              <p>
                {
                  listing.hostDetails?.hostProfile?.hostBio
                }
              </p>
              <p>
                Response rate:{" "}
                {listing.hostDetails?.hostProfile?.responseStats?.responseRate ||
                  0}
                %
              </p>
              <p>
                {listing.hostDetails?.responseTimeDisplay ||
                  "Response time not available"}
              </p>
            </div>

            <button className="w-full md:w-auto bg-gray-100 text-[14px] text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 mb-6">
              Message host
            </button>

            <div className="flex items-start gap-3 text-xs text-gray-600 pt-6 border-t">
              <Shield className="w-4 h-4 mt-1 flex-shrink-0" />
              <p>
                To help protect your payment, always use Airbnb to send money
                and communicate with hosts.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Things to know */}
      <div className="mt-12 pt-12 border-t pb-12">
        <h2 className="text-2xl font-semibold mb-8">Things to know</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <span>📅</span> Cancellation policy
            </h4>
            <div>
              {/* <p>{listing.cancellationPolicy.type}</p> */}
              <h1 className="text-gray-600 text-[15px]">{listing.cancellationPolicy.description}</h1>
              {/* <span className="text-gray-600">
                ₹{listing.serviceFee} serviceFee+₹{listing.tax} taxes
              </span> */}
            </div>
            {/* <p className="text-sm text-gray-700 mb-2">
              This reservation is non-refundable.
            </p>
            <p className="text-sm text-gray-700 mb-2">
              Review this host's full policy for details.
            </p>
            <button className="text-sm font-semibold underline">
              Learn more
            </button> */}
          </div>
          <div>
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <span>🔍</span> House rules
            </h4>
            <p className="text-gray-600">
              {listing.houseRules.map((rule: string, index: number) => (
                <span key={index}>
                  {rule}
                  {index < listing.houseRules.length - 1 ? ", " : ""}
                </span>
              ))}
            </p>
            {/* <p className="text-sm text-gray-700 mb-1">
              Check-in after 12:00 pm
            </p>
            <p className="text-sm text-gray-700 mb-1">
              Checkout before 9:00 am
            </p>
            <p className="text-sm text-gray-700 mb-2">3 guests maximum</p>
            <button className="text-sm font-semibold underline">
              Learn more
            </button> */}
          </div>
          <div>
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <span>🛡️</span> Safety & property
            </h4>
            <p className="text-sm text-gray-700 mb-1">
              Carbon monoxide alarm not reported
            </p>
            <p className="text-sm text-gray-700 mb-1">
              Smoke alarm not reported
            </p>
            <p className="text-sm text-gray-700 mb-2">
              Exterior security cameras on property
            </p>
            <button className="text-sm font-semibold underline">
              Learn more
            </button>
          </div>
        </div>
      </div>
      </div>

      {/* Amenities Modal */}
      <AnimatePresence>
        {showAllAmenities && (
          <>
            {/* Mobile Overlay */}
            <div className="lg:hidden fixed inset-0 bg-black/20 z-40" onClick={() => setShowAllAmenities(false)} />
            
            {/* Mobile Sliding Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 260 }}
              className="lg:hidden fixed inset-y-0 right-0 bg-white z-50 w-full max-w-full overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-neutral-200 px-5 py-4 flex items-center gap-3 z-10">
                <button onClick={() => setShowAllAmenities(false)} className="p-2 hover:bg-neutral-100 rounded-full transition">
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <h2 className="text-lg font-semibold">What this place offers</h2>
              </div>

              {/* Amenities List */}
              <div className="p-5 pb-24">
                <div className="space-y-4">
                  {listing.amenities?.map((amenity: string, index: number) => {
                    const IconComponent = amenityIcons[amenity.toLowerCase()] || Home;
                    return (
                      <div key={index} className="flex items-center gap-4 py-4 border-b border-neutral-200 last:border-0">
                        <IconComponent className="w-6 h-6 text-neutral-600 flex-shrink-0" />
                        <span className="capitalize text-neutral-700">{amenity}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            {/* Desktop Modal */}
            <div className="hidden lg:flex fixed inset-0 bg-black/75 bg-opacity-50 z-50 items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', damping: 26, stiffness: 260 }}
                className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
                  <h2 className="text-2xl font-semibold">What this place offers</h2>
                  <button
                    onClick={() => setShowAllAmenities(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Amenities Grid */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {listing.amenities?.map((amenity: string, index: number) => {
                      const IconComponent =
                        amenityIcons[amenity.toLowerCase()] || Home;
                      return (
                        <div
                          key={index}
                          className="flex items-center gap-4 py-4 border-b"
                        >
                          <IconComponent className="w-6 h-6" />
                          <span className="capitalize">{amenity}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Reviews Modal */}
      <AnimatePresence>
        {showAllReviews && (
          <>
            {/* Mobile Overlay */}
            <div className="lg:hidden fixed inset-0 bg-black/20 z-40" onClick={() => setShowAllReviews(false)} />
            
            {/* Mobile Sliding Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 260 }}
              className="lg:hidden fixed inset-y-0 right-0 bg-white z-50 w-full max-w-full overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-neutral-200 px-5 py-4 flex items-center gap-3 z-10">
                <button onClick={() => setShowAllReviews(false)} className="p-2 hover:bg-neutral-100 rounded-full transition">
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <h2 className="text-lg font-semibold">All reviews</h2>
              </div>

              {/* Reviews List */}
              <div className="p-5 pb-24">
                <div className="space-y-6">
                  {listing.reviews && listing.reviews.length > 0 ? (
                    listing.reviews.map((review: any, index: number) => {
                      const timeAgo = review.createdAt
                        ? formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })
                        : "Recently";

                      return (
                        <div key={review._id || index} className="pb-6 border-b border-neutral-200 last:border-0">
                          <div className="flex items-center gap-3 mb-3">
                            <img
                              src={review.author?.avatar?.url || "https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png"}
                              alt="Reviewer"
                              className="w-10 h-10 rounded-full"
                            />
                            <div>
                              <h4 className="font-semibold text-sm">
                                {review.author?.firstName || "Guest"}
                              </h4>
                              <p className="text-xs text-neutral-500">{timeAgo}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 mb-2">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${
                                  i < Math.floor(review.rating)
                                    ? "fill-black"
                                    : "fill-none stroke-black"
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-sm text-neutral-700">{review.comment}</p>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-neutral-500">
                      No reviews yet. Be the first to review!
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Desktop Modal */}
            <div className="hidden lg:flex fixed inset-0 bg-black/75 bg-opacity-50 z-50 items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', damping: 26, stiffness: 260 }}
                className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
                  <h2 className="text-2xl font-semibold">All reviews</h2>
                  <button
                    onClick={() => setShowAllReviews(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Reviews Grid */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                  {listing.reviews && listing.reviews.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {listing.reviews.map((review: any, index: number) => {
                        const memberSince = review.author?.createdAt
                          ? new Date(review.author.createdAt).getFullYear()
                          : new Date().getFullYear();
                        const yearsSince = new Date().getFullYear() - memberSince;
                        const timeAgo = review.createdAt
                          ? formatDistanceToNow(new Date(review.createdAt), {
                              addSuffix: true,
                            })
                          : "Recently";

                        return (
                          <div key={review._id || index}>
                            <div className="flex items-center gap-4 mb-3">
                              <img
                                src={review.author?.avatar?.url || "https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png"}
                                alt="Reviewer"
                                className="w-12 h-12 rounded-full object-cover"
                              />
                              <div>
                                <h4 className="font-semibold">
                                  {review.author?.firstName || "Anonymous"}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {yearsSince > 0
                                    ? `${yearsSince} ${yearsSince === 1 ? "year" : "years"} on Airbnb`
                                    : "New to Airbnb"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${
                                    i < Math.floor(review.rating)
                                      ? "fill-black"
                                      : "fill-none stroke-black"
                                  }`}
                                />
                              ))}
                              <span className="text-sm text-gray-600">
                                · {timeAgo}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">
                              {review.comment}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No reviews yet. Be the first to review!
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Date Picker Modal */}
      <AnimatePresence>
        {showDatePicker && (
          <>
            {/* Overlay */}
            <div 
              className="fixed inset-0 bg-black/20 z-40" 
              onClick={() => setShowDatePicker(false)} 
            />
            
            {/* Sliding Panel */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 260 }}
              className="fixed inset-x-0 bottom-0 bg-white z-50 rounded-t-2xl max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-neutral-200 px-5 py-4 flex items-center justify-between z-10">
                <button 
                  onClick={() => setShowDatePicker(false)} 
                  className="p-2 hover:bg-neutral-100 rounded-full transition"
                >
                  <X className="w-6 h-6" />
                </button>
                <h2 className="text-lg font-semibold absolute left-1/2 -translate-x-1/2">Select check-in date</h2>
                <button 
                  onClick={() => {
                    setCheckInDate(undefined);
                    setCheckOutDate(undefined);
                  }}
                  className="text-sm font-semibold underline"
                >
                  Clear dates
                </button>
              </div>

              {/* Content */}
              <div className="p-5">
                <p className="text-sm text-neutral-600 mb-6">Add your travel dates for exact pricing</p>

                {/* Calendar */}
                <Calendar
                  mode="range"
                  selected={{
                    from: checkInDate,
                    to: checkOutDate,
                  }}
                  onSelect={(range) => {
                    if (range?.from) {
                      setCheckInDate(range.from);
                      setCheckOutDate(range.to);
                    }
                  }}
                  numberOfMonths={3}
                  className="rounded-md"
                  disabled={(date) => date < new Date()}
                />
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-white border-t border-neutral-200 px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600">Add dates for prices</p>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-black" />
                    <span className="text-sm font-semibold">{listing.rating?.toFixed(1) || '5.0'}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (checkInDate && checkOutDate) {
                      setShowDatePicker(false);
                    }
                  }}
                  disabled={!checkInDate || !checkOutDate}
                  className="bg-neutral-800 hover:bg-black text-white px-8 py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Reserve Confirmation Panel */}
      <AnimatePresence>
        {showReservePanel && checkInDate && checkOutDate && (
          <>
            {/* Show skeleton while loading */}
            {loading ? (
              <>
                <div className="fixed inset-0 bg-black/20 z-40 lg:hidden" />
                <ReservePanelSkeleton />
              </>
            ) : (
              <>
                {/* Overlay */}
                <div 
                  className="fixed inset-0 bg-black/20 z-40 lg:hidden" 
                  onClick={() => setShowReservePanel(false)} 
                />
            
            {/* Sliding Panel */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 260 }}
              className="fixed inset-x-0 bottom-0 bg-white z-50 rounded-t-2xl max-h-[95vh] overflow-y-auto lg:hidden"
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-neutral-200 px-5 py-4 flex items-center justify-between z-10">
                <h2 className="text-xl font-semibold">Confirm and pay</h2>
                <button 
                  onClick={() => setShowReservePanel(false)} 
                  className="p-2 hover:bg-neutral-100 rounded-full transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="p-5 pb-32">
                {/* Listing Card */}
                <div className="border border-neutral-200 rounded-lg overflow-hidden mb-6">
                  <div className="relative h-40 bg-neutral-200">
                    {listing.images && listing.images.length > 0 && (
                      <img 
                        src={listing.images[0]?.url || ''} 
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold mb-1">{listing.title}</h3>
                    <p className="text-sm text-neutral-600 mb-2">{listing.location}, {listing.country || 'India'}</p>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-black" />
                      <span className="text-sm font-semibold">{listing.rating?.toFixed(1) || '5.0'}</span>
                      <span className="text-sm text-neutral-600">({listing.reviewCount || 0})</span>
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div className="border-b border-neutral-200 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral-600">Dates</p>
                    <p className="font-semibold">{format(checkInDate, 'd')}–{format(checkOutDate, 'd')} {format(checkOutDate, 'MMM yyyy')}</p>
                  </div>
                  <button 
                    onClick={() => setShowChangeDates(true)}
                    className="text-sm font-semibold underline hover:bg-neutral-50 px-3 py-2 rounded"
                  >
                    Change
                  </button>
                </div>

                {/* Guests */}
                <div className="border-b border-neutral-200 py-4 flex items-center justify-between">
               <div>
                   <p className="text-sm text-neutral-600">Guests</p>
                  <p className="font-semibold">
                       {totalGuests} {totalGuests === 1 ? "guest" : "guests"}
                  </p>
                </div>

                <button
                    onClick={() => setShowChangeGuests(true)}
                    className="text-sm font-semibold underline hover:bg-neutral-50 px-3 py-2 rounded"
                >
                    Change
                </button>
              </div>

                {/* Cancellation Policy */}
                <div className="border-b border-neutral-200 py-4">
                  <p className="font-semibold mb-2">Free cancellation</p>
                  <p className="text-sm text-neutral-700">
                    Cancel before {format(new Date(checkInDate.getTime() - 24 * 60 * 60 * 1000), 'h:mm a')} on {format(new Date(checkInDate.getTime() - 24 * 60 * 60 * 1000), 'd MMMM')} for a full refund.{' '}
                    <button className="font-semibold underline">Full policy</button>
                  </p>
                </div>
                {/* Price Details */}
                <div className="py-6">
                  <h3 className="font-semibold mb-4">Price details</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-neutral-600">{calculateNights()} {calculateNights() === 1 ? 'night' : 'nights'} x ₹{listing.pricePerNight?.toLocaleString()}</span>
                      <span>₹{(listing.pricePerNight * calculateNights()).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Special offer</span>
                      <span>-₹{Math.round(listing.pricePerNight * calculateNights() * 0.15).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Taxes</span>
                      <span>₹{Math.round((listing.pricePerNight * calculateNights() * 0.18)).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Total */}
                <div className="border-t border-neutral-200 pt-4 flex items-center justify-between mb-6">
                  <p className="font-semibold text-lg">Total INR</p>
                  <p className="font-semibold text-lg">₹{Math.round(listing.pricePerNight * calculateNights() - (listing.pricePerNight * calculateNights() * 0.15) + (listing.pricePerNight * calculateNights() * 0.18)).toLocaleString()}</p>
                </div>

                {/* Price Breakdown Link */}
                <button className="text-sm font-semibold underline text-neutral-700 mb-6">
                  Price breakdown
                </button>

                {/* Info Text */}
                <p className="text-xs text-neutral-600 mb-4">
                  You'll be directed to Razorpay to complete payment.
                </p>

                {/* Agreement */}
                <p className="text-xs text-neutral-600 mb-6">
                  By selecting the button, I agree to the{' '}
                  <button className="font-semibold underline">booking terms</button>
                </p>
              </div>


              {/* Footer Button */}
              <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-5 py-4 lg:hidden">
                <Link
                  href={`/listings/${listing._id}/reserve?checkIn=${checkInDate.toISOString()}&checkOut=${checkOutDate.toISOString()}&adults=${adults}&children=${children}&infants=${infants}&pets=${pets}`}
                  className="block w-full bg-black text-white py-3 rounded-lg font-semibold text-center hover:bg-neutral-800 transition"
                >
                  Continue to Razorpay
                </Link>
              </div>
            </motion.div>
              </>
            )}
          </>
        )}
      </AnimatePresence>

      {/* Change Guests Panel */}
      <AnimatePresence>
        {showChangeGuests && (
          <>
            <div 
              className="fixed inset-0 bg-black/20 z-40 lg:hidden" 
              onClick={() => setShowChangeGuests(false)} 
            />
            
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 260 }}
              className="fixed inset-x-0 bottom-0 bg-white z-50 rounded-t-2xl max-h-[90vh] overflow-y-auto lg:hidden"
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-neutral-200 px-5 py-4 flex items-center justify-between z-10">
                <h2 className="text-xl font-semibold">Change guests</h2>
                <button 
                  onClick={() => setShowChangeGuests(false)} 
                  className="p-2 hover:bg-neutral-100 rounded-full transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="p-5 pb-32">
                <p className="text-sm text-neutral-600 mb-6">
                  This place has a maximum of {listing.maxGuests} guests, not including infants. If you're bringing more than {listing.maxGuests} pets, please let your host know.
                </p>

                {/* Adults */}
                <div className="border-b border-neutral-200 py-6 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Adults</h3>
                    <p className="text-sm text-neutral-600">Age 13+</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setAdults(Math.max(1, adults - 1))}
                      className="w-8 h-8 border border-neutral-300 rounded-full flex items-center justify-center hover:border-neutral-900"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center">{adults}</span>
                    <button 
                      onClick={() => setAdults(adults + 1)}
                      className="w-8 h-8 border border-neutral-300 rounded-full flex items-center justify-center hover:border-neutral-900"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Children */}
                <div className="border-b border-neutral-200 py-6 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Children</h3>
                    <p className="text-sm text-neutral-600">Ages 2 – 12</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setChildren(Math.max(0, children - 1))}
                      className="w-8 h-8 border border-neutral-300 rounded-full flex items-center justify-center hover:border-neutral-900"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center">{children}</span>
                    <button 
                      onClick={() => setChildren(children + 1)}
                      className="w-8 h-8 border border-neutral-300 rounded-full flex items-center justify-center hover:border-neutral-900"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Infants */}
                <div className="border-b border-neutral-200 py-6 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Infants</h3>
                    <p className="text-sm text-neutral-600">Under 2</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setInfants(Math.max(0, infants - 1))}
                      className="w-8 h-8 border border-neutral-300 rounded-full flex items-center justify-center hover:border-neutral-900"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center">{infants}</span>
                    <button 
                      onClick={() => setInfants(infants + 1)}
                      className="w-8 h-8 border border-neutral-300 rounded-full flex items-center justify-center hover:border-neutral-900"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Pets */}
                <div className="py-6 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Pets</h3>
                    <button className="text-sm text-neutral-600 underline hover:text-neutral-900">
                      Bringing a service animal?
                    </button>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setPets(Math.max(0, pets - 1))}
                      className="w-8 h-8 border border-neutral-300 rounded-full flex items-center justify-center hover:border-neutral-900"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center">{pets}</span>
                    <button 
                      onClick={() => setPets(pets + 1)}
                      className="w-8 h-8 border border-neutral-300 rounded-full flex items-center justify-center hover:border-neutral-900"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-5 py-4 flex items-center justify-between lg:hidden">
                <button 
                  onClick={() => setShowChangeGuests(false)}
                  className="text-neutral-700 font-semibold hover:bg-neutral-50 px-6 py-2 rounded"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => setShowChangeGuests(false)}
                  className="bg-black text-white font-semibold px-8 py-2 rounded hover:bg-neutral-800 transition"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Change Dates Panel */}
      <AnimatePresence>
        {showChangeDates && (
          <>
            <div 
              className="fixed inset-0 bg-black/20 z-40 lg:hidden" 
              onClick={() => setShowChangeDates(false)} 
            />
            
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 260 }}
              className="fixed inset-x-0 bottom-0 bg-white z-50 rounded-t-2xl max-h-[95vh] overflow-y-auto lg:hidden"
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-neutral-200 px-5 py-4 flex items-center justify-between z-10">
                <button 
                  onClick={() => setShowChangeDates(false)} 
                  className="p-2 hover:bg-neutral-100 rounded-full transition"
                >
                  <X className="w-6 h-6" />
                </button>
                <h2 className="text-lg font-semibold absolute left-1/2 -translate-x-1/2">Select dates</h2>
                <button 
                  onClick={() => {
                    setCheckInDate(undefined);
                    setCheckOutDate(undefined);
                  }}
                  className="text-sm font-semibold underline"
                >
                  Clear
                </button>
              </div>

              {/* Content */}
              <div className="p-5 pb-32">
                {/* Calendar */}
                <Calendar
                  mode="range"
                  selected={{
                    from: checkInDate,
                    to: checkOutDate,
                  }}
                  onSelect={(range) => {
                    if (range?.from) {
                      setCheckInDate(range.from);
                      setCheckOutDate(range.to);
                    }
                  }}
                  numberOfMonths={3}
                  className="rounded-md"
                  disabled={(date) => date < new Date()}
                />
              </div>

              {/* Footer */}
              <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-5 py-4 flex items-center justify-between lg:hidden">
                <button 
                  onClick={() => setShowChangeDates(false)}
                  className="text-neutral-700 font-semibold hover:bg-neutral-50 px-6 py-2 rounded"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => setShowChangeDates(false)}
                  disabled={!checkInDate || !checkOutDate}
                  className="bg-black text-white font-semibold px-8 py-2 rounded hover:bg-neutral-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      </motion.div>
  );
}
