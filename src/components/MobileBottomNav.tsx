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
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 min-w-0 flex-1 tap-target haptic-light ${
                isActive
                  ? 'text-blue-600 bg-blue-50 mobile-nav-active'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <Icon className={`w-6 h-6 mb-1 ${isActive ? 'text-blue-600' : 'text-gray-600'}`} />
              <span className={`text-xs font-medium truncate ${isActive ? 'text-blue-600' : 'text-gray-600'}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-blue-600 rounded-full"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};