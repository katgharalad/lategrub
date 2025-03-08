import React, { useRef, useState } from 'react';
import { uploadProfilePhoto } from '../lib/firebase';

interface ProfilePhotoProps {
  photoURL?: string;
  name: string;
  userId: string;
  onPhotoUpdated: (url: string) => void;
}

const ProfilePhoto: React.FC<ProfilePhotoProps> = ({ photoURL, name, userId, onPhotoUpdated }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;

    const file = e.target.files[0];
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file.');
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const newPhotoURL = await uploadProfilePhoto(file, userId);
      onPhotoUpdated(newPhotoURL);
    } catch (err) {
      setError('Failed to upload photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div 
        className="relative w-32 h-32 mb-4 rounded-full overflow-hidden cursor-pointer group"
        onClick={handlePhotoClick}
      >
        {photoURL ? (
          <img 
            src={photoURL} 
            alt="Profile" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <span className="text-4xl text-gray-400">
              {name ? name[0].toUpperCase() : '?'}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-white text-sm">Change Photo</span>
        </div>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handlePhotoChange}
        accept="image/*"
        className="hidden"
      />
      {uploading && (
        <div className="text-sm text-primary">Uploading photo...</div>
      )}
      {error && (
        <div className="text-sm text-red-500">{error}</div>
      )}
    </div>
  );
};

export default ProfilePhoto; 