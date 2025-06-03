import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { db } from '../firebase/config'
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  writeBatch,
  where
} from 'firebase/firestore'
import { supabaseOperations } from '../utils/supabaseOperations'
import toast from 'react-hot-toast'
// Create the context here instead of importing it
const InventoryContext = createContext()
import { useSync } from './SyncContext'
import { v4 as uuidv4 } from 'uuid'
import { checkForDuplicateProducts, checkForIdDuplicates } from '../utils/duplicateChecker'
import { preventDuplicateCreation } from '../utils/duplicatePrevention.js'
import { syncFirebaseToJSON, checkSyncStatus } from '../utils/inventorySync'

function InventoryProvider({ children }) {
  console.log('📦 InventoryProvider rendering at:', new Date().toISOString())
  console.log('📦 InventoryProvider instance ID:', Math.random().toString(36).substr(2, 9))
  
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [sales, setSales] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [pendingUpdates, setPendingUpdates] = useState(new Set())
  const { queueOperation, isOnline, syncCollection } = useSync()
  // Load products from Firestore with real-time updates
  useEffect(() => {
    console.log('InventoryContext: Setting up real-time listener')
    
    const productsQuery = query(collection(db, 'products'), orderBy('name', 'asc')) // Removed limit(50)
    const unsubscribe = onSnapshot(
      productsQuery,
      (snapshot) => {
        const productsData = snapshot.docs.map(doc => {
          const productData = {
            id: doc.id,
            ...doc.data()
          }
          
          // Add type field based on product name if it doesn't exist
          if (!productData.type) {
            productData.type = getCategoryGroup(productData.name)
          }
          
          return productData
        })
        
        console.log(`InventoryContext: Loaded ${productsData.length} products (real-time)`)
        
        // Check for duplicates in the loaded data
        const duplicates = checkForDuplicateProducts(productsData)
        const idDuplicates = checkForIdDuplicates(productsData)
        
        if (duplicates.length > 0 || idDuplicates.length > 0) {
          console.warn('⚠️ Duplicates detected in Firebase data!')
        }
        
        // Merge with existing products, preserving pending updates for items within the current view
        setProducts(prevProducts => {
          const productsFromDBMap = new Map(productsData.map(p => [p.id, p]));
          
          // Filter productsData to remove duplicates based on name and barcode, keeping the first encountered.
          const uniqueProductsData = [];
          const seenNameBarcode = new Set();
          for (const product of productsData) {
            const key = `${product.name}_${product.barcode}`;
            if (!seenNameBarcode.has(key)) {
              uniqueProductsData.push(product);
              seenNameBarcode.add(key);
            } else {
              console.warn(`InventoryContext: Filtering out duplicate product (name_barcode) from Firebase data: ${product.name} (${product.barcode}), ID: ${product.id}`);
            }
          }
          
          // Create a map of the unique products from the database for efficient lookup
          const uniqueProductsFromDBMap = new Map(uniqueProductsData.map(p => [p.id, p]));
          
          // Start with unique products from the current database snapshot
          let mergedProducts = uniqueProductsData.map(dbProduct => {
            // If there's a pending update for this product, use the local version
            if (pendingUpdates.has(dbProduct.id)) {
              const localPendingProduct = prevProducts.find(p => p.id === dbProduct.id);
              if (localPendingProduct) {
                console.log(`InventoryContext: Using local pending version for ${dbProduct.id}`);
                return localPendingProduct;
              }
            }
            return dbProduct;
          });
          
          // Add pending new products (those in prevProducts with pendingAdd flag but not in uniqueProductsFromDBMap)
          prevProducts.forEach(prevProduct => {
            if (prevProduct.pendingAdd && !uniqueProductsFromDBMap.has(prevProduct.id)) {
              // Ensure it's not a duplicate by name_barcode before adding
              const key = `${prevProduct.name}_${prevProduct.barcode}`;
              if (!seenNameBarcode.has(key)) {
                mergedProducts.push(prevProduct);
                seenNameBarcode.add(key); // Add to seen set to prevent re-adding if it was also in productsData but filtered
                console.log(`InventoryContext: Adding pending new product: ${prevProduct.name}`);
              } else {
                 console.warn(`InventoryContext: Pending new product ${prevProduct.name} (${prevProduct.barcode}) is a duplicate of an existing product from DB. Not adding.`);
              }
            }
          });
          
          // Sort the final merged list by name
          mergedProducts.sort((a, b) => a.name.localeCompare(b.name));
          
          console.log(`InventoryContext: Products for current view. DB (unique) count: ${uniqueProductsData.length}, Merged count: ${mergedProducts.length}`);
          
          const postMergeDuplicates = checkForDuplicateProducts(mergedProducts) // Checks name_barcode duplicates
          const postMergeIdDuplicates = checkForIdDuplicates(mergedProducts) // Checks ID duplicates
          
          if (postMergeDuplicates.length > 0) {
            console.warn('⚠️ Name/Barcode duplicates detected after merging and filtering! This might indicate an issue with pending updates or IDs.', postMergeDuplicates);
          }
          if (postMergeIdDuplicates.length > 0) {
            console.warn('⚠️ ID duplicates detected after merging and filtering! This indicates a serious issue.', postMergeIdDuplicates);
          }
          
          return mergedProducts;
        });
        setLoading(false)
      },
      (error) => {
        console.error('Error loading products from Firestore:', error)
        setProducts([])
        setLoading(false)
      }
    )

    return () => {
      console.log('InventoryContext: Cleanup - unsubscribing from real-time listener')
      unsubscribe()
    }
  }, []) // Removed pendingUpdates dependency to prevent infinite re-renders

  // Load sales from Firestore with real-time updates
  useEffect(() => {
    console.log('InventoryContext: Setting up sales real-time listener')
    
    const salesQuery = query(collection(db, 'sales'), orderBy('createdAt', 'desc'), limit(100)) // Added limit(100)
    const unsubscribe = onSnapshot(
      salesQuery,
      (snapshot) => {
        const salesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        
        console.log(`InventoryContext: Loaded ${salesData.length} sales records (real-time)`)
        setSales(salesData)
      },
      (error) => {
        console.error('Error loading sales from Firestore:', error)
        setSales([])
      }
    )

    return () => {
      console.log('InventoryContext: Cleanup - unsubscribing from sales listener')
      unsubscribe()
    }
  }, [])

  // Cleanup mechanism for stuck pending updates
  useEffect(() => {
    const cleanup = setInterval(() => {
      setPendingUpdates(prev => {
        if (prev.size > 0) {
          console.log('Cleaning up pending updates:', Array.from(prev))
          // Clear pending updates that are older than 30 seconds
          // In a real app, you'd want more sophisticated tracking
          return new Set()
        }
        return prev
      })
    }, 60000) // Increased interval to 60 seconds to reduce CPU usage

    return () => {
      clearInterval(cleanup)
    }
  }, [])

  // Category mapping function
  const getCategoryGroup = useCallback((productName) => {
    const name = productName.toLowerCase()
    
    // Citrus fruits
    if (name.includes('lemon') || name.includes('orange') || name.includes('mosambi') || name.includes('lime')) {
      return 'citrus'
    }
    
    // Berries
    if (name.includes('strawberry') || name.includes('blueberry') || name.includes('gooseberry') || name.includes('grapes') || name.includes('jamun')) {
      return 'berries'
    }
    
    // Tropical fruits
    if (name.includes('pineapple') || name.includes('mango') || name.includes('dragon fruit') || name.includes('guava') || 
        name.includes('jackfruit') || name.includes('avocado') || name.includes('watermelon') || name.includes('muskmelon') ||
        name.includes('pomegranate') || name.includes('fig') || name.includes('tender coconut') || name.includes('ice apple')) {
      return 'tropical'
    }
    
    // Spiced, herbal & others
    return 'spiced, herbal & others'
  }, [])




  // Add product to cart
  const addToCart = useCallback((product, quantity = 1) => {
    console.log('addToCart called with:', product.name, 'quantity:', quantity)
    setCart(prevCart => {
      console.log('Current cart before adding:', prevCart.length, 'items')
      const existingItem = prevCart.find(item => item.id === product.id)
      if (existingItem) {
        console.log('Product already in cart, updating quantity')
        const newCart = prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
        console.log('New cart after update:', newCart.length, 'items')
        return newCart
      } else {
        console.log('Adding new product to cart')
        const newCart = [...prevCart, { ...product, quantity }]
        console.log('New cart after adding:', newCart.length, 'items')
        return newCart
      }
    })
    toast.success(`${product.name} added to cart`)
  }, [])

  // Remove from cart
  const removeFromCart = useCallback((productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId))
  }, [])

  // Update cart item quantity
  const updateCartQuantity = useCallback((productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    )
  }, [removeFromCart])

  // Clear cart
  const clearCart = useCallback(() => {
    setCart([])
  }, [])

  // Add product with sync support
  const addProduct = useCallback(async (productData) => {
    try {
      // Check for duplicates before creating the product
      const duplicateCheck = await preventDuplicateCreation(productData);
      
      if (duplicateCheck.isDuplicate) {
        toast.error(`Product "${productData.name}" already exists in the database`);
        console.warn('Duplicate product creation prevented:', {
          attempted: productData.name,
          existing: duplicateCheck.existingId
        });
        throw new Error(`Duplicate product: ${productData.name}`);
      }
      
      const newProduct = {
        ...productData,
        id: Date.now().toString(),
        type: productData.type || getCategoryGroup(productData.name),
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // Add to local state immediately
      setProducts(prev => [...prev, newProduct])
      
      // Mark as pending update
      setPendingUpdates(prev => new Set(prev).add(newProduct.id))
      
      try {
        // Queue for sync
        await queueOperation({
          collection: 'products',
          operation: 'create',  // Changed from 'type' to 'operation'
          data: newProduct,
          id: newProduct.id  // Ensure id is explicitly set
        })
        
        // Clear pending update
        setPendingUpdates(prev => {
          const updated = new Set(prev)
          updated.delete(newProduct.id)
          return updated
        })
        
        // Check if JSON file needs to be synced
        setTimeout(async () => {
          try {
            const syncStatus = await checkSyncStatus()
            if (syncStatus.needsSync) {
              console.log('📋 JSON sync needed:', syncStatus.reason)
            }
          } catch (error) {
            console.warn('Could not check sync status:', error)
          }
        }, 1000)
        
        toast.success('Product added successfully')
        return newProduct
      } catch (error) {
        console.error('Error adding product:', error)
        toast.error('Failed to add product')
        throw error
      }
    } catch (error) {
      if (error.message.includes('Duplicate product')) {
        // Re-throw duplicate errors as they're already handled
        throw error;
      }
      console.error('Error in duplicate check:', error);
      toast.error('Failed to validate product uniqueness');
      throw error;
    }
  }, [getCategoryGroup, queueOperation])

  // Delete product with sync support
  const deleteProduct = useCallback(async (productId) => {
    // Store the product to delete for potential restoration
    const productToDelete = products.find(p => p.id === productId)
    
    try {
      // Remove from local state immediately for optimistic updates
      setProducts(prev => prev.filter(p => p.id !== productId))
      
      // Add to pending updates to prevent real-time listener from re-adding
      setPendingUpdates(prev => new Set([...prev, productId]))
      
      if (isOnline) {
        // Try immediate sync
        await deleteDoc(doc(db, 'products', productId))
        // Remove from pending updates after successful sync
        setPendingUpdates(prev => {
          const newSet = new Set(prev)
          newSet.delete(productId)
          return newSet
        })
        
        // Check if JSON file needs to be synced
        setTimeout(async () => {
          try {
            const syncStatus = await checkSyncStatus()
            if (syncStatus.needsSync) {
              console.log('📋 JSON sync needed:', syncStatus.reason)
            }
          } catch (error) {
            console.warn('Could not check sync status:', error)
          }
        }, 1000)
      } else {
        // Queue for sync when online
        queueOperation({
          operation: 'delete',  // Changed from 'type' to 'operation'
          collection: 'products',
          id: productId  // Ensure id is explicitly set
        })
        throw new Error('Device is offline - deletion will sync when online')
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      
      // Restore product on error
      if (productToDelete) {
        setProducts(prev => [...prev, productToDelete])
      }
      
      // Remove from pending updates on error
      setPendingUpdates(prev => {
        const newSet = new Set(prev)
        newSet.delete(productId)
        return newSet
      })
      
      // Queue for retry if immediate sync failed and we're online
      if (isOnline) {
        queueOperation({
          operation: 'delete',  // Changed from 'type' to 'operation'
          collection: 'products',
          id: productId  // Ensure id is explicitly set
        })
      }
      
      throw error // Re-throw to let the component handle the error
    }
  }, [products, isOnline, queueOperation])

  // Update product with sync support
  const updateProduct = useCallback(async (id, productData) => {
    console.log('Updating product with ID:', id, 'Data:', productData);
    
    const updatedProduct = {
      ...productData,
      type: productData.type || getCategoryGroup(productData.name),
      updatedAt: new Date()
    }
    
    // Update local state immediately
    setProducts(prev =>
      prev.map(product =>
        product.id === id ? { ...product, ...updatedProduct, id } : product
      )
    )
    
    // Mark as pending update
    setPendingUpdates(prev => new Set(prev).add(id))
    
    try {
      // Queue for sync
      await queueOperation({
        collection: 'products',
        operation: 'update',  // Changed from 'type' to 'operation'
        data: updatedProduct,
        id: id  // Ensure id is explicitly set
      })
      
      // Clear pending update
      setPendingUpdates(prev => {
        const updated = new Set(prev)
        updated.delete(id)
        return updated
      })
      
      // Check if JSON file needs to be synced
      setTimeout(async () => {
        try {
          const syncStatus = await checkSyncStatus()
          if (syncStatus.needsSync) {
            console.log('📋 JSON sync needed:', syncStatus.reason)
          }
        } catch (error) {
          console.warn('Could not check sync status:', error)
        }
      }, 1000)
      
      toast.success('Product updated successfully')
      return { id, ...updatedProduct }
    } catch (error) {
      console.error('Error updating product:', error)
      toast.error('Failed to update product')
      throw error
    }
  }, [getCategoryGroup, queueOperation])

  // Auto-sync inventory data from JSON file to Firebase
  const autoSyncInventoryToFirebase = async () => {
    try {
      console.log('🔄 Auto-syncing inventory from formatted_inventory.json to Firebase...')
      
      // Fetch the inventory JSON data from formatted_inventory.json
      const response = await fetch('/formatted_inventory.json')
      if (!response.ok) {
        console.warn('Could not fetch formatted_inventory.json for auto-sync')
        return
      }
      const inventoryData = await response.json()
      
      // Get all existing products from Firebase
      const snapshot = await getDocs(collection(db, 'products'))
      const existingProducts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      
      // Create a map of existing products by name for quick lookup
      const existingProductsMap = new Map()
      existingProducts.forEach(product => {
        existingProductsMap.set(product.name, product)
      })
      
      // Track changes
      let addedCount = 0
      let updatedCount = 0
      let deletedCount = 0
      
      // Add or update products from JSON
      const syncPromises = inventoryData.map(async (item) => {
        const productData = {
          name: item.name,
          category: item.category,
          price: item.price,
          taxPercentage: item.taxPercentage,
          stock: item.stock || 50,
          updatedAt: new Date()
        }
        
        // Add size field if it exists
        if (item.size) {
          productData.size = item.size
        }
        
        const existingProduct = existingProductsMap.get(item.name)
        
        if (existingProduct) {
          // Update existing product if data has changed
          const hasChanges = (
            existingProduct.category !== item.category ||
            existingProduct.price !== item.price ||
            existingProduct.taxPercentage !== item.taxPercentage ||
            existingProduct.size !== item.size
          )
          
          if (hasChanges) {
            await updateDoc(doc(db, 'products', existingProduct.id), productData)
            updatedCount++
            console.log(`📝 Updated product: ${item.name}`)
          }
          
          // Remove from map to track what's left for deletion
          existingProductsMap.delete(item.name)
        } else {
          // Add new product
          productData.createdAt = new Date()
          await addDoc(collection(db, 'products'), productData)
          addedCount++
          console.log(`➕ Added new product: ${item.name}`)
        }
      })
      
      await Promise.all(syncPromises)
      
      // Delete products that are no longer in the JSON file
      const deletePromises = Array.from(existingProductsMap.values()).map(async (product) => {
        await deleteDoc(doc(db, 'products', product.id))
        deletedCount++
        console.log(`🗑️ Removed product: ${product.name}`)
      })
      
      await Promise.all(deletePromises)
      
      // Log summary
      if (addedCount > 0 || updatedCount > 0 || deletedCount > 0) {
        console.log(`✅ Auto-sync completed: +${addedCount} added, ~${updatedCount} updated, -${deletedCount} deleted`)
        toast.success(`Inventory synced: ${addedCount} added, ${updatedCount} updated, ${deletedCount} removed`)
      } else {
        console.log('✅ Auto-sync completed: No changes detected')
      }
      
    } catch (error) {
      console.error('❌ Error during auto-sync:', error)
      // Don't show error toast for auto-sync failures to avoid spam
    }
  }
  
  // Auto-sync on component mount and periodically - TEMPORARILY DISABLED to prevent data duplication
  // useEffect(() => {
  //   console.log('🚀 Setting up auto-sync for inventory...')
  //   
  //   // Initial sync after a short delay
  //   const initialSyncTimer = setTimeout(() => {
  //     autoSyncInventoryToFirebase()
  //   }, 2000)
  //   
  //   // Periodic sync every 30 seconds
  //   const syncInterval = setInterval(() => {
  //     autoSyncInventoryToFirebase()
  //   }, 30000)
  //   
  //   return () => {
  //     clearTimeout(initialSyncTimer)
  //     clearInterval(syncInterval)
  //     console.log('🛑 Auto-sync cleanup completed')
  //   }
  // }, [])
  
  console.log('⚠️ Auto-sync is temporarily disabled to prevent data duplication issues')
  
  // Manual upload function (kept for backward compatibility)
  const uploadAllInventoryToFirebase = useCallback(async () => {
    try {
      setLoading(true)
      await autoSyncInventoryToFirebase()
    } catch (error) {
      console.error('Error uploading inventory to Firebase:', error)
      toast.error('Failed to upload inventory data to Firebase')
    } finally {
      setLoading(false)
    }
  }, [autoSyncInventoryToFirebase])



  // Calculate cart total
  const getCartTotal = useCallback(() => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  }, [cart])

  // Calculate cart tax
  const getCartTax = useCallback(() => {
    return cart.reduce((tax, item) => {
      const itemTotal = item.price * item.quantity
      const itemTax = (itemTotal * item.taxPercentage) / 100
      return tax + itemTax
    }, 0)
  }, [cart])

  // Calculate cart subtotal (total before tax)
  const getCartSubtotal = useCallback(() => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  }, [cart])

  // Check for duplicate sales
  const checkForDuplicates = useCallback(async (newSale) => {
    try {
      const salesQuery = query(
        collection(db, 'sales'),
        orderBy('timestamp', 'desc'),
        limit(50) // Check last 50 sales for performance
      )
      const snapshot = await getDocs(salesQuery)
      
      const recentSales = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || doc.data().timestamp
      }))
      
      // Check for duplicates within last 5 minutes with same total and items count
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      const newSaleTime = new Date(newSale.timestamp)
      
      const duplicates = recentSales.filter(sale => {
        const saleTime = new Date(sale.timestamp)
        return (
          Math.abs(saleTime - newSaleTime) < 10000 && // Within 10 seconds
          Math.abs(sale.total - newSale.total) < 0.01 && // Same total (accounting for floating point)
          sale.items?.length === newSale.items?.length && // Same number of items
          sale.paymentMethod === newSale.paymentMethod // Same payment method
        )
      })
      
      return duplicates.length > 0
    } catch (error) {
      console.error('Error checking for duplicates:', error)
      return false // If check fails, allow the sale to proceed
    }
  }, [])

  // Clean up duplicate sales
  const cleanupDuplicates = useCallback(async () => {
    try {
      console.log('Starting duplicate cleanup...')
      const salesQuery = query(collection(db, 'sales'), orderBy('timestamp', 'desc'))
      const snapshot = await getDocs(salesQuery)
      
      const allSales = snapshot.docs.map(doc => ({
        id: doc.id,
        docRef: doc.ref,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || doc.data().timestamp
      }))
      
      const duplicatesToDelete = []
      const seenSales = new Map()
      
      // Group sales by potential duplicate criteria
      allSales.forEach(sale => {
        const key = `${sale.total}_${sale.items?.length}_${sale.paymentMethod}_${Math.floor(new Date(sale.timestamp).getTime() / 10000)}` // 10-second window
        
        if (seenSales.has(key)) {
          // This is a potential duplicate
          const existingSale = seenSales.get(key)
          const timeDiff = Math.abs(new Date(sale.timestamp) - new Date(existingSale.timestamp))
          
          // If within 10 seconds and same details, mark as duplicate
          if (timeDiff < 10000) {
            duplicatesToDelete.push(sale)
          }
        } else {
          seenSales.set(key, sale)
        }
      })
      
      // Delete duplicates
      if (duplicatesToDelete.length > 0) {
        console.log(`Found ${duplicatesToDelete.length} duplicate sales to delete`)
        const deletePromises = duplicatesToDelete.map(sale => deleteDoc(sale.docRef))
        await Promise.all(deletePromises)
        
        console.log(`Successfully deleted ${duplicatesToDelete.length} duplicate sales`)
        return { removedCount: duplicatesToDelete.length }
      } else {
        console.log('No duplicate sales found')
        return { removedCount: 0 }
      }
    } catch (error) {
      console.error('Error cleaning up duplicates:', error)
      throw error
    }
  }, [])

  // Add sale to Firebase with duplicate prevention
  const addSale = useCallback(async (saleData) => {
    try {
      console.log('Adding sale to Firebase:', saleData)
      
      // Check for duplicates before adding
      const isDuplicate = await checkForDuplicates(saleData)
      if (isDuplicate) {
        console.log('Duplicate sale detected, skipping...')
        toast.warning('Duplicate sale detected and prevented')
        return null
      }
      
      // Add unique transaction ID if not present
      const saleWithId = {
        ...saleData,
        transactionId: saleData.transactionId || uuidv4(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      const docRef = await addDoc(collection(db, 'sales'), saleWithId)
      console.log('Sale added with ID:', docRef.id)
      toast.success('Sale recorded successfully!')
      return docRef.id
    } catch (error) {
      console.error('Error adding sale to Firebase:', error)
      toast.error('Failed to record sale')
      throw error
    }
  }, [checkForDuplicates])

  // Load categories from Firestore with real-time updates
  useEffect(() => {
    console.log('InventoryContext: Setting up categories real-time listener')
    let hasInitialized = false
    
    const categoriesQuery = query(collection(db, 'categories'), orderBy('name', 'asc'))
    const unsubscribe = onSnapshot(
      categoriesQuery,
      async (snapshot) => {
        const categoriesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        
        console.log(`InventoryContext: Loaded ${categoriesData.length} categories (real-time)`)
        
        // If no categories exist and we haven't initialized yet, add default ones
        if (categoriesData.length === 0 && !hasInitialized) {
          hasInitialized = true
          console.log('No categories found, adding default categories...')
          const defaultCategories = [
            { name: 'Cane Blend', description: 'Fresh sugarcane juice blended with natural flavors' },
            { name: 'Cane Fusion', description: 'Premium fusion drinks with sugarcane base' },
            { name: 'Cane Pops', description: 'Frozen sugarcane treats and popsicles' },
            { name: 'Cane Special', description: 'Special signature sugarcane beverages' },
            { name: 'Others', description: 'Additional items and accessories' }
          ]
          
          try {
            for (const category of defaultCategories) {
              await addDoc(collection(db, 'categories'), {
                ...category,
                createdAt: new Date(),
                updatedAt: new Date()
              })
            }
            console.log('Default categories added successfully')
          } catch (error) {
            console.error('Error adding default categories:', error)
          }
        } else {
          setCategories(categoriesData)
        }
      },
      (error) => {
        console.error('Error loading categories from Firestore:', error)
        setCategories([])
      }
    )

    return () => {
      console.log('InventoryContext: Cleanup - unsubscribing from categories listener')
      unsubscribe()
    }
  }, [])

  // Add category
  const addCategory = useCallback(async (categoryData) => {
    try {
      console.log('Adding category to Firebase:', categoryData)
      
      const categoryWithTimestamp = {
        ...categoryData,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      const docRef = await addDoc(collection(db, 'categories'), categoryWithTimestamp)
      console.log('Category added with ID:', docRef.id)
      toast.success('Category created successfully!')
      return docRef.id
    } catch (error) {
      console.error('Error adding category to Firebase:', error)
      toast.error('Failed to create category')
      throw error
    }
  }, [])

  // Update category
  const updateCategory = useCallback(async (id, categoryData) => {
    try {
      console.log('Updating category with ID:', id, 'Data:', categoryData)
      
      const updatedCategory = {
        ...categoryData,
        updatedAt: new Date()
      }
      
      await updateDoc(doc(db, 'categories', id), updatedCategory)
      console.log('Category updated successfully')
      toast.success('Category updated successfully!')
      return { id, ...updatedCategory }
    } catch (error) {
      console.error('Error updating category:', error)
      toast.error('Failed to update category')
      throw error
    }
  }, [])

  // Delete category
  const deleteCategory = useCallback(async (categoryId) => {
    try {
      console.log('Deleting category with ID:', categoryId)
      
      // Check if any products use this category
      const productsUsingCategory = products.filter(product => product.category === categoryId)
      if (productsUsingCategory.length > 0) {
        toast.error(`Cannot delete category. ${productsUsingCategory.length} products are using this category.`)
        return false
      }
      
      await deleteDoc(doc(db, 'categories', categoryId))
      console.log('Category deleted successfully')
      toast.success('Category deleted successfully!')
      return true
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error('Failed to delete category')
      throw error
    }
  }, [products])

  // Get categories for dropdown
  const getCategoriesForDropdown = useCallback(() => {
    return categories.map(category => ({
      value: category.name,
      label: category.name
    }))
  }, [categories])

  const value = useMemo(() => ({
    // State
    products,
    cart,
    sales,
    categories,
    loading,
    
    // Product functions
    getCategoryGroup,
    addProduct,
    updateProduct,
    deleteProduct,
    uploadAllInventoryToFirebase,
    
    // Cart functions
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    getCartTotal,
    getCartTax,
    getCartSubtotal,
    
    // Sales functions
    addSale,
    cleanupDuplicates,
    
    // Category functions
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoriesForDropdown
  }), [
    products,
    cart,
    sales,
    categories,
    loading,
    getCategoryGroup,
    addProduct,
    updateProduct,
    deleteProduct,
    uploadAllInventoryToFirebase,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    getCartTotal,
    getCartTax,
    getCartSubtotal,
    addSale,
    cleanupDuplicates,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoriesForDropdown
  ])

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  )
}

export { InventoryProvider, InventoryContext }