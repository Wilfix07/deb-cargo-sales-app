import React, { useState, useRef } from 'react';
import { Trash2, Edit, ChevronLeft, ChevronRight } from 'lucide-react';

interface SwipeableCardProps {
  children: React.ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
  className?: string;
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false,
  className = ''
}) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;
    
    // Limit swipe distance
    const maxSwipe = 120;
    const newOffset = Math.max(-maxSwipe, Math.min(maxSwipe, diff));
    setSwipeOffset(newOffset);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    
    // Snap to position based on swipe distance
    if (Math.abs(swipeOffset) > 60) {
      if (swipeOffset > 0 && canEdit) {
        setSwipeOffset(80); // Show edit action
      } else if (swipeOffset < 0 && canDelete) {
        setSwipeOffset(-80); // Show delete action
      } else {
        setSwipeOffset(0);
      }
    } else {
      setSwipeOffset(0);
    }
  };

  const handleAction = (action: 'edit' | 'delete') => {
    setSwipeOffset(0);
    if (action === 'edit' && onEdit) {
      onEdit();
    } else if (action === 'delete' && onDelete) {
      onDelete();
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Background Actions */}
      {canEdit && (
        <div
          className={`absolute left-0 top-0 bottom-0 w-20 bg-blue-500 flex items-center justify-center transition-opacity ${
            swipeOffset > 0 ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <button
            onClick={() => handleAction('edit')}
            className="text-white p-2"
          >
            <Edit className="w-6 h-6" />
          </button>
        </div>
      )}
      
      {canDelete && (
        <div
          className={`absolute right-0 top-0 bottom-0 w-20 bg-red-500 flex items-center justify-center transition-opacity ${
            swipeOffset < 0 ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <button
            onClick={() => handleAction('delete')}
            className="text-white p-2"
          >
            <Trash2 className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Main Card */}
      <div
        ref={cardRef}
        className={`mobile-card ${className} transition-transform ${
          isDragging ? '' : 'duration-300 ease-out'
        }`}
        style={{
          transform: `translateX(${swipeOffset}px)`
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
        
        {/* Swipe Indicators */}
        {(canEdit || canDelete) && swipeOffset === 0 && (
          <>
            {canEdit && (
              <div className="swipe-indicator left">
                <ChevronRight className="w-4 h-4" />
              </div>
            )}
            {canDelete && (
              <div className="swipe-indicator right">
                <ChevronLeft className="w-4 h-4" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};