import React, { useState, useEffect } from 'react';
import { Save, X, Package, DollarSign, Hash, FileText } from 'lucide-react';
import { Logo } from '../Logo';
import { Product, Category, Supplier } from '../../types/inventory';
import { InventoryService } from '../../services/inventoryService';

interface ProductFormProps {
  product?: Product;
  onSave: (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => void;
  onClose: () => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({ product, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    code: product?.code || '',
    name: product?.name || '',
    description: product?.description || '',
    category_id: product?.category_id || '',
    supplier_id: product?.supplier_id || '',
    unit_price: product?.unit_price || 0,
    cost_price: product?.cost_price || 0,
    current_stock: product?.current_stock || 0,
    min_stock_level: product?.min_stock_level || 0,
    max_stock_level: product?.max_stock_level || 0,
    unit_of_measure: product?.unit_of_measure || 'pcs',
    barcode: product?.barcode || '',
    is_active: product?.is_active ?? true
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const inventoryService = new InventoryService();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [categoriesResult, suppliersResult] = await Promise.all([
      inventoryService.getCategories(),
      inventoryService.getSuppliers()
    ]);

    if (categoriesResult.success) {
      setCategories(categoriesResult.categories!);
    }

    if (suppliersResult.success) {
      setSuppliers(suppliersResult.suppliers!);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.code.trim()) {
      newErrors.code = 'Kòd pwodwi a obligatwa';
    }
    if (!formData.name.trim()) {
      newErrors.name = 'Non pwodwi a obligatwa';
    }
    if (!formData.category_id) {
      newErrors.category_id = 'Kategori a obligatwa';
    }
    if (formData.unit_price < 0) {
      newErrors.unit_price = 'Pri a dwe pozitif';
    }
    if (formData.cost_price < 0) {
      newErrors.cost_price = 'Pri kout la dwe pozitif';
    }
    if (formData.current_stock < 0) {
      newErrors.current_stock = 'Stock la dwe pozitif';
    }
    if (formData.min_stock_level < 0) {
      newErrors.min_stock_level = 'Nivo minimum nan dwe pozitif';
    }
    if (formData.max_stock_level < formData.min_stock_level) {
      newErrors.max_stock_level = 'Nivo maksimòm nan dwe pi gwo pase minimum nan';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    onSave(formData);
    setLoading(false);
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex flex-col">
      <div className="flex-1 bg-white overflow-hidden">
        <div className="mobile-header safe-area-top">
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
                  <h1 className="text-lg font-bold text-white">
                    {product ? 'Modifye Pwodwi' : 'Ajoute Pwodwi'}
                  </h1>
                  <p className="text-xs text-blue-100">DEB CARGO SHIPPING LLC</p>
                </div>
              </div>
            </div>
            
            <Package className="w-6 h-6 text-white" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4 safe-area-bottom">
          <div className="space-y-4">
            {/* Product Code */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Kòd Pwodwi *
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value)}
                  className={`mobile-input pl-10 ${
                    errors.code ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Antre kòd pwodwi a"
                />
              </div>
              {errors.code && (
                <p className="text-red-500 text-sm mt-1">{errors.code}</p>
              )}
            </div>

            {/* Product Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Non Pwodwi *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`mobile-input ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Antre non pwodwi a"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Kategori *
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => handleInputChange('category_id', e.target.value)}
                className={`mobile-input ${
                  errors.category_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Chwazi yon kategori</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category_id && (
                <p className="text-red-500 text-sm mt-1">{errors.category_id}</p>
              )}
            </div>

            {/* Supplier */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Founisè
              </label>
              <select
                value={formData.supplier_id}
                onChange={(e) => handleInputChange('supplier_id', e.target.value)}
                className="mobile-input"
              >
                <option value="">Chwazi yon founisè</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Unit Price */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Pri Vant ($HT) *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.unit_price}
                  onChange={(e) => handleInputChange('unit_price', parseFloat(e.target.value) || 0)}
                  className={`mobile-input pl-10 ${
                    errors.unit_price ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.unit_price && (
                <p className="text-red-500 text-sm mt-1">{errors.unit_price}</p>
              )}
            </div>

            {/* Cost Price */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Pri Kout ($HT) *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.cost_price}
                  onChange={(e) => handleInputChange('cost_price', parseFloat(e.target.value) || 0)}
                  className={`mobile-input pl-10 ${
                    errors.cost_price ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.cost_price && (
                <p className="text-red-500 text-sm mt-1">{errors.cost_price}</p>
              )}
            </div>

            {/* Current Stock */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Stock Aktyèl *
              </label>
              <input
                type="number"
                min="0"
                value={formData.current_stock}
                onChange={(e) => handleInputChange('current_stock', parseInt(e.target.value) || 0)}
                className={`mobile-input ${
                  errors.current_stock ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.current_stock && (
                <p className="text-red-500 text-sm mt-1">{errors.current_stock}</p>
              )}
            </div>

            {/* Min Stock Level */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nivo Stock Minimum *
              </label>
              <input
                type="number"
                min="0"
                value={formData.min_stock_level}
                onChange={(e) => handleInputChange('min_stock_level', parseInt(e.target.value) || 0)}
                className={`mobile-input ${
                  errors.min_stock_level ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.min_stock_level && (
                <p className="text-red-500 text-sm mt-1">{errors.min_stock_level}</p>
              )}
            </div>

            {/* Max Stock Level */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nivo Stock Maksimòm *
              </label>
              <input
                type="number"
                min="0"
                value={formData.max_stock_level}
                onChange={(e) => handleInputChange('max_stock_level', parseInt(e.target.value) || 0)}
                className={`mobile-input ${
                  errors.max_stock_level ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.max_stock_level && (
                <p className="text-red-500 text-sm mt-1">{errors.max_stock_level}</p>
              )}
            </div>

            {/* Unit of Measure */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Inite Mezi
              </label>
              <select
                value={formData.unit_of_measure}
                onChange={(e) => handleInputChange('unit_of_measure', e.target.value)}
                className="mobile-input"
              >
                <option value="pcs">Moso (pcs)</option>
                <option value="kg">Kilogram (kg)</option>
                <option value="lb">Liv (lb)</option>
                <option value="liter">Lit (liter)</option>
                <option value="gallon">Galon (gallon)</option>
                <option value="box">Bwat (box)</option>
                <option value="pack">Pak (pack)</option>
              </select>
            </div>

            {/* Barcode */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Barcode
              </label>
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => handleInputChange('barcode', e.target.value)}
                className="mobile-input"
                placeholder="Antre barcode a"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Deskripsyon
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="mobile-input pl-10"
                placeholder="Antre deskripsyon pwodwi a"
              />
            </div>
          </div>



          {/* Active Status */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => handleInputChange('is_active', e.target.checked)}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
              Pwodwi aktif
            </label>
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
              className="btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>{product ? 'Modifye' : 'Sove'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};