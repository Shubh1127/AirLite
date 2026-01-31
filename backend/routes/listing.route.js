const express = require("express");
const router = express.Router();

const listingController = require("../controllers/listing.controller");
const { isLoggedIn } = require("../middlewares/auth.middlware");
const upload = require("../middlewares/multer.middleware");

/* =========================
   PUBLIC
========================= */
router.get("/", listingController.getAllListings);
router.get("/:id", listingController.getListingById);

router.post(
  "/",
  isLoggedIn,
  upload.array("images", 5),
  listingController.createListing
);

router.put(
  "/:id",
  isLoggedIn,
  upload.array("images", 5),
  listingController.updateListing
);

router.delete("/:id", isLoggedIn, listingController.deleteListing);

module.exports = router;
