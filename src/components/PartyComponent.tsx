import React from 'react';
import { Music } from 'lucide-react';

const PartyComponent: React.FC = () => {
  const handleSongRequest = () => {
    // TODO: Implement song request functionality
    console.log('Song request button clicked');
  };

  return (
    <div className="bg-background-card rounded-xl p-6 shadow-float border border-primary/30">
      <h2 className="text-2xl font-bold mb-4 gradient-text">Party Central 🎉</h2>
      
      <div className="space-y-4">
        {/* Song Request Button */}
        <button
          onClick={handleSongRequest}
          className="w-full flex items-center justify-center gap-2 bg-gradient-accent text-black font-semibold py-3 px-6 rounded-xl shadow-glow hover:scale-105 transition-all"
        >
          <Music className="w-5 h-5" />
          Submit Song Request
        </button>
      </div>
    </div>
  );
};

export default PartyComponent; 