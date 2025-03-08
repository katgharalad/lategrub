import React, { useState, useEffect } from 'react';
import PageLayout from '../components/PageLayout';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, onSnapshot, Timestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Order } from '../lib/firebase';

const PastOrders: React.FC = () => {
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
          console.log('User document not found');
          setError('User profile not found. Please contact support.');
          setLoading(false);
          return;
        }

        const userData = userDoc.data();
        console.log('User data:', userData);
        
        if (userData.role !== 'customer') {
          console.log('User is not a customer:', userData.role);
          setError('Only customers can view past orders.');
          setLoading(false);
          return;
        }

        console.log('User role verified:', userData.role);
        
        const ordersRef = collection(db, 'orders');
        console.log('Created orders collection reference');
        
        // Query for all orders for this customer
        const q = query(
          ordersRef,
          where('customerId', '==', user.uid)
        );
        console.log('Created query:', q);

        const unsubscribe = onSnapshot(q, (snapshot) => {
          console.log('Received orders snapshot:', snapshot.size, 'orders');
          const ordersData = snapshot.docs.map(doc => {
            const data = doc.data();
            console.log('Raw order data:', { id: doc.id, ...data });
            
            // Handle createdAt field
            let createdAt = new Date();
            if (data.createdAt) {
              if (data.createdAt instanceof Timestamp) {
                createdAt = data.createdAt.toDate();
              } else if (typeof data.createdAt === 'string') {
                createdAt = new Date(data.createdAt);
              }
            }
            
            return {
              id: doc.id,
              ...data,
              createdAt
            };
          }) as Order[];
          
          console.log('All orders before filtering:', ordersData);
          
          // Filter delivered orders in memory
          const pastOrders = ordersData.filter(order => {
            console.log('Checking order status:', order.id, order.status);
            return order.status === 'delivered';
          });
          
          console.log('Filtered past orders:', pastOrders);
          setOrders(pastOrders);
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

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(date);
  };

  return (
    <PageLayout title="Past Orders">
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
            No past orders yet. Your completed orders will appear here.
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
                      Delivered on {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="px-3 py-1 rounded-full text-sm font-medium bg-green-500">
                    DELIVERED
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

                {/* Delivery Person */}
                {order.deliveryPersonId && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-text-secondary mb-2">Delivered By</h4>
                    <p className="text-sm">{order.deliveryPersonId}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default PastOrders; 