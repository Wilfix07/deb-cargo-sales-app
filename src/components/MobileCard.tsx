import React, { ReactNode } from 'react';

interface MobileCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  padding?: 'none' | 'small' | 'medium' | 'large';
  elevation?: 1 | 2 | 3 | 4;
}

export const MobileCard: React.FC<MobileCardProps> = ({
  children,
  className = '',
  onClick,
  padding = 'medium',
  elevation = 2
}) => {
  const paddingClasses = {
    none: '',
    small: 'p-2',
    medium: 'p-4',
    large: 'p-6'
  };

  const elevationClasses = {
    1: 'elevation-1',
    2: 'elevation-2',
    3: 'elevation-3',
    4: 'elevation-4'
  };

  return (
    <div
      className={`mobile-card ${paddingClasses[padding]} ${elevationClasses[elevation]} ${className} ${
        onClick ? 'cursor-pointer' : ''
      }`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};