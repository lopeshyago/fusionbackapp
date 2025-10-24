import React from 'react';

export default function LoadingSpinner({ size = 'md', text = 'Carregando...' }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-orange-200 border-t-orange-500`}></div>
      {text && <p className="mt-4 text-gray-600 text-center">{text}</p>}
    </div>
  );
}