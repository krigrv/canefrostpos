import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixColumnNames() {
  try {
    console.log('🔧 Renaming columns to camelCase...')
    
    const queries = [
      'ALTER TABLE sales RENAME COLUMN cashamount TO "cashAmount";',
      'ALTER TABLE sales RENAME COLUMN upiamount TO "upiAmount";', 
      'ALTER TABLE sales RENAME COLUMN changeamount TO "changeAmount";'
    ]
    
    for (const query of queries) {
      console.log(`Executing: ${query}`)
      const { error } = await supabase.rpc('exec_sql', { sql: query })
      
      if (error) {
        if (error.message.includes('does not exist')) {
          console.log(`⚠️ Column already renamed or doesn't exist: ${query}`)
        } else {
          console.error(`❌ Error executing ${query}:`, error)
        }
      } else {
        console.log(`✅ Successfully executed: ${query}`)
      }
    }
    
    console.log('🎉 Column renaming completed')
    
    // Test the renamed columns
    console.log('🧪 Testing renamed columns...')
    const columnsToTest = ['cashAmount', 'upiAmount', 'changeAmount']
    
    for (const column of columnsToTest) {
      const { error } = await supabase
        .from('sales')
        .select(column)
        .limit(1)
      
      if (error) {
        console.error(`❌ ${column} column test failed:`, error)
      } else {
        console.log(`✅ ${column} column is accessible`)
      }
    }
    
    return true
    
  } catch (error) {
    console.error('❌ Column renaming failed:', error)
    return false
  }
}

fixColumnNames().then(success => {
  process.exit(success ? 0 : 1)
})