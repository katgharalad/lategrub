import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import BottomNav from '../components/BottomNav';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, onSnapshot, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Order, OrderStatus } from '../types';
import OrderCard from '../components/OrderCard';

const DeliveryDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, sessionRole } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'available' | 'accepted' | 'history'>('available');

  useEffect(() => {
    if (!user || sessionRole !== 'delivery') {
      setError('You do not have permission to view this page');
      return;
    }

    // Query for available orders (status: 'ordered')
    const availableOrdersQuery = query(
      collection(db, 'orders'),
      where('status', '==', 'ordered'),
      orderBy('createdAt', 'desc')
    );

    // Query for orders assigned to this delivery person
    const activeOrdersQuery = query(
      collection(db, 'orders'),
      where('deliveryPersonId', '==', user.uid),
      where('status', 'in', ['waiting', 'got_food', 'walking']),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeAvailable = onSnapshot(availableOrdersQuery, (snapshot) => {
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
            status: data.status as OrderStatus,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            paymentMethod: data.paymentMethod,
            paymentDetails: data.paymentDetails
          } as Order;
        });
        setOrders(newOrders);
        setLoading(false);
      } catch (err) {
        console.error('Error processing available orders:', err);
        setError('Failed to process available orders');
        setLoading(false);
      }
    }, (err) => {
      console.error('Error fetching available orders:', err);
      setError('Failed to load available orders');
      setLoading(false);
    });

    const unsubscribeActive = onSnapshot(activeOrdersQuery, (snapshot) => {
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
            status: data.status as OrderStatus,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            paymentMethod: data.paymentMethod,
            paymentDetails: data.paymentDetails
          } as Order;
        });
        setActiveOrders(newOrders);
      } catch (err) {
        console.error('Error processing active orders:', err);
        setError('Failed to process active orders');
      }
    }, (err) => {
      console.error('Error fetching active orders:', err);
      setError('Failed to load your active orders');
    });

    return () => {
      unsubscribeAvailable();
      unsubscribeActive();
    };
  }, [user, sessionRole]);

  const handleAcceptOrder = async (orderId: string) => {
    if (!user) return;

    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: 'waiting' as OrderStatus,
        deliveryPersonId: user.uid
      });
      setActiveTab('accepted');
    } catch (error) {
      console.error('Error accepting order:', error);
      setError('Error accepting order. Please try again.');
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      setError('Error updating order status. Please try again.');
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
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <div className="bg-background-card rounded-xl p-8 shadow-float max-w-md w-full space-y-4">
            <h2 className="text-2xl font-bold text-center text-red-400">Access Denied</h2>
            <p className="text-center text-text-secondary">{error}</p>
            <p className="text-sm text-red-400/80 mt-2">
              If this error persists, please try logging out and back in.
            </p>
          </div>
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
            <p className="mt-2 text-2xl font-bold">{orders.length}</p>
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
            <p className="mt-2 text-2xl font-bold">{activeOrders.length}</p>
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
              activeOrders.length === 0 ? (
                <p className="text-center text-text-secondary py-4">No accepted orders at the moment.</p>
              ) : (
                activeOrders.map((order) => (
                  <OrderCard 
                    key={order.id} 
                    order={order} 
                    isDeliveryView 
                    onUpdateStatus={handleUpdateStatus}
                  />
                ))
              )
            ) : activeTab === 'available' ? (
              orders.length === 0 ? (
                <p className="text-center text-text-secondary py-4">No available orders at the moment.</p>
              ) : (
                orders.map((order) => (
                  <OrderCard 
                    key={order.id} 
                    order={order} 
                    isDeliveryView 
                    onAccept={handleAcceptOrder}
                  />
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