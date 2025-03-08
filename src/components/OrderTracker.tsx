import React from 'react';

interface OrderStatus {
  status: 'pending' | 'accepted' | 'picked_up' | 'delivered';
  timestamp: Date;
  location?: string;
  note?: string;
}

interface OrderTrackerProps {
  currentStatus: OrderStatus['status'];
  updates: OrderStatus[];
  className?: string;
}

const OrderTracker: React.FC<OrderTrackerProps> = ({
  currentStatus,
  updates,
  className = '',
}) => {
  const statusSteps = [
    {
      key: 'pending',
      label: 'Order Placed',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      key: 'accepted',
      label: 'Order Accepted',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      key: 'picked_up',
      label: 'Order Picked Up',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      key: 'delivered',
      label: 'Order Delivered',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
  ];

  const getStatusIndex = (status: OrderStatus['status']) => {
    return statusSteps.findIndex((step) => step.key === status);
  };

  const currentStatusIndex = getStatusIndex(currentStatus);

  return (
    <div className={`bg-background-card rounded-2xl p-6 ${className}`}>
      <h2 className="text-xl font-display font-bold mb-8">Order Status</h2>

      <div className="relative">
        {/* Progress Line */}
        <div className="absolute left-6 top-0 bottom-0 w-px bg-background-dark">
          <div
            className="absolute top-0 left-0 w-full bg-primary transition-all duration-500"
            style={{
              height: `${(currentStatusIndex / (statusSteps.length - 1)) * 100}%`,
            }}
          />
        </div>

        {/* Status Steps */}
        <div className="space-y-8">
          {statusSteps.map((step, index) => {
            const isCompleted = index <= currentStatusIndex;
            const isCurrent = index === currentStatusIndex;
            const update = updates.find((u) => u.status === step.key);

            return (
              <div key={step.key} className="relative pl-16">
                {/* Status Icon */}
                <div
                  className={`absolute left-0 w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                    isCompleted
                      ? 'bg-primary text-background-dark'
                      : 'bg-background-dark text-text-secondary'
                  }`}
                >
                  {step.icon}
                </div>

                {/* Status Content */}
                <div>
                  <h3
                    className={`font-medium ${
                      isCompleted ? 'text-text-primary' : 'text-text-secondary'
                    }`}
                  >
                    {step.label}
                  </h3>
                  {update && (
                    <div className="mt-1 space-y-1">
                      <p className="text-sm text-text-secondary">
                        {update.timestamp.toLocaleTimeString()}
                      </p>
                      {update.location && (
                        <p className="text-sm text-text-secondary">
                          📍 {update.location}
                        </p>
                      )}
                      {update.note && (
                        <p className="text-sm text-text-secondary">{update.note}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Current Status Indicator */}
                {isCurrent && (
                  <div className="absolute left-5 top-5 w-2 h-2 rounded-full bg-primary animate-ping" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OrderTracker; 