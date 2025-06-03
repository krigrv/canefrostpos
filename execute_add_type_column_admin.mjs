import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

config();

// Use service role key for admin operations
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function executeSQL() {
  try {
    console.log('Checking if type column exists in products table...');
    
    // Check if type column exists
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'products')
      .eq('column_name', 'type');
    
    if (columnError) {
      console.log('Error checking columns:', columnError);
      console.log('Please manually add the type column using Supabase SQL Editor:');
      console.log('ALTER TABLE products ADD COLUMN type TEXT;');
    } else if (!columns || columns.length === 0) {
      console.log('Type column does not exist. Please add it manually in Supabase SQL Editor:');
      console.log('ALTER TABLE products ADD COLUMN type TEXT;');
    } else {
      console.log('Type column already exists');
    }
    
    // Check current categories
    console.log('\nChecking existing categories...');
    const { data: existingCategories, error: catError } = await supabase
      .from('categories')
      .select('*');
    
    if (catError) {
      console.log('Error fetching categories:', catError);
    } else {
      console.log('Existing categories:', existingCategories.map(c => c.name));
    }
    
    // Try to add missing categories with service role
    console.log('\nEnsuring required categories exist...');
    const requiredCategories = [
      { name: 'Cane Blend', description: 'Regular blended cane products' },
      { name: 'Cane Fusion', description: 'Premium fusion cane products' },
      { name: 'Cane Pops', description: 'Small bottle cane products' },
      { name: 'Special', description: 'Special and seasonal products' },
      { name: 'Other', description: 'Other miscellaneous products' }
    ];
    
    for (const category of requiredCategories) {
      // Check if category exists
      const existing = existingCategories?.find(c => c.name === category.name);
      if (!existing) {
        const { data, error } = await supabase
          .from('categories')
          .insert(category);
        
        if (error) {
          console.log(`Error adding category ${category.name}:`, error.message);
          console.log(`Please manually add category in Supabase: INSERT INTO categories (name, description) VALUES ('${category.name}', '${category.description}');`);
        } else {
          console.log(`✓ Added category: ${category.name}`);
        }
      } else {
        console.log(`✓ Category already exists: ${category.name}`);
      }
    }
    
    console.log('\nScript execution completed');
    
  } catch (error) {
    console.error('Error executing script:', error);
  }
}

executeSQL();