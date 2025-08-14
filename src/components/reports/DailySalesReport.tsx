import React, { useState, useEffect } from 'react';
import { 
  Calendar, Download, RefreshCw, Package, DollarSign, TrendingUp, 
  BarChart3, Award, Target, ShoppingCart, AlertTriangle, CheckCircle
} from 'lucide-react';
import { DailyReportsService, DailySalesReport as DailySalesReportType } from '../../services/dailyReportsService';
import { format } from 'date-fns';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';

interface DailySalesReportProps {
  onClose?: () => void;
}

export const DailySalesReport: React.FC<DailySalesReportProps> = ({ onClose }) => {
  const [report, setReport] = useState<DailySalesReportType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const { user } = useSupabaseAuth();
  const reportsService = new DailyReportsService();

  useEffect(() => {
    loadTodaysReport();
  }, []);

  const loadTodaysReport = async () => {
    setLoading(true);
    setError(null);

    const result = await reportsService.getTodaysSalesReport();
    
    if (result.success && result.report) {
      setReport(result.report);
    } else {
      setError(result.error || 'Error loading today\'s report');
    }
    
    setLoading(false);
  };

  const handleExport = async () => {
    setExporting(true);
    const result = await reportsService.exportTodaysReport();
    
    if (!result.success) {
      setError(result.error || 'Error exporting report');
    }
    
    setExporting(false);
  };

  const getStockStatusColor = (currentStock: number, quantitySold: number) => {
    if (currentStock === 0) return 'text-red-600 bg-red-100';
    if (currentStock <= 10) return 'text-orange-600 bg-orange-100';
    return 'text-green-600 bg-green-100';
  };

  const getStockStatusText = (currentStock: number) => {
    if (currentStock === 0) return 'Out of Stock';
    if (currentStock <= 10) return 'Low Stock';
    return 'In Stock';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="mobile-card">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading today's sales report...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="mobile-card">
          <div className="text-center py-12">
            <AlertTriangle className="w-16 h-16 text-red-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-600 mb-2">Error Loading Report</h3>
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={loadTodaysReport}
              className="btn-primary flex items-center space-x-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="space-y-6">
        <div className="mobile-card">
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-500 mb-2">No Report Data</h3>
            <p className="text-gray-400">No sales data available for today</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mobile-card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center">
              <Calendar className="w-7 h-7 mr-3 text-blue-600" />
              Today's Sales Report
            </h1>
            <p className="text-gray-600 mt-1">
              {format(new Date(), 'EEEE, MMMM dd, yyyy')}
            </p>
          </div>
          
          <div className="flex space-x-3 mt-4 md:mt-0">
            <button
              onClick={loadTodaysReport}
              disabled={loading}
              className="btn-secondary flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            
            <button
              onClick={handleExport}
              disabled={exporting}
              className="btn-primary flex items-center space-x-2"
            >
              {exporting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Sales</p>
                <p className="text-2xl font-bold text-blue-800">{report.totalSales}</p>
              </div>
              <ShoppingCart className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-green-50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Total Revenue</p>
                <p className="text-2xl font-bold text-green-800">$HT{report.totalRevenue.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Items Sold</p>
                <p className="text-2xl font-bold text-purple-800">{report.totalQuantitySold}</p>
              </div>
              <Package className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          
          <div className="bg-orange-50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">Avg Order</p>
                <p className="text-2xl font-bold text-orange-800">$HT{report.summary.averageOrderValue.toFixed(2)}</p>
              </div>
              <Target className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>
      </div>
      {/* Payment Breakdown */}
      <div className="mobile-card">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Payment Breakdown</h2>
        {Object.keys(report.summary.paymentBreakdown).length === 0 ? (
          <p className="text-gray-500">No payment data</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 text-sm">
            {Object.entries(report.summary.paymentBreakdown).map(([method, amount]) => (
              <div key={method} className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                <span className="font-medium text-gray-700">{method}</span>
                <span className="font-bold text-blue-600">$HT{(amount as number).toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hourly Distribution */}
      <div className="mobile-card">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Hourly Distribution</h2>
        {report.summary.hourlyDistribution.length === 0 ? (
          <p className="text-gray-500">No hourly data</p>
        ) : (
          <div className="space-y-2">
            {report.summary.hourlyDistribution.map((h) => (
              <div key={h.hour} className="flex items-center justify-between text-sm">
                <span className="text-gray-700 w-16">{h.hour}</span>
                <div className="flex-1 mx-3 h-2 bg-gray-200 rounded-full">
                  <div className="h-2 bg-blue-600 rounded-full" style={{ width: `${Math.min(100, (h.revenue / report.totalRevenue) * 100)}%` }}></div>
                </div>
                <span className="w-28 text-right font-medium text-green-600">$HT{h.revenue.toFixed(0)}</span>
              </div>
            ))}
          </div>
        )}
      </div>


      {/* Top Performers */}
      <div className="mobile-card">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Today's Top Performers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl p-4 text-white">
            <div className="flex items-center space-x-3">
              <Award className="w-8 h-8" />
              <div>
                <p className="text-yellow-100 text-sm">Top Selling Product</p>
                <p className="font-bold text-lg">{report.summary.topSellingProduct}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4 text-white">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-8 h-8" />
              <div>
                <p className="text-green-100 text-sm">Highest Revenue Product</p>
                <p className="font-bold text-lg">{report.summary.highestRevenueProduct}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Product Sales */}
      <div className="mobile-card">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2" />
          Product Sales Details
        </h2>
        
        {report.products.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No sales recorded today</p>
          </div>
        ) : (
          <div className="space-y-3">
            {report.products.map((product, index) => (
              <div key={product.productCode} className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-sm">#{index + 1}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">{product.productName}</h3>
                      <p className="text-sm text-gray-500">{product.productCode}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStockStatusColor(product.currentStock, product.quantitySold)}`}>
                      {getStockStatusText(product.currentStock)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Quantity Sold</p>
                    <p className="font-bold text-blue-600 text-lg">{product.quantitySold}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Total Amount</p>
                    <p className="font-bold text-green-600 text-lg">$HT{product.totalAmount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Avg Unit Price</p>
                    <p className="font-bold text-purple-600">$HT{product.unitPrice.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Current Stock</p>
                    <p className={`font-bold ${product.currentStock <= 10 ? 'text-red-600' : 'text-gray-800'}`}>
                      {product.currentStock}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>Sales Transactions: {product.salesCount}</span>
                    <span>Revenue per Unit: $HT{(product.totalAmount / product.quantitySold).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stock Alerts */}
      {report.products.some(p => p.currentStock <= 10) && (
        <div className="mobile-card">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
            Stock Alerts
          </h2>
          
          <div className="space-y-3">
            {report.products
              .filter(p => p.currentStock <= 10)
              .map((product) => (
                <div key={product.productCode} className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-800">{product.productName}</h3>
                      <p className="text-sm text-gray-600">{product.productCode}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-orange-600 font-bold">
                        {product.currentStock === 0 ? 'OUT OF STOCK' : `${product.currentStock} remaining`}
                      </p>
                      <p className="text-sm text-gray-600">Sold today: {product.quantitySold}</p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};