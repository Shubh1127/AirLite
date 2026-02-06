const Listing = require("../models/listing.model");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const { sendListingCreatedEmail } = require("../utils/mail.util");

const geocodingClient = mbxGeocoding({
  accessToken: process.env.MAP_TOKEN,
});

const parseAddressPayload = (address) => {
  if (!address) return {};
  if (typeof address === "string") {
    try {
      return JSON.parse(address);
    } catch (error) {
      return {};
    }
  }
  return address;
};

const extractAddressFromFeature = (feature) => {
  const result = {
    city: "",
    state: "",
    zipCode: "",
  };

  if (!feature) return result;

  if (feature.properties?.postcode) {
    result.zipCode = feature.properties.postcode;
  }

  if (feature.place_type?.includes("postcode") && feature.text) {
    result.zipCode = result.zipCode || feature.text;
  }

  const context = feature.context || [];
  context.forEach((item) => {
    if (item.id?.startsWith("postcode") && item.text) {
      result.zipCode = result.zipCode || item.text;
    }
    if (item.id?.startsWith("place") && item.text) {
      result.city = result.city || item.text;
    }
    if (item.id?.startsWith("region") && item.text) {
      result.state = result.state || item.text;
    }
  });

  return result;
};

const resolveAddressFields = async ({ address, country }) => {
  const normalized = {
    street: address?.street || "",
    city: address?.city || "",
    state: address?.state || "",
    zipCode: address?.zipCode || "",
  };

  const hasZip = Boolean(normalized.zipCode);
  const hasCityState = Boolean(normalized.city || normalized.state);

  if (!hasZip && !hasCityState) {
    return normalized;
  }

  try {
    if (hasZip && (!normalized.city || !normalized.state)) {
      const zipQuery = `${normalized.zipCode} ${country || ""}`.trim();
      const zipResponse = await geocodingClient
        .forwardGeocode({ query: zipQuery, limit: 1 })
        .send();
      const feature = zipResponse.body.features?.[0];
      const extracted = extractAddressFromFeature(feature);
      if (extracted.city) normalized.city = extracted.city;
      if (extracted.state) normalized.state = extracted.state;
      if (extracted.zipCode) normalized.zipCode = extracted.zipCode;
    } else if (!hasZip && hasCityState) {
      const cityQuery = `${normalized.city} ${normalized.state} ${country || ""}`.trim();
      const cityResponse = await geocodingClient
        .forwardGeocode({ query: cityQuery, limit: 1 })
        .send();
      const feature = cityResponse.body.features?.[0];
      const extracted = extractAddressFromFeature(feature);
      if (extracted.zipCode) normalized.zipCode = extracted.zipCode;
      if (extracted.city && !normalized.city) normalized.city = extracted.city;
      if (extracted.state && !normalized.state) normalized.state = extracted.state;
    }
  } catch (error) {
    console.error("Error resolving address fields:", error);
  }

  return normalized;
};

const normalizeCancellationPolicy = (value, fallbackType = "moderate") => {
  if (!value) return undefined;

  let policy = value;

  if (typeof policy === "string") {
    const trimmed = policy.trim();
    if (!trimmed || trimmed === "[object Object]") {
      return undefined;
    }

    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        policy = JSON.parse(trimmed);
      } catch (error) {
        policy = trimmed;
      }
    } else {
      policy = trimmed;
    }
  }

  if (typeof policy === "string") {
    const type = policy || fallbackType;
    return {
      type,
      ...getCancellationPolicyData(type),
    };
  }

  if (typeof policy === "object") {
    const type =
      typeof policy.type === "string"
        ? policy.type
        : typeof policy.type?.type === "string"
        ? policy.type.type
        : fallbackType;

    const base = getCancellationPolicyData(type);
    return {
      type,
      description: policy.description || base.description,
      refundPercentages: policy.refundPercentages || base.refundPercentages,
    };
  }

  return undefined;
};

/* =========================
   GET ALL LISTINGS
========================= */
exports.getAllListings = async (req, res) => {
  const listings = await Listing.find().populate("owner", "firstName lastName");
  res.json(listings);
};

/* =========================
   GET LOCATION SUGGESTIONS
========================= */
exports.getLocationSuggestions = async (req, res) => {
  try {
    const query = (req.query.query || "").trim();

    if (!query) {
      return res.json({ suggestions: [] });
    }

    const regex = new RegExp(query, "i");
    const listings = await Listing.find({
      $or: [{ location: regex }, { country: regex }],
    })
      .select("location country -_id")
      .limit(50)
      .lean();

    const suggestionSet = new Set();
    listings.forEach((listing) => {
      if (listing.location && regex.test(listing.location)) {
        suggestionSet.add(listing.location);
      }
      if (listing.country && regex.test(listing.country)) {
        suggestionSet.add(listing.country);
      }
    });

    const suggestions = Array.from(suggestionSet).slice(0, 8);
    res.json({ suggestions });
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    res.status(500).json({ message: "Error fetching suggestions" });
  }
};

/* =========================
   GET USER'S OWN LISTINGS
========================= */
exports.getMyListings = async (req, res) => {
  try {
    const listings = await Listing.find({ owner: req.user.id })
      .populate("owner", "firstName lastName avatar")
      .sort({ createdAt: -1 });
    res.json(listings);
  } catch (error) {
    res.status(500).json({ message: "Error fetching listings", error: error.message });
  }
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
        options: { sort: { createdAt: -1 } }, // Sort reviews by newest first
        populate: { 
          path: "author", 
          select: "firstName lastName avatar createdAt" 
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
    
    // Calculate average ratings per category from reviews
    const reviewsData = listing.reviews || [];
    const ratingsBreakdown = {
      cleanliness: 0,
      accuracy: 0,
      communication: 0,
      location: 0,
      checkIn: 0,
      value: 0
    };

    if (reviewsData.length > 0) {
      reviewsData.forEach(review => {
        if (review.ratings) {
          ratingsBreakdown.cleanliness += review.ratings.cleanliness || 0;
          ratingsBreakdown.accuracy += review.ratings.accuracy || 0;
          ratingsBreakdown.communication += review.ratings.communication || 0;
          ratingsBreakdown.location += review.ratings.location || 0;
          ratingsBreakdown.checkIn += review.ratings.checkIn || 0;
          ratingsBreakdown.value += review.ratings.value || 0;
        }
      });

      // Calculate averages
      Object.keys(ratingsBreakdown).forEach(key => {
        ratingsBreakdown[key] = (ratingsBreakdown[key] / reviewsData.length).toFixed(1);
      });
    }
    
    // SAFE ACCESS - Handle missing fields gracefully
    const hostProfile = host.hostProfile || {};
    const hostStats = host.hostStats || {};
    const verifications = hostProfile.verifications || {};
    const responseStats = hostProfile.responseStats || {};

    // Format response with safe field access
    const response = {
      ...listing.toObject(),

      mapboxToken: process.env.MAP_TOKEN, // Add Mapbox token
      ratingsBreakdown, // Add calculated ratings breakdown
      hostDetails: {
        id: host._id,
        firstName: host.firstName,
        lastName: host.lastName,
        fullName: `${host.firstName} ${host.lastName}`,
        avatar: host.avatar.url || null,
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
  try {
    const {
      title,
      description,
      location,
      country,
      pricePerNight,
      cleaningFee,
      serviceFee,
      tax,
      maxGuests,
      bedrooms,
      beds,
      bathrooms,
      amenities,
      category,
      address,
      houseRules,
      cancellationPolicy,
    } = req.body;

    const parsedAddress = parseAddressPayload(address);
    const resolvedAddress = await resolveAddressFields({ address: parsedAddress, country });
    const normalizedCancellationPolicy =
      normalizeCancellationPolicy(cancellationPolicy, "moderate") ||
      {
        type: "moderate",
        ...getCancellationPolicyData("moderate"),
      };

    // Validation
    if (!title || !location || !category) {
      return res.status(400).json({ message: "Title, location, and category are required" });
    }

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
      pricePerNight: Number(pricePerNight) || 0,
      cleaningFee: Number(cleaningFee) || 0,
      serviceFee: Number(serviceFee) || 0,
      tax: Number(tax) || 0,
      maxGuests: Number(maxGuests) || 1,
      bedrooms: Number(bedrooms) || 1,
      beds: Number(beds) || 1,
      bathrooms: Number(bathrooms) || 1,
      amenities: Array.isArray(amenities) ? amenities : [],
      category,
      address: resolvedAddress,
      houseRules: Array.isArray(houseRules) ? houseRules : [],
      cancellationPolicy: normalizedCancellationPolicy,
      images,
      geometry,
      owner: req.user.id,
    });

    // Update user role from guest to both if they create their first listing
    const User = require("../models/user.model");
    const user = await User.findById(req.user.id);
    if (user && user.role === "guest") {
      user.role = "both";
      await user.save();
    }

    // Send listing created email (async, don't wait)
    if (user) {
      sendListingCreatedEmail(
        {
          email: user.email,
          name: user.firstName || user.email.split('@')[0],
          username: user.firstName || user.email.split('@')[0],
        },
        {
          _id: listing._id,
          title: listing.title,
          location: listing.location,
          price: listing.pricePerNight,
          category: listing.category,
        }
      ).catch(err => console.error('Failed to send listing created email:', err));
    }

    res.status(201).json({
      message: "Listing created successfully",
      listing,
    });
  } catch (error) {
    console.error("Error creating listing:", error);
    res.status(500).json({ 
      message: "Error creating listing", 
      error: error.message 
    });
  }
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

  if (req.body.address) {
    const parsedAddress = parseAddressPayload(req.body.address);
    const resolvedAddress = await resolveAddressFields({
      address: parsedAddress,
      country: req.body.country || listing.country,
    });
    listing.address = resolvedAddress;
    delete req.body.address;
  }

  if (req.body.cancellationPolicy) {
    const normalizedCancellationPolicy =
      normalizeCancellationPolicy(req.body.cancellationPolicy, listing.cancellationPolicy?.type || "moderate") ||
      listing.cancellationPolicy;
    if (normalizedCancellationPolicy) {
      listing.cancellationPolicy = normalizedCancellationPolicy;
    }
    delete req.body.cancellationPolicy;
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
   LOOKUP ADDRESS
========================= */
exports.lookupAddress = async (req, res) => {
  try {
    const { zipCode, city, state, country } = req.query;
    const address = {
      street: "",
      city: (city || "").toString(),
      state: (state || "").toString(),
      zipCode: (zipCode || "").toString(),
    };

    const resolvedAddress = await resolveAddressFields({
      address,
      country: (country || "").toString(),
    });

    res.json({
      city: resolvedAddress.city,
      state: resolvedAddress.state,
      zipCode: resolvedAddress.zipCode,
    });
  } catch (error) {
    console.error("Error looking up address:", error);
    res.status(500).json({ message: "Error looking up address" });
  }
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
