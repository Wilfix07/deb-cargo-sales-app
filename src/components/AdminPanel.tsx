import React, { useState } from 'react';
import { Shield, Database, Users, Settings, BarChart3 } from 'lucide-react';
import { DatabaseSetup } from './DatabaseSetup';
import { StockSettings } from './inventory/StockSettings';
import { MobileCard } from './MobileCard';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';

export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'database' | 'users' | 'settings' | 'reports'>('database');
  const { user } = useSupabaseAuth();

  // Only allow Admin users to access this panel
  if (!user || user.role !== 'Admin') {
    return (
      <div className="space-y-6">
        <MobileCard className="text-center py-12">
          <Shield className="w-16 h-16 text-red-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-600 mb-2">Aksè Refize</h3>
          <p className="text-red-500">
            Sèlman Admin yo ki ka aksè panel sa a
          </p>
        </MobileCard>
      </div>
    );
  }

  const tabs = [
    { id: 'database', label: 'Database Setup', icon: Database },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'settings', label: 'Stock Settings', icon: Settings },
    { id: 'reports', label: 'System Reports', icon: BarChart3 }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'database':
        return <DatabaseSetup />;
      case 'users':
        return (
          <MobileCard>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">User Management</h3>
            <p className="text-gray-600">User management features will be implemented here.</p>
          </MobileCard>
        );
      case 'settings':
        return (
          <StockSettings />
        );
      case 'reports':
        return (
          <MobileCard>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">System Reports</h3>
            <p className="text-gray-600">System-level reports and analytics will be shown here.</p>
          </MobileCard>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <MobileCard>
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Admin Panel</h1>
          <p className="text-gray-600">
            Panel administratè pou jesyon sistèm nan
          </p>
        </div>
      </MobileCard>

      {/* Tab Navigation */}
      <MobileCard padding="none">
        <div className="flex overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex flex-col items-center p-4 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </MobileCard>

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
};