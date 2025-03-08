import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Order } from '../types';
import PageLayout from '../components/PageLayout';
import OrderCard from '../components/OrderCard';
import BottomNav from '../components/BottomNav';

const PastOrders: React.FC = () => {
  const navigate = useNavigate();
  const { user, sessionRole } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || sessionRole !== 'customer') {
      setError('Only customers can view past orders');
      setLoading(false);
      return;
    }

    const ordersQuery = query(
      collection(db, 'orders'),
      where('customerId', '==', user.uid),
      where('status', '==', 'delivered'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      try {
        const newOrders = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            customerName: data.customerName || 'Unknown Customer',
            customerId: data.customerId,
            deliveryPersonId: data.deliveryPersonId,
            deliveryAddress: data.deliveryAddress,
            items: data.items || [],
            total: data.total || 0,
            status: data.status,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            paymentMethod: data.paymentMethod,
            paymentDetails: data.paymentDetails
          } as Order;
        });
        setOrders(newOrders);
        setLoading(false);
      } catch (err) {
        console.error('Error processing orders:', err);
        setError('Failed to load past orders');
        setLoading(false);
      }
    }, (err) => {
      console.error('Error fetching orders:', err);
      setError('Failed to load past orders');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, sessionRole]);

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
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <div className="bg-background-card rounded-xl p-8 shadow-float max-w-md w-full space-y-4">
            <h2 className="text-2xl font-bold text-center text-red-400">Access Denied</h2>
            <p className="text-center text-text-secondary">{error}</p>
            <p className="text-sm text-red-400/80 mt-2">
              If this error persists, please try logging out and back in.
            </p>
            <button
              onClick={() => navigate('/customer')}
              className="w-full bg-primary text-white py-2 rounded-xl hover:bg-primary-dark transition-colors mt-4"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Past Orders</h1>
          <button
            onClick={() => navigate('/customer')}
            className="text-primary hover:text-primary-dark transition-colors"
          >
            Back to Dashboard
          </button>
        </div>

        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="text-center py-8 text-text-secondary">
              <p>No past orders yet.</p>
              <button
                onClick={() => navigate('/place-order')}
                className="mt-4 text-primary hover:text-primary-dark transition-colors"
              >
                Place your first order
              </button>
            </div>
          ) : (
            orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))
          )}
        </div>
      </div>
      <BottomNav />
    </PageLayout>
  );
};

export default PastOrders; 