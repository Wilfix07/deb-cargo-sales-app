import { supabase } from '../lib/supabase';
import { SalesRecord } from '../types';

export class SupabaseSalesService {
  // Configuration for stock shortage behavior
  private allowNegativeStock = false; // Set to true to allow negative stock, false to reject sales

  async createSalesRecord(record: Omit<SalesRecord, 'id' | 'timestamp'>): Promise<{ success: boolean; record?: SalesRecord; error?: string }> {
    try {
      // Use database transaction to ensure atomicity
      const result = await this.createSaleWithStockUpdate(record);
      return result;

    } catch (error) {
      console.error('Create sales record error:', error);
      return { success: false, error: 'Error saving sale record' };
    }
  }

  private async createSaleWithStockUpdate(record: Omit<SalesRecord, 'id' | 'timestamp'>): Promise<{ success: boolean; record?: SalesRecord; error?: string }> {
    try {
      console.log('SupabaseSalesService: Calling create_sale_with_stock_update with params:', {
        p_product_code: record.productCode,
        p_product_name: record.productName,
        p_quantity: record.quantity,
        p_unit_price: record.unitPrice,
        p_total_amount: record.totalAmount,
        p_customer_name: record.customerName,
        p_payment_method: record.paymentMethod,
        p_payment_reference: record.paymentReference || null,
        p_scan_type: record.scanType || 'manual',
        p_scanned_data: record.scannedData,
        p_user_id: record.userId,
        p_allow_negative_stock: this.allowNegativeStock
      });
      
      // Start a database transaction using RPC function
      const { data: transactionResult, error: transactionError } = await supabase.rpc('create_sale_with_stock_update', {
        p_product_code: record.productCode,
        p_product_name: record.productName,
        p_quantity: record.quantity,
        p_unit_price: record.unitPrice,
        p_total_amount: record.totalAmount,
        p_customer_name: record.customerName,
        p_payment_method: record.paymentMethod,
        p_payment_reference: record.paymentReference || null,
        p_scan_type: record.scanType || 'manual',
        p_scanned_data: record.scannedData,
        p_user_id: record.userId,
        p_allow_negative_stock: this.allowNegativeStock
      });

      console.log('SupabaseSalesService: RPC response - data:', transactionResult, 'error:', transactionError);
      
      if (transactionError) {
        console.error('Transaction error:', transactionError);
        
        // Handle specific error cases
        if (transactionError.message.includes('insufficient_stock')) {
          return { 
            success: false, 
            error: `Stock pa ase. Stock ki disponib: ${transactionError.details || 'unknown'}, Demand: ${record.quantity}` 
          };
        }
        
        if (transactionError.message.includes('product_not_found')) {
          return { 
            success: false, 
            error: 'Pwodwi a pa jwenn nan enventè a. Verifye kòd pwodwi a.' 
          };
        }
        
        return { success: false, error: 'Erè nan sove vant la ak modifye stock la' };
      }

      if (!transactionResult || !transactionResult.sale_id) {
        return { success: false, error: 'Erè nan kreye vant la' };
      }

      // Fetch the created sales record
      const { data: salesData, error: fetchError } = await supabase
        .from('sales_records')
        .select('*')
        .eq('id', transactionResult.sale_id)
        .single();

      if (fetchError || !salesData) {
        console.error('Error fetching created sale:', fetchError);
        return { success: false, error: 'Vant la kreye men pa ka jwenn li' };
      }

      const salesRecord: SalesRecord = {
        id: salesData.id,
        productCode: salesData.product_code,
        productName: salesData.product_name,
        quantity: salesData.quantity,
        unitPrice: salesData.unit_price,
        totalAmount: salesData.total_amount,
        customerName: salesData.customer_name,
        paymentMethod: (salesData.payment_method || 'CASH') as 'CASH' | 'CARD' | 'MOBILE' | 'OTHER',
        paymentReference: salesData.payment_reference || undefined,
        scanType: salesData.scan_type as 'qr' | 'barcode' | 'manual',
        scannedData: salesData.scanned_data,
        userId: salesData.user_id,
        timestamp: new Date(salesData.created_at)
      };

      return { success: true, record: salesRecord };

    } catch (error) {
      console.error('Create sale with stock update error:', error);
      return { success: false, error: 'Erè nan sove vant la ak modifye stock la' };
    }
  }

  // Configuration methods
  setAllowNegativeStock(allow: boolean) {
    this.allowNegativeStock = allow;
  }

  getAllowNegativeStock(): boolean {
    return this.allowNegativeStock;
  }
  async getSalesRecords(userId?: string, userRole?: string): Promise<{ success: boolean; records?: SalesRecord[]; error?: string }> {
    try {
      // Get all sales records (no RLS restrictions)
      let query = supabase
        .from('sales_records')
        .select(`
          *,
          users(username, full_name, role)
        `)
        .order('created_at', { ascending: false });

      // Apply role-based filtering at application level
      if (userRole === 'Teller' && userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Fetch sales records error:', error);
        return { success: false, error: 'Erè nan chèche done vant yo' };
      }

      const salesRecords: SalesRecord[] = data.map(record => ({
        id: record.id,
        productCode: record.product_code,
        productName: record.product_name,
        quantity: record.quantity,
        unitPrice: record.unit_price,
        totalAmount: record.total_amount,
        customerName: record.customer_name,
        paymentMethod: (record.payment_method || 'CASH') as 'CASH' | 'CARD' | 'MOBILE' | 'OTHER',
        paymentReference: record.payment_reference || undefined,
        scanType: record.scan_type as 'qr' | 'barcode' | 'manual',
        scannedData: record.scanned_data,
        userId: record.user_id,
        timestamp: new Date(record.created_at)
      }));

      return { success: true, records: salesRecords };

    } catch (error) {
      console.error('Get sales records error:', error);
      return { success: false, error: 'Erè nan chèche done vant yo' };
    }
  }

  async updateSalesRecord(recordId: string, updates: Omit<SalesRecord, 'id' | 'timestamp'>): Promise<{ success: boolean; error?: string }> {
    try {
      // Get the original sale record to calculate stock difference
      const { data: originalSale, error: fetchError } = await supabase
        .from('sales_records')
        .select('*')
        .eq('id', recordId)
        .single();

      if (fetchError || !originalSale) {
        return { success: false, error: 'Dosye vant orijinal la pa jwenn' };
      }

      // Calculate quantity difference
      const quantityDifference = updates.quantity - originalSale.quantity;
      
      // If quantity changed, we need to update stock
      if (quantityDifference !== 0) {
        // Find the product
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('*')
          .or(`code.eq.${updates.productCode},name.eq.${updates.productName}`)
          .single();

        if (productError || !product) {
          return { success: false, error: 'Pwodwi a pa jwenn' };
        }

        // Check if we have enough stock for the increase
        if (quantityDifference > 0) {
          const availableStock = product.current_stock;
          if (availableStock < quantityDifference && !this.allowNegativeStock) {
            return { 
              success: false, 
              error: `Stock pa ase pou modifikasyon an. Stock disponib: ${availableStock}, Bezwen: ${quantityDifference}` 
            };
          }
        }

        // Update product stock
        const newStock = Math.max(0, product.current_stock - quantityDifference);
        const { error: stockUpdateError } = await supabase
          .from('products')
          .update({ current_stock: newStock })
          .eq('id', product.id);

        if (stockUpdateError) {
          return { success: false, error: 'Erè nan modifye stock la' };
        }

        // Create stock movement record for the adjustment
        await supabase
          .from('stock_movements')
          .insert({
            product_id: product.id,
            movement_type: quantityDifference > 0 ? 'OUT' : 'IN',
            quantity: Math.abs(quantityDifference),
            unit_cost: product.cost_price,
            reference_number: `SALE-UPDATE-${recordId}`,
            notes: `Stock adjustment from sale update. Original: ${originalSale.quantity}, New: ${updates.quantity}`,
            user_id: updates.userId
          });
      }

      // Update the sales record
      const { error: updateError } = await supabase
        .from('sales_records')
        .update({
          product_code: updates.productCode,
          product_name: updates.productName,
          quantity: updates.quantity,
          unit_price: updates.unitPrice,
          total_amount: updates.totalAmount,
          customer_name: updates.customerName,
          payment_method: updates.paymentMethod,
          payment_reference: updates.paymentReference || null,
          scan_type: updates.scanType || 'manual',
          scanned_data: updates.scannedData
        })
        .eq('id', recordId);

      if (updateError) {
        console.error('Update sales record error:', updateError);
        return { success: false, error: 'Erè nan modifye vant la' };
      }

      return { success: true };

    } catch (error) {
      console.error('Update sales record error:', error);
      return { success: false, error: 'Erè nan modifye vant la' };
    }
  }

  async deleteSalesRecord(recordId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get the sales record to restore stock
      const { data: saleRecord, error: fetchError } = await supabase
        .from('sales_records')
        .select('*')
        .eq('id', recordId)
        .single();

      if (fetchError || !saleRecord) {
        return { success: false, error: 'Dosye vant la pa jwenn' };
      }

      // Find the product to restore stock
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .or(`code.eq.${saleRecord.product_code},name.eq.${saleRecord.product_name}`)
        .single();

      // Delete the sales record first
      const { error: deleteError } = await supabase
        .from('sales_records')
        .delete()
        .eq('id', recordId);

      if (deleteError) {
        console.error('Delete sales record error:', deleteError);
        return { success: false, error: 'Erè nan efase dosye vant la' };
      }

      // Restore stock if product exists
      if (product) {
        const restoredStock = product.current_stock + saleRecord.quantity;
        
        const { error: stockRestoreError } = await supabase
          .from('products')
          .update({ current_stock: restoredStock })
          .eq('id', product.id);

        if (stockRestoreError) {
          console.warn('Stock not restored for deleted sale:', stockRestoreError);
        } else {
          // Create stock movement record for the restoration
          await supabase
            .from('stock_movements')
            .insert({
              product_id: product.id,
              movement_type: 'IN',
              quantity: saleRecord.quantity,
              unit_cost: product.cost_price,
              reference_number: `SALE-DELETE-${recordId}`,
              notes: `Stock restored from deleted sale. Customer: ${saleRecord.customer_name}`,
              user_id: saleRecord.user_id
            });
        }
      }

      return { success: true };

    } catch (error) {
      console.error('Delete sales record error:', error);
      return { success: false, error: 'Erè nan efase dosye vant la' };
    }
  }

  // Bulk stock validation for multiple products
  async validateStockAvailability(items: Array<{ productCode: string; quantity: number }>): Promise<{ success: boolean; errors?: string[]; error?: string }> {
    try {
      const errors: string[] = [];
      
      for (const item of items) {
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('code, name, current_stock')
          .eq('code', item.productCode)
          .eq('is_active', true)
          .single();

        if (productError || !product) {
          errors.push(`Pwodwi ${item.productCode} pa jwenn`);
          continue;
        }

        if (product.current_stock < item.quantity) {
          errors.push(`Stock pa ase pou ${product.name} (${product.code}). Disponib: ${product.current_stock}, Demand: ${item.quantity}`);
        }
      }

      return { 
        success: errors.length === 0, 
        errors: errors.length > 0 ? errors : undefined 
      };

    } catch (error) {
      console.error('Stock validation error:', error);
      return { success: false, error: 'Erè nan valide stock la' };
    }
  }

  async getSalesStats(userId?: string, userRole?: string): Promise<{ 
    success: boolean; 
    stats?: { 
      totalSales: number; 
      totalAmount: number; 
      todaySales: number; 
      todayAmount: number; 
    }; 
    error?: string 
  }> {
    try {
      // Get all sales records for stats (no RLS restrictions)
      let query = supabase
        .from('sales_records')
        .select('total_amount, created_at');

      // Apply role-based filtering at application level
      if (userRole === 'Teller' && userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Fetch sales stats error:', error);
        return { success: false, error: 'Erè nan chèche estatistik yo' };
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const totalSales = data.length;
      const totalAmount = data.reduce((sum, record) => sum + record.total_amount, 0);
      
      const todayRecords = data.filter(record => {
        const recordDate = new Date(record.created_at);
        recordDate.setHours(0, 0, 0, 0);
        return recordDate.getTime() === today.getTime();
      });
      
      const todaySales = todayRecords.length;
      const todayAmount = todayRecords.reduce((sum, record) => sum + record.total_amount, 0);

      return {
        success: true,
        stats: {
          totalSales,
          totalAmount,
          todaySales,
          todayAmount
        }
      };

    } catch (error) {
      console.error('Get sales stats error:', error);
      return { success: false, error: 'Erè nan chèche estatistik yo' };
    }
  }
}