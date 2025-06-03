import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase/config'

/**
 * Sync Firebase data back to formatted_inventory.json
 * This ensures the JSON file stays updated when changes are made through the app
 */
export const syncFirebaseToJSON = async () => {
  try {
    console.log('🔄 Syncing Firebase data back to formatted_inventory.json...')
    
    // Get all products from Firebase
    const snapshot = await getDocs(collection(db, 'products'))
    const products = snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        name: data.name,
        category: data.category,
        price: data.price,
        barcode: data.barcode || data.id,
        taxPercentage: data.taxPercentage || 12,
        stock: data.stock || 50,
        ...(data.size && { size: data.size })
      }
    })
    
    // Sort products by barcode for consistency
    products.sort((a, b) => {
      const barcodeA = a.barcode || ''
      const barcodeB = b.barcode || ''
      return barcodeA.localeCompare(barcodeB)
    })
    
    console.log(`📊 Synced ${products.length} products from Firebase`)
    
    // Send data to sync server to write to JSON file
    try {
      const response = await fetch('http://localhost:3001/api/sync-to-json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ products })
      })
      
      if (!response.ok) {
        throw new Error(`Sync server responded with ${response.status}`)
      }
      
      const result = await response.json()
      console.log('✅ Successfully synced to JSON file:', result.message)
    } catch (syncError) {
      console.warn('⚠️ Could not sync to JSON file (sync server may be offline):', syncError.message)
      console.log('📝 JSON data that should be synced:', JSON.stringify(products, null, 2))
    }
    
    return products
  } catch (error) {
    console.error('❌ Error syncing Firebase to JSON:', error)
    throw error
  }
}

/**
 * Check if formatted_inventory.json needs to be updated
 * Compares current Firebase data with JSON file
 */
export const checkSyncStatus = async () => {
  try {
    // Fetch current JSON data
    const response = await fetch('/formatted_inventory.json')
    if (!response.ok) {
      console.warn('Could not fetch formatted_inventory.json for sync check')
      return { needsSync: false, reason: 'JSON file not accessible' }
    }
    
    const jsonData = await response.json()
    
    // Get Firebase data
    const snapshot = await getDocs(collection(db, 'products'))
    const firebaseData = snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        name: data.name,
        category: data.category,
        price: data.price,
        barcode: data.barcode || data.id,
        taxPercentage: data.taxPercentage || 12,
        stock: data.stock || 50,
        ...(data.size && { size: data.size })
      }
    })
    
    // Compare counts
    if (jsonData.length !== firebaseData.length) {
      return {
        needsSync: true,
        reason: `Product count mismatch: JSON has ${jsonData.length}, Firebase has ${firebaseData.length}`
      }
    }
    
    // Create maps for comparison
    const jsonMap = new Map(jsonData.map(item => [item.name + '_' + (item.size || 'no-size'), item]))
    const firebaseMap = new Map(firebaseData.map(item => [item.name + '_' + (item.size || 'no-size'), item]))
    
    // Check for differences
    for (const [key, jsonItem] of jsonMap) {
      const firebaseItem = firebaseMap.get(key)
      if (!firebaseItem) {
        return {
          needsSync: true,
          reason: `Product "${jsonItem.name}" exists in JSON but not in Firebase`
        }
      }
      
      // Check for data differences (excluding timestamps)
      if (
        jsonItem.price !== firebaseItem.price ||
        jsonItem.category !== firebaseItem.category ||
        jsonItem.taxPercentage !== firebaseItem.taxPercentage
      ) {
        return {
          needsSync: true,
          reason: `Product "${jsonItem.name}" has different data between JSON and Firebase`
        }
      }
    }
    
    // Check for Firebase items not in JSON
    for (const [key, firebaseItem] of firebaseMap) {
      if (!jsonMap.has(key)) {
        return {
          needsSync: true,
          reason: `Product "${firebaseItem.name}" exists in Firebase but not in JSON`
        }
      }
    }
    
    return { needsSync: false, reason: 'Data is in sync' }
  } catch (error) {
    console.error('❌ Error checking sync status:', error)
    return { needsSync: false, reason: 'Error during sync check' }
  }
}