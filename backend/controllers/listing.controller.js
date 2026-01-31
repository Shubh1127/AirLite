const Listing = require("../models/listing.model");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");

const geocodingClient = mbxGeocoding({
  accessToken: process.env.MAP_TOKEN,
});

/* =========================
   GET ALL LISTINGS
========================= */
exports.getAllListings = async (req, res) => {
  const listings = await Listing.find().populate("owner", "firstName lastName");
  res.json(listings);
};

/* =========================
   GET SINGLE LISTING
========================= */
exports.getListingById = async (req, res) => {
  try {
    const { id } = req.params;

    const listing = await Listing.findById(id)
      .populate({
        path: "reviews",
        populate: { 
          path: "author", 
          select: "firstName lastName avatar" 
        },
      })
      .populate({
        path: "owner",
        select: "firstName lastName avatar email phone role hostProfile hostStats",
      });

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    const host = listing.owner;
    
    // SAFE ACCESS - Handle missing fields gracefully
    const hostProfile = host.hostProfile || {};
    const hostStats = host.hostStats || {};
    const verifications = hostProfile.verifications || {};
    const responseStats = hostProfile.responseStats || {};

    // Format response with safe field access
    const response = {
      ...listing.toObject(),

      mapboxToken: process.env.MAP_TOKEN, // Add Mapbox token
      hostDetails: {
        id: host._id,
        firstName: host.firstName,
        lastName: host.lastName,
        fullName: `${host.firstName} ${host.lastName}`,
        avatar: host.avatar,
        email: host.email || null,
        phone: host.phone || null,
        role: host.role || "guest",
        
        // Safely access hostProfile fields with defaults
        hostProfile: {
          hostSince: hostProfile.hostSince || null,
          experienceYears: hostProfile.experienceYears || 0,
          hostRank: hostProfile.hostRank || "new",
          education: hostProfile.education || {},
          professionalWork: hostProfile.professionalWork || {},
          languages: hostProfile.languages || [],
          hostBio: hostProfile.hostBio || "",
          whyHost: hostProfile.whyHost || "",
          hostStory: hostProfile.hostStory || "",
          hostingStyle: hostProfile.hostingStyle || [],
          
          // Response stats with defaults
          responseStats: {
            responseRate: responseStats.responseRate || 0,
            responseTime: responseStats.responseTime || "within a day",
            acceptanceRate: responseStats.acceptanceRate || 0
          },
          
          // Verifications with defaults
          verifications: {
            email: verifications.email || false,
            phone: verifications.phone || false,
            identity: verifications.identity || false,
            governmentId: verifications.governmentId || false
          }
        },
        
        // Safely access hostStats with defaults
        hostStats: {
          totalReviews: hostStats.totalReviews || 0,
          averageRating: hostStats.averageRating || 0,
          totalListings: hostStats.totalListings || 0,
          totalGuestsHosted: hostStats.totalGuestsHosted || 0,
          yearsAsHost: hostStats.yearsAsHost || 0,
          superhostStreak: hostStats.superhostStreak || 0,
          isSuperhost: hostProfile.hostRank === "superhost"
        },
        
        // Additional computed fields with safe defaults
        isVerifiedHost: verifications.identity || false,
        responseTimeDisplay: getResponseTimeDisplay(responseStats.responseTime || "within a day")
      }
    };

    res.json(response);
  } catch (err) {
    console.error("Get listing by ID error:", err);
    res.status(500).json({ message: "Failed to get listing" });
  }
};

// Helper function
function getResponseTimeDisplay(responseTime) {
  const timeMap = {
    "within an hour": "Usually responds within an hour",
    "within a few hours": "Usually responds within a few hours",
    "within a day": "Usually responds within a day",
    "a few days or more": "Usually responds in a few days"
  };
  return timeMap[responseTime] || "Usually responds within a day";
}

/* =========================
   CREATE LISTING (HOST)
========================= */
exports.createListing = async (req, res) => {
  const {
    title,
    description,
    location,
    country,
    pricePerNight,
    maxGuests,
    bedrooms,
    beds,
    bathrooms,
    amenities,
    category,
  } = req.body;

  // Mapbox geocoding
  const geoResponse = await geocodingClient
    .forwardGeocode({
      query: location,
      limit: 1,
    })
    .send();

  if (!geoResponse.body.features.length) {
    return res.status(400).json({ message: "Invalid location" });
  }

  const geometry = geoResponse.body.features[0].geometry;

  const images = req.files?.map((file) => ({
    url: file.path,
    filename: file.filename,
  })) || [];

  const listing = await Listing.create({
    title,
    description,
    location,
    country,
    pricePerNight,
    cleaningFee: 200,
    serviceFee: 150,
    tax: 100,
    maxGuests,
    bedrooms,
    beds,
    bathrooms,
    amenities,
    category,
    images,
    geometry,
    owner: req.user.id,
  });

  res.status(201).json({
    message: "Listing created successfully",
    listing,
  });
};

/* =========================
   UPDATE LISTING
========================= */
exports.updateListing = async (req, res) => {
  const { id } = req.params;

  let listing = await Listing.findById(id);

  if (!listing) {
    return res.status(404).json({ message: "Listing not found" });
  }

  // ownership check
  if (listing.owner.toString() !== req.user.id) {
    return res.status(403).json({ message: "Not authorized" });
  }

  Object.assign(listing, req.body);

  if (req.files && req.files.length > 0) {
    const newImages = req.files.map((file) => ({
      url: file.path,
      filename: file.filename,
    }));
    listing.images.push(...newImages);
  }

  await listing.save();

  res.json({
    message: "Listing updated successfully",
    listing,
  });
};

/* =========================
   DELETE LISTING
========================= */
exports.deleteListing = async (req, res) => {
  const { id } = req.params;

  const listing = await Listing.findById(id);

  if (!listing) {
    return res.status(404).json({ message: "Listing not found" });
  }

  if (listing.owner.toString() !== req.user.id) {
    return res.status(403).json({ message: "Not authorized" });
  }

  await Listing.findByIdAndDelete(id);

  res.json({ message: "Listing deleted successfully" });
};
