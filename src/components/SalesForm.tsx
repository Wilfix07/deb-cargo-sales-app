import React, { useEffect, useMemo, useState } from 'react';
import { SalesRecord } from '../types';
import { InventoryService } from '../services/inventoryService';
import { Product } from '../types/inventory';
import { MobileFormContainer } from './MobileFormContainer';

interface SalesFormProps {
  onSave: (record: Omit<SalesRecord, 'id' | 'timestamp'>) => Promise<{ success: boolean; error?: string }>;
  onClose: () => void;
  scannedData?: string;
  scanType?: 'qr' | 'barcode' | 'manual';
  editRecord?: SalesRecord;
}

export const SalesForm: React.FC<SalesFormProps> = ({
  onSave,
  onClose,
  scannedData,
  scanType = 'manual',
  editRecord
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [productCode, setProductCode] = useState<string>(editRecord?.productCode || scannedData || '');
  const [productName, setProductName] = useState<string>(editRecord?.productName || '');
  const [unitPrice, setUnitPrice] = useState<number>(editRecord?.unitPrice || 0);
  const [quantity, setQuantity] = useState<number>(editRecord?.quantity || 1);
  const [customerName, setCustomerName] = useState<string>(editRecord?.customerName || '');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'MOBILE' | 'OTHER'>(editRecord?.paymentMethod || 'CASH');
  const [paymentReference, setPaymentReference] = useState<string>(editRecord?.paymentReference || '');

  const inventoryService = useMemo(() => new InventoryService(), []);

  useEffect(() => {
    const load = async () => {
      const result = await inventoryService.getProducts();
      if (result.success && result.products) setProducts(result.products.filter(p => p.is_active));
    };
    load();
  }, []);

  useEffect(() => {
    if (!scannedData) return;
    setProductCode(scannedData);
    const found = products.find(p => p.code === scannedData || p.barcode === scannedData);
    if (found) applyProduct(found);
  }, [scannedData, products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [] as Product[];
    return products.filter(p => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q));
  }, [products, search]);

  const applyProduct = (p: Product) => {
    setProductCode(p.code);
    setProductName(p.name);
    setUnitPrice(p.unit_price);
    setSearch('');
  };

  const validate = (): string | null => {
    if (!productCode) return 'Product code is required';
    if (quantity <= 0) return 'Quantity must be greater than 0';
    if (unitPrice <= 0) return 'Unit price must be greater than 0';
    if (!customerName.trim()) return 'Customer name is required';
    return null;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setLoading(true);
    setError(null);
    const totalAmount = quantity * unitPrice;
    const payload: Omit<SalesRecord, 'id' | 'timestamp'> = {
      productCode,
      productName,
      quantity,
      unitPrice,
      totalAmount,
      customerName,
      paymentMethod,
      paymentReference: paymentReference || undefined,
      scannedData,
      scanType,
      userId: editRecord?.userId || ''
    };
    const res = await onSave(payload);
    setLoading(false);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Failed to save sale');
    }
  };

  return (
    <MobileFormContainer
      title={editRecord ? 'Modifye Vant' : 'Sales Entry'}
      onClose={onClose}
      onSave={() => handleSubmit()}
      enableSwipeNavigation={true}
      scrollToTopOnMount={true}
    >
      <div className="mobile-form-section">
        <div className="mobile-form-header">
          <h2 className="mobile-form-title">
            {editRecord ? 'Modifye Vant' : 'Nouvo Vant'}
          </h2>
          <p className="mobile-form-subtitle">
            {editRecord ? 'Modifye enfòmasyon vant la' : 'Antre enfòmasyon pou nouvo vant la'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mobile-form">
          {error && (
            <div className="mobile-alert-error mb-4">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            </div>
          )}

          <div className="mobile-form-group">
            <label className="mobile-label required">Kòd Pwodwi</label>
            <div className="relative">
              <svg className="absolute left-3 top-4 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
              </svg>
              <input
                className="mobile-input pl-12"
                value={productCode}
                onChange={(e) => setProductCode(e.target.value)}
                placeholder="Antre oswa scan kòd pwodwi a"
              />
            </div>
            <p className="mobile-label-helper">Ou ka tape kòd la oswa sèvi ak scanner</p>
          </div>

          <div className="mobile-form-group">
            <label className="mobile-label">Chèche Pwodwi</label>
            <div className="relative">
              <svg className="absolute left-3 top-4 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                className="mobile-input pl-12"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Chèche pa non oswa kòd"
                autoComplete="off"
              />
            </div>
            <p className="mobile-label-helper">Tape pou chèche pwodwi yo</p>
            {filtered.length > 0 && (
              <div className="mt-3 max-h-64 overflow-y-auto border-2 border-gray-100 rounded-xl">
                {filtered.slice(0, 8).map(p => (
                  <button 
                    key={p.id} 
                    type="button" 
                    onClick={() => applyProduct(p)} 
                    className="w-full text-left p-4 border-b border-gray-100 last:border-b-0 hover:bg-blue-50 transition-colors tap-target"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-gray-800">{p.name}</div>
                        <div className="text-xs text-gray-500 mt-1">{p.code}{p.barcode ? ` • ${p.barcode}` : ''}</div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-sm font-bold text-green-600">${p.unit_price.toFixed(2)}</div>
                        <div className="text-xs text-gray-500">Stock: {p.current_stock}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mobile-form-divider">
            <span>Detalye Pwodwi</span>
          </div>

          <div className="mobile-form-row">
            <div className="mobile-form-group">
              <label className="mobile-label required">Kantite</label>
              <div className="relative">
                <svg className="absolute left-3 top-4 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
                <input
                  type="number"
                  min={1}
                  className="mobile-input pl-12"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                  placeholder="1"
                />
              </div>
            </div>
            <div className="mobile-form-group">
              <label className="mobile-label required">Pri Inite ($)</label>
              <div className="relative">
                <span className="absolute left-3 top-4 text-gray-400 font-medium">$</span>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  className="mobile-input pl-10"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <div className="mobile-card bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200">
            <div className="mobile-card-content">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  <span className="text-lg font-semibold text-gray-700">Total</span>
                </div>
                <span className="text-2xl font-bold text-green-700">${(quantity * unitPrice || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="mobile-form-divider">
            <span>Enfòmasyon Kliyan</span>
          </div>

          <div className="mobile-form-group">
            <label className="mobile-label required">Non Kliyan</label>
            <div className="relative">
              <svg className="absolute left-3 top-4 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <input 
                className="mobile-input pl-12" 
                value={customerName} 
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Antre non kliyan an"
              />
            </div>
          </div>

          <div className="mobile-form-group">
            <label className="mobile-label required">Metòd Peman</label>
            <div className="relative">
              <svg className="absolute left-3 top-4 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <select className="mobile-input pl-12" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as 'CASH' | 'CARD' | 'MOBILE' | 'OTHER')}>
                <option value="CASH">Kach</option>
                <option value="CARD">Kat</option>
                <option value="MOBILE">Telefòn</option>
                <option value="OTHER">Lòt</option>
              </select>
            </div>
          </div>

          <div className="mobile-form-group">
            <label className="mobile-label">Referans Peman (opsyonèl)</label>
            <div className="relative">
              <svg className="absolute left-3 top-4 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <input 
                className="mobile-input pl-12" 
                value={paymentReference} 
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="Referans oswa nòt"
              />
            </div>
            <p className="mobile-label-helper">Nimewo chèk, transpaksyon, oswa lòt referans</p>
          </div>

          <div className="flex flex-col gap-4 pt-6">
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Ap sove...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{editRecord ? 'Modifye Vant' : 'Sove Vant'}</span>
                </div>
              )}
            </button>
            <button type="button" className="btn-secondary w-full" onClick={onClose} disabled={loading}>
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