import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import ErrorMessage from '../components/ErrorMessage';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const userType = location.state?.type || 'customer';
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, userRole, user } = useAuth();

  // Effect to handle navigation when user role is set
  useEffect(() => {
    console.log('Navigation effect triggered:', { user, userRole });
    if (user && userRole) {
      console.log('User and role available, navigating...');
      if (userRole === 'customer') {
        console.log('Navigating to customer dashboard');
        navigate('/customer');
      } else if (userRole === 'delivery') {
        console.log('Navigating to delivery dashboard');
        navigate('/delivery');
      } else {
        console.log('Invalid role, navigating to landing page');
        navigate('/');
      }
    } else {
      console.log('User or role not available:', { user, userRole });
    }
  }, [user, userRole, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      console.log('Starting login process...');
      await login(email, password);
      console.log('Login completed successfully');
    } catch (err: any) {
      console.error('Login error:', err);
      let errorMessage = 'Invalid email or password. Please try again.';
      
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email. Please sign up first.';
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email format. Please enter a valid email.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      }
      
      setError(errorMessage);
    }
  };

  return (
    <PageLayout>
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-background-card rounded-2xl p-8 shadow-float">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-display font-bold gradient-text mb-2">
                Welcome Back
              </h1>
              <p className="text-text-secondary">
                {userType === 'customer' ? 'Order your favorite food' : 'Start delivering orders'}
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-2">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-background-dark rounded-xl px-4 py-3 text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-background-dark rounded-xl px-4 py-3 text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter your password"
                  minLength={6}
                />
              </div>

              {error && <ErrorMessage message={error} />}

              <button
                type="submit"
                className="w-full bg-gradient-accent text-white py-3 px-6 rounded-xl font-medium shadow-glow hover:scale-105 transition-all"
              >
                Sign In
              </button>

              <div className="text-center">
                <p className="text-text-secondary">
                  Don't have an account?{' '}
                  <button
                    onClick={() => navigate('/signup', { state: { type: userType } })}
                    className="text-primary hover:text-primary-light font-medium"
                  >
                    Sign up
                  </button>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}