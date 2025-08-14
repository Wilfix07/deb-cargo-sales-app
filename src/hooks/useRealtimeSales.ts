import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { SalesRecord, DashboardStats } from '../types';

export function useRealtimeSales(userId?: string, userRole?: string) {
  const [salesRecords, setSalesRecords] = useState<SalesRecord[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalSales: 0,
    totalAmount: 0,
    todaySales: 0,
    todayAmount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      // Initial load
      loadSalesData();

      // Set up real-time subscription for sales records
      const salesSubscription = supabase
        .channel('sales-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'sales_records'
          },
          (payload) => {
            console.log('Sales change detected:', payload);
            
            if (payload.eventType === 'INSERT') {
              const newRecord = transformSalesRecord(payload.new);
              // Only add if user can see this record
              if (canUserSeeRecord(newRecord, userId, userRole)) {
                setSalesRecords(prev => [newRecord, ...prev]);
                updateStats(newRecord, 'add');
              }
            } else if (payload.eventType === 'UPDATE') {
              const updatedRecord = transformSalesRecord(payload.new);
              if (canUserSeeRecord(updatedRecord, userId, userRole)) {
                setSalesRecords(prev => 
                  prev.map(record => 
                    record.id === updatedRecord.id ? updatedRecord : record
                  )
                );
              }
            } else if (payload.eventType === 'DELETE') {
              setSalesRecords(prev => 
                prev.filter(record => record.id !== payload.old.id)
              );
              // Recalculate stats after deletion
              recalculateStats();
            }
          }
        )
        .subscribe();

      return () => {
        salesSubscription.unsubscribe();
      };
    }
  }, [userId, userRole]);

  const loadSalesData = async () => {
    if (!userId) return;

    try {
      setLoading(true);

      // Load sales records
      let query = supabase
        .from('sales_records')
        .select(`
          *,
          users(username, full_name, role)
        `)
        .order('created_at', { ascending: false });

      // Apply role-based filtering
      if (userRole === 'Teller') {
        query = query.eq('user_id', userId);
      }

      const { data: salesData, error: salesError } = await query;

      if (salesError) {
        console.error('Error loading sales:', salesError);
        return;
      }

      const records = salesData.map(transformSalesRecord);
      setSalesRecords(records);

      // Calculate stats
      calculateStats(records);

    } catch (error) {
      console.error('Error loading sales data:', error);
    } finally {
      setLoading(false);
    }
  };

  const transformSalesRecord = (item: any): SalesRecord => ({
    id: item.id,
    productCode: item.product_code,
    productName: item.product_name,
    quantity: item.quantity,
    unitPrice: item.unit_price,
    totalAmount: item.total_amount,
    customerName: item.customer_name,
    scanType: item.scan_type as 'qr' | 'barcode' | 'manual',
    scannedData: item.scanned_data,
    userId: item.user_id,
    timestamp: new Date(item.created_at)
  });

  const canUserSeeRecord = (record: SalesRecord, userId?: string, userRole?: string): boolean => {
    if (userRole === 'Teller') {
      return record.userId === userId;
    }
    return true; // Admin, Manager, Chef Teller can see all records
  };

  const calculateStats = (records: SalesRecord[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalSales = records.length;
    const totalAmount = records.reduce((sum, record) => sum + record.totalAmount, 0);
    
    const todayRecords = records.filter(record => {
      const recordDate = new Date(record.timestamp);
      recordDate.setHours(0, 0, 0, 0);
      return recordDate.getTime() === today.getTime();
    });
    
    const todaySales = todayRecords.length;
    const todayAmount = todayRecords.reduce((sum, record) => sum + record.totalAmount, 0);

    setDashboardStats({
      totalSales,
      totalAmount,
      todaySales,
      todayAmount
    });
  };

  const updateStats = (record: SalesRecord, action: 'add' | 'remove') => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const recordDate = new Date(record.timestamp);
    recordDate.setHours(0, 0, 0, 0);
    
    const isToday = recordDate.getTime() === today.getTime();
    const multiplier = action === 'add' ? 1 : -1;

    setDashboardStats(prev => ({
      totalSales: prev.totalSales + multiplier,
      totalAmount: prev.totalAmount + (record.totalAmount * multiplier),
      todaySales: isToday ? prev.todaySales + multiplier : prev.todaySales,
      todayAmount: isToday ? prev.todayAmount + (record.totalAmount * multiplier) : prev.todayAmount
    }));
  };

  const recalculateStats = () => {
    calculateStats(salesRecords);
  };

  return {
    salesRecords,
    dashboardStats,
    loading,
    refreshSales: loadSalesData
  };
}