import React, { useState } from 'react';
import { doc, setDoc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

interface BoomMeterProps {
  onRatingSubmit?: (rating: number) => void;
}

const BoomMeter: React.FC<BoomMeterProps> = ({ onRatingSubmit }) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [hasRated, setHasRated] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const { user } = useAuth();

  const handleRatingClick = async (selectedRating: number) => {
    if (hasRated) return;
    
    setRating(selectedRating);
    setIsAnimating(true);
    
    try {
      // Update the ratings in Firestore
      const ratingsRef = doc(db, 'ratings', 'stats');
      const ratingsDoc = await getDoc(ratingsRef);
      
      if (ratingsDoc.exists()) {
        await updateDoc(ratingsRef, {
          totalRatings: increment(1),
          totalScore: increment(selectedRating),
          [`ratings.${selectedRating}`]: increment(1)
        });
      } else {
        await setDoc(ratingsRef, {
          totalRatings: 1,
          totalScore: selectedRating,
          ratings: {
            1: selectedRating === 1 ? 1 : 0,
            2: selectedRating === 2 ? 1 : 0,
            3: selectedRating === 3 ? 1 : 0,
            4: selectedRating === 4 ? 1 : 0,
            5: selectedRating === 5 ? 1 : 0
          }
        });
      }

      // If user is logged in, save their rating
      if (user) {
        await setDoc(doc(db, 'user_ratings', user.uid), {
          rating: selectedRating,
          timestamp: new Date()
        });
      }

      setHasRated(true);
      if (onRatingSubmit) {
        onRatingSubmit(selectedRating);
      }

      // Reset animation state after a delay
      setTimeout(() => {
        setIsAnimating(false);
      }, 1000);
    } catch (error) {
      console.error('Error saving rating:', error);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <h3 className="text-lg font-medium text-text-primary">Rate Your Experience</h3>
      <div className="flex items-center space-x-2">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            className={`relative transition-transform ${
              isAnimating && rating === value ? 'animate-bounce' : ''
            } ${hasRated && rating < value ? 'opacity-50' : ''}`}
            onMouseEnter={() => !hasRated && setHoveredRating(value)}
            onMouseLeave={() => !hasRated && setHoveredRating(0)}
            onClick={() => handleRatingClick(value)}
            disabled={hasRated}
          >
            <span
              className={`text-2xl transition-opacity ${
                (hoveredRating || rating) >= value
                  ? 'opacity-100'
                  : 'opacity-40'
              }`}
            >
              💪
            </span>
            {isAnimating && rating === value && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-ping" />
            )}
          </button>
        ))}
      </div>
      {hasRated && (
        <div className="text-sm text-text-secondary animate-fade-in">
          {`${rating} BIG BOOMS!`}
        </div>
      )}
    </div>
  );
};

export default BoomMeter; 