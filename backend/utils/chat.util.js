const Reservation = require("../models/reservation.model");

const getRoomName = (reservationId) => `chat:${reservationId}`;

const getReservationWithParticipants = async (reservationId) => {
  return Reservation.findById(reservationId)
    .populate({
      path: "listing",
      select: "title images owner location country",
    })
    .populate({
      path: "guest",
      select: "firstName lastName avatar email",
    });
};

const getParticipantIds = (reservation) => {
  const guestId = reservation?.guest?._id
    ? reservation.guest._id.toString()
    : reservation?.guest?.toString();

  const hostId = reservation?.listing?.owner?._id
    ? reservation.listing.owner._id.toString()
    : reservation?.listing?.owner?.toString();

  return { guestId, hostId };
};

const canAccessReservationChat = (reservation, userId) => {
  const { guestId, hostId } = getParticipantIds(reservation);
  return guestId === userId || hostId === userId;
};

module.exports = {
  getRoomName,
  getReservationWithParticipants,
  getParticipantIds,
  canAccessReservationChat,
};
