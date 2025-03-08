import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import ErrorMessage from '../components/ErrorMessage';
import { useAuth } from '../context/AuthContext';
import { signInWithEmailLink } from 'firebase/auth';
import { auth } from '../lib/firebase';

const CompleteSignup: React.FC = () => {
  const navigate = useNavigate();
  const { completeSignup, isEmailLink } = useAuth();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    const verifyEmailLink = async () => {
      console.log('Checking email verification link...');
      const currentUrl = window.location.href;

      // Confirm the link is a sign-in with email link
      if (!isEmailLink(currentUrl)) {
        console.error('Not a valid email link');
        navigate('/signup');
        return;
      }

      // Get the email if available. This should be available if the user completes
      // the flow on the same device where they started it.
      let emailForSignIn = window.localStorage.getItem('emailForSignIn');
      const signupData = localStorage.getItem('signupData');

      console.log('Current URL:', currentUrl);
      console.log('Is email link:', isEmailLink(currentUrl));
      console.log('Email for sign in:', emailForSignIn);
      console.log('Signup data exists:', !!signupData);

      if (!emailForSignIn) {
        // User opened the link on a different device. To prevent session fixation
        // attacks, ask the user to provide the associated email again.
        emailForSignIn = window.prompt('Please provide your email for confirmation');
        if (!emailForSignIn) {
          setError('Email is required to complete signup');
          setTimeout(() => navigate('/signup'), 3000);
          return;
        }
      }

      try {
        console.log('Attempting to verify email link...');
        // The client SDK will parse the code from the link for you.
        await signInWithEmailLink(auth, emailForSignIn, currentUrl);
        console.log('Email verified successfully');
        setVerifying(false);
      } catch (error) {
        console.error('Error verifying email:', error);
        setError('Failed to verify email link. Please try signing up again.');
        setTimeout(() => navigate('/signup'), 3000);
      }
    };

    verifyEmailLink();
  }, [isEmailLink, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      const signupDataStr = localStorage.getItem('signupData');
      const emailForSignIn = localStorage.getItem('emailForSignIn');
      
      if (!signupDataStr || !emailForSignIn) {
        throw new Error('Signup data not found. Please start the signup process again.');
      }

      const signupData = JSON.parse(signupDataStr);
      
      await completeSignup(
        emailForSignIn,
        formData.password,
        signupData.name,
        signupData.role
      );

      localStorage.removeItem('signupData');
      localStorage.removeItem('emailForSignIn');

      navigate('/login', { state: { type: signupData.role } });
    } catch (err: any) {
      console.error('Complete signup error:', err);
      setError(err.message || 'Failed to complete signup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <PageLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-text-primary">Verifying your email...</p>
            {error && <ErrorMessage message={error} />}
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-background-card rounded-2xl p-8 shadow-float">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-display font-bold gradient-text mb-2">
                Complete Your Signup
              </h1>
              <p className="text-text-secondary">
                Create a password to finish setting up your account
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
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-background-dark rounded-xl px-4 py-3 text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter your password"
                  minLength={6}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-secondary mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full bg-background-dark rounded-xl px-4 py-3 text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Confirm your password"
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-accent text-white py-3 px-6 rounded-xl font-medium shadow-glow hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? 'Creating Account...' : 'Complete Signup'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default CompleteSignup; 