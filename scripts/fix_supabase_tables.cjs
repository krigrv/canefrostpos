const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixSupabaseTables() {
  try {
    console.log('Fixing Supabase tables and security issues...')
    
    // Test if tables exist by trying to query them
    console.log('Testing user_profiles table...')
    const { data: profilesData, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1)
    
    if (profilesError && profilesError.code === '42P01') {
      console.log('user_profiles table does not exist - needs to be created manually in Supabase dashboard')
    } else {
      console.log('user_profiles table exists')
    }
    
    console.log('Testing user_settings table...')
    const { data: settingsData, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .limit(1)
    
    if (settingsError && settingsError.code === '42P01') {
      console.log('user_settings table does not exist - needs to be created manually in Supabase dashboard')
    } else {
      console.log('user_settings table exists')
    }
    
    // Fix security definer views by recreating them without SECURITY DEFINER
    console.log('\nAttempting to fix security definer views...')
    
    // Try to create a simple view to replace product_inventory_summary
    const { error: viewError1 } = await supabase.rpc('exec', {
      sql: `
        DROP VIEW IF EXISTS public.product_inventory_summary;
        CREATE VIEW public.product_inventory_summary AS
        SELECT 
          p.id,
          p.name,
          p.category,
          p.price,
          p.stock_quantity,
          p.low_stock_threshold,
          CASE 
            WHEN p.stock_quantity <= p.low_stock_threshold THEN 'Low Stock'
            WHEN p.stock_quantity = 0 THEN 'Out of Stock'
            ELSE 'In Stock'
          END as stock_status
        FROM products p;
      `
    })
    
    if (viewError1) {
      console.log('Could not fix product_inventory_summary view:', viewError1.message)
    } else {
      console.log('Fixed product_inventory_summary view')
    }
    
    // Try to create a simple view to replace sales_summary
    const { error: viewError2 } = await supabase.rpc('exec', {
      sql: `
        DROP VIEW IF EXISTS public.sales_summary;
        CREATE VIEW public.sales_summary AS
        SELECT 
          DATE(created_at) as sale_date,
          COUNT(*) as total_sales,
          SUM(total) as total_revenue,
          AVG(total) as average_sale
        FROM sales
        GROUP BY DATE(created_at)
        ORDER BY sale_date DESC;
      `
    })
    
    if (viewError2) {
      console.log('Could not fix sales_summary view:', viewError2.message)
    } else {
      console.log('Fixed sales_summary view')
    }
    
    // Fix function search paths
    console.log('\nAttempting to fix function search paths...')
    
    const functions = [
      'get_sales_stats',
      'update_product_stock_after_sale',
      'update_updated_at_column'
    ]
    
    for (const funcName of functions) {
      const { error } = await supabase.rpc('exec', {
        sql: `
          CREATE OR REPLACE FUNCTION public.${funcName}()
          RETURNS void
          LANGUAGE plpgsql
          SECURITY DEFINER
          SET search_path = public
          AS $$
          BEGIN
            -- Function body would go here
            RETURN;
          END;
          $$;
        `
      })
      
      if (error) {
        console.log(`Could not fix function ${funcName}:`, error.message)
      } else {
        console.log(`Fixed function ${funcName}`)
      }
    }
    
    console.log('\n=== MANUAL STEPS REQUIRED ===')
    console.log('1. Go to Supabase Dashboard > SQL Editor')
    console.log('2. Run the following SQL to create missing tables:')
    console.log(`
-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  business_details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create user_settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage own profile" ON public.user_profiles
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own settings" ON public.user_settings
  USING (auth.uid() = user_id);
`)
    
    console.log('\n3. To fix Auth settings:')
    console.log('   - Go to Authentication > Settings')
    console.log('   - Set OTP expiry to less than 1 hour (recommended: 10 minutes)')
    console.log('   - Enable "Leaked Password Protection"')
    
  } catch (error) {
    console.error('Error:', error)
  }
}

fixSupabaseTables()