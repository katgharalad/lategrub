import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Order, OrderItem } from '../types';
import { formatOrderTime } from '../utils/dateUtils';

interface OrderCardProps {
  order: Order;
  isDeliveryView?: boolean;
  onAccept?: (orderId: string) => Promise<void>;
  onUpdateStatus?: (orderId: string, newStatus: Order['status']) => Promise<void>;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, isDeliveryView, onAccept, onUpdateStatus }) => {
  const navigate = useNavigate();

  const orderStages: Order['status'][] = ['ordered', 'waiting', 'got_food', 'walking', 'delivered'];

  const getOrderProgress = (status: Order['status']) => {
    return orderStages.indexOf(status);
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'ordered':
        return 'bg-yellow-500/20 text-yellow-500';
      case 'waiting':
        return 'bg-blue-500/20 text-blue-500';
      case 'got_food':
        return 'bg-green-500/20 text-green-500';
      case 'walking':
        return 'bg-purple-500/20 text-purple-500';
      case 'delivered':
        return 'bg-gray-500/20 text-gray-500';
      default:
        return 'bg-gray-500/20 text-gray-500';
    }
  };

  const getStatusDisplay = (status: Order['status']) => {
    const statusMap = {
      ordered: 'Just Ordered',
      waiting: 'Waiting at Restaurant',
      got_food: 'Got Food',
      walking: 'Walking to You',
      delivered: 'Delivered'
    };
    return statusMap[status] || status;
  };

  const handleAcceptClick = () => {
    if (onAccept) {
      onAccept(order.id);
    }
  };

  const handleStatusUpdate = (newStatus: Order['status']) => {
    if (onUpdateStatus) {
      onUpdateStatus(order.id, newStatus);
    }
  };

  return (
    <div className="bg-background-card rounded-xl p-6 border border-primary/30 shadow-float">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-medium text-lg">{order.customerName || 'Customer'}</h3>
          <p className="text-sm text-text-secondary">{order.deliveryAddress}</p>
          <p className="text-xs text-text-secondary mt-1">
            Ordered {formatOrderTime(order.createdAt)}
          </p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
          {getStatusDisplay(order.status)}
        </div>
      </div>

      {/* Order Progress Bar */}
      <div className="mb-4">
        <div className="relative pt-1">
          <div className="flex mb-2 items-center justify-between">
            <div>
              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-primary bg-primary/10">
                Order Progress
              </span>
            </div>
          </div>
          <div className="flex h-2 mb-4 overflow-hidden rounded bg-primary/10">
            <div
              style={{ width: `${(getOrderProgress(order.status) + 1) * (100 / orderStages.length)}%` }}
              className="flex flex-col justify-center rounded bg-primary transition-all duration-500"
            />
          </div>
          <div className="flex justify-between text-xs text-text-secondary">
            {orderStages.map((stage, index) => (
              <div
                key={stage}
                className={`${
                  getOrderProgress(order.status) >= index ? 'text-primary font-medium' : ''
                }`}
              >
                •
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-background-dark rounded-lg p-4 mb-4">
        <h4 className="text-sm font-medium mb-2">Order Items:</h4>
        <div className="space-y-2">
          {order.items.map((item: OrderItem, index: number) => (
            <div key={index} className="flex justify-between text-sm">
              <span>{item.quantity}x {item.name}</span>
              <span>${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t border-background-card pt-2 mt-2">
            <div className="flex justify-between text-sm font-medium">
              <span>Total</span>
              <span>${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {order.notes && (
        <div className="bg-background-dark rounded-lg p-4 mb-4">
          <h4 className="text-sm font-medium mb-2">Special Requests:</h4>
          <p className="text-sm text-text-secondary">{order.notes}</p>
        </div>
      )}

      {order.paymentMethod && (
        <div className="bg-background-dark rounded-lg p-4 mb-4">
          <h4 className="text-sm font-medium mb-2">Payment Information:</h4>
          <div className="space-y-1">
            <p className="text-sm">
              <span className="text-text-secondary">Method: </span>
              <span className="capitalize">{order.paymentMethod}</span>
            </p>
            {order.paymentDetails && (
              <p className="text-sm">
                <span className="text-text-secondary">Details: </span>
                {order.paymentDetails}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-between gap-2">
        <button
          onClick={() => navigate(`/chat/${order.id}`)}
          className="flex-1 flex items-center justify-center gap-2 bg-primary/20 text-primary py-2 rounded-xl hover:bg-primary/30 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Chat
        </button>

        {isDeliveryView && order.status === 'ordered' && (
          <button
            onClick={handleAcceptClick}
            className="flex-1 bg-primary text-white py-2 rounded-xl hover:bg-primary-dark transition-colors"
          >
            Accept Order
          </button>
        )}

        {isDeliveryView && order.status === 'waiting' && onUpdateStatus && (
          <button
            onClick={() => handleStatusUpdate('got_food')}
            className="flex-1 bg-primary text-white py-2 rounded-xl hover:bg-primary-dark transition-colors"
          >
            Got the Food
          </button>
        )}

        {isDeliveryView && order.status === 'got_food' && onUpdateStatus && (
          <button
            onClick={() => handleStatusUpdate('walking')}
            className="flex-1 bg-primary text-white py-2 rounded-xl hover:bg-primary-dark transition-colors"
          >
            Start Walking
          </button>
        )}

        {isDeliveryView && order.status === 'walking' && onUpdateStatus && (
          <button
            onClick={() => handleStatusUpdate('delivered')}
            className="flex-1 bg-primary text-white py-2 rounded-xl hover:bg-primary-dark transition-colors"
          >
            Mark as Delivered
          </button>
        )}
      </div>
    </div>
  );
};

export default OrderCard; 