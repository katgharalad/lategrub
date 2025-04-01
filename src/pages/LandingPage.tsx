import { Utensils, AlertTriangle } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import BoomMeter from '../components/BoomMeter';

export default function LandingPage() {
  return (
    <PageLayout showNav={false}>
      {/* Main rotating diamond frame */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[90vh] aspect-square border-[1px] border-primary/30 transform rotate-45 animate-[spin_20s_linear_infinite]" />
      </div>

      <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
        {/* Floating decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 right-[15%] w-20 h-32 bg-gradient-to-b from-primary to-primary-light rounded-lg opacity-30 blur-sm animate-[float_4s_ease-in-out_infinite]" />
          <div className="absolute top-20 left-[20%] w-16 h-24 bg-gradient-to-b from-primary-light to-primary rounded-lg opacity-30 blur-sm animate-[float_5s_ease-in-out_infinite_0.5s]" />
          <div className="absolute bottom-[20%] left-[15%] w-24 h-24 rounded-full bg-gradient-to-br from-primary via-primary-light to-primary opacity-20 blur-sm animate-[float_6s_ease-in-out_infinite_1s]" />
          <div className="absolute top-[30%] right-[25%] w-16 h-16 rounded-full bg-gradient-to-bl from-primary-light via-primary to-primary opacity-20 blur-sm animate-[float_7s_ease-in-out_infinite_1.5s]" />
        </div>

        {/* Main Content */}
        <div className="relative z-10 flex flex-col items-center space-y-8 px-4">
          {/* OWU Logo */}
          <div className="mb-8">
            <img 
              src="/owu.png" 
              alt="OWU Logo" 
              className="h-40 w-auto object-contain"
            />
          </div>
          
          {/* LateGrub Logo */}
          <div className="bg-background-card/50 backdrop-blur-md rounded-xl border border-primary/30 p-8 shadow-float">
            <div className="flex items-center gap-3">
              <Utensils className="w-8 h-8 text-primary" />
              <h1 className="text-4xl font-display font-bold gradient-text">LateGrub</h1>
            </div>
          </div>

          {/* University Policy Violation Message */}
          <div className="bg-red-500/20 border border-red-500 backdrop-blur-md rounded-xl p-6 max-w-md">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-red-500 text-lg mb-2">University Policy Violation</h3>
                <p className="text-text-primary">
                  This service has been determined to violate university policies. Sign-up and login functionality 
                  has been disabled. Please contact university administration for more information.
                </p>
              </div>
            </div>
          </div>

          {/* Rating Section */}
          <div className="mt-8 bg-background-card/50 backdrop-blur-md rounded-xl border border-primary/30 p-6 shadow-float">
            <BoomMeter />
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
            <div className="bg-background-card/50 backdrop-blur-md rounded-xl p-4 border border-primary/30">
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-medium mb-2">Late Night Delivery</h3>
              <p className="text-sm text-text-secondary">Order food anytime, even in the late hours</p>
            </div>

            <div className="bg-background-card/50 backdrop-blur-md rounded-xl p-4 border border-primary/30">
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-medium mb-2">Fast Delivery</h3>
              <p className="text-sm text-text-secondary">Quick and reliable delivery service</p>
            </div>

            <div className="bg-background-card/50 backdrop-blur-md rounded-xl p-4 border border-primary/30">
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-medium mb-2">Flexible Payment</h3>
              <p className="text-sm text-text-secondary">Pay with cash or barter items</p>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}