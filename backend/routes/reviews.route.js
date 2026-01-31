const express = require("express");
const router = express.Router({ mergeParams: true });

const reviewController = require("../controllers/review.controller");
const { isLoggedIn } = require("../middlewares/auth.middlware");

/* =========================
   REVIEWS
========================= */

// create review
router.post("/", isLoggedIn, reviewController.createReview);

// delete review
router.delete("/:reviewId", isLoggedIn, reviewController.deleteReview);

// host reply
router.post("/:reviewId/reply", isLoggedIn, reviewController.replyToReview);

module.exports = router;
