import React from 'react';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 'medium', className = '' }) => {
  const sizeClasses: Record<'small'|'medium'|'large', string> = {
    small: 'w-12 h-12',           /* +50% from 8x8 */
    medium: 'w-16 h-16',          /* +33% from 12x12 as an in-between */
    large: 'w-24 h-24'            /* +20% from 20x20 for better scaling */
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <img 
        src="/images/logo.jpg" 
        alt="DEB CARGO SHIPPING LLC Logo" 
        className={`${sizeClasses[size]} object-contain`}
      />
    </div>
  );
};