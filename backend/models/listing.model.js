const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const listingSchema = new Schema(
  {
    title: { type: String, required: true },

    description: String,

    images: [
      {
        url: String,
        filename: String,
      },
    ],

    pricePerNight: Number,
    cleaningFee: Number,
    serviceFee: Number,
    tax: Number,

    location: String,
    country: String,

    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
    },

    category: {
  type: String,
  enum: [
    "beach", "Beach",
    "mountain", "Mountains", "Mountain",
    "city", "City", 
    "lake", "Lake",
    "desert", "Desert",
    "luxury", "Luxury",
    "historic", "Historic",
    "nature", "Nature",
    "cottage", "Cottage"
  ]
},

    maxGuests: Number,
    bedrooms: Number,
    beds: Number,
    bathrooms: Number,

    amenities: [{
  type: String,
  enum: [
    // Basic amenities
    "wifi", "Wifi", "Wi-Fi", "WiFi", "High-speed WiFi",
    "tv", "TV", "Smart TV",
    "essentials", "Essentials",
    "hot water", "Hot Water",
    "air mattress", "Air Mattress",
    "private entrance", "Private Entrance",
    "workspace", "Workspace", "Dedicated Workspace",  
    "desk", "Desk",
    "iron", "Iron",
    "hair dryer", "Hair Dryer",
    "self check-in", "Self Check-in",
    "smoke alarm", "Smoke Alarm",
    "carbon monoxide alarm", "Carbon Monoxide Alarm",
    "first aid kit", "First Aid Kit",
    "fire extinguisher", "Fire Extinguisher",
    
    "kitchen", "Kitchen", "Full Kitchen", "Kitchenette", "Chef's Kitchen",
    "parking", "Parking",
    "heating", "Heating",
    "air conditioning", "Air Conditioning", "AC", "AC Rooms", "AC Tent",
    
    // Location features
    "beachfront", "Beachfront", "Beach Access",
    "lake view", "Lake View",
    "mountain view", "Mountain View",
    "sea view", "Sea View",
    "river view", "River View",
    "desert view", "Desert View",
    "tea garden view", "Tea Garden View",
    "plantation view", "Plantation View",
    
    // Outdoor amenities
    "pool", "Pool", "Private Pool", "Infinity Pool",
    "hot tub", "Hot Tub",
    "patio", "Patio",
    "balcony", "Balcony",
    "bbq grill", "BBQ Grill", "BBQ", "Seafood BBQ",
    "garden", "Garden", "Spice Garden", "Rooftop Garden",
    "fire pit", "Fire Pit",
    "bonfire", "Bonfire",
    "sun deck", "Sun Deck",
    "private deck", "Private Deck",
    "yoga deck", "Yoga Deck",
    "courtyard", "Courtyard", "Private Courtyard",
    
    // Activities & Services
    "hiking trails", "Hiking Trails", "Walking Trails",
    "wildlife viewing", "Wildlife Viewing",
    "sauna", "Sauna",
    "gym", "Gym", "Gym Access",
    "elevator", "Elevator",
    "fireplace", "Fireplace",
    "concierge", "Concierge",
    "housekeeping", "Housekeeping",
    "butler service", "Butler Service",
    "private chef", "Private Chef",
    "private bath", "Private Bath",
    "spa", "Spa",
    
    // Laundry
    "washer", "Washer",
    "dryer", "Dryer",
    
    // Special features
    "traditional decor", "Traditional Decor",
    "heritage decor", "Heritage Decor",
    "antique furniture", "Antique Furniture",
    "smart home", "Smart Home",
    "smart tv", "Smart TV",
    "eco-friendly", "Eco-friendly",
    
    // Activities & Experiences
    "shikara service", "Shikara Service",
    "traditional music", "Traditional Music",
    "nature walks", "Nature Walks",
    "safari booking", "Safari Booking",
    "cruise included", "Cruise Included",
    "fishing", "Fishing",
    "village visits", "Village Visits",
    "bicycle rental", "Bicycle Rental",
    "camel safari", "Camel Safari",
    "cultural shows", "Cultural Shows",
    "yoga classes", "Yoga Classes",
    "meditation space", "Meditation Space",
    "palace stay", "Palace Stay",
    "guided tour", "Guided Tour",
    "hammocks", "Hammocks",
    "kayaks", "Kayaks",
    "snorkeling gear", "Snorkeling Gear",
    "island tours", "Island Tours",
    "coffee tasting", "Coffee Tasting",
    "coworking space", "Coworking Space",
    
    // Food & Dining
    "organic breakfast", "Organic Breakfast",
    "french breakfast", "French Breakfast",
    "traditional food", "Traditional Food",
    "vegetarian meals", "Vegetarian Meals",
    "traditional meals", "Traditional Meals",
    "royal dining", "Royal Dining",
  ]
}],

    locationFeatures: [
      {
        title: String,
        description: String,
        icon: String,
      },
    ],

    houseRules: [String],

    cancellationPolicy: {
      type: {
        type: String,
        enum: ["flexible", "moderate", "strict", "non-refundable"],
        default: "moderate",
      },
      description: String,
      refundPercentages: Map,
    },

    availability: {
      startDate: Date,
      endDate: Date,
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },

    rating: {
      type: Number,
      default: 0,
    },

    reviewCount: {
      type: Number,
      default: 0,
    },

    reviews: [
      {
        type: Schema.Types.ObjectId,
        ref: "Review",
      },
    ],

    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    geometry: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
  },
  { timestamps: true }
);

// Helper function to generate cancellation policy data
function getCancellationPolicyData(type = "moderate") {
  const policies = {
    flexible: {
      description: "Free cancellation up to 24 hours before check-in. Cancel before that and get a full refund. After that, 50% refund if cancelled at least 7 days before check-in.",
      refundPercentages: new Map([
        ["24hours", 100],
        ["7days", 50],
        ["default", 0]
      ])
    },
    moderate: {
      description: "Free cancellation up to 5 days before check-in for a full refund. Cancel between 5 days and 24 hours before check-in and get a 50% refund. No refund after that.",
      refundPercentages: new Map([
        ["5days", 100],
        ["24hours", 50],
        ["default", 0]
      ])
    },
    strict: {
      description: "Free cancellation up to 14 days before check-in for a full refund. Cancel between 14 days and 7 days before check-in and get a 50% refund. No refund after that.",
      refundPercentages: new Map([
        ["14days", 100],
        ["7days", 50],
        ["default", 0]
      ])
    },
    "non-refundable": {
      description: "This reservation is non-refundable. You won't get a refund if you cancel.",
      refundPercentages: new Map([["default", 0]])
    }
  };
  return policies[type] || policies.moderate;
}

// Pre-save hook to ensure cancellationPolicy is an object
listingSchema.pre("save", function (next) {
  // If cancellationPolicy is a string (old format), convert it
  if (typeof this.cancellationPolicy === "string") {
    const policyType = this.cancellationPolicy;
    const policyData = getCancellationPolicyData(policyType);
    this.cancellationPolicy = {
      type: policyType,
      description: policyData.description,
      refundPercentages: policyData.refundPercentages
    };
  } else if (this.cancellationPolicy && typeof this.cancellationPolicy === "object") {
    // If it's an object but missing description or refundPercentages
    if (!this.cancellationPolicy.description || !this.cancellationPolicy.refundPercentages) {
      const policyData = getCancellationPolicyData(this.cancellationPolicy.type);
      this.cancellationPolicy.description = this.cancellationPolicy.description || policyData.description;
      this.cancellationPolicy.refundPercentages = this.cancellationPolicy.refundPercentages || policyData.refundPercentages;
    }
  } else if (!this.cancellationPolicy) {
    // If missing entirely, set default
    const policyData = getCancellationPolicyData("moderate");
    this.cancellationPolicy = {
      type: "moderate",
      description: policyData.description,
      refundPercentages: policyData.refundPercentages
    };
  }
  next();
});

const Listing = mongoose.model("Listing", listingSchema);

module.exports = Listing;
