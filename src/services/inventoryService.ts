import { supabase } from '../lib/supabase';
import { Product, Category, Supplier, StockMovement, PurchaseOrder, PurchaseOrderItem, InventoryStats } from '../types/inventory';

export class InventoryService {
  // Products
  async getProducts(): Promise<{ success: boolean; products?: Product[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (error) {
        console.error('Get products error:', error);
        return { success: false, error: 'Erè nan chèche pwodwi yo' };
      }

      const products: Product[] = data.map(item => ({
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
      }));

      return { success: true, products };
    } catch (error) {
      console.error('Get products error:', error);
      return { success: false, error: 'Erè nan chèche pwodwi yo' };
    }
  }

  async createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; product?: Product; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          code: product.code,
          name: product.name,
          description: product.description,
          category_id: product.category_id,
          supplier_id: product.supplier_id,
          unit_price: product.unit_price,
          cost_price: product.cost_price,
          current_stock: product.current_stock,
          min_stock_level: product.min_stock_level,
          max_stock_level: product.max_stock_level,
          unit_of_measure: product.unit_of_measure,
          barcode: product.barcode,
          image_url: product.image_url,
          is_active: product.is_active
        })
        .select()
        .single();

      if (error) {
        console.error('Create product error:', error);
        return { success: false, error: 'Erè nan kreye pwodwi a' };
      }

      const newProduct: Product = {
        id: data.id,
        code: data.code,
        name: data.name,
        description: data.description,
        category_id: data.category_id,
        supplier_id: data.supplier_id,
        unit_price: data.unit_price,
        cost_price: data.cost_price,
        current_stock: data.current_stock,
        min_stock_level: data.min_stock_level,
        max_stock_level: data.max_stock_level,
        unit_of_measure: data.unit_of_measure,
        barcode: data.barcode,
        image_url: data.image_url,
        is_active: data.is_active,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at)
      };

      return { success: true, product: newProduct };
    } catch (error) {
      console.error('Create product error:', error);
      return { success: false, error: 'Erè nan kreye pwodwi a' };
    }
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Update product error:', error);
        return { success: false, error: 'Erè nan modifye pwodwi a' };
      }

      return { success: true };
    } catch (error) {
      console.error('Update product error:', error);
      return { success: false, error: 'Erè nan modifye pwodwi a' };
    }
  }

  async deleteProduct(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Delete product error:', error);
        return { success: false, error: 'Erè nan efase pwodwi a' };
      }

      return { success: true };
    } catch (error) {
      console.error('Delete product error:', error);
      return { success: false, error: 'Erè nan efase pwodwi a' };
    }
  }

  // Categories
  async getCategories(): Promise<{ success: boolean; categories?: Category[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) {
        console.error('Get categories error:', error);
        return { success: false, error: 'Erè nan chèche kategori yo' };
      }

      const categories: Category[] = data.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        parent_id: item.parent_id,
        is_active: item.is_active,
        created_at: new Date(item.created_at)
      }));

      return { success: true, categories };
    } catch (error) {
      console.error('Get categories error:', error);
      return { success: false, error: 'Erè nan chèche kategori yo' };
    }
  }

  async createCategory(category: Omit<Category, 'id' | 'created_at'>): Promise<{ success: boolean; category?: Category; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: category.name,
          description: category.description,
          parent_id: category.parent_id,
          is_active: category.is_active
        })
        .select()
        .single();

      if (error) {
        console.error('Create category error:', error);
        return { success: false, error: 'Erè nan kreye kategori a' };
      }

      const newCategory: Category = {
        id: data.id,
        name: data.name,
        description: data.description,
        parent_id: data.parent_id,
        is_active: data.is_active,
        created_at: new Date(data.created_at)
      };

      return { success: true, category: newCategory };
    } catch (error) {
      console.error('Create category error:', error);
      return { success: false, error: 'Erè nan kreye kategori a' };
    }
  }

  async deleteCategory(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Delete category error:', error);
        return { success: false, error: 'Erè nan efase kategori a' };
      }

      return { success: true };
    } catch (error) {
      console.error('Delete category error:', error);
      return { success: false, error: 'Erè nan efase kategori a' };
    }
  }

  // Suppliers
  async getSuppliers(): Promise<{ success: boolean; suppliers?: Supplier[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name');

      if (error) {
        console.error('Get suppliers error:', error);
        return { success: false, error: 'Erè nan chèche founisè yo' };
      }

      const suppliers: Supplier[] = data.map(item => ({
        id: item.id,
        name: item.name,
        contact_person: item.contact_person,
        email: item.email,
        phone: item.phone,
        address: item.address,
        is_active: item.is_active,
        created_at: new Date(item.created_at)
      }));

      return { success: true, suppliers };
    } catch (error) {
      console.error('Get suppliers error:', error);
      return { success: false, error: 'Erè nan chèche founisè yo' };
    }
  }

  async createSupplier(supplier: Omit<Supplier, 'id' | 'created_at'>): Promise<{ success: boolean; supplier?: Supplier; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .insert({
          name: supplier.name,
          contact_person: supplier.contact_person,
          email: supplier.email,
          phone: supplier.phone,
          address: supplier.address,
          is_active: supplier.is_active
        })
        .select()
        .single();

      if (error) {
        console.error('Create supplier error:', error);
        return { success: false, error: 'Erè nan kreye founisè a' };
      }

      const newSupplier: Supplier = {
        id: data.id,
        name: data.name,
        contact_person: data.contact_person,
        email: data.email,
        phone: data.phone,
        address: data.address,
        is_active: data.is_active,
        created_at: new Date(data.created_at)
      };

      return { success: true, supplier: newSupplier };
    } catch (error) {
      console.error('Create supplier error:', error);
      return { success: false, error: 'Erè nan kreye founisè a' };
    }
  }

  async deleteSupplier(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Delete supplier error:', error);
        return { success: false, error: 'Erè nan efase founisè a' };
      }

      return { success: true };
    } catch (error) {
      console.error('Delete supplier error:', error);
      return { success: false, error: 'Erè nan efase founisè a' };
    }
  }

  // Stock Movements
  async createStockMovement(movement: Omit<StockMovement, 'id' | 'created_at'>): Promise<{ success: boolean; error?: string }> {
    try {
      // Start a transaction
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('current_stock')
        .eq('id', movement.product_id)
        .single();

      if (productError) {
        return { success: false, error: 'Pwodwi a pa jwenn' };
      }

      // Calculate new stock level
      let newStock = product.current_stock;
      if (movement.movement_type === 'IN') {
        newStock += movement.quantity;
      } else if (movement.movement_type === 'OUT') {
        newStock -= movement.quantity;
        if (newStock < 0) {
          return { success: false, error: 'Stock la pa ka vin negatif' };
        }
      } else if (movement.movement_type === 'ADJUSTMENT') {
        newStock = movement.quantity;
      }

      // Create stock movement record
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert({
          product_id: movement.product_id,
          movement_type: movement.movement_type,
          quantity: movement.quantity,
          unit_cost: movement.unit_cost,
          reference_number: movement.reference_number,
          notes: movement.notes,
          user_id: movement.user_id
        });

      if (movementError) {
        console.error('Create stock movement error:', movementError);
        return { success: false, error: 'Erè nan anrejistre mouvman stock la' };
      }

      // Update product stock
      const { error: updateError } = await supabase
        .from('products')
        .update({ current_stock: newStock })
        .eq('id', movement.product_id);

      if (updateError) {
        console.error('Update product stock error:', updateError);
        return { success: false, error: 'Erè nan modifye stock pwodwi a' };
      }

      return { success: true };
    } catch (error) {
      console.error('Create stock movement error:', error);
      return { success: false, error: 'Erè nan mouvman stock la' };
    }
  }

  async getStockMovements(productId?: string): Promise<{ success: boolean; movements?: StockMovement[]; error?: string }> {
    try {
      let query = supabase
        .from('stock_movements')
        .select(`
          *,
          products(name, code),
          users(full_name)
        `)
        .order('created_at', { ascending: false });

      if (productId) {
        query = query.eq('product_id', productId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Get stock movements error:', error);
        return { success: false, error: 'Erè nan chèche mouvman stock yo' };
      }

      const movements: StockMovement[] = data.map(item => ({
        id: item.id,
        product_id: item.product_id,
        movement_type: item.movement_type,
        quantity: item.quantity,
        unit_cost: item.unit_cost,
        reference_number: item.reference_number,
        notes: item.notes,
        user_id: item.user_id,
        created_at: new Date(item.created_at)
      }));

      return { success: true, movements };
    } catch (error) {
      console.error('Get stock movements error:', error);
      return { success: false, error: 'Erè nan chèche mouvman stock yo' };
    }
  }

  // Inventory Stats
  async getInventoryStats(): Promise<{ success: boolean; stats?: InventoryStats; error?: string }> {
    try {
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('current_stock, min_stock_level, unit_price, cost_price')
        .eq('is_active', true);

      if (productsError) {
        return { success: false, error: 'Erè nan chèche done pwodwi yo' };
      }

      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('id')
        .eq('is_active', true);

      if (categoriesError) {
        return { success: false, error: 'Erè nan chèche done kategori yo' };
      }

      const { data: suppliers, error: suppliersError } = await supabase
        .from('suppliers')
        .select('id')
        .eq('is_active', true);

      if (suppliersError) {
        return { success: false, error: 'Erè nan chèche done founisè yo' };
      }

      const totalProducts = products.length;
      const totalValue = products.reduce((sum, product) => sum + (product.current_stock * product.cost_price), 0);
      const lowStockItems = products.filter(product => product.current_stock <= product.min_stock_level).length;
      const outOfStockItems = products.filter(product => product.current_stock === 0).length;
      const totalCategories = categories.length;
      const totalSuppliers = suppliers.length;

      const stats: InventoryStats = {
        totalProducts,
        totalValue,
        lowStockItems,
        outOfStockItems,
        totalCategories,
        totalSuppliers
      };

      return { success: true, stats };
    } catch (error) {
      console.error('Get inventory stats error:', error);
      return { success: false, error: 'Erè nan chèche estatistik yo' };
    }
  }

  // Low Stock Alert
  async getLowStockProducts(): Promise<{ success: boolean; products?: Product[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories(name),
          suppliers(name)
        `)
        .eq('is_active', true)
        .order('current_stock');

      if (error) {
        console.error('Get low stock products error:', error);
        return { success: false, error: 'Erè nan chèche pwodwi ki gen stock ki ba' };
      }

      // Filter products where current_stock <= min_stock_level
      const lowStockData = data.filter(item => item.current_stock <= item.min_stock_level);

      const products: Product[] = lowStockData.map(item => ({
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
      }));

      return { success: true, products };
    } catch (error) {
      console.error('Get low stock products error:', error);
      return { success: false, error: 'Erè nan chèche pwodwi ki gen stock ki ba' };
    }
  }
}