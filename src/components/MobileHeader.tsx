import React from 'react';
import { Menu, Bell, User, LogOut, Shield, ArrowLeft } from 'lucide-react';
import { Logo } from './Logo';
import { UserRole } from '../types';

interface MobileHeaderProps {
  user?: {
    fullName: string;
    role: UserRole;
  };
  onMenuClick?: () => void;
  onLogout: () => void;
  title?: string;
  showBack?: boolean;
  onBackClick?: () => void;
  className?: string;
  transparent?: boolean;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  user,
  onMenuClick,
  onLogout,
  title,
  showBack,
  onBackClick,
  className = '',
  transparent = false
}) => {
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

  return (
    <>
      {/* Status Bar */}
      <div className={`status-bar ${transparent ? 'bg-transparent' : ''}`}>
        <span className="text-xs font-medium">
          {user?.role === 'Teller' ? 'DEB CARGO SHIPPING LLC - Sistèm Vant' : 'DEB CARGO SHIPPING LLC - Sales System'}
        </span>
      </div>
      
      {/* Main Header */}
      <header className={`mobile-header text-white ${className} ${
        transparent ? 'bg-transparent backdrop-blur-md' : ''
      }`}>
        <div className="flex items-center justify-between p-4">
          {/* Left Section */}
          <div className="flex items-center space-x-3">
            {showBack ? (
              <button
                onClick={onBackClick}
                className="tap-target rounded-full hover:bg-white hover:bg-opacity-20 transition-colors haptic-light"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
            ) : (
              <button
                onClick={onMenuClick}
                className="tap-target rounded-full hover:bg-white hover:bg-opacity-20 transition-colors haptic-light"
              >
                <Menu className="w-6 h-6" />
              </button>
            )}
            
            <div className="flex items-center space-x-2">
              <Logo size="medium" />
              <div>
                <h1 className="text-xl font-bold truncate">
                  {title || (user?.role === 'Teller' ? 'DEB CARGO' : 'DEB CARGO')}
                </h1>
                <p className="text-xs text-blue-100">
                  {user?.role === 'Teller' ? 'Sistèm Vant' : 'Sales System'}
                </p>
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-2">
            {/* User Info */}
            <div className="flex items-center space-x-2">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium truncate max-w-24">
                  {user?.fullName}
                </p>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user?.role || 'Teller')}`}>
                  <Shield className="w-3 h-3 mr-1" />
                  {user?.role}
                </span>
              </div>
              
              {/* User Avatar */}
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center tap-target">
                <User className="w-5 h-5" />
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="tap-target rounded-full hover:bg-white hover:bg-opacity-20 transition-colors haptic-medium"
              title={user?.role === 'Teller' ? 'Dekonekte' : 'Sign Out'}
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>
    </>
  );
};