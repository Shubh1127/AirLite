import { io, Socket } from 'socket.io-client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || API_BASE_URL;

const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem('airlite-auth');
    if (!stored) return null;
    const parsed = JSON.parse(stored) as { state?: { token?: string } };
    return parsed.state?.token || null;
  } catch {
    return null;
  }
};

const request = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    let message = 'Request failed';
    try {
      const data = (await response.json()) as { message?: string };
      message = data.message || message;
    } catch {
      message = response.statusText || message;
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
};

export type ChatMessage = {
  _id: string;
  reservationId: string;
  sender: {
    _id: string;
    name: string;
    avatar: string | null;
  };
  text: string;
  createdAt: string;
  isMine?: boolean;
};

export type ChatConversation = {
  reservationId: string;
  listing: {
    _id: string;
    title: string;
    location: string;
    country?: string;
    image: string | null;
  };
  role: 'guest' | 'host';
  otherUser: {
    _id: string;
    firstName?: string;
    lastName?: string;
    name: string;
    avatar: string | null;
  };
  status: string;
  checkInDate: string;
  checkOutDate: string;
  lastMessage: {
    _id: string;
    sender: string;
    text: string;
    createdAt: string;
  } | null;
  lastMessageAt: string;
};

export const chatAPI = {
  getConversations: () => request<ChatConversation[]>('/api/chat/conversations'),
  getChatByListing: (listingId: string) =>
    request<{
      reservationId: string;
      listingId: string;
      listing: {
        _id: string;
        title: string;
        location: string;
        country?: string;
        image: string | null;
      };
      otherUser: {
        _id: string;
        name: string;
      } | null;
      messages: ChatMessage[];
    }>(`/api/chat/listings/${listingId}`),
  getMessages: (reservationId: string) =>
    request<{ reservationId: string; messages: ChatMessage[] }>(
      `/api/chat/conversations/${reservationId}/messages`,
    ),
  sendMessage: (reservationId: string, text: string) =>
    request<ChatMessage>(`/api/chat/conversations/${reservationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),
  createSocket: (token: string): Socket =>
    io(SOCKET_URL, {
      transports: ['websocket'],
      withCredentials: true,
      auth: { token },
    }),
};
