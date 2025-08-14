import { supabase } from '../lib/supabase';
import { format, subDays, isWithinInterval } from 'date-fns';

export interface SalesByCategoryData {
  category: string;
  categoryId: string;
  totalSales: number;
  totalRevenue: number;
  totalQuantity: number;
  averagePrice: number;
  topProduct: string;
  percentage: number;
}

export interface ReportsData {
  salesByCategory: SalesByCategoryData[];
  totalSales: number;
  totalRevenue: number;
  dateRange: { start: Date; end: Date };
}

export class ReportsService {
  async getSalesByCategory(days: number = 30): Promise<{ success: boolean; data?: ReportsData; error?: string }> {
    try {
      // Check if supabase is properly initialized
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const endDate = new Date();
      const startDate = subDays(endDate, days);

      // Get all sales records within date range
      const { data: salesRecords, error: salesError } = await supabase
        .from('sales_records')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (salesError) {
        console.error('Error fetching sales records:', salesError);
        return { success: false, error: 'Erè nan chèche done vant yo' };
      }

      // Get all products with their categories
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, code, name, category_id, unit_price');

      if (productsError) {
        console.error('Error fetching products:', productsError);
        return { success: false, error: 'Erè nan chèche done pwodwi yo' };
      }

      // Get all categories
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true);

      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
        return { success: false, error: 'Erè nan chèche kategori yo' };
      }

      // Process sales by category
      const categoryMap = new Map<string, SalesByCategoryData>();
      
      // Initialize all categories
      categories.forEach(category => {
        categoryMap.set(category.id, {
          category: category.name,
          categoryId: category.id,
          totalSales: 0,
          totalRevenue: 0,
          totalQuantity: 0,
          averagePrice: 0,
          topProduct: '',
          percentage: 0
        });
      });

      // Add "Okenn Kategori" for products without category
      categoryMap.set('no-category', {
        category: 'Okenn Kategori',
        categoryId: 'no-category',
        totalSales: 0,
        totalRevenue: 0,
        totalQuantity: 0,
        averagePrice: 0,
        topProduct: '',
        percentage: 0
      });

      // Track products within each category for finding top product
      const categoryProducts = new Map<string, Map<string, { quantity: number; revenue: number }>>();

      let totalSales = 0;
      let totalRevenue = 0;

      // Process each sales record
      salesRecords.forEach(sale => {
        // Find the product for this sale
        const product = products.find(p => 
          p.code === sale.product_code || p.name === sale.product_name
        );

        let categoryId = 'no-category';
        if (product && product.category_id) {
          categoryId = product.category_id;
        }

        // Update category data
        const categoryData = categoryMap.get(categoryId);
        if (categoryData) {
          categoryData.totalSales += 1;
          categoryData.totalRevenue += sale.total_amount;
          categoryData.totalQuantity += sale.quantity;

          // Track products for finding top product
          if (!categoryProducts.has(categoryId)) {
            categoryProducts.set(categoryId, new Map());
          }
          const productMap = categoryProducts.get(categoryId)!;
          const productKey = sale.product_name;
          
          if (!productMap.has(productKey)) {
            productMap.set(productKey, { quantity: 0, revenue: 0 });
          }
          const productData = productMap.get(productKey)!;
          productData.quantity += sale.quantity;
          productData.revenue += sale.total_amount;
        }

        totalSales += 1;
        totalRevenue += sale.total_amount;
      });

      // Calculate averages and find top products
      categoryMap.forEach((categoryData, categoryId) => {
        if (categoryData.totalSales > 0) {
          categoryData.averagePrice = categoryData.totalRevenue / categoryData.totalQuantity;
          categoryData.percentage = totalRevenue > 0 ? (categoryData.totalRevenue / totalRevenue) * 100 : 0;

          // Find top product in this category
          const productMap = categoryProducts.get(categoryId);
          if (productMap && productMap.size > 0) {
            let topProduct = '';
            let maxRevenue = 0;
            
            productMap.forEach((data, productName) => {
              if (data.revenue > maxRevenue) {
                maxRevenue = data.revenue;
                topProduct = productName;
              }
            });
            
            categoryData.topProduct = topProduct;
          }
        }
      });

      // Convert to array and filter out empty categories
      const salesByCategory = Array.from(categoryMap.values())
        .filter(category => category.totalSales > 0)
        .sort((a, b) => b.totalRevenue - a.totalRevenue);

      return {
        success: true,
        data: {
          salesByCategory,
          totalSales,
          totalRevenue,
          dateRange: { start: startDate, end: endDate }
        }
      };

    } catch (error) {
      console.error('Error in getSalesByCategory:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erè nan chaje done yo' 
      };
    }
  }

  async getTopSellingProducts(days: number = 30, limit: number = 10): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const endDate = new Date();
      const startDate = subDays(endDate, days);

      const { data: salesRecords, error } = await supabase
        .from('sales_records')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (error) {
        return { success: false, error: 'Erè nan chèche done vant yo' };
      }

      // Group by product
      const productMap = new Map();
      
      salesRecords.forEach(sale => {
        const key = sale.product_name;
        if (!productMap.has(key)) {
          productMap.set(key, {
            name: key,
            code: sale.product_code,
            totalQuantity: 0,
            totalRevenue: 0,
            salesCount: 0
          });
        }
        
        const product = productMap.get(key);
        product.totalQuantity += sale.quantity;
        product.totalRevenue += sale.total_amount;
        product.salesCount += 1;
      });

      // Convert to array and sort by revenue
      const topProducts = Array.from(productMap.values())
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, limit);

      return { success: true, data: topProducts };

    } catch (error) {
      console.error('Error in getTopSellingProducts:', error);
      return { success: false, error: 'Erè nan chèche top pwodwi yo' };
    }
  }

  async getDailySalesTrend(days: number = 30): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const endDate = new Date();
      const startDate = subDays(endDate, days);

      const { data: salesRecords, error } = await supabase
        .from('sales_records')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) {
        return { success: false, error: 'Erè nan chèche done vant yo' };
      }

      // Group by date
      const dailyData = new Map();
      
      salesRecords.forEach(sale => {
        const date = format(new Date(sale.created_at), 'yyyy-MM-dd');
        if (!dailyData.has(date)) {
          dailyData.set(date, {
            date: format(new Date(sale.created_at), 'MM/dd'),
            sales: 0,
            revenue: 0,
            quantity: 0
          });
        }
        
        const dayData = dailyData.get(date);
        dayData.sales += 1;
        dayData.revenue += sale.total_amount;
        dayData.quantity += sale.quantity;
      });

      const trendData = Array.from(dailyData.values());

      return { success: true, data: trendData };

    } catch (error) {
      console.error('Error in getDailySalesTrend:', error);
      return { success: false, error: 'Erè nan chèche tandans vant yo' };
    }
  }
}