import React, { useState, useEffect } from 'react';
import { Save, X, Package, TrendingUp, TrendingDown, RotateCcw } from 'lucide-react';
import { Logo } from '../Logo';
import { Product } from '../../types/inventory';
import { InventoryService } from '../../services/inventoryService';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';

interface StockMovementFormProps {
  onSave: (movement: any) => void;
  onClose: () => void;
}

export const StockMovementForm: React.FC<StockMovementFormProps> = ({ onSave, onClose }) => {
  const [formData, setFormData] = useState({
    product_id: '',
    movement_type: 'IN' as 'IN' | 'OUT' | 'ADJUSTMENT',
    quantity: 0,
    unit_cost: 0,
    reference_number: '',
    notes: ''
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const { user } = useSupabaseAuth();
  const inventoryService = new InventoryService();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const result = await inventoryService.getProducts();
    if (result.success) {
      setProducts(result.products!);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.product_id) {
      newErrors.product_id = 'Pwodwi a obligatwa';
    }
    if (formData.quantity <= 0) {
      newErrors.quantity = 'Kantite a dwe pi gwo pase 0';
    }
    if (formData.movement_type === 'OUT' && selectedProduct && formData.quantity > selectedProduct.current_stock) {
      newErrors.quantity = 'Kantite a depase stock ki disponib la';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !user) {
      return;
    }

    setLoading(true);
    
    const movement = {
      ...formData,
      user_id: user.id
    };

    onSave(movement);
    setLoading(false);
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    if (field === 'product_id') {
      const product = products.find(p => p.id === value);
      setSelectedProduct(product || null);
    }
  };

  const getMovementIcon = () => {
    switch (formData.movement_type) {
      case 'IN':
        return <TrendingUp className="w-6 h-6 text-green-600" />;
      case 'OUT':
        return <TrendingDown className="w-6 h-6 text-red-600" />;
      case 'ADJUSTMENT':
        return <RotateCcw className="w-6 h-6 text-blue-600" />;
    }
  };

  const getMovementColor = () => {
    switch (formData.movement_type) {
      case 'IN':
        return 'from-green-600 to-blue-600';
      case 'OUT':
        return 'from-red-600 to-pink-600';
      case 'ADJUSTMENT':
        return 'from-blue-600 to-purple-600';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex flex-col">
      <div className="flex-1 bg-white overflow-hidden">
        <div className={`mobile-header safe-area-top bg-gradient-to-r ${getMovementColor()}`}>
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
                  <h1 className="text-lg font-bold text-white">Mouvman Stock</h1>
                  <p className="text-xs text-blue-100">DEB CARGO SHIPPING LLC</p>
                </div>
              </div>
            </div>
            
            {getMovementIcon()}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4 safe-area-bottom">
          {/* Movement Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Tip Mouvman *
            </label>
            <div className="grid grid-cols-1 gap-3">
              {[
                { value: 'IN', label: 'Antre Stock', icon: TrendingUp, color: 'green' },
                { value: 'OUT', label: 'Soti Stock', icon: TrendingDown, color: 'red' },
                { value: 'ADJUSTMENT', label: 'Ajisteman', icon: RotateCcw, color: 'blue' }
              ].map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => handleInputChange('movement_type', type.value)}
                  className={`p-3 border-2 rounded-lg transition-all tap-target ${
                    formData.movement_type === type.value
                      ? `border-${type.color}-500 bg-${type.color}-50`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <type.icon className={`w-5 h-5 ${
                    formData.movement_type === type.value ? `text-${type.color}-600` : 'text-gray-400'
                  }`} />
                    <p className={`text-sm font-medium ${
                      formData.movement_type === type.value ? `text-${type.color}-600` : 'text-gray-600'
                    }`}>
                      {type.label}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Product Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Pwodwi *
            </label>
            <select
              value={formData.product_id}
              onChange={(e) => handleInputChange('product_id', e.target.value)}
              className={`mobile-input ${
                errors.product_id ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Chwazi yon pwodwi</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.code}) - Stock: {product.current_stock} {product.unit_of_measure}
                </option>
              ))}
            </select>
            {errors.product_id && (
              <p className="text-red-500 text-sm mt-1">{errors.product_id}</p>
            )}
          </div>

          {/* Current Stock Display */}
          {selectedProduct && (
            <div className="bg-gray-50 rounded-lg p-3">
              <h3 className="font-semibold text-gray-800 mb-2">Stock Aktyèl</h3>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-sm truncate flex-1 mr-2">{selectedProduct.name}</span>
                <span className="font-bold text-blue-600">
                  {selectedProduct.current_stock} {selectedProduct.unit_of_measure}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Quantity */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Kantite *
              </label>
              <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
                className={`mobile-input ${
                  errors.quantity ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder={formData.movement_type === 'ADJUSTMENT' ? 'Nouvo kantite total' : 'Kantite mouvman'}
              />
              {errors.quantity && (
                <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>
              )}
            </div>

            {/* Unit Cost */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Pri Inite ($HT)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.unit_cost}
                onChange={(e) => handleInputChange('unit_cost', parseFloat(e.target.value) || 0)}
                className="mobile-input"
                placeholder="Pri inite (opsyonèl)"
              />
            </div>
          </div>

          {/* Reference Number */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nimewo Referans
            </label>
            <input
              type="text"
              value={formData.reference_number}
              onChange={(e) => handleInputChange('reference_number', e.target.value)}
              className="mobile-input"
              placeholder="Nimewo referans (opsyonèl)"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nòt
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              className="mobile-input"
              placeholder="Nòt sou mouvman an (opsyonèl)"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col space-y-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary w-full"
            >
              Anile
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`btn-primary w-full bg-gradient-to-r ${getMovementColor()} hover:opacity-90 flex items-center justify-center space-x-2 disabled:opacity-50`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Sove Mouvman</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};