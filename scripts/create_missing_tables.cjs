const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
require('dotenv').config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createMissingTables() {
  try {
    console.log('Creating missing tables...')
    
    // Create user_profiles table
    const { error: profilesError } = await supabase.rpc('sql', {
      query: `
        CREATE TABLE IF NOT EXISTS public.user_profiles (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          business_details JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id)
        );
      `
    })
    
    if (profilesError) {
      console.error('Error creating user_profiles table:', profilesError)
    } else {
      console.log('user_profiles table created successfully')
    }
    
    // Create user_settings table
    const { error: settingsError } = await supabase.rpc('sql', {
      query: `
        CREATE TABLE IF NOT EXISTS public.user_settings (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          settings JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id)
        );
      `
    })
    
    if (settingsError) {
      console.error('Error creating user_settings table:', settingsError)
    } else {
      console.log('user_settings table created successfully')
    }
    
    // Enable RLS
    const { error: rlsError1 } = await supabase.rpc('sql', {
      query: 'ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;'
    })
    
    const { error: rlsError2 } = await supabase.rpc('sql', {
      query: 'ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;'
    })
    
    if (rlsError1 || rlsError2) {
      console.error('Error enabling RLS:', rlsError1 || rlsError2)
    } else {
      console.log('RLS enabled successfully')
    }
    
    // Create RLS policies for user_profiles
    const profilePolicies = [
      `CREATE POLICY "Users can view own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = user_id);`,
      `CREATE POLICY "Users can insert own profile" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);`,
      `CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = user_id);`,
      `CREATE POLICY "Users can delete own profile" ON public.user_profiles FOR DELETE USING (auth.uid() = user_id);`
    ]
    
    for (const policy of profilePolicies) {
      const { error } = await supabase.rpc('sql', { query: policy })
      if (error && !error.message.includes('already exists')) {
        console.error('Error creating profile policy:', error)
      }
    }
    
    // Create RLS policies for user_settings
    const settingsPolicies = [
      `CREATE POLICY "Users can view own settings" ON public.user_settings FOR SELECT USING (auth.uid() = user_id);`,
      `CREATE POLICY "Users can insert own settings" ON public.user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);`,
      `CREATE POLICY "Users can update own settings" ON public.user_settings FOR UPDATE USING (auth.uid() = user_id);`,
      `CREATE POLICY "Users can delete own settings" ON public.user_settings FOR DELETE USING (auth.uid() = user_id);`
    ]
    
    for (const policy of settingsPolicies) {
      const { error } = await supabase.rpc('sql', { query: policy })
      if (error && !error.message.includes('already exists')) {
        console.error('Error creating settings policy:', error)
      }
    }
    
    console.log('All policies created successfully')
    
    // Create indexes
    const { error: indexError1 } = await supabase.rpc('sql', {
      query: 'CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);'
    })
    
    const { error: indexError2 } = await supabase.rpc('sql', {
      query: 'CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);'
    })
    
    if (indexError1 || indexError2) {
      console.error('Error creating indexes:', indexError1 || indexError2)
    } else {
      console.log('Indexes created successfully')
    }
    
    console.log('All missing tables and policies created successfully!')
    
  } catch (error) {
    console.error('Error:', error)
  }
}

createMissingTables()