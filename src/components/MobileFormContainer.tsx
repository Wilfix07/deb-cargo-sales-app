import React, { useRef, useEffect, useState } from 'react';
import { MobileGestures } from './MobileGestures';

interface MobileFormContainerProps {
  children: React.ReactNode;
  onClose?: () => void;
  onSave?: () => void;
  title?: string;
  className?: string;
  enableSwipeNavigation?: boolean;
  scrollToTopOnMount?: boolean;
  maintainScrollPosition?: boolean;
}

export const MobileFormContainer: React.FC<MobileFormContainerProps> = ({
  children,
  onClose,
  onSave,
  title,
  className = '',
  enableSwipeNavigation = true,
  scrollToTopOnMount = true,
  maintainScrollPosition = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeout = useRef<NodeJS.Timeout>();

  // Smooth scrolling utilities
  const smoothScrollTo = (position: number, duration: number = 300) => {
    if (!contentRef.current) return;

    const container = contentRef.current;
    const startPosition = container.scrollTop;
    const distance = position - startPosition;
    const startTime = performance.now();

    const scrollStep = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (cubic bezier)
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      
      container.scrollTop = startPosition + (distance * easeOutCubic);
      
      if (progress < 1) {
        requestAnimationFrame(scrollStep);
      }
    };

    requestAnimationFrame(scrollStep);
  };

  // Scroll to top
  const scrollToTop = () => {
    smoothScrollTo(0);
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    if (!contentRef.current) return;
    const maxScroll = contentRef.current.scrollHeight - contentRef.current.clientHeight;
    smoothScrollTo(maxScroll);
  };

  // Scroll by relative amount
  const scrollBy = (amount: number) => {
    if (!contentRef.current) return;
    const currentScroll = contentRef.current.scrollTop;
    const newPosition = Math.max(0, Math.min(
      currentScroll + amount,
      contentRef.current.scrollHeight - contentRef.current.clientHeight
    ));
    smoothScrollTo(newPosition);
  };

  // Handle scroll events
  const handleScroll = () => {
    if (!contentRef.current) return;
    
    setScrollPosition(contentRef.current.scrollTop);
    setIsScrolling(true);
    
    // Clear existing timeout
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }
    
    // Set timeout to detect when scrolling stops
    scrollTimeout.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  };

  // Handle swipe gestures for navigation
  const handleSwipeUp = () => {
    if (enableSwipeNavigation) {
      scrollBy(-150); // Scroll up by 150px
    }
  };

  const handleSwipeDown = () => {
    if (enableSwipeNavigation) {
      scrollBy(150); // Scroll down by 150px
    }
  };

  const handleSwipeLeft = () => {
    if (enableSwipeNavigation && onSave) {
      onSave();
    }
  };

  const handleSwipeRight = () => {
    if (enableSwipeNavigation && onClose) {
      onClose();
    }
  };

  // Focus management for inputs
  const handleInputFocus = (event: FocusEvent) => {
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
      // Small delay to ensure keyboard is shown on mobile
      setTimeout(() => {
        if (contentRef.current && target.offsetParent) {
          const container = contentRef.current;
          const targetRect = target.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          
          // Calculate if element is out of view
          const targetTop = targetRect.top - containerRect.top;
          const targetBottom = targetRect.bottom - containerRect.top;
          const containerHeight = container.clientHeight;
          
          // Add some padding for better UX
          const padding = 80;
          
          if (targetTop < padding) {
            // Element is above visible area
            const scrollTarget = container.scrollTop + targetTop - padding;
            smoothScrollTo(Math.max(0, scrollTarget));
          } else if (targetBottom > containerHeight - padding) {
            // Element is below visible area
            const scrollTarget = container.scrollTop + (targetBottom - containerHeight + padding);
            smoothScrollTo(scrollTarget);
          }
        }
      }, 100);
    }
  };

  // Setup focus management
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('focusin', handleInputFocus);
      return () => {
        container.removeEventListener('focusin', handleInputFocus);
      };
    }
  }, []);

  // Scroll to top on mount if enabled
  useEffect(() => {
    if (scrollToTopOnMount && contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [scrollToTopOnMount]);

  // Save/restore scroll position
  useEffect(() => {
    if (maintainScrollPosition && contentRef.current) {
      const savedPosition = sessionStorage.getItem(`form-scroll-${title || 'default'}`);
      if (savedPosition) {
        contentRef.current.scrollTop = parseInt(savedPosition, 10);
      }
    }

    return () => {
      if (maintainScrollPosition && contentRef.current) {
        sessionStorage.setItem(
          `form-scroll-${title || 'default'}`,
          contentRef.current.scrollTop.toString()
        );
      }
    };
  }, [maintainScrollPosition, title]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onClose) {
        event.preventDefault();
        onClose();
      } else if ((event.ctrlKey || event.metaKey) && event.key === 's' && onSave) {
        event.preventDefault();
        onSave();
      } else if (event.key === 'Home' && contentRef.current) {
        event.preventDefault();
        scrollToTop();
      } else if (event.key === 'End' && contentRef.current) {
        event.preventDefault();
        scrollToBottom();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, onSave]);

  return (
    <div
      ref={containerRef}
      className={`mobile-fullscreen-modal ${className}`}
    >
      {/* Modal backdrop */}
      <div className="mobile-backdrop" onClick={onClose} />
      
      {/* Form container */}
      <div className="mobile-modal-content">
        {/* Header with title and navigation */}
        {title && (
          <div className="mobile-fullscreen-header">
            <div className="flex items-center justify-between px-4 py-3">
              <button
                onClick={onClose}
                className="p-2 -ml-2 text-white hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <h1 className="text-lg font-semibold text-white text-center flex-1">
                {title}
              </h1>
              
              {onSave && (
                <button
                  onClick={onSave}
                  className="p-2 -mr-2 text-white hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors"
                  aria-label="Save"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Scrollable content with gestures */}
        <MobileGestures
          onSwipeUp={handleSwipeUp}
          onSwipeDown={handleSwipeDown}
          onSwipeLeft={handleSwipeLeft}
          onSwipeRight={handleSwipeRight}
          className="flex-1 overflow-hidden"
        >
          <div
            ref={contentRef}
            className="mobile-fullscreen-content scrollbar-hide"
            onScroll={handleScroll}
            style={{
              scrollBehavior: 'smooth',
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain'
            }}
          >
            {children}
            
            {/* Bottom padding for better UX */}
            <div className="h-20" />
          </div>
        </MobileGestures>

        {/* Scroll indicators */}
        {scrollPosition > 100 && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-24 right-4 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center z-50 transition-all duration-200 hover:bg-blue-700 active:scale-95"
            aria-label="Scroll to top"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 14l5-5 5 5" />
            </svg>
          </button>
        )}

        {/* Swipe hint indicators */}
        {enableSwipeNavigation && (
          <>
            <div className="swipe-indicator left opacity-20 pointer-events-none">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <div className="swipe-indicator right opacity-20 pointer-events-none">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </div>
          </>
        )}

        {/* Scrolling indicator */}
        {isScrolling && (
          <div className="fixed top-20 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm z-50">
            Scrolling...
          </div>
        )}
      </div>
    </div>
  );
};

// Hook for form scrolling utilities
export const useFormScrolling = (containerRef: React.RefObject<HTMLDivElement>) => {
  const smoothScrollTo = (position: number, duration: number = 300) => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const startPosition = container.scrollTop;
    const distance = position - startPosition;
    const startTime = performance.now();

    const scrollStep = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      
      container.scrollTop = startPosition + (distance * easeOutCubic);
      
      if (progress < 1) {
        requestAnimationFrame(scrollStep);
      }
    };

    requestAnimationFrame(scrollStep);
  };

  const scrollToElement = (element: HTMLElement, offset: number = 80) => {
    if (!containerRef.current || !element.offsetParent) return;
    
    const container = containerRef.current;
    const elementRect = element.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    const targetTop = elementRect.top - containerRect.top + container.scrollTop - offset;
    smoothScrollTo(Math.max(0, targetTop));
  };

  const scrollToTop = () => smoothScrollTo(0);
  const scrollToBottom = () => {
    if (!containerRef.current) return;
    const maxScroll = containerRef.current.scrollHeight - containerRef.current.clientHeight;
    smoothScrollTo(maxScroll);
  };

  return {
    smoothScrollTo,
    scrollToElement,
    scrollToTop,
    scrollToBottom
  };
};
