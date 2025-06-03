import { db } from '../firebase/config.js'
import { collection, query, where, getDocs, or } from 'firebase/firestore'

/**
 * Browser-compatible duplicate prevention function
 * Checks if a product with the same name or barcode already exists
 * @param {Object} productData - The product data to check
 * @param {string} productData.name - Product name
 * @param {string} productData.barcode - Product barcode (optional)
 * @returns {Promise<boolean>} - Returns true if duplicate found, false otherwise
 */
export async function preventDuplicateCreation(productData) {
  try {
    if (!productData || !productData.name) {
      console.warn('⚠️ Invalid product data provided to duplicate checker')
      return false
    }

    const { name, barcode } = productData
    const productsRef = collection(db, 'products')
    
    // Create query conditions
    const queryConditions = [where('name', '==', name.trim())]
    
    // Add barcode condition if provided and not empty
    if (barcode && barcode.trim()) {
      queryConditions.push(where('barcode', '==', barcode.trim()))
    }
    
    // Execute query with OR condition
    const duplicateQuery = query(productsRef, or(...queryConditions))
    const querySnapshot = await getDocs(duplicateQuery)
    
    if (!querySnapshot.empty) {
      const duplicates = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        duplicates.push({
          id: doc.id,
          name: data.name,
          barcode: data.barcode
        })
      })
      
      console.warn('🚫 Duplicate product found:', {
        searchedFor: { name, barcode },
        existingProducts: duplicates
      })
      
      return true // Duplicate found
    }
    
    console.log('✅ No duplicates found for product:', { name, barcode })
    return false // No duplicates
    
  } catch (error) {
    console.error('❌ Error checking for duplicates:', error)
    // In case of error, allow the product to be created to avoid blocking legitimate operations
    return false
  }
}

/**
 * Check for duplicates by name only
 * @param {string} productName - Product name to check
 * @returns {Promise<boolean>} - Returns true if duplicate found
 */
export async function checkDuplicateByName(productName) {
  if (!productName || !productName.trim()) {
    return false
  }
  
  try {
    const productsRef = collection(db, 'products')
    const nameQuery = query(productsRef, where('name', '==', productName.trim()))
    const querySnapshot = await getDocs(nameQuery)
    
    return !querySnapshot.empty
  } catch (error) {
    console.error('❌ Error checking duplicate by name:', error)
    return false
  }
}

/**
 * Check for duplicates by barcode only
 * @param {string} barcode - Barcode to check
 * @returns {Promise<boolean>} - Returns true if duplicate found
 */
export async function checkDuplicateByBarcode(barcode) {
  if (!barcode || !barcode.trim()) {
    return false
  }
  
  try {
    const productsRef = collection(db, 'products')
    const barcodeQuery = query(productsRef, where('barcode', '==', barcode.trim()))
    const querySnapshot = await getDocs(barcodeQuery)
    
    return !querySnapshot.empty
  } catch (error) {
    console.error('❌ Error checking duplicate by barcode:', error)
    return false
  }
}