import { supabase, handleSupabaseError, getCurrentUserId } from '../supabase/config'

/**
 * Supabase Operations Utility
 * Replaces Firebase Firestore operations with Supabase equivalents
 */

export const supabaseOperations = {
  // Products Operations
  products: {
    getAll: async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (error) throw error
        return data || []
      } catch (error) {
        handleSupabaseError(error, 'fetch products')
      }
    },

    getById: async (id) => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single()
        
        if (error) throw error
        return data
      } catch (error) {
        handleSupabaseError(error, 'fetch product by ID')
      }
    },

    getByCategory: async (category) => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('category', category)
          .order('name')
        
        if (error) throw error
        return data || []
      } catch (error) {
        handleSupabaseError(error, 'fetch products by category')
      }
    },

    create: async (product) => {
      try {
        const productData = {
          ...product,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        const { data, error } = await supabase
          .from('products')
          .insert([productData])
          .select()
        
        if (error) throw error
        return data[0]
      } catch (error) {
        handleSupabaseError(error, 'create product')
      }
    },

    update: async (id, updates) => {
      try {
        const updateData = {
          ...updates,
          updated_at: new Date().toISOString()
        }

        const { data, error } = await supabase
          .from('products')
          .update(updateData)
          .eq('id', id)
          .select()
        
        if (error) throw error
        return data[0]
      } catch (error) {
        handleSupabaseError(error, 'update product')
      }
    },

    delete: async (id) => {
      try {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', id)
        
        if (error) throw error
        return true
      } catch (error) {
        handleSupabaseError(error, 'delete product')
      }
    },

    bulkUpdate: async (products) => {
      try {
        const updatedProducts = products.map(product => ({
          ...product,
          updated_at: new Date().toISOString()
        }))

        const { data, error } = await supabase
          .from('products')
          .upsert(updatedProducts)
          .select()
        
        if (error) throw error
        return data
      } catch (error) {
        handleSupabaseError(error, 'bulk update products')
      }
    },

    bulkDelete: async (ids) => {
      try {
        const { error } = await supabase
          .from('products')
          .delete()
          .in('id', ids)
        
        if (error) throw error
        return true
      } catch (error) {
        handleSupabaseError(error, 'bulk delete products')
      }
    },

    search: async (searchTerm) => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
          .order('name')
        
        if (error) throw error
        return data || []
      } catch (error) {
        handleSupabaseError(error, 'search products')
      }
    }
  },

  // Categories Operations
  categories: {
    getAll: async () => {
      try {
        // First try with anonymous key
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('name')
        
        if (data && data.length > 0) {
          console.log('Categories fetched with anonymous key:', data)
          // Filter out type values and only return actual categories
          const actualCategories = data.filter(category => 
            category.name.includes('Cane') || 
            category.name === 'Special' || 
            category.name === 'Others'
          )
          return actualCategories.length > 0 ? actualCategories : [
            { id: '1', name: 'Cane Pops', description: 'Cane Pops category' },
            { id: '2', name: 'Cane Fusion', description: 'Cane Fusion category' },
            { id: '3', name: 'Special', description: 'Special category' },
            { id: '4', name: 'Cane Blend', description: 'Cane Blend category' },
            { id: '5', name: 'Others', description: 'Other products' }
          ]
        }
        
        // If no data or error, return default categories
        console.log('No categories found or error occurred, using default categories')
        return [
          { id: '1', name: 'Cane Pops', description: 'Cane Pops category' },
          { id: '2', name: 'Cane Fusion', description: 'Cane Fusion category' },
          { id: '3', name: 'Special', description: 'Special category' },
          { id: '4', name: 'Cane Blend', description: 'Cane Blend category' },
          { id: '5', name: 'Others', description: 'Other products' }
        ]
      } catch (error) {
        console.error('Error fetching categories:', error)
        // Return default categories on error
        return [
          { id: '1', name: 'Cane Pops', description: 'Cane Pops category' },
          { id: '2', name: 'Cane Fusion', description: 'Cane Fusion category' },
          { id: '3', name: 'Special', description: 'Special category' },
          { id: '4', name: 'Cane Blend', description: 'Cane Blend category' },
          { id: '5', name: 'Others', description: 'Other products' }
        ]
      }
    },

    create: async (category) => {
      try {
        const categoryData = {
          ...category,
          created_at: new Date().toISOString()
        }

        const { data, error } = await supabase
          .from('categories')
          .insert([categoryData])
          .select()
        
        if (error) throw error
        return data[0]
      } catch (error) {
        handleSupabaseError(error, 'create category')
      }
    },

    update: async (id, updates) => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .update(updates)
          .eq('id', id)
          .select()
        
        if (error) throw error
        return data[0]
      } catch (error) {
        handleSupabaseError(error, 'update category')
      }
    },

    delete: async (id) => {
      try {
        const { error } = await supabase
          .from('categories')
          .delete()
          .eq('id', id)
        
        if (error) throw error
        return true
      } catch (error) {
        handleSupabaseError(error, 'delete category')
      }
    }
  },

  // Sales Operations
  sales: {
    getAll: async (limit = 100) => {
      try {
        const { data, error } = await supabase
          .from('sales')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit)
        
        if (error) throw error
        return data || []
      } catch (error) {
        handleSupabaseError(error, 'fetch sales')
      }
    },

    getByDateRange: async (startDate, endDate) => {
      try {
        const { data, error } = await supabase
          .from('sales')
          .select('*')
          .gte('created_at', startDate)
          .lte('created_at', endDate)
          .order('created_at', { ascending: false })
        
        if (error) throw error
        return data || []
      } catch (error) {
        handleSupabaseError(error, 'fetch sales by date range')
      }
    },

    create: async (sale) => {
      try {
        const saleData = {
          ...sale,
          created_at: new Date().toISOString()
        }

        const { data, error } = await supabase
          .from('sales')
          .insert([saleData])
          .select()
        
        if (error) throw error
        return data[0]
      } catch (error) {
        handleSupabaseError(error, 'create sale')
      }
    },

    update: async (id, updates) => {
      try {
        const { data, error } = await supabase
          .from('sales')
          .update(updates)
          .eq('id', id)
          .select()
        
        if (error) throw error
        return data[0]
      } catch (error) {
        handleSupabaseError(error, 'update sale')
      }
    },

    delete: async (id) => {
      try {
        const { error } = await supabase
          .from('sales')
          .delete()
          .eq('id', id)
        
        if (error) throw error
        return true
      } catch (error) {
        handleSupabaseError(error, 'delete sale')
      }
    },

    bulkDelete: async (ids) => {
      try {
        const { error } = await supabase
          .from('sales')
          .delete()
          .in('id', ids)
        
        if (error) throw error
        return true
      } catch (error) {
        handleSupabaseError(error, 'bulk delete sales')
      }
    },

    deleteAll: async () => {
      try {
        const { error } = await supabase
          .from('sales')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records
        
        if (error) throw error
        return true
      } catch (error) {
        handleSupabaseError(error, 'delete all sales')
      }
    },

    getStats: async (startDate, endDate) => {
      try {
        const { data, error } = await supabase
          .rpc('get_sales_stats', {
            start_date: startDate,
            end_date: endDate
          })
        
        if (error) throw error
        return data
      } catch (error) {
        handleSupabaseError(error, 'fetch sales stats')
      }
    }
  },

  // Customers Operations
  customers: {
    getAll: async () => {
      try {
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .order('name')
        
        if (error) throw error
        return data || []
      } catch (error) {
        handleSupabaseError(error, 'fetch customers')
      }
    },

    create: async (customer) => {
      try {
        const customerData = {
          ...customer,
          created_at: new Date().toISOString()
        }

        const { data, error } = await supabase
          .from('customers')
          .insert([customerData])
          .select()
        
        if (error) throw error
        return data[0]
      } catch (error) {
        handleSupabaseError(error, 'create customer')
      }
    },

    update: async (id, updates) => {
      try {
        const { data, error } = await supabase
          .from('customers')
          .update(updates)
          .eq('id', id)
          .select()
        
        if (error) throw error
        return data[0]
      } catch (error) {
        handleSupabaseError(error, 'update customer')
      }
    },

    delete: async (id) => {
      try {
        const { error } = await supabase
          .from('customers')
          .delete()
          .eq('id', id)
        
        if (error) throw error
        return true
      } catch (error) {
        handleSupabaseError(error, 'delete customer')
      }
    }
  },

  // Staff Operations
  staff: {
    getAll: async () => {
      try {
        const { data, error } = await supabase
          .from('staff')
          .select('*')
          .order('name')
        
        if (error) throw error
        return data || []
      } catch (error) {
        handleSupabaseError(error, 'fetch staff')
      }
    },

    create: async (staffMember) => {
      try {
        const staffData = {
          ...staffMember,
          created_at: new Date().toISOString()
        }

        const { data, error } = await supabase
          .from('staff')
          .insert([staffData])
          .select()
        
        if (error) throw error
        return data[0]
      } catch (error) {
        handleSupabaseError(error, 'create staff member')
      }
    },

    update: async (id, updates) => {
      try {
        const { data, error } = await supabase
          .from('staff')
          .update(updates)
          .eq('id', id)
          .select()
        
        if (error) throw error
        return data[0]
      } catch (error) {
        handleSupabaseError(error, 'update staff member')
      }
    },

    delete: async (id) => {
      try {
        const { error } = await supabase
          .from('staff')
          .delete()
          .eq('id', id)
        
        if (error) throw error
        return true
      } catch (error) {
        handleSupabaseError(error, 'delete staff member')
      }
    }
  },

  // Real-time Subscriptions
  subscriptions: {
    products: (callback) => {
      const subscription = supabase
        .channel('products-changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'products'
        }, callback)
        .subscribe()
      
      return () => subscription.unsubscribe()
    },

    sales: (callback) => {
      const subscription = supabase
        .channel('sales-changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'sales'
        }, callback)
        .subscribe()
      
      return () => subscription.unsubscribe()
    },

    categories: (callback) => {
      const subscription = supabase
        .channel('categories-changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'categories'
        }, callback)
        .subscribe()
      
      return () => subscription.unsubscribe()
    },

    customers: (callback) => {
      const subscription = supabase
        .channel('customers-changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'customers'
        }, callback)
        .subscribe()
      
      return () => subscription.unsubscribe()
    }
  },

  // Utility Operations
  utils: {
    // Test connection
    testConnection: async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('count', { count: 'exact', head: true })
        
        if (error) throw error
        return { success: true, message: 'Connection successful' }
      } catch (error) {
        return { success: false, message: error.message }
      }
    },

    // Get database stats
    getStats: async () => {
      try {
        const [products, sales, customers, categories] = await Promise.all([
          supabase.from('products').select('count', { count: 'exact', head: true }),
          supabase.from('sales').select('count', { count: 'exact', head: true }),
          supabase.from('customers').select('count', { count: 'exact', head: true }),
          supabase.from('categories').select('count', { count: 'exact', head: true })
        ])

        return {
          products: products.count || 0,
          sales: sales.count || 0,
          customers: customers.count || 0,
          categories: categories.count || 0
        }
      } catch (error) {
        handleSupabaseError(error, 'fetch database stats')
      }
    },

    // Cleanup operations
    cleanup: {
      deleteAllProducts: async () => {
        try {
          const { error } = await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000')
          if (error) throw error
          return true
        } catch (error) {
          handleSupabaseError(error, 'delete all products')
        }
      },

      deleteAllSales: async () => {
        try {
          const { error } = await supabase.from('sales').delete().neq('id', '00000000-0000-0000-0000-000000000000')
          if (error) throw error
          return true
        } catch (error) {
          handleSupabaseError(error, 'delete all sales')
        }
      },

      deleteAllCustomers: async () => {
        try {
          const { error } = await supabase.from('customers').delete().neq('id', '00000000-0000-0000-0000-000000000000')
          if (error) throw error
          return true
        } catch (error) {
          handleSupabaseError(error, 'delete all customers')
        }
      }
    }
  }
}

export default supabaseOperations