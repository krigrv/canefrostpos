import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabaseOperations } from '../utils/supabaseOperations';
import { useAuth } from './AuthContextSupabase';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../supabase/config';

// Create the context
export const InventoryContext = createContext();

// Custom hook to use the context
export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};

// Provider component
export const InventoryProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingUpdates, setPendingUpdates] = useState(new Set());
  const { user } = useAuth();

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load products with real-time subscription
  useEffect(() => {
    let unsubscribe;

    const loadProducts = async () => {
      try {
        setLoading(true);
        
        // Initial load
        const productsData = await supabaseOperations.products.getAll();
        console.log(`InventoryContext: Loaded ${productsData.length} products`);
        
        const productsWithType = productsData;
        
        setProducts(productsWithType);
        setLoading(false);

        // Set up real-time subscription
        unsubscribe = supabaseOperations.subscriptions.products((payload) => {
          console.log('Real-time update received:', payload);
          
          switch (payload.eventType) {
            case 'INSERT':
              setProducts(prev => {
                const newProduct = payload.new;
                return [...prev, newProduct];
              });
              break;
              
            case 'UPDATE':
              setProducts(prev => 
                prev.map(product => 
                  product.id === payload.new.id 
                    ? payload.new
                    : product
                )
              );
              break;
              
            case 'DELETE':
              setProducts(prev => prev.filter(product => product.id !== payload.old.id));
              break;
              
            default:
              console.log('Unknown event type:', payload.eventType);
          }
        });

      } catch (error) {
        console.error('Error loading products:', error);
        setProducts([]);
        setLoading(false);
        toast.error('Failed to load products');
      }
    };

    loadProducts();

    return () => {
      if (unsubscribe) {
        console.log('InventoryContext: Cleanup - unsubscribing from real-time listener');
        unsubscribe();
      }
    };
  }, []);

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        console.log('Loading categories from Supabase...');
        const categoriesData = await supabaseOperations.categories.getAll();
        console.log('Categories loaded:', categoriesData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error loading categories:', error);
        // Set default categories if loading fails
        setCategories([
          { id: '1', name: 'Cane Pops', description: 'Cane Pops category' },
          { id: '2', name: 'Cane Fusion', description: 'Cane Fusion category' },
          { id: '3', name: 'Special', description: 'Special category' },
          { id: '4', name: 'Cane Blend', description: 'Cane Blend category' },
          { id: '5', name: 'Others', description: 'Other products' }
        ]);
      }
    };

    loadCategories();
  }, []);



  // Cart operations
  const addToCart = useCallback((product, quantity = 1) => {
    console.log('addToCart called with:', product.name, 'quantity:', quantity);
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...prevCart, { ...product, quantity }];
      }
    });
    toast.success(`${product.name} added to cart`);
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  }, []);

  const updateCartQuantity = useCallback((productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // Calculate cart total
  const getCartTotal = useCallback(() => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [cart]);

  // Calculate cart tax
  const getCartTax = useCallback(() => {
    return cart.reduce((tax, item) => {
      const itemTotal = item.price * item.quantity;
      const itemTax = (itemTotal * (item.taxPercentage || 0)) / 100;
      return tax + itemTax;
    }, 0);
  }, [cart]);

  // Calculate cart subtotal (total before tax)
  const getCartSubtotal = useCallback(() => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [cart]);

  // Product CRUD operations
  const addProduct = useCallback(async (productData) => {
    try {
      // Check for duplicates
      const existingProducts = await supabaseOperations.products.getByName(productData.name);
      if (existingProducts.length > 0) {
        toast.error(`Product "${productData.name}" already exists`);
        throw new Error(`Duplicate product: ${productData.name}`);
      }

      const newProduct = {
        ...productData,
        type: productData.type,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Add to Supabase
      const result = await supabaseOperations.products.create(newProduct);
      
      toast.success('Product added successfully');
      return result;
    } catch (error) {
      console.error('Error adding product:', error);
      if (!error.message.includes('Duplicate product')) {
        toast.error('Failed to add product');
      }
      throw error;
    }
  }, []);

  const updateProduct = useCallback(async (id, productData) => {
    try {
      const updatedProduct = {
        ...productData,
        updated_at: new Date().toISOString()
      };

      const result = await supabaseOperations.products.update(id, updatedProduct);
      
      toast.success('Product updated successfully');
      return result;
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product');
      throw error;
    }
  }, []);

  const deleteProduct = useCallback(async (productId) => {
    try {
      await supabaseOperations.products.delete(productId);
      toast.success('Product deleted successfully');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
      throw error;
    }
  }, []);

  // Bulk operations
  const bulkDeleteProducts = useCallback(async (productIds) => {
    try {
      await supabaseOperations.products.bulkDelete(productIds);
      toast.success(`${productIds.length} products deleted successfully`);
    } catch (error) {
      console.error('Error bulk deleting products:', error);
      toast.error('Failed to delete products');
      throw error;
    }
  }, []);

  const bulkUpdateVisibility = useCallback(async (productIds, isVisible) => {
    try {
      const updates = productIds.map(id => ({
        id,
        is_visible: isVisible,
        updated_at: new Date().toISOString()
      }));
      
      await supabaseOperations.products.bulkUpdate(updates);
      
      const action = isVisible ? 'shown' : 'hidden';
      toast.success(`${productIds.length} products ${action} successfully`);
    } catch (error) {
      console.error('Error bulk updating visibility:', error);
      toast.error('Failed to update product visibility');
      throw error;
    }
  }, []);

  // Stock operations
  const updateStock = useCallback(async (productId, newStock) => {
    try {
      await supabaseOperations.products.updateStock(productId, newStock);
      toast.success('Stock updated successfully');
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('Failed to update stock');
      throw error;
    }
  }, []);

  // Search and filter functions
  const searchProducts = useCallback((searchTerm) => {
    if (!searchTerm.trim()) return products;
    
    const term = searchTerm.toLowerCase();
    return products.filter(product => 
      product.name.toLowerCase().includes(term) ||
      product.barcode?.toLowerCase().includes(term) ||
      product.type?.toLowerCase().includes(term)
    );
  }, [products]);

  const getProductsByCategory = useCallback((category) => {
    if (!category) return products;
    return products.filter(product => product.type === category);
  }, [products]);

  const getLowStockProducts = useCallback((threshold = 10) => {
    return products.filter(product => 
      product.stock !== undefined && product.stock <= threshold
    );
  }, [products]);

  // Category operations
  const addCategory = useCallback(async (categoryData) => {
    try {
      const newCategory = await supabaseOperations.categories.create(categoryData);
      setCategories(prev => [...prev, newCategory]);
      toast.success('Category added successfully');
      return newCategory;
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error('Failed to add category');
      throw error;
    }
  }, []);

  const deleteCategory = useCallback(async (categoryId) => {
    try {
      await supabaseOperations.categories.delete(categoryId);
      setCategories(prev => prev.filter(cat => cat.id !== categoryId));
      toast.success('Category deleted successfully');
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
      throw error;
    }
  }, []);

  const getCategoriesForDropdown = useCallback(() => {
    return categories.map(cat => ({
      value: cat.name.toLowerCase(),
      label: cat.name
    }));
  }, [categories]);

  // Statistics
  const getInventoryStats = useCallback(() => {
    const totalProducts = products.length;
    const totalValue = products.reduce((sum, product) => {
      return sum + (product.price * (product.stock || 0));
    }, 0);
    const lowStockCount = getLowStockProducts().length;
    const outOfStockCount = products.filter(p => p.stock === 0).length;
    
    return {
      totalProducts,
      totalValue,
      lowStockCount,
      outOfStockCount
    };
  }, [products, getLowStockProducts]);

  // Sales operations
  const [sales, setSales] = useState([]);

  /**
   * Loads recent sales from Supabase database
   * @param {number} limit - Maximum number of sales to load (default: 50)
   * @returns {Promise<Array>} Array of sales data or empty array on error
   */
  const loadSales = useCallback(async (limit = 50) => {
    try {
      if (!limit || limit <= 0) {
        throw new Error('Invalid limit parameter');
      }
      
      const data = await supabaseOperations.sales.getAll(limit);
      const salesData = data || [];
      setSales(salesData);
      console.log(`Loaded ${salesData.length} recent sales from Supabase`);
      return salesData;
    } catch (error) {
      console.error('Error loading sales:', error);
      toast.error(`Failed to load sales: ${error.message}`);
      return [];
    }
  }, []);

  /**
   * Adds a new sale to the database with duplicate prevention
   * @param {Object} saleData - Sale data object containing transaction details
   * @param {string} saleData.transactionId - Unique transaction identifier
   * @param {Array} saleData.items - Array of sale items
   * @param {number} saleData.total - Total sale amount
   * @returns {Promise<Object|null>} Created sale object or null if duplicate/error
   */
  const addSale = useCallback(async (saleData) => {
    try {
      // Input validation
      if (!saleData || typeof saleData !== 'object') {
        throw new Error('Invalid sale data provided');
      }
      
      if (!saleData.items || !Array.isArray(saleData.items) || saleData.items.length === 0) {
        throw new Error('Sale must contain at least one item');
      }
      
      if (!saleData.total || saleData.total <= 0) {
        throw new Error('Sale total must be greater than zero');
      }
      
      console.log('Adding sale:', saleData);
      
      // Check for duplicates before adding
      const isDuplicate = await checkForDuplicates(saleData);
      if (isDuplicate) {
        console.log('Duplicate sale detected, skipping...');
        toast.warning('Duplicate sale detected and prevented');
        return null;
      }
      
      // Add unique transaction ID if not present
      const saleWithId = {
        ...saleData,
        transactionId: saleData.transactionId || `INVCFN${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Primary: Try to save to Supabase
      try {
        const newSale = await supabaseOperations.sales.create(saleWithId);
        if (!newSale || !newSale.id) {
          throw new Error('Invalid response from Supabase - no sale ID returned');
        }
        
        setSales(prev => [newSale, ...prev]);
        console.log('Sale added to Supabase:', newSale);
        toast.success('Sale recorded successfully!');
        return newSale.id;
      } catch (supabaseError) {
        console.error('Supabase error details:', {
          message: supabaseError.message,
          code: supabaseError.code,
          details: supabaseError.details
        });
        
        // Fallback: Try Firebase if available
        if (typeof window !== 'undefined' && window.addSaleToFirebase) {
          try {
            console.log('Attempting Firebase fallback for sale...');
            const docId = await window.addSaleToFirebase(saleWithId);
            
            if (!docId) {
              throw new Error('Firebase fallback failed - no document ID returned');
            }
            
            console.log('Sale added to Firebase fallback:', docId);
            toast.success('Sale recorded successfully (Firebase fallback)!');
            return docId;
          } catch (firebaseError) {
            console.error('Firebase fallback error:', firebaseError);
            throw new Error(`Both Supabase and Firebase failed: ${supabaseError.message}; Firebase: ${firebaseError.message}`);
          }
        } else {
          // No fallback available, provide detailed error
          throw new Error(`Supabase error: ${supabaseError.message || 'Unknown database error'}`);
        }
      }
    } catch (error) {
      console.error('Error adding sale:', error);
      toast.error('Failed to record sale');
      throw error;
    }
  }, []);

  /**
   * Retrieves sales within a specified date range
   * @param {Date|string} startDate - Start date for the range
   * @param {Date|string} endDate - End date for the range
   * @returns {Promise<Array>} Array of sales within the date range
   */
  const getSalesByDateRange = useCallback(async (startDate, endDate) => {
    try {
      // Input validation
      if (!startDate || !endDate) {
        throw new Error('Both start date and end date are required');
      }
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error('Invalid date format provided');
      }
      
      if (start > end) {
        throw new Error('Start date cannot be after end date');
      }
      
      const data = await supabaseOperations.sales.getByDateRange(startDate, endDate);
      return data || [];
    } catch (error) {
      console.error('Error getting sales by date range:', error);
      toast.error(`Failed to retrieve sales: ${error.message}`);
      return [];
    }
  }, []);

  /**
   * Deletes a sale from the database
   * @param {string} id - Unique identifier of the sale to delete
   * @returns {Promise<boolean>} True if deletion was successful
   * @throws {Error} If deletion fails
   */
  const deleteSale = useCallback(async (id) => {
    try {
      if (!id) {
        throw new Error('Sale ID is required for deletion');
      }
      
      await supabaseOperations.sales.delete(id);
      setSales(prev => prev.filter(s => s.id !== id));
      toast.success('Sale deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting sale:', error);
      toast.error(`Failed to delete sale: ${error.message}`);
      throw error;
    }
  }, []);

  /**
   * Checks for duplicate sales based on transaction ID within a 5-minute window
   * @param {Object} saleData - Sale data to check for duplicates
   * @param {string} saleData.transactionId - Transaction ID to check
   * @returns {Promise<boolean>} True if duplicate is found, false otherwise
   */
  const checkForDuplicates = useCallback(async (saleData) => {
    try {
      if (!saleData || !saleData.transactionId) {
        throw new Error('Sale data with transaction ID is required');
      }
      
      // Check for sales with the same transaction ID in the last 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('sales')
        .select('id')
        .eq('transactionId', saleData.transactionId)
        .gte('created_at', fiveMinutesAgo)
        .limit(1);
      
      if (error) throw error;
      
      return data && data.length > 0;
    } catch (error) {
      console.error('Error checking for duplicate sales:', error);
      return false; // Assume no duplicates if check fails
    }
  }, []);

  // Load sales on component mount
  useEffect(() => {
    loadSales();
  }, [loadSales]);

  // Context value
  const value = useMemo(() => ({
    // State
    products,
    categories,
    cart,
    loading,
    isOnline,
    pendingUpdates,
    sales,
    
    // Cart operations
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    getCartTotal,
    getCartTax,
    getCartSubtotal,
    
    // Product CRUD
    addProduct,
    updateProduct,
    deleteProduct,
    
    // Category operations
    addCategory,
    deleteCategory,
    getCategoriesForDropdown,
    
    // Bulk operations
    bulkDeleteProducts,
    bulkUpdateVisibility,
    
    // Stock operations
    updateStock,
    
    // Search and filter
    searchProducts,
    getProductsByCategory,
    getLowStockProducts,
    
    // Sales operations
    addSale,
    loadSales,
    getSalesByDateRange,
    deleteSale,
    checkForDuplicates,
    
    // Statistics
    getInventoryStats,
    
    // Utilities
  }), [products, categories, cart, loading, isOnline, pendingUpdates, sales, addToCart, removeFromCart, 
      updateCartQuantity, clearCart, getCartTotal, getCartTax, getCartSubtotal, addProduct, updateProduct, deleteProduct, addCategory, 
      deleteCategory, getCategoriesForDropdown, bulkDeleteProducts, bulkUpdateVisibility, 
      updateStock, searchProducts, getProductsByCategory, getLowStockProducts, addSale, loadSales, getSalesByDateRange, deleteSale, 
      checkForDuplicates, getInventoryStats]);

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
};