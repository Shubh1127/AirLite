const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const wishlistAPI = {
  // Get user's wishlist
  async getWishlist(token: string) {
    const response = await fetch(`${API_BASE_URL}/api/wishlist`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch wishlist");
    }

    return response.json();
  },

  // Add listing to wishlist
  async addToWishlist(listingId: string, token: string) {
    const response = await fetch(`${API_BASE_URL}/api/wishlist/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ listingId }),
    });

    if (!response.ok) {
      throw new Error("Failed to add to wishlist");
    }

    return response.json();
  },

  // Remove listing from wishlist
  async removeFromWishlist(listingId: string, token: string) {
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

    return response.json();
  },

  // Toggle listing in wishlist
  async toggleWishlist(listingId: string, token: string) {
    const response = await fetch(`${API_BASE_URL}/api/wishlist/toggle`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ listingId }),
    });

    if (!response.ok) {
      throw new Error("Failed to toggle wishlist");
    }

    return response.json();
  },
};
