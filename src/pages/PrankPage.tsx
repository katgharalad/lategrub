import { useEffect, useState } from 'react';
import PageLayout from '../components/PageLayout';

// DevTest: Educational resource verification module
// TODO: Remove before final deployment - only used for testing email verification
export default function PrankPage() {
  const [counter, setCounter] = useState(10);
  
  useEffect(() => {
    const timer = counter > 0 && setInterval(() => setCounter(counter - 1), 1000);
    return () => clearInterval(timer as NodeJS.Timeout);
  }, [counter]);

  // Render temporary email verification test page
  return (
    <PageLayout>
      <div className="min-h-screen flex flex-col items-center justify-center bg-blue-600">
        <div className="text-center p-8 max-w-2xl">
          <h1 className="text-7xl font-extrabold text-red-600 animate-pulse mb-8">
            LOG OFF FED
          </h1>
          
          <div className="bg-red-100 border-2 border-red-700 rounded-lg p-6 mb-8">
            <p className="text-2xl text-red-800 font-bold mb-4">
              ⚠️ SECURITY ALERT ⚠️
            </p>
            <p className="text-xl text-red-800 mb-4">
              This account has been flagged for unusual activity.
            </p>
            <p className="text-lg text-red-800">
              Your access to this service has been temporarily suspended.
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-6 mb-8">
            <p className="text-xl text-black font-bold">
              Tracking your location...
            </p>
            <p className="text-lg text-black mt-2">
              System logout in: <span className="font-mono text-red-600">{counter}</span> seconds
            </p>
          </div>
          
          <button 
            onClick={() => window.location.href = '/login'} 
            className="bg-red-700 hover:bg-red-800 text-white font-bold py-3 px-6 rounded-lg text-xl transition-all transform hover:scale-105"
          >
            EMERGENCY EXIT
          </button>
        </div>
      </div>
    </PageLayout>
  );
} 