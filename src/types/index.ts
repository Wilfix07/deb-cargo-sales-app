export interface SalesRecord {
  id: string;
  productCode: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  customerName: string;
  paymentMethod: 'CASH' | 'CARD' | 'MOBILE' | 'OTHER';
  paymentReference?: string;
  timestamp: Date;
  scannedData?: string;
  scanType?: 'qr' | 'barcode' | 'manual';
  userId: string; // Link to user who created the record
}

export interface DashboardStats {
  totalSales: number;
  totalAmount: number;
  todaySales: number;
  todayAmount: number;
}

export type UserRole = 'Admin' | 'Manager' | 'Chef Teller' | 'Teller';

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  lastLogin?: Date;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
}

export interface RolePermissions {
  canViewAllSales: boolean;
  canDeleteSales: boolean;
  canExportData: boolean;
  canManageUsers: boolean;
  canViewReports: boolean;
  canResetData: boolean;
  canConfigureSettings: boolean;
  canViewProducts: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  'Admin': {
    canViewAllSales: true,        // Can view all sales
    canDeleteSales: true,         // Can delete sales
    canExportData: true,          // Can export data
    canManageUsers: true,         // Can manage users
    canViewReports: true,         // Can view reports
    canResetData: true,           // Can reset data
    canConfigureSettings: true,   // Can configure system
    canViewProducts: true         // Can view and manage products
  },
  'Manager': {
    canViewAllSales: true,        // Can view all sales
    canDeleteSales: true,         // Can delete sales
    canExportData: true,          // Can export data
    canManageUsers: false,        // Cannot manage users
    canViewReports: true,         // Can view reports
    canResetData: false,          // Cannot reset data
    canConfigureSettings: false,  // Cannot configure system
    canViewProducts: true         // Can view and manage products
  },
  'Chef Teller': {
    canViewAllSales: true,        // Can view all sales
    canDeleteSales: true,         // Can delete today's sales
    canExportData: true,          // Can export data
    canManageUsers: false,        // Cannot manage users
    canViewReports: true,         // Can view reports
    canResetData: false,          // Cannot reset data
    canConfigureSettings: false,  // Cannot configure system
    canViewProducts: false        // Cannot view products
  },
  'Teller': {
    canViewAllSales: false,       // Ka wè sèlman pwòp vant yo
    canDeleteSales: false,        // Pa ka efase vant yo
    canExportData: true,          // Ka ekspòte pwòp done yo
    canManageUsers: false,        // Pa ka jere itilizatè yo
    canViewReports: false,        // Pa ka wè rapò yo
    canResetData: false,          // Pa ka reset done yo
    canConfigureSettings: false,  // Pa ka konfigire sistèm nan
    canViewProducts: false        // Pa ka wè machandiz yo
  }
};

// Inventory permissions based on roles
export interface InventoryPermissions {
  canViewProducts: boolean;
  canCreateProducts: boolean;
  canUpdateProducts: boolean;
  canDeleteProducts: boolean;
  canManageCategories: boolean;
  canManageSuppliers: boolean;
  canManageStock: boolean;
  canViewStockMovements: boolean;
  canCreatePurchaseOrders: boolean;
  canManagePurchaseOrders: boolean;
}

export const INVENTORY_PERMISSIONS: Record<UserRole, InventoryPermissions> = {
  'Admin': {
    canViewProducts: true,           // Can view all products
    canCreateProducts: true,         // Can create products
    canUpdateProducts: true,         // Can update products
    canDeleteProducts: true,         // Can delete products
    canManageCategories: true,       // Can manage categories
    canManageSuppliers: true,        // Can manage suppliers
    canManageStock: true,            // Can manage stock
    canViewStockMovements: true,     // Can view stock movements
    canCreatePurchaseOrders: true,   // Can create purchase orders
    canManagePurchaseOrders: true    // Can manage purchase orders
  },
  'Manager': {
    canViewProducts: true,           // Can view all products
    canCreateProducts: true,         // Can create products
    canUpdateProducts: true,         // Can update products
    canDeleteProducts: false,        // Cannot delete products
    canManageCategories: true,       // Can manage categories
    canManageSuppliers: true,        // Can manage suppliers
    canManageStock: true,            // Can manage stock
    canViewStockMovements: true,     // Can view stock movements
    canCreatePurchaseOrders: true,   // Can create purchase orders
    canManagePurchaseOrders: true    // Can manage purchase orders
  },
  'Chef Teller': {
    canViewProducts: true,           // Can view all products
    canCreateProducts: false,        // Cannot create products
    canUpdateProducts: false,        // Cannot update products
    canDeleteProducts: false,        // Cannot delete products
    canManageCategories: false,      // Cannot manage categories
    canManageSuppliers: false,       // Cannot manage suppliers
    canManageStock: false,           // Cannot manage stock
    canViewStockMovements: true,     // Can view stock movements
    canCreatePurchaseOrders: false,  // Cannot create purchase orders
    canManagePurchaseOrders: false   // Cannot manage purchase orders
  },
  'Teller': {
    canViewProducts: false,          // Pa ka wè pwodwi yo
    canCreateProducts: false,        // Pa ka kreye pwodwi yo
    canUpdateProducts: false,        // Pa ka modifye pwodwi yo
    canDeleteProducts: false,        // Pa ka efase pwodwi yo
    canManageCategories: false,      // Pa ka jere kategori yo
    canManageSuppliers: false,       // Pa ka jere founisè yo
    canManageStock: false,           // Pa ka jere stock yo
    canViewStockMovements: false,    // Pa ka wè mouvman stock yo
    canCreatePurchaseOrders: false,  // Pa ka kreye kòmand yo
    canManagePurchaseOrders: false   // Pa ka jere kòmand yo
  }
};