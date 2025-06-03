import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('⚠️ Supabase environment variables not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Enable Supabase auth
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  realtime: {
    // Enable real-time subscriptions
    params: {
      eventsPerSecond: 10
    }
  }
})

// Helper function to get current user ID from Supabase Auth
export const getCurrentUserId = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user?.id || 'anonymous'
  } catch (error) {
    console.error('Error getting current user ID:', error)
    return 'anonymous'
  }
}

// Helper function for error handling
export const handleSupabaseError = (error, operation) => {
  console.error(`Supabase ${operation} error:`, error)
  throw new Error(`${operation} failed: ${error.message}`)
}

// Connection test function
export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('products').select('count', { count: 'exact', head: true })
    if (error) throw error
    console.log('Supabase connection successful')
    return true
  } catch (error) {
    console.error('Supabase connection failed:', error)
    return false
  }
}