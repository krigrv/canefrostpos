import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://zqmdjuqyljehirflbkge.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixCompleteSalesSchema() {
  console.log('Starting complete sales schema fix...');
  
  try {
    // SQL commands to fix all schema issues
    const sqlCommands = [
      // Add missing discount column
      'ALTER TABLE sales ADD COLUMN IF NOT EXISTS discount DECIMAL(10,2) DEFAULT 0;',
      
      // Ensure all required columns exist with proper case
      'ALTER TABLE sales ADD COLUMN IF NOT EXISTS "transactionId" TEXT;',
      'ALTER TABLE sales ADD COLUMN IF NOT EXISTS "cashAmount" DECIMAL(10,2) DEFAULT 0;',
      'ALTER TABLE sales ADD COLUMN IF NOT EXISTS "upiAmount" DECIMAL(10,2) DEFAULT 0;',
      'ALTER TABLE sales ADD COLUMN IF NOT EXISTS "changeAmount" DECIMAL(10,2) DEFAULT 0;',
      'ALTER TABLE sales ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2) DEFAULT 0;',
      'ALTER TABLE sales ADD COLUMN IF NOT EXISTS tax DECIMAL(10,2) DEFAULT 0;',
      'ALTER TABLE sales ADD COLUMN IF NOT EXISTS "originalTotal" DECIMAL(10,2) DEFAULT 0;',
      'ALTER TABLE sales ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT DEFAULT \'cash\';',
      'ALTER TABLE sales ADD COLUMN IF NOT EXISTS "receivedAmount" DECIMAL(10,2) DEFAULT 0;',
      'ALTER TABLE sales ADD COLUMN IF NOT EXISTS timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW();',
      
      // Drop old lowercase columns if they exist
      'ALTER TABLE sales DROP COLUMN IF EXISTS cashamount;',
      'ALTER TABLE sales DROP COLUMN IF EXISTS upiamount;',
      'ALTER TABLE sales DROP COLUMN IF EXISTS changeamount;',
      'ALTER TABLE sales DROP COLUMN IF EXISTS transactionid;',
      
      // Create index for better performance
      'CREATE INDEX IF NOT EXISTS idx_sales_transaction_id ON sales("transactionId");',
      'CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);',
      'CREATE INDEX IF NOT EXISTS idx_sales_payment_method ON sales("paymentMethod");'
    ];
    
    console.log('Executing SQL commands...');
    
    for (const sql of sqlCommands) {
      console.log(`Executing: ${sql}`);
      
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: sql
      });
      
      if (error) {
        console.error(`Error executing SQL: ${sql}`);
        console.error('Error details:', error);
      } else {
        console.log(`✓ Successfully executed: ${sql}`);
      }
    }
    
    // Test column accessibility
    console.log('\nTesting column accessibility...');
    
    const testColumns = [
      'discount', 'transactionId', 'cashAmount', 'upiAmount', 
      'changeAmount', 'subtotal', 'tax', 'originalTotal', 
      'paymentMethod', 'receivedAmount', 'timestamp'
    ];
    
    for (const column of testColumns) {
      try {
        const { data, error } = await supabase
          .from('sales')
          .select(column)
          .limit(1);
          
        if (error) {
          console.error(`❌ Column '${column}' not accessible:`, error.message);
        } else {
          console.log(`✓ Column '${column}' is accessible`);
        }
      } catch (err) {
        console.error(`❌ Error testing column '${column}':`, err.message);
      }
    }
    
    // Test creating a sample sale record
    console.log('\nTesting sale record creation...');
    
    const testSale = {
      items: [{id: 'test', name: 'Test Item', price: 10, quantity: 1}],
      total: 10.00,
      subtotal: 9.09,
      tax: 0.91,
      discount: 0.00,
      originalTotal: 10.00,
      transactionId: 'TEST_' + Date.now(),
      paymentMethod: 'CASH',
      cashAmount: 10.00,
      upiAmount: 0.00,
      changeAmount: 0.00,
      receivedAmount: 10.00,
      timestamp: new Date().toISOString()
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('sales')
      .insert([testSale])
      .select();
      
    if (insertError) {
      console.error('❌ Test sale creation failed:', insertError);
    } else {
      console.log('✓ Test sale created successfully:', insertData[0]?.id);
      
      // Clean up test record
      if (insertData[0]?.id) {
        await supabase
          .from('sales')
          .delete()
          .eq('id', insertData[0].id);
        console.log('✓ Test record cleaned up');
      }
    }
    
    console.log('\n✅ Complete sales schema fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during schema fix:', error);
    process.exit(1);
  }
}

fixCompleteSalesSchema();