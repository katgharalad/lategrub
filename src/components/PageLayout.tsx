import React from 'react';
import { useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';

interface PageLayoutProps {
  children: React.ReactNode;
  showNav?: boolean;
  className?: string;
}

const PageLayout: React.FC<PageLayoutProps> = ({ 
  children, 
  showNav = true,
  className = ''
}) => {
  const location = useLocation();
  const isAuthPage = ['/login', '/signup'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-background-DEFAULT text-text-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`pb-20 ${className}`}>
          {/* Header */}
          {!isAuthPage && (
            <header className="py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="font-display text-2xl font-bold bg-gradient-to-r from-primary-light to-primary bg-clip-text text-transparent">
                    LateGrub
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-background-card flex items-center justify-center">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                </div>
              </div>
            </header>
          )}

          {/* Main Content */}
          <main className={`${isAuthPage ? 'pt-0' : 'pt-6'}`}>
            {children}
          </main>
        </div>

        {/* Bottom Navigation */}
        {showNav && !isAuthPage && <BottomNav />}
      </div>
    </div>
  );
};

export default PageLayout;