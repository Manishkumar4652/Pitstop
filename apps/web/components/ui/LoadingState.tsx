import React from 'react';

export interface LoadingStateProps extends React.HTMLAttributes<HTMLDivElement> {
  text?: string;
  fullPage?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  text = 'Loading PitStop data...',
  fullPage = false,
  className = '',
  ...props
}) => {
  const containerStyles = fullPage
    ? 'fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm'
    : 'flex flex-col items-center justify-center p-8 sm:p-12 w-full';

  return (
    <div className={`${containerStyles} ${className}`} {...props}>
      <div className="flex flex-col items-center gap-3">
        <div className="relative flex h-12 w-12 items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-pitstop-yellow/30"></div>
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-pitstop-yellow border-t-transparent"></div>
          <span className="text-xs font-bold text-pitstop-charcoal">🛵</span>
        </div>
        {text && <p className="text-xs font-medium text-pitstop-muted animate-pulse">{text}</p>}
      </div>
    </div>
  );
};
