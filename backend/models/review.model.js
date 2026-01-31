const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const reviewSchema = new Schema(
  {
    comment: {
      type: String,
      required: true,
    },

    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },

    ratings: {
      cleanliness: { type: Number, min: 1, max: 5 },
      accuracy: { type: Number, min: 1, max: 5 },
      communication: { type: Number, min: 1, max: 5 },
      location: { type: Number, min: 1, max: 5 },
      checkIn: { type: Number, min: 1, max: 5 },
      value: { type: Number, min: 1, max: 5 },
    },

    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    listing: {
      type: Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },

    reservation: {
      type: Schema.Types.ObjectId,
      ref: "Reservation",
    },

    hostReply: {
      comment: String,
      repliedAt: Date,
    },

    helpfulCount: {
      type: Number,
      default: 0,
    },

    reportCount: {
      type: Number,
      default: 0,
    },

    isHidden: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Review", reviewSchema);
