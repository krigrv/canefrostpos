import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_KEY
);

console.log('Creating tables via PostgreSQL function...');

try {
  // First, create a PostgreSQL function that can execute DDL
  console.log('Creating PostgreSQL function for table creation...');
  
  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION create_missing_tables()
    RETURNS text
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
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
      
      -- Enable RLS on both tables
      ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
      
      -- Create RLS policies for user_profiles
      DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
      CREATE POLICY "Users can view own profile" ON public.user_profiles
          FOR SELECT USING (auth.uid() = user_id);
      
      DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
      CREATE POLICY "Users can insert own profile" ON public.user_profiles
          FOR INSERT WITH CHECK (auth.uid() = user_id);
      
      DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
      CREATE POLICY "Users can update own profile" ON public.user_profiles
          FOR UPDATE USING (auth.uid() = user_id);
      
      DROP POLICY IF EXISTS "Users can delete own profile" ON public.user_profiles;
      CREATE POLICY "Users can delete own profile" ON public.user_profiles
          FOR DELETE USING (auth.uid() = user_id);
      
      -- Create RLS policies for user_settings
      DROP POLICY IF EXISTS "Users can view own settings" ON public.user_settings;
      CREATE POLICY "Users can view own settings" ON public.user_settings
          FOR SELECT USING (auth.uid() = user_id);
      
      DROP POLICY IF EXISTS "Users can insert own settings" ON public.user_settings;
      CREATE POLICY "Users can insert own settings" ON public.user_settings
          FOR INSERT WITH CHECK (auth.uid() = user_id);
      
      DROP POLICY IF EXISTS "Users can update own settings" ON public.user_settings;
      CREATE POLICY "Users can update own settings" ON public.user_settings
          FOR UPDATE USING (auth.uid() = user_id);
      
      DROP POLICY IF EXISTS "Users can delete own settings" ON public.user_settings;
      CREATE POLICY "Users can delete own settings" ON public.user_settings
          FOR DELETE USING (auth.uid() = user_id);
      
      RETURN 'Tables created successfully';
    END;
    $$;
  `;
  
  // Execute the function creation via raw SQL
  const { data: functionResult, error: functionError } = await supabase.rpc('exec', {
    sql: createFunctionSQL
  });
  
  if (functionError) {
    console.log('Function creation failed, trying alternative approach...');
    console.log('Error:', functionError);
    
    // Alternative: Try to call the function directly if it already exists
    console.log('\nTrying to call existing function...');
    const { data: callResult, error: callError } = await supabase.rpc('create_missing_tables');
    
    if (callError) {
      console.log('Function call failed:', callError);
      
      // Final fallback: Create default records for the user
      console.log('\nFallback: Creating default user records...');
      
      const userId = '03a63ae6-c36d-4685-879a-55146aa5f11d';
      
      // Try to insert into user_profiles (assuming table exists)
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          business_details: {
            business_name: 'Canefrost POS',
            address: '',
            phone: '',
            email: ''
          }
        }, {
          onConflict: 'user_id'
        })
        .select();
        
      if (profileError) {
        console.log('Profile upsert error:', profileError);
      } else {
        console.log('✓ User profile created/updated:', profileData);
      }
      
      // Try to insert into user_settings (assuming table exists)
      const { data: settingsData, error: settingsError } = await supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          settings: {
            theme: 'light',
            currency: 'USD',
            tax_rate: 0,
            receipt_footer: ''
          }
        }, {
          onConflict: 'user_id'
        })
        .select();
        
      if (settingsError) {
        console.log('Settings upsert error:', settingsError);
      } else {
        console.log('✓ User settings created/updated:', settingsData);
      }
      
    } else {
      console.log('✓ Function executed successfully:', callResult);
    }
    
  } else {
    console.log('✓ Function created successfully');
    
    // Now call the function
    console.log('\nCalling the function to create tables...');
    const { data: callResult, error: callError } = await supabase.rpc('create_missing_tables');
    
    if (callError) {
      console.log('Function call failed:', callError);
    } else {
      console.log('✓ Tables created successfully:', callResult);
    }
  }
  
} catch (error) {
  console.error('Script error:', error);
}

console.log('\nScript completed.');