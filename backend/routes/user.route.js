const express = require("express");
const router = express.Router();

const userController = require("../controllers/user.controller");
const { isLoggedIn } = require("../middlewares/auth.middlware");
const upload = require("../middlewares/multer.middleware");

/* =========================
   AUTH ROUTES
========================= */

// Register
router.post("/register", userController.register);

// Login
router.post("/login", userController.login);

// OAuth Google Login/Register
router.post("/oauth/google", userController.googleOAuth);

// Logout (client-side token removal)
router.post("/logout", userController.logout);

/* =========================
   USER PROFILE
========================= */

// Get logged-in user
router.get("/me", isLoggedIn, userController.getMe);

// Get logged-in user's reviews
router.get("/me/reviews", isLoggedIn, userController.getMyReviews);

// Get logged-in user's trips
router.get("/me/trips", isLoggedIn, userController.getMyTrips);

// Update profile
router.put("/profile", isLoggedIn, upload.single("avatar"), userController.updateProfile);

// Skip profile setup (for OAuth users)
router.post("/skip-profile-setup", isLoggedIn, userController.skipProfileSetup);

// Change password
router.put("/change-password", isLoggedIn, userController.changePassword);

/* =========================
   HOST PROFILE ROUTES
========================= */

// Become a host (initialize host profile)
router.post("/become-host", isLoggedIn, userController.becomeHost);

// Get host profile
router.get("/host-profile", isLoggedIn, userController.getHostProfile);

// Update host profile
router.put("/host-profile", isLoggedIn, userController.updateHostProfile);

// Update host verifications (ID, work email, etc.)
router.put("/host-verifications", isLoggedIn, userController.updateHostVerifications);

/* =========================
   USER ACTIONS
========================= */

// Wishlist toggle
router.post("/wishlist/:listingId", isLoggedIn, userController.toggleWishlist);

/* =========================
   ADMIN ROUTES (if needed)
========================= */

// Block user (admin only - you might want to add admin middleware)
router.put("/admin/block/:userId", isLoggedIn, userController.blockUser);

// Promote to superhost (admin only)
router.put("/admin/promote-superhost", isLoggedIn, userController.promoteToSuperhost);

module.exports = router;