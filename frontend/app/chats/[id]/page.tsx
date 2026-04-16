'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import { MessageCircle, SendHorizontal } from 'lucide-react';
import { Socket } from 'socket.io-client';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { chatAPI, ChatConversation, ChatMessage } from '@/lib/chat';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { token, user, isAuthenticated, hasHydrated } = useAuthStore();
  const listingId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [chatMissing, setChatMissing] = useState(false);
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const activeReservationRef = useRef<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  const title = useMemo(() => conversation?.listing.title || 'Chat', [conversation]);

  useEffect(() => {
    activeReservationRef.current = conversation?.reservationId || null;
  }, [conversation]);

  useEffect(() => {
    if (!hasHydrated) return;

    if (!isAuthenticated || !token) {
      router.push('/auth/login');
      return;
    }

    const loadChat = async () => {
      try {
        setLoading(true);
        setError(null);
        setChatMissing(false);

        const data = await chatAPI.getChatByListing(listingId);
        setConversation({
          reservationId: data.reservationId,
          listing: data.listing,
          role: 'guest',
          otherUser: {
            _id: data.otherUser?._id || '',
            name: data.otherUser?.name || 'Host',
            avatar: null,
          },
          status: 'confirmed',
          checkInDate: '',
          checkOutDate: '',
          lastMessage: null,
          lastMessageAt: new Date().toISOString(),
        });
        setMessages(data.messages);
      } catch (fetchError) {
        const message = fetchError instanceof Error ? fetchError.message : 'Failed to load chat';
        if (message.toLowerCase().includes('no conversation found')) {
          setChatMissing(true);
          setConversation(null);
          setMessages([]);
        } else {
          setError(message);
        }
      } finally {
        setLoading(false);
      }
    };

    loadChat();
  }, [hasHydrated, isAuthenticated, token, router, listingId]);

  useEffect(() => {
    if (!token || !isAuthenticated || !hasHydrated) return;

    const socket = chatAPI.createSocket(token);
    socketRef.current = socket;

    socket.on('new_message', (incoming: ChatMessage) => {
      if (incoming.reservationId === activeReservationRef.current) {
        setMessages((prev) => {
          if (prev.some((message) => message._id === incoming._id)) return prev;
          return [...prev, incoming];
        });
      }
    });

    socket.on('chat_error', (payload: { message?: string }) => {
      setError(payload?.message || 'Chat error');
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, isAuthenticated, hasHydrated]);

  useEffect(() => {
    if (!conversation?.reservationId) return;

    const socket = socketRef.current;
    if (socket) {
      socket.emit('join_conversation', { reservationId: conversation.reservationId });
    }

    return () => {
      if (socket) {
        socket.emit('leave_conversation', { reservationId: conversation.reservationId });
      }
    };
  }, [conversation?.reservationId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!conversation?.reservationId) return;

    const text = messageText.trim();
    if (!text) return;

    try {
      setSending(true);
      setError(null);

      const socket = socketRef.current;
      if (socket?.connected) {
        await new Promise<void>((resolve, reject) => {
          socket.emit(
            'send_message',
            { reservationId: conversation.reservationId, text },
            (response: { status: 'ok' | 'error'; message?: string }) => {
              if (response.status === 'ok') {
                resolve();
                return;
              }
              reject(new Error(response.message || 'Failed to send message'));
            },
          );
        });
      } else {
        const message = await chatAPI.sendMessage(conversation.reservationId, text);
        setMessages((prev) => [...prev, message]);
      }

      setMessageText('');
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (!hasHydrated || loading) {
    return <div className="text-center py-8">Loading chat...</div>;
  }

  if (chatMissing) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <h1 className="text-2xl font-semibold mb-3">No chat yet</h1>
        <p className="text-gray-600 mb-6">
          You can message the host after you have a booking on this listing.
        </p>
        <button
          type="button"
          onClick={() => router.push(`/listings/${listingId}`)}
          className="px-5 py-3 rounded-lg bg-black text-white"
        >
          Back to listing
        </button>
      </div>
    );
  }

  return (
    <div className="h-[75vh] grid grid-cols-1 gap-4">
      <div className="border rounded-lg flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
          <div>
            <p className="font-semibold">{title}</p>
            <p className="text-xs text-gray-600">Conversation with host</p>
          </div>
          <button
            type="button"
            onClick={() => router.push(`/listings/${listingId}`)}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Back to listing
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-white space-y-3">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <MessageCircle className="w-8 h-8 mb-2" />
              <p className="text-sm">Start the conversation.</p>
            </div>
          ) : (
            messages.map((message) => {
              const isMine = message.sender._id === user?.id;
              return (
                <div
                  key={message._id}
                  className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                      isMine ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                    <p className={`text-[11px] mt-1 ${isMine ? 'text-blue-100' : 'text-gray-500'}`}>
                      {format(new Date(message.createdAt), 'p')}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={endRef} />
        </div>

        <form onSubmit={handleSendMessage} className="p-3 border-t bg-white flex gap-2">
          <input
            value={messageText}
            onChange={(event) => setMessageText(event.target.value)}
            placeholder="Type a message"
            className="flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={sending || !messageText.trim()}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            <SendHorizontal className="w-4 h-4" />
            Send
          </button>
        </form>
      </div>

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg shadow">
          {error}
        </div>
      )}
    </div>
  );
}
