'use client';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export default function LoadingSpinner({ 
  size = 'medium',
  className = ''
}: LoadingSpinnerProps) {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12'
  };

  return (
    <div className={`
      flex justify-center items-center min-h-[200px]
      ${className}
    `}>
      <div className={`
        animate-spin rounded-full
        border-2 border-blue-600/20
        border-t-blue-600
        ${sizeClasses[size]}
      `}>
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
}
