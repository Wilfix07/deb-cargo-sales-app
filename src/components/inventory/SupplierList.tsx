import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, Edit, Trash2, Mail, Phone, MapPin } from 'lucide-react';
import { InventoryService } from '../../services/inventoryService';
import { Supplier } from '../../types/inventory';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';
import { INVENTORY_PERMISSIONS } from '../../types';

interface SupplierListProps {
  onNavigate: (view: string, data?: any) => void;
}

export const SupplierList: React.FC<SupplierListProps> = ({ onNavigate }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const { user } = useSupabaseAuth();
  const userPermissions = user ? INVENTORY_PERMISSIONS[user.role] : null;

  const inventoryService = new InventoryService();

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    setLoading(true);
    const result = await inventoryService.getSuppliers();
    if (result.success) {
      setSuppliers(result.suppliers!);
    }
    setLoading(false);
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!userPermissions?.canManageSuppliers) {
      alert('Ou pa gen otorizasyon pou efase founisè yo');
      return;
    }

    if (confirm('Ou kwè ou vle efase founisè sa a?')) {
      const result = await inventoryService.deleteSupplier(id);
      if (result.success) {
        setSuppliers(prev => prev.filter(s => s.id !== id));
      }
    }
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (supplier.contact_person && supplier.contact_person.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Founisè yo</h1>
          <p className="text-gray-600 mt-1">Jesyon founisè ak kontak yo</p>
        </div>
        
        {userPermissions?.canManageSuppliers && (
          <button
            onClick={() => onNavigate('add-supplier')}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg mt-4 md:mt-0"
          >
            <Plus className="w-5 h-5" />
            <span>Ajoute Founisè</span>
          </button>
        )}
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Chèche founisè..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSuppliers.map((supplier) => (
          <div
            key={supplier.id}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">{supplier.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      supplier.is_active 
                        ? 'text-green-600 bg-green-100' 
                        : 'text-gray-600 bg-gray-100'
                    }`}>
                      {supplier.is_active ? 'Aktif' : 'Pa Aktif'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                {supplier.contact_person && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    {supplier.contact_person}
                  </div>
                )}
                {supplier.email && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="w-4 h-4 mr-2" />
                    {supplier.email}
                  </div>
                )}
                {supplier.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="w-4 h-4 mr-2" />
                    {supplier.phone}
                  </div>
                )}
                {supplier.address && (
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    {supplier.address}
                  </div>
                )}
              </div>
              
              <div className="text-xs text-gray-500 mb-4">
                Kreye: {new Date(supplier.created_at).toLocaleDateString()}
              </div>
              
              {/* Actions */}
              {userPermissions?.canManageSuppliers && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => onNavigate('edit-supplier', supplier)}
                    className="flex-1 flex items-center justify-center space-x-1 bg-blue-50 text-blue-600 py-2 px-3 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    <span className="text-sm">Modifye</span>
                  </button>
                  <button
                    onClick={() => handleDeleteSupplier(supplier.id)}
                    className="flex items-center justify-center bg-red-50 text-red-600 py-2 px-3 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredSuppliers.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-500 mb-2">Pa gen founisè yo</h3>
          <p className="text-gray-400 mb-6">Kòmanse pa ajoute premye founisè ou an</p>
          {userPermissions?.canManageSuppliers && (
            <button
              onClick={() => onNavigate('add-supplier')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ajoute Founisè
            </button>
          )}
        </div>
      )}
    </div>
  );
};