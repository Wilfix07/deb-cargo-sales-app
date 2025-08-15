import React, { useState } from 'react';
import { X, Save, Users, Mail, Phone, MapPin } from 'lucide-react';
import { InventoryService } from '../../services/inventoryService';
import { MobileFormContainer } from '../MobileFormContainer';

interface SupplierFormProps {
  onClose: () => void;
  onSaved: () => void;
}

export const SupplierForm: React.FC<SupplierFormProps> = ({ onClose, onSaved }) => {
  const [form, setForm] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    is_active: true
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const inventoryService = new InventoryService();

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
    const result = await inventoryService.createSupplier({
      name: form.name,
      contact_person: form.contact_person || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      address: form.address || undefined,
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
      title="Add Supplier"
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
          <h2 className="mobile-form-title">Nouvo Founisè</h2>
          <p className="mobile-form-subtitle">Ajoute enfòmasyon founisè a</p>
        </div>

        <form onSubmit={onSubmit} className="mobile-form">
          <div className="mobile-form-group">
            <label className="mobile-label required">Non Founisè</label>
            <div className="relative">
              <Users className="absolute left-3 top-4 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={`mobile-input pl-12 ${errors.name ? 'error' : ''}`}
                placeholder="Antre non founisè a"
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

          <div className="mobile-form-divider">
            <span>Enfòmasyon Kontak</span>
          </div>

          <div className="mobile-form-group">
            <label className="mobile-label">Moun Kontak</label>
            <div className="relative">
              <Users className="absolute left-3 top-4 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={form.contact_person}
                onChange={(e) => handleChange('contact_person', e.target.value)}
                className="mobile-input pl-12"
                placeholder="Moun kontak nan"
              />
            </div>
          </div>

          <div className="mobile-form-group">
            <label className="mobile-label">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-4 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="mobile-input pl-12"
                placeholder="example@domain.com"
              />
            </div>
          </div>

          <div className="mobile-form-group">
            <label className="mobile-label">Telefòn</label>
            <div className="relative">
              <Phone className="absolute left-3 top-4 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="mobile-input pl-12"
                placeholder="(+509) 5555-5555"
              />
            </div>
          </div>

          <div className="mobile-form-group">
            <label className="mobile-label">Adrès</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-4 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={form.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="mobile-input pl-12"
                placeholder="Adrès founisè a"
              />
            </div>
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
                  <span>Sove Founisè</span>
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


