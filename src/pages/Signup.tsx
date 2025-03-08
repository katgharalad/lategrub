import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import ErrorMessage from '../components/ErrorMessage';
import { useAuth } from '../context/AuthContext';

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userType = location.state?.type || 'customer';
  const { signup, signInWithGoogle, needsPasswordSetup } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: userType
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await signup(formData.email, formData.name, formData.role);
      setSuccess('Verification email sent! Please check your inbox and click the link to complete your signup.');
    } catch (err: any) {
      setError(err.message || 'Failed to start signup process. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      console.log('Initiating Google sign-in...');
      await signInWithGoogle(userType);
      console.log('Google sign-in successful, checking if password setup needed...');
      
      // Check if password setup is needed
      if (needsPasswordSetup) {
        navigate('/setup-password');
      } else {
        // Redirect based on role
        navigate(userType === 'customer' ? '/customer' : '/delivery');
      }
    } catch (err: any) {
      console.error('Google sign-in error in Signup:', err);
      if (err.message === 'Google sign-in is not enabled. Please contact support.') {
        setError('Google sign-in is temporarily unavailable. Please try signing up with email instead.');
      } else {
        setError(err.message || 'Failed to sign in with Google');
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
                Create Account
              </h1>
              <p className="text-text-secondary">
                {userType === 'customer' ? 'Start ordering food' : 'Become a delivery partner'}
              </p>
            </div>

            {error && <ErrorMessage message={error} />}
            
            {success && (
              <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                <p className="text-green-400">{success}</p>
              </div>
            )}

            <div className="space-y-6">
              {/* Google Sign In Button */}
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full bg-white text-gray-800 py-3 px-6 rounded-xl font-medium border border-gray-300 hover:bg-gray-50 transition-all flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span>{loading ? 'Signing in...' : 'Continue with Google'}</span>
              </button>

              <div className="flex items-center">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="px-4 text-sm text-gray-500">or</span>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>

              {/* Existing Email Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-2">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-background-dark rounded-xl px-4 py-3 text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Enter your @owu.edu email"
                  />
                </div>

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-2">
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-background-dark rounded-xl px-4 py-3 text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Enter your full name"
                  />
                </div>

                <input type="hidden" name="role" value={userType} />

                <button
                  type="submit"
                  disabled={loading || !formData.email || !formData.name}
                  className="w-full bg-gradient-accent text-white py-3 px-6 rounded-xl font-medium shadow-glow hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {loading ? 'Sending Verification...' : 'Continue with Email'}
                </button>
              </form>
            </div>

            <p className="mt-4 text-center text-sm text-text-secondary">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/login', { state: { type: userType } })}
                className="font-medium text-primary hover:text-primary-dark"
              >
                Log in
              </button>
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Signup; 