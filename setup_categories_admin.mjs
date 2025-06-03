import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// Use service role key to bypass RLS
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function setupCategories() {
  try {
    console.log('Setting up categories table...');
    
    // First, let's clear any existing data
    console.log('Clearing existing categories...');
    const { error: deleteError } = await supabase
      .from('categories')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (deleteError) {
      console.log('Delete error (may be expected):', deleteError.message);
    }
    
    // Insert new simplified categories
    console.log('Inserting new categories...');
    const categories = [
      { name: 'Cane Fusion' },
      { name: 'Cane Juice' },
      { name: 'Cane Pops' },
      { name: 'Others' },
      { name: 'Special' }
    ];
    
    const { data, error } = await supabase
      .from('categories')
      .insert(categories)
      .select();
    
    if (error) {
      console.error('Insert error:', error);
    } else {
      console.log('Categories inserted successfully:', data);
    }
    
    // Verify the results
    console.log('Verifying categories...');
    const { data: allCategories, error: selectError } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (selectError) {
      console.error('Select error:', selectError);
    } else {
      console.log('Final categories in table:');
      allCategories.forEach(cat => {
        console.log(`- ID: ${cat.id}, Name: ${cat.name}`);
      });
    }
    
  } catch (err) {
    console.error('Script error:', err);
  }
}

setupCategories();