import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PageLayout from '../components/PageLayout';
import ErrorMessage from '../components/ErrorMessage';
import { updatePassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const SetupPassword: React.FC = () => {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If no user is logged in, redirect to signup
    if (!user) {
      navigate('/signup');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      if (!user) {
        throw new Error('No user found');
      }
      
      await updatePassword(user, password);
      
      // Get the user's role from Firestore to ensure we have the latest role
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        throw new Error('User document not found');
      }
      
      const userData = userDoc.data();
      const userRole = userData.role;

      // Redirect based on role
      if (userRole === 'customer') {
        navigate('/customer');
      } else if (userRole === 'delivery') {
        navigate('/delivery');
      } else {
        // Fallback to home if role is not recognized
        navigate('/');
      }
    } catch (err: any) {
      console.error('Error setting up password:', err);
      if (err.code === 'auth/requires-recent-login') {
        setError('For security reasons, please sign out and sign in again to change your password.');
      } else {
        setError(err.message || 'Failed to set up password');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout>
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-background-card rounded-2xl p-8 shadow-float">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-display font-bold gradient-text mb-2">
                Set Up Password
              </h1>
              <p className="text-text-secondary">
                Please set up a password for your account
              </p>
            </div>

            {error && <ErrorMessage message={error} />}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-background-dark rounded-xl px-4 py-3 text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter your password"
                  required
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-secondary mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-background-dark rounded-xl px-4 py-3 text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Confirm your password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || !password || !confirmPassword}
                className="w-full bg-gradient-accent text-white py-3 px-6 rounded-xl font-medium shadow-glow hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? 'Setting up...' : 'Set Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default SetupPassword; 