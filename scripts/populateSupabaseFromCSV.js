import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.log('Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Function to parse CSV data
function parseCSV(csvContent) {
  const lines = csvContent.split('\n')
  const headers = lines[2].split(',') // Skip first 2 lines, use 3rd line as headers
  const products = []
  
  for (let i = 3; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    
    const values = []
    let current = ''
    let inQuotes = false
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    values.push(current.trim())
    
    if (values.length >= 12 && values[0]) { // Ensure we have enough data and item name exists
      const product = {
        name: values[0].trim(),
        category: values[1].trim(),
        size: values[2].trim() || null,
        type: values[3].trim() || null, // Add type column from CSV
        price: parseFloat(values[6]) || 0, // Use the Price column
        stock: parseInt(values[12]) || 0,
        visible: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      products.push(product)
    }
  }
  
  return products
}

// Function to get unique categories from products
function getUniqueCategories(products) {
  const categories = new Set()
  const types = new Set()
  
  products.forEach(product => {
    if (product.category) {
      categories.add(product.category)
    }
    if (product.type) {
      types.add(product.type)
    }
  })
  
  // Combine both categories and types since types also need to be in categories table
  const allCategories = new Set([...categories, ...types])
  
  return Array.from(allCategories).map(name => ({
    name,
    description: `Category for ${name} products`,
    created_at: new Date().toISOString()
  }))
}

// Function to clear existing data
async function clearExistingData() {
  console.log('🧹 Clearing existing products and categories...')
  
  try {
    // Delete products first (due to foreign key constraint)
    const { error: productsError } = await supabase
      .from('products')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
    
    if (productsError) {
      console.error('Error clearing products:', productsError)
    } else {
      console.log('✅ Products cleared')
    }
    
    // Delete categories
    const { error: categoriesError } = await supabase
      .from('categories')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
    
    if (categoriesError) {
      console.error('Error clearing categories:', categoriesError)
    } else {
      console.log('✅ Categories cleared')
    }
  } catch (error) {
    console.error('Error during cleanup:', error)
  }
}

// Function to insert categories
async function insertCategories(categories) {
  console.log(`📂 Inserting ${categories.length} categories...`)
  
  try {
    const { data, error } = await supabase
      .from('categories')
      .insert(categories)
      .select()
    
    if (error) {
      console.error('Error inserting categories:', error)
      return false
    }
    
    console.log(`✅ Successfully inserted ${data.length} categories`)
    return true
  } catch (error) {
    console.error('Error inserting categories:', error)
    return false
  }
}

// Function to insert products in batches
async function insertProducts(products) {
  console.log(`📦 Inserting ${products.length} products...`)
  
  const batchSize = 50
  let successCount = 0
  let errorCount = 0
  
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize)
    
    try {
      const { data, error } = await supabase
        .from('products')
        .insert(batch)
        .select()
      
      if (error) {
        console.error(`Error inserting batch ${Math.floor(i/batchSize) + 1}:`, error)
        errorCount += batch.length
      } else {
        successCount += data.length
        console.log(`✅ Batch ${Math.floor(i/batchSize) + 1}: ${data.length} products inserted`)
      }
    } catch (error) {
      console.error(`Error inserting batch ${Math.floor(i/batchSize) + 1}:`, error)
      errorCount += batch.length
    }
  }
  
  console.log(`📊 Products insertion summary:`)
  console.log(`   ✅ Success: ${successCount}`)
  console.log(`   ❌ Errors: ${errorCount}`)
  
  return successCount > 0
}

// Function to verify data
async function verifyData() {
  console.log('🔍 Verifying inserted data...')
  
  try {
    // Count categories
    const { count: categoryCount, error: catError } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true })
    
    if (catError) {
      console.error('Error counting categories:', catError)
    } else {
      console.log(`📂 Categories in database: ${categoryCount}`)
    }
    
    // Count products
    const { count: productCount, error: prodError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
    
    if (prodError) {
      console.error('Error counting products:', prodError)
    } else {
      console.log(`📦 Products in database: ${productCount}`)
    }
    
    // Sample products by category
    const { data: sampleProducts, error: sampleError } = await supabase
      .from('products')
      .select('name, category, price, stock')
      .limit(5)
    
    if (sampleError) {
      console.error('Error fetching sample products:', sampleError)
    } else {
      console.log('\n📋 Sample products:')
      sampleProducts.forEach(product => {
        console.log(`   ${product.name} (${product.category}) - ₹${product.price} - Stock: ${product.stock}`)
      })
    }
  } catch (error) {
    console.error('Error during verification:', error)
  }
}

// Main function
async function populateDatabase() {
  console.log('🚀 Starting Supabase database population from CSV...')
  
  try {
    // Read CSV file
    const csvPath = path.join(__dirname, '..', 'public', 'Canefrost Inventory Final.csv')
    console.log(`📄 Reading CSV file: ${csvPath}`)
    
    if (!fs.existsSync(csvPath)) {
      console.error('❌ CSV file not found:', csvPath)
      process.exit(1)
    }
    
    const csvContent = fs.readFileSync(csvPath, 'utf-8')
    
    // Parse CSV data
    console.log('📊 Parsing CSV data...')
    const products = parseCSV(csvContent)
    console.log(`Found ${products.length} products in CSV`)
    
    if (products.length === 0) {
      console.error('❌ No products found in CSV file')
      process.exit(1)
    }
    
    // Get unique categories
    const categories = getUniqueCategories(products)
    console.log(`Found ${categories.length} unique categories`)
    
    // Clear existing data
    await clearExistingData()
    
    // Insert categories first
    const categoriesSuccess = await insertCategories(categories)
    if (!categoriesSuccess) {
      console.error('❌ Failed to insert categories. Aborting.')
      process.exit(1)
    }
    
    // Insert products
    const productsSuccess = await insertProducts(products)
    if (!productsSuccess) {
      console.error('❌ Failed to insert products')
      process.exit(1)
    }
    
    // Verify data
    await verifyData()
    
    console.log('\n🎉 Database population completed successfully!')
    console.log('\n📋 Next steps:')
    console.log('   1. Test the application with the new Supabase data')
    console.log('   2. Update any contexts that reference Firebase')
    console.log('   3. Test all CRUD operations')
    console.log('   4. Deploy the updated application')
    
  } catch (error) {
    console.error('❌ Error during database population:', error)
    process.exit(1)
  }
}

// Run the script
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  populateDatabase()
}

// Also run if this is the main module
if (import.meta.url.endsWith(process.argv[1]?.replace(/\\/g, '/'))) {
  populateDatabase()
}

export { populateDatabase, parseCSV, getUniqueCategories }