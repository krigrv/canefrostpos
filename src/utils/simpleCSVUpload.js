import Papa from 'papaparse'
import { supabaseOperations } from './supabaseOperations'
import toast from 'react-hot-toast'

/**
 * Helper function to determine category group based on product name
 */
const getCategoryGroup = (productName) => {
  if (!productName) return 'spiced, herbal & others'
  
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

/**
 * Simple CSV upload utility that directly parses CSV and adds products to database
 * Expected CSV format: Item Name, Category, Price, Stock, Size, Type, Tax Percentage
 */
export const uploadCSVProducts = async (file, addProduct) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      toast.error('Please select a CSV file')
      reject(new Error('No file selected'))
      return
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please select a valid CSV file')
      reject(new Error('Invalid file type'))
      return
    }

    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data
          
          if (rows.length < 2) {
            toast.error('CSV file must contain at least a header row and one data row')
            reject(new Error('Insufficient data'))
            return
          }

          // Find header row (look for "Item Name" column)
          let headerRowIndex = -1
          let headerRow = null
          
          for (let i = 0; i < Math.min(5, rows.length); i++) {
            const row = rows[i]
            if (row.some(cell => cell && cell.toString().trim().toLowerCase().includes('item name'))) {
              headerRowIndex = i
              headerRow = row
              break
            }
          }

          if (headerRowIndex === -1) {
            toast.error('Could not find header row with "Item Name" column')
            reject(new Error('Header row not found'))
            return
          }

          // Map column indices
          const getColumnIndex = (searchTerms) => {
            for (const term of searchTerms) {
              const index = headerRow.findIndex(cell => 
                cell && cell.toString().trim().toLowerCase().includes(term.toLowerCase())
              )
              if (index !== -1) return index
            }
            return -1
          }

          const columnIndices = {
            name: getColumnIndex(['item name', 'name', 'product name']),
            category: getColumnIndex(['category', 'cat']),
            price: getColumnIndex(['price', 'cost', 'amount']),
            stock: getColumnIndex(['stock', 'quantity', 'qty']),
            size: getColumnIndex(['size', 'variant']),
            type: getColumnIndex(['type', 'kind']),
            taxPercentage: getColumnIndex(['tax', 'gst', 'tax percentage', 'gst percentage'])
          }

          if (columnIndices.name === -1) {
            toast.error('Required column "Item Name" not found')
            reject(new Error('Required column missing'))
            return
          }

          // Process data rows
          const dataRows = rows.slice(headerRowIndex + 1)
          let successCount = 0
          let errorCount = 0

          toast.loading(`Processing ${dataRows.length} products...`)

          for (const row of dataRows) {
            try {
              const name = row[columnIndices.name]?.toString().trim()
              
              if (!name) {
                errorCount++
                continue
              }

              const productData = {
                name,
                category: row[columnIndices.category]?.toString().trim() || 'Uncategorized',
                price: parseFloat(row[columnIndices.price]) || 0,
                stock: parseInt(row[columnIndices.stock]) || 0,
                size: row[columnIndices.size]?.toString().trim() || '',
                type: row[columnIndices.type]?.toString().trim() || getCategoryGroup(name),
                tax_percentage: parseFloat(row[columnIndices.taxPercentage]) || 12,
                is_visible: true,
                barcode: '',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }

              await supabaseOperations.products.create(productData)
              successCount++
            } catch (error) {
              console.error('Error adding product:', error)
              errorCount++
            }
          }

          toast.dismiss()
          
          if (successCount > 0) {
            toast.success(`Successfully imported ${successCount} products!`)
          }
          
          if (errorCount > 0) {
            toast.error(`Failed to import ${errorCount} products`)
          }

          resolve({ successCount, errorCount })
        } catch (error) {
          toast.dismiss()
          toast.error('Error processing CSV file')
          reject(error)
        }
      },
      error: (error) => {
        toast.error('Error reading CSV file')
        reject(error)
      }
    })
  })
}