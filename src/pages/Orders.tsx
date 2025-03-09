import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, Timestamp, doc, getDoc } from 'firebase/firestore';
import PageLayout from '../components/PageLayout';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { Order } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';

const Orders: React.FC = () => {
  const { user, sessionRole } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

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
        
        const ordersRef = collection(db, 'orders');
        console.log('Created orders collection reference');
        
        // Query for delivered orders where the user is either the customer or delivery person
        const q = query(
          ordersRef,
          where('status', '==', 'delivered'),
          where(sessionRole === 'customer' ? 'customerId' : 'deliveryPersonId', '==', user.uid)
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
            
            // Ensure all required fields have default values
            return {
              id: doc.id,
              customerId: data.customerId || '',
              deliveryPersonId: data.deliveryPersonId || null,
              status: data.status || 'delivered',
              items: data.items || [],
              total: data.total || 0,
              deliveryAddress: data.deliveryAddress || '',
              paymentMethod: data.paymentMethod || 'cash',
              paymentDetails: data.paymentDetails || '',
              createdAt
            } as Order;
          });
          
          console.log('Processed orders:', ordersData);
          setOrders(ordersData);
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
  }, [user, sessionRole]);

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
    <PageLayout>
      <div className="space-y-6">
        {/* Header with back button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate(sessionRole === 'delivery' ? '/delivery' : '/customer')}
              className="mr-4 text-text-secondary hover:text-text-primary transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold">
              {sessionRole === 'delivery' ? 'Delivery History' : 'Past Orders'}
            </h1>
          </div>
        </div>

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
            {sessionRole === 'customer' 
              ? 'No past orders yet. Your completed orders will appear here.'
              : 'No completed deliveries yet. Your completed deliveries will appear here.'}
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
                    {order.items?.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.name} x{item.quantity}</span>
                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    )) || (
                      <p className="text-sm text-text-secondary">No items found</p>
                    )}
                  </div>
                </div>

                {/* Delivery Address */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-text-secondary mb-2">Delivery Address</h4>
                  <p className="text-sm">{order.deliveryAddress || 'No address provided'}</p>
                </div>

                {/* Payment Info */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-text-secondary mb-2">Payment</h4>
                  <div className="flex justify-between text-sm">
                    <span>{(order.paymentMethod || 'Unknown').toUpperCase()}</span>
                    <span>${(order.total || 0).toFixed(2)}</span>
                  </div>
                  <p className="text-sm text-text-secondary mt-1">{order.paymentDetails || 'No payment details'}</p>
                </div>

                {/* Show delivery person for customers, show customer for delivery person */}
                {sessionRole === 'customer' && order.deliveryPersonId && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-text-secondary mb-2">Delivered By</h4>
                    <p className="text-sm">{order.deliveryPersonId}</p>
                  </div>
                )}
                {sessionRole === 'delivery' && order.customerId && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-text-secondary mb-2">Customer</h4>
                    <p className="text-sm">{order.customerId}</p>
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

export default Orders; 