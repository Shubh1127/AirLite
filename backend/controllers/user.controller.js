const User = require("../models/user.model");
const Review = require("../models/review.model");
const Reservation = require("../models/reservation.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendSignupEmail, sendLoginEmail, sendVerificationEmail } = require("../utils/mail.util");

/* =========================
   TOKEN HELPER
========================= */
const generateToken = (userId) => {
  const secret = process.env.SECRET;
  if (!secret) {
    console.error("WARNING: SECRET environment variable not found!");
    throw new Error("SECRET environment variable is not set");
  }
  return jwt.sign({ id: userId }, secret, {
    expiresIn: "7d",
  });
};

/* =========================
   REGISTER
========================= */
exports.register = async (req, res) => {
  const { email, password, firstName, lastName, phone, gender, dateOfBirth } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      phone,
      gender,
      dateOfBirth,
    });

    const token = generateToken(user._id);

    // Generate 6-digit verification code and send email
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.emailVerificationToken = crypto
      .createHash("sha256")
      .update(verificationCode)
      .digest("hex");
    user.emailVerificationExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    // Send welcome email (async, don't wait)
    sendSignupEmail({
      email: user.email,
      name: user.firstName || user.email.split('@')[0],
      username: user.firstName || user.email.split('@')[0],
    }).catch(err => console.error('Failed to send signup email:', err));

    // Send verification email with code (async, don't wait)
    sendVerificationEmail(
      {
        email: user.email,
        name: user.firstName || user.email.split('@')[0],
        username: user.firstName || user.email.split('@')[0],
      },
      verificationCode
    ).catch(err => console.error('Failed to send verification email:', err));

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isEmailVerified: user.isEmailVerified,
        provider: user.provider,
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: err.message || "Registration failed" });
  }
};

/* =========================
   LOGIN (Email + Password)
========================= */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // 🚫 Block password login for Google-only users
    if (user.provider === "google") {
      return res.status(403).json({
        message: "This account uses Google sign-in. Please continue with Google.",
      });
    }

    // 🚫 Account blocked
    if (user.isBlocked) {
      return res.status(403).json({
        message: "Account blocked",
      });
    }

    // ✅ Password check (REQUIRED)
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    // Send login notification email (async, don't wait)
    sendLoginEmail(
      {
        email: user.email,
        name: user.firstName || user.email.split('@')[0],
        username: user.firstName || user.email.split('@')[0],
      },
      {
        time: new Date().toLocaleString(),
        device: req.headers['user-agent'] || 'Unknown',
        location: req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'Unknown',
        ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'Unknown',
      }
    ).catch(err => console.error('Failed to send login email:', err));

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        profile: user.profile,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
        provider: user.provider,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({
      message: "Login failed",
    });
  }
};


exports.googleOAuth = async (req, res) => {
  try {
    const { email, firstName, lastName, avatar, googleId } = req.body;
    console.log("request is coming",req.body)

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    let user = await User.findOne({ email });
    console.log(user)

    if (user) {
      // ✅ Link Google account safely
      if (!user.googleId) {
        user.googleId = googleId;
      }

      // ✅ If user was created locally but now logging in with Google, verify email and update provider
      if (user.provider === "local") {
        user.isEmailVerified = true; // Google has verified the email
        user.emailVerificationToken = undefined; // Clear any pending verification
        user.emailVerificationExpires = undefined;
        user.provider = "both"; // User can now use both methods
      } else if (user.provider !== "both" && user.provider !== "google") {
        user.provider = "google";
      }

      // ✅ Ensure Google users are always verified
      if (!user.isEmailVerified) {
        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
      }

      // ✅ Update avatar only if missing
      if (avatar && !user.avatar?.url) {
        user.avatar = { url: avatar, publicId: "" };
      }

      user.lastLogin = new Date();
      await user.save();

      const token = generateToken(user._id);

      return res.status(200).json({
        message: "Login successful",
        token,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          profile: user.profile,
          avatar: user.avatar,
          isEmailVerified: user.isEmailVerified,
          provider: user.provider,
        },
        needsAdditionalInfo: !user.phone || !user.dateOfBirth,
      });
    }

    // ✅ New Google user
    user = await User.create({
      email,
      firstName: firstName || email.split("@")[0],
      lastName: lastName || "",
      googleId,
      provider: "google",
      isEmailVerified: true,
      avatar: avatar ? { url: avatar, publicId: "" } : undefined,
      lastLogin: new Date(),
    });

    const token = generateToken(user._id);

    res.status(201).json({
      message: "User registered successfully via Google",
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        profile: user.profile,
        avatar: user.avatar,
      },
      needsAdditionalInfo: !user.phone || !user.dateOfBirth,
    });
  } catch (err) {
    console.error("Google OAuth error:", err);
    res.status(500).json({ message: "OAuth failed" });
  }
};


/* =========================
   GET CURRENT USER
========================= */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate("wishlist")
      .populate("listings")
      .select("-password");

    const response = {
      ...user.toObject(),
      isSuperhost: user.hostProfile?.hostRank === "superhost"
    };

    res.json(response);
  } catch (err) {
    console.error("Get me error:", err);
    res.status(500).json({ message: "Failed to get user data" });
  }
};

/* =========================
   GET MY REVIEWS
========================= */
exports.getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ author: req.user.id })
      .populate({
        path: "listing",
        select: "title location country images",
      })
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (err) {
    console.error("Get my reviews error:", err);
    res.status(500).json({ message: "Failed to get reviews" });
  }
};

/* =========================
   GET MY TRIPS
========================= */
exports.getMyTrips = async (req, res) => {
  try {
    const trips = await Reservation.find({ guest: req.user.id })
      .populate({
        path: "listing",
        select: "title location country images pricePerNight cancellationPolicy",
      })
      .sort({ createdAt: -1 });

    res.json(trips);
  } catch (err) {
    console.error("Get my trips error:", err);
    res.status(500).json({ message: "Failed to get trips" });
  }
};

/* =========================
   UPDATE PROFILE
========================= */
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const profilePayload = req.body.profile ? JSON.parse(req.body.profile) : {};

    const updates = {
      firstName: req.body.firstName ?? user.firstName,
      lastName: req.body.lastName ?? user.lastName,
      phone: req.body.phone ?? user.phone,
      bio: req.body.bio ?? user.bio,
      gender: req.body.gender ?? user.gender,
      dateOfBirth: req.body.dateOfBirth ?? user.dateOfBirth,
    };

    if (req.file) {
      updates.avatar = {
        url: req.file.path,
        publicId: req.file.filename,
      };
    }

    const mergedProfile = {
      ...(user.profile || {}),
      ...profilePayload,
    };

    updates.profile = mergedProfile;

    const updatedUser = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
    });

    res.json({
      message: "Profile updated",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ message: "Profile update failed" });
  }
};

/* =========================
   SKIP PROFILE SETUP
========================= */
exports.skipProfileSetup = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Just mark that we've processed the OAuth without requiring additional info
    // This is done by setting a flag or just returning success
    // The needsAdditionalInfo will be false since it's based on missing phone/dateOfBirth
    // But we can add a field if needed
    
    res.json({
      message: "Profile setup skipped",
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      needsAdditionalInfo: false,
    });
  } catch (err) {
    console.error("Skip profile setup error:", err);
    res.status(500).json({ message: "Failed to skip profile setup" });
  }
};

/* =========================
   CHANGE PASSWORD
========================= */
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id).select("+password");

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return res.status(401).json({ message: "Current password incorrect" });
  }

  user.password = newPassword;
  await user.save();

  res.json({ message: "Password updated successfully" });
};

/* =========================
   TOGGLE WISHLIST
========================= */
exports.toggleWishlist = async (req, res) => {
  const { listingId } = req.params;

  const user = await User.findById(req.user.id);

  const index = user.wishlist.indexOf(listingId);

  if (index === -1) {
    user.wishlist.push(listingId);
  } else {
    user.wishlist.splice(index, 1);
  }

  await user.save();

  res.json({
    message: "Wishlist updated",
    wishlist: user.wishlist,
  });
};

/* =========================
   BECOME HOST
========================= */
/* =========================
   BECOME HOST
========================= */
exports.becomeHost = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (user.role === "host" || user.role === "both") {
      return res.status(400).json({ message: "Already a host" });
    }

    // Initialize host profile with default values
    user.role = "both"; // or "host" if you want separate roles
    
    user.hostProfile = {
      hostSince: new Date(),
      experienceYears: 0,
      hostRank: "new",
      education: {},
      professionalWork: {},
      languages: [],
      responseStats: {
        responseRate: 0,
        responseTime: "within a day",
        acceptanceRate: 0
      },
      verifications: {
        email: true, // Already verified during registration
        phone: !!user.phone, // True if phone is provided
        identity: false,
        workEmail: false,
        governmentId: false
      },
      hostBio: "",
      whyHost: "",
      hostStory: "",
      hostingStyle: [],
      localRecommendations: [],
      certifications: []
    };

    // Initialize host stats
    user.hostStats = {
      totalReviews: 0,
      averageRating: 0,
      totalListings: 0,
      totalGuestsHosted: 0,
      yearsAsHost: 0,
      superhostStreak: 0,
      monthlyStats: {
        revenue: 0,
        bookings: 0,
        occupancyRate: 0,
        updatedAt: new Date()
      }
    };

    await user.save();

    res.json({
      message: "You are now a host! Please complete your host profile.",
      role: user.role,
      hostProfile: user.hostProfile,
      hostStats: user.hostStats
    });
  } catch (err) {
    console.error("Become host error:", err);
    res.status(500).json({ message: "Failed to become a host" });
  }
};

/* =========================
   UPDATE HOST PROFILE
========================= */
exports.updateHostProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    // Check if user is a host
    if (user.role === "guest") {
      return res.status(400).json({ 
        message: "You need to become a host first" 
      });
    }

    const {
      experienceYears,
      education,
      professionalWork,
      languages,
      hostBio,
      whyHost,
      hostStory,
      hostingStyle,
      localRecommendations,
      certifications,
      responseTime
    } = req.body;

    // Parse JSON strings if needed
    const parsedEducation = typeof education === 'string' ? JSON.parse(education) : education;
    const parsedProfessionalWork = typeof professionalWork === 'string' ? JSON.parse(professionalWork) : professionalWork;
    const parsedLanguages = typeof languages === 'string' ? JSON.parse(languages) : languages;
    const parsedCertifications = typeof certifications === 'string' ? JSON.parse(certifications) : certifications;
    const parsedLocalRecommendations = typeof localRecommendations === 'string' ? JSON.parse(localRecommendations) : localRecommendations;

    // Update host profile
    user.hostProfile = {
      ...user.hostProfile,
      ...(experienceYears !== undefined && { experienceYears }),
      ...(parsedEducation && { education: parsedEducation }),
      ...(parsedProfessionalWork && { professionalWork: parsedProfessionalWork }),
      ...(parsedLanguages && { languages: parsedLanguages }),
      ...(hostBio !== undefined && { hostBio }),
      ...(whyHost !== undefined && { whyHost }),
      ...(hostStory !== undefined && { hostStory }),
      ...(hostingStyle && { hostingStyle }),
      ...(parsedLocalRecommendations && { localRecommendations: parsedLocalRecommendations }),
      ...(parsedCertifications && { certifications: parsedCertifications }),
      ...(responseTime && { 
        responseStats: {
          ...user.hostProfile?.responseStats,
          responseTime
        }
      })
    };

    await user.save();

    res.json({
      message: "Host profile updated successfully",
      hostProfile: user.hostProfile
    });
  } catch (err) {
    console.error("Update host profile error:", err);
    res.status(500).json({ message: "Failed to update host profile" });
  }
};

/* =========================
   GET HOST PROFILE
========================= */
exports.getHostProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (user.role === "guest") {
      return res.status(400).json({ 
        message: "You are not a host" 
      });
    }

    res.json({
      hostProfile: user.hostProfile,
      hostStats: user.hostStats,
      isSuperhost: user.hostProfile?.hostRank === "superhost",
      hostExperience: user.hostProfile?.experienceYears || 0
    });
  } catch (err) {
    console.error("Get host profile error:", err);
    res.status(500).json({ message: "Failed to get host profile" });
  }
};

/* =========================
   UPDATE HOST VERIFICATIONS
========================= */
exports.updateHostVerifications = async (req, res) => {
  try {
    const { verificationType, verified } = req.body;
    const validTypes = ["identity", "workEmail", "governmentId"];

    if (!validTypes.includes(verificationType)) {
      return res.status(400).json({ 
        message: "Invalid verification type" 
      });
    }

    const user = await User.findById(req.user.id);

    if (user.role === "guest") {
      return res.status(400).json({ 
        message: "You need to be a host to update verifications" 
      });
    }

    // Update verification status
    user.hostProfile.verifications = {
      ...user.hostProfile.verifications,
      [verificationType]: verified
    };

    await user.save();

    res.json({
      message: "Verification status updated",
      verifications: user.hostProfile.verifications
    });
  } catch (err) {
    console.error("Update verifications error:", err);
    res.status(500).json({ message: "Failed to update verifications" });
  }
};

/* =========================
   ADMIN: BLOCK USER
========================= */
exports.blockUser = async (req, res) => {
  const { userId } = req.params;

  const user = await User.findByIdAndUpdate(
    userId,
    { isBlocked: true },
    { new: true }
  );

  res.json({
    message: "User blocked",
    userId: user._id,
  });
};

exports.logout = (req, res) => {
  res.json({ message: "Logged out successfully" });
};

/* =========================
   ADMIN: PROMOTE SUPERHOST
========================= */
exports.promoteToSuperhost = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.promoteToSuperhost();

    res.json({
      message: "User promoted to superhost",
      userId: user._id,
      hostRank: user.hostProfile?.hostRank,
      superhostStreak: user.hostStats?.superhostStreak,
    });
  } catch (err) {
    console.error("Promote superhost error:", err);
    res.status(500).json({ message: "Failed to promote superhost" });
  }
};

/* =========================
   SEND EMAIL VERIFICATION
========================= */
exports.sendEmailVerification = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user signed up with Google
    if (user.provider === "google") {
      return res.status(400).json({ message: "Google users are already verified" });
    }

    // Check if already verified
    if (user.isEmailVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.emailVerificationToken = crypto
      .createHash("sha256")
      .update(verificationCode)
      .digest("hex");
    user.emailVerificationExpires = Date.now() + 15 * 60 * 1000; // 15 minutes

    await user.save();

    // Send verification email with code
    await sendVerificationEmail(
      {
        email: user.email,
        name: user.firstName || user.email.split("@")[0],
        username: user.firstName || user.email.split("@")[0],
      },
      verificationCode
    );

    res.json({
      message: "Verification email sent successfully",
    });
  } catch (err) {
    console.error("Send verification error:", err);
    res.status(500).json({ message: "Failed to send verification email" });
  }
};

/* =========================
   VERIFY EMAIL WITH CODE
========================= */
exports.verifyEmail = async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user?.id;

    if (!code) {
      return res.status(400).json({ message: "Verification code is required" });
    }

    // Hash code to compare with stored hash
    const hashedCode = crypto.createHash("sha256").update(code.toString()).digest("hex");

    const user = await User.findOne({
      _id: userId,
      emailVerificationToken: hashedCode,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired verification code" });
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;

    await user.save();

    res.json({
      message: "Email verified successfully",
      isEmailVerified: true,
    });
  } catch (err) {
    console.error("Verify email error:", err);
    res.status(500).json({ message: "Failed to verify email" });
  }
};

/* =========================
   CHANGE PASSWORD
========================= */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" });
    }

    const user = await User.findById(req.user.id).select("+password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user signed up with Google
    if (user.provider === "google") {
      return res.status(400).json({ message: "Google users cannot change password" });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(403).json({ message: "Please verify your email before changing password" });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Validate new password
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      message: "Password changed successfully",
    });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ message: "Failed to change password" });
  }
};
