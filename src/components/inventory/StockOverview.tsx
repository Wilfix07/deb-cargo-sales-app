import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, CheckCircle, TrendingDown, Search, Filter, DollarSign } from 'lucide-react';
import { InventoryService } from '../../services/inventoryService';
import { Product, Category } from '../../types/inventory';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';

interface StockOverviewProps {
  onNavigate?: (view: string, data?: any) => void;
}

export const StockOverview: React.FC<StockOverviewProps> = ({ onNavigate }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [stockFilter, setStockFilter] = useState('all');

  const { user } = useSupabaseAuth();
  const inventoryService = new InventoryService();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    
    const [productsResult, categoriesResult] = await Promise.all([
      inventoryService.getProducts(),
      inventoryService.getCategories()
    ]);

    if (productsResult.success) {
      setProducts(productsResult.products!);
    }

    if (categoriesResult.success) {
      setCategories(categoriesResult.categories!);
    }

    setLoading(false);
  };

  const getStockStatus = (product: Product) => {
    if (product.current_stock === 0) {
      return { status: 'out', label: 'Out of Stock', color: 'text-red-600 bg-red-100', icon: AlertTriangle };
    } else if (product.current_stock <= product.min_stock_level) {
      return { status: 'low', label: 'Low Stock', color: 'text-orange-600 bg-orange-100', icon: TrendingDown };
    } else {
      return { status: 'good', label: 'In Stock', color: 'text-green-600 bg-green-100', icon: CheckCircle };
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'No Category';
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.code.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === '' || product.category_id === selectedCategory;
    
    const matchesStock = stockFilter === 'all' ||
                        (stockFilter === 'low' && product.current_stock <= product.min_stock_level) ||
                        (stockFilter === 'out' && product.current_stock === 0) ||
                        (stockFilter === 'good' && product.current_stock > product.min_stock_level);
    
    return matchesSearch && matchesCategory && matchesStock;
  });

  const stockSummary = {
    total: products.length,
    inStock: products.filter(p => p.current_stock > p.min_stock_level).length,
    lowStock: products.filter(p => p.current_stock <= p.min_stock_level && p.current_stock > 0).length,
    outOfStock: products.filter(p => p.current_stock === 0).length,
    totalValue: products.reduce((sum, p) => sum + (p.current_stock * p.cost_price), 0)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mobile-card">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Stock Overview</h1>
        <p className="text-gray-600">Current inventory levels and stock status</p>
      </div>

      {/* Stock Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="mobile-card bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <div className="text-center">
            <Package className="w-8 h-8 mx-auto mb-2" />
            <p className="text-blue-100 text-sm">Total Products</p>
            <p className="text-2xl font-bold">{stockSummary.total}</p>
          </div>
        </div>
        
        <div className="mobile-card bg-gradient-to-r from-green-500 to-green-600 text-white">
          <div className="text-center">
            <CheckCircle className="w-8 h-8 mx-auto mb-2" />
            <p className="text-green-100 text-sm">In Stock</p>
            <p className="text-2xl font-bold">{stockSummary.inStock}</p>
          </div>
        </div>
        
        <div className="mobile-card bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <div className="text-center">
            <TrendingDown className="w-8 h-8 mx-auto mb-2" />
            <p className="text-orange-100 text-sm">Low Stock</p>
            <p className="text-2xl font-bold">{stockSummary.lowStock}</p>
          </div>
        </div>
        
        <div className="mobile-card bg-gradient-to-r from-red-500 to-red-600 text-white">
          <div className="text-center">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
            <p className="text-red-100 text-sm">Out of Stock</p>
            <p className="text-2xl font-bold">{stockSummary.outOfStock}</p>
          </div>
        </div>
        
        <div className="mobile-card bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <div className="text-center">
            <DollarSign className="w-8 h-8 mx-auto mb-2" />
            <p className="text-purple-100 text-sm">Total Value</p>
            <p className="text-lg font-bold">$HT{stockSummary.totalValue.toFixed(0)}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mobile-card">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mobile-input pl-10"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="mobile-input"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="mobile-input"
            >
              <option value="all">All Stock Levels</option>
              <option value="good">In Stock</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>
          
          <div className="text-xs text-gray-600 flex items-center justify-center bg-gray-50 rounded-lg p-2">
            <Package className="w-3 h-3 mr-1" />
            {filteredProducts.length} products found
          </div>
        </div>
      </div>

      {/* Products List */}
      <div className="space-y-3">
        {filteredProducts.map((product) => {
          const stockStatus = getStockStatus(product);
          const StockIcon = stockStatus.icon;
          
          return (
            <div key={product.id} className="mobile-card mobile-card-hover">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                    <Package className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{product.name}</h3>
                    <p className="text-sm text-gray-500">{product.code}</p>
                    <p className="text-xs text-gray-400">{getCategoryName(product.category_id)}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${stockStatus.color} flex items-center space-x-1`}>
                    <StockIcon className="w-4 h-4" />
                    <span>{stockStatus.label}</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Current Stock</p>
                  <p className={`font-bold text-lg ${
                    product.current_stock === 0 ? 'text-red-600' :
                    product.current_stock <= product.min_stock_level ? 'text-orange-600' :
                    'text-green-600'
                  }`}>
                    {product.current_stock} {product.unit_of_measure}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Min Level</p>
                  <p className="font-medium text-gray-800">{product.min_stock_level} {product.unit_of_measure}</p>
                </div>
                <div>
                  <p className="text-gray-600">Max Level</p>
                  <p className="font-medium text-gray-800">{product.max_stock_level} {product.unit_of_measure}</p>
                </div>
                <div>
                  <p className="text-gray-600">Unit Price</p>
                  <p className="font-bold text-blue-600">$HT{product.unit_price.toFixed(2)}</p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">
                    Stock Value: $HT{(product.current_stock * product.cost_price).toFixed(2)}
                  </span>
                  <span className={`font-medium ${
                    product.current_stock <= product.min_stock_level ? 'text-orange-600' : 'text-green-600'
                  }`}>
                    {product.current_stock <= product.min_stock_level ? 'Needs Restock' : 'Stock OK'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="mobile-card text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-500 mb-2">No products found</h3>
          <p className="text-gray-400">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );
};