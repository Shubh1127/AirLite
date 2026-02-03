const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Helper to get token from authStore localStorage
const getToken = () => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('airlite-auth');
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return parsed.state?.token || null;
  } catch (error) {
    console.error('Error reading token from localStorage:', error);
    return null;
  }
};

export interface Reservation {
  _id: string;
  listing: {
    _id: string;
    title: string;
    location: string;
    country?: string;
    images?: { url: string }[];
    cancellationPolicy?: {
      type: 'flexible' | 'moderate' | 'strict' | 'non-refundable';
      description: string;
      refundPercentages?: Record<string, number>;
    };
  };
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  children: number;
  infants: number;
  pets: number;
  guestMessage?: string;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'refund-pending' | 'refunded';
  cancellationReason?: string;
  refundAmount?: number;
  refundPercentage?: number;
  refundStatus?: 'none' | 'pending' | 'processing' | 'completed' | 'failed';
  refundTransactionId?: string;
  refundedAt?: string;
  canEdit?: boolean;
  editHistory?: Array<{
    editedAt: string;
    previousCheckIn: string;
    previousCheckOut: string;
    newCheckIn: string;
    newCheckOut: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export const reservationsAPI = {
  // Get user's reservations
  getMyReservations: async (token: string): Promise<Reservation[]> => {
    const response = await fetch(`${API_BASE_URL}/api/users/me/trips`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch reservations');
    return response.json();
  },

  // Cancel reservation
  cancelReservation: async (reservationId: string, token: string, reason?: string) => {
    const response = await fetch(`${API_BASE_URL}/api/payment/cancel-reservation/${reservationId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ cancellationReason: reason }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to cancel reservation');
    }
    return response.json();
  },

  // Edit reservation dates
  editReservation: async (
    reservationId: string,
    token: string,
    checkInDate: string,
    checkOutDate: string
  ) => {
    const response = await fetch(`${API_BASE_URL}/api/payment/edit-reservation/${reservationId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ checkInDate, checkOutDate }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to edit reservation');
    }
    return response.json();
  },

  // Check refund status
  checkRefundStatus: async (reservationId: string, token: string) => {
    const response = await fetch(`${API_BASE_URL}/api/payment/refund-status/${reservationId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Failed to check refund status');
    return response.json();
  },
};

// Standalone exported functions
export const getMyReservations = async (): Promise<Reservation[]> => {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  return reservationsAPI.getMyReservations(token);
};

export const cancelReservation = async (reservationId: string, reason?: string) => {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  return reservationsAPI.cancelReservation(reservationId, token, reason);
};

export const editReservation = async (
  reservationId: string,
  checkInDate: string,
  checkOutDate: string
) => {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  return reservationsAPI.editReservation(reservationId, token, checkInDate, checkOutDate);
};

export const checkRefundStatus = async (reservationId: string) => {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  return reservationsAPI.checkRefundStatus(reservationId, token);
};
