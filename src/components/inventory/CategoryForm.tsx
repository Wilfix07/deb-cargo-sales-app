import React, { useEffect, useState } from 'react';
import { X, Save, Grid3X3 } from 'lucide-react';
import { InventoryService } from '../../services/inventoryService';
import { Category } from '../../types/inventory';
import { MobileFormContainer } from '../MobileFormContainer';

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
    <MobileFormContainer
      title="Add Category"
      onClose={onClose}
      onSave={() => {
        const form = document.querySelector('form');
        if (form) {
          form.requestSubmit();
        }
      }}
      enableSwipeNavigation={true}
      scrollToTopOnMount={true}
    >
      <form onSubmit={onSubmit} className="mobile-form">
        <div className="mobile-form-group">
          <label className="mobile-label">Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className={`mobile-input ${errors.name ? 'border-red-500' : ''}`}
            placeholder="Category name"
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>

        <div className="mobile-form-group">
          <label className="mobile-label">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
            className="mobile-input"
            placeholder="Short description"
            rows={3}
          />
        </div>

        <div className="mobile-form-group">
          <label className="mobile-label">Parent Category (optional)</label>
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

        <div className="flex flex-col space-y-3 pt-4">
          <button type="button" onClick={onClose} className="btn-secondary w-full">Cancel</button>
          <button type="submit" className="btn-primary w-full flex items-center justify-center space-x-2" disabled={saving}>
            <Save className="w-5 h-5" />
            <span>{saving ? 'Saving...' : 'Save Category'}</span>
          </button>
        </div>
      </form>
    </MobileFormContainer>
  );
};


