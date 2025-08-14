import React, { useState, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { TrendingUp, Package, DollarSign, Percent, Download, RefreshCw } from 'lucide-react';
import { ReportsService, SalesByCategoryData, ReportsData } from '../../services/reportsService';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

interface SalesByCategoryReportProps {
  dateRange?: number;
}

export const SalesByCategoryReport: React.FC<SalesByCategoryReportProps> = ({ dateRange = 30 }) => {
  const [reportData, setReportData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reportsService = new ReportsService();

  useEffect(() => {
    loadReportData();
  }, [dateRange]);

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
    a.download = `sales-by-category-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-red-600 mb-4">
          <Package className="w-12 h-12 mx-auto mb-2" />
          <h3 className="text-lg font-semibold">Erè nan chaje rapò a</h3>
          <p className="text-sm">{error}</p>
        </div>
        <button
          onClick={loadReportData}
          className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors mx-auto"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Eseye Ankò</span>
        </button>
      </div>
    );
  }

  if (!reportData || reportData.salesByCategory.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-500 mb-2">Pa gen done vant</h3>
        <p className="text-gray-400">Pa gen vant nan peryòd sa a ({dateRange} jou ki sot pase yo)</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Summary */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Vant pa Kategori</h2>
            <p className="text-gray-600">
              Analiz vant yo selon kategori pwodwi yo ({dateRange} jou ki sot pase yo)
            </p>
          </div>
          <button
            onClick={exportData}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors mt-4 md:mt-0"
          >
            <Download className="w-4 h-4" />
            <span>Ekspòte</span>
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Vant</p>
                <p className="text-2xl font-bold text-blue-800">{reportData.totalSales}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Total Revni</p>
                <p className="text-2xl font-bold text-green-800">$HT{reportData.totalRevenue.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Kategori Aktif</p>
                <p className="text-2xl font-bold text-purple-800">{reportData.salesByCategory.length}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Distribisyon Revni pa Kategori</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={reportData.salesByCategory}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ category, percentage }) => `${category} ${percentage.toFixed(1)}%`}
                outerRadius={80}
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
          <h3 className="text-lg font-bold text-gray-800 mb-4">Kantite Vant pa Kategori</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportData.salesByCategory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="category" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalSales" fill="#8884d8" name="Kantite Vant" />
              <Bar dataKey="totalQuantity" fill="#82ca9d" name="Total Pwodwi Vann" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Detay pa Kategori</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Kategori</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Vant</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Revni</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Kantite</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Mwayèn Pri</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">%</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Top Pwodwi</th>
              </tr>
            </thead>
            <tbody>
              {reportData.salesByCategory.map((category, index) => (
                <tr key={category.categoryId} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></div>
                      <span className="font-medium">{category.category}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">{category.totalSales}</td>
                  <td className="py-3 px-4 text-right text-green-600 font-medium">
                    $HT{category.totalRevenue.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right">{category.totalQuantity}</td>
                  <td className="py-3 px-4 text-right">$HT{category.averagePrice.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right">
                    <span className="flex items-center justify-end space-x-1">
                      <Percent className="w-3 h-3" />
                      <span>{category.percentage.toFixed(1)}%</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {category.topProduct || 'Pa gen done'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Analiz Pèfòmans</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportData.salesByCategory.slice(0, 3).map((category, index) => (
            <div key={category.categoryId} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-800">{category.category}</h4>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  #{index + 1}
                </span>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <p>• {category.totalSales} vant ({category.percentage.toFixed(1)}% nan total la)</p>
                <p>• Mwayèn ${category.averagePrice.toFixed(2)} pa pwodwi</p>
                <p>• Top pwodwi: {category.topProduct}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};