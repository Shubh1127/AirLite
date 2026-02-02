const express = require("express");
const router = express.Router();

const listingController = require("../controllers/listing.controller");
const { isLoggedIn } = require("../middlewares/auth.middlware");
const upload = require("../middlewares/multer.middleware");

/* =========================
   PUBLIC
========================= */
router.get("/", listingController.getAllListings);
router.get("/suggestions", listingController.getLocationSuggestions);
router.get("/user/my-listings", isLoggedIn, listingController.getMyListings);
router.get("/:id([0-9a-fA-F]{24})", listingController.getListingById);

router.post(
  "/",
  isLoggedIn,
  upload.array("images", 5),
  listingController.createListing
);

router.put(
  "/:id([0-9a-fA-F]{24})",
  isLoggedIn,
  upload.array("images", 5),
  listingController.updateListing
);

router.delete("/:id([0-9a-fA-F]{24})", isLoggedIn, listingController.deleteListing);

module.exports = router;
