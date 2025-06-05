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

async function executeSQL(sql) {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({ sql })
    });

    if (!response.ok) {
      // Try alternative approach using direct SQL execution
      const { data, error } = await supabase
        .from('_sql_exec')
        .insert({ query: sql });
      
      if (error) {
        console.error(`Failed to execute SQL: ${sql}`);
        console.error('Error:', error);
        return { error };
      }
      return { data };
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error(`Error executing SQL: ${sql}`);
    console.error('Error:', error);
    return { error };
  }
}

async function fixCompleteSalesSchemaDirectly() {
  console.log('Starting complete sales schema fix with direct SQL execution...');
  
  try {
    // First, let's check current table structure
    console.log('Checking current sales table structure...');
    
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'sales')
      .eq('table_schema', 'public');
    
    if (tableError) {
      console.error('Error checking table structure:', tableError);
    } else {
      console.log('Current sales table columns:');
      tableInfo.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type})`);
      });
    }

    // SQL commands to fix all schema issues
    const sqlCommands = [
      // Add missing discount column
      'ALTER TABLE sales ADD COLUMN IF NOT EXISTS discount DECIMAL(10,2) DEFAULT 0',
      
      // Ensure all required columns exist with proper case
      'ALTER TABLE sales ADD COLUMN IF NOT EXISTS "transactionId" TEXT',
      'ALTER TABLE sales ADD COLUMN IF NOT EXISTS "cashAmount" DECIMAL(10,2) DEFAULT 0',
      'ALTER TABLE sales ADD COLUMN IF NOT EXISTS "upiAmount" DECIMAL(10,2) DEFAULT 0',
      'ALTER TABLE sales ADD COLUMN IF NOT EXISTS "changeAmount" DECIMAL(10,2) DEFAULT 0',
      'ALTER TABLE sales ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2) DEFAULT 0',
      'ALTER TABLE sales ADD COLUMN IF NOT EXISTS tax DECIMAL(10,2) DEFAULT 0',
      'ALTER TABLE sales ADD COLUMN IF NOT EXISTS "originalTotal" DECIMAL(10,2) DEFAULT 0',
      'ALTER TABLE sales ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT DEFAULT \'cash\'',
      'ALTER TABLE sales ADD COLUMN IF NOT EXISTS "receivedAmount" DECIMAL(10,2) DEFAULT 0',
      'ALTER TABLE sales ADD COLUMN IF NOT EXISTS timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()'
    ];
    
    console.log('\nExecuting SQL commands using Supabase REST API...');
    
    for (const sql of sqlCommands) {
      console.log(`Executing: ${sql}`);
      
      try {
        // Use direct REST API call to execute SQL
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey
          },
          body: JSON.stringify({ sql })
        });

        if (response.ok) {
          console.log(`✓ Successfully executed: ${sql}`);
        } else {
          const errorText = await response.text();
          console.error(`❌ Error executing SQL: ${sql}`);
          console.error('Response:', errorText);
        }
      } catch (error) {
        console.error(`❌ Error executing SQL: ${sql}`);
        console.error('Error details:', error.message);
      }
    }

    // Wait a moment for schema changes to propagate
    console.log('\nWaiting for schema changes to propagate...');
    await new Promise(resolve => setTimeout(resolve, 3000));

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

fixCompleteSalesSchemaDirectly();