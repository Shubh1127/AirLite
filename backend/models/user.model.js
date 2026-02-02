const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: function () {
        return !this.provider || this.provider === "local"; // Only required for local auth
      },
      select: false,
    },

    provider: {
      type: String,
      default: "local",
      enum: ["local", "google", "facebook", "github","both"],
    },

    googleId: {
      type: String,
      sparse: true,
      unique: true,
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    firstName: String,
    lastName: String,

    avatar: {
      url: String,
      publicId: String,
    },

    phone: String,
    bio: String,
    gender: String,
    dateOfBirth: Date,

    // Personal profile information (visible on profile)
    profile: {
      decadeOfBirth: String,
      work: String,
      school: String,
      spendTooMuchTime: String,
      favoriteSong: String,
      mostUselessSkill: String,
      obsessedWith: String,
      funFact: String,
      intro: String,
      interests: [String],
      travelStamps: [String],
    },

    // Host-specific information (for hosts and superhosts)
    hostProfile: {
      // Host experience and ranking
      hostSince: {
        type: Date,
        default: Date.now,
      },
      experienceYears: {
        type: Number,
        min: 0,
        default: 0,
      },

      // Host ranking/tier
      hostRank: {
        type: String,
        enum: ["new", "rising", "experienced", "superhost"],
        default: "new",
      },

      // Education and professional background
      education: {
        degree: String,
        field: String,
        institution: String,
        graduationYear: Number,
      },

      // Professional work/employment
      professionalWork: {
        title: String,
        company: String,
        industry: String,
        yearsOfExperience: Number,
      },

      // Host languages spoken
      languages: [
        {
          language: String,
          proficiency: {
            type: String,
            enum: ["basic", "conversational", "fluent", "native"],
          },
        },
      ],

      // Host response metrics (for Airbnb-like platforms)
      responseStats: {
        responseRate: {
          type: Number,
          min: 0,
          max: 100,
          default: 0,
        },
        responseTime: {
          type: String,
          enum: [
            "within an hour",
            "within a few hours",
            "within a day",
            "a few days or more",
          ],
        },
        acceptanceRate: {
          type: Number,
          min: 0,
          max: 100,
          default: 0,
        },
      },

      // Verification badges (ID, email, phone, etc.)
      verifications: {
        email: { type: Boolean, default: false },
        phone: { type: Boolean, default: false },
        identity: { type: Boolean, default: false },
        workEmail: { type: Boolean, default: false },
        governmentId: { type: Boolean, default: false },
      },

      // Host bio/description
      hostBio: String,

      // Why they love hosting
      whyHost: String,

      // For guests to get to know the host better
      hostStory: String,

      // Fun facts about hosting style
      hostingStyle: [String],

      // Local recommendations
      localRecommendations: [
        {
          type: {
            type: String,
            enum: [
              "restaurant",
              "cafe",
              "attraction",
              "hidden_gem",
              "shopping",
              "hiking",
              "outdoor",
              "activity",
            ],
          },
          name: String,
          description: String,
        },
      ],

      // Host certification/training
      certifications: [
        {
          name: String,
          issuer: String,
          year: Number,
        },
      ],
    },

    // Host statistics (computed/aggregated from listings and reviews)
    hostStats: {
      totalReviews: {
        type: Number,
        default: 0,
      },
      averageRating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0,
      },
      totalListings: {
        type: Number,
        default: 0,
      },
      totalGuestsHosted: {
        type: Number,
        default: 0,
      },
      yearsAsHost: {
        type: Number,
        default: 0,
      },
      superhostStreak: {
        type: Number,
        default: 0,
      },
      // Monthly/yearly stats
      monthlyStats: {
        revenue: Number,
        bookings: Number,
        occupancyRate: Number,
        updatedAt: Date,
      },
    },

    role: {
      type: String,
      enum: ["guest", "host", "both"],
      default: "guest",
    },

    listings: [{ type: mongoose.Schema.Types.ObjectId, ref: "Listing" }],
    trips: [{ type: mongoose.Schema.Types.ObjectId, ref: "Reservation" }],
    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Listing" }],

    lastLogin: Date,

    isBlocked: {
      type: Boolean,
      default: false,
    },

    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  { timestamps: true },
);

// Virtual for full name
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`.trim();
});

// Virtual for isSuperhost
userSchema.virtual("isSuperhost").get(function () {
  return this.hostProfile?.hostRank === "superhost";
});

// Virtual for host experience in years
userSchema.virtual("hostExperience").get(function () {
  if (!this.hostProfile?.hostSince) return 0;
  const diff = Date.now() - this.hostProfile.hostSince.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
});

// Middleware to calculate years of experience before save
userSchema.pre("save", function (next) {
  if (this.hostProfile?.hostSince) {
    const currentDate = new Date();
    const hostSinceDate = new Date(this.hostProfile.hostSince);
    const diffTime = Math.abs(currentDate - hostSinceDate);
    const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365));

    this.hostProfile.experienceYears = diffYears;
    this.hostStats.yearsAsHost = diffYears;

    // Auto-promote to superhost based on criteria (example logic)
    if (
      diffYears >= 2 &&
      this.hostStats.averageRating >= 4.8 &&
      this.hostStats.totalReviews >= 10 &&
      this.hostProfile.responseStats?.responseRate >= 90
    ) {
      this.hostProfile.hostRank = "superhost";
    } else if (diffYears >= 1 && this.hostStats.totalReviews >= 5) {
      this.hostProfile.hostRank = "experienced";
    }
  }
  next();
});

// 🔐 Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 🔑 Compare password during login
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Method to update host stats
userSchema.methods.updateHostStats = async function () {
  const Listing = mongoose.model("Listing");
  const Review = mongoose.model("Review");

  // Count active listings
  const listingCount = await Listing.countDocuments({
    host: this._id,
    isActive: true,
  });

  // Calculate average rating from all reviews of user's listings
  const reviews = await Review.find({
    listing: { $in: await Listing.find({ host: this._id }).select("_id") },
  });

  const totalReviews = reviews.length;
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

  // Update stats
  this.hostStats.totalListings = listingCount;
  this.hostStats.totalReviews = totalReviews;
  this.hostStats.averageRating = averageRating;

  return this.save();
};

// Method to promote to superhost
userSchema.methods.promoteToSuperhost = function () {
  this.hostProfile.hostRank = "superhost";
  this.hostStats.superhostStreak += 1;
  return this.save();
};

// Method to demote from superhost
userSchema.methods.demoteFromSuperhost = function () {
  this.hostProfile.hostRank = "experienced";
  this.hostStats.superhostStreak = 0;
  return this.save();
};

module.exports = mongoose.model("User", userSchema);
