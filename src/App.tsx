import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import CompleteSignup from './pages/CompleteSignup';
import SetupPassword from './pages/SetupPassword';

// Lazy load pages
const LandingPage = React.lazy(() => import('./pages/LandingPage'));
const Login = React.lazy(() => import('./pages/Login'));
const Signup = React.lazy(() => import('./pages/Signup'));
const CustomerDashboard = React.lazy(() => import('./pages/CustomerDashboard'));
const DeliveryDashboard = React.lazy(() => import('./pages/DeliveryDashboard'));
const PlaceOrder = React.lazy(() => import('./pages/PlaceOrder'));
const TrackOrder = React.lazy(() => import('./pages/TrackOrder'));
const Chat = React.lazy(() => import('./pages/Chat'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Orders = React.lazy(() => import('./pages/Orders'));
const PastOrders = React.lazy(() => import('./pages/PastOrders'));
const ActiveOrders = React.lazy(() => import('./pages/ActiveOrders'));
const DeliveryHistory = React.lazy(() => import('./pages/DeliveryHistory'));

// Loading component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Auth routes - these should come first */}
          <Route path="/complete-signup" element={<CompleteSignup />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/setup-password" element={
            <ProtectedRoute>
              <SetupPassword />
            </ProtectedRoute>
          } />

          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />

          {/* Customer routes */}
          <Route
            path="/customer"
            element={
              <ProtectedRoute requiredRole="customer">
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/place-order"
            element={
              <ProtectedRoute requiredRole="customer">
                <PlaceOrder />
              </ProtectedRoute>
            }
          />
          <Route
            path="/active-orders"
            element={
              <ProtectedRoute requiredRole="customer">
                <ActiveOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/track-order/:orderId"
            element={
              <ProtectedRoute>
                <TrackOrder />
              </ProtectedRoute>
            }
          />
          <Route
            path="/past-orders"
            element={
              <ProtectedRoute requiredRole="customer">
                <PastOrders />
              </ProtectedRoute>
            }
          />

          {/* Delivery routes */}
          <Route
            path="/delivery"
            element={
              <ProtectedRoute requiredRole="delivery">
                <DeliveryDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/delivery-history"
            element={
              <ProtectedRoute requiredRole="delivery">
                <DeliveryHistory />
              </ProtectedRoute>
            }
          />

          {/* Shared protected routes */}
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat/:orderId?"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Fallback route should be last */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
};

export default App;