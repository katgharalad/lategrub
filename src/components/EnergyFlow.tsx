import React from 'react';

interface FlowData {
  input: {
    total: number;
    sources: {
      name: string;
      value: number;
      active: boolean;
    }[];
  };
  output: {
    total: number;
    destinations: {
      name: string;
      value: number;
      active: boolean;
    }[];
  };
}

interface EnergyFlowProps {
  data: FlowData;
  title?: string;
  className?: string;
}

const EnergyFlow: React.FC<EnergyFlowProps> = ({ data, title = 'ORDER FLOW', className = '' }) => {
  const maxValue = Math.max(data.input.total, data.output.total);
  
  const getWidth = (value: number) => {
    return `${(value / maxValue) * 100}%`;
  };

  return (
    <div className={`bg-background-card rounded-2xl p-6 ${className}`}>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-display font-bold tracking-wide">{title}</h2>
        <div className="flex items-center space-x-2">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-sm text-text-secondary">Live</span>
        </div>
      </div>

      <div className="relative">
        {/* Input Flow */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1/3">
          <div className="space-y-4">
            {data.input.sources.map((source, index) => (
              <div
                key={source.name}
                className={`h-12 rounded-l-lg relative overflow-hidden transition-all duration-500 ${
                  source.active ? 'bg-primary/20' : 'bg-background-dark'
                }`}
                style={{ width: getWidth(source.value) }}
              >
                <div
                  className={`absolute inset-0 ${
                    source.active ? 'bg-primary/30' : 'bg-background-dark'
                  }`}
                  style={{
                    width: source.active ? '100%' : '0%',
                    transition: 'width 1s ease-in-out',
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-between px-4">
                  <span className="text-sm font-medium">{source.name}</span>
                  <span className="text-sm font-medium">{source.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center Flow Visualization */}
        <div className="h-64 mx-auto w-1/3 relative">
          <svg
            className="w-full h-full"
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M20,100 C20,50 180,150 180,100 C180,50 20,150 20,100"
              className="stroke-primary"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
          </svg>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary/20 rounded-full p-4">
            <div className="bg-primary rounded-full p-3">
              <svg
                className="w-6 h-6 text-background-dark"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Output Flow */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/3">
          <div className="space-y-4">
            {data.output.destinations.map((dest, index) => (
              <div
                key={dest.name}
                className={`h-12 rounded-r-lg relative overflow-hidden transition-all duration-500 ${
                  dest.active ? 'bg-primary/20' : 'bg-background-dark'
                }`}
                style={{ width: getWidth(dest.value) }}
              >
                <div
                  className={`absolute inset-0 ${
                    dest.active ? 'bg-primary/30' : 'bg-background-dark'
                  }`}
                  style={{
                    width: dest.active ? '100%' : '0%',
                    transition: 'width 1s ease-in-out',
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-between px-4">
                  <span className="text-sm font-medium">{dest.value}</span>
                  <span className="text-sm font-medium">{dest.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnergyFlow; 