const Chat = require("../models/chat.model");
const Listing = require("../models/listing.model");
const Reservation = require("../models/reservation.model");
const User = require("../models/user.model");
const {
  canAccessReservationChat,
  getParticipantIds,
  getReservationWithParticipants,
  getRoomName,
} = require("../utils/chat.util");
const { getIO } = require("../config/socket");

const getDisplayName = (user) => {
  if (!user) return "User";
  return `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "User";
};

exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const hostedListings = await Listing.find({ owner: userId }).select("_id");
    const hostedListingIds = hostedListings.map((listing) => listing._id);

    const reservations = await Reservation.find({
      $or: [{ guest: userId }, { listing: { $in: hostedListingIds } }],
    })
      .populate({
        path: "listing",
        select: "title images owner location country",
        populate: {
          path: "owner",
          select: "firstName lastName avatar email",
        },
      })
      .populate({
        path: "guest",
        select: "firstName lastName avatar email",
      })
      .sort({ updatedAt: -1 });

    const reservationIds = reservations.map((reservation) => reservation._id);
    const chats = await Chat.find({ reservation: { $in: reservationIds } }).sort({ lastMessageAt: -1 });

    const chatByReservationId = new Map(
      chats.map((chat) => [chat.reservation.toString(), chat]),
    );

    const conversations = reservations.map((reservation) => {
      const { guestId, hostId } = getParticipantIds(reservation);
      const isGuest = guestId === userId;
      const otherUser = isGuest ? reservation.listing.owner : reservation.guest;
      const chat = chatByReservationId.get(reservation._id.toString());
      const lastMessage = chat?.messages?.[chat.messages.length - 1] || null;

      return {
        reservationId: reservation._id,
        listing: {
          _id: reservation.listing?._id,
          title: reservation.listing?.title,
          location: reservation.listing?.location,
          country: reservation.listing?.country,
          image: reservation.listing?.images?.[0]?.url || null,
        },
        role: isGuest ? "guest" : "host",
        otherUser: {
          _id: otherUser?._id,
          firstName: otherUser?.firstName,
          lastName: otherUser?.lastName,
          name: getDisplayName(otherUser),
          avatar: otherUser?.avatar?.url || null,
        },
        status: reservation.status,
        checkInDate: reservation.checkInDate,
        checkOutDate: reservation.checkOutDate,
        lastMessage: lastMessage
          ? {
              _id: lastMessage._id,
              sender: lastMessage.sender,
              text: lastMessage.text,
              createdAt: lastMessage.createdAt,
            }
          : null,
        lastMessageAt: chat?.lastMessageAt || reservation.updatedAt,
      };
    });

    conversations.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));

    res.json(conversations);
  } catch (error) {
    console.error("Get conversations error:", error);
    res.status(500).json({ message: "Failed to load conversations" });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const userId = req.user.id;

    const reservation = await getReservationWithParticipants(reservationId);
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    if (!canAccessReservationChat(reservation, userId)) {
      return res.status(403).json({ message: "Not authorized to access this chat" });
    }

    const chat = await Chat.findOne({ reservation: reservationId }).populate({
      path: "messages.sender",
      select: "firstName lastName avatar email",
    });

    const messages = (chat?.messages || []).map((message) => ({
      _id: message._id,
      reservationId,
      sender: {
        _id: message.sender?._id,
        name: getDisplayName(message.sender),
        avatar: message.sender?.avatar?.url || null,
      },
      text: message.text,
      createdAt: message.createdAt,
      isMine: message.sender?._id?.toString() === userId,
    }));

    res.json({
      reservationId,
      messages,
    });
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({ message: "Failed to load messages" });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const { text } = req.body;
    const senderId = req.user.id;

    if (!text || !String(text).trim()) {
      return res.status(400).json({ message: "Message text is required" });
    }

    const reservation = await getReservationWithParticipants(reservationId);
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    if (!canAccessReservationChat(reservation, senderId)) {
      return res.status(403).json({ message: "Not authorized to send messages in this chat" });
    }

    const { guestId, hostId } = getParticipantIds(reservation);
    const newMessage = {
      sender: senderId,
      text: String(text).trim(),
      createdAt: new Date(),
    };

    const chat = await Chat.findOneAndUpdate(
      { reservation: reservationId },
      {
        $setOnInsert: {
          reservation: reservationId,
          participants: {
            guest: guestId,
            host: hostId,
          },
        },
        $push: { messages: newMessage },
        $set: { lastMessageAt: new Date() },
      },
      { new: true, upsert: true },
    );

    const sender = await User.findById(senderId).select("firstName lastName avatar email");
    const savedMessage = chat.messages[chat.messages.length - 1];

    const payload = {
      _id: savedMessage._id,
      reservationId,
      sender: {
        _id: sender?._id,
        name: getDisplayName(sender),
        avatar: sender?.avatar?.url || null,
      },
      text: savedMessage.text,
      createdAt: savedMessage.createdAt,
      isMine: true,
    };

    const io = getIO();
    if (io) {
      io.to(getRoomName(reservationId)).emit("new_message", payload);
    }

    res.status(201).json(payload);
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ message: "Failed to send message" });
  }
};

exports.getChatByListing = async (req, res) => {
  try {
    const { listingId } = req.params;
    const userId = req.user.id;

    const listing = await Listing.findById(listingId).select("owner title images location country");
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    const reservationQuery =
      listing.owner?.toString() === userId
        ? { listing: listingId }
        : { listing: listingId, guest: userId };

    const reservation = await Reservation.findOne(reservationQuery)
      .sort({ createdAt: -1 })
      .populate({
        path: "listing",
        select: "title images owner location country",
        populate: {
          path: "owner",
          select: "firstName lastName avatar email",
        },
      })
      .populate({
        path: "guest",
        select: "firstName lastName avatar email",
      });

    if (!reservation) {
      return res.status(404).json({ message: "No conversation found for this listing" });
    }

    if (!canAccessReservationChat(reservation, userId)) {
      return res.status(403).json({ message: "Not authorized to access this chat" });
    }

    const chat = await Chat.findOne({ reservation: reservation._id }).populate({
      path: "messages.sender",
      select: "firstName lastName avatar email",
    });

    const messages = (chat?.messages || []).map((message) => ({
      _id: message._id,
      reservationId: reservation._id.toString(),
      sender: {
        _id: message.sender?._id,
        name: getDisplayName(message.sender),
        avatar: message.sender?.avatar?.url || null,
      },
      text: message.text,
      createdAt: message.createdAt,
      isMine: message.sender?._id?.toString() === userId,
    }));

    res.json({
      reservationId: reservation._id.toString(),
      listingId,
      listing: {
        _id: reservation.listing?._id,
        title: reservation.listing?.title,
        location: reservation.listing?.location,
        country: reservation.listing?.country,
        image: reservation.listing?.images?.[0]?.url || null,
      },
      otherUser: canAccessReservationChat(reservation, userId)
        ? {
            _id: reservation.guest?._id?.toString() === userId
              ? reservation.listing?.owner?._id?.toString()
              : reservation.guest?._id?.toString(),
            name:
              reservation.guest?._id?.toString() === userId
                ? getDisplayName(reservation.listing?.owner)
                : getDisplayName(reservation.guest),
          }
        : null,
      messages,
    });
  } catch (error) {
    console.error("Get chat by listing error:", error);
    res.status(500).json({ message: "Failed to load chat" });
  }
};
