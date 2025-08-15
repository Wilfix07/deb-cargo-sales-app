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
      <form onSubmit={onSubmit} className="mobile-form">
          <div className="mobile-form-group">
            <label className="mobile-label">Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={`mobile-input ${errors.name ? 'border-red-500' : ''}`}
              placeholder="Supplier name"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div className="mobile-form-group">
            <label className="mobile-label">Contact Person</label>
            <div className="relative">
              <Users className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={form.contact_person}
                onChange={(e) => handleChange('contact_person', e.target.value)}
                className="mobile-input pl-10"
                placeholder="Contact person"
              />
            </div>
          </div>

          <div className="mobile-form-group">
            <label className="mobile-label">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="mobile-input pl-10"
                placeholder="example@domain.com"
              />
            </div>
          </div>

          <div className="mobile-form-group">
            <label className="mobile-label">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="mobile-input pl-10"
                placeholder="(+509) 5555-5555"
              />
            </div>
          </div>

          <div className="mobile-form-group">
            <label className="mobile-label">Address</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={form.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="mobile-input pl-10"
                placeholder="Address"
              />
            </div>
          </div>

          <div className="flex flex-col space-y-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary w-full">Cancel</button>
            <button type="submit" className="btn-primary w-full flex items-center justify-center space-x-2" disabled={saving}>
              <Save className="w-5 h-5" />
              <span>{saving ? 'Saving...' : 'Save Supplier'}</span>
            </button>
          </div>
        </form>
      </MobileFormContainer>
  );
};


