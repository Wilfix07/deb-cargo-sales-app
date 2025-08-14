import React, { useEffect, useMemo, useState } from 'react';
import { SalesRecord } from '../types';
import { InventoryService } from '../services/inventoryService';
import { Product } from '../types/inventory';

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

  const inventoryService = new InventoryService();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex">
      <div className="bg-white w-full max-w-md mx-auto my-auto rounded-2xl overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">{editRecord ? 'Modifye Vant' : 'Sales Entry'}</h2>
          <button onClick={onClose} className="text-gray-600">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 text-sm p-2 rounded border border-red-200">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Product code</label>
            <input
              className="mobile-input"
              value={productCode}
              onChange={(e) => setProductCode(e.target.value)}
              placeholder="Enter or scan product code"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Search product</label>
            <input
              className="mobile-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type to search by name or code"
              autoComplete="off"
            />
            {filtered.length > 0 && (
              <div className="mt-1 max-h-48 overflow-y-auto border rounded">
                {filtered.slice(0, 12).map(p => (
                  <button key={p.id} type="button" onClick={() => applyProduct(p)} className="w-full text-left p-2 border-b last:border-b-0 hover:bg-blue-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">{p.name}</div>
                        <div className="text-xs text-gray-500">{p.code}{p.barcode ? ` • ${p.barcode}` : ''}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-green-600">$HT{p.unit_price.toFixed(2)}</div>
                        <div className="text-xs text-gray-500">Stock: {p.current_stock}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Quantity</label>
              <input
                type="number"
                min={1}
                className="mobile-input"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Unit price ($HT)</label>
              <input
                type="number"
                min={0}
                step={0.01}
                className="mobile-input"
                value={unitPrice}
                onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded border text-sm">
            <div className="flex justify-between">
              <span>Total</span>
              <span className="font-semibold text-green-700">$HT {(quantity * unitPrice || 0).toFixed(2)}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Customer name</label>
            <input className="mobile-input" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Payment method</label>
            <select className="mobile-input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as any)}>
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
              <option value="MOBILE">Mobile</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Payment reference (optional)</label>
            <input className="mobile-input" value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>{loading ? 'Saving...' : (editRecord ? 'Modifye Vant' : 'Save Sale')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};