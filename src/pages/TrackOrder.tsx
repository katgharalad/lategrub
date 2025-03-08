import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import OrderTracker from '../components/OrderTracker';
import EnergyFlow from '../components/EnergyFlow';

interface OrderDetails {
  id: string;
  status: 'pending' | 'accepted' | 'picked_up' | 'delivered';
  restaurant: {
    name: string;
    address: string;
  };
  customer: {
    name: string;
    address: string;
  };
  items: {
    name: string;
    quantity: number;
    price: number;
  }[];
  delivery: {
    name: string;
    phone: string;
    photo: string;
  } | null;
  total: number;
  createdAt: Date;
  statusUpdates: {
    status: 'pending' | 'accepted' | 'picked_up' | 'delivered';
    timestamp: Date;
    location?: string;
    note?: string;
  }[];
}

const TrackOrder: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch order details from Firebase
    const mockOrder: OrderDetails = {
      id: orderId || '1',
      status: 'picked_up',
      restaurant: {
        name: 'Burger King',
        address: '456 Food Ave',
      },
      customer: {
        name: 'John Doe',
        address: '123 Main St',
      },
      items: [
        { name: 'Whopper', quantity: 2, price: 7.99 },
        { name: 'Fries', quantity: 1, price: 3.99 },
      ],
      delivery: {
        name: 'Mike Smith',
        phone: '555-0123',
        photo: 'https://randomuser.me/api/portraits/men/1.jpg',
      },
      total: 19.97,
      createdAt: new Date(),
      statusUpdates: [
        {
          status: 'pending',
          timestamp: new Date(Date.now() - 1000 * 60 * 30),
          note: 'Order placed successfully',
        },
        {
          status: 'accepted',
          timestamp: new Date(Date.now() - 1000 * 60 * 20),
          note: 'Driver assigned to your order',
        },
        {
          status: 'picked_up',
          timestamp: new Date(Date.now() - 1000 * 60 * 10),
          location: 'Burger King - 456 Food Ave',
          note: 'Order picked up by driver',
        },
      ],
    };

    setOrder(mockOrder);
    setLoading(false);
  }, [orderId]);

  // Mock data for the energy flow visualization
  const flowData = {
    input: {
      total: 1,
      sources: [
        { name: 'Restaurant', value: 1, active: true },
      ],
    },
    output: {
      total: 1,
      destinations: [
        { name: 'Customer', value: 1, active: true },
      ],
    },
  };

  if (loading || !order) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="space-y-6">
        {/* Order Header */}
        <div className="bg-background-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-display font-bold">Order #{order.id}</h1>
            <div className="bg-primary/20 px-3 py-1 rounded-full">
              <span className="text-sm font-medium text-primary">
                ${order.total.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-text-secondary mb-1">From</p>
              <p className="font-medium">{order.restaurant.name}</p>
              <p className="text-text-secondary">{order.restaurant.address}</p>
            </div>
            <div>
              <p className="text-text-secondary mb-1">To</p>
              <p className="font-medium">{order.customer.name}</p>
              <p className="text-text-secondary">{order.customer.address}</p>
            </div>
          </div>
        </div>

        {/* Energy Flow Visualization */}
        <EnergyFlow data={flowData} title="DELIVERY PROGRESS" />

        {/* Order Tracking */}
        <OrderTracker
          currentStatus={order.status}
          updates={order.statusUpdates}
        />

        {/* Order Items */}
        <div className="bg-background-card rounded-2xl p-6">
          <h2 className="text-xl font-display font-bold mb-6">Order Items</h2>
          <div className="space-y-4">
            {order.items.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 border-b border-background-dark last:border-0"
              >
                <div className="flex items-center">
                  <span className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center text-primary font-medium">
                    {item.quantity}x
                  </span>
                  <span className="ml-3 font-medium">{item.name}</span>
                </div>
                <span className="text-text-secondary">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Person */}
        {order.delivery && (
          <div className="bg-background-card rounded-2xl p-6">
            <h2 className="text-xl font-display font-bold mb-6">Delivery Person</h2>
            <div className="flex items-center">
              <img
                src={order.delivery.photo}
                alt={order.delivery.name}
                className="w-12 h-12 rounded-xl object-cover"
              />
              <div className="ml-4">
                <p className="font-medium">{order.delivery.name}</p>
                <p className="text-text-secondary">{order.delivery.phone}</p>
              </div>
              <button
                onClick={() => navigate(`/chat/${order.id}`)}
                className="ml-auto bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl transition-colors"
              >
                Chat
              </button>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default TrackOrder; 