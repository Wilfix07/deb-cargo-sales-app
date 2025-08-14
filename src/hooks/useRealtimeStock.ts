import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Product } from '../types/inventory';

export function useRealtimeStock() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial load
    loadProducts();

    // Set up real-time subscription for products table
    const productsSubscription = supabase
      .channel('products-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products'
        },
        (payload) => {
          console.log('Product change detected:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newProduct = transformProduct(payload.new);
            setProducts(prev => [...prev, newProduct]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedProduct = transformProduct(payload.new);
            setProducts(prev => 
              prev.map(product => 
                product.id === updatedProduct.id ? updatedProduct : product
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setProducts(prev => 
              prev.filter(product => product.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    // Set up real-time subscription for stock movements
    const stockMovementsSubscription = supabase
      .channel('stock-movements-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'stock_movements'
        },
        (payload) => {
          console.log('Stock movement detected:', payload);
          // Reload products to get updated stock levels
          loadProducts();
        }
      )
      .subscribe();

    // Set up real-time subscription for sales records (affects stock)
    const salesSubscription = supabase
      .channel('sales-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sales_records'
        },
        (payload) => {
          console.log('Sale recorded, updating stock:', payload);
          // When a sale is made, we need to update the corresponding product stock
          updateProductStockFromSale(payload.new);
        }
      )
      .subscribe();

    return () => {
      productsSubscription.unsubscribe();
      stockMovementsSubscription.unsubscribe();
      salesSubscription.unsubscribe();
    };
  }, []);

  const loadProducts = async () => {
    try {
      // Check if Supabase is properly configured
      if (!supabase) {
        console.error('Supabase client not initialized');
        return;
      }

      // First, try to load products with relationships
      let { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');

      // If products table doesn't exist, return empty array
      if (error && error.message.includes('relation "public.products" does not exist')) {
        console.warn('Products table does not exist. Please run database setup first.');
        setProducts([]);
        return;
      }

      if (error) {
        console.error('Error loading products:', error);
        return;
      }

      // If we have products, try to enrich them with category and supplier data
      const transformedProducts = await Promise.all(
        data.map(async (product) => {
          let categoryName = null;
          let supplierName = null;

          // Try to get category name if category_id exists
          if (product.category_id) {
            try {
              const { data: categoryData } = await supabase
                .from('categories')
                .select('name')
                .eq('id', product.category_id)
                .single();
              categoryName = categoryData?.name;
            } catch (err) {
              // Ignore category lookup errors
            }
          }

          // Try to get supplier name if supplier_id exists
          if (product.supplier_id) {
            try {
              const { data: supplierData } = await supabase
                .from('suppliers')
                .select('name')
                .eq('id', product.supplier_id)
                .single();
              supplierName = supplierData?.name;
            } catch (err) {
              // Ignore supplier lookup errors
            }
          }

          return transformProduct({
            ...product,
            categories: categoryName ? { name: categoryName } : null,
            suppliers: supplierName ? { name: supplierName } : null
          });
        })
      );

      setProducts(transformedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const transformProduct = (item: any): Product => ({
    id: item.id,
    code: item.code,
    name: item.name,
    description: item.description,
    category_id: item.category_id,
    supplier_id: item.supplier_id,
    unit_price: item.unit_price,
    cost_price: item.cost_price,
    current_stock: item.current_stock,
    min_stock_level: item.min_stock_level,
    max_stock_level: item.max_stock_level,
    unit_of_measure: item.unit_of_measure,
    barcode: item.barcode,
    image_url: item.image_url,
    is_active: item.is_active,
    created_at: new Date(item.created_at),
    updated_at: new Date(item.updated_at)
  });

  const updateProductStockFromSale = async (saleRecord: any) => {
    // Stock is now updated automatically by the sales service
    // Just reload products to get the latest stock levels
    loadProducts();
  };

  return {
    products,
    loading,
    refreshProducts: loadProducts
  };
}