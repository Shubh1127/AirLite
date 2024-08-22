const express = require("express");
const router = express.Router();
const Listing = require("../models/listing.js");
const wrapAsync = require("../utils/wrapAsync.js");
const { listingSchema } = require("../Schema.js");
// const Review = require('../models/review.js'); // Adjust the path as needed
const { isLoggedIn, isOwner } = require("../middleware.js");
const ExpressError = require("../utils/ExpressError.js");
const multer=require("multer")
const upload= multer({dest:"uploads/"})

const listingController = require("../controllers/listing.js");

const validateListing = (req, res, next) => {
  let { error } = listingSchema.validate(req.body);
  if (error) {
    console.log(error);
    throw new ExpressError(400, error);
  } else {
    next();
  }
};

router
.route("/")
//show all listings
.get( wrapAsync(listingController.index))
//create listing
.post(validateListing , isLoggedIn ,wrapAsync(listingController.createListing))

//New Route
router.get("/new", isLoggedIn , listingController.renderNewForm);

router
  .route("/:id")
  //show listing
  .get(wrapAsync(listingController.showListing))
  // Update listing route
  .put(validateListing , isLoggedIn , isOwner ,wrapAsync(listingController.updateListing))
  //delete listing
  .delete(isLoggedIn , isOwner , wrapAsync(listingController.destroyListing))

  
//edit listing
router.get("/:id/edit" ,isLoggedIn , isOwner , wrapAsync(listingController.renderEditForm));
















module.exports = router;
