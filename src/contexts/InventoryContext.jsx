import React, { useState, useEffect } from 'react'
import { db } from '../firebase/config'
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot
} from 'firebase/firestore'
import toast from 'react-hot-toast'
import { InventoryContext } from '../hooks/useInventory'

function InventoryProvider({ children }) {
  console.log('📦 InventoryProvider rendering at:', new Date().toISOString())
  
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)
  // Load products from Firestore with real-time updates
  useEffect(() => {
    console.log('InventoryContext: Setting up real-time listener')
    
    const unsubscribe = onSnapshot(
      collection(db, 'products'),
      (snapshot) => {
        const productsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        
        console.log(`InventoryContext: Loaded ${productsData.length} products (real-time)`)
        setProducts(productsData)
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

  // Load default products from CSV data
  const loadDefaultProducts = () => {
    const defaultProducts = [
      // Cane Blend 240ml
    { id: 'CFRST01', name: 'AVOCADO 240ml', category: 'Cane Blend', price: 70, barcode: 'CFRST01', taxPercentage: 12, stock: 50 },
    { id: 'CFRST02', name: 'BLACK SALTED 240ml', category: 'Cane Blend', price: 35, barcode: 'CFRST02', taxPercentage: 12, stock: 50 },
    { id: 'CFRST03', name: 'BLUEBERRY 240ml', category: 'Cane Blend', price: 70, barcode: 'CFRST03', taxPercentage: 12, stock: 50 },
    { id: 'CFRST04', name: 'COFFEE 240ml', category: 'Cane Blend', price: 60, barcode: 'CFRST04', taxPercentage: 12, stock: 50 },
    { id: 'CFRST05', name: 'DRAGON FRUIT 240ml', category: 'Cane Blend', price: 50, barcode: 'CFRST05', taxPercentage: 12, stock: 50 },
    { id: 'CFRST06', name: 'FIG 240ml', category: 'Cane Blend', price: 50, barcode: 'CFRST06', taxPercentage: 12, stock: 50 },
    { id: 'CFRST07', name: 'GINGER 240ml', category: 'Cane Blend', price: 35, barcode: 'CFRST07', taxPercentage: 12, stock: 50 },
    { id: 'CFRST08', name: 'GOOSEBERRY 240ml', category: 'Cane Blend', price: 40, barcode: 'CFRST08', taxPercentage: 12, stock: 50 },
    { id: 'CFRST09', name: 'GRAPES 240ml', category: 'Cane Blend', price: 50, barcode: 'CFRST09', taxPercentage: 12, stock: 50 },
    { id: 'CFRST10', name: 'GUAVA 240ml', category: 'Cane Blend', price: 50, barcode: 'CFRST10', taxPercentage: 12, stock: 50 },
    { id: 'CFRST11', name: 'ICE APPLE 240ml', category: 'Cane Blend', price: 60, barcode: 'CFRST11', taxPercentage: 12, stock: 50 },
    { id: 'CFRST12', name: 'JACKFRUIT 240ml', category: 'Cane Blend', price: 50, barcode: 'CFRST12', taxPercentage: 12, stock: 50 },
    { id: 'CFRST13', name: 'JALJEERA 240ml', category: 'Cane Blend', price: 35, barcode: 'CFRST13', taxPercentage: 12, stock: 50 },
    { id: 'CFRST14', name: 'JAMUN 240ml', category: 'Cane Blend', price: 60, barcode: 'CFRST14', taxPercentage: 12, stock: 50 },
    { id: 'CFRST15', name: 'JUSTCANE (PLAIN) 240ml', category: 'Cane Blend', price: 30, barcode: 'CFRST15', taxPercentage: 12, stock: 50 },
    { id: 'CFRST16', name: 'LEMON 240ml', category: 'Cane Blend', price: 30, barcode: 'CFRST16', taxPercentage: 12, stock: 50 },
    { id: 'CFRST17', name: 'LEMON & GINGER 240ml', category: 'Cane Blend', price: 35, barcode: 'CFRST17', taxPercentage: 12, stock: 50 },
    { id: 'CFRST18', name: 'MINT 240ml', category: 'Cane Blend', price: 35, barcode: 'CFRST18', taxPercentage: 12, stock: 50 },
    { id: 'CFRST19', name: 'MINT & LEMON 240ml', category: 'Cane Blend', price: 40, barcode: 'CFRST19', taxPercentage: 12, stock: 50 },
    { id: 'CFRST20', name: 'MINT, LEMON & GINGER 240ml', category: 'Cane Blend', price: 40, barcode: 'CFRST20', taxPercentage: 12, stock: 50 },
    { id: 'CFRST21', name: 'MOSAMBI 240ml', category: 'Cane Blend', price: 50, barcode: 'CFRST21', taxPercentage: 12, stock: 50 },
    { id: 'CFRST22', name: 'MUSKMELON 240ml', category: 'Cane Blend', price: 50, barcode: 'CFRST22', taxPercentage: 12, stock: 50 },
    { id: 'CFRST23', name: 'ORANGE 240ml', category: 'Cane Blend', price: 50, barcode: 'CFRST23', taxPercentage: 12, stock: 50 },
    { id: 'CFRST24', name: 'PINEAPPLE 240ml', category: 'Cane Blend', price: 50, barcode: 'CFRST24', taxPercentage: 12, stock: 50 },
    { id: 'CFRST25', name: 'POMEGRANATE 240ml', category: 'Cane Blend', price: 60, barcode: 'CFRST25', taxPercentage: 12, stock: 50 },
    { id: 'CFRST26', name: 'STRAWBERRY 240ml', category: 'Cane Blend', price: 70, barcode: 'CFRST26', taxPercentage: 12, stock: 50 },
    { id: 'CFRST27', name: 'WATERMELON 240ml', category: 'Cane Blend', price: 40, barcode: 'CFRST27', taxPercentage: 12, stock: 50 },
      
      // Cane Blend 500ml
    { id: 'CFRST28', name: 'AVOCADO 500 ml', category: 'Cane Blend', price: 140, barcode: 'CFRST28', taxPercentage: 12, stock: 50 },
    { id: 'CFRST29', name: 'BLACK SALTED 500 ml', category: 'Cane Blend', price: 70, barcode: 'CFRST29', taxPercentage: 12, stock: 50 },
    { id: 'CFRST30', name: 'BLUEBERRY 500 ml', category: 'Cane Blend', price: 140, barcode: 'CFRST30', taxPercentage: 12, stock: 50 },
    { id: 'CFRST31', name: 'COFFEE 500 ml', category: 'Cane Blend', price: 120, barcode: 'CFRST31', taxPercentage: 12, stock: 50 },
    { id: 'CFRST32', name: 'DRAGON FRUIT 500 ml', category: 'Cane Blend', price: 100, barcode: 'CFRST32', taxPercentage: 12, stock: 50 },
    { id: 'CFRST33', name: 'FIG 500 ml', category: 'Cane Blend', price: 100, barcode: 'CFRST33', taxPercentage: 12, stock: 50 },
    { id: 'CFRST34', name: 'GINGER 500 ml', category: 'Cane Blend', price: 70, barcode: 'CFRST34', taxPercentage: 12, stock: 50 },
    { id: 'CFRST35', name: 'GOOSEBERRY 500 ml', category: 'Cane Blend', price: 80, barcode: 'CFRST35', taxPercentage: 12, stock: 50 },
    { id: 'CFRST36', name: 'GRAPES 500 ml', category: 'Cane Blend', price: 100, barcode: 'CFRST36', taxPercentage: 12, stock: 50 },
    { id: 'CFRST37', name: 'GUAVA 500 ml', category: 'Cane Blend', price: 100, barcode: 'CFRST37', taxPercentage: 12, stock: 50 },
    { id: 'CFRST38', name: 'ICE APPLE 500 ml', category: 'Cane Blend', price: 120, barcode: 'CFRST38', taxPercentage: 12, stock: 50 },
    { id: 'CFRST39', name: 'JACKFRUIT 500 ml', category: 'Cane Blend', price: 100, barcode: 'CFRST39', taxPercentage: 12, stock: 50 },
    { id: 'CFRST40', name: 'JALJEERA 500 ml', category: 'Cane Blend', price: 70, barcode: 'CFRST40', taxPercentage: 12, stock: 50 },
    { id: 'CFRST41', name: 'JAMUN 500 ml', category: 'Cane Blend', price: 120, barcode: 'CFRST41', taxPercentage: 12, stock: 50 },
    { id: 'CFRST42', name: 'JUSTCANE (PLAIN) 500 ml', category: 'Cane Blend', price: 60, barcode: 'CFRST42', taxPercentage: 12, stock: 50 },
    { id: 'CFRST43', name: 'LEMON 500 ml', category: 'Cane Blend', price: 60, barcode: 'CFRST43', taxPercentage: 12, stock: 50 },
    { id: 'CFRST44', name: 'LEMON & GINGER 500 ml', category: 'Cane Blend', price: 70, barcode: 'CFRST44', taxPercentage: 12, stock: 50 },
    { id: 'CFRST45', name: 'MINT 500 ml', category: 'Cane Blend', price: 70, barcode: 'CFRST45', taxPercentage: 12, stock: 50 },
    { id: 'CFRST46', name: 'MINT & LEMON 500 ml', category: 'Cane Blend', price: 80, barcode: 'CFRST46', taxPercentage: 12, stock: 50 },
    { id: 'CFRST47', name: 'MINT, LEMON & GINGER 500 ml', category: 'Cane Blend', price: 80, barcode: 'CFRST47', taxPercentage: 12, stock: 50 },
    { id: 'CFRST48', name: 'MOSAMBI 500 ml', category: 'Cane Blend', price: 100, barcode: 'CFRST48', taxPercentage: 12, stock: 50 },
    { id: 'CFRST49', name: 'MUSKMELON 500 ml', category: 'Cane Blend', price: 100, barcode: 'CFRST49', taxPercentage: 12, stock: 50 },
    { id: 'CFRST50', name: 'ORANGE 500 ml', category: 'Cane Blend', price: 100, barcode: 'CFRST50', taxPercentage: 12, stock: 50 },
    { id: 'CFRST51', name: 'PINEAPPLE 500 ml', category: 'Cane Blend', price: 100, barcode: 'CFRST51', taxPercentage: 12, stock: 50 },
    { id: 'CFRST52', name: 'POMEGRANATE 500 ml', category: 'Cane Blend', price: 120, barcode: 'CFRST52', taxPercentage: 12, stock: 50 },
    { id: 'CFRST53', name: 'STRAWBERRY 500 ml', category: 'Cane Blend', price: 140, barcode: 'CFRST53', taxPercentage: 12, stock: 50 },
    { id: 'CFRST54', name: 'TENDER COCONUT 500ml', category: 'Cane Blend', price: 120, barcode: 'CFRST54', taxPercentage: 12, stock: 50 },
    { id: 'CFRST55', name: 'WATERMELON 500 ml', category: 'Cane Blend', price: 80, barcode: 'CFRST55', taxPercentage: 12, stock: 50 },
      
      // Cane Fusion
      { id: 'CFRST56', name: 'BLUEBERRY CANE FUSION', category: 'Cane Fusion', price: 200, barcode: 'CFRST56', taxPercentage: 12, stock: 50 },
      { id: 'CFRST57', name: 'DRAGON FRUIT CANE FUSION', category: 'Cane Fusion', price: 160, barcode: 'CFRST57', taxPercentage: 12, stock: 50 },
      { id: 'CFRST58', name: 'FIG CANE FUSION', category: 'Cane Fusion', price: 160, barcode: 'CFRST58', taxPercentage: 12, stock: 50 },
      { id: 'CFRST59', name: 'GRAPES CANE FUSION', category: 'Cane Fusion', price: 160, barcode: 'CFRST59', taxPercentage: 12, stock: 50 },
      { id: 'CFRST60', name: 'ICE APPLE CANE FUSION', category: 'Cane Fusion', price: 210, barcode: 'CFRST60', taxPercentage: 12, stock: 50 },
      { id: 'CFRST61', name: 'JAMUN CANE FUSION', category: 'Cane Fusion', price: 160, barcode: 'CFRST61', taxPercentage: 12, stock: 50 },
      { id: 'CFRST62', name: 'MOSAMBI CANE FUSION', category: 'Cane Fusion', price: 150, barcode: 'CFRST62', taxPercentage: 12, stock: 50 },
      { id: 'CFRST63', name: 'ORANGE CANE FUSION', category: 'Cane Fusion', price: 180, barcode: 'CFRST63', taxPercentage: 12, stock: 50 },
      { id: 'CFRST64', name: 'PINEAPPLE CANE FUSION', category: 'Cane Fusion', price: 160, barcode: 'CFRST64', taxPercentage: 12, stock: 50 },
      { id: 'CFRST65', name: 'POMEGRANATE CANE FUSION', category: 'Cane Fusion', price: 200, barcode: 'CFRST65', taxPercentage: 12, stock: 50 },
      { id: 'CFRST66', name: 'STRAWBERRY CANE FUSION', category: 'Cane Fusion', price: 200, barcode: 'CFRST66', taxPercentage: 12, stock: 50 },
      { id: 'CFRST67', name: 'WATERMELON CANE FUSION', category: 'Cane Fusion', price: 160, barcode: 'CFRST67', taxPercentage: 12, stock: 50 },
      
      // Canepops
      { id: 'CFRST68', name: 'ALMOND & CASHEW', category: 'Cane Pops', price: 30, barcode: 'CFRST68', taxPercentage: 12, stock: 50 },
      { id: 'CFRST69', name: 'AVOCADO', category: 'Cane Pops', price: 25, barcode: 'CFRST69', taxPercentage: 12, stock: 50 },
      { id: 'CFRST70', name: 'CHOCO CHIPS', category: 'Cane Pops', price: 15, barcode: 'CFRST70', taxPercentage: 12, stock: 50 },
      { id: 'CFRST71', name: 'COFFEE', category: 'Cane Pops', price: 20, barcode: 'CFRST71', taxPercentage: 12, stock: 50 },
      { id: 'CFRST72', name: 'DRAGON', category: 'Cane Pops', price: 20, barcode: 'CFRST72', taxPercentage: 12, stock: 50 },
      { id: 'CFRST73', name: 'FIG', category: 'Cane Pops', price: 20, barcode: 'CFRST73', taxPercentage: 12, stock: 50 },
      { id: 'CFRST74', name: 'GOOSEBERRY', category: 'Cane Pops', price: 20, barcode: 'CFRST74', taxPercentage: 12, stock: 50 },
      { id: 'CFRST75', name: 'GRAPES', category: 'Cane Pops', price: 20, barcode: 'CFRST75', taxPercentage: 12, stock: 50 },
      { id: 'CFRST76', name: 'GUAVA', category: 'Cane Pops', price: 20, barcode: 'CFRST76', taxPercentage: 12, stock: 50 },
      { id: 'CFRST77', name: 'JAMUN', category: 'Cane Pops', price: 20, barcode: 'CFRST77', taxPercentage: 12, stock: 50 },
      { id: 'CFRST78', name: 'JUSTCANE', category: 'Cane Pops', price: 10, barcode: 'CFRST78', taxPercentage: 12, stock: 50 },
      { id: 'CFRST79', name: 'LEMON & GINGER', category: 'Cane Pops', price: 15, barcode: 'CFRST79', taxPercentage: 12, stock: 50 },
      { id: 'CFRST80', name: 'MUSKMELON', category: 'Cane Pops', price: 20, barcode: 'CFRST80', taxPercentage: 12, stock: 50 },
      { id: 'CFRST81', name: 'ORANGE', category: 'Cane Pops', price: 20, barcode: 'CFRST81', taxPercentage: 12, stock: 50 },
      { id: 'CFRST82', name: 'PINEAPPLE', category: 'Cane Pops', price: 20, barcode: 'CFRST82', taxPercentage: 12, stock: 50 },
      { id: 'CFRST83', name: 'POMEGRANATE', category: 'Cane Pops', price: 20, barcode: 'CFRST83', taxPercentage: 12, stock: 50 },
      { id: 'CFRST84', name: 'STRAWBERRY', category: 'Cane Pops', price: 20, barcode: 'CFRST84', taxPercentage: 12, stock: 50 },
      { id: 'CFRST85', name: 'TENDER COCONUT', category: 'Cane Pops', price: 25, barcode: 'CFRST85', taxPercentage: 12, stock: 50 },
      { id: 'CFRST86', name: 'WATERMELON', category: 'Cane Pops', price: 20, barcode: 'CFRST86', taxPercentage: 12, stock: 50 },
      
      // Cane Special
      { id: 'CFRST87', name: 'WATERMELON BLAST', category: 'Cane Special', price: 350, barcode: 'CFRST87', taxPercentage: 12, stock: 50 },
      { id: 'CFRST88', name: 'MUSKMELON BLAST', category: 'Cane Special', price: 130, barcode: 'CFRST88', taxPercentage: 12, stock: 50 },
      
      // Others
      { id: 'CFRST89', name: 'TENDER COCONUT 50', category: 'Others', price: 50, barcode: 'CFRST89', taxPercentage: 12, stock: 50 },
      { id: 'CFRST90', name: 'TENDER COCONUT 90', category: 'Others', price: 90, barcode: 'CFRST90', taxPercentage: 12, stock: 50 },
      { id: 'CFRST91', name: 'WATER BOTTLE 1 LITRE', category: 'Others', price: 20, barcode: 'CFRST91', taxPercentage: 12, stock: 50 },
      { id: 'CFRST92', name: 'WATER BOTTLE 500ML', category: 'Others', price: 10, barcode: 'CFRST92', taxPercentage: 12, stock: 50 },
      { id: 'CFRST93', name: 'PEANUT BARFI', category: 'Others', price: 5, barcode: 'CFRST93', taxPercentage: 12, stock: 50 },
      { id: 'CFRST94', name: 'PACKAGING CHARGE', category: 'Others', price: 10, barcode: 'CFRST94', taxPercentage: 12, stock: 50 }
    ]
    setProducts(defaultProducts)
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

  // Add new product
  const addProduct = async (productData) => {
    try {
      await addDoc(collection(db, 'products'), productData)
      toast.success('Product added successfully')
    } catch (error) {
      console.error('Error adding product:', error)
      toast.error('Failed to add product')
    }
  }

  // Update product
  const updateProduct = async (productId, productData) => {
    try {
      await updateDoc(doc(db, 'products', productId), productData)
      toast.success('Product updated successfully')
    } catch (error) {
      console.error('Error updating product:', error)
      toast.error('Failed to update product')
    }
  }

  // Delete product
  const deleteProduct = async (productId) => {
    try {
      await deleteDoc(doc(db, 'products', productId))
      toast.success('Product deleted successfully')
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error('Failed to delete product')
    }
  }

  // Upload all inventory data from JSON file to Firebase
  const uploadAllInventoryToFirebase = async () => {
    try {
      setLoading(true)
      
      // Fetch the inventory JSON data
      const response = await fetch('/Canefrost_Inventory_Upload.json')
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
          name: item['Item Name'],
          category: item['Category'],
          price: item['MRP'],
          barcode: item['Barcode'],
          taxPercentage: item['Tax percentage'],
          stock: 50, // Default stock quantity
          createdAt: new Date(),
          updatedAt: new Date()
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

  // Clear all products and upload defaults to Firestore
  const resetToDefaultProducts = async () => {
    try {
      setLoading(true)
      
      // Get all products from Firebase
      const snapshot = await getDocs(collection(db, 'products'))
      
      // Delete all existing products
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref))
      await Promise.all(deletePromises)
      
      // Get default products data
      const defaultProducts = [
        // Cane Blend 240ml
        { id: 'CFRST01', name: 'AVOCADO 240ml', category: 'Cane Blend', price: 70, barcode: 'CFRST01', taxPercentage: 12, stock: 50 },
        { id: 'CFRST02', name: 'BLACK SALTED 240ml', category: 'Cane Blend', price: 35, barcode: 'CFRST02', taxPercentage: 12, stock: 50 },
        { id: 'CFRST03', name: 'BLUEBERRY 240ml', category: 'Cane Blend', price: 70, barcode: 'CFRST03', taxPercentage: 12, stock: 50 },
        { id: 'CFRST04', name: 'COFFEE 240ml', category: 'Cane Blend', price: 60, barcode: 'CFRST04', taxPercentage: 12, stock: 50 },
        { id: 'CFRST05', name: 'DRAGON FRUIT 240ml', category: 'Cane Blend', price: 50, barcode: 'CFRST05', taxPercentage: 12, stock: 50 },
        { id: 'CFRST06', name: 'FIG 240ml', category: 'Cane Blend', price: 50, barcode: 'CFRST06', taxPercentage: 12, stock: 50 },
        { id: 'CFRST07', name: 'GINGER 240ml', category: 'Cane Blend', price: 35, barcode: 'CFRST07', taxPercentage: 12, stock: 50 },
        { id: 'CFRST08', name: 'GOOSEBERRY 240ml', category: 'Cane Blend', price: 40, barcode: 'CFRST08', taxPercentage: 12, stock: 50 },
        { id: 'CFRST09', name: 'GRAPES 240ml', category: 'Cane Blend', price: 50, barcode: 'CFRST09', taxPercentage: 12, stock: 50 },
        { id: 'CFRST10', name: 'GUAVA 240ml', category: 'Cane Blend', price: 50, barcode: 'CFRST10', taxPercentage: 12, stock: 50 },
        { id: 'CFRST11', name: 'ICE APPLE 240ml', category: 'Cane Blend', price: 60, barcode: 'CFRST11', taxPercentage: 12, stock: 50 },
        { id: 'CFRST12', name: 'JACKFRUIT 240ml', category: 'Cane Blend', price: 50, barcode: 'CFRST12', taxPercentage: 12, stock: 50 },
        { id: 'CFRST13', name: 'JALJEERA 240ml', category: 'Cane Blend', price: 35, barcode: 'CFRST13', taxPercentage: 12, stock: 50 },
        { id: 'CFRST14', name: 'JAMUN 240ml', category: 'Cane Blend', price: 60, barcode: 'CFRST14', taxPercentage: 12, stock: 50 },
        { id: 'CFRST15', name: 'JUSTCANE (PLAIN) 240ml', category: 'Cane Blend', price: 30, barcode: 'CFRST15', taxPercentage: 12, stock: 50 },
        { id: 'CFRST16', name: 'LEMON 240ml', category: 'Cane Blend', price: 30, barcode: 'CFRST16', taxPercentage: 12, stock: 50 },
        { id: 'CFRST17', name: 'LEMON & GINGER 240ml', category: 'Cane Blend', price: 35, barcode: 'CFRST17', taxPercentage: 12, stock: 50 },
        { id: 'CFRST18', name: 'MINT 240ml', category: 'Cane Blend', price: 35, barcode: 'CFRST18', taxPercentage: 12, stock: 50 },
        { id: 'CFRST19', name: 'MINT & LEMON 240ml', category: 'Cane Blend', price: 40, barcode: 'CFRST19', taxPercentage: 12, stock: 50 },
        { id: 'CFRST20', name: 'MINT, LEMON & GINGER 240ml', category: 'Cane Blend', price: 40, barcode: 'CFRST20', taxPercentage: 12, stock: 50 },
        { id: 'CFRST21', name: 'MOSAMBI 240ml', category: 'Cane Blend', price: 50, barcode: 'CFRST21', taxPercentage: 12, stock: 50 },
        { id: 'CFRST22', name: 'MUSKMELON 240ml', category: 'Cane Blend', price: 50, barcode: 'CFRST22', taxPercentage: 12, stock: 50 },
        { id: 'CFRST23', name: 'ORANGE 240ml', category: 'Cane Blend', price: 50, barcode: 'CFRST23', taxPercentage: 12, stock: 50 },
        { id: 'CFRST24', name: 'PINEAPPLE 240ml', category: 'Cane Blend', price: 50, barcode: 'CFRST24', taxPercentage: 12, stock: 50 },
        { id: 'CFRST25', name: 'POMEGRANATE 240ml', category: 'Cane Blend', price: 60, barcode: 'CFRST25', taxPercentage: 12, stock: 50 },
        { id: 'CFRST26', name: 'STRAWBERRY 240ml', category: 'Cane Blend', price: 70, barcode: 'CFRST26', taxPercentage: 12, stock: 50 },
        { id: 'CFRST27', name: 'WATERMELON 240ml', category: 'Cane Blend', price: 40, barcode: 'CFRST27', taxPercentage: 12, stock: 50 }
      ]
      
      // Upload default products to Firestore
      const uploadPromises = defaultProducts.map(product => {
        const { id, ...productData } = product
        return addDoc(collection(db, 'products'), productData)
      })
      
      await Promise.all(uploadPromises)
      
      toast.success('Products reset to defaults and uploaded to Firestore successfully')
    } catch (error) {
      console.error('Error resetting products:', error)
      toast.error('Failed to reset products')
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
    resetToDefaultProducts,
    uploadAllInventoryToFirebase,
    getCartTotal,
    getCartTax,
    getCategoryGroup
  }

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  )
}

export { InventoryProvider }