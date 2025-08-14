import React, { useState, useEffect } from 'react';
import { Package, TrendingDown, AlertTriangle, DollarSign, Users, Grid3X3, Plus, Search } from 'lucide-react';
import { InventoryService } from '../../services/inventoryService';
import { InventoryStats, Product } from '../../types/inventory';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';
import { INVENTORY_PERMISSIONS } from '../../types';

interface InventoryDashboardProps {
  onNavigate: (view: string) => void;
}

export const InventoryDashboard: React.FC<InventoryDashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const { user } = useSupabaseAuth();
  const userPermissions = user ? INVENTORY_PERMISSIONS[user.role] : null;

  const inventoryService = new InventoryService();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    
    const [statsResult, lowStockResult] = await Promise.all([
      inventoryService.getInventoryStats(),
      inventoryService.getLowStockProducts()
    ]);

    if (statsResult.success) {
      setStats(statsResult.stats!);
    }

    if (lowStockResult.success) {
      setLowStockProducts(lowStockResult.products!);
    }

    setLoading(false);
  };

  const statCards = [
    {
      title: 'Total Pwodwi',
      value: stats?.totalProducts.toString() || '0',
      icon: Package,
      color: 'from-blue-500 to-blue-600',
      textColor: 'text-blue-600',
      onClick: () => onNavigate('products')
    },
    {
      title: 'Valè Total',
      value: `$${stats?.totalValue.toLocaleString() || '0'}`,
      icon: DollarSign,
      color: 'from-green-500 to-green-600',
      textColor: 'text-green-600'
    },
    {
      title: 'Stock Ki Ba',
      value: stats?.lowStockItems.toString() || '0',
      icon: TrendingDown,
      color: 'from-orange-500 to-orange-600',
      textColor: 'text-orange-600',
      onClick: () => onNavigate('low-stock')
    },
    {
      title: 'Stock Fini',
      value: stats?.outOfStockItems.toString() || '0',
      icon: AlertTriangle,
      color: 'from-red-500 to-red-600',
      textColor: 'text-red-600'
    },
    {
      title: 'Kategori',
      value: stats?.totalCategories.toString() || '0',
      icon: Grid3X3,
      color: 'from-purple-500 to-purple-600',
      textColor: 'text-purple-600',
      onClick: () => onNavigate('categories')
    },
    {
      title: 'Founisè',
      value: stats?.totalSuppliers.toString() || '0',
      icon: Users,
      color: 'from-indigo-500 to-indigo-600',
      textColor: 'text-indigo-600',
      onClick: () => onNavigate('suppliers')
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Jesyon Machandiz</h1>
          <p className="text-sm text-gray-600">Jesyon enventè ak stock yo</p>
        </div>
        
        <div className="flex flex-col space-y-2">
          {userPermissions?.canCreateProducts && (
            <button
              onClick={() => onNavigate('add-product')}
              className="btn-primary w-full flex items-center justify-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Ajoute Pwodwi</span>
            </button>
          )}
          
          {userPermissions?.canManageStock && (
            <button
              onClick={() => onNavigate('stock-movement')}
              className="btn-primary w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
            >
              <Package className="w-5 h-5" />
              <span>Mouvman Stock</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mobile-grid gap-4">
        {statCards.map((stat, index) => (
          <div
            key={stat.title}
            className={`mobile-card mobile-card-hover ${
              stat.onClick ? 'cursor-pointer' : ''
            }`}
            onClick={stat.onClick}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg bg-gradient-to-r ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 font-medium">{stat.title}</p>
                <p className={`text-lg font-bold ${stat.textColor}`}>
                  {stat.value}
                </p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className={`h-1.5 rounded-full bg-gradient-to-r ${stat.color}`}
                style={{ width: `${Math.min(100, (index + 1) * 16.67)}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <div className="mobile-card p-0">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
                <h2 className="text-lg font-bold text-gray-800">Stock Ki Ba</h2>
              </div>
              <button
                onClick={() => onNavigate('low-stock')}
                className="text-orange-600 hover:text-orange-700 font-medium text-sm"
              >
                Wè Tout
              </button>
            </div>
          </div>
          
          <div className="p-4">
            <div className="space-y-3">
              {lowStockProducts.slice(0, 3).map((product) => (
                <div
                  key={product.id}
                  className="bg-orange-50 border border-orange-200 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-800 text-sm truncate flex-1 mr-2">{product.name}</h3>
                    <span className="text-xs text-orange-600 font-medium">
                      {product.code}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Stock Aktyèl:</span>
                    <span className="font-bold text-orange-600">
                      {product.current_stock} {product.unit_of_measure}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Minimum:</span>
                    <span className="text-gray-800">
                      {product.min_stock_level} {product.unit_of_measure}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mobile-card">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Aksyon Rapid</h2>
        <div className="grid grid-cols-2 gap-3">
          {userPermissions?.canViewProducts && (
            <button
              onClick={() => onNavigate('products')}
              className="flex flex-col items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer tap-target"
            >
              <Package className="w-6 h-6 text-blue-600 mb-1" />
              <span className="text-xs font-medium text-blue-600">Pwodwi yo</span>
            </button>
          )}
          
          {userPermissions?.canManageCategories && (
            <button
              onClick={() => onNavigate('categories')}
              className="flex flex-col items-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors cursor-pointer tap-target"
            >
              <Grid3X3 className="w-6 h-6 text-purple-600 mb-1" />
              <span className="text-xs font-medium text-purple-600">Kategori</span>
            </button>
          )}
          
          {userPermissions?.canManageSuppliers && (
            <button
              onClick={() => onNavigate('suppliers')}
              className="flex flex-col items-center p-3 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer tap-target"
            >
              <Users className="w-6 h-6 text-indigo-600 mb-1" />
              <span className="text-xs font-medium text-indigo-600">Founisè</span>
            </button>
          )}
          
          {userPermissions?.canViewStockMovements && (
            <button
              onClick={() => onNavigate('reports')}
              className="flex flex-col items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors cursor-pointer tap-target"
            >
              <Search className="w-6 h-6 text-green-600 mb-1" />
              <span className="text-xs font-medium text-green-600">Rapò</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};