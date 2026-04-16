const mongoose = require("mongoose");
const { Schema } = mongoose;

const messageSchema = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true },
);

const chatSchema = new Schema(
  {
    reservation: {
      type: Schema.Types.ObjectId,
      ref: "Reservation",
      required: true,
      unique: true,
      index: true,
    },
    participants: {
      guest: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      host: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    },
    messages: [messageSchema],
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Chat", chatSchema);
