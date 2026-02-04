const Wishlist = require("../models/wishlist.model");
const Listing = require("../models/listing.model");

// Get user's wishlist
exports.getWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user.id }).populate({
      path: "listings",
      populate: {
        path: "owner",
        select: "firstName lastName avatar",
      },
    });

    if (!wishlist) {
      wishlist = await Wishlist.create({
        user: req.user.id,
        listings: [],
      });
    }

    res.status(200).json(wishlist);
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    res.status(500).json({ message: "Failed to fetch wishlist" });
  }
};

// Add listing to wishlist
exports.addToWishlist = async (req, res) => {
  try {
    const { listingId } = req.body;

    // Check if listing exists
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    let wishlist = await Wishlist.findOne({ user: req.user.id });

    if (!wishlist) {
      wishlist = await Wishlist.create({
        user: req.user.id,
        listings: [listingId],
      });
    } else {
      // Check if already in wishlist
      if (wishlist.listings.includes(listingId)) {
        return res
          .status(400)
          .json({ message: "Listing already in wishlist" });
      }

      wishlist.listings.push(listingId);
      await wishlist.save();
    }

    await wishlist.populate({
      path: "listings",
      populate: {
        path: "owner",
        select: "firstName lastName avatar",
      },
    });

    res.status(200).json(wishlist);
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    res.status(500).json({ message: "Failed to add to wishlist" });
  }
};

// Remove listing from wishlist
exports.removeFromWishlist = async (req, res) => {
  try {
    const { listingId } = req.params;

    const wishlist = await Wishlist.findOne({ user: req.user.id });

    if (!wishlist) {
      return res.status(404).json({ message: "Wishlist not found" });
    }

    wishlist.listings = wishlist.listings.filter(
      (id) => id.toString() !== listingId
    );
    await wishlist.save();

    await wishlist.populate({
      path: "listings",
      populate: {
        path: "owner",
        select: "firstName lastName avatar",
      },
    });

    res.status(200).json(wishlist);
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    res.status(500).json({ message: "Failed to remove from wishlist" });
  }
};

// Toggle wishlist (add if not present, remove if present)
exports.toggleWishlist = async (req, res) => {
  try {
    const { listingId } = req.body;

    // Check if listing exists
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    let wishlist = await Wishlist.findOne({ user: req.user.id });

    if (!wishlist) {
      wishlist = await Wishlist.create({
        user: req.user.id,
        listings: [listingId],
      });
    } else {
      const index = wishlist.listings.indexOf(listingId);
      if (index > -1) {
        wishlist.listings.splice(index, 1);
      } else {
        wishlist.listings.push(listingId);
      }
      await wishlist.save();
    }

    await wishlist.populate({
      path: "listings",
      populate: {
        path: "owner",
        select: "firstName lastName avatar",
      },
    });

    res.status(200).json(wishlist);
  } catch (error) {
    console.error("Error toggling wishlist:", error);
    res.status(500).json({ message: "Failed to toggle wishlist" });
  }
};
