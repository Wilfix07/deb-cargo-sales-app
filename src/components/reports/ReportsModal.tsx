import React, { useState } from 'react';
import { X, Maximize2, Minimize2, Download, Filter, Calendar, BarChart3 } from 'lucide-react';
import { Logo } from '../Logo';
import { ComprehensiveReports } from './ComprehensiveReports';

interface ReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReportsModal: React.FC<ReportsModalProps> = ({ isOpen, onClose }) => {
  const [isMaximized, setIsMaximized] = useState(false);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex flex-col">
      <div className="flex-1 bg-white overflow-hidden">
        {/* Modal Header */}
        <div className="mobile-header safe-area-top">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="tap-target rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
              <div className="flex items-center space-x-2">
                <Logo size="small" />
                <div>
                  <h1 className="text-lg font-bold text-white">Rapò Konplè</h1>
                  <p className="text-xs text-blue-100">Analiz detaye</p>
                </div>
              </div>
            </div>
            
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-4 safe-area-bottom">
          <ComprehensiveReports onNavigate={() => {}} />
        </div>
      </div>
    </div>
  );
};