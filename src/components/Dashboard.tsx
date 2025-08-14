import React from 'react';
import { TrendingUp, DollarSign, ShoppingCart, Calendar } from 'lucide-react';
import { DashboardStats } from '../types';
import { MobileCard } from './MobileCard';

interface DashboardProps {
  stats: DashboardStats;
  userRole?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ stats, userRole }) => {
  // For Tellers, only show today's stats, not total stats
  const statCards = userRole === 'Teller' ? [
    {
      title: "Today's Sales",
      value: stats.todaySales.toString(),
      icon: Calendar,
      color: 'from-purple-500 to-purple-600',
      textColor: 'text-purple-600'
    },
    {
      title: "Today's Revenue",
      value: `$${stats.todayAmount.toLocaleString()}`,
      icon: TrendingUp,
      color: 'from-orange-500 to-orange-600',
      textColor: 'text-orange-600'
    }
  ] : [
    {
      title: 'Total Sales',
      value: stats.totalSales.toString(),
      icon: ShoppingCart,
      color: 'from-blue-500 to-blue-600',
      textColor: 'text-blue-600'
    },
    {
      title: 'Total Revenue',
      value: `$${stats.totalAmount.toLocaleString()}`,
      icon: DollarSign,
      color: 'from-green-500 to-green-600',
      textColor: 'text-green-600'
    },
    {
      title: "Today's Sales",
      value: stats.todaySales.toString(),
      icon: Calendar,
      color: 'from-purple-500 to-purple-600',
      textColor: 'text-purple-600'
    },
    {
      title: "Today's Revenue",
      value: `$${stats.todayAmount.toLocaleString()}`,
      icon: TrendingUp,
      color: 'from-orange-500 to-orange-600',
      textColor: 'text-orange-600'
    }
  ];

  return (
    <div className="space-y-4 overflow-y-auto">
      <div className={`mobile-grid ${userRole === 'Teller' ? 'sm:grid-cols-2' : 'lg:grid-cols-2'}`}>
      {statCards.map((stat, index) => (
        <MobileCard
          key={stat.title}
          className="hover:scale-105 transition-transform duration-200"
          padding="medium"
          elevation={2}
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2 rounded-lg bg-gradient-to-r ${stat.color}`}>
              <stat.icon className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 font-medium">{stat.title}</p>
              <p className={`text-xl font-bold ${stat.textColor}`}>
                {stat.value.replace('$', '$HT ')}
              </p>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className={`h-1.5 rounded-full bg-gradient-to-r ${stat.color}`}
              style={{ width: `${Math.min(100, (index + 1) * (userRole === 'Teller' ? 50 : 25))}%` }}
            ></div>
          </div>
        </MobileCard>
      ))}
      </div>
    </div>
  );
};