import React, { useRef, useState } from 'react';
import { uploadProfilePhoto } from '../lib/firebase';

interface ProfilePhotoProps {
  name: string;
  userId: string;
  photoURL?: string;
  onPhotoUpdated: (photoURL: string) => Promise<void>;
}

const ProfilePhoto: React.FC<ProfilePhotoProps> = ({
  name,
  userId,
  photoURL,
  onPhotoUpdated
}) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const newPhotoURL = await uploadProfilePhoto(file, userId);
      await onPhotoUpdated(newPhotoURL);
    } catch (error) {
      console.error('Error uploading photo:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative w-24 h-24 mx-auto mb-4">
      <button
        onClick={handlePhotoClick}
        className="w-full h-full rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary"
        disabled={uploading}
      >
        {photoURL ? (
          <img
            src={photoURL}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-background-dark flex items-center justify-center">
            <span className="text-2xl font-medium text-text-secondary">
              {name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </button>

      {uploading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

export default ProfilePhoto; 