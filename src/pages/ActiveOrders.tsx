import React, { useState, useEffect } from 'react';
import PageLayout from '../components/PageLayout';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, onSnapshot, orderBy, Timestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Order, OrderStatus, UserRole } from '../lib/firebase';

const ActiveOrders: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      console.log('No user found');
      setError('Please log in to view your orders');
      setLoading(false);
      return;
    }

    console.log('Setting up orders listener for user:', user.uid);
    
    const setupOrdersListener = async () => {
      try {
        // First, verify the user's role
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) {
          setError('User profile not found. Please contact support.');
          setLoading(false);
          return;
        }

        const userData = userDoc.data();
        if (userData.role !== 'customer') {
          setError('Only customers can view active orders.');
          setLoading(false);
          return;
        }

        console.log('User role verified:', userData.role);
        
        const ordersRef = collection(db, 'orders');
        console.log('Created orders collection reference');
        
        // Query using existing index
        const q = query(
          ordersRef,
          where('customerId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        console.log('Created query:', q);

        const unsubscribe = onSnapshot(q, (snapshot) => {
          console.log('Received orders snapshot:', snapshot.size, 'orders');
          const ordersData = snapshot.docs.map(doc => {
            const data = doc.data();
            console.log('Raw order data:', data);
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt)
            };
          }) as Order[];
          
          // Filter active orders in memory
          const activeOrders = ordersData.filter(order => 
            ['ordered', 'waiting', 'got_food', 'walking'].includes(order.status)
          );
          
          console.log('Processed orders:', activeOrders);
          setOrders(activeOrders);
          setLoading(false);
          setError(null);
        }, (error: any) => {
          console.error('Error fetching orders:', error);
          let errorMessage = 'Error loading orders. Please try again.';
          
          if (error.code === 'permission-denied') {
            errorMessage = 'You do not have permission to view orders. Please contact support.';
          } else if (error.code === 'unavailable') {
            errorMessage = 'Service is currently unavailable. Please try again later.';
          } else if (error.code === 'not-found') {
            errorMessage = 'Orders collection not found. Please contact support.';
          } else if (error.code === 'failed-precondition') {
            errorMessage = 'Database index is being built. Please try again in a few minutes.';
          }
          
          setError(`${errorMessage} (Error: ${error.code})`);
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (err: any) {
        console.error('Error setting up query:', err);
        setError(`Error setting up orders query: ${err.message}`);
        setLoading(false);
      }
    };

    setupOrdersListener();
  }, [user]);

  const getOrderNumber = (order: Order) => {
    const orderIndex = orders.findIndex(o => o.id === order.id);
    return orderIndex + 1;
  };

  const getOrderProgress = (status: OrderStatus) => {
    const stages: OrderStatus[] = ['ordered', 'waiting', 'got_food', 'walking', 'delivered'];
    return stages.indexOf(status);
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'ordered':
        return 'bg-yellow-500';
      case 'waiting':
        return 'bg-blue-500';
      case 'got_food':
        return 'bg-green-500';
      case 'walking':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  console.log('Current orders state:', orders);

  return (
    <PageLayout title="Active Orders">
      <div className="space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <p className="text-red-400">{error}</p>
            <p className="text-sm text-red-400/80 mt-2">
              If this error persists, please try logging out and back in.
            </p>
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-8 text-text-secondary">
            No active orders. Place a new order to get started!
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-background-card rounded-xl p-6">
                {/* Order Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold">Order #{getOrderNumber(order)}</h3>
                    <p className="text-sm text-text-secondary">
                      Placed on {order.createdAt.toLocaleString()}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    {order.status.replace('_', ' ').toUpperCase()}
                  </div>
                </div>

                {/* Order Items */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-text-secondary mb-2">Items</h4>
                  <div className="space-y-2">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.name} x{item.quantity}</span>
                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery Address */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-text-secondary mb-2">Delivery Address</h4>
                  <p className="text-sm">{order.deliveryAddress}</p>
                </div>

                {/* Payment Info */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-text-secondary mb-2">Payment</h4>
                  <div className="flex justify-between text-sm">
                    <span>{order.paymentMethod.toUpperCase()}</span>
                    <span>${order.total.toFixed(2)}</span>
                  </div>
                  <p className="text-sm text-text-secondary mt-1">{order.paymentDetails}</p>
                </div>

                {/* Progress Bar */}
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
                    <span>Ordered</span>
                    <span>Waiting</span>
                    <span>Got Food</span>
                    <span>Walking</span>
                    <span>Delivered</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default ActiveOrders; 