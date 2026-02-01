const Review = require("../models/review.model");
const Listing = require("../models/listing.model");

/* =========================
   CREATE REVIEW
========================= */
exports.createReview = async (req, res) => {
  try {
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
    const totalRating = listing.rating * listing.reviewCount + rating;

    listing.reviewCount += 1;
    listing.rating = totalRating / listing.reviewCount;

    // Save with validation disabled to avoid image subdocument errors
    await listing.save({ validateBeforeSave: false });

    res.status(201).json({
      message: "Review added successfully",
      review,
    });
  } catch (err) {
    console.error("Create review error:", err);
    res.status(500).json({ 
      message: "Failed to create review",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/* =========================
   DELETE REVIEW
========================= */
exports.deleteReview = async (req, res) => {
  try {
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

    await listing.save({ validateBeforeSave: false });
    await Review.findByIdAndDelete(reviewId);

    res.json({ message: "Review deleted successfully" });
  } catch (err) {
    console.error("Delete review error:", err);
    res.status(500).json({
      message: "Failed to delete review",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

/* =========================
   HOST REPLY (OPTIONAL)
========================= */
exports.replyToReview = async (req, res) => {
  try {
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
  } catch (err) {
    console.error("Reply to review error:", err);
    res.status(500).json({
      message: "Failed to add reply",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};
