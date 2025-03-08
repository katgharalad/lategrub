import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import AvailableItems from '../components/AvailableItems';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, onSnapshot, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Order, OrderStatus } from '../lib/firebase';
import { format } from 'date-fns';

interface UnreadCounts {
  [orderId: string]: number;
}

const CustomerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCounts, setUnreadCounts] = useState<UnreadCounts>({});

  useEffect(() => {
    if (!user) return;

    // Set up messages listener for unread counts
    const setupMessagesListener = () => {
      const messagesRef = collection(db, 'messages');
      const unsubscribe = onSnapshot(
        query(
          messagesRef,
          where('recipientId', '==', user.uid),
          where('read', '==', false)
        ),
        (snapshot) => {
          const counts: UnreadCounts = {};
          snapshot.docs.forEach(doc => {
            const data = doc.data();
            counts[data.orderId] = (counts[data.orderId] || 0) + 1;
          });
          setUnreadCounts(counts);
        }
      );
      return unsubscribe;
    };

    // Query for orders where the current user is the customer
    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef,
      where('customerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    // Set up real-time listener
    const unsubscribeOrders = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date()
        };
      }) as Order[];
      
      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching orders:', error);
      setLoading(false);
    });

    const unsubscribeMessages = setupMessagesListener();

    // Cleanup subscriptions
    return () => {
      unsubscribeOrders();
      unsubscribeMessages();
    };
  }, [user]);

  const getOrderProgress = (status: OrderStatus) => {
    const stages: OrderStatus[] = ['ordered', 'waiting', 'got_food', 'walking', 'delivered'];
    return stages.indexOf(status);
  };

  const activeOrders = orders.filter(order => order.status !== 'delivered');

  // Add this function to get order number
  const getOrderNumber = (order: Order) => {
    const orderIndex = orders.findIndex(o => o.id === order.id);
    return orderIndex + 1;
  };

  const formatOrderTime = (date: Date) => {
    return format(date, 'MMM d, h:mm a');
  };

  const getOrderStatus = (status: OrderStatus) => {
    switch (status) {
      case 'ordered': return 'Just Ordered';
      case 'waiting': return 'Waiting for Pickup';
      case 'got_food': return 'Food Picked Up';
      case 'walking': return 'On the Way';
      case 'delivered': return 'Delivered';
      default: return status;
    }
  };

  return (
    <PageLayout>
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/place-order')}
            className="bg-background-card rounded-xl p-4 hover:bg-background-dark transition-colors text-left"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-text-secondary">Place New Order</h3>
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <p className="mt-2 text-2xl font-bold text-primary">+</p>
          </button>

          <button
            onClick={() => navigate('/active-orders')}
            className="bg-background-card rounded-xl p-4 hover:bg-background-dark transition-colors text-left"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-text-secondary">Active Orders</h3>
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="mt-2 text-2xl font-bold">{activeOrders.length}</p>
          </button>

          <button
            onClick={() => navigate('/past-orders')}
            className="bg-background-card rounded-xl p-4 hover:bg-background-dark transition-colors text-left"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-text-secondary">Past Orders</h3>
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <p className="mt-2 text-2xl font-bold">{orders.filter(o => o.status === 'delivered').length}</p>
          </button>
        </div>

        {/* Order Progress Visualization */}
        <div className="bg-background-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold">Order Progress</h2>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm text-text-secondary">Live Updates</span>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-4">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : activeOrders.length === 0 ? (
            <div className="text-center py-4 text-text-secondary">
              No active orders. Place a new order to get started!
            </div>
          ) : (
            <div className="space-y-6">
              {activeOrders.map((order) => (
                <div key={order.id} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="space-y-1">
                      <div className="font-medium text-base">
                        Ordered {formatOrderTime(order.createdAt)}
                      </div>
                      <div className="text-text-secondary">
                        Status: {getOrderStatus(order.status)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/chat/${order.id}`)}
                        className="relative flex items-center gap-1 px-3 py-1 bg-primary/20 text-primary rounded-full hover:bg-primary/30 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span className="text-xs">Chat</span>
                        {order.id && unreadCounts[order.id] > 0 && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-xs rounded-full flex items-center justify-center">
                            {unreadCounts[order.id]}
                          </span>
                        )}
                      </button>
                      <span className="text-text-secondary">
                        ${order.total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Order Items Summary */}
                  <div className="text-sm text-text-secondary pl-4 border-l border-background-dark">
                    {order.items.map((item, idx) => (
                      <div key={idx}>
                        {item.quantity}x {item.name}
                      </div>
                    ))}
                  </div>

                  <div className="relative h-2 bg-background-dark rounded-full overflow-hidden">
                    <div 
                      className="absolute inset-y-0 left-0 bg-primary transition-all duration-500"
                      style={{ width: `${(getOrderProgress(order.status) / 4) * 100}%` }}
                    />
                    <div className="absolute inset-0 flex justify-between px-2">
                      <div className={`w-1 h-full ${getOrderProgress(order.status) >= 0 ? 'bg-primary' : 'bg-background-dark'}`} />
                      <div className={`w-1 h-full ${getOrderProgress(order.status) >= 1 ? 'bg-primary' : 'bg-background-dark'}`} />
                      <div className={`w-1 h-full ${getOrderProgress(order.status) >= 2 ? 'bg-primary' : 'bg-background-dark'}`} />
                      <div className={`w-1 h-full ${getOrderProgress(order.status) >= 3 ? 'bg-primary' : 'bg-background-dark'}`} />
                      <div className={`w-1 h-full ${getOrderProgress(order.status) >= 4 ? 'bg-primary' : 'bg-background-dark'}`} />
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-text-secondary">
                    <span>Ordered</span>
                    <span>Waiting</span>
                    <span>Got Food</span>
                    <span>Walking</span>
                    <span>Delivered</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Available Items */}
        <AvailableItems />
      </div>
    </PageLayout>
  );
};

export default CustomerDashboard;