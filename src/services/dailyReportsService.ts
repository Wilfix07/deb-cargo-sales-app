import { supabase } from '../lib/supabase';
import { format, startOfDay, endOfDay } from 'date-fns';

export interface DailySalesReportItem {
  productCode: string;
  productName: string;
  quantitySold: number;
  totalAmount: number;
  unitPrice: number;
  currentStock: number;
  stockAfterSales: number;
  salesCount: number;
}

export interface DailySalesReport {
  date: string;
  totalSales: number;
  totalRevenue: number;
  totalQuantitySold: number;
  products: DailySalesReportItem[];
  summary: {
    topSellingProduct: string;
    highestRevenueProduct: string;
    averageOrderValue: number;
    totalTransactions: number;
    paymentBreakdown: Record<string, number>;
    hourlyDistribution: Array<{ hour: string; sales: number; revenue: number }>
  };
}

export class DailyReportsService {
  async getTodaysSalesReport(): Promise<{ success: boolean; report?: DailySalesReport; error?: string }> {
    try {
      const today = new Date();
      const startOfToday = startOfDay(today);
      const endOfToday = endOfDay(today);

      // Get today's sales records
      const { data: salesRecords, error: salesError } = await supabase
        .from('sales_records')
        .select('*')
        .gte('created_at', startOfToday.toISOString())
        .lte('created_at', endOfToday.toISOString())
        .order('created_at', { ascending: false });

      if (salesError) {
        console.error('Error fetching today\'s sales:', salesError);
        return { success: false, error: 'Error fetching today\'s sales data' };
      }

      // Get all products to get current stock levels
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*');

      if (productsError) {
        console.error('Error fetching products:', productsError);
        return { success: false, error: 'Error fetching product data' };
      }

      // Process sales data by product
      const productSalesMap = new Map<string, {
        productCode: string;
        productName: string;
        quantitySold: number;
        totalAmount: number;
        salesCount: number;
        unitPrices: number[];
      }>();

      let totalRevenue = 0;
      let totalQuantitySold = 0;
      const paymentBreakdown: Record<string, number> = {};
      const hourlyMap = new Map<string, { sales: number; revenue: number }>();

      salesRecords.forEach(sale => {
        const key = sale.product_code;
        
        if (!productSalesMap.has(key)) {
          productSalesMap.set(key, {
            productCode: sale.product_code,
            productName: sale.product_name,
            quantitySold: 0,
            totalAmount: 0,
            salesCount: 0,
            unitPrices: []
          });
        }

        const productData = productSalesMap.get(key)!;
        productData.quantitySold += sale.quantity;
        productData.totalAmount += sale.total_amount;
        productData.salesCount += 1;
        productData.unitPrices.push(sale.unit_price);

        totalRevenue += sale.total_amount;
        totalQuantitySold += sale.quantity;

        const pm = sale.payment_method || 'CASH';
        paymentBreakdown[pm] = (paymentBreakdown[pm] || 0) + sale.total_amount;

        const hr = new Date(sale.created_at).getHours();
        const hourKey = `${hr.toString().padStart(2, '0')}:00`;
        if (!hourlyMap.has(hourKey)) hourlyMap.set(hourKey, { sales: 0, revenue: 0 });
        const hd = hourlyMap.get(hourKey)!;
        hd.sales += 1;
        hd.revenue += sale.total_amount;
      });

      // Create report items
      const reportItems: DailySalesReportItem[] = Array.from(productSalesMap.values()).map(productSale => {
        const product = products.find(p => p.code === productSale.productCode);
        const currentStock = product?.current_stock || 0;
        const averageUnitPrice = productSale.unitPrices.reduce((sum, price) => sum + price, 0) / productSale.unitPrices.length;

        return {
          productCode: productSale.productCode,
          productName: productSale.productName,
          quantitySold: productSale.quantitySold,
          totalAmount: productSale.totalAmount,
          unitPrice: averageUnitPrice,
          currentStock: currentStock,
          stockAfterSales: currentStock, // Current stock already reflects sales
          salesCount: productSale.salesCount
        };
      }).sort((a, b) => b.totalAmount - a.totalAmount); // Sort by revenue

      // Calculate summary
      const topSellingProduct = reportItems.reduce((top, current) => 
        current.quantitySold > top.quantitySold ? current : top, 
        reportItems[0] || { productName: 'N/A', quantitySold: 0 }
      );

      const highestRevenueProduct = reportItems.reduce((top, current) => 
        current.totalAmount > top.totalAmount ? current : top,
        reportItems[0] || { productName: 'N/A', totalAmount: 0 }
      );

      const report: DailySalesReport = {
        date: format(today, 'yyyy-MM-dd'),
        totalSales: salesRecords.length,
        totalRevenue,
        totalQuantitySold,
        products: reportItems,
        summary: {
          topSellingProduct: topSellingProduct.productName,
          highestRevenueProduct: highestRevenueProduct.productName,
          averageOrderValue: salesRecords.length > 0 ? totalRevenue / salesRecords.length : 0,
          totalTransactions: salesRecords.length,
          paymentBreakdown,
          hourlyDistribution: Array.from(hourlyMap.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([hour, v]) => ({ hour, sales: v.sales, revenue: v.revenue }))
        }
      };

      return { success: true, report };

    } catch (error) {
      console.error('Error generating daily sales report:', error);
      return { success: false, error: 'Error generating daily sales report' };
    }
  }

  async exportTodaysReport(): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.getTodaysSalesReport();
      
      if (!result.success || !result.report) {
        return { success: false, error: result.error || 'No report data available' };
      }

      const report = result.report;

      // Create CSV content
      const csvContent = [
        ['DAILY SALES REPORT - DEB CARGO SHIPPING LLC'],
        ['Report Date:', report.date],
        ['Generated:', format(new Date(), 'yyyy-MM-dd HH:mm:ss')],
        [''],
        ['SUMMARY'],
        ['Total Transactions:', report.totalSales.toString()],
        ['Total Revenue:', `$HT${report.totalRevenue.toFixed(2)}`],
        ['Total Quantity Sold:', report.totalQuantitySold.toString()],
        ['Average Order Value:', `$HT${report.summary.averageOrderValue.toFixed(2)}`],
        ['Top Selling Product:', report.summary.topSellingProduct],
        ['Highest Revenue Product:', report.summary.highestRevenueProduct],
        [''],
        ['PAYMENT BREAKDOWN'],
        ...Object.entries(report.summary.paymentBreakdown).map(([k, v]) => [k, `$HT${v.toFixed(2)}`]),
        [''],
        ['HOURLY DISTRIBUTION'],
        ['Hour', 'Sales', 'Revenue'],
        ...report.summary.hourlyDistribution.map(h => [h.hour, h.sales.toString(), `$HT${h.revenue.toFixed(2)}`]),
        [''],
        ['DETAILED SALES BY PRODUCT'],
        ['Product Code', 'Product Name', 'Quantity Sold', 'Total Amount', 'Average Unit Price', 'Current Stock', 'Sales Count'],
        ...report.products.map(product => [
          product.productCode,
          product.productName,
          product.quantitySold.toString(),
          `$HT${product.totalAmount.toFixed(2)}`,
          `$HT${product.unitPrice.toFixed(2)}`,
          product.currentStock.toString(),
          product.salesCount.toString()
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `daily-sales-report-${report.date}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      return { success: true };

    } catch (error) {
      console.error('Error exporting daily report:', error);
      return { success: false, error: 'Error exporting report' };
    }
  }
}