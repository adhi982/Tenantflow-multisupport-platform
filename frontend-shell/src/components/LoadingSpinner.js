import React from 'react';

const LoadingSpinner = ({ size = 'medium', message = 'Loading...' }) => {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-10 h-10',
    large: 'w-16 h-16'
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className={`loading-spinner ${sizeClasses[size]} mb-4`}></div>
      <p className="text-gray-600 text-sm">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
