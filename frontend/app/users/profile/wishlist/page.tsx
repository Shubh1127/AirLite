"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, ChevronLeft, Star, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function WishlistPage() {
  const router = useRouter();
  const { isAuthenticated, token, hasHydrated } = useAuthStore();
  const [wishlist, setWishlist] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasHydrated) return;

    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    fetchWishlist();
  }, [isAuthenticated, hasHydrated, router, token]);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/wishlist`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch wishlist");
      }

      const data = await response.json();
      setWishlist(data);
    } catch (error) {
      console.error("Error fetching wishlist:", error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (listingId: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/wishlist/remove/${listingId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to remove from wishlist");
      }

      const data = await response.json();
      setWishlist(data);
    } catch (error) {
      console.error("Error removing from wishlist:", error);
    }
  };

  if (loading || !hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 26, stiffness: 260 }}
      className="min-h-screen bg-white"
    >
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 bg-white border-b border-neutral-200 px-5 py-4 flex items-center gap-3 z-10">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-neutral-100 rounded-full transition"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-semibold">Wishlists</h1>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block max-w-6xl mx-auto px-12 py-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-neutral-100 rounded-full transition border border-neutral-200"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-semibold">Wishlists</h1>
        </div>
      </div>

      {/* Content */}
      <div className="lg:max-w-6xl lg:mx-auto px-5 lg:px-12 pb-24">
        {wishlist?.listings && wishlist.listings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlist.listings.map((listing: any) => (
              <div key={listing._id} className="group cursor-pointer">
                <Link href={`/listings/${listing._id}`}>
                  <div className="relative mb-3 rounded-xl overflow-hidden aspect-square">
                    <img
                      src={listing.images?.[0]?.url || "/placeholder.jpg"}
                      alt={listing.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeFromWishlist(listing._id);
                      }}
                      className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white rounded-full transition"
                    >
                      <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-neutral-900 truncate">
                        {listing.location}, {listing.country || "India"}
                      </h3>
                      {listing.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-black" />
                          <span className="text-sm font-semibold">
                            {listing.rating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-neutral-600 truncate">
                      {listing.title}
                    </p>

                    <p className="text-sm text-neutral-600">
                      {listing.maxGuests}{" "}
                      {listing.maxGuests === 1 ? "guest" : "guests"}
                    </p>

                    <div className="pt-1">
                      <span className="font-semibold">
                        ₹{listing.pricePerNight?.toLocaleString()}
                      </span>
                      <span className="text-neutral-600"> night</span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Heart className="w-16 h-16 text-neutral-300 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">
              No wishlists yet
            </h2>
            <p className="text-neutral-600 mb-6 max-w-md">
              When you find a place you like, tap the heart icon to save it to
              your wishlists.
            </p>
            <Link
              href="/"
              className="bg-rose-500 hover:bg-rose-600 text-white px-8 py-3 rounded-lg font-semibold transition"
            >
              Start exploring
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  );
}
