import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import BottomNav from '../components/BottomNav';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Order } from '../lib/firebase';

interface DeliveryOrder extends Order {
  id: string;
  restaurant?: {
    name: string;
    address: string;
  };
  customer: {
    name: string;
    address: string;
    photoURL?: string;
  };
  createdAt: Date;
}

interface UnreadCounts {
  [orderId: string]: number;
}

const formatOrderTime = (date: Date) => {
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  });
};

const DeliveryDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, userRole, loading: authLoading } = useAuth();
  const [availableOrders, setAvailableOrders] = useState<DeliveryOrder[]>([]);
  const [acceptedOrders, setAcceptedOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'available' | 'accepted' | 'history'>('available');
  const [unreadCounts, setUnreadCounts] = useState<UnreadCounts>({});

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      console.log('No user found');
      setError('Please log in to view your dashboard');
      setLoading(false);
      return;
    }

    if (userRole !== 'delivery') {
      console.log('User is not a delivery person');
      setError('You do not have permission to view this page');
      setLoading(false);
      return;
    }

    console.log('Setting up orders listeners for user:', user.uid);
    
    try {
      // Query for available orders (status: 'ordered')
      const availableOrdersRef = collection(db, 'orders');
      const availableQuery = query(
        availableOrdersRef,
        where('status', '==', 'ordered')
      );

      // Query for accepted orders (status: 'waiting', 'got_food', 'walking')
      const acceptedOrdersRef = collection(db, 'orders');
      const acceptedQuery = query(
        acceptedOrdersRef,
        where('deliveryPersonId', '==', user.uid),
        where('status', 'in', ['waiting', 'got_food', 'walking'])
      );

      // Set up listener for available orders
      const unsubscribeAvailable = onSnapshot(availableQuery, async (snapshot) => {
        console.log('Received available orders snapshot:', snapshot.size, 'orders');
        const orders = await Promise.all(snapshot.docs.map(async (docSnapshot) => {
          const orderData = docSnapshot.data();
          console.log('Order data:', orderData);
          
          let restaurant = undefined;
          if (orderData.restaurantId) {
            try {
              const restaurantDoc = await getDoc(doc(db, 'restaurants', orderData.restaurantId));
              const restaurantData = restaurantDoc.exists() ? restaurantDoc.data() : null;
              restaurant = restaurantData ? {
                name: restaurantData.name,
                address: restaurantData.address
              } : undefined;
            } catch (error) {
              console.error('Error fetching restaurant:', error);
            }
          }
          
          // Fetch customer details
          const customerDoc = await getDoc(doc(db, 'users', orderData.customerId));
          const customerData = customerDoc.data();
          
          return {
            id: docSnapshot.id,
            ...orderData,
            restaurant,
            customer: {
              name: customerData?.name || 'Unknown Customer',
              address: orderData.deliveryAddress || 'Address not available',
              photoURL: customerData?.photoURL
            },
            createdAt: orderData.createdAt?.toDate() || new Date()
          };
        })) as DeliveryOrder[];
        
        console.log('Processed orders:', orders);
        setAvailableOrders(orders);
        setLoading(false);
      }, (error) => {
        console.error('Error fetching available orders:', error);
        setError('Error loading available orders. Please try again.');
        setLoading(false);
      });

      // Set up listener for accepted orders
      const unsubscribeAccepted = onSnapshot(acceptedQuery, async (snapshot) => {
        console.log('Received accepted orders snapshot:', snapshot.size, 'orders');
        const orders = await Promise.all(snapshot.docs.map(async (docSnapshot) => {
          const orderData = docSnapshot.data();
          console.log('Accepted order data:', orderData);
          
          let restaurant = undefined;
          if (orderData.restaurantId) {
            try {
              const restaurantDoc = await getDoc(doc(db, 'restaurants', orderData.restaurantId));
              const restaurantData = restaurantDoc.exists() ? restaurantDoc.data() : null;
              restaurant = restaurantData ? {
                name: restaurantData.name,
                address: restaurantData.address
              } : undefined;
            } catch (error) {
              console.error('Error fetching restaurant:', error);
            }
          }
          
          // Fetch customer details
          const customerDoc = await getDoc(doc(db, 'users', orderData.customerId));
          const customerData = customerDoc.data();
          
          return {
            id: docSnapshot.id,
            ...orderData,
            restaurant,
            customer: {
              name: customerData?.name || 'Unknown Customer',
              address: orderData.deliveryAddress || 'Address not available',
              photoURL: customerData?.photoURL
            },
            createdAt: orderData.createdAt?.toDate() || new Date()
          };
        })) as DeliveryOrder[];
        
        console.log('Processed accepted orders:', orders);
        setAcceptedOrders(orders);
        setLoading(false);
      }, (error) => {
        console.error('Error fetching accepted orders:', error);
        setError('Error loading accepted orders. Please try again.');
        setLoading(false);
      });

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

      const unsubscribeMessages = setupMessagesListener();

      return () => {
        if (unsubscribeAvailable) unsubscribeAvailable();
        if (unsubscribeAccepted) unsubscribeAccepted();
        unsubscribeMessages();
      };
    } catch (error) {
      console.error('Error setting up orders listeners:', error);
      setError('Error loading dashboard data. Please try again.');
      setLoading(false);
    }
  }, [user, userRole, authLoading]);

  const handleAcceptOrder = async (orderId: string) => {
    if (!user) return;

    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: 'waiting',
        deliveryPersonId: user.uid
      });
      setActiveTab('accepted');
    } catch (error) {
      console.error('Error accepting order:', error);
      setError('Error accepting order. Please try again.');
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: newStatus
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      setError('Error updating order status. Please try again.');
    }
  };

  const getOrderProgress = (status: Order['status']) => {
    const stages: Order['status'][] = ['ordered', 'waiting', 'got_food', 'walking', 'delivered'];
    return stages.indexOf(status);
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'ordered':
        return 'bg-yellow-500';
      case 'waiting':
        return 'bg-blue-500';
      case 'got_food':
        return 'bg-green-500';
      case 'walking':
        return 'bg-purple-500';
      case 'delivered':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (authLoading || loading) {
    return (
      <PageLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <p className="text-red-400">{error}</p>
          <p className="text-sm text-red-400/80 mt-2">
            If this error persists, please try logging out and back in.
          </p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => setActiveTab('available')}
            className={`bg-background-card rounded-xl p-4 hover:bg-background-dark transition-colors text-left ${
              activeTab === 'available' ? 'ring-2 ring-primary' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-text-secondary">Available Orders</h3>
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
                </div>
            <p className="mt-2 text-2xl font-bold">{availableOrders.length}</p>
                </button>

          <button
            onClick={() => setActiveTab('accepted')}
            className={`bg-background-card rounded-xl p-4 hover:bg-background-dark transition-colors text-left ${
              activeTab === 'accepted' ? 'ring-2 ring-primary' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-text-secondary">Accepted Orders</h3>
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              </div>
            <p className="mt-2 text-2xl font-bold">{acceptedOrders.length}</p>
          </button>

          <button
            onClick={() => navigate('/delivery-history')}
            className={`bg-background-card rounded-xl p-4 hover:bg-background-dark transition-colors text-left ${
              activeTab === 'history' ? 'ring-2 ring-primary' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-text-secondary">Delivery History</h3>
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
          </div>
            <p className="mt-2 text-2xl font-bold">📋</p>
          </button>
        </div>

        {/* Orders Section */}
        <div className="bg-background-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold">
              {activeTab === 'available' ? 'Available Orders' : 
               activeTab === 'accepted' ? 'Accepted Orders' : 'Delivery History'}
            </h2>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm text-text-secondary">Live Updates</span>
            </div>
          </div>

          <div className="space-y-4">
            {activeTab === 'accepted' ? (
              acceptedOrders.length === 0 ? (
                <p className="text-center text-text-secondary py-4">No accepted orders at the moment.</p>
              ) : (
                acceptedOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-background-dark rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-medium">{order.customer.name}</h3>
                        <p className="text-sm text-text-secondary">{order.customer.address}</p>
                        <p className="text-xs text-text-secondary mt-1">
                          Ordered {formatOrderTime(order.createdAt)}
                        </p>
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
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                          {order.status.toUpperCase()}
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="bg-background-DEFAULT rounded-lg p-3 mb-4">
                      <h4 className="text-sm font-medium mb-2">Order Items:</h4>
                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{item.quantity}x {item.name}</span>
                            <span>${(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                        <div className="border-t border-background-dark pt-2 mt-2">
                          <div className="flex justify-between text-sm font-medium">
                            <span>Total</span>
                            <span>${order.total.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
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
                        <span>Waiting</span>
                        <span>Got Food</span>
                        <span>Walking</span>
                        <span>Delivered</span>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {order.status === 'waiting' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'got_food')}
                          className="bg-primary text-white py-2 rounded-xl hover:bg-primary-dark transition-colors"
                        >
                          Got Food
                        </button>
                      )}
                      {order.status === 'got_food' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'walking')}
                          className="bg-primary text-white py-2 rounded-xl hover:bg-primary-dark transition-colors"
                        >
                          Start Walking
                        </button>
                      )}
                      {order.status === 'walking' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'delivered')}
                          className="bg-primary text-white py-2 rounded-xl hover:bg-primary-dark transition-colors"
                        >
                          Mark as Delivered
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )
            ) : activeTab === 'available' ? (
              availableOrders.length === 0 ? (
                <p className="text-center text-text-secondary py-4">No available orders at the moment.</p>
              ) : (
                availableOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-background-dark rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-medium">{order.customer.name}</h3>
                        <p className="text-sm text-text-secondary">{order.customer.address}</p>
                        <p className="text-xs text-text-secondary mt-1">
                          Ordered {formatOrderTime(order.createdAt)}
                        </p>
                      </div>
                      <div className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-500">
                        AVAILABLE
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="bg-background-DEFAULT rounded-lg p-3 mb-4">
                      <h4 className="text-sm font-medium mb-2">Order Items:</h4>
                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{item.quantity}x {item.name}</span>
                            <span>${(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                        <div className="border-t border-background-dark pt-2 mt-2">
                          <div className="flex justify-between text-sm font-medium">
                            <span>Total</span>
                            <span>${order.total.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAcceptOrder(order.id)}
                      className="w-full bg-primary text-white py-2 rounded-xl hover:bg-primary-dark transition-colors"
                    >
                      Accept Order
                    </button>
                  </div>
                ))
              )
            ) : null}
          </div>
        </div>
      </div>
      <BottomNav />
    </PageLayout>
  );
};

export default DeliveryDashboard;