const Listing = require("../models/listing.model");
const Review = require("../models/review.model");
const jwt = require("jsonwebtoken");

/* =========================
   AUTH CHECK (JWT)
========================= */
exports.isLoggedIn = (req, res, next) => {
  if (req.user && req.user.id) {
    return next();
  }

  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.replace("Bearer ", "")
    : null;

  if (!token) {
    return res.status(401).json({
      message: "You must be logged in",
    });
  }

  try {
    const secret = process.env.SECRET;
    if (!secret) {
      return res.status(500).json({ message: "Server auth not configured" });
    }

    const decoded = jwt.verify(token, secret);
    req.user = { id: decoded.id };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

/* =========================
   LISTING OWNER CHECK
========================= */
exports.isOwner = async (req, res, next) => {
  const { id } = req.params;

  const listing = await Listing.findById(id);
  if (!listing) {
    return res.status(404).json({
      message: "Listing not found",
    });
  }

  if (listing.owner.toString() !== req.user.id) {
    return res.status(403).json({
      message: "You do not have permission to modify this listing",
    });
  }

  next();
};

/* =========================
   REVIEW AUTHOR CHECK
========================= */
exports.isReviewAuthor = async (req, res, next) => {
  const { reviewId } = req.params;

  const review = await Review.findById(reviewId);
  if (!review) {
    return res.status(404).json({
      message: "Review not found",
    });
  }

  if (review.author.toString() !== req.user.id) {
    return res.status(403).json({
      message: "You do not have permission to modify this review",
    });
  }

  next();
};
