const User = require("../models/user.model");

/**
 * Middleware to check if user's email is verified
 * Required before creating listings or making reservations
 */
exports.requireEmailVerification = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Google users are automatically verified
    if (user.provider === "google") {
      req.user.isEmailVerified = true;
      return next();
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(403).json({
        message: "Please verify your email address before performing this action",
        emailVerified: false,
        requiresVerification: true,
      });
    }

    req.user.isEmailVerified = true;
    next();
  } catch (err) {
    console.error("Email verification middleware error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
