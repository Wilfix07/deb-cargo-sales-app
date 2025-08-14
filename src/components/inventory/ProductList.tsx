import React, { useState, useEffect } from 'react';
import { Package, Search, Plus, Edit, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { InventoryService } from '../../services/inventoryService';
import { Product, Category, Supplier } from '../../types/inventory';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';
import { INVENTORY_PERMISSIONS } from '../../types';

interface ProductListProps {
  onNavigate: (view: string, data?: any) => void;
}

export const ProductList: React.FC<ProductListProps> = ({ onNavigate }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [stockFilter, setStockFilter] = useState('all');

  const { user } = useSupabaseAuth();
  const userPermissions = user ? INVENTORY_PERMISSIONS[user.role] : null;

  const inventoryService = new InventoryService();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    
    const [productsResult, categoriesResult, suppliersResult] = await Promise.all([
      inventoryService.getProducts(),
      inventoryService.getCategories(),
      inventoryService.getSuppliers()
    ]);

    if (productsResult.success) {
      setProducts(productsResult.products!);
    }

    if (categoriesResult.success) {
      setCategories(categoriesResult.categories!);
    }

    if (suppliersResult.success) {
      setSuppliers(suppliersResult.suppliers!);
    }

    setLoading(false);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!userPermissions?.canDeleteProducts) {
      alert('Ou pa gen otorizasyon pou efase pwodwi yo');
      return;
    }

    if (confirm('Ou kwè ou vle efase pwodwi sa a?')) {
      const result = await inventoryService.deleteProduct(id);
      if (result.success) {
        setProducts(prev => prev.filter(p => p.id !== id));
      }
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Pa gen kategori';
  };

  const getSupplierName = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier?.name || 'Pa gen founisè';
  };

  const getStockStatus = (product: Product) => {
    if (product.current_stock === 0) {
      return { status: 'out', label: 'Stock Fini', color: 'text-red-600 bg-red-100' };
    } else if (product.current_stock <= product.min_stock_level) {
      return { status: 'low', label: 'Stock Ki Ba', color: 'text-orange-600 bg-orange-100' };
    } else {
      return { status: 'good', label: 'Stock OK', color: 'text-green-600 bg-green-100' };
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Pwodwi yo</h1>
          <p className="text-sm text-gray-600">Jesyon pwodwi ak enventè yo</p>
        </div>
        
        {userPermissions?.canCreateProducts && (
          <button
            onClick={() => onNavigate('add-product')}
            className="btn-primary w-full flex items-center justify-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Ajoute Pwodwi</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="mobile-card">
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Chèche pwodwi..."
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
              <option value="">Tout Kategori</option>
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
              <option value="all">Tout Stock</option>
              <option value="good">Stock OK</option>
              <option value="low">Stock Ki Ba</option>
              <option value="out">Stock Fini</option>
            </select>
          </div>
          
          <div className="text-xs text-gray-600 flex items-center justify-center bg-gray-50 rounded-lg p-2">
            <Package className="w-3 h-3 mr-1" />
            {filteredProducts.length} pwodwi yo jwenn
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="space-y-4">
        {filteredProducts.map((product) => {
          const stockStatus = getStockStatus(product);
          
          return (
            <div
              key={product.id}
              className="mobile-card mobile-card-hover p-0 overflow-hidden"
            >
              {/* Product Image */}
              <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="w-12 h-12 text-gray-400" />
                )}
              </div>
              
              {/* Product Info */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-800 text-base mb-1 line-clamp-2">{product.name}</h3>
                    <p className="text-xs text-gray-500">{product.code}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${stockStatus.color}`}>
                    {stockStatus.label}
                  </span>
                </div>
                
                <p className="text-gray-600 text-xs mb-3 line-clamp-2">
                  {product.description || 'Pa gen deskripsyon'}
                </p>
                
                <div className="space-y-1 mb-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Kategori:</span>
                    <span className="font-medium truncate max-w-24">{getCategoryName(product.category_id)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Stock:</span>
                    <span className="font-medium">
                      {product.current_stock} {product.unit_of_measure}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Pri:</span>
                    <span className="font-bold text-green-600">
                      $HT{product.unit_price.toFixed(2)}
                    </span>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex space-x-2 mt-3">
                  {userPermissions?.canUpdateProducts && (
                    <button
                      onClick={() => onNavigate('edit-product', product)}
                      className="flex-1 flex items-center justify-center space-x-1 bg-blue-50 text-blue-600 py-2 px-2 rounded-lg hover:bg-blue-100 transition-colors tap-target"
                    >
                      <Edit className="w-4 h-4" />
                      <span className="text-xs">Modifye</span>
                    </button>
                  )}
                  {userPermissions?.canDeleteProducts && (
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="flex items-center justify-center bg-red-50 text-red-600 py-2 px-2 rounded-lg hover:bg-red-100 transition-colors tap-target"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="mobile-empty-state">
          <Package className="mobile-empty-state-icon" />
          <h3 className="text-lg font-semibold text-gray-500 mb-2">Pa gen pwodwi yo</h3>
          <p className="text-gray-400 mb-6">Kòmanse pa ajoute premye pwodwi ou an</p>
          {userPermissions?.canCreateProducts && (
            <button
              onClick={() => onNavigate('add-product')}
              className="btn-primary"
            >
              Ajoute Pwodwi
            </button>
          )}
        </div>
      )}
    </div>
  );
};