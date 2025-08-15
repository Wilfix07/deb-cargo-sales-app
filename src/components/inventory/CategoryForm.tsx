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
      <div className="mobile-form-section">
        <div className="mobile-form-header">
          <h2 className="mobile-form-title">Nouvo Kategori</h2>
          <p className="mobile-form-subtitle">Ajoute nouvo kategori pwodwi</p>
        </div>

        <form onSubmit={onSubmit} className="mobile-form">
          <div className="mobile-form-group">
            <label className="mobile-label required">Non Kategori</label>
            <div className="relative">
              <Grid3X3 className="absolute left-3 top-4 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={`mobile-input pl-12 ${errors.name ? 'error' : ''}`}
                placeholder="Antre non kategori a"
              />
            </div>
            {errors.name && (
              <p className="mobile-field-error">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{errors.name}</span>
              </p>
            )}
          </div>

          <div className="mobile-form-group">
            <label className="mobile-label">Deskripsyon</label>
            <div className="relative">
              <svg className="absolute left-3 top-4 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <textarea
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="mobile-input pl-12"
                placeholder="Deskripsyon kout sou kategori a"
                rows={3}
              />
            </div>
          </div>

          <div className="mobile-form-group">
            <label className="mobile-label">Kategori Paran (opsyonèl)</label>
            <div className="relative">
              <svg className="absolute left-3 top-4 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <select
                value={form.parent_id}
                onChange={(e) => handleChange('parent_id', e.target.value)}
                className="mobile-input pl-12"
              >
                <option value="">Okenn</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <p className="mobile-label-helper">Chwazi kategori paran an si sa aplikab</p>
          </div>

          <div className="flex flex-col gap-4 pt-6">
            <button type="submit" className="btn-primary w-full" disabled={saving}>
              {saving ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Ap sove...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <Save className="w-5 h-5" />
                  <span>Sove Kategori</span>
                </div>
              )}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary w-full" disabled={saving}>
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Anile</span>
              </div>
            </button>
          </div>
        </form>
      </div>
    </MobileFormContainer>
  );
};


