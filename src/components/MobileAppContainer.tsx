import React, { ReactNode, useEffect, useState } from 'react';

interface MobileAppContainerProps {
  children: ReactNode;
  className?: string;
}

export const MobileAppContainer: React.FC<MobileAppContainerProps> = ({ 
  children, 
  className = '' 
}) => {
  const [isStandalone, setIsStandalone] = useState(false);
  const [viewportHeight, setViewportHeight] = useState('100vh');

  useEffect(() => {
    // Check if app is running in standalone mode (PWA)
    const checkStandalone = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
                              (window.navigator as any).standalone ||
                              document.referrer.includes('android-app://');
      setIsStandalone(isStandaloneMode);
    };

    // Set proper viewport height for mobile
    const setViewportHeightVar = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
      setViewportHeight(`${window.innerHeight}px`);
    };

    checkStandalone();
    setViewportHeightVar();

    // Listen for viewport changes
    window.addEventListener('resize', setViewportHeightVar);
    window.addEventListener('orientationchange', () => {
      setTimeout(setViewportHeightVar, 100);
    });

    // Prevent zoom on double tap
    let lastTouchEnd = 0;
    const preventZoom = (e: TouchEvent) => {
      const now = new Date().getTime();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    };

    document.addEventListener('touchend', preventZoom, { passive: false });

    // Prevent pull-to-refresh on the whole document
    document.addEventListener('touchstart', (e) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    }, { passive: false });

    return () => {
      window.removeEventListener('resize', setViewportHeightVar);
      window.removeEventListener('orientationchange', setViewportHeightVar);
      document.removeEventListener('touchend', preventZoom);
    };
  }, []);

  return (
    <div 
      className={`mobile-app ${className}`}
      style={{ 
        height: viewportHeight,
        minHeight: viewportHeight
      }}
    >
      {/* Status bar spacer for iOS */}
      {isStandalone && (
        <div className="status-bar-spacer safe-area-top bg-blue-600"></div>
      )}
      
      {/* App content */}
      <div className="mobile-content flex-1 relative">
        {children}
      </div>
      
      {/* Bottom safe area for iOS */}
      {isStandalone && (
        <div className="safe-area-bottom bg-white"></div>
      )}
    </div>
  );
};