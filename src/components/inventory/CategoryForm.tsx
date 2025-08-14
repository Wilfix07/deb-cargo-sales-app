import React, { useEffect, useState } from 'react';
import { X, Save, Grid3X3 } from 'lucide-react';
import { InventoryService } from '../../services/inventoryService';
import { Category } from '../../types/inventory';

interface CategoryFormProps {
  onClose: () => void;
  onSaved: () => void;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({ onClose, onSaved }) => {
  const [form, setForm] = useState({
    name: '',
    description: '',
    parent_id: '' as string | '' ,
    is_active: true
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const inventoryService = new InventoryService();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const result = await inventoryService.getCategories();
    if (result.success && result.categories) {
      setCategories(result.categories);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    const result = await inventoryService.createCategory({
      name: form.name,
      description: form.description || undefined,
      parent_id: form.parent_id || undefined,
      is_active: form.is_active
    });
    setSaving(false);
    if (result.success) {
      onSaved();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex flex-col">
      <div className="flex-1 bg-white overflow-hidden">
        <div className="mobile-header safe-area-top">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <button onClick={onClose} className="tap-target rounded-full hover:bg-white hover:bg-opacity-20 transition-colors">
                <X className="w-6 h-6 text-white" />
              </button>
              <div className="flex items-center space-x-2">
                <Grid3X3 className="w-6 h-6 text-white" />
                <div>
                  <h1 className="text-lg font-bold text-white">Add Category</h1>
                </div>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-4 space-y-4 safe-area-bottom pb-24">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={`mobile-input ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Category name"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="mobile-input"
                placeholder="Short description"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Parent Category (optional)</label>
              <select
                value={form.parent_id}
                onChange={(e) => handleChange('parent_id', e.target.value)}
                className="mobile-input"
              >
                <option value="">None</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="sticky bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-gray-200 p-4">
            <div className="flex flex-col space-y-3">
              <button type="button" onClick={onClose} className="btn-secondary w-full">Cancel</button>
              <button type="submit" className="btn-primary w-full flex items-center justify-center space-x-2" disabled={saving}>
                <Save className="w-5 h-5" />
                <span>{saving ? 'Saving...' : 'Save Category'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};


