import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   VITE_SUPABASE_URL:', !!supabaseUrl)
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
})

async function refreshSchema() {
  try {
    console.log('🔄 Refreshing Supabase schema cache...')
    
    // Test connection and force schema refresh
    const { data: salesColumns, error: salesError } = await supabase
      .from('sales')
      .select('*')
      .limit(0)
    
    if (salesError) {
      console.error('❌ Error accessing sales table:', salesError)
      return false
    }
    
    // Check if cashAmount column exists by trying to select it specifically
    const { data: cashAmountTest, error: cashAmountError } = await supabase
      .from('sales')
      .select('cashAmount')
      .limit(1)
    
    if (cashAmountError) {
      console.error('❌ cashAmount column not accessible:', cashAmountError)
      
      // Try to add the column again
      console.log('🔧 Attempting to add cashAmount column...')
      const { error: alterError } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE sales ADD COLUMN IF NOT EXISTS cashAmount DECIMAL(10,2) DEFAULT 0.00;'
      })
      
      if (alterError) {
        console.error('❌ Failed to add cashAmount column:', alterError)
      } else {
        console.log('✅ cashAmount column added successfully')
      }
    } else {
      console.log('✅ cashAmount column is accessible')
    }
    
    // Test other columns
    const columnsToTest = ['transactionId', 'upiAmount', 'changeAmount', 'updated_at']
    for (const column of columnsToTest) {
      const { error } = await supabase
        .from('sales')
        .select(column)
        .limit(1)
      
      if (error) {
        console.error(`❌ ${column} column not accessible:`, error)
      } else {
        console.log(`✅ ${column} column is accessible`)
      }
    }
    
    console.log('🔄 Schema refresh completed')
    return true
    
  } catch (error) {
    console.error('❌ Schema refresh failed:', error)
    return false
  }
}

refreshSchema().then(success => {
  process.exit(success ? 0 : 1)
})