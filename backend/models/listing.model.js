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

    houseRules: [String],

    cancellationPolicy: {
      type: String,
      enum: ["flexible", "moderate", "strict"],
      default: "moderate",
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

const Listing = mongoose.model("Listing", listingSchema);

module.exports = Listing;
