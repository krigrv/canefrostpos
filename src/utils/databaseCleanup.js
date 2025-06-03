import { db } from '../firebase/config'
import { collection, getDocs, writeBatch, doc, deleteDoc } from 'firebase/firestore'
import Papa from 'papaparse'

/**
 * Clean databases based on selective options
 * @param {Object} options - Object specifying which data to clean
 * @param {boolean} options.products - Clean products data
 * @param {boolean} options.sales - Clean sales data
 * @param {boolean} options.customers - Clean customers data
 * @param {boolean} options.staff - Clean staff data
 * @param {boolean} options.categories - Clean categories data
 * @param {boolean} options.localStorage - Clean local storage
 * @param {boolean} options.firebaseData - Clean Firebase data
 */
export const cleanAllDatabases = async (options = null) => {
  console.log('🧹 Starting database cleanup...', options ? 'Selective' : 'Complete')
  
  try {
    // If no options provided, clean everything (backward compatibility)
    if (!options) {
      await cleanFirebaseCollections()
      cleanLocalStorage()
      console.log('✅ All databases cleaned successfully')
      return
    }
    
    // Selective cleanup based on options
    if (options.firebaseData) {
      const collectionsToClean = []
      if (options.products) collectionsToClean.push('products')
      if (options.sales) collectionsToClean.push('sales')
      if (options.customers) collectionsToClean.push('customers')
      if (options.staff) collectionsToClean.push('staff')
      if (options.categories) collectionsToClean.push('categories')
      
      if (collectionsToClean.length > 0) {
        await cleanFirebaseCollections(collectionsToClean)
      }
    }
    
    if (options.localStorage) {
      const keysToClean = []
      if (options.products) keysToClean.push('products')
      if (options.sales) keysToClean.push('sales')
      if (options.customers) keysToClean.push('customers')
      if (options.staff) keysToClean.push('staff')
      if (options.categories) keysToClean.push('categories')
      
      if (keysToClean.length > 0) {
        cleanLocalStorage(keysToClean)
      }
    }
    
    console.log('✅ Selective database cleanup completed successfully')
  } catch (error) {
    console.error('❌ Error during database cleanup:', error)
    throw error
  }
}

/**
 * Clean Firebase collections
 * @param {Array} collections - Array of collection names to clean. If not provided, cleans all collections.
 */
const cleanFirebaseCollections = async (collections = null) => {
  const collectionsToClean = collections || ['products', 'sales', 'customers', 'staff', 'categories']
  
  for (const collectionName of collectionsToClean) {
    await cleanFirebaseCollection(collectionName)
  }
}

/**
 * Clean local storage
 * @param {Array} keys - Array of specific keys to clean. If not provided, clears all localStorage.
 */
const cleanLocalStorage = (keys = null) => {
  console.log('🧹 Cleaning local storage...', keys ? `Keys: ${keys.join(', ')}` : 'All data')
  
  if (!keys) {
    localStorage.clear()
  } else {
    // Clean specific keys
    keys.forEach(key => {
      localStorage.removeItem(key)
      // Also remove related keys that might exist
      localStorage.removeItem(`${key}_backup`)
      localStorage.removeItem(`${key}_cache`)
      localStorage.removeItem(`${key}_sync`)
    })
  }
  
  console.log('✅ Local storage cleaned')
}

/**
 * Clean a specific Firebase collection
 */
const cleanFirebaseCollection = async (collectionName) => {
  console.log(`🗑️ Cleaning ${collectionName} collection...`)
  
  const collectionRef = collection(db, collectionName)
  const snapshot = await getDocs(collectionRef)
  
  if (snapshot.empty) {
    console.log(`📭 ${collectionName} collection is already empty`)
    return
  }
  
  const batch = writeBatch(db)
  let deleteCount = 0
  
  snapshot.docs.forEach((docSnapshot) => {
    batch.delete(docSnapshot.ref)
    deleteCount++
  })
  
  await batch.commit()
  console.log(`✅ Deleted ${deleteCount} documents from ${collectionName}`)
}

/**
 * Parse CSV data and convert to product format
 */
const parseCSVToProducts = (csvText) => {
  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const rows = results.data
          
          // Find the header row (should contain 'Item Name')
          let headerRowIndex = -1
          let headers = []
          
          for (let i = 0; i < rows.length; i++) {
            const row = rows[i]
            if (row && row.includes('Item Name')) {
              headers = row
              headerRowIndex = i
              break
            }
          }
          
          if (headerRowIndex === -1) {
            reject(new Error('Could not find header row with Item Name column'))
            return
          }
          
          // Get data rows (skip header and title rows)
          const dataRows = rows.slice(headerRowIndex + 1)
          
          const products = dataRows.map((row, index) => {
            // Create object from row data using headers
            const rowData = {}
            headers.forEach((header, i) => {
              rowData[header] = row[i] || ''
            })
            
            // Clean up the item name (remove extra spaces)
            const name = rowData['Item Name']?.trim() || ''
            const category = rowData['Category']?.trim() || 'Uncategorized'
            const size = rowData['Size']?.trim() || ''
            const type = rowData['Type']?.trim() || ''
            const mrp = parseFloat(rowData['MRP']) || 0
            const barcode = rowData['Barcode']?.trim() || ''
            const stockCount = parseInt(rowData['Stock Count']) || 30
            const gstPercent = rowData['GST%']?.replace('%', '') || '12'
            const taxPercentage = parseFloat(gstPercent) || 12
            
            // Generate unique ID based on barcode or index
            const id = barcode || `PRODUCT_${String(index + 1).padStart(3, '0')}`
            
            return {
              id,
              name,
              category,
              size,
              type,
              price: mrp,
              cost: parseFloat(rowData['Cost']) || 0,
              barcode,
              stock: stockCount,
              taxPercentage,
              taxType: rowData['Tax type']?.trim() || 'y',
              taxInclusive: rowData['Inclusive/Exclusive']?.trim() === 'Inclusive',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          }).filter(product => product.name) // Filter out empty rows
          
          // Remove duplicates based on name and size combination
          const uniqueProducts = []
          const seen = new Set()
          
          products.forEach(product => {
            const key = `${product.name.toLowerCase()}_${product.size}`
            if (!seen.has(key)) {
              seen.add(key)
              uniqueProducts.push(product)
            } else {
              console.warn(`⚠️ Skipping duplicate product: ${product.name} (${product.size})`)
            }
          })
          
          console.log(`📊 Parsed ${uniqueProducts.length} unique products from CSV`)
          resolve(uniqueProducts)
        } catch (error) {
          reject(error)
        }
      },
      error: (error) => {
        reject(error)
      }
    })
  })
}

/**
 * Import products to Firebase
 */
const importProductsToFirebase = async (products) => {
  console.log(`🔄 Importing ${products.length} products to Firebase...`)
  
  const batch = writeBatch(db)
  const productsCollection = collection(db, 'products')
  
  products.forEach((product) => {
    const docRef = doc(productsCollection, product.id)
    batch.set(docRef, product)
  })
  
  await batch.commit()
  console.log(`✅ Successfully imported ${products.length} products to Firebase`)
}

/**
 * Import products to local JSON file
 */
const importProductsToJSON = async (products) => {
  console.log(`🔄 Importing ${products.length} products to local JSON...`)
  
  try {
    const response = await fetch('/api/sync-firebase-to-json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ products })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    console.log(`✅ Successfully imported ${products.length} products to local JSON`)
  } catch (error) {
    console.error('❌ Error importing to JSON:', error)
    throw error
  }
}

/**
 * Complete database reset and CSV import process
 */
export const resetDatabaseWithCSV = async (csvFilePath = '/Users/krishnagaurav/Documents/GitHub/canefrostpos/public/Canefrost Inventory Final.csv') => {
  console.log('🚀 Starting complete database reset and CSV import...')
  
  try {
    // Step 1: Clean all databases
    await cleanAllDatabases()
    
    // Step 2: Read CSV file
    console.log('📖 Reading CSV file...')
    const response = await fetch(csvFilePath)
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV file: ${response.status}`)
    }
    const csvText = await response.text()
    
    // Step 3: Parse CSV to products
    const products = await parseCSVToProducts(csvText)
    
    // Step 4: Import to Firebase
    await importProductsToFirebase(products)
    
    // Step 5: Import to local JSON
    await importProductsToJSON(products)
    
    console.log('🎉 Database reset and CSV import completed successfully!')
    return {
      success: true,
      message: `Successfully imported ${products.length} products`,
      productCount: products.length
    }
  } catch (error) {
    console.error('❌ Error during database reset and CSV import:', error)
    throw error
  }
}

/**
 * Validate CSV structure before import
 */
export const validateCSVStructure = async (csvFilePath = '/Users/krishnagaurav/Documents/GitHub/canefrostpos/public/Canefrost Inventory Final.csv') => {
  try {
    const response = await fetch(csvFilePath)
    const csvText = await response.text()
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: false, // Parse without header to handle the title row
        preview: 10, // Parse first 10 rows to find headers
        complete: (results) => {
          const rows = results.data
          
          // Find the header row (should be the second row after title)
          let headerRowIndex = -1
          let headers = []
          
          for (let i = 0; i < rows.length; i++) {
            const row = rows[i]
            if (row && Array.isArray(row) && row.length > 0) {
              // Check if this row contains 'Item Name' as the first column or any column
              const firstCell = row[0] ? row[0].toString().trim() : ''
              if (firstCell === 'Item Name' || row.some(cell => cell && cell.toString().trim() === 'Item Name')) {
                headers = row.map(cell => cell ? cell.toString().trim() : '')
                headerRowIndex = i
                break
              }
            }
          }
          
          if (headerRowIndex === -1) {
            reject(new Error('Could not find header row with Item Name column'))
            return
          }
          
          const requiredColumns = ['Item Name', 'Category', 'MRP', 'Barcode']
          const missingColumns = requiredColumns.filter(col => !headers.includes(col))
          
          if (missingColumns.length > 0) {
            reject(new Error(`Missing required columns: ${missingColumns.join(', ')}`))
          } else {
            resolve({
              valid: true,
              headers,
              headerRowIndex,
              sampleData: rows.slice(headerRowIndex + 1, headerRowIndex + 4) // Sample data rows
            })
          }
        },
        error: (error) => {
          reject(new Error(`CSV parsing error: ${error.message}`))
        }
      })
    })
  } catch (error) {
    throw new Error(`Failed to fetch CSV file: ${error.message}`)
  }
}