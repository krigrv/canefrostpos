/**
 * Ensure Categories Script
 * This script ensures that all required categories exist in the database
 * before attempting to update product categories.
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

// Define the categories we need to ensure exist
const requiredCategories = [
  { name: 'Berries', description: 'Fresh berry products' },
  { name: 'Citrus', description: 'Citrus fruit products' },
  { name: 'Tropical', description: 'Tropical fruit products' },
  { name: 'Spiced/Herbal/Others', description: 'Spiced, herbal and other specialty products' }
]

async function ensureCategories() {
  try {
    console.log('🔍 Checking for existing categories...')
    
    // Get existing categories
    const { data: existingCategories, error: fetchError } = await supabase
      .from('categories')
      .select('name')
    
    if (fetchError) {
      throw fetchError
    }
    
    console.log(`📊 Found ${existingCategories.length} existing categories`)
    
    // Create a set of existing category names for easy lookup
    const existingCategoryNames = new Set(existingCategories.map(cat => cat.name))
    
    // Filter out categories that already exist
    const categoriesToCreate = requiredCategories.filter(cat => !existingCategoryNames.has(cat.name))
    
    if (categoriesToCreate.length === 0) {
      console.log('✅ All required categories already exist!')
      return
    }
    
    console.log(`🔧 Creating ${categoriesToCreate.length} missing categories...`)
    
    // Insert missing categories
    const { data: createdCategories, error: insertError } = await supabase
      .from('categories')
      .insert(categoriesToCreate)
      .select()
    
    if (insertError) {
      throw insertError
    }
    
    console.log('✅ Successfully created missing categories:')
    categoriesToCreate.forEach(cat => {
      console.log(`   - ${cat.name}`)
    })
    
  } catch (error) {
    console.error('❌ Error ensuring categories exist:', error)
    process.exit(1)
  }
}

// Run the function
ensureCategories()
  .then(() => {
    console.log('\n✨ Category check completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })