import React, { useState, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, Package, DollarSign, Percent, Download, RefreshCw, X, Maximize2, Minimize2,
  BarChart3, Grid3X3, Star, Award, Target, TrendingDown
} from 'lucide-react';
import { Logo } from '../Logo';
import { ReportsService, SalesByCategoryData, ReportsData } from '../../services/reportsService';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

interface SalesByCategoryWindowProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SalesByCategoryWindow: React.FC<SalesByCategoryWindowProps> = ({ isOpen, onClose }) => {
  const [reportData, setReportData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState(30);
  const [isMaximized, setIsMaximized] = useState(false);
  const [selectedView, setSelectedView] = useState<'overview' | 'detailed' | 'trends'>('overview');

  const reportsService = new ReportsService();

  useEffect(() => {
    if (isOpen) {
      loadReportData();
    }
  }, [isOpen, dateRange]);

  const loadReportData = async () => {
    setLoading(true);
    setError(null);

    const result = await reportsService.getSalesByCategory(dateRange);
    
    if (result.success && result.data) {
      setReportData(result.data);
    } else {
      setError(result.error || 'Erè nan chaje done yo');
    }
    
    setLoading(false);
  };

  const exportData = () => {
    if (!reportData) return;

    const csvContent = [
      ['RAPÒ VANT PA KATEGORI - DEB CARGO SHIPPING LLC'],
      ['Dat Rapò:', format(new Date(), 'yyyy-MM-dd HH:mm:ss')],
      ['Peryòd:', `${dateRange} jou ki sot pase yo`],
      ['Total Vant:', reportData.totalSales.toString()],
      ['Total Revni:', `$${reportData.totalRevenue.toFixed(2)}`],
      [''],
      ['DETAY PA KATEGORI'],
      ['Kategori', 'Kantite Vant', 'Total Revni', 'Kantite Pwodwi', 'Mwayèn Pri', 'Pousantaj', 'Top Pwodwi'],
      ...reportData.salesByCategory.map(category => [
        category.category,
        category.totalSales.toString(),
        `$${category.totalRevenue.toFixed(2)}`,
        category.totalQuantity.toString(),
        `$${category.averagePrice.toFixed(2)}`,
        `${category.percentage.toFixed(1)}%`,
        category.topProduct
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vant-pa-kategori-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex flex-col">
      <div className="flex-1 bg-white overflow-hidden">
        {/* Header */}
        <div className="mobile-header safe-area-top">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="tap-target rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
              <div className="flex items-center space-x-2">
                <Logo size="small" />
                <div>
                  <h1 className="text-lg font-bold text-white">Vant pa Kategori</h1>
                  <p className="text-xs text-blue-100">Analiz detaye</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={exportData}
                disabled={!reportData}
                className="tap-target rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors disabled:opacity-50"
              >
                <Download className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
          
          {/* Mobile Controls */}
          <div className="px-4 pb-4">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(parseInt(e.target.value))}
              className="w-full px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg border border-white border-opacity-30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
            >
              <option value={7} className="text-gray-800">7 jou ki sot pase yo</option>
              <option value={30} className="text-gray-800">30 jou ki sot pase yo</option>
              <option value={90} className="text-gray-800">90 jou ki sot pase yo</option>
              <option value={365} className="text-gray-800">1 ane ki sot pase a</option>
            </select>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
            {[
              { key: 'overview', label: 'Apèsi Jeneral', icon: BarChart3 },
              { key: 'detailed', label: 'Analiz Detaye', icon: Grid3X3 },
              { key: 'trends', label: 'Tandans ak Pèfòmans', icon: TrendingUp }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSelectedView(tab.key as any)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  selectedView === tab.key
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 safe-area-bottom">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Ap chaje done rapò yo...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
              <div className="text-red-600 mb-4">
                <Package className="w-16 h-16 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Erè nan chaje rapò a</h3>
                <p className="text-sm">{error}</p>
              </div>
              <button
                onClick={loadReportData}
                className="flex items-center space-x-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors mx-auto"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Eseye Ankò</span>
              </button>
            </div>
          ) : !reportData || reportData.salesByCategory.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
              <Package className="w-20 h-20 text-gray-300 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-gray-500 mb-3">Pa gen done vant</h3>
              <p className="text-gray-400 mb-4">Pa gen vant nan peryòd sa a ({dateRange} jou ki sot pase yo)</p>
              <button
                onClick={loadReportData}
                className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors mx-auto"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Rechèche Done yo</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Overview Tab */}
              {selectedView === 'overview' && (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
                      <div className="flex items-center justify-between mb-4">
                        <Package className="w-8 h-8 text-blue-100" />
                        <div className="text-right">
                          <p className="text-blue-100 text-sm font-medium">Total Vant</p>
                          <p className="text-3xl font-bold">{reportData.totalSales}</p>
                        </div>
                      </div>
                      <div className="text-blue-100 text-sm">
                        {dateRange} jou ki sot pase yo
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white">
                      <div className="flex items-center justify-between mb-4">
                        <DollarSign className="w-8 h-8 text-green-100" />
                        <div className="text-right">
                          <p className="text-green-100 text-sm font-medium">Total Revni</p>
                          <p className="text-3xl font-bold">$HT{reportData.totalRevenue.toFixed(0)}</p>
                        </div>
                      </div>
                      <div className="text-green-100 text-sm">
                        Mwayèn: $HT{(reportData.totalRevenue / reportData.totalSales).toFixed(2)}
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
                      <div className="flex items-center justify-between mb-4">
                        <Grid3X3 className="w-8 h-8 text-purple-100" />
                        <div className="text-right">
                          <p className="text-purple-100 text-sm font-medium">Kategori Aktif</p>
                          <p className="text-3xl font-bold">{reportData.salesByCategory.length}</p>
                        </div>
                      </div>
                      <div className="text-purple-100 text-sm">
                        Ak vant yo
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white">
                      <div className="flex items-center justify-between mb-4">
                        <Award className="w-8 h-8 text-orange-100" />
                        <div className="text-right">
                          <p className="text-orange-100 text-sm font-medium">Top Kategori</p>
                          <p className="text-lg font-bold">{reportData.salesByCategory[0]?.category || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="text-orange-100 text-sm">
                        $HT{reportData.salesByCategory[0]?.totalRevenue.toFixed(0) || '0'}
                      </div>
                    </div>
                  </div>

                  {/* Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Pie Chart */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                        <Percent className="w-5 h-5 mr-2 text-blue-600" />
                        Distribisyon Revni pa Kategori
                      </h3>
                      <ResponsiveContainer width="100%" height={350}>
                        <PieChart>
                          <Pie
                            data={reportData.salesByCategory}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ category, percentage }) => `${category} ${percentage.toFixed(1)}%`}
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="totalRevenue"
                          >
                            {reportData.salesByCategory.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => [`$HT${value.toFixed(2)}`, 'Revni']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Bar Chart */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                        <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
                        Kantite Vant ak Revni
                      </h3>
                      <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={reportData.salesByCategory}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="category" 
                            angle={-45}
                            textAnchor="end"
                            height={100}
                            fontSize={11}
                          />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="totalSales" fill="#8884d8" name="Kantite Vant" />
                          <Bar dataKey="totalRevenue" fill="#82ca9d" name="Revni ($)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </>
              )}

              {/* Detailed Tab */}
              {selectedView === 'detailed' && (
                <>
                  {/* Top Performers */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    {reportData.salesByCategory.slice(0, 3).map((category, index) => (
                      <div key={category.categoryId} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            ></div>
                            <h3 className="font-bold text-gray-800">{category.category}</h3>
                          </div>
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">
                            #{index + 1}
                          </span>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Vant:</span>
                            <span className="font-semibold">{category.totalSales}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Revni:</span>
                           <span className="font-semibold text-green-600">$HT{category.totalRevenue.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Pousantaj:</span>
                            <span className="font-semibold text-blue-600">{category.percentage.toFixed(1)}%</span>
                          </div>
                          <div className="pt-2 border-t border-gray-100">
                            <p className="text-xs text-gray-500">Top Pwodwi:</p>
                            <p className="text-sm font-medium text-gray-800">{category.topProduct || 'Pa gen done'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Detailed Table */}
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                      <Grid3X3 className="w-5 h-5 mr-2 text-purple-600" />
                      Tablo Detaye pa Kategori
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b-2 border-gray-200 bg-gray-50">
                            <th className="text-left py-4 px-4 font-semibold text-gray-700">Kategori</th>
                            <th className="text-right py-4 px-4 font-semibold text-gray-700">Vant</th>
                            <th className="text-right py-4 px-4 font-semibold text-gray-700">Revni</th>
                            <th className="text-right py-4 px-4 font-semibold text-gray-700">Kantite</th>
                            <th className="text-right py-4 px-4 font-semibold text-gray-700">Mwayèn Pri</th>
                            <th className="text-right py-4 px-4 font-semibold text-gray-700">Pousantaj</th>
                            <th className="text-left py-4 px-4 font-semibold text-gray-700">Top Pwodwi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.salesByCategory.map((category, index) => (
                            <tr key={category.categoryId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                              <td className="py-4 px-4">
                                <div className="flex items-center space-x-3">
                                  <div 
                                    className="w-4 h-4 rounded-full" 
                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                  ></div>
                                  <span className="font-medium">{category.category}</span>
                                </div>
                              </td>
                              <td className="py-4 px-4 text-right font-medium">{category.totalSales}</td>
                              <td className="py-4 px-4 text-right text-green-600 font-bold">
                                $HT{category.totalRevenue.toFixed(2)}
                              </td>
                              <td className="py-4 px-4 text-right">{category.totalQuantity}</td>
                             <td className="py-4 px-4 text-right">$HT{category.averagePrice.toFixed(2)}</td>
                              <td className="py-4 px-4 text-right">
                                <div className="flex items-center justify-end space-x-2">
                                  <div className="w-16 bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="h-2 rounded-full bg-blue-600" 
                                      style={{ width: `${Math.min(100, category.percentage)}%` }}
                                    ></div>
                                  </div>
                                  <span className="font-medium">{category.percentage.toFixed(1)}%</span>
                                </div>
                              </td>
                              <td className="py-4 px-4 text-sm text-gray-600 max-w-xs truncate">
                                {category.topProduct || 'Pa gen done'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {/* Trends Tab */}
              {selectedView === 'trends' && (
                <>
                  {/* Performance Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-600 text-sm">Pi Bon Kategori</p>
                          <p className="text-lg font-bold text-blue-600">{reportData.salesByCategory[0]?.category}</p>
                        </div>
                        <Star className="w-6 h-6 text-yellow-500" />
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-600 text-sm">Pi Wo Revni</p>
                          <p className="text-lg font-bold text-green-600">
                            $HT{Math.max(...reportData.salesByCategory.map(c => c.totalRevenue)).toFixed(0)}
                          </p>
                        </div>
                        <TrendingUp className="w-6 h-6 text-green-500" />
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-600 text-sm">Pi Wo Mwayèn</p>
                          <p className="text-lg font-bold text-purple-600">
                            $HT{Math.max(...reportData.salesByCategory.map(c => c.averagePrice)).toFixed(2)}
                          </p>
                        </div>
                        <Target className="w-6 h-6 text-purple-500" />
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-600 text-sm">Pi Ba Pèfòmans</p>
                          <p className="text-lg font-bold text-red-600">
                            {reportData.salesByCategory[reportData.salesByCategory.length - 1]?.category}
                          </p>
                        </div>
                        <TrendingDown className="w-6 h-6 text-red-500" />
                      </div>
                    </div>
                  </div>

                  {/* Comparison Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Revenue Comparison */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                      <h3 className="text-lg font-bold text-gray-800 mb-4">Konparezon Revni</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={reportData.salesByCategory}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="category" 
                            angle={-45}
                            textAnchor="end"
                            height={80}
                            fontSize={10}
                          />
                          <YAxis />
                          <Tooltip />
                          <Area 
                            type="monotone" 
                            dataKey="totalRevenue" 
                            stroke="#8884d8" 
                            fill="#8884d8" 
                            fillOpacity={0.6}
                            name="Revni ($)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Average Price Analysis */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                      <h3 className="text-lg font-bold text-gray-800 mb-4">Analiz Mwayèn Pri</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={reportData.salesByCategory}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="category" 
                            angle={-45}
                            textAnchor="end"
                            height={80}
                            fontSize={10}
                          />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="averagePrice" 
                            stroke="#82ca9d" 
                            strokeWidth={3}
                            name="Mwayèn Pri ($)"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Performance Analysis */}
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Analiz Pèfòmans ak Rekomandasyion</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-green-600 mb-3 flex items-center">
                          <TrendingUp className="w-4 h-4 mr-2" />
                          Kategori ki Pèfòme Byen
                        </h4>
                        <div className="space-y-2">
                          {reportData.salesByCategory.slice(0, 3).map((category, index) => (
                            <div key={category.categoryId} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                              <span className="font-medium">{category.category}</span>
                              <span className="text-green-600 font-bold">{category.percentage.toFixed(1)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-orange-600 mb-3 flex items-center">
                          <Target className="w-4 h-4 mr-2" />
                          Opòtinite Amelyorasyon
                        </h4>
                        <div className="space-y-2">
                          {reportData.salesByCategory.slice(-3).reverse().map((category, index) => (
                            <div key={category.categoryId} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                              <span className="font-medium">{category.category}</span>
                              <span className="text-orange-600 font-bold">{category.percentage.toFixed(1)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};