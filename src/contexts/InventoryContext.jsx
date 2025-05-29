import React, { createContext, useState, useEffect } from 'react'
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
  limit
} from 'firebase/firestore'
import toast from 'react-hot-toast'
import { InventoryContext } from '../hooks/useInventory'
import { useSync } from './SyncContext'
import { v4 as uuidv4 } from 'uuid'

function InventoryProvider({ children }) {
  console.log('📦 InventoryProvider rendering at:', new Date().toISOString())
  
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)
  const [pendingUpdates, setPendingUpdates] = useState(new Set())
  const { queueOperation, isOnline, syncCollection } = useSync()
  // Load products from Firestore with real-time updates
  useEffect(() => {
    console.log('InventoryContext: Setting up real-time listener')
    
    const productsQuery = query(collection(db, 'products'), orderBy('name', 'asc'))
    const unsubscribe = onSnapshot(
      productsQuery,
      (snapshot) => {
        const productsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        
        console.log(`InventoryContext: Loaded ${productsData.length} products (real-time)`)
        console.log('Pending updates:', Array.from(pendingUpdates))
        
        // Merge with existing products, preserving pending updates
        setProducts(prevProducts => {
          const mergedProducts = productsData.map(newProduct => {
            // If this product has pending updates, keep the local version
            if (pendingUpdates.has(newProduct.id)) {
              const existingProduct = prevProducts.find(p => p.id === newProduct.id)
              console.log(`Preserving local version for product ${newProduct.id}`)
              return existingProduct || newProduct
            }
            return newProduct
          })
          
          // Add any local products that aren't in Firebase yet and don't have pending updates
          const localOnlyProducts = prevProducts.filter(p => 
            !productsData.find(fp => fp.id === p.id) && !pendingUpdates.has(p.id)
          )
          
          return [...mergedProducts, ...localOnlyProducts]
        })
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
  }, [pendingUpdates])

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
    }, 30000) // Clean up every 30 seconds

    return () => clearInterval(cleanup)
  }, [])

  // Category mapping function
  const getCategoryGroup = (productName) => {
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
  }




  // Add product to cart
  const addToCart = (product, quantity = 1) => {
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
  }

  // Remove from cart
  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId))
  }

  // Update cart item quantity
  const updateCartQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    )
  }

  // Clear cart
  const clearCart = () => {
    setCart([])
  }

  // Add product with sync support
  const addProduct = async (productData) => {
    const newProduct = {
      ...productData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    try {
      // Add to local state immediately for optimistic updates
      setProducts(prev => [...prev, newProduct])
      
      // Add to pending updates to prevent real-time listener from overriding
      setPendingUpdates(prev => new Set([...prev, newProduct.id]))
      
      if (isOnline) {
        // Try immediate sync
        await setDoc(doc(db, 'products', newProduct.id), newProduct)
        // Remove from pending updates after successful sync
        setPendingUpdates(prev => {
          const newSet = new Set(prev)
          newSet.delete(newProduct.id)
          return newSet
        })
      } else {
        // Queue for sync when online
        queueOperation({
          type: 'create',
          collection: 'products',
          id: newProduct.id,
          data: newProduct
        })
        throw new Error('Device is offline - product will sync when online')
      }
      
      return newProduct
    } catch (error) {
      console.error('Error adding product:', error)
      
      // Remove from pending updates on error
      setPendingUpdates(prev => {
        const newSet = new Set(prev)
        newSet.delete(newProduct.id)
        return newSet
      })
      
      // Revert optimistic update on error
      setProducts(prev => prev.filter(p => p.id !== newProduct.id))
      
      // Queue for retry if immediate sync failed and we're online
      if (isOnline) {
        queueOperation({
          type: 'create',
          collection: 'products',
          id: newProduct.id,
          data: newProduct
        })
      }
      
      throw error // Re-throw to let the component handle the error
    }
  }

  // Update product with sync support
  const updateProduct = async (productId, productData) => {
    try {
      // Optimistic update
      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, ...productData, updatedAt: new Date() } : p
      ))
      
      // Add to pending updates to prevent real-time listener conflicts
      setPendingUpdates(prev => new Set([...prev, productId]))
      
      if (isOnline) {
        // Try immediate sync
        const productRef = doc(db, 'products', productId)
        const productDoc = await getDoc(productRef)
        
        if (productDoc.exists()) {
          await updateDoc(productRef, {
            ...productData,
            updatedAt: new Date()
          })
        } else {
          await setDoc(productRef, {
            id: productId,
            ...productData,
            createdAt: new Date(),
            updatedAt: new Date()
          })
        }
        
        // Remove from pending updates on success
        setPendingUpdates(prev => {
          const newSet = new Set(prev)
          newSet.delete(productId)
          return newSet
        })
      } else {
        // Queue for later sync
        queueOperation({
          type: 'update',
          collection: 'products',
          id: productId,
          data: productData
        })
        throw new Error('Device is offline - changes will sync when online')
      }
    } catch (error) {
      console.error('Error updating product:', error)
      
      // Remove from pending updates on error to allow real-time listener to work
      setPendingUpdates(prev => {
        const newSet = new Set(prev)
        newSet.delete(productId)
        return newSet
      })
      
      // Revert optimistic update on error
      const originalProduct = products.find(p => p.id === productId)
      if (originalProduct) {
        setProducts(prev => prev.map(p => 
          p.id === productId ? originalProduct : p
        ))
      }
      
      // Queue for retry if immediate sync failed and we're online
      if (isOnline) {
        queueOperation({
          type: 'update',
          collection: 'products',
          id: productId,
          data: productData
        })
      }
      
      throw error // Re-throw to let the component handle the error
    }
  }

  // Delete product with sync support
  const deleteProduct = async (productId) => {
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
      } else {
        // Queue for sync when online
        queueOperation({
          type: 'delete',
          collection: 'products',
          id: productId
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
          type: 'delete',
          collection: 'products',
          id: productId
        })
      }
      
      throw error // Re-throw to let the component handle the error
    }
  }

  // Upload all inventory data from JSON file to Firebase
  const uploadAllInventoryToFirebase = async () => {
    try {
      setLoading(true)
      
      // Fetch the inventory JSON data from formatted_inventory.json
      const response = await fetch('/formatted_inventory.json')
      if (!response.ok) {
        throw new Error('Failed to fetch inventory data')
      }
      const inventoryData = await response.json()
      
      // Get all existing products from Firebase
      const snapshot = await getDocs(collection(db, 'products'))
      
      // Delete all existing products
      if (snapshot.docs.length > 0) {
        const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref))
        await Promise.all(deletePromises)
        console.log(`Deleted ${snapshot.docs.length} existing products`)
      }
      
      // Transform and upload all inventory data
      const uploadPromises = inventoryData.map(item => {
        const productData = {
          name: item.name,
          category: item.category,
          price: item.price,
          taxPercentage: item.taxPercentage,
          stock: item.stock || 50, // Use existing stock or default
          createdAt: new Date(),
          updatedAt: new Date()
        }
        
        // Add size field if it exists
        if (item.size) {
          productData.size = item.size
        }
        
        return addDoc(collection(db, 'products'), productData)
      })
      
      await Promise.all(uploadPromises)
      
      toast.success(`Successfully uploaded ${inventoryData.length} products to Firebase!`)
      console.log(`Uploaded ${inventoryData.length} products to Firebase`)
    } catch (error) {
      console.error('Error uploading inventory to Firebase:', error)
      toast.error('Failed to upload inventory data to Firebase')
    } finally {
      setLoading(false)
    }
  }



  // Calculate cart total
  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  // Calculate cart tax
  const getCartTax = () => {
    return cart.reduce((tax, item) => {
      const itemTotal = item.price * item.quantity
      const itemTax = (itemTotal * item.taxPercentage) / 100
      return tax + itemTax
    }, 0)
  }

  // Calculate cart subtotal (total before tax)
  const getCartSubtotal = () => {
    return getCartTotal() - getCartTax()
  }

  // Check for duplicate sales
  const checkForDuplicates = async (newSale) => {
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
  }

  // Clean up duplicate sales
  const cleanupDuplicates = async () => {
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
  }

  // Add sale to Firebase with duplicate prevention
  const addSale = async (saleData) => {
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
  }

  const value = {
    products,
    cart,
    loading,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    addProduct,
    updateProduct,
    deleteProduct,
    uploadAllInventoryToFirebase,
    getCartTotal,
    getCartTax,
    getCartSubtotal,
    getCategoryGroup,
    addSale,
    cleanupDuplicates
  }

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  )
}

export { InventoryProvider }