/**
 * Fix Product Category Mapping Script
 * This script addresses the issue where products are not properly mapped to categories
 * by ensuring consistent category and type assignments.
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_KEY are set in your .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Helper function to determine category group based on product name
function getCategoryGroup(productName) {
  if (!productName) return 'spiced, herbal & others'
  
  const name = productName.toLowerCase()
  
  // Citrus fruits
  if (name.includes('lemon') || name.includes('orange') || name.includes('mosambi') || name.includes('lime')) {
    return 'citrus'
  }
  
  // Berries
  if (name.includes('strawberry') || name.includes('blueberry') || name.includes('gooseberry') || 
      name.includes('grapes') || name.includes('jamun')) {
    return 'berries'
  }
  
  // Tropical fruits
  if (name.includes('pineapple') || name.includes('mango') || name.includes('dragon fruit') || 
      name.includes('guava') || name.includes('jackfruit') || name.includes('avocado') || 
      name.includes('watermelon') || name.includes('muskmelon') || name.includes('pomegranate') || 
      name.includes('fig') || name.includes('tender coconut') || name.includes('ice apple')) {
    return 'tropical'
  }
  
  // Spiced, herbal & others (default)
  return 'spiced, herbal & others'
}

// Helper function to determine main category based on product name
function getMainCategory(productName) {
  if (!productName) return 'Spiced/Herbal/Others'
  
  const name = productName.toLowerCase()
  
  // Citrus fruits
  if (name.includes('lemon') || name.includes('orange') || name.includes('mosambi') || name.includes('lime')) {
    return 'Citrus'
  }
  
  // Berries
  if (name.includes('strawberry') || name.includes('blueberry') || name.includes('gooseberry') || 
      name.includes('grapes') || name.includes('jamun')) {
    return 'Berries'
  }
  
  // Tropical fruits
  if (name.includes('pineapple') || name.includes('mango') || name.includes('dragon fruit') || 
      name.includes('guava') || name.includes('jackfruit') || name.includes('avocado') || 
      name.includes('watermelon') || name.includes('muskmelon') || name.includes('pomegranate') || 
      name.includes('fig') || name.includes('tender coconut') || name.includes('ice apple')) {
    return 'Tropical'
  }
  
  // Default to Spiced/Herbal/Others
  return 'Spiced/Herbal/Others'
}

// Helper function to get product size
function getProductSize(productName) {
  if (!productName) return null
  
  const name = productName.toLowerCase()
  
  if (name.includes('240ml') || name.includes('240 ml')) {
    return '240ml'
  } else if (name.includes('500ml') || name.includes('500 ml')) {
    return '500ml'
  } else if (name.includes('1 litre') || name.includes('1litre') || name.includes('1000ml')) {
    return '1 Litre'
  }
  
  return null
}

async function fixProductCategories() {
  try {
    console.log('🔧 Starting product category mapping fix...')
    
    // 1. Fetch all products
    console.log('📦 Fetching all products...')
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('*')
    
    if (fetchError) {
      throw fetchError
    }
    
    console.log(`📊 Found ${products.length} products to process`)
    
    // 2. Process each product and fix category mappings
    const updatedProducts = products.map(product => {
      const originalCategory = product.category
      const originalSize = product.size
      
      // Determine correct category and size
      const newCategory = getMainCategory(product.name)
      const newSize = getProductSize(product.name)
      
      const updates = {
        ...product,
        category: newCategory,
        size: newSize,
        updated_at: new Date().toISOString()
      }
      
      // Log changes for debugging
      const hasChanges = originalCategory !== newCategory || 
                        originalSize !== newSize
      
      if (hasChanges) {
        console.log(`🔄 Updating ${product.name}:`)
        if (originalCategory !== newCategory) {
          console.log(`   Category: ${originalCategory || 'null'} → ${newCategory}`)
        }
        if (originalSize !== newSize) {
          console.log(`   Size: ${originalSize || 'null'} → ${newSize || 'null'}`)
        }
      }
      
      return updates
    })
    
    // 3. Update products in batches
    console.log('💾 Updating products in database...')
    const batchSize = 50
    let successCount = 0
    let errorCount = 0
    
    for (let i = 0; i < updatedProducts.length; i += batchSize) {
      const batch = updatedProducts.slice(i, i + batchSize)
      
      try {
        const { data, error } = await supabase
          .from('products')
          .upsert(batch, { onConflict: 'id' })
          .select()
        
        if (error) {
          console.error(`❌ Error updating batch ${Math.floor(i/batchSize) + 1}:`, error)
          errorCount += batch.length
        } else {
          successCount += data.length
          console.log(`✅ Batch ${Math.floor(i/batchSize) + 1}: ${data.length} products updated`)
        }
      } catch (error) {
        console.error(`❌ Error updating batch ${Math.floor(i/batchSize) + 1}:`, error)
        errorCount += batch.length
      }
    }
    
    // 4. Summary
    console.log('\n📊 Product category mapping fix summary:')
    console.log(`   ✅ Successfully updated: ${successCount} products`)
    console.log(`   ❌ Errors: ${errorCount} products`)
    
    if (errorCount === 0) {
      console.log('\n🎉 All products have been successfully updated with proper category mappings!')
    } else {
      console.log('\n⚠️  Some products could not be updated. Please check the errors above.')
    }
    
  } catch (error) {
    console.error('❌ Fatal error during category mapping fix:', error)
    process.exit(1)
  }
}

// Run the fix
fixProductCategories()
  .then(() => {
    console.log('\n✨ Product category mapping fix completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })