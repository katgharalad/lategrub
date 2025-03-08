import React from 'react';

interface ErrorMessageProps {
  message: string;
}

export default function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4">
      <p className="text-red-400">{message}</p>
    </div>
  );
}