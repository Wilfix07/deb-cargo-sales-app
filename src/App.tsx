import React, { useState, useEffect } from 'react';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { PasswordResetForm } from './components/PasswordResetForm';
import { Dashboard } from './components/Dashboard';
import { SalesHistory } from './components/SalesHistory';
import { SalesForm } from './components/SalesForm';
import { Scanner } from './components/Scanner';
import { MobileHeader } from './components/MobileHeader';
import { MobileNavigation } from './components/MobileNavigation';
import { MobileBottomNav } from './components/MobileBottomNav';
import { PullToRefresh } from './components/PullToRefresh';
import { ReportsModal } from './components/reports/ReportsModal';
import { SalesByCategoryWindow } from './components/reports/SalesByCategoryWindow';
import { InventoryDashboard } from './components/inventory/InventoryDashboard';
import { ProductList } from './components/inventory/ProductList';
import { ProductForm } from './components/inventory/ProductForm';
import { CategoryList } from './components/inventory/CategoryList';
import { CategoryForm } from './components/inventory/CategoryForm';
import { SupplierList } from './components/inventory/SupplierList';
import { SupplierForm } from './components/inventory/SupplierForm';
import { AdminPanel } from './components/AdminPanel';
import { StockMovementForm } from './components/inventory/StockMovementForm';
import { DailySalesReport } from './components/reports/DailySalesReport';
import { StockOverview } from './components/inventory/StockOverview';
import { useSupabaseAuth } from './hooks/useSupabaseAuth';
import { useRealtimeStock } from './hooks/useRealtimeStock';
import { useRealtimeSales } from './hooks/useRealtimeSales';
import { useLocalStorage } from './hooks/useLocalStorage';
import { SalesRecord, DashboardStats, UserRole } from './types';
import { ROLE_PERMISSIONS, INVENTORY_PERMISSIONS } from './types';
import { InventoryService } from './services/inventoryService';
import { format } from 'date-fns';
import { Calendar, Package, Shield } from 'lucide-react';

type ViewType = 'dashboard' | 'history' | 'inventory' | 'settings' | 'reports' | 
                'products' | 'categories' | 'suppliers' | 'add-product' | 'edit-product' |
                'add-category' | 'edit-category' | 'add-supplier' | 'edit-supplier' | 'admin' |
                'stock-movement' | 'low-stock' | 'daily-report' | 'stock-overview';

function App() {
  // Authentication state
  const { user, login, register, logout, loading: authLoading, error: authError, clearError, salesService, resetPassword, updatePassword } = useSupabaseAuth();
  
  // Real-time data hooks
  const { products, loading: productsLoading, refreshProducts } = useRealtimeStock();
  const { salesRecords, dashboardStats, loading: salesLoading, refreshSales } = useRealtimeSales(user?.id, user?.role);
  
  // App state
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'reset'>('login');
  const [showScanner, setShowScanner] = useState(false);
  const [showSalesForm, setShowSalesForm] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [showCategoryReportModal, setShowCategoryReportModal] = useState(false);
  const [showStockMovementForm, setShowStockMovementForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SalesRecord | null>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [scannedData, setScannedData] = useState<string>('');
  const [scanType, setScanType] = useState<'qr' | 'barcode' | 'manual'>('manual');
  const [dataError, setDataError] = useState<string | null>(null);
  const [isNavOpen, setIsNavOpen] = useState(false);

  // Services
  const inventoryService = new InventoryService();

  // Check for password reset in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (window.location.pathname === '/reset-password' || urlParams.get('type') === 'recovery') {
      setAuthMode('reset');
    }
  }, []);

  // Load data when user logs in
  useEffect(() => {
    if (user) {
      refreshSales();
      refreshProducts();
    }
  }, [user]);

  const loadDashboardData = async () => {
    await Promise.all([refreshSales(), refreshProducts()]);
  };

  const handleScanSuccess = (result: string, format: string) => {
    setScannedData(result);
    setScanType(format === 'qr' ? 'qr' : 'barcode');
    setShowScanner(false);
    setShowSalesForm(true);
  };

  const handleSaveSale = async (record: Omit<SalesRecord, 'id' | 'timestamp'>) => {
    console.log('App: handleSaveSale called with record:', record);
    console.log('App: Current user:', user);
    
    if (!user) return { success: false, error: 'User not authenticated' };

    const recordWithUser = {
      ...record,
      userId: user.id
    };
    
    console.log('App: Record with user ID:', recordWithUser);

    try {
      if (editingRecord) {
        // Update existing record
        console.log('App: Calling salesService.updateSalesRecord with:', editingRecord.id, recordWithUser);
        const result = await salesService.updateSalesRecord(editingRecord.id, recordWithUser);
        console.log('App: updateSalesRecord result:', result);
        
        if (result.success) {
          await loadDashboardData();
          setShowSalesForm(false);
          setEditingRecord(null);
          return { success: true };
        } else {
          setDataError(result.error || 'Erè nan modifye vant la');
          return { success: false, error: result.error || 'Erè nan modifye vant la' };
        }
      } else {
        // Create new record
        console.log('App: Calling salesService.createSalesRecord with:', recordWithUser);
        const result = await salesService.createSalesRecord(recordWithUser);
        console.log('App: createSalesRecord result:', result);
        
        if (result.success) {
          await refreshSales();
          setShowSalesForm(false);
          setScannedData('');
          setScanType('manual');
          return { success: true };
        } else {
          setDataError(result.error || 'Erè nan sove vant la');
          return { success: false, error: result.error || 'Erè nan sove vant la' };
        }
      }
    } catch (error) {
      console.error('Error in handleSaveSale:', error);
      const errorMessage = 'An unexpected error occurred while saving the sale';
      setDataError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!user) return;

    const result = await salesService.deleteSalesRecord(recordId);
    if (result.success) {
      await refreshSales();
    } else {
      setDataError(result.error || 'Erè nan efase dosye a');
    }
  };

  const handleEditRecord = (record: SalesRecord) => {
    setEditingRecord(record);
    setShowSalesForm(true);
  };

  const handleExportData = () => {
    const csvContent = [
      ['Date', 'Product Code', 'Product Name', 'Quantity', 'Unit Price', 'Total', 'Customer', 'Payment Method', 'Payment Ref', 'Scan Type', 'User'],
      ...salesRecords.map(record => [
        format(record.timestamp, 'yyyy-MM-dd HH:mm:ss'),
        record.productCode,
        record.productName,
        record.quantity.toString(),
        record.unitPrice.toFixed(2),
        record.totalAmount.toFixed(2),
        record.customerName,
        record.paymentMethod,
        record.paymentReference || '',
        record.scanType || 'manual',
        user?.fullName || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-data-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleInventoryNavigation = (view: string, data?: any) => {
    switch (view) {
      case 'add-product':
        setEditingProduct(null);
        setShowProductForm(true);
        break;
      case 'add-supplier':
        setShowSupplierForm(true);
        break;
      case 'add-category':
        setShowCategoryForm(true);
        break;
      case 'edit-product':
        setEditingProduct(data);
        setShowProductForm(true);
        break;
      case 'stock-movement':
        setShowStockMovementForm(true);
        break;
      case 'reports':
        setShowReportsModal(true);
        break;
      default:
        setCurrentView(view as ViewType);
    }
  };

  const handleSaveProduct = async (productData: any) => {
    if (editingProduct) {
      const result = await inventoryService.updateProduct(editingProduct.id, productData);
      if (result.success) {
        setShowProductForm(false);
        setEditingProduct(null);
      }
    } else {
      const result = await inventoryService.createProduct(productData);
      if (result.success) {
        setShowProductForm(false);
      }
    }
  };

  const handleSaveStockMovement = async (movementData: any) => {
    const result = await inventoryService.createStockMovement(movementData);
    if (result.success) {
      setShowStockMovementForm(false);
    }
  };

  const userPermissions = user ? ROLE_PERMISSIONS[user.role] : null;
  const inventoryPermissions = user ? INVENTORY_PERMISSIONS[user.role] : null;

  // Show password reset form if in reset mode
  if (authMode === 'reset') {
    return <PasswordResetForm />;
  }

  // Show authentication forms if not logged in
  if (!user) {
    if (authMode === 'register') {
      return (
        <RegisterForm
          onRegister={register}
          onSwitchToLogin={() => {
            setAuthMode('login');
            clearError();
          }}
          loading={authLoading}
          error={authError}
        />
      );
    }

    return (
      <LoginForm
        onLogin={login}
        onSwitchToRegister={() => {
          setAuthMode('register');
          clearError();
        }}
        onResetPassword={resetPassword}
        loading={authLoading}
        error={authError}
        userRole={user?.role}
      />
    );
  }

  // Main app content
  const renderMainContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <Dashboard stats={dashboardStats} userRole={user.role} />
            
            {/* Quick Actions for Mobile */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setShowScanner(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-center space-y-3"
              >
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M12 12h-4.01M12 12v4m6-4h.01M12 8h.01M12 8h4.01M12 8h-4.01" />
                  </svg>
                </div>
                <span className="font-semibold text-lg">
                  {user.role === 'Teller' ? 'Scan Pwodwi' : 'Scan Product'}
                </span>
              </button>
              
              <button
                onClick={() => setShowSalesForm(true)}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-center space-y-3"
              >
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <span className="font-semibold text-lg">
                  {user.role === 'Teller' ? 'Ajoute Vant' : 'Add Sale'}
                </span>
              </button>
            </div>

            {/* Recent Sales Preview */}
            {salesRecords.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-800">
                    {user.role === 'Teller' ? 'Vant Resan yo' : 'Recent Sales'}
                  </h3>
                  <button
                    onClick={() => setCurrentView('history')}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    {user.role === 'Teller' ? 'Wè Tout' : 'View All'}
                  </button>
                </div>
                <div className="space-y-3">
                  {salesRecords.slice(0, 3).map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-800">{record.productName}</p>
                        <p className="text-sm text-gray-500">{record.customerName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">$HT{record.totalAmount.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">{format(record.timestamp, 'HH:mm')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Admin/Manager Quick Reports */}
            {(user.role === 'Admin' || user.role === 'Manager') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setCurrentView('daily-report')}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-left"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Today's Sales Report</h3>
                      <p className="text-indigo-100 text-sm">Detailed daily analysis</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setCurrentView('stock-overview')}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-left"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                      <Package className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Stock Overview</h3>
                      <p className="text-emerald-100 text-sm">Current inventory levels</p>
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>
        );

      case 'history':
        return (
          <SalesHistory
            records={salesRecords}
            onDeleteRecord={handleDeleteRecord}
            onEditRecord={handleEditRecord}
            onExportData={handleExportData}
            canDelete={userPermissions?.canDeleteSales || false}
            canExport={userPermissions?.canExportData || false}
            userRole={user.role}
          />
        );

      case 'inventory':
        return <InventoryDashboard onNavigate={handleInventoryNavigation} />;

      case 'products':
        return <ProductList onNavigate={handleInventoryNavigation} />;

      case 'categories':
        return <CategoryList onNavigate={handleInventoryNavigation} />;

      case 'suppliers':
        return <SupplierList onNavigate={handleInventoryNavigation} />;

      case 'admin':
        return <AdminPanel />;

      case 'daily-report':
        return <DailySalesReport />;

      case 'stock-overview':
        return <StockOverview onNavigate={handleInventoryNavigation} />;

      case 'settings':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                {user.role === 'Teller' ? 'Paramèt' : 'Settings'}
              </h2>
              
              {/* User Info */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-800 mb-2">
                  {user.role === 'Teller' ? 'Enfòmasyon Itilizatè' : 'User Information'}
                </h3>
                <div className="space-y-2 text-sm">
                  <p><strong>{user.role === 'Teller' ? 'Non:' : 'Name:'}</strong> {user.fullName}</p>
                  <p><strong>{user.role === 'Teller' ? 'Non itilizatè:' : 'Username:'}</strong> {user.username}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>{user.role === 'Teller' ? 'Wòl:' : 'Role:'}</strong> {user.role}</p>
                </div>
              </div>

              {/* Admin Panel Access */}
              {user.role === 'Admin' && (
                <div className="mb-6">
                  <button
                    onClick={() => setCurrentView('admin')}
                    className="w-full bg-gradient-to-r from-red-600 to-pink-600 text-white p-4 rounded-lg hover:from-red-700 hover:to-pink-700 transition-all flex items-center justify-center space-x-2"
                  >
                    <Shield className="w-5 h-5" />
                    <span>Admin Panel</span>
                  </button>
                </div>
              )}

              {/* App Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2">
                  {user.role === 'Teller' ? 'Enfòmasyon App' : 'App Information'}
                </h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><strong>{user.role === 'Teller' ? 'Vèsyon:' : 'Version:'}</strong> 1.0.0</p>
                  <p><strong>{user.role === 'Teller' ? 'Konpanyi:' : 'Company:'}</strong> DEB CARGO SHIPPING LLC</p>
                  <p><strong>{user.role === 'Teller' ? 'Sistèm:' : 'System:'}</strong> Sales Data Collection</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'reports':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">
                {user.role === 'Teller' ? 'Rapò yo' : 'Reports'}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setShowReportsModal(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-xl hover:shadow-lg transition-all duration-300 text-left"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">
                        {user.role === 'Teller' ? 'Rapò Konplè' : 'Comprehensive Reports'}
                      </h3>
                      <p className="text-blue-100 text-sm">
                        {user.role === 'Teller' ? 'Analiz ak rapò detaye' : 'Detailed analytics and reports'}
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setShowCategoryReportModal(true)}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-xl hover:shadow-lg transition-all duration-300 text-left"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">
                        {user.role === 'Teller' ? 'Vant pa Kategori' : 'Sales by Category'}
                      </h3>
                      <p className="text-green-100 text-sm">
                        {user.role === 'Teller' ? 'Analiz vant yo pa kategori' : 'Category-based sales analysis'}
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-gray-500">
              {user.role === 'Teller' ? 'Paj sa a pa disponib' : 'Page not available'}
            </h3>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Mobile Header */}
      <MobileHeader
        user={user}
        onLogout={logout}
        title={
          currentView === 'dashboard' ? (user.role === 'Teller' ? 'Dashboard' : 'Dashboard') :
          currentView === 'history' ? (user.role === 'Teller' ? 'Istwa Vant' : 'Sales History') :
          currentView === 'inventory' ? (user.role === 'Teller' ? 'Stock' : 'Inventory') :
          currentView === 'products' ? (user.role === 'Teller' ? 'Pwodwi yo' : 'Products') :
          currentView === 'categories' ? (user.role === 'Teller' ? 'Kategori yo' : 'Categories') :
          currentView === 'suppliers' ? (user.role === 'Teller' ? 'Founisè yo' : 'Suppliers') :
         currentView === 'admin' ? 'Admin Panel' :
          currentView === 'settings' ? (user.role === 'Teller' ? 'Paramèt' : 'Settings') :
          currentView === 'reports' ? (user.role === 'Teller' ? 'Rapò yo' : 'Reports') :
          'DEB CARGO'
        }
        showBack={currentView !== 'dashboard'}
        onBackClick={() => setCurrentView('dashboard')}
        onMenuClick={() => setIsNavOpen(true)}
      />

      {/* Main Content with Pull to Refresh */}
      <main className="pb-20 pt-4 flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 max-w-md">
          <PullToRefresh onRefresh={loadDashboardData}>
            {dataError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{dataError}</p>
                <button
                  onClick={() => setDataError(null)}
                  className="text-red-600 hover:text-red-700 text-xs mt-2"
                >
                  {user.role === 'Teller' ? 'Fèmen' : 'Dismiss'}
                </button>
              </div>
            )}

            {(salesLoading || productsLoading) ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">
                    {user.role === 'Teller' ? 'Ap chaje done yo...' : 'Loading data...'}
                  </p>
                </div>
              </div>
            ) : (
              renderMainContent()
            )}
          </PullToRefresh>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        activeView={currentView}
        onViewChange={setCurrentView}
        onScanClick={() => setShowScanner(true)}
        onAddClick={() => setShowSalesForm(true)}
        userRole={user.role}
        userPermissions={inventoryPermissions}
      />

      {/* Side Navigation (Hamburger) */}
      <MobileNavigation
        activeView={currentView}
        onViewChange={setCurrentView}
        onScanClick={() => setShowScanner(true)}
        onAddClick={() => setShowSalesForm(true)}
        onLogout={logout}
        user={user}
        isOpen={isNavOpen}
        onClose={() => setIsNavOpen(false)}
      />

      {/* Modals and Overlays */}
      {showScanner && (
        <Scanner
          onScanSuccess={handleScanSuccess}
          onClose={() => setShowScanner(false)}
        />
      )}

      {showSalesForm && (
        <SalesForm
          onSave={handleSaveSale}
          onClose={() => {
            setShowSalesForm(false);
            setEditingRecord(null);
            setScannedData('');
            setScanType('manual');
          }}
          scannedData={scannedData}
          scanType={scanType}
          editRecord={editingRecord}
        />
      )}

      {showProductForm && (
        <ProductForm
          product={editingProduct}
          onSave={handleSaveProduct}
          onClose={() => {
            setShowProductForm(false);
            setEditingProduct(null);
          }}
        />
      )}

      {showSupplierForm && (
        <SupplierForm
          onClose={() => setShowSupplierForm(false)}
          onSaved={() => {
            // optionally refresh suppliers view if needed
          }}
        />
      )}

      {showStockMovementForm && (
        <StockMovementForm
          onSave={handleSaveStockMovement}
          onClose={() => setShowStockMovementForm(false)}
        />
      )}

      {showCategoryForm && (
        <CategoryForm
          onClose={() => setShowCategoryForm(false)}
          onSaved={() => {
            // optionally refresh categories view
          }}
        />
      )}

      {showReportsModal && (
        <ReportsModal
          isOpen={showReportsModal}
          onClose={() => setShowReportsModal(false)}
        />
      )}

      {showCategoryReportModal && (
        <SalesByCategoryWindow
          isOpen={showCategoryReportModal}
          onClose={() => setShowCategoryReportModal(false)}
        />
      )}
    </div>
  );
}

export default App;