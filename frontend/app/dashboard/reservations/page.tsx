'use client';

export default function ReservationsPage() {
  const reservations = [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Reservations</h1>
      {reservations.length === 0 ? (
        <p className="text-gray-500">No reservations yet.</p>
      ) : (
        <div className="space-y-4">
          {/* Reservation cards will go here */}
        </div>
      )}
    </div>
  );
}
