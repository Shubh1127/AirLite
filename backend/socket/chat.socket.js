const jwt = require("jsonwebtoken");
const Chat = require("../models/chat.model");
const User = require("../models/user.model");
const {
  canAccessReservationChat,
  getParticipantIds,
  getReservationWithParticipants,
  getRoomName,
} = require("../utils/chat.util");

const getDisplayName = (user) => {
  if (!user) return "User";
  return `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "User";
};

const initializeChatSocket = (io) => {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error("Authentication required"));
      }

      const secret = process.env.SECRET;
      if (!secret) {
        return next(new Error("Server auth not configured"));
      }

      const decoded = jwt.verify(token, secret);
      socket.userId = decoded.id;
      return next();
    } catch (error) {
      return next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("join_conversation", async ({ reservationId }) => {
      try {
        const reservation = await getReservationWithParticipants(reservationId);
        if (!reservation || !canAccessReservationChat(reservation, socket.userId)) {
          socket.emit("chat_error", { message: "Not authorized for this conversation" });
          return;
        }

        socket.join(getRoomName(reservationId));
        socket.emit("joined_conversation", { reservationId });
      } catch (error) {
        socket.emit("chat_error", { message: "Failed to join conversation" });
      }
    });

    socket.on("leave_conversation", ({ reservationId }) => {
      socket.leave(getRoomName(reservationId));
    });

    socket.on("send_message", async (payload = {}, ack) => {
      const safeAck = typeof ack === "function" ? ack : () => {};

      try {
        const reservationId = payload.reservationId;
        const text = String(payload.text || "").trim();

        if (!reservationId || !text) {
          safeAck({ status: "error", message: "Reservation and message text are required" });
          return;
        }

        const reservation = await getReservationWithParticipants(reservationId);
        if (!reservation || !canAccessReservationChat(reservation, socket.userId)) {
          safeAck({ status: "error", message: "Not authorized for this conversation" });
          return;
        }

        const { guestId, hostId } = getParticipantIds(reservation);

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
            $push: {
              messages: {
                sender: socket.userId,
                text,
                createdAt: new Date(),
              },
            },
            $set: { lastMessageAt: new Date() },
          },
          { new: true, upsert: true },
        );

        const sender = await User.findById(socket.userId).select("firstName lastName avatar email");
        const savedMessage = chat.messages[chat.messages.length - 1];

        const messagePayload = {
          _id: savedMessage._id,
          reservationId,
          sender: {
            _id: sender?._id,
            name: getDisplayName(sender),
            avatar: sender?.avatar?.url || null,
          },
          text: savedMessage.text,
          createdAt: savedMessage.createdAt,
        };

        io.to(getRoomName(reservationId)).emit("new_message", messagePayload);
        safeAck({ status: "ok", message: messagePayload });
      } catch (error) {
        safeAck({ status: "error", message: "Failed to send message" });
      }
    });
  });
};

module.exports = {
  initializeChatSocket,
};
