import React, { useState } from 'react';
import { X, Save, Users, Mail, Phone, MapPin } from 'lucide-react';
import { InventoryService } from '../../services/inventoryService';

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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex flex-col">
      <div className="flex-1 bg-white overflow-hidden">
        <div className="mobile-header safe-area-top">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <button onClick={onClose} className="tap-target rounded-full hover:bg-white hover:bg-opacity-20 transition-colors">
                <X className="w-6 h-6 text-white" />
              </button>
              <div className="flex items-center space-x-2">
                <Users className="w-6 h-6 text-white" />
                <div>
                  <h1 className="text-lg font-bold text-white">Add Supplier</h1>
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
                placeholder="Supplier name"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Person</label>
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

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
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

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
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

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
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
          </div>

          <div className="sticky bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-gray-200 p-4">
            <div className="flex flex-col space-y-3">
              <button type="button" onClick={onClose} className="btn-secondary w-full">Cancel</button>
              <button type="submit" className="btn-primary w-full flex items-center justify-center space-x-2" disabled={saving}>
                <Save className="w-5 h-5" />
                <span>{saving ? 'Saving...' : 'Save Supplier'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};


