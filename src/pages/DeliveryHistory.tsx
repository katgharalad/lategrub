import React, { useState, useEffect } from 'react';
import PageLayout from '../components/PageLayout';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Order } from '../lib/firebase';

interface DeliveryOrder extends Order {
  id: string;
  restaurant?: {
    name: string;
    address: string;
  };
  customer?: {
    name: string;
    address: string;
  };
}

const DeliveryHistory: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      console.log('No user found');
      setError('Please log in to view your delivery history');
      setLoading(false);
      return;
    }

    console.log('Setting up orders listener for user:', user.uid);
    
    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef,
      where('deliveryPersonId', '==', user.uid),
      where('status', '==', 'delivered')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('Received orders snapshot:', snapshot.size, 'orders');
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DeliveryOrder[];
      
      setOrders(ordersData);
      setLoading(false);
      setError(null);
    }, (error: any) => {
      console.error('Error fetching orders:', error);
      let errorMessage = 'Error loading delivery history. Please try again.';
      
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
  }, [user]);

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
            No completed deliveries yet. Your completed deliveries will appear here.
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-background-card rounded-xl p-6">
                {/* Order Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold">Order #{order.id.slice(-6)}</h3>
                    <p className="text-sm text-text-secondary">
                      Delivered on {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="px-3 py-1 rounded-full text-sm font-medium bg-green-500">
                    DELIVERED
                  </div>
                </div>

                {/* Restaurant Info */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-text-secondary mb-2">Restaurant</h4>
                  <p className="text-sm">{order.restaurant?.name || 'Unknown Restaurant'}</p>
                  <p className="text-sm text-text-secondary">{order.restaurant?.address || 'Address not available'}</p>
                </div>

                {/* Customer Info */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-text-secondary mb-2">Customer</h4>
                  <p className="text-sm">{order.customer?.name || 'Unknown Customer'}</p>
                  <p className="text-sm text-text-secondary">{order.customer?.address || 'Address not available'}</p>
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

                {/* Payment Info */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-text-secondary mb-2">Payment</h4>
                  <div className="flex justify-between text-sm">
                    <span>{(order.paymentMethod || 'Unknown').toUpperCase()}</span>
                    <span>${(order.total || 0).toFixed(2)}</span>
                  </div>
                  <p className="text-sm text-text-secondary mt-1">
                    {order.paymentDetails || 'No payment details available'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default DeliveryHistory; 