const express = require("express");
const router = express.Router();
const wishlistController = require("../controllers/wishlist.controller");
const { isLoggedIn } = require("../middlewares/auth.middlware");

// Get user's wishlist
router.get("/", isLoggedIn, wishlistController.getWishlist);

// Add to wishlist
router.post("/add", isLoggedIn, wishlistController.addToWishlist);

// Remove from wishlist
router.delete(
  "/remove/:listingId",
  isLoggedIn,
  wishlistController.removeFromWishlist
);

// Toggle wishlist
router.post("/toggle", isLoggedIn, wishlistController.toggleWishlist);

module.exports = router;
