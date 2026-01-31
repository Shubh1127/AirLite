const Review = require("../models/review.model");
const Listing = require("../models/listing.model");

/* =========================
   CREATE REVIEW
========================= */
exports.createReview = async (req, res) => {
  const { id } = req.params; // listing id
  const { comment, rating, ratings } = req.body;

  const listing = await Listing.findById(id);
  if (!listing) {
    return res.status(404).json({ message: "Listing not found" });
  }

  const review = await Review.create({
    comment,
    rating,
    ratings, // optional detailed ratings
    author: req.user.id,
    listing: id,
  });

  // attach review to listing
  listing.reviews.push(review._id);

  // update listing rating
  const totalRating =
    listing.rating * listing.reviewCount + rating;

  listing.reviewCount += 1;
  listing.rating = totalRating / listing.reviewCount;

  await listing.save();

  res.status(201).json({
    message: "Review added successfully",
    review,
  });
};

/* =========================
   DELETE REVIEW
========================= */
exports.deleteReview = async (req, res) => {
  const { id, reviewId } = req.params;

  const review = await Review.findById(reviewId);
  if (!review) {
    return res.status(404).json({ message: "Review not found" });
  }

  // only author can delete review
  if (review.author.toString() !== req.user.id) {
    return res.status(403).json({ message: "Not authorized" });
  }

  const listing = await Listing.findById(id);
  if (!listing) {
    return res.status(404).json({ message: "Listing not found" });
  }

  // remove review reference from listing
  listing.reviews.pull(reviewId);

  // update rating after deletion
  if (listing.reviewCount > 1) {
    const totalRating =
      listing.rating * listing.reviewCount - review.rating;

    listing.reviewCount -= 1;
    listing.rating = totalRating / listing.reviewCount;
  } else {
    listing.reviewCount = 0;
    listing.rating = 0;
  }

  await listing.save();
  await Review.findByIdAndDelete(reviewId);

  res.json({ message: "Review deleted successfully" });
};

/* =========================
   HOST REPLY (OPTIONAL)
========================= */
exports.replyToReview = async (req, res) => {
  const { reviewId } = req.params;
  const { comment } = req.body;

  const review = await Review.findById(reviewId).populate("listing");
  if (!review) {
    return res.status(404).json({ message: "Review not found" });
  }

  // only listing owner (host) can reply
  if (review.listing.owner.toString() !== req.user.id) {
    return res.status(403).json({ message: "Not authorized" });
  }

  review.hostReply = {
    comment,
    repliedAt: new Date(),
  };

  await review.save();

  res.json({
    message: "Reply added",
    review,
  });
};
