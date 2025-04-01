import React from 'react';
import { useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';

interface PageLayoutProps {
  children: React.ReactNode;
  showNav?: boolean;
  className?: string;
  title?: string;
}

const PageLayout: React.FC<PageLayoutProps> = ({ 
  children, 
  showNav = true,
  className = '',
  title
}) => {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  return (
    <div className="min-h-screen bg-background-DEFAULT text-text-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`pb-20 ${className}`}>
          {/* Header */}
          <header className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {title ? (
                  <h1 className="font-display text-2xl font-bold bg-gradient-to-r from-primary-light to-primary bg-clip-text text-transparent">
                    {title}
                  </h1>
                ) : (
                  <span className="font-display text-2xl font-bold bg-gradient-to-r from-primary-light to-primary bg-clip-text text-transparent">
                    LateGrub
                  </span>
                )}
              </div>
              {!isLandingPage && (
                <img 
                  src="/owu.png" 
                  alt="OWU Logo" 
                  className="h-14 w-19"
                />
              )}
            </div>
          </header>

          {/* Main Content */}
          <main className="pt-6">
            {children}
          </main>
        </div>

        {/* Bottom Navigation */}
        {showNav && <BottomNav />}
      </div>
    </div>
  );
};

export default PageLayout;