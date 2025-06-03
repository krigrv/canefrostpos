import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function executeSQL() {
  try {
    console.log('Adding type column to products table...');
    
    // Add type column if it doesn't exist
    const { data: addColumnData, error: addColumnError } = await supabase
      .rpc('exec_sql', {
        query: `
          DO $$ 
          BEGIN 
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name = 'products' AND column_name = 'type') THEN
              ALTER TABLE products ADD COLUMN type TEXT;
            END IF;
          END $$;
        `
      });
    
    if (addColumnError) {
      console.log('Column addition result:', addColumnError);
      // Try direct approach
      const { data: directData, error: directError } = await supabase
        .from('products')
        .select('type')
        .limit(1);
      
      if (directError && directError.code === '42703') {
        console.log('Type column does not exist, attempting to add it via raw query...');
        // Column doesn't exist, we need to add it via SQL editor or dashboard
        console.log('Please run this SQL in your Supabase SQL Editor:');
        console.log('ALTER TABLE products ADD COLUMN type TEXT;');
      } else {
        console.log('Type column already exists or other error:', directError);
      }
    } else {
      console.log('Type column added successfully');
    }
    
    // Ensure categories exist
    console.log('Ensuring categories exist...');
    const categories = [
      { name: 'Cane Blend', description: 'Regular blended cane products' },
      { name: 'Cane Fusion', description: 'Premium fusion cane products' },
      { name: 'Cane Pops', description: 'Small bottle cane products' },
      { name: 'Special', description: 'Special and seasonal products' },
      { name: 'Other', description: 'Other miscellaneous products' }
    ];
    
    for (const category of categories) {
      const { data, error } = await supabase
        .from('categories')
        .upsert(category, { onConflict: 'name' });
      
      if (error) {
        console.log(`Error upserting category ${category.name}:`, error);
      } else {
        console.log(`Category ${category.name} ensured`);
      }
    }
    
    console.log('Script execution completed');
    
  } catch (error) {
    console.error('Error executing SQL:', error);
  }
}

executeSQL();