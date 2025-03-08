import React from 'react';

interface AvailableItem {
  id: string;
  name: string;
  description: string;
  available: boolean;
  notes?: string;
  lastUpdated: Date;
}

const AvailableItems: React.FC = () => {
  // TODO: Fetch from Firebase
  const items: AvailableItem[] = [
    {
      id: '1',
      name: 'Chocolate Chip Cookies',
      description: 'Fresh baked cookies from the dining hall',
      available: true,
      notes: 'Limited quantity available',
      lastUpdated: new Date(),
    },
    {
      id: '2',
      name: 'Thick Cut Fries',
      description: 'Extra thick cut fries with sea salt',
      available: true,
      notes: 'Very thick cut today',
      lastUpdated: new Date(),
    },
  ];

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
    }).format(date);
  };

  return (
    <div className="bg-background-card rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold">Live Updates from Today's Menu Before You Order</h2>
        <div className="flex items-center space-x-2">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-sm text-text-secondary">Live Updates</span>
        </div>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className={`bg-background-dark rounded-xl p-4 ${
              item.available ? 'hover:bg-background-dark/70' : 'opacity-50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium">{item.name}</h3>
                <p className="text-sm text-text-secondary">{item.description}</p>
                {item.notes && (
                  <p className="text-sm text-primary mt-1">{item.notes}</p>
                )}
              </div>
              <p className="text-xs text-text-secondary">
                Updated {formatTime(item.lastUpdated)}
              </p>
            </div>
            <div className="mt-2 flex items-center space-x-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  item.available ? 'bg-primary' : 'bg-red-500'
                }`}
              />
              <span className="text-xs text-text-secondary">
                {item.available ? 'Available' : 'Not Available'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AvailableItems; 