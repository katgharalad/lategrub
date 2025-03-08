import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, limit, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import PageLayout from '../components/PageLayout';
import { Message, UserRole, Order } from '../lib/firebase';

interface ChatParticipant {
  id: string;
  name: string;
  photo: string;
  role: UserRole;
}

interface ChatPreview {
  orderId: string;
  participant: ChatParticipant;
  lastMessage?: {
    text: string;
    timestamp: Date;
  };
  orderStatus: Order['status'];
  unreadCount: number;
}

interface UserData {
  name: string;
  photoURL: string;
  role: UserRole;
}

const Chat: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { user, sessionRole } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [participant, setParticipant] = useState<ChatParticipant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatPreviews, setChatPreviews] = useState<ChatPreview[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch all active chats
  useEffect(() => {
    if (!user || !sessionRole) return;

    const ordersRef = collection(db, 'orders');
    let ordersQuery;
    
    if (sessionRole === 'customer') {
      ordersQuery = query(
        ordersRef,
        where('customerId', '==', user.uid),
        where('status', 'in', ['ordered', 'waiting', 'got_food', 'walking'])
      );
    } else {
      ordersQuery = query(
        ordersRef,
        where('deliveryPersonId', '==', user.uid),
        where('status', 'in', ['waiting', 'got_food', 'walking'])
      );
    }

    const unsubscribeOrders = onSnapshot(ordersQuery, async (snapshot) => {
      try {
        const previews: ChatPreview[] = [];
        
        for (const docSnapshot of snapshot.docs) {
          const orderData = docSnapshot.data() as Order;
          
          // Skip orders that don't have both participants yet
          if (sessionRole === 'customer' && !orderData.deliveryPersonId) continue;
          if (sessionRole === 'delivery' && !orderData.customerId) continue;
          
          const participantId = sessionRole === 'customer' 
            ? orderData.deliveryPersonId 
            : orderData.customerId;

          if (!participantId) continue;

          try {
            const userDocRef = doc(db, 'users', participantId);
            const participantDoc = await getDoc(userDocRef);
            if (!participantDoc.exists()) continue;

            const participantData = participantDoc.data() as UserData;
            
            // Get last message
            const lastMessageQuery = query(
              collection(db, 'messages'),
              where('orderId', '==', docSnapshot.id),
              orderBy('timestamp', 'desc'),
              limit(1)
            );
            
            const lastMessageSnap = await getDocs(lastMessageQuery);
            const lastMessage = !lastMessageSnap.empty ? {
              text: lastMessageSnap.docs[0].data().text,
              timestamp: lastMessageSnap.docs[0].data().timestamp.toDate()
            } : undefined;

            // Get unread count for this order
            const unreadCountQuery = query(
              collection(db, 'messages'),
              where('orderId', '==', docSnapshot.id),
              where('recipientId', '==', user.uid),
              where('read', '==', false)
            );
            const unreadSnap = await getDocs(unreadCountQuery);

            previews.push({
              orderId: docSnapshot.id,
              participant: {
                id: participantId,
                name: participantData.name || 'Unknown User',
                photo: participantData.photoURL || 'https://via.placeholder.com/40',
                role: participantData.role,
              },
              lastMessage,
              orderStatus: orderData.status,
              unreadCount: unreadSnap.size,
            });
          } catch (err) {
            console.error('Error fetching chat preview for order:', docSnapshot.id, err);
          }
        }

        setChatPreviews(previews);
        setLoading(false);
      } catch (err) {
        console.error('Error processing orders snapshot:', err);
        setError('Failed to load chat previews');
        setLoading(false);
      }
    });

    return () => {
      unsubscribeOrders();
    };
  }, [user, sessionRole]);

  // Fetch chat participant info for specific chat
  useEffect(() => {
    const fetchParticipant = async () => {
      if (!orderId || !user) return;

      try {
        const orderDoc = await getDoc(doc(db, 'orders', orderId));
        if (!orderDoc.exists()) {
          setError('Order not found');
          return;
        }

        const orderData = orderDoc.data();
        const participantId = sessionRole === 'customer' 
          ? orderData.deliveryPersonId 
          : orderData.customerId;

        if (!participantId) {
          setError('No chat participant found');
          return;
        }

        const participantDoc = await getDoc(doc(db, 'users', participantId));
        if (!participantDoc.exists()) {
          setError('Participant not found');
          return;
        }

        const participantData = participantDoc.data();
        setParticipant({
          id: participantId,
          name: participantData.name || 'Unknown User',
          photo: participantData.photoURL || 'https://via.placeholder.com/40',
          role: participantData.role as UserRole,
        });
      } catch (err) {
        console.error('Error fetching participant:', err);
        setError('Failed to load chat participant');
      }
    };

    if (orderId) {
      fetchParticipant();
    }
  }, [orderId, user, sessionRole]);

  // Set up real-time messages listener for specific chat
  useEffect(() => {
    if (!orderId || !user) return;

    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('orderId', '==', orderId),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date(),
      })) as Message[];
      
      setMessages(newMessages);
      setLoading(false);

      // Mark messages as read
      const batch = writeBatch(db);
      let hasUnreadMessages = false;

      snapshot.docs.forEach(doc => {
        const messageData = doc.data();
        if (messageData.recipientId === user.uid && !messageData.read) {
          hasUnreadMessages = true;
          batch.update(doc.ref, { read: true });
        }
      });

      if (hasUnreadMessages) {
        try {
          await batch.commit();
        } catch (err) {
          console.error('Error marking messages as read:', err);
        }
      }
    });

    return () => unsubscribe();
  }, [orderId, user]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !orderId || !participant) return;

    try {
      const messagesRef = collection(db, 'messages');
      await addDoc(messagesRef, {
        orderId,
        text: newMessage.trim(),
        sender: {
          id: user.uid,
          role: sessionRole,
        },
        recipientId: participant.id,
        read: false,
        timestamp: serverTimestamp(),
      });

      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    }
  };

  const formatTime = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <p className="text-red-400">{error}</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Show chat list when no specific chat is selected
  if (!orderId) {
    return (
      <PageLayout>
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Active Chats</h1>
          
          {chatPreviews.length === 0 ? (
            <div className="text-center py-8 text-text-secondary">
              {sessionRole === 'customer' 
                ? "No active chats. Your conversations with delivery partners will appear here."
                : "No active chats. Accept orders to start conversations with customers."}
            </div>
          ) : (
            <div className="space-y-4">
              {chatPreviews.map((preview) => (
                <button
                  key={preview.orderId}
                  onClick={() => navigate(`/chat/${preview.orderId}`)}
                  className="relative w-full bg-background-card hover:bg-background-dark transition-colors rounded-xl p-4"
                >
                  {preview.unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-5 h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center">
                      {preview.unreadCount}
                    </span>
                  )}
                  <div className="flex items-center gap-4">
                    <img
                      src={preview.participant.photo}
                      alt={preview.participant.name}
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                    <div className="flex-1 text-left">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{preview.participant.name}</h3>
                        {preview.lastMessage && (
                          <span className="text-xs text-text-secondary">
                            {formatTime(preview.lastMessage.timestamp)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-text-secondary truncate">
                        {preview.lastMessage?.text || 'No messages yet'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                          Order #{preview.orderId.slice(-4)}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-background-dark text-text-secondary capitalize">
                          {preview.orderStatus.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </PageLayout>
    );
  }

  // Show individual chat when a specific chat is selected
  return (
    <PageLayout>
      <div className="h-screen flex flex-col">
        {/* Chat Header */}
        <div className="bg-background-card rounded-t-2xl p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/chat')}
              className="mr-4 text-text-secondary hover:text-text-primary transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            {participant && (
              <div className="flex items-center flex-1">
                <img
                  src={participant.photo}
                  alt={participant.name}
                  className="w-10 h-10 rounded-xl object-cover"
                />
                <div className="ml-3">
                  <h2 className="font-medium text-text-primary">{participant.name}</h2>
                  <p className="text-sm text-text-secondary capitalize">
                    {participant.role}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-text-secondary">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender.id === user?.uid ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                    message.sender.id === user?.uid
                      ? 'bg-primary text-white'
                      : 'bg-background-card text-text-primary'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <p className={`text-xs ${
                      message.sender.id === user?.uid ? 'text-white/70' : 'text-text-secondary'
                    }`}>
                      {formatTime(message.timestamp)}
                    </p>
                    {message.sender.id === user?.uid && (
                      <svg 
                        className={`w-3 h-3 ${message.read ? 'text-white' : 'text-white/50'}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d={message.read 
                            ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            : "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          }
                        />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="p-4 bg-background-card rounded-b-2xl">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-background-dark rounded-xl px-4 py-2 text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="bg-primary hover:bg-primary-dark text-white p-2 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </PageLayout>
  );
};

export default Chat; 