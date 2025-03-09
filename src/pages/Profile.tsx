import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import ErrorMessage from '../components/ErrorMessage';
import ProfilePhoto from '../components/ProfilePhoto';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
  photoURL?: string;
}

const Profile: React.FC = () => {
  const { user, logout, sessionRole } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
    phone: '',
    address: '',
    photoURL: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setProfile(userDoc.data() as UserProfile);
        }
      } catch (err) {
        setError('Failed to load profile. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handlePhotoUpdated = async (photoURL: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), { photoURL });
      setProfile(prev => ({ ...prev, photoURL }));
      setSuccess('Profile photo updated successfully!');
    } catch (err) {
      setError('Failed to update profile photo. Please try again.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to update your profile');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const userDocRef = doc(db, 'users', user.uid);
      const profileData = {
        ...profile,
        updatedAt: new Date()
      };

      await updateDoc(userDocRef, profileData);
      setSuccess('Profile updated successfully!');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      setError('Failed to sign out. Please try again.');
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-2xl mx-auto mt-8 p-6">
        <div className="bg-background-card rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <button
                onClick={() => navigate(sessionRole === 'delivery' ? '/delivery' : '/customer')}
                className="mr-4 text-text-secondary hover:text-text-primary transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-2xl font-bold text-text-primary">Profile</h2>
            </div>
            <div className="flex items-center space-x-3">
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Edit Profile
                </button>
              )}
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-sm font-medium text-red-400 bg-red-500/10 rounded-xl hover:bg-red-500/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Sign Out
              </button>
            </div>
          </div>

          {user && (
            <ProfilePhoto
              photoURL={profile.photoURL}
              name={profile.name}
              userId={user.uid}
              onPhotoUpdated={handlePhotoUpdated}
            />
          )}

          {error && <ErrorMessage message={error} />}
          {success && (
            <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
              <p className="text-green-400">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-text-secondary">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={profile.name}
                onChange={handleChange}
                disabled={!isEditing}
                className="mt-1 block w-full rounded-xl bg-background-dark border-0 text-text-primary shadow-sm focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:bg-background-dark/50"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-secondary">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={profile.email}
                onChange={handleChange}
                disabled={!isEditing}
                className="mt-1 block w-full rounded-xl bg-background-dark border-0 text-text-primary shadow-sm focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:bg-background-dark/50"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-text-secondary">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={profile.phone}
                onChange={handleChange}
                disabled={!isEditing}
                className="mt-1 block w-full rounded-xl bg-background-dark border-0 text-text-primary shadow-sm focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:bg-background-dark/50"
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-text-secondary">
                Default Delivery Address
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={profile.address}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="Enter your default delivery address"
                className="mt-1 block w-full rounded-xl bg-background-dark border-0 text-text-primary shadow-sm focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:bg-background-dark/50"
              />
              <p className="mt-1 text-sm text-text-secondary">
                This address will be pre-filled when placing orders, but you can always change it.
              </p>
            </div>

            {isEditing && (
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-sm font-medium text-text-primary bg-background-dark rounded-xl hover:bg-background-dark/70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </PageLayout>
  );
};

export default Profile; 