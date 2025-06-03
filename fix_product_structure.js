import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Determines the main category based on product name
 * Categories: Cane Blend, Cane Fusion, Cane Pops, Special, Other
 */
function getMainCategory(productName) {
  if (!productName) return 'Other';
  
  const name = productName.toLowerCase();
  
  // Cane Pops - typically smaller bottles or specific products
  if (name.includes('cane pop') || name.includes('canepop') || 
      name.includes('200ml') || name.includes('250ml')) {
    return 'Cane Pops';
  }
  
  // Cane Fusion - premium blended products
  if (name.includes('fusion') || name.includes('premium') || 
      name.includes('special blend') || name.includes('signature')) {
    return 'Cane Fusion';
  }
  
  // Cane Blend - regular blended products
  if (name.includes('blend') || name.includes('mix') || 
      name.includes('combo') || name.includes('500ml')) {
    return 'Cane Blend';
  }
  
  // Special - seasonal, limited edition, or unique products
  if (name.includes('special') || name.includes('seasonal') || 
      name.includes('limited') || name.includes('festive') ||
      name.includes('organic') || name.includes('fresh')) {
    return 'Special';
  }
  
  // Default to Other
  return 'Other';
}

/**
 * Determines the product type based on product name
 * Types: Berries, Citrus, Tropical, Spiced/Herbal/Others
 */
function getProductType(productName) {
  if (!productName) return 'Spiced/Herbal/Others';
  
  const name = productName.toLowerCase();
  
  // Citrus fruits
  if (name.includes('lemon') || name.includes('orange') || 
      name.includes('mosambi') || name.includes('lime') ||
      name.includes('citrus') || name.includes('grapefruit')) {
    return 'Citrus';
  }
  
  // Berries
  if (name.includes('strawberry') || name.includes('blueberry') || 
      name.includes('gooseberry') || name.includes('grapes') || 
      name.includes('jamun') || name.includes('berry') ||
      name.includes('blackberry') || name.includes('raspberry')) {
    return 'Berries';
  }
  
  // Tropical fruits
  if (name.includes('pineapple') || name.includes('mango') || 
      name.includes('dragon fruit') || name.includes('guava') || 
      name.includes('jackfruit') || name.includes('avocado') || 
      name.includes('watermelon') || name.includes('muskmelon') ||
      name.includes('pomegranate') || name.includes('fig') || 
      name.includes('tender coconut') || name.includes('ice apple') ||
      name.includes('papaya') || name.includes('kiwi') ||
      name.includes('passion fruit') || name.includes('tropical')) {
    return 'Tropical';
  }
  
  // Default to Spiced/Herbal/Others
  return 'Spiced/Herbal/Others';
}

/**
 * Determines product size based on name
 */
function getProductSize(productName) {
  if (!productName) return null;
  
  const name = productName.toLowerCase();
  
  if (name.includes('200ml')) return '200ml';
  if (name.includes('250ml')) return '250ml';
  if (name.includes('300ml')) return '300ml';
  if (name.includes('500ml')) return '500ml';
  if (name.includes('750ml')) return '750ml';
  if (name.includes('1l') || name.includes('1 l') || name.includes('1000ml')) return '1L';
  
  return null;
}

async function updateDatabaseStructure() {
  console.log('Starting database structure update...');
  
  try {
    // Step 1: Add type column to products table if it doesn't exist
    console.log('\n1. Checking for type column in products table...');
    
    // First check if the type column exists
    const { data: columnCheck, error: checkError } = await supabase
      .from('products')
      .select('type')
      .limit(1);
    
    let typeColumnExists = true;
    
    if (checkError) {
      if (checkError.message.includes('column "type" does not exist')) {
        typeColumnExists = false;
        console.log('Type column does not exist, attempting to add it...');
        
        // Try to add the column using a direct SQL query
        const { error: alterError } = await supabase
          .from('products')
          .update({ type: 'Spiced/Herbal/Others' })
          .eq('id', 'non-existent-id'); // This will fail but might create the column
        
        console.log('Note: Attempted to add type column. If this fails, please add it manually.');
      } else {
        console.error('Error checking for type column:', checkError.message);
      }
    } else {
      console.log('✓ Type column already exists');
    }
    
    // Step 2: Verify existing categories
    console.log('\n2. Verifying categories...');
    
    // Get existing categories
    const { data: existingCategories, error: fetchCatError } = await supabase
      .from('categories')
      .select('*');
    
    if (fetchCatError) {
      console.error('Error fetching categories:', fetchCatError.message);
      return;
    }
    
    console.log(`Found ${existingCategories ? existingCategories.length : 0} existing categories`);
    
    // Define the required categories
    const requiredCategories = [
      'Cane Blend', 
      'Cane Fusion', 
      'Cane Pops', 
      'Special', 
      'Other'
    ];
    
    // Check which categories exist
    const existingCategoryNames = existingCategories ? existingCategories.map(cat => cat.name) : [];
    const missingCategories = requiredCategories.filter(cat => !existingCategoryNames.includes(cat));
    
    if (missingCategories.length > 0) {
      console.log(`Missing categories: ${missingCategories.join(', ')}`);
      console.log('Please add these categories manually through the application.');
    } else {
      console.log('✓ All required categories exist');
    }
    
    // Step 3: Fetch all products
    console.log('\n3. Fetching products...');
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('*');
    
    if (fetchError) {
      console.error('Error fetching products:', fetchError);
      return;
    }
    
    console.log(`Found ${products.length} products to update`);
    
    // Step 4: Process and update products
    console.log('\n4. Updating products...');
    let successCount = 0;
    let errorCount = 0;
    
    for (const product of products) {
      try {
        const newCategory = getMainCategory(product.name);
        const newType = getProductType(product.name);
        const newSize = getProductSize(product.name) || product.size;
        
        const { error: updateError } = await supabase
          .from('products')
          .update({
            category: newCategory,
            type: newType,
            size: newSize
          })
          .eq('id', product.id);
        
        if (updateError) {
          console.error(`Error updating product ${product.name}:`, updateError.message);
          errorCount++;
        } else {
          successCount++;
          console.log(`✓ Updated: ${product.name} -> Category: ${newCategory}, Type: ${newType}, Size: ${newSize}`);
        }
      } catch (error) {
        console.error(`Error processing product ${product.name}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n=== UPDATE SUMMARY ===');
    console.log(`✓ Successfully updated: ${successCount} products`);
    console.log(`✗ Errors: ${errorCount} products`);
    console.log(`Total processed: ${products.length} products`);
    
    if (successCount > 0) {
      console.log('\n✓ Product structure update completed successfully!');
    }
    
  } catch (error) {
    console.error('Fatal error during update:', error);
  }
}

// Run the update
updateDatabaseStructure()
  .then(() => {
    console.log('\nScript completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });