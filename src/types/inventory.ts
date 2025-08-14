export interface Product {
  id: string;
  code: string;
  name: string;
  description?: string;
  category_id: string;
  supplier_id?: string;
  unit_price: number;
  cost_price: number;
  current_stock: number;
  min_stock_level: number;
  max_stock_level: number;
  unit_of_measure: string;
  barcode?: string;
  image_url?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  is_active: boolean;
  created_at: Date;
}

export interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  is_active: boolean;
  created_at: Date;
}

export interface StockMovement {
  id: string;
  product_id: string;
  movement_type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  unit_cost?: number;
  reference_number?: string;
  notes?: string;
  user_id: string;
  created_at: Date;
}

export interface PurchaseOrder {
  id: string;
  order_number: string;
  supplier_id: string;
  status: 'DRAFT' | 'SENT' | 'RECEIVED' | 'CANCELLED';
  order_date: Date;
  expected_date?: Date;
  received_date?: Date;
  total_amount: number;
  notes?: string;
  user_id: string;
  created_at: Date;
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  product_id: string;
  quantity_ordered: number;
  quantity_received: number;
  unit_cost: number;
  total_cost: number;
}

export interface InventoryStats {
  totalProducts: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalCategories: number;
  totalSuppliers: number;
}