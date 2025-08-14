import React, { useState } from 'react';
import { 
  Home, History, Package, Settings, BarChart3, Scan, Plus, 
  ChevronRight, User, LogOut, Shield 
} from 'lucide-react';
import { UserRole } from '../types';
import { INVENTORY_PERMISSIONS } from '../types';

interface MobileNavigationProps {
  activeView: string;
  onViewChange: (view: string) => void;
  onScanClick: () => void;
  onAddClick: () => void;
  onLogout: () => void;
  user: {
    fullName: string;
    role: UserRole;
    email: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  activeView,
  onViewChange,
  onScanClick,
  onAddClick,
  onLogout,
  user,
  isOpen,
  onClose
}) => {
  const userPermissions = INVENTORY_PERMISSIONS[user.role];

  const navigationItems = [
    {
      id: 'dashboard',
      icon: Home,
      label: user.role === 'Teller' ? 'Dashboard' : 'Dashboard',
      show: true
    },
    {
      id: 'history',
      icon: History,
      label: user.role === 'Teller' ? 'Istwa Vant' : 'Sales History',
      show: true
    },
    {
      id: 'inventory',
      icon: Package,
      label: user.role === 'Teller' ? 'Stock' : 'Inventory',
      show: userPermissions?.canViewProducts
    },
    {
      id: 'reports',
      icon: BarChart3,
      label: user.role === 'Teller' ? 'Rapò yo' : 'Reports',
      show: user.role !== 'Teller'
    },
    {
      id: 'settings',
      icon: Settings,
      label: user.role === 'Teller' ? 'Paramèt' : 'Settings',
      show: true
    }
  ].filter(item => item.show);

  const quickActions = [
    {
      id: 'scan',
      icon: Scan,
      label: user.role === 'Teller' ? 'Scan Pwodwi' : 'Scan Product',
      action: onScanClick,
      show: user.role !== 'Manager',
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'add',
      icon: Plus,
      label: user.role === 'Teller' ? 'Ajoute Vant' : 'Add Sale',
      action: onAddClick,
      show: user.role !== 'Manager',
      color: 'from-green-500 to-green-600'
    }
  ].filter(item => item.show);

  const getRoleColor = (role: UserRole): string => {
    switch (role) {
      case 'Admin':
        return 'text-red-600 bg-red-100';
      case 'Manager':
        return 'text-purple-600 bg-purple-100';
      case 'Chef Teller':
        return 'text-blue-600 bg-blue-100';
      case 'Teller':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const handleItemClick = (item: any) => {
    onViewChange(item.id);
    onClose();
  };

  const handleActionClick = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="mobile-backdrop"
          onClick={onClose}
        />
      )}

      {/* Navigation Drawer */}
      <div 
        className={`fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 safe-area-top">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold text-lg">{user.fullName}</h3>
              <p className="text-blue-100 text-sm">{user.email}</p>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2 ${getRoleColor(user.role)}`}>
                <Shield className="w-3 h-3 mr-1" />
                {user.role}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              {user.role === 'Teller' ? 'Navigasyon' : 'Navigation'}
            </h4>
            <div className="space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                    <span className="font-medium">{item.label}</span>
                    <ChevronRight className={`w-4 h-4 ml-auto ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          {quickActions.length > 0 && (
            <div className="p-4 border-t border-gray-200">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                {user.role === 'Teller' ? 'Aksyon Rapid' : 'Quick Actions'}
              </h4>
              <div className="space-y-2">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  
                  return (
                    <button
                      key={action.id}
                      onClick={() => handleActionClick(action.action)}
                      className={`w-full flex items-center space-x-3 p-3 rounded-lg bg-gradient-to-r ${action.color} text-white hover:shadow-lg transition-all duration-200`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{action.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 safe-area-bottom">
          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="w-full flex items-center space-x-3 p-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">
              {user.role === 'Teller' ? 'Dekonekte' : 'Sign Out'}
            </span>
          </button>
          
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">DEB CARGO SHIPPING LLC</p>
            <p className="text-xs text-gray-400">Sales Data Collection v1.0</p>
          </div>
        </div>
      </div>
    </>
  );
};