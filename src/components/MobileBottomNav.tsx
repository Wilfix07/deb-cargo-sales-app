import React from 'react';
import { BarChart3, History, Package, Scan, Plus, Home } from 'lucide-react';

interface MobileBottomNavProps {
  activeView: string;
  onViewChange: (view: string) => void;
  onScanClick: () => void;
  onAddClick: () => void;
  userRole?: string;
  userPermissions?: any;
  className?: string;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeView,
  onViewChange,
  onScanClick,
  onAddClick,
  userRole,
  userPermissions,
  className = ''
}) => {
  const navItems = [
    {
      id: 'dashboard',
      icon: Home,
      label: userRole === 'Teller' ? 'Dashboard' : 'Dashboard',
      show: true
    },
    {
      id: 'history',
      icon: History,
      label: userRole === 'Teller' ? 'Istwa' : 'History',
      show: true
    },
    {
      id: 'scan',
      icon: Scan,
      label: userRole === 'Teller' ? 'Scan' : 'Scan',
      show: userRole !== 'Manager',
      action: 'scan'
    },
    {
      id: 'add',
      icon: Plus,
      label: userRole === 'Teller' ? 'Ajoute' : 'Add',
      show: userRole !== 'Manager',
      action: 'add'
    },
    {
      id: 'inventory',
      icon: Package,
      label: userRole === 'Teller' ? 'Stock' : 'Inventory',
      show: userPermissions?.canViewProducts
    }
  ].filter(item => item.show);

  const handleItemClick = (item: any) => {
    if (item.action === 'scan') {
      onScanClick();
    } else if (item.action === 'add') {
      onAddClick();
    } else {
      onViewChange(item.id);
    }
    
    // Haptic feedback simulation
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  return (
    <div className={`bottom-nav ${className}`}>
      <div className="flex items-center justify-around h-16 px-2 relative">
        {/* Enhanced background with subtle gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white to-gray-50 border-t border-gray-200"></div>
        
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={`relative flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300 min-w-0 flex-1 mx-1 tap-target haptic-light overflow-hidden ${
                isActive
                  ? 'text-white bg-gradient-to-r from-blue-600 to-indigo-600 elevation-2 transform -translate-y-1'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              {/* Active item background effect */}
              {isActive && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-90 rounded-xl"></div>
                  <div className="absolute inset-0 bg-white opacity-10 rounded-xl"></div>
                </>
              )}
              
              {/* Content wrapper */}
              <div className="relative z-10 flex flex-col items-center">
                <Icon className={`w-6 h-6 mb-1 transition-all duration-300 ${
                  isActive 
                    ? 'text-white scale-110 drop-shadow-sm' 
                    : 'text-gray-600 scale-100'
                }`} />
                <span className={`text-xs font-semibold truncate transition-all duration-300 ${
                  isActive 
                    ? 'text-white drop-shadow-sm' 
                    : 'text-gray-600'
                }`}>
                  {item.label}
                </span>
              </div>
              
              {/* Active indicator dot */}
              {isActive && (
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full opacity-80 shadow-sm"></div>
              )}
              
              {/* Ripple effect for non-active items */}
              {!isActive && (
                <div className="absolute inset-0 bg-blue-600 opacity-0 rounded-xl transition-opacity duration-200 pointer-events-none"></div>
              )}
            </button>
          );
        })}
        
        {/* Subtle bottom accent line */}
        <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent opacity-50"></div>
      </div>
    </div>
  );
};